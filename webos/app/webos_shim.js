/* Alcopac UA — перенесення налаштувань Lampa між адресами сервера.
   У кожної адреси своя пам'ять браузера. Меню ◀ («Перенести налаштування») відкриває стару адресу
   з позначкою sui_export_to; тут, до старту Lampa, пам'ять пакується у window.name і передається
   на нову адресу, де так само до старту Lampa записується. Великі кеші не переносяться. */
(function () {
  var N = null;
  try { N = JSON.parse(window.name || 'null'); } catch (e) {}
  if (!N || !N.alco) return;
  var SKIP = /^(sui_img|sui_full|sui_uat|sui_ai|sui_rt_cache|sui_tv_cache|sui_svc_cache|img_cache_v3_|obsidian_.*cache|title_cache|netflix_card_cache|applecation_ratings_cache)/;
  try {
    if (N.sui_export_to && /^https?:/i.test(location.protocol)) {
      var data = {}, n = 0;
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k || SKIP.test(k)) continue;
        data[k] = localStorage.getItem(k); n++;
      }
      var to = N.sui_export_to;
      delete N.sui_export_to;
      N.sui_import = { from: location.origin, n: n, data: data };
      N.cur = to;
      window.name = JSON.stringify(N);
      document.documentElement.innerHTML = '<body style="background:#111;color:#fff;font:32px sans-serif;display:flex;align-items:center;justify-content:center;height:100vh">Переношу налаштування (' + n + ')…</body>';
      location.replace(to);
      window.__alcoStop = true;
      return;
    }
    if (N.sui_import && N.sui_import.from !== location.origin) {
      var d = N.sui_import.data || {}, c = 0;
      for (var key in d) { if (Object.prototype.hasOwnProperty.call(d, key) && !/^mylampa_/.test(key)) { try { localStorage.setItem(key, d[key]); c++; } catch (e) {} } }
      try { localStorage.setItem('alco_imported', N.sui_import.from + ' · ' + c + ' · ' + new Date().toISOString()); } catch (e) {}
      delete N.sui_import;
      window.name = JSON.stringify(N);
      window.__alcoImported = c;
    }
  } catch (e) { try { console.log('alco transfer', e); } catch (e2) {} }
})();

/* Alcopac UA — запам'ятована адреса: якщо в меню ◀ вибрали іншу адресу, а застосунок знову відкрив стару,
   ця сторінка сама перекидає на вибрану (якщо вона відповідає). Явний вибір адреси в меню скасовує перекидання. */
(function () {
  var N = null;
  try { N = JSON.parse(window.name || 'null'); } catch (e) {}
  if (!N || !N.alco || !/^https?:/i.test(location.protocol) || window.__alcoStop) return;
  try {
    var here = location.origin;
    if (N.chosen) {
      var ch = String(N.chosen).replace(/\/+$/, '');
      delete N.chosen;
      window.name = JSON.stringify(N);
      if (ch === here) { localStorage.removeItem('alco_prefer'); return; }
    }
    var pref = (localStorage.getItem('alco_prefer') || '').replace(/\/+$/, '');
    if (!pref || pref === here || !/^https?:\/\//i.test(pref)) return;
    var done = false;
    var go = function () {
      if (done) return; done = true;
      N.cur = pref;
      try { window.name = JSON.stringify(N); } catch (e) {}
      location.replace(pref);
    };
    var t = setTimeout(function () { done = true; }, 2500);   // вибрана адреса не відповідає — лишаємось тут
    fetch(pref + '/?ping=' + Date.now(), { mode: 'no-cors', cache: 'no-store' }).then(function () { clearTimeout(t); go(); }, function () { clearTimeout(t); done = true; });
  } catch (e) {}
})();

/* Alcopac UA — мінімальна заміна webOSTV.js (бібліотеки LG), щоб Lampa
   розпізнала телевізор LG так само, як в офіційному застосунку.
   Працює через вбудований у webOS PalmServiceBridge. */
(function () {
  if (typeof window.webOS !== 'undefined') return;
  if (typeof window.PalmServiceBridge === 'undefined' && !window.PalmSystem) return;

  function request(uri, params) {
    params = params || {};
    var url = uri;
    if (params.method) url = uri.replace(/\/+$/, '') + '/' + params.method;
    var parameters = params.parameters || {};
    if (params.subscribe) parameters.subscribe = true;
    var bridge = null;
    try { bridge = new window.PalmServiceBridge(); } catch (e) {}
    if (!bridge) {
      if (params.onFailure) params.onFailure({ returnValue: false, errorText: 'no PalmServiceBridge' });
      return { cancel: function () {} };
    }
    bridge.onservicecallback = function (msg) {
      var r;
      try { r = JSON.parse(msg); } catch (e) { r = { returnValue: false, errorText: 'bad response' }; }
      if (r.errorCode || r.returnValue === false) { if (params.onFailure) params.onFailure(r); }
      else if (params.onSuccess) params.onSuccess(r);
      if (params.onComplete) params.onComplete(r);
    };
    try { bridge.call(url, JSON.stringify(parameters)); } catch (e) {}
    return { uri: uri, params: params, cancel: function () { try { bridge.cancel(); } catch (e) {} } };
  }

  var info = null;
  window.webOS = {
    libVersion: '1.2.4-alcopac',
    platform: { tv: true },
    service: { request: request },
    fetchAppId: function () {
      try { return window.PalmSystem.identifier.split(' ')[0]; } catch (e) { return 'com.crux1974.lampa'; }
    },
    fetchAppRootPath: function () { return (window.ALCO_START || '').replace(/[^\/]*$/, ''); },
    platformBack: function () { try { window.PalmSystem.platformBack(); } catch (e) {} },
    keyboard: { isShowing: function () { try { return !!window.PalmSystem.isKeyboardVisible; } catch (e) { return false; } } },
    deviceInfo: function (cb) {
      if (info) return cb(info);
      request('luna://com.webos.service.tv.systemproperty', {
        method: 'getSystemInfo',
        parameters: { keys: ['modelName', 'firmwareVersion', 'UHD', 'sdkVersion'] },
        onSuccess: function (r) {
          info = { modelName: r.modelName, version: r.firmwareVersion, sdkVersion: r.sdkVersion || '25.0', uhd: r.UHD === 'true' };
          var v = (info.version || '').split('.');
          info.versionMajor = +v[0] || 0; info.versionMinor = +v[1] || 0; info.versionDot = +v[2] || 0;
          cb(info);
        },
        onFailure: function () { info = { modelName: 'webOS TV', sdkVersion: '25.0' }; cb(info); }
      });
    }
  };
})();
