#!/bin/sh
# TorrServer на Flint 2 (GL.iNet, OpenWrt). Увесь трафік TorrServer — ТІЛЬКИ через VPN (WireGuard Proton);
# якщо VPN впав — торенти зупиняються, а не йдуть напряму. Адреса для Lampa: http://192.168.8.1:8090
# Запуск (LuCI → System → Startup → Local Startup, або ssh):
#   sh /tmp/ts.sh  (після curl -o /tmp/ts.sh https://raw.githubusercontent.com/crux1974/Lampa/main/flint/torrserver.sh)
DIR=/etc/torrserver
BIN=$DIR/TorrServer
PORT=8090
TUID=7777
TABLE=77
echo "torrserver-setup $(date)"

# 1) окремий користувач, щоб маршрутизувати лише трафік TorrServer
grep -q "^torrsrv:" /etc/passwd || echo "torrsrv:x:$TUID:$TUID:torrserver:$DIR:/bin/false" >> /etc/passwd
grep -q "^torrsrv:" /etc/group  || echo "torrsrv:x:$TUID:" >> /etc/group
mkdir -p "$DIR"; chown -R $TUID:$TUID "$DIR"

# 2) ip з підтримкою uidrange
if ! ip rule help 2>&1 | grep -q uidrange; then
  echo "встановлюю ip-full…"; opkg update >/dev/null 2>&1; opkg install ip-full 2>&1 | tail -2
fi
ip rule help 2>&1 | grep -q uidrange || { echo "ПОМИЛКА: ip не підтримує uidrange"; exit 1; }

# 3) TorrServer для arm64
if [ ! -x "$BIN" ]; then
  echo "завантажую TorrServer…"
  curl -fsSL -o "$BIN.tmp" https://github.com/YouROK/TorrServer/releases/latest/download/TorrServer-linux-arm64 && mv "$BIN.tmp" "$BIN" && chmod +x "$BIN" && chown $TUID:$TUID "$BIN"
fi
[ -x "$BIN" ] || { echo "ПОМИЛКА: не вдалося завантажити TorrServer"; exit 1; }

# 4) сторож маршрутів: трафік користувача torrsrv — лише через WireGuard, інакше заборонено
cat > $DIR/vpnroute.sh <<VPN
#!/bin/sh
while true; do
  WG=\$(ls /sys/class/net 2>/dev/null | grep -E '^wg' | head -1)
  ip rule show | grep -q "uidrange $TUID-$TUID lookup main suppress_prefixlength 0" || ip rule add uidrange $TUID-$TUID lookup main suppress_prefixlength 0 priority 100
  ip rule show | grep -q "uidrange $TUID-$TUID lookup $TABLE" || ip rule add uidrange $TUID-$TUID lookup $TABLE priority 101
  ip rule show | grep -q "uidrange $TUID-$TUID prohibit" || ip rule add uidrange $TUID-$TUID prohibit priority 102
  ip -6 rule show | grep -q "uidrange $TUID-$TUID prohibit" || ip -6 rule add uidrange $TUID-$TUID prohibit priority 100
  if [ -n "\$WG" ] && [ -d /sys/class/net/\$WG ] && [ "\$(cat /sys/class/net/\$WG/operstate 2>/dev/null)" != "down" ]; then
    ip route show table $TABLE | grep -q "dev \$WG" || { ip route flush table $TABLE; ip route add default dev \$WG table $TABLE; }
  else
    ip route flush table $TABLE 2>/dev/null
  fi
  sleep 15
done
VPN
chmod +x $DIR/vpnroute.sh

# 5) служби procd
cat > /etc/init.d/torrserver <<SVC
#!/bin/sh /etc/rc.common
START=99
USE_PROCD=1
start_service() {
  procd_open_instance vpnroute
  procd_set_param command $DIR/vpnroute.sh
  procd_set_param respawn
  procd_close_instance
  procd_open_instance ts
  procd_set_param command $BIN -d $DIR -p $PORT
  procd_set_param user torrsrv
  procd_set_param respawn 3600 5 0
  procd_set_param env HOME=$DIR
  procd_close_instance
}
SVC
chmod +x /etc/init.d/torrserver
/etc/init.d/torrserver enable
/etc/init.d/torrserver restart
grep -qs "$DIR" /etc/sysupgrade.conf || { echo "$DIR" >> /etc/sysupgrade.conf; echo /etc/init.d/torrserver >> /etc/sysupgrade.conf; }

# 6) перевірка
sleep 8
echo "--- маршрут TorrServer (має бути dev wg…):"
ip route get 1.1.1.1 uid $TUID 2>&1 | head -1
echo "--- TorrServer відповідає:"
curl -s -m 5 http://127.0.0.1:$PORT/echo || echo "НЕ відповідає"
echo
echo "Адреса для Lampa: http://192.168.8.1:$PORT"
