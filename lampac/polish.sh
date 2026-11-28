#!/bin/bash
# Польські торренти в Lampa: Jackett + злиття з пошуком Lampac.
# Запуск на сервері: curl -fsSL https://raw.githubusercontent.com/crux1974/Lampa/main/lampac/polish.sh | sudo bash
set -e
HOST=92-5-178-165.sslip.io
CF=/etc/caddy/Caddyfile
SNIP=/etc/caddy/polish.caddy
DATA=/var/lib/jackett
RAW=https://raw.githubusercontent.com/crux1974/Lampa/main/lampac

echo "1) Jackett"
id jackett >/dev/null 2>&1 || useradd -r -m -d "$DATA" -s /usr/sbin/nologin jackett
mkdir -p "$DATA" && chown jackett:jackett "$DATA"
if ! ldconfig -p | grep -q libicuuc; then
  echo "   ставлю libicu (потрібна Jackett)"
  DEBIAN_FRONTEND=noninteractive apt-get update -qq >/dev/null && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq libicu-dev >/dev/null
fi
if [ ! -x /opt/Jackett/jackett ]; then
  case "$(uname -m)" in
    aarch64|arm64) PKG=Jackett.Binaries.LinuxARM64.tar.gz ;;
    *)             PKG=Jackett.Binaries.LinuxAMDx64.tar.gz ;;
  esac
  curl -fsSL "https://github.com/Jackett/Jackett/releases/latest/download/$PKG" -o /tmp/jackett.tgz
  rm -rf /opt/Jackett && tar -xzf /tmp/jackett.tgz -C /opt && rm -f /tmp/jackett.tgz
  chown -R jackett:jackett /opt/Jackett
fi
cat > /etc/systemd/system/jackett.service <<UNIT
[Unit]
Description=Jackett
After=network-online.target
[Service]
User=jackett
WorkingDirectory=/opt/Jackett
ExecStart=/opt/Jackett/jackett --NoRestart --NoUpdates -d $DATA
Restart=always
RestartSec=5
[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable jackett >/dev/null 2>&1

# перший запуск створює ServerConfig.json
if [ ! -f "$DATA/ServerConfig.json" ]; then
  systemctl start jackett
  for i in $(seq 1 60); do [ -f "$DATA/ServerConfig.json" ] && break; sleep 1; done
  sleep 3
fi
systemctl stop jackett
python3 - "$DATA/ServerConfig.json" "$HOST" <<'PY'
import json, sys
p, host = sys.argv[1], sys.argv[2]
c = json.load(open(p, encoding="utf-8-sig"))
c["LocalBindAddress"] = "127.0.0.1"
c["AllowExternal"] = False
c["BasePathOverride"] = "/jackett"
c["BaseUrlOverride"] = "https://" + host
c["UpdateDisabled"] = True
json.dump(c, open(p, "w"), indent=2)
PY
chown jackett:jackett "$DATA/ServerConfig.json"
systemctl start jackett
JK=http://127.0.0.1:9117/jackett
ready=""
for i in $(seq 1 150); do
  c=$(curl -s -o /dev/null -w '%{http_code}' "$JK/UI/Login" || true)
  [ "$c" != "000" ] && [ -n "$c" ] && { ready=1; break; }
  sleep 2
done
if [ -z "$ready" ]; then
  echo "   Jackett не запустився. Ось що він пише:"
  systemctl status jackett --no-pager -l 2>&1 | tail -8
  journalctl -u jackett --no-pager -n 25 2>&1 | tail -25
  exit 1
fi
echo "   ок"

echo "2) Загальні трекери (з них беруться лише роздачі з польською озвучкою)"
if [ ! -f /root/jackett-admin.txt ]; then
  for ix in thepiratebay limetorrents; do
    cfg=$(curl -s "$JK/api/v2.0/indexers/$ix/config" || true)
    code=$(curl -s -o /dev/null -w '%{http_code}' -H 'Content-Type: application/json' -d "$cfg" "$JK/api/v2.0/indexers/$ix/config" || true)
    echo "   $ix → $code"
  done
  PASS=$(openssl rand -base64 15 | tr -d '/+=' | cut -c1-16)
  curl -s -o /dev/null -H 'Content-Type: application/json' -d "\"$PASS\"" "$JK/api/v2.0/server/adminpassword" || true
  printf 'Jackett: https://%s/jackett\nПароль адміністратора: %s\n' "$HOST" "$PASS" > /root/jackett-admin.txt
  chmod 600 /root/jackett-admin.txt
  echo "   пароль до Jackett збережено в /root/jackett-admin.txt"
else
  echo "   вже налаштовано раніше"
fi

echo "3) Злиття результатів (Lampac + польські)"
curl -fsSL "$RAW/jmerge.py?v=$(date +%s)" -o /opt/jmerge.py
LP=$(grep -oE 'reverse_proxy[[:space:]]+(https?://)?(127\.0\.0\.1|localhost):[0-9]+' "$CF" | head -1 | awk '{print $2}')
[ -z "$LP" ] && LP=127.0.0.1:9118
case "$LP" in http*) ;; *) LP="http://$LP" ;; esac
cat > /etc/systemd/system/jmerge.service <<UNIT
[Unit]
Description=Lampa: польські торренти
After=network-online.target jackett.service
[Service]
User=jackett
Environment=LAMPAC=$LP
Environment=JACKETT_CONF=$DATA/ServerConfig.json
ExecStart=/usr/bin/python3 /opt/jmerge.py
Restart=always
RestartSec=3
[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable jmerge >/dev/null 2>&1
systemctl restart jmerge
echo "   Lampac: $LP"

echo "4) Caddy"
cat > "$SNIP" <<'CADDY'
handle /jackett* {
	reverse_proxy 127.0.0.1:9117
}
@sui_jm path_regexp sui_jm ^/api/v2\.0/indexers/[^/]+/results$
handle @sui_jm {
	reverse_proxy 127.0.0.1:9120
}
CADDY
if ! grep -q "import $SNIP" "$CF"; then
  cp "$CF" "$CF.before-polish"
  # в кожен блок сайту сервера (https і http)
  awk -v imp="	import $SNIP" '
    { print }
    /^[^[:space:]#(]/ && /\{[[:space:]]*$/ && ($0 ~ /sslip\.io|92\.5\.178\.165|^http:\/\/|^:80/) { print imp }
  ' "$CF.before-polish" > "$CF"
fi
if caddy validate --config "$CF" --adapter caddyfile >/dev/null 2>&1; then
  systemctl reload caddy && echo "   ок"
else
  echo "   ПОМИЛКА в конфігурації — повертаю попередній Caddyfile"
  [ -f "$CF.before-polish" ] && cp "$CF.before-polish" "$CF"
  caddy validate --config "$CF" --adapter caddyfile 2>&1 | tail -5
  exit 1
fi

echo "5) Перевірка"
sleep 2
echo "   Jackett:  $(curl -s -o /dev/null -w '%{http_code}' https://$HOST/jackett/UI/Login) (має бути 200)"
n=$(curl -s "https://$HOST/api/v2.0/indexers/all/results?apikey=1&Query=Dune&title_original=Dune%20Part%20Two&year=2024" \
  | python3 -c 'import sys,json; r=json.load(sys.stdin).get("Results") or []; print(len(r), "усього,", sum(1 for x in r if "Polski" in str(x.get("Info",{}).get("voices",""))), "польських")' 2>/dev/null)
echo "   Пошук «Dune Part Two»: ${n:-немає відповіді}"
grep -n "import $SNIP" "$CF" | head -3
