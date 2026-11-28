#!/bin/bash
# Новий пароль адміністратора Jackett (свій, без випадкових символів).
# Запуск: ... | sudo bash -s -- 'МійПароль'
set -e
NEW="$1"
[ -z "$NEW" ] && { echo "Вкажи пароль після -- в лапках"; exit 1; }
C=/var/lib/jackett/ServerConfig.json
JK=http://127.0.0.1:9117/jackett
systemctl stop jackett
python3 - "$C" <<'PY'
import json, sys
p = sys.argv[1]
c = json.load(open(p, encoding="utf-8-sig"))
c["AdminPassword"] = None
json.dump(c, open(p, "w"), indent=2)
PY
chown jackett:jackett "$C"
systemctl start jackett
for i in $(seq 1 60); do c=$(curl -s -o /dev/null -w '%{http_code}' "$JK/UI/Login" || true); [ "$c" != "000" ] && break; sleep 2; done
JAR=$(mktemp)
curl -s -o /dev/null -c "$JAR" -b "$JAR" --data-urlencode "password=x" "$JK/UI/Dashboard"
PJ=$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$NEW")
code=$(curl -s -o /dev/null -w '%{http_code}' -b "$JAR" -H 'Content-Type: application/json' -d "$PJ" "$JK/api/v2.0/server/adminpassword")
echo "Пароль встановлено → $code (має бути 204)"
rm -f "$JAR"; JAR=$(mktemp)
curl -s -o /dev/null -c "$JAR" -b "$JAR" --data-urlencode "password=$NEW" "$JK/UI/Dashboard"
ok=$(curl -s -o /dev/null -w '%{http_code}' -b "$JAR" "$JK/api/v2.0/indexers?configured=true")
[ "$ok" = "200" ] && echo "Перевірка входу: працює ✓" || echo "Перевірка входу: НЕ працює ($ok)"
rm -f "$JAR"
sed -i 's/^Пароль адміністратора: .*/Пароль адміністратора: (свій, змінено вручну)/' /root/jackett-admin.txt 2>/dev/null || true
