#!/bin/bash
# Плагіни «ID для сервера» і Filmix — для всіх пристроїв (через lampainit-invc.js) + оновлений проксі Filmix.
set -e
API='https://api.github.com/repos/crux1974/Lampa/contents/lampac'
curl -fsSL -H 'Accept: application/vnd.github.raw' "$API/lampainit-invc.js" -o /opt/lampac-ng/plugins/override/lampainit-invc.js
curl -fsSL -H 'Accept: application/vnd.github.raw' "$API/jmerge.py" -o /opt/jmerge.py
systemctl restart jmerge
sleep 3
echo "Плагіни для всіх: $(grep -c 'fx_moi.js' /opt/lampac-ng/plugins/override/lampainit-invc.js) (має бути 1)"
for h in filmixapp.vip filmixapp.cyou fxapp.biz; do
  echo "  сервер → $h: $(curl -s -o /dev/null -m 10 -w '%{http_code}' "http://$h/api/v2/token_request?user_dev_apk=2.2.13&user_dev_id=test1234test1234&user_dev_token=")"
done
echo "Filmix через свій проксі → $(curl -s -o /dev/null -m 40 -w '%{http_code}' 'https://92-5-178-165.sslip.io/fxproxy/http://filmixapp.vip/api/v2/token_request?user_dev_apk=2.2.13&user_dev_id=test1234test1234&user_dev_token=') (має бути 200)"
