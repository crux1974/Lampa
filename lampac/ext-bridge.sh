#!/bin/bash
# Міст для http-плагінів (lampaua.mooo.com) на https-сторінці Lampa.
# Запуск на сервері: curl -fsSL https://raw.githubusercontent.com/crux1974/Lampa/main/lampac/ext-bridge.sh | sudo bash
set -e
CF=/etc/caddy/Caddyfile
SNIP=/etc/caddy/ext-bridge.caddy
HOST=92-5-178-165.sslip.io

echo "1) Оновлюю lampainit-invc.js для Lampac"
curl -fsSL "https://raw.githubusercontent.com/crux1974/Lampa/main/lampac/lampainit-invc.js?v=$(date +%s)" -o /opt/lampac-ng/plugins/override/lampainit-invc.js
grep -q "sui_bridge_fix" /opt/lampac-ng/plugins/override/lampainit-invc.js && echo "   ок"

echo "2) Проксі /ext/lampaua → http://lampaua.mooo.com у Caddy"
cat > "$SNIP" <<'CADDY'
handle_path /ext/lampaua/* {
	reverse_proxy http://lampaua.mooo.com {
		header_up Host lampaua.mooo.com
	}
}
CADDY
if ! grep -q "import $SNIP" "$CF"; then
  cp "$CF" "$CF.before-bridge"
  # вставляємо в https-блок сайту (рядок з адресою сервера, що закінчується «{», не http://)
  awk -v h="$HOST" -v imp="	import $SNIP" '
    { print }
    !done && $0 ~ h && $0 ~ /\{[[:space:]]*$/ && $0 !~ /^[[:space:]]*http:\/\// { print imp; done=1 }
  ' "$CF.before-bridge" > "$CF"
fi
if caddy validate --config "$CF" --adapter caddyfile >/dev/null 2>&1; then
  systemctl reload caddy && echo "   ок, Caddy перезавантажено"
else
  echo "   ПОМИЛКА в конфігурації — повертаю попередній Caddyfile"
  [ -f "$CF.before-bridge" ] && cp "$CF.before-bridge" "$CF"
  caddy validate --config "$CF" --adapter caddyfile 2>&1 | tail -5
  exit 1
fi

echo "3) Перевірка"
code=$(curl -s -o /dev/null -w '%{http_code}' "https://$HOST/ext/lampaua/buttons.js")
echo "   https://$HOST/ext/lampaua/buttons.js → $code (має бути 200)"
grep -n "import $SNIP" "$CF" | head -2
