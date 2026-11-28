#!/bin/bash
# Перевірка: чи віддає сервер .torrent з Devil-Torrents так, як його бере TorrServer
K=$(python3 -c "import json;print(json.load(open('/var/lib/jackett/ServerConfig.json',encoding='utf-8-sig'))['APIKey'])")
curl -s -m 60 -G "http://127.0.0.1:9117/jackett/api/v2.0/indexers/devil-torrents/results" --data-urlencode "apikey=$K" --data-urlencode "Query=Grinch" -o /tmp/dl.json
L=$(python3 -c "import json;r=json.load(open('/tmp/dl.json')).get('Results') or [];print(r[0]['Link'] if r else '')")
M=$(python3 -c "import json;r=json.load(open('/tmp/dl.json')).get('Results') or [];print('є' if r and r[0].get('MagnetUri') else 'немає')")
[ -z "$L" ] && { echo "Jackett не повернув результатів з Devil-Torrents"; exit 1; }
echo "Magnet у результаті: $M"
echo "Посилання починається з: $(echo "$L" | cut -c1-60)…"
for u in "$L" "$(echo "$L" | sed 's#^https://#http://#')"; do
  out=$(curl -s -m 40 -o /tmp/dl.torrent -w '%{http_code} %{content_type} %{size_download}' "$u")
  head=$(head -c 11 /tmp/dl.torrent | tr -c '[:print:]' '.')
  echo "$(echo "$u" | cut -d: -f1): $out  початок: $head"
done
echo "(для справного .torrent початок «d8:announce» або «d10:created» тощо — літера d і цифри)"
