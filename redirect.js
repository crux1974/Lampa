/*!
 * Заміна адреси Lampa — для телевізорів (Tizen, WebOS, Android TV),
 * де в застосунку немає поля для адреси сервера.
 *
 * Після запуску Lampa плагін перевіряє, чи доступний ваш сервер,
 * і переходить на нього. Пульт: будь-яка кнопка під час відліку — скасувати.
 * Налаштування: Налаштування → «Заміна адреси Lampa».
 * Встановлення: Налаштування → Розширення → Додати плагін → URL цього файлу.
 */
(function () {
    'use strict';

    if (window.lampa_redirect_plugin) return;
    window.lampa_redirect_plugin = true;

    var VERSION = '1.0.0';
    var ID = 'lredirect';
    var DEFAULT_URL = 'https://92-5-178-165.sslip.io';
    var DELAY = 5; // секунд на відлік

    var T = {
        title:     'Заміна адреси Lampa',
        enable:    'Переходити на мій сервер',
        enable_d:  'Після запуску Lampa автоматично відкривається ваш сервер',
        url:       'Адреса сервера',
        url_d:     'Наприклад: https://92-5-178-165.sslip.io',
        check:     'Перевіряти, чи сервер працює',
        check_d:   'Якщо сервер не відповідає — лишатися тут, а не відкривати порожню сторінку',
        go:        'Перейти зараз',
        countdown: 'Переходжу на {url} через {n} с. Натисніть будь-яку кнопку, щоб скасувати',
        canceled:  'Перехід скасовано',
        offline:   'Сервер {url} не відповідає — лишаюся тут',
        here:      'Ви вже на своєму сервері',
        bad:       'Вкажіть адресу сервера в налаштуваннях'
    };

    function t(k) { return T[k] || k; }

    function opt(name, def) {
        var v = Lampa.Storage.get(ID + '_' + name, def);
        if (v === 'true') return true;
        if (v === 'false') return false;
        return v;
    }

    function targetUrl() {
        var u = ((opt('url', DEFAULT_URL) || '') + '').replace(/^\s+|\s+$/g, '').replace(/\/+$/, '');
        if (!u) return '';
        if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
        return u;
    }

    function host(u) {
        var m = (u || '').match(/^https?:\/\/([^\/?#]+)/i);
        return m ? m[1].toLowerCase() : '';
    }

    /* Ми вже на цьому сервері? Тоді нічого не робимо — без нескінченного циклу */
    function alreadyThere(u) {
        return host(u) && host(u) === (window.location.host || '').toLowerCase();
    }

    /* Чи живий сервер: fetch у режимі no-cors відповідає, якщо сервер хоч щось віддав */
    function ping(u, done) {
        if (!opt('check', true) || typeof fetch !== 'function') return done(true);

        var finished = false;
        var timer = setTimeout(function () { if (!finished) { finished = true; done(false); } }, 6000);

        try {
            fetch(u + '/?ping=' + Date.now(), { mode: 'no-cors', cache: 'no-store' }).then(function () {
                if (finished) return;
                finished = true; clearTimeout(timer); done(true);
            }, function () {
                if (finished) return;
                finished = true; clearTimeout(timer); done(false);
            });
        } catch (e) {
            finished = true; clearTimeout(timer); done(true);
        }
    }

    function navigate(u) {
        try { window.location.replace(u); }
        catch (e) {
            try { window.location.href = u; } catch (e2) { window.open(u, '_self'); }
        }
    }

    /* Відлік із можливістю скасувати будь-якою кнопкою пульта */
    function countdown(u) {
        var n = DELAY;
        var canceled = false;

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
            Lampa.Noty.show(t('countdown').replace('{url}', host(u)).replace('{n}', n));
            n--;
        }

        document.addEventListener('keydown', cancel, true);
        var timer = setInterval(tick, 1000);
        tick();
    }

    function run(manual) {
        var u = targetUrl();
        if (!u) { if (manual) Lampa.Noty.show(t('bad')); return; }
        if (alreadyThere(u)) { if (manual) Lampa.Noty.show(t('here')); return; }

        ping(u, function (ok) {
            if (!ok) return Lampa.Noty.show(t('offline').replace('{url}', host(u)));
            if (manual) navigate(u);
            else countdown(u);
        });
    }

    function addSettings() {
        Lampa.SettingsApi.addComponent({
            component: ID,
            name: t('title'),
            icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2.5" y="4" width="19" height="13" rx="2" stroke="currentColor" stroke-width="2"/><path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M9 10.5h6m-2.5-2.5L15 10.5 12.5 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        });

        Lampa.SettingsApi.addParam({
            component: ID,
            param: { name: ID + '_enable', type: 'trigger', 'default': true },
            field: { name: t('enable'), description: t('enable_d') }
        });

        Lampa.SettingsApi.addParam({
            component: ID,
            param: { name: ID + '_url', type: 'input', values: '', 'default': DEFAULT_URL, placeholder: DEFAULT_URL },
            field: { name: t('url'), description: t('url_d') }
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
            onChange: function () { run(true); }
        });
    }

    function start() {
        addSettings();
        console.log('Заміна адреси Lampa', VERSION, 'завантажено');
        if (opt('enable', true)) setTimeout(function () { run(false); }, 1500);
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });
})();
