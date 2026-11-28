#!/bin/bash
# Перевірка польських торрентів: що знаходить сам Jackett
Q="${1:-Dune Part Two}"
K=$(python3 -c "import json;print(json.load(open('/var/lib/jackett/ServerConfig.json',encoding='utf-8-sig'))['APIKey'])")
echo "Служби: jackett=$(systemctl is-active jackett) jmerge=$(systemctl is-active jmerge)"
echo "Шукаю в Jackett: $Q"
t0=$(date +%s)
curl -s -m 60 -G "http://127.0.0.1:9117/jackett/api/v2.0/indexers/all/results" --data-urlencode "apikey=$K" --data-urlencode "Query=$Q" -o /tmp/jt.json
echo "Час: $(( $(date +%s) - t0 )) с"
python3 - <<'PY'
import json, re
try:
    d = json.load(open('/tmp/jt.json'))
except Exception as e:
    print("Jackett не відповів JSON:", open('/tmp/jt.json').read()[:300]); raise SystemExit
for i in d.get('Indexers') or []:
    print("  трекер %-15s результатів: %-4s помилка: %s" % (i.get('ID'), i.get('Results'), (i.get('Error') or '-')[:120]))
r = d.get('Results') or []
pl = [x['Title'] for x in r if re.search(r'(?<![a-z])(pl|pldub|polish|polski|lektor|dubbing)(?![a-z])', x['Title'], re.I)]
print("Усього: %d, з польською позначкою: %d" % (len(r), len(pl)))
for t in pl[:8]: print("   ", t)
PY
