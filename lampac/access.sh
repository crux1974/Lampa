#!/bin/bash
# «Лише для своїх»: Filmix і польські роздачі бачать тільки вказані ID.
# Запуск: ... | sudo bash -s -- 'ID1' 'ID2' ...
#   ID — це «ID пристрою» або «Акаунт CUB» з плагіна «Мій ID».
# --only перед ID — замінити весь список (старі ID, наприклад пошта CUB, прибираються).
# Без аргументів — показує, хто зараз у списку.
set -e
RAW=https://raw.githubusercontent.com/crux1974/Lampa/main/lampac

# де лежить init.conf Lampac
CONF=""
for u in $(systemctl list-units --type=service --all --no-legend 2>/dev/null | awk '{print $1}' | grep -i lampac); do
  d=$(systemctl show -p WorkingDirectory --value "$u" 2>/dev/null)
  [ -n "$d" ] && [ -f "$d/init.conf" ] && { CONF="$d/init.conf"; SVC="$u"; break; }
done
if [ -z "$CONF" ]; then
  CONF=$(find /home /opt /root /srv -maxdepth 4 -name init.conf 2>/dev/null | grep -i lampac | head -1)
fi
[ -z "$CONF" ] && { echo "Не знайшов init.conf Lampac"; exit 1; }
echo "Lampac: $CONF ${SVC:+($SVC)}"

if [ $# -eq 0 ]; then
  echo "Зараз у списку «своїх»:"; cat /etc/jmerge-owners 2>/dev/null || echo "  (порожньо — польські роздачі бачать усі)"
  exit 0
fi

ONLY=0
if [ "$1" = "--only" ]; then ONLY=1; shift; fi
[ $# -eq 0 ] && { echo "Вкажи хоча б один ID"; exit 1; }
cp "$CONF" "$CONF.before-access"
ONLY=$ONLY python3 - "$CONF" "$@" <<'PY'
import json, os, re, sys
p, ids = sys.argv[1], [i.strip().lower() for i in sys.argv[2:] if i.strip()]
raw = open(p, encoding="utf-8-sig").read()
try:
    c = json.loads(raw)
except Exception:
    # init.conf може мати коментарі // — прибираємо їх лише для читання
    c = json.loads(re.sub(r'(?m)^\s*//.*$', '', raw))
acc = c.setdefault("accsdb", {})
users = acc.setdefault("users", [])
me = next((u for u in users if (u.get("comment") or "") == "свої (Мій ID)"), None)
if me is None:
    me = {"id": ids[0], "ids": [], "group": 1, "expires": "2100-01-01T00:00:00", "comment": "свої (Мій ID)"}
    users.append(me)
allids = [] if os.environ.get("ONLY") == "1" else [x for x in [me.get("id", "").lower()] + [x.lower() for x in me.get("ids") or []] if x]
for i in ids:
    if i not in allids:
        allids.append(i)
me["id"], me["ids"], me["group"] = allids[0], allids[1:], 1
for k in ("Filmix", "FilmixTV", "FilmixPartner"):
    sec = c.setdefault(k, {})
    sec["group"] = 1
    sec["group_hide"] = True
json.dump(c, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
open("/etc/jmerge-owners", "w").write("\n".join(allids) + "\n")
print("Свої ID: %d" % len(allids))
PY

if [ -n "$SVC" ]; then systemctl restart "$SVC"; else echo "Перезапусти Lampac вручну"; fi
curl -fsSL -H 'Accept: application/vnd.github.raw' https://api.github.com/repos/crux1974/Lampa/contents/lampac/jmerge.py -o /opt/jmerge.py && systemctl restart jmerge
sleep 12
if [ -n "$SVC" ] && ! systemctl is-active -q "$SVC"; then
  echo "Lampac не запустився з новими налаштуваннями — повертаю як було"
  cp "$CONF.before-access" "$CONF"; systemctl restart "$SVC"; exit 1
fi
echo "Lampac: $( [ -n "$SVC" ] && systemctl is-active "$SVC")  jmerge: $(systemctl is-active jmerge)"
echo "Готово. Filmix і польські роздачі — лише для своїх. Резервна копія: $CONF.before-access"
