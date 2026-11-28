#!/bin/bash
# 1337x у Jackett (через FlareSolverr, бо сайт за Cloudflare)
set -e
C=/var/lib/jackett/ServerConfig.json
JK=http://127.0.0.1:9117/jackett

echo "1) FlareSolverr"
if ! command -v docker >/dev/null 2>&1; then
  echo "   ставлю Docker"
  DEBIAN_FRONTEND=noninteractive apt-get update -qq >/dev/null
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq docker.io >/dev/null
  systemctl enable --now docker >/dev/null 2>&1
fi
if ! docker ps --format '{{.Names}}' | grep -q '^flaresolverr$'; then
  docker rm -f flaresolverr >/dev/null 2>&1 || true
  docker run -d --name flaresolverr --restart unless-stopped -p 127.0.0.1:8191:8191 \
    -e LOG_LEVEL=info ghcr.io/flaresolverr/flaresolverr:latest >/dev/null
fi
for i in $(seq 1 60); do curl -s -o /dev/null http://127.0.0.1:8191/ && break; sleep 2; done
echo "   $(curl -s http://127.0.0.1:8191/ | head -c 80)"

echo "2) Jackett: FlareSolverr і 1337x"
systemctl stop jackett
HASH=$(python3 - "$C" <<'PY'
import json, sys
p = sys.argv[1]
c = json.load(open(p, encoding="utf-8-sig"))
h = c.get("AdminPassword") or ""
c["AdminPassword"] = None
c["FlareSolverrUrl"] = "http://127.0.0.1:8191"
c["FlareSolverrMaxTimeout"] = 60000
json.dump(c, open(p, "w"), indent=2)
print(h)
PY
)
chown jackett:jackett "$C"
systemctl start jackett
for i in $(seq 1 60); do c=$(curl -s -o /dev/null -w '%{http_code}' "$JK/UI/Login" || true); [ "$c" != "000" ] && break; sleep 2; done
JAR=$(mktemp)
curl -s -o /dev/null -c "$JAR" -b "$JAR" --data-urlencode "password=x" "$JK/UI/Dashboard"
cfg=$(curl -s -b "$JAR" "$JK/api/v2.0/indexers/1337x/config" || true)
code=$(curl -s -o /dev/null -w '%{http_code}' -m 120 -b "$JAR" -H 'Content-Type: application/json' -d "$cfg" "$JK/api/v2.0/indexers/1337x/config" || true)
echo "   1337x → $code (має бути 204)"
rm -f "$JAR"
# повертаємо твій пароль
systemctl stop jackett
python3 - "$C" "$HASH" <<'PY'
import json, sys
p, h = sys.argv[1], sys.argv[2]
c = json.load(open(p, encoding="utf-8-sig"))
c["AdminPassword"] = h or None
json.dump(c, open(p, "w"), indent=2)
PY
chown jackett:jackett "$C"
systemctl start jackett
for i in $(seq 1 60); do c=$(curl -s -o /dev/null -w '%{http_code}' "$JK/UI/Login" || true); [ "$c" != "000" ] && break; sleep 2; done
echo "   пароль Jackett — твій, як і був"

echo "3) Перевірка (1337x через Cloudflare — до хвилини)"
K=$(python3 -c "import json;print(json.load(open('$C',encoding='utf-8-sig'))['APIKey'])")
curl -s -m 120 -G "$JK/api/v2.0/indexers/1337x/results" --data-urlencode "apikey=$K" --data-urlencode "Query=Dune Part Two PL" -o /tmp/x.json
python3 - <<'PY'
import json, re
try: d = json.load(open('/tmp/x.json'))
except Exception: print("   1337x не відповів"); raise SystemExit
for i in d.get('Indexers') or []:
    print("   1337x: результатів %s, помилка: %s" % (i.get('Results'), (i.get('Error') or '-')[:150]))
r = d.get('Results') or []
pl = [x['Title'] for x in r if re.search(r'(?<![a-z])(pl|pldub|polish|polski|lektor|dubbing)(?![a-z])', x['Title'], re.I)]
print("   з польською позначкою: %d" % len(pl))
for t in pl[:6]: print("     ", t)
PY
