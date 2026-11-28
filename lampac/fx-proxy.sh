#!/bin/bash
# Свій CORS-проксі для плагіна Filmix (fx.js): /fxproxy/ → лише домени Filmix.
set -e
SNIP=/etc/caddy/polish.caddy
curl -fsSL -H 'Accept: application/vnd.github.raw' https://api.github.com/repos/crux1974/Lampa/contents/lampac/jmerge.py -o /opt/jmerge.py
systemctl restart jmerge
if ! grep -q '/fxproxy/\*' "$SNIP"; then
  cp "$SNIP" "$SNIP.bak"
  printf 'handle /fxproxy/* {\n\treverse_proxy 127.0.0.1:9120\n}\n' >> "$SNIP"
fi
if caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1; then
  systemctl reload caddy
else
  echo "Помилка Caddy — повертаю"; [ -f "$SNIP.bak" ] && cp "$SNIP.bak" "$SNIP"; exit 1
fi
sleep 3
echo "Filmix через свій проксі → $(curl -s -o /dev/null -w '%{http_code}' 'https://92-5-178-165.sslip.io/fxproxy/http://filmixapp.vip/api/v2/token_request?user_dev_apk=2.2.13&user_dev_id=test1234test1234&user_dev_token=') (має бути 200)"
echo "Чужий сайт → $(curl -s -o /dev/null -w '%{http_code}' 'https://92-5-178-165.sslip.io/fxproxy/http://example.com/') (має бути 403)"
