#!/bin/bash
# Керування «своїми» пристроями прямо з Lampa (розділ «ID для сервера»).
# Lampa → jmerge пише список у /var/lib/jmerge/owners,
# systemd помічає зміну і переносить список в init.conf Lampac (той підхоплює сам, без перезапуску).
set -e
SNIP=/etc/caddy/polish.caddy

echo "1) Список своїх"
mkdir -p /var/lib/jmerge/kit
if [ ! -s /var/lib/jmerge/owners ] && [ -s /etc/jmerge-owners ]; then cp /etc/jmerge-owners /var/lib/jmerge/owners; fi
touch /var/lib/jmerge/owners
chown -R jackett:jackett /var/lib/jmerge
echo "   у списку: $(grep -c . /var/lib/jmerge/owners || true)"

echo "2) Синхронізація з Lampac"
CONF=""
for u in $(systemctl list-units --type=service --all --no-legend 2>/dev/null | awk '{print $1}' | grep -i lampac); do
  d=$(systemctl show -p WorkingDirectory --value "$u" 2>/dev/null)
  [ -n "$d" ] && [ -f "$d/init.conf" ] && { CONF="$d/init.conf"; break; }
done
[ -z "$CONF" ] && { echo "   не знайшов init.conf Lampac"; exit 1; }
cat > /usr/local/bin/owners-sync <<SYNC
#!/usr/bin/python3
import hashlib, json, os, pwd, re, shutil
CONF = "$CONF"
KIT = "/var/lib/jmerge/kit"
ids = [l.strip().lower() for l in open("/var/lib/jmerge/owners", encoding="utf-8") if l.strip()]
if not ids:
    raise SystemExit(0)
raw = open(CONF, encoding="utf-8-sig").read()
try:
    c = json.loads(raw)
except Exception:
    c = json.loads(re.sub(r'(?m)^\s*//.*$', '', raw))
before = json.dumps(c, sort_keys=True)

# свої пристрої (для польських роздач і впізнавання)
users = c.setdefault("accsdb", {}).setdefault("users", [])
me = next((u for u in users if (u.get("comment") or "") == "свої (Мій ID)"), None)
if me is None:
    me = {"group": 1, "expires": "2100-01-01T00:00:00", "comment": "свої (Мій ID)"}
    users.append(me)
me["id"], me["ids"], me["group"] = ids[0], ids[1:], 1

# кожен пристрій — свої налаштування (kit): Filmix вмикається лише там, де є свій вхід
kit = c.setdefault("kit", {})
kit.update({"enable": True, "uidIdentity": True, "path": KIT, "configCheckIntervalSeconds": 10, "cacheToSeconds": 10})
fx = c.setdefault("Filmix", {})
fx["enable"] = False
fx.pop("group", None); fx.pop("group_hide", None)
for k in ("FilmixTV", "FilmixPartner"):
    sec = c.get(k)
    if isinstance(sec, dict):
        sec.pop("group", None); sec.pop("group_hide", None)
        if not sec:
            c.pop(k)

if json.dumps(c, sort_keys=True) != before:
    shutil.copy(CONF, CONF + ".before-sync")
    tmp = CONF + ".tmp"
    json.dump(c, open(tmp, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    shutil.move(tmp, CONF)
    print("owners-sync: init.conf оновлено")

# свої пристрої: Filmix з серверним ключем (якщо власник не ввійшов у свій)
pro = bool(fx.get("pro", True))
m = hashlib.md5(ids[0].encode("utf-8")).hexdigest()
f = os.path.join(KIT, m[0], m)
os.makedirs(os.path.dirname(f), exist_ok=True)
try:
    data = json.load(open(f, encoding="utf-8"))
except Exception:
    data = {}
if not (data.get("Filmix") or {}).get("token"):
    data["Filmix"] = {"enable": True, "pro": pro, "server_pro": pro}
    json.dump(data, open(f, "w", encoding="utf-8"), ensure_ascii=False)
jk = pwd.getpwnam("jackett")
for root, dirs, files in os.walk(KIT):
    for n in dirs + files:
        os.chown(os.path.join(root, n), jk.pw_uid, jk.pw_gid)
os.chown(KIT, jk.pw_uid, jk.pw_gid)
shutil.copy("/var/lib/jmerge/owners", "/etc/jmerge-owners")
print("owners-sync: свої %d" % len(ids))
SYNC
chmod 755 /usr/local/bin/owners-sync
cat > /etc/systemd/system/owners-sync.service <<'UNIT'
[Unit]
Description=Lampa: свої пристрої → Lampac
[Service]
Type=oneshot
ExecStart=/usr/local/bin/owners-sync
UNIT
cat > /etc/systemd/system/owners-sync.path <<'UNIT'
[Unit]
Description=Стежити за списком своїх пристроїв
[Path]
PathChanged=/var/lib/jmerge/owners
[Install]
WantedBy=multi-user.target
UNIT
sed -i 's#^Environment=OWNERS=.*##' /etc/systemd/system/jmerge.service
sed -i 's#^\[Service\]#[Service]\nEnvironment=OWNERS=/var/lib/jmerge/owners#' /etc/systemd/system/jmerge.service
systemctl daemon-reload
systemctl enable --now owners-sync.path >/dev/null 2>&1
/usr/local/bin/owners-sync || true
echo "   ок ($CONF)"

echo "3) jmerge"
curl -fsSL -H 'Accept: application/vnd.github.raw' https://api.github.com/repos/crux1974/Lampa/contents/lampac/jmerge.py -o /opt/jmerge.py
systemctl restart jmerge
echo "   $(systemctl is-active jmerge)"

echo "4) Caddy"
if ! grep -q '/jm/\*' "$SNIP"; then
  cp "$SNIP" "$SNIP.bak"
  printf 'handle /jm/* {\n\treverse_proxy 127.0.0.1:9120\n}\n' >> "$SNIP"
fi
if caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1; then
  systemctl reload caddy && echo "   ок"
else
  echo "   помилка — повертаю"; [ -f "$SNIP.bak" ] && cp "$SNIP.bak" "$SNIP"; exit 1
fi
sleep 2
echo "5) Перевірка: Filmix-вхід → $(curl -s -o /dev/null -w '%{http_code}' 'https://92-5-178-165.sslip.io/jm/filmix/status?token=testdevice1') (має бути 200)"
echo "   чужий пристрій → $(curl -s -o /dev/null -w '%{http_code}' 'https://92-5-178-165.sslip.io/jm/owners?box_mac=nobody') (має бути 403)"
echo "Готово. У Lampa на своєму пристрої: Налаштування → ID для сервера → «Свої пристрої»."
