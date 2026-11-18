/*!
 * TorrServer-помічник для Lampa:
 *   • вибір TorrServer зі списку — вибраний одразу стає основним посиланням;
 *   • свіжі відкриті трекери з ngosang/trackerslist
 * https://github.com/ngosang/trackerslist
 *
 * Додає трекери до magnet-посилань роздач ще до запуску в TorrServer,
 * тож роздачі швидше знаходять роздавачів і рідше зупиняються.
 * Налаштування: Налаштування → TorrServer → «Вибір TorrServer» і «Трекери».
 * Встановлення: Налаштування → Розширення → Додати плагін → URL до цього файлу.
 */
(function () {
    'use strict';

    if (window.lampa_trackers_plugin) return;
    window.lampa_trackers_plugin = true;

    var VERSION = '1.2.0';
    var ID = 'ngtrackers';
    var OLD = 'lampa_style'; // налаштування зі «Стильного інтерфейсу» до 1.9.2
    var COMPONENT = 'server'; // вбудований розділ «TorrServer»

    var UA = {
        ts_title:     'Вибір TorrServer',
        ts_pick:      'Вибрати TorrServer',
        ts_now:       'Зараз основний: {url}',
        ts_none:      'Основне посилання не вказано',
        ts_list:      'Мої TorrServer',
        ts_checking:  'Перевіряю сервери…',
        ts_main:      'основний зараз',
        ts_ok:        'працює',
        ts_off:       'не відповідає',
        ts_add:       '+ Додати адресу',
        ts_add_d:     'Наприклад: 192.168.1.10:8090',
        ts_add_title: 'Адреса TorrServer',
        ts_long:      'Довге натискання — прибрати зі списку',
        ts_set:       'Основний TorrServer: {url}',
        ts_removed:   'Прибрано зі списку: {url}',
        ts_auto:      'Вибране посилання — завжди основне',
        ts_auto_d:    'Якщо в «Використовувати посилання» вибрати додаткове, воно одразу стане основним',
        title:      'Трекери (ngosang/trackerslist)',
        enable:     'Додавати трекери до роздач',
        enable_d:   'Свіжі відкриті трекери дописуються в magnet-посилання — роздачі швидше стартують',
        list:       'Список трекерів',
        best:       'Найкращі (рекомендовано)',
        all:        'Усі',
        best_ip:    'Найкращі за IP (якщо проблеми з DNS)',
        all_udp:    'Лише UDP',
        all_http:   'Лише HTTP (якщо UDP заблоковано)',
        show:       'Вибрати трекери',
        show_d:     'Трекерів: {n} · оновлено {date}',
        show_none:  'Список ще не завантажено',
        update:     'Оновити список зараз',
        loading:    'Завантажую список трекерів…',
        ok:         'Трекерів у списку: {n}',
        fail:       'Не вдалося завантажити список трекерів',
        list_title: 'Трекери: увімкнено {on} з {n} · оновлено {date}',
        list_hint:  'Галочка — трекер дописується в кожну роздачу. Це не адреса TorrServer',
        all_on:     'Увімкнути всі',
        all_off:    'Вимкнути всі',
        show_d2:    'Увімкнено {on} з {n} · оновлено {date}'
    };

    function t(k) { return UA[k] || k; }

    var TTL = 1000 * 60 * 60 * 24; // список оновлюється раз на добу
    var trackers = [];
    var pending = [];

    /* ---------------- налаштування (з перенесенням старих) ---------------- */

    function get(name, def) {
        var v = Lampa.Storage.get(ID + '_' + name, null);
        if (v === null || v === undefined || v === '') {
            var old = Lampa.Storage.get(OLD + '_' + name, null);
            if (old !== null && old !== undefined && old !== '') return old;
            return def;
        }
        return v;
    }

    function enabled() {
        var v = get('trackers', true);
        return !(v === false || v === 'false');
    }

    function listName() {
        var v = get('trackers_list', 'best') + '';
        return UA[v] ? v : 'best';
    }

    function cache() {
        var c = Lampa.Storage.get(ID + '_cache', null);
        if (!c || !c.items) c = Lampa.Storage.get(OLD + '_trackers_cache', null);
        return c && c.items ? c : {};
    }

    function fmtDate(ms) {
        if (!ms) return '—';
        var d = new Date(ms);
        function p(n) { return n < 10 ? '0' + n : n; }
        return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
    }

    /* ---------------- завантаження списку ---------------- */

    function sources(list) {
        var file = 'trackers_' + list + '.txt';
        return [
            'https://cdn.jsdelivr.net/gh/ngosang/trackerslist@master/' + file,
            'https://ngosang.github.io/trackerslist/' + file,
            'https://raw.githubusercontent.com/ngosang/trackerslist/master/' + file
        ];
    }

    function parse(text) {
        var out = [];
        (text || '').split(/\r?\n/).forEach(function (line) {
            line = line.replace(/^\s+|\s+$/g, '');
            if (/^(udp|https?|wss?):\/\/\S+$/i.test(line) && out.indexOf(line) < 0) out.push(line);
        });
        return out;
    }

    function getText(url, ok, fail) {
        try {
            var x = new XMLHttpRequest();
            x.open('GET', url, true);
            x.timeout = 15000;
            x.onload = function () { if (x.status >= 200 && x.status < 300) ok(x.responseText); else fail(); };
            x.onerror = x.ontimeout = function () { fail(); };
            x.send();
        } catch (e) { fail(); }
    }

    function load(force, notify, done) {
        var list = listName();
        var saved = cache();

        if (!force && saved.list === list && saved.items && saved.items.length && Date.now() - saved.time < TTL) {
            trackers = saved.items;
            flush();
            if (done) done(true);
            return;
        }

        if (saved.items && saved.items.length) trackers = saved.items;
        if (notify) Lampa.Noty.show(t('loading'));

        var urls = sources(list);
        var i = 0;

        (function next() {
            if (i >= urls.length) {
                if (notify) Lampa.Noty.show(t('fail'));
                flush();
                if (done) done(false);
                return;
            }
            getText(urls[i++], function (text) {
                var items = parse(text);
                if (!items.length) return next();
                trackers = items;
                Lampa.Storage.set(ID + '_cache', { time: Date.now(), list: list, items: items });
                if (notify) Lampa.Noty.show(t('ok').replace('{n}', items.length));
                flush();
                if (done) done(true);
            }, next);
        })();
    }

    /* ---------------- вимкнені вручну трекери ---------------- */

    function disabled() {
        var list = Lampa.Storage.get(ID + '_disabled', '[]');
        if (typeof list === 'string') { try { list = JSON.parse(list); } catch (e) { list = []; } }
        return Array.isArray(list) ? list : [];
    }

    function setDisabled(list) {
        Lampa.Storage.set(ID + '_disabled', list, true);
    }

    function activeTrackers() {
        var off = disabled();
        return trackers.filter(function (tr) { return off.indexOf(tr) < 0; });
    }

    /* ---------------- дописуємо трекери в magnet ---------------- */

    function addTo(element) {
        if (!element || !enabled()) return;
        if (!trackers.length) { if (pending.indexOf(element) < 0) pending.push(element); return; }

        ['MagnetUri', 'Link'].forEach(function (prop) {
            var link = element[prop];
            if (typeof link !== 'string' || link.indexOf('magnet:') !== 0) return;

            var have = {};
            link.replace(/[?&]tr=([^&]+)/g, function (all, tr) {
                try { have[decodeURIComponent(tr).toLowerCase()] = true; } catch (e) { have[tr.toLowerCase()] = true; }
                return all;
            });

            var use = activeTrackers();
            var add = '';
            for (var k = 0; k < use.length; k++) {
                if (!have[use[k].toLowerCase()]) add += '&tr=' + encodeURIComponent(use[k]);
            }
            if (add) element[prop] = link + (link.indexOf('?') < 0 ? '?' : '') + add;
        });
    }

    function flush() {
        if (!trackers.length) return;
        var list = pending;
        pending = [];
        for (var i = 0; i < list.length; i++) addTo(list[i]);
    }

    /* ---------------- показати список ---------------- */

    function infoLine() {
        var c = cache();
        if (!c.items || !c.items.length) return t('show_none');
        var off = disabled();
        var on = c.items.filter(function (tr) { return off.indexOf(tr) < 0; }).length;
        return t('show_d2').replace('{on}', on).replace('{n}', c.items.length).replace('{date}', fmtDate(c.time));
    }

    function showList() {
        load(false, false, function () {
            var c = cache();
            var all = c.items || trackers;
            if (!all.length) return Lampa.Noty.show(t('fail'));

            var off = disabled();

            function title() {
                var on = all.filter(function (tr) { return off.indexOf(tr) < 0; }).length;
                return t('list_title').replace('{on}', on).replace('{n}', all.length).replace('{date}', fmtDate(c.time));
            }

            function open() {
                var items = [
                    { title: t('list_hint'), separator: true },
                    { title: t('all_on'), bulk: 'on' },
                    { title: t('all_off'), bulk: 'off' }
                ];

                all.forEach(function (tr) {
                    items.push({
                        title: tr.replace(/^[a-z]+:\/\//i, '').replace(/\/announce$/i, ''),
                        subtitle: (tr.split(':')[0] || '').toUpperCase(),
                        tracker: tr,
                        checkbox: true,
                        checked: off.indexOf(tr) < 0
                    });
                });

                Lampa.Select.show({
                    title: title(),
                    items: items,
                    onCheck: function (a) {
                        if (!a.tracker) return;
                        var i = off.indexOf(a.tracker);
                        if (a.checked && i >= 0) off.splice(i, 1);
                        if (!a.checked && i < 0) off.push(a.tracker);
                        setDisabled(off);
                    },
                    onSelect: function (a) {
                        if (!a.bulk) return;
                        off = a.bulk === 'off' ? all.slice() : [];
                        setDisabled(off);
                        Lampa.Controller.toggle('settings_component');
                        setTimeout(open, 50); // перемалювати галочки
                    },
                    onBack: function () {
                        Lampa.Controller.toggle('settings_component');
                        refreshSettings(); // оновити «Увімкнено N з M»
                    }
                });
            }

            open();
        });
    }

    /* ---------------- вибір TorrServer ---------------- */

    function normUrl(url) {
        url = ((url || '') + '').replace(/^\s+|\s+$/g, '').replace(/\/+$/, '');
        if (!url) return '';
        if (!/^https?:\/\//i.test(url)) url = 'http://' + url;
        return url;
    }

    function servers() {
        var list = Lampa.Storage.get(ID + '_servers', '[]');
        if (typeof list === 'string') { try { list = JSON.parse(list); } catch (e) { list = []; } }
        return Array.isArray(list) ? list : [];
    }

    function remember(url) {
        url = normUrl(url);
        if (!url) return;
        var list = servers();
        for (var i = 0; i < list.length; i++) if (normUrl(list[i]) === url) return;
        list.push(url);
        Lampa.Storage.set(ID + '_servers', list, true);
    }

    function forget(url) {
        url = normUrl(url);
        Lampa.Storage.set(ID + '_servers', servers().filter(function (u) { return normUrl(u) !== url; }), true);
    }

    function mainUrl() {
        return normUrl(Lampa.Storage.get('torrserver_url', ''));
    }

    function refreshSettings() {
        try { if (Lampa.Settings && Lampa.Settings.update) Lampa.Settings.update(); } catch (e) {}
    }

    /* Вибраний сервер — основне посилання; попередній основний — у додаткове */
    var swapping = false;

    function setMain(url) {
        url = normUrl(url);
        if (!url) return;

        var old = mainUrl();
        swapping = true;
        if (old && old !== url) Lampa.Storage.set('torrserver_url_two', old);
        Lampa.Storage.set('torrserver_url', url);
        Lampa.Storage.set('torrserver_use_link', 'one');
        swapping = false;

        remember(url);
        Lampa.Noty.show(t('ts_set').replace('{url}', url));
        refreshSettings();
    }

    /* Чи відповідає TorrServer (у нього є адреса /echo, що повертає версію) */
    function ping(url, done) {
        try {
            var x = new XMLHttpRequest();
            x.open('GET', normUrl(url) + '/echo', true);
            x.timeout = 4000;
            x.onload = function () { done(x.status >= 200 && x.status < 300 ? (x.responseText || '').slice(0, 30) : null); };
            x.onerror = x.ontimeout = function () { done(null); };
            x.send();
        } catch (e) { done(null); }
    }

    function addServer() {
        Lampa.Input.edit({ title: t('ts_add_title'), value: '', free: true, nosave: true, nomic: true }, function (value) {
            var url = normUrl(value);
            if (url) setMain(url);
            else Lampa.Controller.toggle('settings_component');
        });
    }

    function pickServer() {
        remember(Lampa.Storage.get('torrserver_url', ''));
        remember(Lampa.Storage.get('torrserver_url_two', ''));

        var list = servers();
        var status = {};
        var left = list.length;

        if (list.length) Lampa.Noty.show(t('ts_checking'));

        function show() {
            var main = mainUrl();
            var items = list.map(function (url) {
                var st = status[url];
                var parts = [];
                if (normUrl(url) === main) parts.push('✓ ' + t('ts_main'));
                parts.push(st ? t('ts_ok') + ' · ' + st : t('ts_off'));
                return { title: url.replace(/^https?:\/\//i, ''), subtitle: parts.join(' · '), url: url, selected: normUrl(url) === main };
            });
            items.push({ title: t('ts_add'), subtitle: list.length ? t('ts_long') : t('ts_add_d'), add: true });

            Lampa.Select.show({
                title: t('ts_list'),
                items: items,
                onSelect: function (a) {
                    if (a.add) addServer();
                    else { Lampa.Controller.toggle('settings_component'); setMain(a.url); }
                },
                onLong: function (a) {
                    if (a.add || !a.url) return;
                    forget(a.url);
                    Lampa.Noty.show(t('ts_removed').replace('{url}', a.url));
                    Lampa.Controller.toggle('settings_component');
                    setTimeout(pickServer, 50);
                },
                onBack: function () { Lampa.Controller.toggle('settings_component'); }
            });
        }

        if (!left) return show();
        list.forEach(function (url) {
            ping(url, function (ver) {
                status[url] = ver;
                if (--left === 0) show();
            });
        });
    }

    /* Якщо в Lampa вибрали «додаткове посилання» — робимо його основним */
    function watchStorage() {
        if (!Lampa.Storage.listener || !Lampa.Storage.listener.follow) return;

        Lampa.Storage.listener.follow('change', function (e) {
            if (swapping || !e) return;

            if (e.name === 'torrserver_url' || e.name === 'torrserver_url_two') remember(e.value);

            if (e.name === 'torrserver_use_link' && e.value === 'two' && autoMain()) {
                var two = normUrl(Lampa.Storage.get('torrserver_url_two', ''));
                if (two) setTimeout(function () { setMain(two); }, 0);
            }
        });
    }

    function autoMain() {
        var v = Lampa.Storage.get(ID + '_auto_main', true);
        return !(v === false || v === 'false');
    }

    /* ---------------- пункти в розділі «TorrServer» ---------------- */

    function addSettings() {
        var lists = {};
        ['best', 'all', 'best_ip', 'all_udp', 'all_http'].forEach(function (k) { lists[k] = t(k); });

        Lampa.SettingsApi.addParam({
            component: COMPONENT,
            param: { name: ID + '_ts_title', type: 'title' },
            field: { name: t('ts_title') }
        });

        Lampa.SettingsApi.addParam({
            component: COMPONENT,
            param: { name: ID + '_pick', type: 'button' },
            field: { name: t('ts_pick'), description: t('ts_none') },
            onRender: function (item) {
                var d = item.find ? item.find('.settings-param__descr') : null;
                var url = mainUrl();
                if (d && d.length) d.text(url ? t('ts_now').replace('{url}', url.replace(/^https?:\/\//i, '')) : t('ts_none'));
            },
            onChange: pickServer
        });

        Lampa.SettingsApi.addParam({
            component: COMPONENT,
            param: { name: ID + '_auto_main', type: 'trigger', 'default': true },
            field: { name: t('ts_auto'), description: t('ts_auto_d') }
        });

        Lampa.SettingsApi.addParam({
            component: COMPONENT,
            param: { name: ID + '_title', type: 'title' },
            field: { name: t('title') }
        });

        Lampa.SettingsApi.addParam({
            component: COMPONENT,
            param: { name: ID + '_trackers', type: 'trigger', 'default': enabled() },
            field: { name: t('enable'), description: t('enable_d') },
            onChange: function () { if (enabled()) load(false, false); }
        });

        Lampa.SettingsApi.addParam({
            component: COMPONENT,
            param: { name: ID + '_trackers_list', type: 'select', values: lists, 'default': listName() },
            field: { name: t('list') },
            onChange: function () { load(true, true); }
        });

        Lampa.SettingsApi.addParam({
            component: COMPONENT,
            param: { name: ID + '_show', type: 'button' },
            field: { name: t('show'), description: infoLine() },
            onRender: function (item) {
                // опис завжди свіжий: скільки трекерів і коли оновлено
                var d = item.find ? item.find('.settings-param__descr') : null;
                if (d && d.length) d.text(infoLine());
            },
            onChange: showList
        });

        Lampa.SettingsApi.addParam({
            component: COMPONENT,
            param: { name: ID + '_update', type: 'button' },
            field: { name: t('update') },
            onChange: function () { load(true, true); }
        });
    }

    /* ---------------- старт ---------------- */

    function start() {
        addSettings();
        remember(Lampa.Storage.get('torrserver_url', ''));
        remember(Lampa.Storage.get('torrserver_url_two', ''));
        watchStorage();

        Lampa.Listener.follow('torrent', function (e) {
            // «onenter» приходить уже після старту роздачі, тому — під час показу рядка
            if ((e.type === 'render' || e.type === 'onlong') && e.element) addTo(e.element);
        });

        if (enabled()) load(false, false);
        console.log('TorrServer-помічник', VERSION, 'завантажено');
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });
})();
