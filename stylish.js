/*!
 * Стильний інтерфейс для Lampa / Lampac одним плагіном
 * Мітки на постерах, дані серіалів (сезон/серія, наступний вихід, статус),
 * великий годинник у шапці, повноекранна картка фільму.
 * Встановлення: Налаштування → Розширення → Додати плагін → URL до цього файлу.
 */
(function () {
    'use strict';

    if (window.lampa_style_plugin) return;
    window.lampa_style_plugin = true;

    var ID = 'lampa_style';
    var VERSION = '1.3.0';

    /* ------------------------------------------------------------------ */
    /*  Переклади                                                          */
    /* ------------------------------------------------------------------ */

    var UA = {
        ls_title:            'Стильний інтерфейс',
        ls_enabled:          'Увімкнути плагін',
        ls_enabled_descr:    'Застосувати новий вигляд до всього інтерфейсу',
        ls_accent:           'Колір акценту',
        ls_badges:           'Мітки на постерах',
        ls_badges_descr:     'Рейтинг, якість, рік, тип і країна — кольорова панель на постері',
        ls_style:            'Стиль міток',
        ls_style_panel:      'Неонова панель',
        ls_style_minimal:    'Мінімалістичний',
        ls_style_color:      'Кольорові плашки',
        ls_flags:            'Прапорці країн',
        ls_flags_descr:      'Показувати прапорець замість коду країни',
        ls_audio:            'Звукові доріжки на постері',
        ls_audio_descr:      'EN, UA, PL. Інші мови показуються як EN',
        ls_audio_view:       'Вигляд звукових доріжок',
        ls_audio_view_color: 'Кольорові мітки',
        ls_audio_view_flag:  'Прапорці',
        ls_audio_pos:        'Розташування звукових доріжок',
        ls_audio_pos_left:   'Лівий верхній кут',
        ls_audio_pos_right:  'Правий верхній кут',
        ls_audio_src:        'Звідки брати доріжки',
        ls_audio_src_auto:   'Автоматично (парсер, якщо налаштований)',
        ls_audio_src_tmdb:   'Лише мова оригіналу (TMDB)',
        ls_audio_src_parser: 'Торент-парсер (Lampac / Jackett)',
        ls_series:           'Дані серіалів на постерах',
        ls_series_descr:     'Остання серія, дата наступної, статус (запит до TMDB)',
        ls_clock:            'Годинник у шапці',
        ls_clock_big:        'Великий + дата',
        ls_clock_accent:     'Великий, хвилини кольором',
        ls_clock_native:     'Стандартний',
        ls_full_bg:          'Повноекранний фон у картці',
        ls_full_poster:      'Постер у картці',
        ls_full_round:       'Круглі кнопки в картці',
        ls_clear_cache:      'Очистити кеш серіалів',
        ls_cache_cleared:    'Кеш очищено',

        ls_type_tv:          'Серіал',
        ls_type_movie:       'Фільм',
        ls_today:            'Сьогодні',
        ls_tomorrow:         'Завтра',
        ls_in_days:          'Через {n} дн',
        ls_status_returning: 'Триває',
        ls_status_ended:     'Завершено',
        ls_status_canceled:  'Скасовано',
        ls_status_planned:   'Заплановано',

        c_teal: 'Бірюзовий', c_orange: 'Помаранчевий', c_purple: 'Фіолетовий',
        c_blue: 'Синій', c_red: 'Червоний', c_green: 'Зелений'
    };

    var MONTHS = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'];
    var WEEKDAYS = ['Неділя','Понеділок','Вівторок','Середа','Четвер','П\'ятниця','Субота'];

    function t(key) {
        return UA[key] || key;
    }

    /* ------------------------------------------------------------------ */
    /*  Налаштування                                                       */
    /* ------------------------------------------------------------------ */

    var ACCENTS = {
        teal:   '#2bb3a3',
        orange: '#ff9f1a',
        purple: '#9b5cf6',
        blue:   '#3b8cff',
        red:    '#ff4b55',
        green:  '#22c55e'
    };

    function opt(name) {
        return Lampa.Storage.field(ID + '_' + name);
    }

    function addSettings() {
        Lampa.SettingsApi.addComponent({
            component: ID,
            name: t('ls_title'),
            icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2.5" y="3.5" width="19" height="13" rx="2.5" stroke="currentColor" stroke-width="2"/><path d="M8 20.5h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="8" cy="10" r="2" fill="currentColor"/><path d="M12 8h6M12 12h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
        });

        function trigger(name, def, title, descr) {
            Lampa.SettingsApi.addParam({
                component: ID,
                param: { name: ID + '_' + name, type: 'trigger', 'default': def },
                field: { name: t(title), description: descr ? t(descr) : '' },
                onChange: apply
            });
        }

        trigger('enabled', true, 'ls_enabled', 'ls_enabled_descr');

        Lampa.SettingsApi.addParam({
            component: ID,
            param: {
                name: ID + '_accent',
                type: 'select',
                values: { teal: t('c_teal'), orange: t('c_orange'), purple: t('c_purple'), blue: t('c_blue'), red: t('c_red'), green: t('c_green') },
                'default': 'teal'
            },
            field: { name: t('ls_accent') },
            onChange: apply
        });

        trigger('badges', true, 'ls_badges', 'ls_badges_descr');
        Lampa.SettingsApi.addParam({
            component: ID,
            param: {
                name: ID + '_style',
                type: 'select',
                values: { panel: t('ls_style_panel'), minimal: t('ls_style_minimal'), color: t('ls_style_color') },
                'default': 'panel'
            },
            field: { name: t('ls_style') },
            onChange: function () { redecorate(); apply(); }
        });

        trigger('flags', true, 'ls_flags', 'ls_flags_descr');
        trigger('series', true, 'ls_series', 'ls_series_descr');

        trigger('audio', true, 'ls_audio', 'ls_audio_descr');

        function select(name, values, def, title) {
            Lampa.SettingsApi.addParam({
                component: ID,
                param: { name: ID + '_' + name, type: 'select', values: values, 'default': def },
                field: { name: t(title) },
                onChange: function () { redecorate(); }
            });
        }

        select('audio_view', { color: t('ls_audio_view_color'), flag: t('ls_audio_view_flag') }, 'color', 'ls_audio_view');
        select('audio_pos', { left: t('ls_audio_pos_left'), right: t('ls_audio_pos_right') }, 'left', 'ls_audio_pos');
        select('audio_src', { auto: t('ls_audio_src_auto'), tmdb: t('ls_audio_src_tmdb'), parser: t('ls_audio_src_parser') }, 'auto', 'ls_audio_src');

        Lampa.SettingsApi.addParam({
            component: ID,
            param: {
                name: ID + '_clock',
                type: 'select',
                values: { big: t('ls_clock_big'), accent: t('ls_clock_accent'), native: t('ls_clock_native') },
                'default': 'big'
            },
            field: { name: t('ls_clock') },
            onChange: apply
        });

        trigger('full_bg', true, 'ls_full_bg');
        trigger('full_poster', true, 'ls_full_poster');
        trigger('full_round', true, 'ls_full_round');

        Lampa.SettingsApi.addParam({
            component: ID,
            param: { name: ID + '_clear', type: 'button' },
            field: { name: t('ls_clear_cache') },
            onChange: function () {
                cache = {};
                saveCache();
                Lampa.Noty.show(t('ls_cache_cleared'));
            }
        });
    }

    /* ------------------------------------------------------------------ */
    /*  Стилі                                                              */
    /* ------------------------------------------------------------------ */

    var CSS = [
        /* --- мітки на постерах: кольорова панель як у стилі «★ 7.3  ◔ 4K  2025» --- */
        'body.ls-on.ls-badges .card__view > .card__type,',
        'body.ls-on.ls-badges .card__view > .card__vote,',
        'body.ls-on.ls-badges .card__view > .card__quality{display:none !important}',

        '.ls-badges-wrap{position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:3;font-family:inherit;line-height:1.1}',

        /* кутові колонки: усе, що в одному куті, стоїть одне під одним */
        '.ls-col{position:absolute;top:.5em;display:flex;flex-direction:column;max-width:60%}',
        '.ls-col--l{left:.5em;align-items:flex-start}',
        '.ls-col--r{right:.5em;align-items:flex-end}',
        '.ls-col > *{margin-bottom:.3em}',
        '.ls-badges-wrap[data-style="minimal"] .ls-col{top:2.5em}',
        '.ls-badges-wrap[data-style="color"] .ls-col > .ls-b{position:static;max-width:none;margin-bottom:.3em}',

        /* --- стиль «Неонова панель» --- */
        '.ls-chip{display:inline-flex;align-items:center;padding:.26em .5em;border-radius:.55em;background:rgba(4,4,10,.88);border:.12em solid currentColor;font-size:.8em;font-weight:800;white-space:nowrap;box-shadow:0 0 .55em -.1em currentColor,inset 0 0 .4em -.2em currentColor;text-shadow:0 0 .45em currentColor}',

        /* нижня панель — майже чорна, щоб неон світився */
        '.ls-bar{position:absolute;left:0;right:0;bottom:0;padding:.5em .6em .55em;border-radius:0 0 1em 1em;background:rgba(3,3,8,.9);border-top:1px solid rgba(255,255,255,.08);box-shadow:0 -.3em 1em rgba(0,0,0,.5)}',
        '.ls-row{display:flex;align-items:center;white-space:nowrap;overflow:hidden}',
        '.ls-row + .ls-row{margin-top:.35em}',

        /* окремий елемент: іконка + текст, з неоновим світінням */
        '.ls-i{display:inline-flex;align-items:center;font-weight:800;font-size:.95em;margin-right:.75em;flex-shrink:0;text-shadow:0 0 .5em currentColor}',
        '.ls-i:last-child{margin-right:0}',
        '.ls-i svg{width:1.2em;height:1.2em;margin-right:.25em;flex-shrink:0;-webkit-filter:drop-shadow(0 0 .25em currentColor);filter:drop-shadow(0 0 .25em currentColor)}',
        '.ls-i--right{margin-left:auto;margin-right:0}',
        '.ls-row--sub .ls-i{font-size:.82em}',

        /* неонові кольори */
        '.ls-i--vote{color:#00e5ff}',
        '.ls-i--vote.v-low{color:#ff3b5c}',
        '.ls-i--quality{color:#39ff14}',
        '.ls-i--year{color:#ffffff;font-size:1em;text-shadow:0 0 .4em rgba(255,255,255,.7)}',
        '.ls-i--country{color:#ffe600}',
        '.ls-i--ep.ep-wait{color:#ffe600}',
        '.ls-i--ep.ep-done{color:#39ff14}',
        '.ls-i--next{color:#b388ff}',
        '.ls-i--status{color:#ff9100}',
        '.ls-i--status.st-ended{color:#e0e0e0}',
        '.ls-i--status.st-canceled{color:#ff1744}',
        '.ls-i--status.st-planned{color:#18ffff}',

        /* категорії — окремі кольори */
        '.ls-i--movie,.ls-b--type.is-movie,.ls-min-tab.is-movie{color:#ff2bd6}',
        '.ls-i--tv,.ls-b--type.is-tv,.ls-min-tab.is-tv{color:#00ffa3}',

        /* звукові доріжки */
        '.ls-au{display:inline-flex;align-items:center;justify-content:center;min-width:2.2em;padding:.2em .45em;border-radius:.45em;font-size:.76em;font-weight:900;letter-spacing:.04em;background:rgba(4,4,10,.88);border:.12em solid currentColor;box-shadow:0 0 .55em -.1em currentColor;text-shadow:0 0 .45em currentColor}',
        '.ls-au--en{color:#2f9bff}',
        '.ls-au--ua{color:#ffd400}',
        '.ls-au--pl{color:#ff2e4d}',
        '.ls-au.has-flag{padding:0;min-width:0;border:none;background:none;box-shadow:none}',
        '.ls-au .ls-flag{width:2em;height:1.4em;border-radius:.25em;box-shadow:0 0 0 1px rgba(0,0,0,.5),0 0 .5em rgba(0,0,0,.6)}',

        /* --- стиль «Мінімалістичний»: темні смуги зверху і знизу, білий текст --- */
        '.ls-min-top,.ls-min-bot{position:absolute;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:0 .55em;color:#fff;font-size:.78em;font-weight:700;text-shadow:0 1px 2px rgba(0,0,0,.8);white-space:nowrap}',
        '.ls-min-top{top:0;height:2.3em;border-radius:1em 1em 0 0;background:linear-gradient(to bottom,rgba(0,0,0,.8),rgba(0,0,0,0))}',
        '.ls-min-bot{bottom:0;height:2.4em;border-radius:0 0 1em 1em;background:linear-gradient(to top,rgba(0,0,0,.85),rgba(0,0,0,0))}',
        '.ls-min-top > span,.ls-min-bot > span{flex:1 1 0;overflow:hidden;text-overflow:ellipsis}',
        '.ls-min-top > span:last-child,.ls-min-bot > span:last-child{text-align:right}',
        '.ls-min-top > .ls-min-c,.ls-min-bot > .ls-min-c{flex:0 1 auto;text-align:center;padding:0 .3em}',
        '.ls-min-tab{align-self:flex-start;padding:.25em .7em .35em;border-radius:0 0 .6em .6em;background:rgba(10,10,16,.92);font-weight:800;text-shadow:0 0 .45em currentColor}',
        '.ls-min-country{font-size:.72em;font-weight:700;color:#fff;background:rgba(0,0,0,.65);padding:.15em .35em;border-radius:.3em}',

        /* --- стиль «Кольорові плашки»: як у старій версії з відео --- */
        '.ls-b{position:absolute;padding:.18em .42em;border-radius:.3em;font-size:.8em;font-weight:700;line-height:1.15;color:#fff;white-space:nowrap;max-width:62%;overflow:hidden;text-overflow:ellipsis;box-shadow:0 .1em .4em rgba(0,0,0,.35)}',
        '.ls-b--type{top:.45em;left:.45em;background:#8e3fd8}',
        '.ls-b--type.is-movie{background:#d61fb4;color:#fff}',
        '.ls-b--type.is-tv{background:#7c3aed;color:#fff}',
        '.ls-b--vote{top:.45em;right:.45em;color:#000}',
        '.ls-b--vote.v-hi{background:#22c55e}',
        '.ls-b--vote.v-mid{background:#e5a50a}',
        '.ls-b--vote.v-low{background:#ef4444;color:#fff}',
        '.ls-b--country{top:2.35em;right:.45em;background:rgba(0,0,0,.75);font-size:.7em}',
        '.ls-b--ep{bottom:2.15em;left:.45em}',
        '.ls-b--ep.ep-done{background:#16a34a}',
        '.ls-b--ep.ep-wait{background:#facc15;color:#000}',
        '.ls-b--next{bottom:2.15em;right:.45em;background:#2f86d6}',
        '.ls-b--status{bottom:2.15em;right:.45em;background:#f08c00}',
        '.ls-b--status.st-ended{background:#6b7280}',
        '.ls-b--status.st-canceled{background:#dc2626}',
        '.ls-b--status.st-planned{background:#0891b2}',
        '.ls-b--quality{bottom:.45em;left:.45em;background:#14897b}',
        '.ls-b--year{bottom:.45em;right:.45em;background:#e08a00}',
        '.ls-b svg{width:.95em;height:.95em;vertical-align:-.14em;margin-left:.2em}',

        /* прапорці */
        '.ls-flag{display:inline-block;width:1.45em;height:1.05em;border-radius:.15em;object-fit:cover;vertical-align:middle;box-shadow:0 0 0 1px rgba(0,0,0,.35)}',
        '.ls-b--country.has-flag,.ls-min-country.has-flag{background:none;box-shadow:none;padding:0}',
        '.ls-b--country .ls-flag,.ls-min-country .ls-flag{width:1.8em;height:1.3em}',
        '.ls-i--country .ls-flag{margin-right:.3em}',

        /* --- фокус картки --- */
        'body.ls-on .card.focus .card__view::after,body.ls-on .card.hover .card__view::after{border-color:var(--ls-accent) !important;border-width:.25em !important}',
        'body.ls-on .card__view{border-radius:.8em}',
        'body.ls-on .card__img{border-radius:.8em}',
        'body.ls-on .card.focus .card__title{color:#fff}',

        /* --- годинник --- */
        'body.ls-on.ls-clock .head__time{display:none !important}',
        '.ls-hclock{display:flex;align-items:center;margin-left:1.2em;flex-shrink:0}',
        '.ls-hclock__time{font-size:2.3em;font-weight:700;line-height:1;letter-spacing:.02em;color:#fff}',
        '.ls-hclock__time .ls-min{color:inherit}',
        'body.ls-clock-accent .ls-hclock__time .ls-min{color:var(--ls-accent)}',
        '.ls-hclock__date{margin-left:.6em;font-size:.95em;line-height:1.15;color:rgba(255,255,255,.85)}',
        '.ls-hclock__week{color:rgba(255,255,255,.6);text-transform:capitalize}',

        /* --- повна картка --- */
        'body.ls-on.ls-full-bg .full-start__background{position:fixed !important;left:0 !important;top:0 !important;width:100% !important;max-width:100% !important;height:100% !important;object-fit:cover;-webkit-mask-image:none !important;mask-image:none !important;z-index:-1}',
        'body.ls-on.ls-full-bg .full-start__background.loaded{opacity:1 !important}',
        'body.ls-on.ls-full-bg .full-start__background.dim{opacity:.25 !important}',
        'body.ls-on.ls-full-bg .activity--active .full-start-new::before{content:"";position:fixed;left:0;top:0;right:0;bottom:0;z-index:-1;pointer-events:none;background:linear-gradient(to right,rgba(0,0,0,.85) 0%,rgba(0,0,0,.45) 45%,rgba(0,0,0,0) 75%),linear-gradient(to top,rgba(0,0,0,.9) 0%,rgba(0,0,0,0) 55%)}',
        'body.ls-on.ls-full-bg .full-start-new{min-height:calc(100vh - 7em);display:flex;flex-direction:column;justify-content:flex-end;box-sizing:border-box}',
        'body.ls-on.ls-full-bg .full-start-new__body{align-items:flex-end}',
        'body.ls-on .full-start-new__title{font-size:4.4em;font-weight:700;text-shadow:0 .05em .4em rgba(0,0,0,.5)}',
        'body.ls-on .full-start-new__head{font-size:1.3em}',
        'body.ls-on .full-start-new__poster{border-radius:1em;box-shadow:0 1em 3em rgba(0,0,0,.55)}',
        'body.ls-on:not(.ls-full-poster) .full-start-new__left{display:none}',

        /* мітки у рядку рейтингу */
        'body.ls-on .full-start__pg,body.ls-on .full-start__status,body.ls-on .ls-full-quality{border-radius:.35em;padding:.25em .55em;font-size:1em}',
        '.ls-full-quality{display:inline-block;margin:0 .5em;background:rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.25);font-weight:700}',

        /* кнопки */
        'body.ls-on.ls-full-round .full-start-new__buttons .full-start__button{border-radius:1em;background:rgba(0,0,0,.45);min-width:4.2em;height:4.2em;justify-content:center;padding:0 1.1em;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}',
        'body.ls-on.ls-full-round .full-start-new__buttons .full-start__button:not(.button--play) span{display:none}',
        'body.ls-on.ls-full-round .full-start-new__buttons .full-start__button.button--play{padding:0 1.6em}',
        'body.ls-on.ls-full-round .full-start-new__buttons .full-start__button.focus{background:#fff;color:#000}',

        /* реакції — «пігулки» */
        'body.ls-on .full-start-new__reactions .reaction{border-radius:2em;background:rgba(0,0,0,.45);padding:.3em .8em}'
    ].join('\n');

    function injectCss() {
        if (document.getElementById('ls-style')) return;
        var st = document.createElement('style');
        st.id = 'ls-style';
        st.textContent = CSS;
        document.head.appendChild(st);
    }

    /* ------------------------------------------------------------------ */
    /*  Застосування налаштувань                                           */
    /* ------------------------------------------------------------------ */

    function toggle(cls, on) {
        document.body.classList[on ? 'add' : 'remove'](cls);
    }

    function apply() {
        var on = opt('enabled');
        var clock = Lampa.Storage.get(ID + '_clock', 'big');

        toggle('ls-on', on);
        toggle('ls-badges', on && opt('badges'));
        toggle('ls-clock', on && clock !== 'native');
        toggle('ls-clock-accent', on && clock === 'accent');
        toggle('ls-full-bg', on && opt('full_bg'));
        toggle('ls-full-poster', opt('full_poster'));
        toggle('ls-full-round', on && opt('full_round'));

        var accent = ACCENTS[Lampa.Storage.get(ID + '_accent', 'teal')] || ACCENTS.teal;
        document.documentElement.style.setProperty('--ls-accent', accent);

        if (on && clock !== 'native') startClock(); else stopClock();

        var cards = document.querySelectorAll('.card');
        for (var i = 0; i < cards.length; i++) {
            if (on && opt('badges')) decorate(cards[i]);
            else removeBadges(cards[i]);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Годинник                                                           */
    /* ------------------------------------------------------------------ */

    var clockTimer = null;

    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function renderClock() {
        var el = document.querySelector('.ls-hclock');
        if (!el) {
            var body = document.querySelector('.head__body');
            if (!body) return;
            el = document.createElement('div');
            el.className = 'ls-hclock';
            el.innerHTML = '<div class="ls-hclock__time"></div><div class="ls-hclock__date"><div class="ls-hclock__day"></div><div class="ls-hclock__week"></div></div>';
            body.appendChild(el);
        }

        var d = new Date();
        var day = d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
        var week = WEEKDAYS[d.getDay()];

        el.querySelector('.ls-hclock__time').innerHTML = pad(d.getHours()) + ':<span class="ls-min">' + pad(d.getMinutes()) + '</span>';
        el.querySelector('.ls-hclock__day').textContent = day;
        el.querySelector('.ls-hclock__week').textContent = week;
    }

    function startClock() {
        renderClock();
        if (!clockTimer) clockTimer = setInterval(renderClock, 10 * 1000);
    }

    function stopClock() {
        clearInterval(clockTimer);
        clockTimer = null;
        var el = document.querySelector('.ls-hclock');
        if (el && el.parentNode) el.parentNode.removeChild(el);
    }

    /* ------------------------------------------------------------------ */
    /*  Кеш даних серіалів (TMDB)                                          */
    /* ------------------------------------------------------------------ */

    var CACHE_KEY = ID + '_tv_cache';
    var CACHE_TTL = 1000 * 60 * 60 * 6; // 6 годин
    var CACHE_MAX = 400;
    var cache = {};
    var saveTimer = null;

    function loadCache() {
        try { cache = Lampa.Storage.get(CACHE_KEY, '{}') || {}; } catch (e) { cache = {}; }
        if (typeof cache !== 'object') cache = {};
    }

    function saveCache() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(function () {
            var keys = Object.keys(cache);
            if (keys.length > CACHE_MAX) {
                keys.sort(function (a, b) { return cache[a].time - cache[b].time; });
                for (var i = 0; i < keys.length - CACHE_MAX; i++) delete cache[keys[i]];
            }
            Lampa.Storage.set(CACHE_KEY, cache);
        }, 1500);
    }

    var queue = [];
    var waiting = {};
    var active = 0;
    var MAX_ACTIVE = 3;
    var network = null;

    function tvInfo(id, callback) {
        var hit = cache[id];
        if (hit && Date.now() - hit.time < CACHE_TTL) return callback(hit.data);

        if (waiting[id]) return waiting[id].push(callback);
        waiting[id] = [callback];
        queue.push(id);
        pump();
    }

    function pump() {
        if (!network) network = new Lampa.Reguest();

        while (active < MAX_ACTIVE && queue.length) {
            (function (id) {
                active++;
                var url = Lampa.TMDB.api('tv/' + id + '?api_key=' + Lampa.TMDB.key() + '&language=uk');

                var done = function (json) {
                    active--;
                    var data = null;
                    try { if (typeof json === 'string') json = JSON.parse(json); } catch (e) { json = null; }

                    if (json && json.id) {
                        data = compact(json);
                        cache[id] = { time: Date.now(), data: data };
                        saveCache();
                    }

                    var cbs = waiting[id] || [];
                    delete waiting[id];
                    for (var i = 0; i < cbs.length; i++) cbs[i](data);
                    pump();
                };

                network.silent(url, done, function () { done(null); });
            })(queue.shift());
        }
    }

    function compact(j) {
        var last = j.last_episode_to_air;
        var next = j.next_episode_to_air;
        var count = 0;

        if (last && j.seasons) {
            for (var i = 0; i < j.seasons.length; i++) {
                if (j.seasons[i].season_number === last.season_number) count = j.seasons[i].episode_count;
            }
        }

        return {
            status: j.status || '',
            last: last ? { s: last.season_number, e: last.episode_number, total: count } : null,
            next: next ? next.air_date : null,
            countries: j.origin_country || []
        };
    }

    /* ------------------------------------------------------------------ */
    /*  Мітки на постерах                                                  */
    /* ------------------------------------------------------------------ */

    /* Іконки (обведення кольором тексту) */
    function svg(path) {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg>';
    }

    var ICON = {
        star:     svg('<path d="M12 2.8l2.85 5.78 6.38.93-4.62 4.5 1.09 6.35L12 17.36l-5.7 3 1.09-6.35-4.62-4.5 6.38-.93z"/>'),
        gauge:    svg('<path d="M4.2 18.5A9 9 0 1 1 19.8 18.5"/><path d="M12 14l3.2-4.2"/><circle cx="12" cy="14.6" r="1.3"/>'),
        tv:       svg('<rect x="3" y="6" width="18" height="12.5" rx="2.2"/><path d="M8.5 2.8L12 6l3.5-3.2"/>'),
        film:     svg('<rect x="3.5" y="3.5" width="17" height="17" rx="2.2"/><path d="M8 3.5v17M16 3.5v17M3.5 8.5H8M3.5 15.5H8M16 8.5h4.5M16 15.5h4.5"/>'),
        globe:    svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z"/>'),
        check:    svg('<circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.7 2.7L16.2 9.5"/>'),
        clock:    svg('<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>'),
        calendar: svg('<rect x="3.5" y="5" width="17" height="15.5" rx="2.2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
        signal:   svg('<path d="M5 12.5a7 7 0 0 1 14 0"/><path d="M8.5 12.5a3.5 3.5 0 0 1 7 0"/><circle cx="12" cy="17" r="1.6"/>')
    };

    function item(cls, icon, text) {
        var el = document.createElement('div');
        el.className = 'ls-i ls-i--' + cls;
        el.innerHTML = (icon || '') + '<span>' + esc(text) + '</span>';
        return el;
    }

    function esc(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function isTv(d) {
        return !!(d.name || d.original_name || d.first_air_date || d.number_of_seasons || d.method === 'tv' || d.media_type === 'tv');
    }

    function yearOf(d) {
        var date = d.release_date || d.first_air_date || d.last_air_date || '';
        var y = (date + '').slice(0, 4);
        return /^\d{4}$/.test(y) ? y : d.release_year && d.release_year !== '0000' ? d.release_year : '';
    }

    function countryOf(d) {
        if (d.origin_country && d.origin_country.length) return d.origin_country[0];
        if (d.production_countries && d.production_countries.length) return d.production_countries[0].iso_3166_1 || '';
        return '';
    }

    function voteClass(v) {
        return v >= 8.2 ? 'v-hi' : v >= 6.5 ? 'v-mid' : 'v-low';
    }

    function qualityOf(d) {
        var q = (d.release_quality || d.quality || '') + '';
        if (!q) return '';
        var u = q.toUpperCase();
        if (/2160|4K|UHD/.test(u)) return '4K';
        if (/1080/.test(u)) return '1080P';
        if (/720/.test(u)) return '720P';
        if (/CAM|TS\b|TELESYNC/.test(u)) return 'CAM';
        if (/WEB|BD|BLU|HDRIP|DVD/.test(u)) return u.length > 8 ? 'HD' : u;
        return u.length > 8 ? u.slice(0, 8) : u;
    }

    function daysUntil(dateStr) {
        var p = (dateStr || '').split('-');
        if (p.length < 3) return null;
        var target = new Date(+p[0], +p[1] - 1, +p[2]);
        var now = new Date();
        var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return Math.round((target - today) / 86400000);
    }

    function removeBadges(card) {
        var w = card.querySelector('.ls-badges-wrap');
        if (w && w.parentNode) w.parentNode.removeChild(w);
        card.ls_done = false;
    }

    function redecorate() {
        var cards = document.querySelectorAll('.card');
        for (var i = 0; i < cards.length; i++) {
            removeBadges(cards[i]);
            if (opt('enabled') && opt('badges')) decorate(cards[i]);
        }
    }

    function badgeStyle() {
        var st = Lampa.Storage.get(ID + '_style', 'panel');
        return st === 'minimal' || st === 'color' ? st : 'panel';
    }

    /* ---------------- Звукові доріжки: лише EN / UA / PL ---------------- */

    var AUDIO_ORDER = ['UA', 'EN', 'PL'];

    /* Будь-яка мова, крім української та польської, показується як EN */
    function langToAudio(code) {
        code = (code || '').toLowerCase();
        if (code === 'uk' || code === 'ua' || code === 'ukr') return 'UA';
        if (code === 'pl' || code === 'pol') return 'PL';
        return 'EN';
    }

    function sortAudio(list) {
        var out = [];
        for (var i = 0; i < AUDIO_ORDER.length; i++) if (list.indexOf(AUDIO_ORDER[i]) >= 0) out.push(AUDIO_ORDER[i]);
        return out;
    }

    function addAudio(model, lang) {
        if (model.audio.indexOf(lang) < 0) model.audio.push(lang);
        model.audio = sortAudio(model.audio);
    }

    /* Розпізнаємо мову озвучки в назвах роздач */
    var RX_UA = /(\bukr\b|\bua\b|\bukrainian\b|укр|україн|украин|\bуа\b|toloka|uaflix|hdrezka\s*studio\s*ua)/i;
    var RX_PL = /(\bpl\b|\bpol\b|polish|polski|lektor|dubbing\s*pl|pl[\s\.\-_]*dub)/i;

    function parserBase() {
        var url = Lampa.Storage.get('jackett_url', '') + '';
        if (!url) return '';
        if (Lampa.Utils && Lampa.Utils.checkEmptyUrl) return Lampa.Utils.checkEmptyUrl(url);
        return /^https?:\/\//.test(url) ? url : 'http://' + url;
    }

    function useParser() {
        var src = Lampa.Storage.get(ID + '_audio_src', 'auto');
        if (src === 'tmdb') return false;
        return !!parserBase();
    }

    var aQueue = [];
    var aWaiting = {};
    var aActive = 0;
    var aNetwork = null;

    function audioInfo(data, callback) {
        var key = 'a_' + (isTv(data) ? 'tv' : 'mv') + '_' + data.id;
        var hit = cache[key];
        if (hit && Date.now() - hit.time < CACHE_TTL * 4) return callback(hit.data);

        if (aWaiting[key]) return aWaiting[key].push(callback);
        aWaiting[key] = [callback];
        aQueue.push({ key: key, data: data });
        aPump();
    }

    function aPump() {
        if (!aNetwork) aNetwork = new Lampa.Reguest();

        while (aActive < 2 && aQueue.length) {
            (function (job) {
                aActive++;
                var d = job.data;
                var tv = isTv(d);
                var title = d.title || d.name || '';
                var orig = d.original_title || d.original_name || title;
                var year = yearOf(d);

                var url = parserBase() + '/api/v2.0/indexers/all/results?apikey=' + encodeURIComponent(Lampa.Storage.get('jackett_key', '') || '') +
                    '&Query=' + encodeURIComponent(orig + (year ? ' ' + year : '')) +
                    '&title=' + encodeURIComponent(title) +
                    '&title_original=' + encodeURIComponent(orig) +
                    '&year=' + encodeURIComponent(year) +
                    '&is_serial=' + (tv ? '2' : '1') +
                    '&Category[]=' + (tv ? '5000' : '2000');

                var finish = function (json) {
                    aActive--;
                    var found = [];
                    try { if (typeof json === 'string') json = JSON.parse(json); } catch (e) { json = null; }

                    var results = json && (json.Results || json.results);
                    if (results && results.length) {
                        for (var i = 0; i < results.length && i < 200; i++) {
                            var r = results[i];
                            var text = (r.Title || r.title || '') + ' ' +
                                [].concat(r.languages || r.Languages || [], r.voices || r.Voices || []).join(' ');
                            if (found.indexOf('UA') < 0 && RX_UA.test(text)) found.push('UA');
                            if (found.indexOf('PL') < 0 && RX_PL.test(text)) found.push('PL');
                        }
                        cache[job.key] = { time: Date.now(), data: found };
                        saveCache();
                    }

                    var cbs = aWaiting[job.key] || [];
                    delete aWaiting[job.key];
                    for (var j = 0; j < cbs.length; j++) cbs[j](results ? found : null);
                    aPump();
                };

                aNetwork.timeout(15000);
                aNetwork.silent(url, finish, function () { finish(null); });
            })(aQueue.shift());
        }
    }

    function audioHtml(lang) {
        var flags = { EN: 'gb', UA: 'ua', PL: 'pl' };
        var view = Lampa.Storage.get(ID + '_audio_view', 'color');
        var cls = 'ls-au ls-au--' + lang.toLowerCase();

        if (view === 'flag') {
            return '<div class="' + cls + ' has-flag"><img class="ls-flag" src="https://flagcdn.com/w40/' + flags[lang] + '.png" alt="' + lang +
                '" onerror="this.parentNode.classList.remove(\'has-flag\');this.outerHTML=\'' + lang + '\'"></div>';
        }
        return '<div class="' + cls + '">' + lang + '</div>';
    }

    /* Збираємо все, що показуємо на постері, в одну модель */
    function buildModel(data) {
        var tv = isTv(data);
        var vote = parseFloat(data.vote_average);
        vote = vote > 0 ? Math.min(vote, 10) : 0;

        var model = {
            tv: tv,
            type: tv ? t('ls_type_tv') : t('ls_type_movie'),
            vote: vote ? vote.toFixed(1) : '',
            voteCls: vote ? voteClass(vote) : '',
            country: (countryOf(data) || '').toUpperCase(),
            quality: qualityOf(data),
            year: yearOf(data),
            ep: null,      // { text, done }
            info: null,    // { text, cls, kind: 'next' | 'status' }
            audio: []      // ['UA', 'EN', 'PL']
        };

        // оригінальна доріжка є завжди
        if (data.original_language) addAudio(model, langToAudio(data.original_language));

        return model;
    }

    function applySeries(model, info) {
        if (info.last && info.last.s) {
            var done = !!(info.last.total && info.last.e >= info.last.total);
            model.ep = {
                done: done,
                text: done ? 'S' + info.last.s : 'S' + info.last.s + ' ' + info.last.e + (info.last.total ? '/' + info.last.total : '')
            };
        }

        var n = info.next ? daysUntil(info.next) : null;

        if (n !== null && n >= 0) {
            model.info = { kind: 'next', cls: '', text: n === 0 ? t('ls_today') : n === 1 ? t('ls_tomorrow') : t('ls_in_days').replace('{n}', n) };
        } else if (info.status) {
            var s = info.status.toLowerCase();
            var key = /return|production/.test(s) ? 'returning' : /cancel/.test(s) ? 'canceled' : /end/.test(s) ? 'ended' : /plan/.test(s) ? 'planned' : '';
            if (key) model.info = { kind: 'status', cls: 'st-' + key, text: t('ls_status_' + key) };
        }
    }

    function flagHtml(code) {
        if (!code || !/^[A-Z]{2}$/.test(code)) return '';
        return '<img class="ls-flag" src="https://flagcdn.com/w40/' + code.toLowerCase() + '.png" alt="' + code + '" onerror="this.parentNode&&this.parentNode.classList.remove(\'has-flag\');this.outerHTML=\'' + code + '\'">';
    }

    function countryHtml(code) {
        return opt('flags') && flagHtml(code) ? flagHtml(code) : esc(code);
    }

    function el(tag, cls, html) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (html !== undefined) e.innerHTML = html;
        return e;
    }

    /* Кутові колонки: лівий і правий верхні кути, елементи — одне під одним */
    function corners(wrap) {
        var l = el('div', 'ls-col ls-col--l');
        var r = el('div', 'ls-col ls-col--r');
        wrap.appendChild(l);
        wrap.appendChild(r);
        return { l: l, r: r };
    }

    function putAudio(cols, m) {
        if (!opt('audio') || !m.audio.length) return;
        var col = Lampa.Storage.get(ID + '_audio_pos', 'left') === 'right' ? cols.r : cols.l;
        for (var i = 0; i < m.audio.length; i++) col.insertAdjacentHTML('beforeend', audioHtml(m.audio[i]));
    }

    /* Стиль 1 — «Неонова панель» */
    function renderPanel(wrap, m) {
        var cols = corners(wrap);

        var type = item(m.tv ? 'tv' : 'movie', m.tv ? ICON.tv : ICON.film, m.type);
        type.classList.add('ls-chip');
        cols.l.appendChild(type);

        if (m.country) {
            var flag = opt('flags') && flagHtml(m.country);
            cols.r.appendChild(el('div', 'ls-i ls-i--country ls-chip', (flag ? '' : ICON.globe) + '<span>' + countryHtml(m.country) + '</span>'));
        }

        putAudio(cols, m);

        var bar = el('div', 'ls-bar');

        if (m.ep || m.info) {
            var sub = el('div', 'ls-row ls-row--sub');
            if (m.ep) {
                var ep = item('ep', m.ep.done ? ICON.check : ICON.clock, m.ep.text);
                ep.classList.add(m.ep.done ? 'ep-done' : 'ep-wait');
                sub.appendChild(ep);
            }
            if (m.info) {
                var inf = item(m.info.kind, m.info.kind === 'next' ? ICON.calendar : ICON.signal, m.info.text);
                if (m.info.cls) inf.classList.add(m.info.cls);
                inf.classList.add('ls-i--right');
                sub.appendChild(inf);
            }
            bar.appendChild(sub);
        }

        var row = el('div', 'ls-row ls-row--main');
        if (m.vote) {
            var v = item('vote', ICON.star, m.vote);
            v.classList.add(m.voteCls);
            row.appendChild(v);
        }
        if (m.quality) row.appendChild(item('quality', ICON.gauge, m.quality));
        if (m.year) {
            var y = item('year', '', m.year);
            y.classList.add('ls-i--right');
            row.appendChild(y);
        }
        if (row.childNodes.length) bar.appendChild(row);

        if (bar.childNodes.length) wrap.appendChild(bar);
    }

    /* Стиль 2 — «Мінімалістичний» */
    function renderMinimal(wrap, m) {
        var top = el('div', 'ls-min-top');
        top.appendChild(el('span', '', m.ep ? esc(m.ep.text) : ''));
        top.appendChild(el('span', 'ls-min-c ls-min-tab ' + (m.tv ? 'is-tv' : 'is-movie'), esc(m.type)));
        top.appendChild(el('span', '', esc(m.year)));
        wrap.appendChild(top);

        var cols = corners(wrap);

        if (m.country) {
            var flag = opt('flags') && flagHtml(m.country);
            cols.r.appendChild(el('div', 'ls-min-country' + (flag ? ' has-flag' : ''), countryHtml(m.country)));
        }

        putAudio(cols, m);

        var bot = el('div', 'ls-min-bot');
        bot.appendChild(el('span', '', esc(m.quality)));
        bot.appendChild(el('span', 'ls-min-c', m.info ? esc(m.info.text) : ''));
        bot.appendChild(el('span', '', esc(m.vote)));
        wrap.appendChild(bot);
    }

    /* Стиль 3 — «Кольорові плашки» */
    function renderColor(wrap, m) {
        var cols = corners(wrap);

        function b(cls, html, parent) { var x = el('div', 'ls-b ls-b--' + cls, html); (parent || wrap).appendChild(x); return x; }

        b('type', esc(m.type), cols.l).classList.add(m.tv ? 'is-tv' : 'is-movie');
        if (m.vote) b('vote', m.vote, cols.r).classList.add(m.voteCls);
        if (m.country) {
            var flag = opt('flags') && flagHtml(m.country);
            var c = b('country', countryHtml(m.country), cols.r);
            if (flag) c.classList.add('has-flag');
        }

        putAudio(cols, m);

        if (m.ep) b('ep', esc(m.ep.text) + (m.ep.done ? ' ✓' : ICON.clock)).classList.add(m.ep.done ? 'ep-done' : 'ep-wait');
        if (m.info) {
            var i = b(m.info.kind, esc(m.info.text));
            if (m.info.cls) i.classList.add(m.info.cls);
        }
        if (m.quality) b('quality', esc(m.quality));
        if (m.year) b('year', esc(m.year));
    }

    function render(wrap, model) {
        wrap.innerHTML = '';
        var st = badgeStyle();
        wrap.setAttribute('data-style', st);
        if (st === 'minimal') renderMinimal(wrap, model);
        else if (st === 'color') renderColor(wrap, model);
        else renderPanel(wrap, model);
    }

    function decorate(card) {
        if (card.ls_done) return;
        var data = card.card_data;
        var view = card.querySelector('.card__view');
        if (!data || !view) return;
        // актори, колекції, епізоди тощо — пропускаємо
        if (data.gender !== undefined || data.profile_path || card.classList.contains('card--collection') || card.classList.contains('card-episode')) return;

        card.ls_done = true;

        var model = buildModel(data);
        var wrap = el('div', 'ls-badges-wrap');
        render(wrap, model);
        view.appendChild(wrap);

        var tmdbLike = !data.source || data.source === 'tmdb' || data.source === 'cub';

        if (model.tv && data.id && opt('series') && tmdbLike) {
            whenVisible(card, function () {
                tvInfo(data.id, function (info) {
                    if (!info || !wrap.parentNode) return;
                    applySeries(model, info);
                    render(wrap, model);
                });
            });
        }

        if (data.id && opt('audio') && useParser()) {
            whenVisible(card, function () {
                audioInfo(data, function (found) {
                    if (!found || !wrap.parentNode) return;
                    // якщо щось знайшли — оригінал теж є (як EN, якщо не UA/PL)
                    if (found.length && !model.audio.length) addAudio(model, 'EN');
                    for (var i = 0; i < found.length; i++) addAudio(model, found[i]);
                    render(wrap, model);
                });
            });
        }
    }

    /* Ліниве завантаження: запит до TMDB лише коли картка на екрані */
    var io = null;
    var ioCallbacks = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

    function whenVisible(el, fn) {
        if (!('IntersectionObserver' in window) || !ioCallbacks) return fn();

        if (!io) {
            io = new IntersectionObserver(function (entries) {
                for (var i = 0; i < entries.length; i++) {
                    if (entries[i].isIntersecting) {
                        var target = entries[i].target;
                        var cbs = ioCallbacks.get(target) || [];
                        io.unobserve(target);
                        ioCallbacks['delete'](target);
                        for (var k = 0; k < cbs.length; k++) cbs[k]();
                    }
                }
            }, { rootMargin: '300px' });
        }

        var list = ioCallbacks.get(el);
        if (list) return list.push(fn);
        ioCallbacks.set(el, [fn]);
        io.observe(el);
    }

    /* Стежимо за появою нових карток */
    function observeCards() {
        var pending = [];
        var scheduled = false;

        function flush() {
            scheduled = false;
            if (!document.body.classList.contains('ls-badges')) { pending = []; return; }
            var list = pending;
            pending = [];
            for (var i = 0; i < list.length; i++) decorate(list[i]);
        }

        function collect(node) {
            if (node.nodeType !== 1) return;
            if (node.classList.contains('card')) pending.push(node);
            else if (node.querySelectorAll) {
                var found = node.querySelectorAll('.card');
                for (var i = 0; i < found.length; i++) pending.push(found[i]);
            }
        }

        new MutationObserver(function (mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var added = mutations[i].addedNodes;
                for (var j = 0; j < added.length; j++) collect(added[j]);
            }
            if (pending.length && !scheduled) {
                scheduled = true;
                setTimeout(flush, 50);
            }
        }).observe(document.body, { childList: true, subtree: true });
    }

    /* ------------------------------------------------------------------ */
    /*  Повна картка                                                       */
    /* ------------------------------------------------------------------ */

    function onFull(e) {
        if (e.type !== 'complite' || !opt('enabled')) return;

        var movie = e.data && e.data.movie;
        var body = e.body || (e.object && e.object.activity && e.object.activity.render());
        if (!movie || !body) return;

        var root = body.jquery ? body[0] : body;
        var line = root.querySelector('.full-start-new__rate-line');
        var q = qualityOf(movie);

        if (line && q && !line.querySelector('.ls-full-quality')) {
            var el = document.createElement('div');
            el.className = 'ls-full-quality';
            el.textContent = q;
            var pg = line.querySelector('.full-start__pg');
            if (pg && pg.nextSibling) line.insertBefore(el, pg.nextSibling);
            else line.appendChild(el);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Старт                                                              */
    /* ------------------------------------------------------------------ */

    function start() {
        addSettings();
        injectCss();
        loadCache();
        observeCards();
        Lampa.Listener.follow('full', onFull);
        apply();

        // шапка може перемальовуватися — повертаємо годинник
        setInterval(function () {
            if (document.body.classList.contains('ls-clock') && !document.querySelector('.ls-hclock')) renderClock();
        }, 3000);

        console.log('Стильний інтерфейс', VERSION, 'завантажено');
    }

    if (window.appready) start();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();
