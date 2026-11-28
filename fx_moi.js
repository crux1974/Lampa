/*!
 * Filmix (свій акаунт) для твоєї Lampa.
 * Підключає оригінальний плагін Filmix від lampaplugins (https://lampaplugins.github.io/store/fx.js),
 * але запити до Filmix іде через твій сервер (/fxproxy/), а не через чужий CORS-проксі.
 * Кожен пристрій входить у свій акаунт Filmix у налаштуваннях плагіна.
 * Встановлення: Налаштування → Розширення → Додати плагін → https://crux1974.github.io/Lampa/fx_moi.js
 */
(function () {
    'use strict';

    if (window.fx_moi_loader) return;
    window.fx_moi_loader = true;

    var ORIGINAL = 'https://lampaplugins.github.io/store/fx.js';
    var PROXY = location.origin + '/fxproxy/';

    function loaded() {
        var s = document.scripts;
        for (var i = 0; i < s.length; i++) if ((s[i].src || '').indexOf('store/fx.js') >= 0) return true;
        return false;
    }

    // проксі — свій сервер (вдома і ззовні адреса різна, тому оновлюємо щоразу)
    var cur = Lampa.Storage.get('fxapi_proxy', '') + '';
    if (!cur || cur.indexOf('cors.jacred.stream') >= 0 || cur.indexOf('/fxproxy/') >= 0) {
        if (cur !== PROXY) Lampa.Storage.set('fxapi_proxy', PROXY);
    }

    if (loaded()) return;
    var s = document.createElement('script');
    s.src = ORIGINAL;
    s.async = true;
    document.head.appendChild(s);
})();
