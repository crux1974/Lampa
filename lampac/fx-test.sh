#!/bin/bash
# Діагностика проксі Filmix: чому Python не дістає Filmix, коли curl дістає
python3 - <<'PY'
import socket, urllib.request, time
path = "/api/v2/token_request?user_dev_apk=2.2.13&user_dev_id=test1234test1234&user_dev_token="
for host in ("filmixapp.vip", "filmixapp.cyou"):
    try:
        print(host, "IP:", sorted({a[4][0] for a in socket.getaddrinfo(host, 80)}))
    except Exception as e:
        print(host, "DNS помилка:", e)
    for ua in ("okhttp/3.12.12", "Mozilla/5.0", None):
        h = {"Accept-Encoding": "identity"}
        if ua: h["User-Agent"] = ua
        t = time.time()
        try:
            with urllib.request.urlopen(urllib.request.Request("http://" + host + path, headers=h), timeout=12) as r:
                print("  UA=%s → %s (%.1f c) %s" % (ua, r.status, time.time() - t, r.read(60)))
        except Exception as e:
            print("  UA=%s → помилка %s: %s (%.1f c)" % (ua, type(e).__name__, str(e)[:120], time.time() - t))
PY
echo "--- curl ---"
curl -s -m 15 -o /dev/null -w 'curl → %{http_code}, ip %{remote_ip}\n' "http://filmixapp.vip/api/v2/token_request?user_dev_apk=2.2.13&user_dev_id=test1234test1234&user_dev_token="
echo "--- журнал jmerge ---"
journalctl -u jmerge -n 8 --no-pager | cut -c1-160
