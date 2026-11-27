#!/bin/sh
# Flint 2 (GL.iNet): домашня адреса для Lampa — http://192.168.8.1:8095 → ваш сервер Lampac.
# Телевізор вважає таку сторінку «домашньою» і дозволяє їй звертатися до TorrServer.
# Запуск на роутері (ssh root@192.168.8.1):
#   curl -fsSL https://raw.githubusercontent.com/crux1974/Lampa/main/flint/lampa-proxy.sh | sh
SERVER=92-5-178-165.sslip.io
PORT=8095
CONF=/etc/nginx/conf.d/lampa-proxy.conf

echo "lampa-proxy $(date)"
ls /etc/nginx /etc/nginx/conf.d 2>&1
if ! grep -rqs "conf.d" /etc/nginx/nginx.conf; then
  echo "ПОМИЛКА: nginx роутера не підключає /etc/nginx/conf.d — надішліть цей вивід:"; head -40 /etc/nginx/nginx.conf; exit 1
fi

cat > "$CONF" <<NGX
server {
    listen $PORT;
    listen [::]:$PORT;
    client_max_body_size 50m;
    location / {
        proxy_pass http://$SERVER;
        proxy_set_header Host $SERVER;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_buffering off;
        proxy_read_timeout 300s;
    }
}
NGX

if nginx -t >/tmp/ngx.err 2>&1; then
  /etc/init.d/nginx reload && echo "ок: nginx перезавантажено"
else
  echo "ПОМИЛКА в конфігурації, прибираю:"; cat /tmp/ngx.err; rm -f "$CONF"; exit 1
fi

# зберегти файл при оновленні прошивки (Keep settings)
grep -qs "$CONF" /etc/sysupgrade.conf || echo "$CONF" >> /etc/sysupgrade.conf

sleep 1
code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/")
echo "Перевірка http://192.168.8.1:$PORT → $code (має бути 200)"

netstat -lnt 2>/dev/null | grep ":$PORT " || echo "порт $PORT не слухається"
