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
OWNERS = os.environ.get("OWNERS", "/etc/jmerge-owners")


def owners():
    """Хто бачить польські роздачі. Порожній список — бачать усі."""
    try:
        with open(OWNERS, encoding="utf-8") as f:
            return {l.strip().lower() for l in f if l.strip() and not l.startswith("#")}
    except Exception:
        return set()


def is_owner(params):
    own = owners()
    if not own:
        return True
    for k in ("account_email", "uid", "token"):
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

    def do_GET(self):
        qs = self.path.split("?", 1)[1] if "?" in self.path else ""
        params = urllib.parse.parse_qs(qs, keep_blank_values=True)
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
