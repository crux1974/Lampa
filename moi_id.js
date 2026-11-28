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

    /* Власний ID пристрою: лежить прямо в localStorage, повз Lampa.Storage,
       тому CUB його не синхронізує — на кожному пристрої свій. */
    var KEY = 'srv_device_id';
    function uid() {
        var u = '';
        try { u = localStorage.getItem(KEY) || ''; } catch (e) {}
        if (!u) {
            var a = 'abcdefghijkmnpqrstuvwxyz23456789';
            for (var i = 0; i < 10; i++) u += a.charAt(Math.floor(Math.random() * a.length));
            try { localStorage.setItem(KEY, u); } catch (e) {}
        }
        return u;
    }

    /* ---------- ID у запити пошуку торрентів ---------- */
    /* box_mac=ID у запити до свого сервера: Lampac шукає «своїх» і за ним */
    function ours(url) {
        if (url.indexOf('/api/v2.0/indexers/') >= 0 || url.indexOf('/lite/') >= 0) return true;
        if (url.indexOf('92-5-178-165.sslip.io') >= 0 || url.indexOf('92.5.178.165') >= 0) return true;
        if (/^\//.test(url) && !/^\/\//.test(url)) return true;
        try { return url.indexOf(location.origin + '/') === 0; } catch (e) { return false; }
    }

    function addIds(url) {
        try {
            if (typeof url !== 'string' || !ours(url)) return url;
            if (/\.(js|css|png|jpe?g|svg|webp|gif|woff2?|ico|json)(\?|$)/i.test(url) && url.indexOf('/api/') < 0 && url.indexOf('/lite/') < 0) return url;
            if (url.indexOf('box_mac=') < 0) url += (url.indexOf('?') < 0 ? '?' : '&') + 'box_mac=' + encodeURIComponent(uid());
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


    /* ---------- «Свої пристрої»: керування списком прямо з Lampa ---------- */
    function api(q, ok) {
        var x = new XMLHttpRequest();
        x.open('GET', '/jm/owners?box_mac=' + encodeURIComponent(uid()) + (q ? '&' + q : ''), true);
        x.timeout = 10000;
        x.onload = function () {
            if (x.status === 403) return Lampa.Noty.show('Цей пристрій не в списку своїх — керувати може лише свій');
            if (x.status !== 200) return Lampa.Noty.show('Сервер не відповів (' + x.status + ')');
            try { ok(JSON.parse(x.responseText)); } catch (e) { Lampa.Noty.show('Помилка відповіді сервера'); }
        };
        x.onerror = x.ontimeout = function () { Lampa.Noty.show('Сервер не відповів'); };
        x.send();
    }

    var MSG = { added: 'Додано. Діє приблизно за хвилину', removed: 'Прибрано', 'bad id': 'Неправильний ID', 'cannot remove yourself': 'Себе прибрати не можна' };

    function owners() {
        api('', function (d) { showOwners(d); });
    }

    function showOwners(d) {
        if (d.msg && MSG[d.msg]) Lampa.Noty.show(MSG[d.msg]);
        var items = [{ title: '+ Додати ID пристрою', add: true }];
        (d.ids || []).forEach(function (id) {
            items.push({ title: id, subtitle: id === d.me ? 'цей пристрій' : 'натисни — прибрати', id: id, me: id === d.me });
        });
        Lampa.Select.show({
            title: 'Свої пристрої: ' + (d.ids || []).length,
            items: items,
            onSelect: function (a) {
                if (a.add) {
                    Lampa.Input.edit({ title: 'ID пристрою (з розділу «ID для сервера» на ньому)', value: '', free: true, nosave: true }, function (v) {
                        v = (v || '').replace(/\s+/g, '').toLowerCase();
                        if (!v) return Lampa.Controller.toggle('settings_component');
                        api('add=' + encodeURIComponent(v), showOwners);
                    });
                } else if (a.me) {
                    Lampa.Noty.show('Це цей пристрій — його прибрати не можна');
                    Lampa.Controller.toggle('settings_component');
                } else {
                    Lampa.Select.show({
                        title: 'Прибрати ' + a.id + '?',
                        items: [{ title: 'Так, прибрати', yes: true }, { title: 'Скасувати' }],
                        onSelect: function (b) {
                            if (b.yes) api('del=' + encodeURIComponent(a.id), showOwners);
                            else owners();
                        },
                        onBack: owners
                    });
                }
            },
            onBack: function () { Lampa.Controller.toggle('settings_component'); }
        });
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
            param: { name: COMPONENT + '_owners', type: 'button' },
            field: { name: 'Свої пристрої', description: 'Додати або прибрати ID (працює лише на своєму пристрої)' },
            onChange: owners
        });

        Lampa.SettingsApi.addParam({
            component: COMPONENT,
            param: { name: COMPONENT + '_tip', type: 'title' },
            field: { name: 'Цей ID свій на кожному пристрої і не переходить через CUB' }
        });
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });
})();
