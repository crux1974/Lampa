/*!
 * «Мій ID» для Lampa — показує, за чим сервер упізнає цей пристрій,
 * і передає цей ID у пошук торрентів, щоб сервер міг дати «своїм» більше
 * (польські роздачі тощо).
 * Налаштування → «ID для сервера».
 * Встановлення: Налаштування → Розширення → Додати плагін → https://crux1974.github.io/Lampa/moi_id.js
 */
(function () {
    'use strict';

    if (window.moi_id_plugin) return;
    window.moi_id_plugin = true;

    var COMPONENT = 'moi_id';
    var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="12" r="2.5"/><path d="M14 10h4M14 14h4"/></svg>';

    function email() { return (Lampa.Storage.get('account_email', '') || '') + ''; }

    function uid() {
        var u = Lampa.Storage.get('lampac_unic_id', '') + '';
        if (!u) {
            // так само, як це робить Lampac, якщо ID ще не створено
            u = Lampa.Utils.uid(8).toLowerCase();
            Lampa.Storage.set('lampac_unic_id', u);
        }
        return u;
    }

    /* ---------- ID у запити пошуку торрентів ---------- */
    function addIds(url) {
        try {
            if (typeof url !== 'string' || url.indexOf('/api/v2.0/indexers/') < 0) return url;
            if (url.indexOf('uid=') < 0) url += (url.indexOf('?') < 0 ? '?' : '&') + 'uid=' + encodeURIComponent(uid());
            var e = email();
            if (e && url.indexOf('account_email=') < 0) url += '&account_email=' + encodeURIComponent(e);
        } catch (x) {}
        return url;
    }

    var open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (m, url) {
        var a = Array.prototype.slice.call(arguments);
        a[1] = addIds(url);
        return open.apply(this, a);
    };
    if (window.fetch) {
        var f = window.fetch;
        window.fetch = function (input, init) {
            if (typeof input === 'string') input = addIds(input);
            return f.call(this, input, init);
        };
    }

    /* ---------- розділ у налаштуваннях ---------- */
    function copy(text) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text);
            else {
                var t = document.createElement('textarea');
                t.value = text; document.body.appendChild(t); t.select();
                document.execCommand('copy'); document.body.removeChild(t);
            }
            Lampa.Noty.show('Скопійовано');
        } catch (e) { Lampa.Noty.show(text); }
    }

    function start() {
        Lampa.SettingsApi.addComponent({ component: COMPONENT, name: 'ID для сервера', icon: ICON });

        Lampa.SettingsApi.addParam({
            component: COMPONENT,
            param: { name: COMPONENT + '_hint', type: 'title' },
            field: { name: 'За цим ID сервер упізнає цей пристрій' }
        });

        Lampa.SettingsApi.addParam({
            component: COMPONENT,
            param: { name: COMPONENT + '_uid', type: 'button' },
            field: { name: 'ID пристрою (натисни — скопіювати)', description: uid() },
            onRender: function (item) {
                var d = item.find ? item.find('.settings-param__descr') : null;
                if (d && d.length) d.text(uid());
            },
            onChange: function () { copy(uid()); }
        });

        Lampa.SettingsApi.addParam({
            component: COMPONENT,
            param: { name: COMPONENT + '_email', type: 'button' },
            field: { name: 'Акаунт CUB', description: email() || 'не виконано вхід' },
            onRender: function (item) {
                var d = item.find ? item.find('.settings-param__descr') : null;
                if (d && d.length) d.text(email() || 'не виконано вхід — тоді використовуйте ID пристрою');
            },
            onChange: function () { if (email()) copy(email()); }
        });

        Lampa.SettingsApi.addParam({
            component: COMPONENT,
            param: { name: COMPONENT + '_tip', type: 'title' },
            field: { name: 'ID пристрою свій на кожному пристрої і не переходить через CUB' }
        });
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });
})();
