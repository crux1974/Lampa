/*!
 * Заміна адреси Lampa — для телевізорів (Tizen, WebOS, Android TV),
 * де в застосунку немає поля для адреси сервера.
 *
 * • Пункт «Адреса Lampa» в головному меню і значок угорі екрана.
 * • Список адрес: вибрати, додати, змінити, видалити.
 * • Вибрана або щойно збережена адреса відкривається одразу.
 * • Автоперехід під час запуску (будь-яка кнопка пульта — скасувати).
 *
 * Встановлення: Налаштування → Розширення → Додати плагін → URL цього файлу.
 */
(function () {
    'use strict';

    if (window.lampa_redirect_plugin) return;
    window.lampa_redirect_plugin = true;

    var VERSION = '2.0.0';
    var ID = 'lredirect';
    var DEFAULT_URL = 'https://92-5-178-165.sslip.io';
    var DELAY = 5;

    var T = {
        title:       'Адреса Lampa',
        settings:    'Заміна адреси Lampa',
        list:        'Мої адреси',
        list_d:      'Вибрати, додати, змінити або видалити адресу',
        add:         '+ Додати адресу',
        add_title:   'Нова адреса Lampa',
        edit_title:  'Змінити адресу',
        edit:        'Змінити',
        del:         'Видалити',
        make_main:   'Зробити основною (без переходу)',
        hint:        'Довге натискання — змінити або видалити',
        active:      'основна',
        here:        'ви зараз тут',
        online:      'працює',
        offline_s:   'не відповідає',
        checking:    'Перевіряю адреси…',
        auto:        'Переходити під час запуску',
        auto_d:      'Після запуску Lampa автоматично відкривається основна адреса',
        auto_on:     'Автоперехід: увімкнено',
        auto_off:    'Автоперехід: вимкнено',
        check:       'Перевіряти, чи сервер працює',
        check_d:     'Якщо сервер не відповідає — лишатися тут, а не відкривати порожню сторінку',
        url:         'Основна адреса',
        url_d:       'Після збереження Lampa одразу відкриється з цієї адреси',
        go:          'Перейти зараз',
        going:       'Відкриваю {url}…',
        countdown:   'Переходжу на {url} через {n} с. Натисніть будь-яку кнопку, щоб скасувати',
        canceled:    'Перехід скасовано',
        offline:     'Сервер {url} не відповідає — лишаюся тут',
        already:     'Ви вже на цій адресі',
        bad:         'Невірна адреса',
        deleted:     'Видалено: {url}',
        saved_main:  'Основна адреса: {url}'
    };

    function t(k) { return T[k] || k; }

    var ICON = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2.5" y="4" width="19" height="13" rx="2" stroke="currentColor" stroke-width="2"/><path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M9 10.5h6m-2.5-2.5L15 10.5 12.5 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    /* ---------------- збережені дані ---------------- */

    function opt(name, def) {
        var v = Lampa.Storage.get(ID + '_' + name, def);
        if (v === 'true') return true;
        if (v === 'false') return false;
        return v;
    }

    function norm(u) {
        u = ((u || '') + '').replace(/^\s+|\s+$/g, '').replace(/\/+$/, '');
        if (!u) return '';
        if (!/^https?:\/\//i.test(u)) u = (/^(\d+\.){3}\d+|localhost/i.test(u) ? 'http://' : 'https://') + u;
        return /^https?:\/\/[^\s\/?#]+/i.test(u) ? u : '';
    }

    function host(u) {
        var m = (u || '').match(/^https?:\/\/([^\/?#]+)/i);
        return m ? m[1].toLowerCase() : '';
    }

    function short(u) { return (u || '').replace(/^https?:\/\//i, ''); }

    function mainUrl() { return norm(opt('url', DEFAULT_URL)); }

    function setMain(u) {
        Lampa.Storage.set(ID + '_url', u, true);
        remember(u);
    }

    function list() {
        var l = Lampa.Storage.get(ID + '_list', '[]');
        if (typeof l === 'string') { try { l = JSON.parse(l); } catch (e) { l = []; } }
        if (!Array.isArray(l)) l = [];
        var main = mainUrl();
        if (main && l.indexOf(main) < 0) l.unshift(main);
        return l;
    }

    function saveList(l) { Lampa.Storage.set(ID + '_list', l, true); }

    function remember(u) {
        u = norm(u);
        if (!u) return;
        var l = list();
        if (l.indexOf(u) < 0) l.push(u);
        saveList(l);
    }

    function isHere(u) { return host(u) && host(u) === (window.location.host || '').toLowerCase(); }

    /* ---------------- перевірка й перехід ---------------- */

    function ping(u, done) {
        if (typeof fetch !== 'function') return done(null);
        var finished = false;
        var timer = setTimeout(function () { if (!finished) { finished = true; done(false); } }, 4000);
        try {
            fetch(u + '/?ping=' + Date.now(), { mode: 'no-cors', cache: 'no-store' }).then(function () {
                if (!finished) { finished = true; clearTimeout(timer); done(true); }
            }, function () {
                if (!finished) { finished = true; clearTimeout(timer); done(false); }
            });
        } catch (e) { finished = true; clearTimeout(timer); done(null); }
    }

    function navigate(u) {
        Lampa.Noty.show(t('going').replace('{url}', short(u)));
        setTimeout(function () {
            try { window.location.replace(u); }
            catch (e) { try { window.location.href = u; } catch (e2) { window.open(u, '_self'); } }
        }, 300);
    }

    /* Відкрити адресу одразу (з перевіркою, якщо вона ввімкнена) */
    function openNow(u) {
        u = norm(u);
        if (!u) return Lampa.Noty.show(t('bad'));
        if (isHere(u)) return Lampa.Noty.show(t('already'));

        if (opt('check', true) === false) return navigate(u);
        ping(u, function (ok) {
            if (ok === false) Lampa.Noty.show(t('offline').replace('{url}', short(u)));
            else navigate(u);
        });
    }

    /* Автоперехід під час запуску — з відліком і скасуванням з пульта */
    function autoRun() {
        var u = mainUrl();
        if (!u || isHere(u)) return;

        var go = function () {
            var n = DELAY, canceled = false, timer;

            function cancel(e) {
                if (canceled) return;
                canceled = true;
                clearInterval(timer);
                document.removeEventListener('keydown', cancel, true);
                if (e && e.preventDefault) { e.preventDefault(); e.stopPropagation(); }
                Lampa.Noty.show(t('canceled'));
            }

            function tick() {
                if (canceled) return;
                if (n <= 0) {
                    clearInterval(timer);
                    document.removeEventListener('keydown', cancel, true);
                    navigate(u);
                    return;
                }
                Lampa.Noty.show(t('countdown').replace('{url}', short(u)).replace('{n}', n));
                n--;
            }

            document.addEventListener('keydown', cancel, true);
            timer = setInterval(tick, 1000);
            tick();
        };

        if (opt('check', true) === false) return go();
        ping(u, function (ok) {
            if (ok === false) Lampa.Noty.show(t('offline').replace('{url}', short(u)));
            else go();
        });
    }

    /* ---------------- меню адрес ---------------- */

    function controllerName() {
        try { return Lampa.Controller.enabled().name; } catch (e) { return 'content'; }
    }

    function back(name) {
        try { Lampa.Controller.toggle(name || 'content'); } catch (e) {}
    }

    function input(title, value, done) {
        Lampa.Input.edit({ title: title, value: value || '', free: true, nosave: true, nomic: true }, function (v) {
            done(norm(v), (v || '').replace(/^\s+|\s+$/g, ''));
        });
    }

    function addAddress(from) {
        input(t('add_title'), 'https://', function (u, raw) {
            if (!raw || raw === 'https://') return back(from);
            if (!u) { Lampa.Noty.show(t('bad')); return back(from); }
            setMain(u);
            back(from);
            openNow(u); // щойно збережена адреса відкривається одразу
        });
    }

    function editAddress(old, from) {
        input(t('edit_title'), old, function (u, raw) {
            if (!raw) return back(from);
            if (!u) { Lampa.Noty.show(t('bad')); return back(from); }
            var l = list().map(function (x) { return x === old ? u : x; });
            var uniq = [];
            l.forEach(function (x) { if (uniq.indexOf(x) < 0) uniq.push(x); });
            saveList(uniq);
            if (mainUrl() === old) Lampa.Storage.set(ID + '_url', u, true);
            back(from);
            setTimeout(function () { showMenu(from); }, 50);
        });
    }

    function deleteAddress(u, from) {
        saveList(list().filter(function (x) { return x !== u; }));
        if (mainUrl() === u) {
            var rest = list().filter(function (x) { return x !== u; });
            Lampa.Storage.set(ID + '_url', rest[0] || '', true);
        }
        Lampa.Noty.show(t('deleted').replace('{url}', short(u)));
        setTimeout(function () { showMenu(from); }, 50);
    }

    function itemMenu(u, from) {
        Lampa.Select.show({
            title: short(u),
            items: [
                { title: t('make_main'), act: 'main' },
                { title: t('edit'), act: 'edit' },
                { title: t('del'), act: 'del' }
            ],
            onSelect: function (a) {
                if (a.act === 'main') {
                    setMain(u);
                    Lampa.Noty.show(t('saved_main').replace('{url}', short(u)));
                    back(from);
                } else if (a.act === 'edit') editAddress(u, from);
                else if (a.act === 'del') { back(from); deleteAddress(u, from); }
            },
            onBack: function () { setTimeout(function () { showMenu(from); }, 50); }
        });
    }

    function showMenu(from) {
        from = from || controllerName();
        var l = list();
        var status = {};
        var left = l.length;

        function render() {
            var main = mainUrl();
            var items = l.map(function (u) {
                var parts = [];
                if (u === main) parts.push('✓ ' + t('active'));
                if (isHere(u)) parts.push(t('here'));
                if (status[u] === true) parts.push(t('online'));
                if (status[u] === false) parts.push(t('offline_s'));
                return { title: short(u), subtitle: parts.join(' · '), url: u, selected: u === main };
            });

            items.push({ title: t('add'), subtitle: l.length ? t('hint') : '', add: true });
            items.push({ title: opt('enable', true) === false ? t('auto_off') : t('auto_on'), toggle: true });

            Lampa.Select.show({
                title: t('title'),
                items: items,
                onSelect: function (a) {
                    if (a.add) return addAddress(from);
                    if (a.toggle) {
                        Lampa.Storage.set(ID + '_enable', opt('enable', true) === false, true);
                        return setTimeout(function () { showMenu(from); }, 50);
                    }
                    setMain(a.url);
                    back(from);
                    openNow(a.url); // вибрана адреса відкривається одразу
                },
                onLong: function (a) {
                    if (a.url) itemMenu(a.url, from);
                },
                onBack: function () { back(from); }
            });
        }

        if (!l.length || typeof fetch !== 'function') return render();

        Lampa.Noty.show(t('checking'));
        l.forEach(function (u) {
            ping(u, function (ok) {
                status[u] = ok;
                if (--left === 0) render();
            });
        });
    }

    /* ---------------- пункт меню і значок угорі ---------------- */

    function addMenuItem() {
        var title = t('title');
        try {
            if (Lampa.Menu && Lampa.Menu.addButton) {
                Lampa.Menu.addButton(ICON, title, function () { showMenu('menu'); });
                return;
            }
        } catch (e) {}

        // запасний шлях для старих версій Lampa
        var li = $('<li class="menu__item selector"><div class="menu__ico">' + ICON + '</div><div class="menu__text">' + title + '</div></li>');
        li.on('hover:enter', function () { showMenu('menu'); });
        $('.menu .menu__list').eq(0).append(li);
    }

    function addHeadIcon() {
        try {
            if (Lampa.Head && Lampa.Head.addIcon) {
                Lampa.Head.addIcon(ICON, function () { showMenu('head'); }).addClass('lredirect-head');
                return;
            }
        } catch (e) {}

        var el = $('<div class="head__action selector lredirect-head">' + ICON + '</div>');
        el.on('hover:enter', function () { showMenu('head'); });
        $('.head__actions').prepend(el);
    }

    /* ---------------- налаштування ---------------- */

    function addSettings() {
        Lampa.SettingsApi.addComponent({ component: ID, name: t('settings'), icon: ICON });

        Lampa.SettingsApi.addParam({
            component: ID,
            param: { name: ID + '_list_open', type: 'button' },
            field: { name: t('list'), description: t('list_d') },
            onChange: function () { showMenu('settings_component'); }
        });

        Lampa.SettingsApi.addParam({
            component: ID,
            param: { name: ID + '_url', type: 'input', values: '', 'default': DEFAULT_URL, placeholder: DEFAULT_URL },
            field: { name: t('url'), description: t('url_d') },
            onChange: function (v) {
                var u = norm(typeof v === 'string' ? v : Lampa.Storage.get(ID + '_url', ''));
                if (!u) return Lampa.Noty.show(t('bad'));
                setMain(u);
                openNow(u); // після збереження — одразу відкрити
            }
        });

        Lampa.SettingsApi.addParam({
            component: ID,
            param: { name: ID + '_enable', type: 'trigger', 'default': true },
            field: { name: t('auto'), description: t('auto_d') }
        });

        Lampa.SettingsApi.addParam({
            component: ID,
            param: { name: ID + '_check', type: 'trigger', 'default': true },
            field: { name: t('check'), description: t('check_d') }
        });

        Lampa.SettingsApi.addParam({
            component: ID,
            param: { name: ID + '_go', type: 'button' },
            field: { name: t('go') },
            onChange: function () { openNow(mainUrl()); }
        });
    }

    /* ---------------- старт ---------------- */

    function start() {
        remember(mainUrl());
        addSettings();
        addMenuItem();
        addHeadIcon();
        console.log('Заміна адреси Lampa', VERSION, 'завантажено');
        if (opt('enable', true) !== false) setTimeout(autoRun, 1500);
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });
})();
