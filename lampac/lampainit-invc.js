// Lampac: /opt/lampac-ng/plugins/override/lampainit-invc.js
var lampainit_invc = {};

/* 1) Застосунок Alcopac UA (LG webOS): підвантажуємо заміну webOSTV.js і меню адрес ◀ */
(function () {
  var named = null;
  try { named = JSON.parse(window.name || 'null'); } catch (e) {}
  var isApp = !!(named && named.alco) || /Web0S|webOS/i.test(navigator.userAgent);
  if (!isApp) return;
  var base = 'https://crux1974.github.io/Lampa/webos/app/';
  function sync(url) {
    try { var x = new XMLHttpRequest(); x.open('GET', url + '?v=' + Date.now(), false); x.send(null); if (x.status === 200) (0, eval)(x.responseText); } catch (e) { console.log('alco load', url, e); }
  }
  sync(base + 'webos_shim.js');   // до старту Lampa: телевізор розпізнається як LG
  var s = document.createElement('script'); s.src = base + 'menu.js?v=' + Date.now();
  (document.head || document.documentElement).appendChild(s);
})();

/* 2) Прибирає зі списку розширень лише старі плагіни Alcopac (lampac-go) */
var sui_old = /92-5-178-165\.sslip\.io\/(plugins\/)?(account|syncpro|audiobot|webplayer|cdn_direct|anti-dmca|wasm_loader|startpage|ts|external_player|ads|youtube_feed|migrate|theme|netflix_ui|screensaver|remote|stats|opensubs|dualsubs|player_redesign|hls_tracks|voice_switcher)\.js\?v=none/;
function sui_clean_list(list) { return (list || []).filter(function (p) { return !sui_old.test((p && (p.url || p)) + ''); }); }
try {
  var raw = localStorage.getItem('plugins');
  if (raw) { var arr = JSON.parse(raw), clean = sui_clean_list(arr); if (clean.length !== arr.length) localStorage.setItem('plugins', JSON.stringify(clean)); }
} catch (e) {}

lampainit_invc.appload = function () {};
lampainit_invc.appready = function () {};
lampainit_invc.first_initiale = function () {};
