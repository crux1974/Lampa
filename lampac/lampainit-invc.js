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

/* 3) Міст http → https для сторонніх плагінів.
 * Сторінка Lampa відкрита через https, а браузер не дає https-сторінці вантажити http-скрипти й запити
 * («змішаний вміст»). Тому адреси з MAP непомітно переводимо на наш сервер, який проксіює їх (Caddy: /ext/...).
 * Код плагінів не копіюється — вантажиться оригінал автора через проксі. */
(function () {
  if (location.protocol !== 'https:') return;
  var MAP = { 'http://lampaua.mooo.com': '/ext/lampaua' };
  function fix(u) {
    if (typeof u !== 'string') return u;
    for (var k in MAP) {
      if (u.indexOf(k) === 0) {
        var c = u.charAt(k.length);
        if (!c || c === '/' || c === '?' || c === '#') return location.origin + MAP[k] + u.slice(k.length);
      }
    }
    return u;
  }
  window.sui_bridge_fix = fix;
  try {
    var op = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (m, u) { arguments[1] = fix(u); return op.apply(this, arguments); };
  } catch (e) {}
  try {
    if (window.fetch) { var f = window.fetch; window.fetch = function (i, o) { if (typeof i === 'string') i = fix(i); return f.call(this, i, o); }; }
  } catch (e) {}
  try {
    var d = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
    if (d && d.set) Object.defineProperty(HTMLScriptElement.prototype, 'src', { get: d.get, set: function (v) { d.set.call(this, fix(v)); }, configurable: true, enumerable: d.enumerable });
    var sa = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (n, v) { if (this.tagName === 'SCRIPT' && String(n).toLowerCase() === 'src') v = fix(v); return sa.call(this, n, v); };
  } catch (e) {}
})();

/* 4) Наші плагіни для всіх пристроїв, що відкривають цей сервер:
 *    «ID для сервера» (свої пристрої) і Filmix (свій акаунт, через свій проксі) */
lampainit_invc.appload = function () {
  var list = ['https://crux1974.github.io/Lampa/moi_id.js', 'https://crux1974.github.io/Lampa/fx_moi.js'];
  function has(n) { var a = document.scripts; for (var i = 0; i < a.length; i++) if ((a[i].src || '').indexOf(n) >= 0) return true; return false; }
  list.forEach(function (u) {
    var name = u.split('/').pop();
    if (has(name)) return;
    var s = document.createElement('script'); s.src = u; s.async = true;
    (document.head || document.documentElement).appendChild(s);
  });
};
lampainit_invc.appready = function () {};
lampainit_invc.first_initiale = function () {};
