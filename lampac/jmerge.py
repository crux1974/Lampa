#!/usr/bin/env python3
"""
Польські торренти для Lampa.

Стоїть між Lampa і Lampac на адресі /api/v2.0/indexers/<будь-що>/results:
  1) питає Lampac (його звичний пошук торрентів),
  2) паралельно питає Jackett з польськими трекерами,
  3) зливає обидва списки в одну відповідь.
Якщо Jackett не відповів — Lampa отримує звичайний результат Lampac.
Якщо Lampac не має пошуку торрентів — Lampa отримує польські результати.
"""
import json
import os
import re
import threading
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

LAMPAC = os.environ.get("LAMPAC", "http://127.0.0.1:9118").rstrip("/")
JACKETT = os.environ.get("JACKETT", "http://127.0.0.1:9117/jackett").rstrip("/")
CONF = os.environ.get("JACKETT_CONF", "/var/lib/jackett/ServerConfig.json")
PORT = int(os.environ.get("PORT", "9120"))
OWNERS = os.environ.get("OWNERS", "/var/lib/jmerge/owners")
OWNERS_OLD = "/etc/jmerge-owners"
ID_RE = re.compile(r"^[a-z0-9@._+-]{4,80}$")


def owners_list():
    for path in (OWNERS, OWNERS_OLD):
        try:
            with open(path, encoding="utf-8") as f:
                out = []
                for l in f:
                    l = l.strip().lower()
                    if l and not l.startswith("#") and l not in out:
                        out.append(l)
                return out
        except Exception:
            continue
    return []


def owners():
    """Хто бачить польські роздачі. Порожній список — бачать усі."""
    return set(owners_list())


def save_owners(ids):
    with open(OWNERS, "w", encoding="utf-8") as f:
        f.write("\n".join(ids) + "\n")


# ---------------- «Мій Filmix»: кожен пристрій входить у свій акаунт ----------------
import hashlib
import random
import string
import time

KIT = os.environ.get("KIT", "/var/lib/jmerge/kit")
FX_HOSTS = ["http://filmixapp.cyou", "http://filmixapp.vip", "http://fxapp.biz"]
FX_DEV = "user_dev_apk=2.2.13&user_dev_name=Xiaomi&user_dev_os=12&user_dev_vendor=Xiaomi"
_fx_pending = {}  # пристрій -> {code, user_code, dev_id, t}


def fx_get(path):
    for h in FX_HOSTS:
        st, _, body = fetch(h + path, {"Accept-Encoding": "identity", "User-Agent": "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36"}, 12)
        if st == 200 and body:
            try:
                return json.loads(body.decode("utf-8", "replace"))
            except Exception:
                continue
    return None


def kit_key(params):
    """Під яким ім'ям Lampac шукає налаштування цього пристрою (kit.uidIdentity)."""
    dev = ((params.get("token") or params.get("box_mac") or [""])[0]).strip().lower()
    if not dev:
        return "", ""
    own = owners_list()
    return dev, (own[0] if dev in own else dev)


def kit_file(key):
    m = hashlib.md5(key.encode("utf-8")).hexdigest()
    return os.path.join(KIT, m[0], m)


def kit_read(key):
    try:
        with open(kit_file(key), encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def kit_write(key, data):
    f = kit_file(key)
    os.makedirs(os.path.dirname(f), exist_ok=True)
    with open(f, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False)


def fx_api(path, params):
    dev, key = kit_key(params)
    if not dev or not ID_RE.match(dev):
        return 400, {"ok": False, "msg": "Немає ID пристрою — онови плагін «ID для сервера»"}
    kit = kit_read(key)
    fx = kit.get("Filmix") or {}

    if path.endswith("/status"):
        return 200, {"ok": True, "login": fx.get("login") or "", "pro": bool(fx.get("pro")), "on": bool(fx.get("token")),
                     "server": bool(fx.get("enable")) and not fx.get("token")}

    if path.endswith("/start"):
        dev_id = "".join(random.choice(string.ascii_lowercase + string.digits) for _ in range(16))
        r = fx_get("/api/v2/token_request?%s&user_dev_id=%s&user_dev_token=" % (FX_DEV, dev_id))
        if not r or not r.get("code") or not r.get("user_code"):
            return 502, {"ok": False, "msg": "Filmix не відповів, спробуй пізніше"}
        _fx_pending[dev] = {"code": r["code"], "user_code": r["user_code"], "dev_id": dev_id, "t": time.time()}
        return 200, {"ok": True, "user_code": r["user_code"], "url": "filmix.my/consoles"}

    if path.endswith("/check"):
        p = _fx_pending.get(dev)
        if not p or time.time() - p["t"] > 900:
            return 200, {"ok": False, "msg": "Код застарів — натисни «Увійти» ще раз"}
        r = fx_get("/api/v2/user_profile?%s&user_dev_id=%s&user_dev_token=%s" % (FX_DEV, p["dev_id"], p["code"]))
        u = (r or {}).get("user_data") or {}
        if not u.get("login"):
            return 200, {"ok": False, "wait": True, "msg": "Ще не підтверджено на сайті Filmix"}
        pro = bool(u.get("is_pro") or u.get("is_pro_plus"))
        kit["Filmix"] = {"enable": True, "token": p["code"], "pro": pro, "login": u.get("login")}
        kit_write(key, kit)
        _fx_pending.pop(dev, None)
        return 200, {"ok": True, "login": u.get("login"), "pro": pro}

    if path.endswith("/logout"):
        if dev in owners_list():
            # свій пристрій повертається до серверного Filmix
            kit["Filmix"] = {"enable": True, "pro": bool(fx.get("server_pro", True))}
        else:
            kit.pop("Filmix", None)
        kit_write(key, kit)
        return 200, {"ok": True}

    return 404, {"ok": False}


def is_owner(params):
    own = owners()
    if not own:
        return True
    for k in ("box_mac", "account_email", "uid", "token"):
        for v in params.get(k, []):
            if v.strip().lower() in own:
                return True
    return False

# польські трекери Jackett — з них беремо все
PL_TRACKERS = {
    "devil-torrents", "best-torrents", "helltorrents", "ex-torrenty", "electro-torrent",
    "polishtorrent", "polishtracker-api", "cinemamovies", "exitorrent-org", "redstartorrent",
}
# із загальних трекерів (The Pirate Bay тощо) — лише роздачі з польською озвучкою
PL_AUDIO = re.compile(r"(?<![a-z])(pl|pldub|polish|polski|lektor|dubbing)(?![a-z])", re.I)
PL_SUBS_ONLY = re.compile(r"napisy|pl[ ._-]?sub|sub[ ._-]?pl", re.I)
YEAR = re.compile(r"(?<!\d)(19[0-9]{2}|20[0-9]{2})(?!\d)")
BTIH = re.compile(r"btih:([a-z0-9]+)", re.I)
QUALITY = re.compile(r"(2160|1080|720|480)p", re.I)


def api_key():
    try:
        with open(CONF, encoding="utf-8-sig") as f:
            return json.load(f).get("APIKey") or ""
    except Exception:
        return ""


def fetch(url, headers, timeout):
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, dict(r.headers), r.read()
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers or {}), e.read() if hasattr(e, "read") else b""
    except Exception:
        return 0, {}, b""


def first(params, *names):
    for n in names:
        for k, v in params.items():
            if k.lower() == n.lower() and v and v[0].strip():
                return v[0].strip()
    return ""


def polish_results(params):
    query = first(params, "title_original") or first(params, "query")
    if not query:
        return []
    key = api_key()
    if not key:
        return []
    # два пошуки паралельно: звичайний і з «PL» (польські роздачі тонуть серед сотень інших)
    got = {}

    def search(name, q):
        url = "%s/api/v2.0/indexers/all/results?apikey=%s&Query=%s" % (
            JACKETT, urllib.parse.quote(key), urllib.parse.quote(q))
        status, _, body = fetch(url, {"Accept-Encoding": "identity"}, 15)
        if status == 200:
            try:
                got[name] = json.loads(body.decode("utf-8", "replace")).get("Results") or []
            except Exception:
                pass

    ts = [threading.Thread(target=search, args=("a", query)), threading.Thread(target=search, args=("b", query + " PL"))]
    for t in ts:
        t.start()
    for t in ts:
        t.join()
    items, seen = [], set()
    for it in (got.get("b") or []) + (got.get("a") or []):
        k = (it.get("MagnetUri") or it.get("Link") or it.get("Title") or "")[:200]
        if k in seen:
            continue
        seen.add(k)
        items.append(it)

    year = first(params, "year")
    serial = first(params, "is_serial") not in ("", "0", "1")
    out = []
    for it in items:
        title = it.get("Title") or ""
        tid = (it.get("TrackerId") or "").lower()
        if tid not in PL_TRACKERS:
            if not PL_AUDIO.search(title) or PL_SUBS_ONLY.search(title):
                continue
        if year and year.isdigit() and not serial:
            ys = [int(y) for y in YEAR.findall(title)]
            if ys and all(abs(y - int(year)) > 1 for y in ys):
                continue
        q = QUALITY.search(title)
        out.append({
            "Tracker": it.get("Tracker") or tid or "Jackett",
            "Details": it.get("Details") or it.get("Guid"),
            "Title": title,
            "Size": it.get("Size") or 0,
            "PublishDate": it.get("PublishDate"),
            "Category": it.get("Category") or [],
            "CategoryDesc": it.get("CategoryDesc"),
            "Seeders": it.get("Seeders") or 0,
            "Peers": it.get("Peers") or 0,
            "MagnetUri": it.get("MagnetUri"),
            "Link": it.get("Link"),
            "Info": {
                "name": title,
                "quality": int(q.group(1)) if q else 0,
                "voices": ["Polski"],
                "types": ["movie"] if not serial else ["serial"],
            },
        })
    return out


def btih(item):
    m = BTIH.search(item.get("MagnetUri") or "")
    return m.group(1).lower() if m else None


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, *a):
        pass

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def owners_api(self, params):
        """Керування списком «своїх» прямо з Lampa. Доступ — лише зі «своїх» пристроїв."""
        me = (params.get("box_mac") or [""])[0].strip().lower()
        ids = owners_list()
        if not me or me not in ids:
            return self.reply(403, b'{"error":"not admin"}', "application/json; charset=utf-8")
        add = (params.get("add") or [""])[0].strip().lower()
        rem = (params.get("del") or [""])[0].strip().lower()
        msg = ""
        if add:
            if not ID_RE.match(add):
                msg = "bad id"
            elif add not in ids:
                ids.append(add)
                save_owners(ids)
                msg = "added"
        if rem:
            if rem == me:
                msg = "cannot remove yourself"
            elif rem in ids:
                ids.remove(rem)
                save_owners(ids)
                msg = "removed"
        out = json.dumps({"me": me, "ids": ids, "msg": msg}, ensure_ascii=False).encode("utf-8")
        self.reply(200, out, "application/json; charset=utf-8")

    def do_GET(self):
        qs = self.path.split("?", 1)[1] if "?" in self.path else ""
        params = urllib.parse.parse_qs(qs, keep_blank_values=True)
        if self.path.startswith("/jm/owners"):
            return self.owners_api(params)
        if self.path.startswith("/fxproxy/"):
            return self.fxproxy()
        if self.path.startswith("/jm/filmix/"):
            code, data = fx_api(self.path.split("?", 1)[0], params)
            return self.reply(code, json.dumps(data, ensure_ascii=False).encode("utf-8"), "application/json; charset=utf-8")
        is_all = "/indexers/all/results" in self.path.lower() and is_owner(params)

        fwd = {"Accept-Encoding": "identity"}
        for h in ("Host", "User-Agent", "Cookie", "Authorization", "X-Forwarded-For", "X-Forwarded-Proto", "X-Real-IP"):
            if self.headers.get(h):
                fwd[h] = self.headers.get(h)

        res = {}
        threads = [threading.Thread(target=lambda: res.__setitem__("l", fetch(LAMPAC + urllib.parse.quote(self.path, safe="/?&=%:+,;@[]!$'()*~"), fwd, 25)))]
        if is_all:
            threads.append(threading.Thread(target=lambda: res.__setitem__("p", polish_results(params))))
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        status, headers, body = res.get("l", (0, {}, b""))
        data = None
        if status == 200:
            try:
                data = json.loads(body.decode("utf-8", "replace"))
            except Exception:
                data = None
            if not isinstance(data, dict):
                # Lampac відповів чимось не-JSON — віддаємо як є
                return self.reply(200, body, headers.get("Content-Type", "application/json"))
        if data is None:
            data = {"Results": []}

        polish = res.get("p") or []
        if polish:
            have = {btih(i) for i in data.get("Results") or [] if btih(i)}
            add = [p for p in polish if not btih(p) or btih(p) not in have]
            data["Results"] = (data.get("Results") or []) + add

        out = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.reply(200, out, "application/json; charset=utf-8")

    FXP_OK = re.compile(r"^https?://([a-z0-9-]+\.)*(filmix[a-z0-9-]*|fxapp[a-z0-9-]*)\.[a-z]{2,10}(:\d+)?(/|$)", re.I)

    def fxproxy(self):
        """CORS-проксі лише для Filmix (для плагіна fx.js)."""
        target = self.path[len("/fxproxy/"):]
        target = re.sub(r"^(https?):/+", r"\1://", target)
        if not self.FXP_OK.match(target):
            return self.reply(403, b"forbidden", "text/plain")
        # якщо дзеркало Filmix недоступне з сервера — пробуємо інші
        tries = [target]
        m = re.match(r"^(https?://)(filmixapp\.[a-z]+|fxapp\.[a-z]+)(/.*)?$", target, re.I)
        if m:
            for h in ("filmixapp.cyou", "filmixapp.vip", "fxapp.biz"):
                u = m.group(1) + h + (m.group(3) or "")
                if u not in tries:
                    tries.append(u)
        for t in tries:
            req = urllib.request.Request(t, headers={"User-Agent": "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36", "Accept-Encoding": "identity"})
            try:
                with urllib.request.urlopen(req, timeout=12) as r:
                    return self.reply(r.status, r.read(), r.headers.get("Content-Type", "application/octet-stream"))
            except urllib.error.HTTPError as e:
                return self.reply(e.code, e.read(), e.headers.get("Content-Type", "text/plain"))
            except Exception:
                continue
        self.reply(502, b"filmix unreachable", "text/plain")

    def reply(self, code, body, ctype):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
