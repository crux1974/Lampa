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
    var VERSION = '1.7.1';

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
        ls_style_panel:      'Панель Obsidian',
        ls_style_neon:       'Неонова панель',
        ls_style_appletv:    'Панель Apple TV',
        ls_style_gold:       'Кінотеатр (чорне із золотом)',
        ls_font:             'Шрифт міток',
        ls_font_auto:        'Як у стилі',
        ls_font_system:      'Як у Lampa',
        ls_style_minimal:    'Мінімалістичний',
        ls_style_color:      'Кольорові плашки',
        ls_country_view:     'Країна виробник',
        ls_country_text:     'Відображати текстом',
        ls_country_flag:     'Відображати прапорцем',
        ls_audio:            'Звукові доріжки на постері',
        ls_audio_descr:      'EN, UA, PL. Інші мови показуються як EN',
        ls_audio_view:       'Вигляд звукових доріжок',
        ls_audio_view_color: 'Кольорові мітки',
        ls_audio_view_flag:  'Прапорці',
        ls_audio_pos:        'Розташування звукових доріжок',
        ls_audio_pos_left:   'Лівий верхній кут',
        ls_audio_pos_right:  'Правий верхній кут',
        ls_audio_src:        'Звідки брати доріжки',
        ls_audio_src_auto:   'Автоматично (ваш парсер + резервний)',
        ls_audio_src_tmdb:   'Лише мова оригіналу (TMDB)',
        ls_audio_src_parser: 'Лише ваш парсер (Lampac / Jackett)',
        ls_audio_fallback:   'Резервний парсер',
        ls_audio_fallback_d: 'Використовується, якщо ваш парсер не налаштований або не відповідає',
        ls_audio_test:       'Перевірити пошук доріжок',
        ls_audio_test_run:   'Перевіряю парсер…',
        ls_audio_test_ok:    'Парсер працює: {url}. Знайдено роздач: {n}. Доріжки: {langs}',
        ls_audio_test_fail:  'Жоден парсер не відповів. Перевірте адресу парсера',
        ls_pl_dub:           'Польський дубляж (dubbingpedia.pl)',
        ls_pl_dub_d:         'Перевіряти, чи є польський дубляж, у базі dubbingpedia.pl',
        ls_pl_jackett:       'Польський Jackett: адреса',
        ls_pl_jackett_d:     'Ваш Jackett із польськими трекерами, наприклад http://192.168.1.10:9117',
        ls_pl_jackett_key:   'Польський Jackett: API-ключ',
        ls_test_noanswer:    'не відповідає',
        ls_pl_jackett_short: 'польський Jackett',
        ls_version:          'Версія плагіна',
        ls_layout:           'Порядок редагування категорій',
        ls_layout_open_d:    'Розміщення кожної категорії на постері',
        ls_layout_reset:     'Скинути розміщення',
        ls_layout_reset_ok:  'Розміщення скинуто до стилю',
        ls_layout_hint:      'Розміщення на постері',
        ls_pos_auto:         'Як у стилі',
        ls_pos_tr:           'Справа зверху',
        ls_pos_br:           'Справа знизу',
        ls_pos_tc:           'По центру зверху',
        ls_pos_bc:           'По центру знизу',
        ls_pos_tl:           'Зліва зверху',
        ls_pos_bl:           'Зліва знизу',
        ls_pos_off:          'Приховати',
        ls_ord:              'порядок',
        ls_el_type:          'Тип (фільм / серіал / TV)',
        ls_el_vote:          'Рейтинг',
        ls_el_quality:       'Якість',
        ls_el_year:          'Рік',
        ls_el_country:       'Країна',
        ls_el_audio:         'Звукові доріжки',
        ls_el_ep:            'Сезон і серія',
        ls_el_info:          'Наступна серія / статус',
        ls_torrent_flags:    'Прапорці доріжок у торентах',
        ls_torrent_flags_d:  'Показувати EN, UA, PL прапорцями в списку роздач',
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
        ls_type_show:        'TV',
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

        Lampa.SettingsApi.addParam({
            component: ID,
            param: { name: ID + '_version', type: 'title' },
            field: { name: t('ls_version') + ' ' + VERSION }
        });

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
                values: { panel: t('ls_style_panel'), neon: t('ls_style_neon'), appletv: t('ls_style_appletv'), gold: t('ls_style_gold'), minimal: t('ls_style_minimal'), color: t('ls_style_color') },
                'default': 'panel'
            },
            field: { name: t('ls_style') },
            onChange: function () { apply(); redecorate(); }
        });

        Lampa.SettingsApi.addParam({
            component: ID,
            param: { name: ID + '_layout_open', type: 'button' },
            field: { name: t('ls_layout'), description: t('ls_layout_open_d') },
            onChange: openLayout
        });

        var fontValues = { auto: t('ls_font_auto'), system: t('ls_font_system') };
        for (var fk in FONTS) fontValues[fk] = FONTS[fk].family;

        Lampa.SettingsApi.addParam({
            component: ID,
            param: { name: ID + '_font', type: 'select', values: fontValues, 'default': 'auto' },
            field: { name: t('ls_font') },
            onChange: function () { apply(); redecorate(); }
        });

        Lampa.SettingsApi.addParam({
            component: ID,
            param: {
                name: ID + '_country_view',
                type: 'select',
                values: { text: t('ls_country_text'), flag: t('ls_country_flag') },
                // старий перемикач «Прапорці країн» вимкнений → текст
                'default': Lampa.Storage.get(ID + '_flags', true) === false || Lampa.Storage.get(ID + '_flags', true) === 'false' ? 'text' : 'flag'
            },
            field: { name: t('ls_country_view') },
            onChange: redecorate
        });
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
        select('audio_src', { auto: t('ls_audio_src_auto'), tmdb: t('ls_audio_src_tmdb'), parser: t('ls_audio_src_parser') }, 'auto', 'ls_audio_src');

        Lampa.SettingsApi.addParam({
            component: ID,
            param: {
                name: ID + '_audio_fallback',
                type: 'select',
                values: { 'jac-red.ru': 'jac-red.ru', 'jac.red': 'jac.red', none: '—' },
                'default': 'jac-red.ru'
            },
            field: { name: t('ls_audio_fallback'), description: t('ls_audio_fallback_d') },
            onChange: function () { resetAudio(); redecorate(); }
        });

        trigger('pl_dub', true, 'ls_pl_dub', 'ls_pl_dub_d');
        trigger('torrent_flags', true, 'ls_torrent_flags', 'ls_torrent_flags_d');

        function input(name, title, descr, placeholder) {
            Lampa.SettingsApi.addParam({
                component: ID,
                param: { name: ID + '_' + name, type: 'input', values: '', 'default': '', placeholder: placeholder || '' },
                field: { name: t(title), description: descr ? t(descr) : '' },
                onChange: function () { resetAudio(); redecorate(); }
            });
        }

        input('pl_jackett_url', 'ls_pl_jackett', 'ls_pl_jackett_d', 'http://IP:9117');
        input('pl_jackett_key', 'ls_pl_jackett_key', '', 'API key');

        Lampa.SettingsApi.addParam({
            component: ID,
            param: { name: ID + '_audio_test', type: 'button' },
            field: { name: t('ls_audio_test') },
            onChange: testParser
        });

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
    /*  Шрифти міток (усі з кирилицею, Google Fonts)                       */
    /* ------------------------------------------------------------------ */

    var FONTS = {
        montserrat: { family: 'Montserrat',       g: 'Montserrat:wght@600;800',        css: '"Montserrat", sans-serif' },
        inter:      { family: 'Inter',            g: 'Inter:wght@500;700',             css: '"Inter", sans-serif' },
        roboto:     { family: 'Roboto Condensed', g: 'Roboto+Condensed:wght@600;800',  css: '"Roboto Condensed", sans-serif' },
        oswald:     { family: 'Oswald',           g: 'Oswald:wght@500;700',            css: '"Oswald", sans-serif' },
        rubik:      { family: 'Rubik',            g: 'Rubik:wght@600;800',             css: '"Rubik", sans-serif' },
        exo2:       { family: 'Exo 2',            g: 'Exo+2:wght@600;800',             css: '"Exo 2", sans-serif' },
        comfortaa:  { family: 'Comfortaa',        g: 'Comfortaa:wght@600;700',         css: '"Comfortaa", sans-serif' },
        playfair:   { family: 'Playfair Display', g: 'Playfair+Display:wght@600;800',  css: '"Playfair Display", Georgia, serif' },
        jetbrains:  { family: 'JetBrains Mono',   g: 'JetBrains+Mono:wght@600;800',    css: '"JetBrains Mono", monospace' },
        pixel:      { family: 'Press Start 2P',   g: 'Press+Start+2P',                 css: '"Press Start 2P", monospace' }
    };

    /* Шрифт, який стиль використовує сам */
    var STYLE_FONT = { appletv: 'inter', gold: 'playfair' };

    function loadFont(key) {
        var f = FONTS[key];
        if (!f || document.getElementById('ls-font-' + key)) return;
        var link = document.createElement('link');
        link.id = 'ls-font-' + key;
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=' + f.g + '&display=swap';
        document.head.appendChild(link);
    }

    function applyFont() {
        var key = Lampa.Storage.get(ID + '_font', 'auto') + '';
        if (key === 'auto') key = STYLE_FONT[badgeStyle()] || 'system';

        var root = document.documentElement;
        if (FONTS[key]) {
            loadFont(key);
            root.style.setProperty('--ls-font', FONTS[key].css);
        } else root.style.removeProperty('--ls-font');

        document.body.setAttribute('data-ls-font', key);
    }

    /* ------------------------------------------------------------------ */
    /*  Розташування міток                                                 */
    /* ------------------------------------------------------------------ */

    var LAYOUT_KINDS = ['type', 'vote', 'quality', 'year', 'country', 'audio', 'ep', 'info'];
    var POSITIONS = ['tl', 'tc', 'tr', 'bl', 'bc', 'br'];

    /* Розташування за замовчуванням для кожного стилю: [місце, порядок] */
    var STYLE_LAYOUT = {
        panel:   { type: ['tl', 1], audio: ['tl', 2], country: ['tr', 1], ep: ['bl', 1], vote: ['bl', 2], quality: ['bl', 3], info: ['br', 1], year: ['br', 2] },
        color:   { type: ['tl', 1], audio: ['tl', 2], vote: ['tr', 1], country: ['tr', 2], ep: ['bl', 1], quality: ['bl', 2], info: ['br', 1], year: ['br', 2] },
        neon:    { type: ['tl', 1], audio: ['tl', 2], country: ['tr', 1], ep: ['bl', 1], vote: ['bl', 2], quality: ['bl', 3], info: ['br', 1], year: ['br', 2] },
        appletv: { type: ['tl', 1], audio: ['tl', 2], country: ['tr', 1], ep: ['bl', 1], vote: ['bl', 2], quality: ['bl', 3], info: ['br', 1], year: ['br', 2] },
        gold:    { type: ['tl', 1], audio: ['tl', 2], country: ['tr', 1], ep: ['bl', 1], vote: ['bl', 2], quality: ['bl', 3], info: ['br', 1], year: ['br', 2] },
        minimal: { ep: ['tl', 1], audio: ['tl', 2], type: ['tc', 1], year: ['tr', 1], country: ['tr', 2], quality: ['bl', 1], info: ['bc', 1], vote: ['br', 1] }
    };

    function layoutOf(kind) {
        var def = STYLE_LAYOUT[badgeStyle()][kind];
        var chosen = Lampa.Storage.get(ID + '_pos_set_' + kind, false);
        var pos = Lampa.Storage.get(ID + '_pos_' + kind, '') + '';

        // місце, вибране вручну (або збережене попередньою версією), інакше — як у стилі
        if (!(chosen === true || chosen === 'true') && !(pos && pos !== 'auto' && pos !== def[0] && POSITIONS.concat('off').indexOf(pos) >= 0)) pos = 'auto';

        if (pos === 'auto' || (pos !== 'off' && POSITIONS.indexOf(pos) < 0)) {
            pos = def[0];
            // сумісність зі старим налаштуванням «доріжки праворуч»
            if (kind === 'audio' && Lampa.Storage.get(ID + '_audio_pos', 'left') === 'right') pos = 'tr';
        }
        return { pos: pos, ord: def[1] };
    }

    var LAYOUT_ID = ID + '_layout';

    function openLayout() {
        if (!Lampa.Settings || !Lampa.Settings.create) return;
        Lampa.Settings.create(LAYOUT_ID, {
            onBack: function () { Lampa.Settings.create(ID); }
        });
    }

    function addLayoutSettings() {
        // окремий пункт у головному списку налаштувань, одразу після «Стильний інтерфейс»
        var LID = LAYOUT_ID;

        if (Lampa.Settings && Lampa.Settings.create && Lampa.Template && Lampa.Template.add) {
            // підменю всередині «Стильний інтерфейс» — у головному списку його немає
            Lampa.Template.add('settings_' + LID, '<div></div>');
        } else Lampa.SettingsApi.addComponent({
            component: LID,
            name: t('ls_layout'),
            after: ID,
            icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="2.5" width="16" height="19" rx="2.5" stroke="currentColor" stroke-width="2"/><rect x="6.5" y="5" width="4.5" height="2.6" rx="1" fill="currentColor"/><rect x="13" y="5" width="4.5" height="2.6" rx="1" fill="currentColor"/><rect x="6.5" y="16.4" width="4.5" height="2.6" rx="1" fill="currentColor"/><rect x="13" y="16.4" width="4.5" height="2.6" rx="1" fill="currentColor"/></svg>'
        });

        Lampa.SettingsApi.addParam({
            component: LID,
            param: { name: ID + '_layout_head', type: 'title' },
            field: { name: t('ls_layout') }
        });

        // розміщення на постері — у порядку: справа зверху, справа знизу, по центру зверху, по центру знизу, зліва зверху, зліва знизу
        var posValues = {};
        ['tr', 'br', 'tc', 'bc', 'tl', 'bl'].forEach(function (p) { posValues[p] = t('ls_pos_' + p); });
        posValues.off = t('ls_pos_off');

        LAYOUT_KINDS.forEach(function (kind) {
            Lampa.SettingsApi.addParam({
                component: LID,
                param: { name: ID + '_pos_' + kind, type: 'select', values: posValues, 'default': STYLE_LAYOUT.panel[kind][0] },
                field: { name: t('ls_el_' + kind), description: t('ls_layout_hint') },
                onChange: function () {
                    // користувач вибрав місце сам — запам'ятовуємо
                    Lampa.Storage.set(ID + '_pos_set_' + kind, true);
                    redecorate();
                }
            });
        });

        Lampa.SettingsApi.addParam({
            component: LID,
            param: { name: ID + '_layout_reset', type: 'button' },
            field: { name: t('ls_layout_reset') },
            onChange: function () {
                LAYOUT_KINDS.forEach(function (kind) {
                    try { localStorage.removeItem(ID + '_pos_' + kind); } catch (e) {}
                    Lampa.Storage.set(ID + '_pos_set_' + kind, false);
                });
                Lampa.Storage.set(ID + '_audio_pos', 'left');
                redecorate();
                Lampa.Noty.show(t('ls_layout_reset_ok'));
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
        '.ls-bar{position:absolute;left:.5em;right:.5em;bottom:.5em;padding:0;background:none}',
        /* без фону — тому сильна тінь, щоб читалося на будь-якому постері */
        '.ls-bar .ls-i{text-shadow:0 0 .5em currentColor,0 1px 3px rgba(0,0,0,1),0 0 2px rgba(0,0,0,1),0 0 6px rgba(0,0,0,.8)}',
        '.ls-bar .ls-i svg{-webkit-filter:drop-shadow(0 0 .25em currentColor) drop-shadow(0 1px 2px #000) drop-shadow(0 0 2px #000);filter:drop-shadow(0 0 .25em currentColor) drop-shadow(0 1px 2px #000) drop-shadow(0 0 2px #000)}',
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
        '.ls-i--tv,.ls-b--type.is-tv,.ls-min-tab.is-tv,.ls-mtxt.is-tv{color:#00ffa3}',
        '.ls-i--show,.ls-b--type.is-show,.ls-min-tab.is-show,.ls-mtxt.is-show{color:#ffb300}',
        '.ls-mtxt.is-movie{color:#ff2bd6}',

        /* категорії без рамки — лише кольоровий текст зі світінням */
        '.ls-chip.ls-cat{background:none !important;border:none !important;box-shadow:none !important;padding-left:.1em;padding-right:.1em;font-size:.88em;text-shadow:0 0 .5em currentColor,0 1px 3px rgba(0,0,0,.95),0 0 1px #000}',
        '.ls-bar .ls-cat{text-shadow:0 0 .5em currentColor}',
        '.ls-cat svg{-webkit-filter:drop-shadow(0 0 .25em currentColor) drop-shadow(0 1px 2px #000);filter:drop-shadow(0 0 .25em currentColor) drop-shadow(0 1px 2px #000)}',

        /* звукові доріжки */
        '.ls-au{display:inline-flex;align-items:center;justify-content:center;min-width:2.2em;padding:.2em .45em;border-radius:.45em;font-size:.76em;font-weight:900;letter-spacing:.04em;background:rgba(4,4,10,.88);border:.12em solid currentColor;box-shadow:0 0 .55em -.1em currentColor;text-shadow:0 0 .45em currentColor}',
        '.ls-au--en{color:#2f9bff}',
        '.ls-au--ua{color:#ffd400}',
        '.ls-au--pl{color:#ff2e4d}',
        '.ls-au.has-flag{padding:0;min-width:0;border:none;background:none;box-shadow:none}',
        '.ls-au .ls-flag{width:2em;height:1.4em;border-radius:.25em;box-shadow:0 0 0 1px rgba(0,0,0,.5),0 0 .5em rgba(0,0,0,.6)}',

        /* --- універсальні місця: 6 позицій, усе в одному місці — одне під одним --- */
        '.ls-pos{position:absolute;display:flex;flex-direction:column;max-width:46%}',
        '.ls-pos > *{margin-bottom:.3em}',
        '.ls-pos > *:last-child{margin-bottom:0}',
        '.ls-pos--tl{top:.5em;left:.5em;align-items:flex-start}',
        '.ls-pos--tc{top:.5em;left:50%;-webkit-transform:translateX(-50%);transform:translateX(-50%);align-items:center;max-width:40%}',
        '.ls-pos--tr{top:.5em;right:.5em;align-items:flex-end}',
        '.ls-pos--bl{bottom:.5em;left:.5em;align-items:flex-start}',
        '.ls-pos--bc{bottom:.5em;left:50%;-webkit-transform:translateX(-50%);transform:translateX(-50%);align-items:center;max-width:40%}',
        '.ls-pos--br{bottom:.5em;right:.5em;align-items:flex-end}',
        '.ls-pos .ls-b{position:static;max-width:none}',

        /* ряди зверху і знизу: якщо не вміщається — переноситься, а не накладається */
        '.ls-rowbox{position:absolute;left:.5em;right:.5em;display:flex;flex-wrap:wrap;justify-content:space-between}',
        '.ls-rowbox--top{top:.5em;align-items:flex-start}',
        '.ls-rowbox--bot{bottom:.5em;align-items:flex-end;flex-wrap:wrap-reverse}',
        '.ls-rowbox > .ls-pos{position:static;max-width:100%;-webkit-transform:none;transform:none}',
        '.ls-rowbox > .ls-pos--tc,.ls-rowbox > .ls-pos--bc{margin:0 auto}',
        '.ls-rowbox > .ls-pos--tr,.ls-rowbox > .ls-pos--br{margin-left:auto}',
        '.ls-rowbox > .ls-pos + .ls-pos{padding-left:.3em}',

        /* нижня неонова панель з трьома секціями */
        '.ls-bar{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between}',
        '.ls-bsec{display:flex;flex-direction:column;flex:0 1 auto;max-width:100%}',
        '.ls-bsec--l{align-items:flex-start;margin-right:.4em}',
        '.ls-bsec--c{flex:1 1 100%;align-items:center;margin-bottom:.15em}',
        '.ls-bsec--r{align-items:flex-end;margin-left:auto}',
        '.ls-bline{display:flex;flex-wrap:wrap;align-items:center;max-width:100%}',
        '.ls-bline + .ls-bline{margin-top:.3em}',
        '.ls-bsec--l .ls-bline{justify-content:flex-start}',
        '.ls-bsec--c .ls-bline{justify-content:center}',
        '.ls-bsec--r .ls-bline{justify-content:flex-end}',
        '.ls-bline > *{margin:0 .5em 0 0 !important}',
        '.ls-bline > *:last-child{margin-right:0 !important}',
        '.ls-bar .ls-i--ep,.ls-bar .ls-i--next,.ls-bar .ls-i--status{font-size:.82em}',
        '.ls-bar .ls-au{font-size:.7em}',

        /* мінімалістичний: смуги з трьома секціями */
        '.ls-mstrip{position:absolute;left:0;right:0;display:flex;justify-content:space-between;padding:0 .55em;color:#fff;font-size:.78em;font-weight:700;text-shadow:0 1px 2px rgba(0,0,0,.85)}',
        '.ls-mstrip--top{top:0;align-items:flex-start;padding-top:.45em;padding-bottom:1.2em;border-radius:1em 1em 0 0;background:linear-gradient(to bottom,rgba(0,0,0,.82),rgba(0,0,0,0))}',
        '.ls-mstrip--bot{bottom:0;align-items:flex-end;padding-bottom:.5em;padding-top:1.2em;border-radius:0 0 1em 1em;background:linear-gradient(to top,rgba(0,0,0,.86),rgba(0,0,0,0))}',
        '.ls-msec{display:flex;flex-direction:column;flex:1 1 0;min-width:0;overflow:hidden}',
        '.ls-msec > *{margin-bottom:.25em}',
        '.ls-msec > *:last-child{margin-bottom:0}',
        '.ls-msec--l{align-items:flex-start}',
        '.ls-msec--c{align-items:center;flex:0 1 auto}',
        '.ls-msec--r{align-items:flex-end}',
        '.ls-mstrip--top{padding-top:0}',
        '.ls-mstrip--top .ls-msec--l,.ls-mstrip--top .ls-msec--r{padding-top:.45em}',
        '.ls-mtxt{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}',
        '.ls-mstrip .ls-au{font-size:.85em}',

        /* --- стиль «Мінімалістичний»: темні смуги зверху і знизу, білий текст --- */
        '.ls-min-top,.ls-min-bot{position:absolute;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:0 .55em;color:#fff;font-size:.78em;font-weight:700;text-shadow:0 1px 2px rgba(0,0,0,.8);white-space:nowrap}',
        '.ls-min-top{top:0;height:2.3em;border-radius:1em 1em 0 0;background:linear-gradient(to bottom,rgba(0,0,0,.8),rgba(0,0,0,0))}',
        '.ls-min-bot{bottom:0;height:2.4em;border-radius:0 0 1em 1em;background:linear-gradient(to top,rgba(0,0,0,.85),rgba(0,0,0,0))}',
        '.ls-min-top > span,.ls-min-bot > span{flex:1 1 0;overflow:hidden;text-overflow:ellipsis}',
        '.ls-min-top > span:last-child,.ls-min-bot > span:last-child{text-align:right}',
        '.ls-min-top > .ls-min-c,.ls-min-bot > .ls-min-c{flex:0 1 auto;text-align:center;padding:0 .3em}',
        '.ls-min-tab{display:inline-block;align-self:flex-start;padding:.25em .3em .35em;background:none;font-weight:800;text-shadow:0 0 .45em currentColor,0 1px 2px #000}',
        '.ls-min-country{font-size:.72em;font-weight:700;color:#fff;background:rgba(0,0,0,.65);padding:.15em .35em;border-radius:.3em}',

        /* --- стиль «Кольорові плашки»: як у старій версії з відео --- */
        '.ls-b{position:absolute;padding:.18em .42em;border-radius:.3em;font-size:.8em;font-weight:700;line-height:1.15;color:#fff;white-space:nowrap;max-width:62%;overflow:hidden;text-overflow:ellipsis;box-shadow:0 .1em .4em rgba(0,0,0,.35)}',
        '.ls-b--type{top:.45em;left:.45em;background:#8e3fd8}',
        '.ls-b--type,.ls-b--type.is-movie,.ls-b--type.is-tv,.ls-b--type.is-show{background:none !important;box-shadow:none !important;padding-left:0;font-size:.9em;text-shadow:0 1px 3px rgba(0,0,0,.95),0 0 .4em rgba(0,0,0,.8)}',
        '.ls-b--type.is-movie{color:#ff4fd8}',
        '.ls-b--type.is-tv{color:#a78bfa}',
        '.ls-b--type.is-show{color:#ffb300}',
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

        /* --- прапорці доріжок у торентах --- */
        '.ls-tflags{display:flex;align-items:center;margin:.35em 0 .1em}',
        '.ls-tflags .ls-flag{width:1.9em;height:1.35em;margin-right:.45em;border-radius:.2em;box-shadow:0 0 0 1px rgba(0,0,0,.4)}',
        '.ls-tflags .ls-au{margin-right:.45em;font-size:.85em}',

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
        'body.ls-on .full-start-new__reactions .reaction{border-radius:2em;background:rgba(0,0,0,.45);padding:.3em .8em}',
        /* ================= ЄДИНА ГЕОМЕТРІЯ (v1.7) ================= */
        '.ls-badges-wrap{font-family:var(--ls-font,inherit)}',
        '.ls-badges-wrap .ls-rowbox{left:.55em;right:.55em}',
        '.ls-badges-wrap .ls-rowbox--top{top:.55em}',
        '.ls-badges-wrap .ls-rowbox--bot{bottom:.55em}',
        '.ls-badges-wrap .ls-pos{max-width:100%}',
        '.ls-badges-wrap .ls-pos > *{margin:0 0 .3em 0}',
        '.ls-badges-wrap .ls-pos > *:last-child{margin-bottom:0}',
        /* кути не переносяться, а стискаються — тому всі низи і всі верхи на одній лінії */
        '.ls-badges-wrap .ls-rowbox,.ls-badges-wrap .ls-rowbox--bot{flex-wrap:nowrap}',
        '.ls-badges-wrap .ls-pos{min-width:0;flex:0 .15 auto}',
        '.ls-badges-wrap .ls-pos.ls-flexy{flex-shrink:4}',
        '.ls-badges-wrap .ls-rowbox > .ls-pos + .ls-pos{padding-left:.3em}',
        '.ls-inl{display:flex;flex-wrap:wrap;align-items:center;max-width:100%}',
        '.ls-badges-wrap .ls-pos > .ls-inl{margin:0 !important}',
        '.ls-badges-wrap .ls-pos > .ls-inl:last-child{margin-bottom:-.3em !important}',
        '.ls-inl > *{margin:0 .3em .3em 0 !important}',
        '.ls-inl > *:last-child{margin-right:0 !important}',
        '.ls-pos--tr .ls-inl,.ls-pos--br .ls-inl{justify-content:flex-end}',
        '.ls-pos--tc .ls-inl,.ls-pos--bc .ls-inl{justify-content:center}',
        '.ls-u > span{overflow:hidden;text-overflow:ellipsis;min-width:0}',

        /* кожна мітка — однакова висота, відступи і рамка (прозора, якщо стиль без рамок) */
        '.ls-u{display:inline-flex !important;align-items:center;justify-content:center;box-sizing:border-box;height:1.9em;min-width:0;padding:0 .55em !important;margin:0;border:.12em solid transparent !important;border-radius:.55em;font-size:.8em !important;font-weight:800;line-height:1;white-space:nowrap;letter-spacing:.01em;position:static !important;max-width:100% !important;overflow:hidden}',
        '.ls-u svg{width:1.15em !important;height:1.15em !important;margin:0 .3em 0 0 !important}',
        '.ls-u .ls-flag{width:1.75em;height:1.25em;margin:0;border-radius:.2em}',
        '.ls-u.ls-i--country .ls-flag{margin:0}',
        '.ls-u.ls-b--ep svg{margin:0 0 0 .25em !important}',
        'body[data-ls-font="pixel"] .ls-badges-wrap .ls-u{font-size:.58em !important;height:2.5em}',

        /* --- Панель Obsidian: без рамок, неоновий текст із темною тінню --- */
        '.ls-badges-wrap[data-style="panel"] .ls-u{background:none !important;border-color:transparent !important;box-shadow:none !important;padding:0 .3em !important;text-shadow:0 0 .5em currentColor,0 1px 3px #000,0 0 2px #000}',
        '.ls-badges-wrap[data-style="panel"] .ls-u svg{-webkit-filter:drop-shadow(0 0 .25em currentColor) drop-shadow(0 1px 2px #000);filter:drop-shadow(0 0 .25em currentColor) drop-shadow(0 1px 2px #000)}',

        /* --- Неонова панель: усе в неонових рамках --- */
        '.ls-badges-wrap[data-style="neon"] .ls-u{background:rgba(4,4,10,.82) !important;border-color:currentColor !important;box-shadow:0 0 .6em -.1em currentColor,inset 0 0 .45em -.2em currentColor;text-shadow:0 0 .45em currentColor}',
        '.ls-badges-wrap[data-style="neon"] .ls-u svg{-webkit-filter:drop-shadow(0 0 .25em currentColor);filter:drop-shadow(0 0 .25em currentColor)}',
        '.ls-badges-wrap[data-style="neon"] .ls-i--year{color:#fff}',

        /* --- Панель Apple TV: матове скло, білий текст, кольорові лише іконки --- */
        '.ls-badges-wrap[data-style="appletv"] .ls-u{color:#fff !important;background:rgba(255,255,255,.17) !important;border-color:rgba(255,255,255,.25) !important;border-radius:1em;font-weight:600;-webkit-backdrop-filter:blur(12px) saturate(1.5);backdrop-filter:blur(12px) saturate(1.5);box-shadow:0 .15em .6em rgba(0,0,0,.28);text-shadow:0 1px 2px rgba(0,0,0,.35)}',
        '.ls-badges-wrap[data-style="appletv"] .ls-i--vote svg{color:#ffd60a}',
        '.ls-badges-wrap[data-style="appletv"] .ls-i--quality svg{color:#30d158}',
        '.ls-badges-wrap[data-style="appletv"] .ls-i--movie svg{color:#ff375f}',
        '.ls-badges-wrap[data-style="appletv"] .ls-i--tv svg{color:#64d2ff}',
        '.ls-badges-wrap[data-style="appletv"] .ls-i--show svg{color:#ff9f0a}',
        '.ls-badges-wrap[data-style="appletv"] .ls-i--ep svg{color:#ffd60a}',
        '.ls-badges-wrap[data-style="appletv"] .ls-i--next svg{color:#bf5af2}',
        '.ls-badges-wrap[data-style="appletv"] .ls-au--ua{box-shadow:inset 0 -.18em 0 #ffd400,0 .15em .6em rgba(0,0,0,.28)}',
        '.ls-badges-wrap[data-style="appletv"] .ls-au--en{box-shadow:inset 0 -.18em 0 #2f9bff,0 .15em .6em rgba(0,0,0,.28)}',
        '.ls-badges-wrap[data-style="appletv"] .ls-au--pl{box-shadow:inset 0 -.18em 0 #ff2e4d,0 .15em .6em rgba(0,0,0,.28)}',

        /* --- Кінотеатр: чорне із золотом, шрифт із засічками --- */
        '.ls-badges-wrap[data-style="gold"] .ls-u{color:#e9c46a !important;background:rgba(10,8,4,.85) !important;border-color:rgba(212,175,55,.8) !important;border-width:.08em !important;border-radius:.3em;font-weight:700;letter-spacing:.04em;box-shadow:0 .15em .5em rgba(0,0,0,.55);text-shadow:0 1px 2px #000}',
        '.ls-badges-wrap[data-style="gold"] .ls-u svg{color:#d4af37}',
        '.ls-badges-wrap[data-style="gold"] .ls-i--vote.v-low{color:#e07a5f !important}',

        /* кольорові плашки в сітці */
        '.ls-badges-wrap[data-style="color"] .ls-u{border-radius:.35em}',
        '.ls-badges-wrap[data-style="color"] .ls-au{background:rgba(4,4,10,.85)}',
        '.ls-badges-wrap .ls-u.has-flag{background:none !important;border-color:transparent !important;box-shadow:none !important}',
        '.ls-badges-wrap[data-style="neon"] .ls-u.has-flag,.ls-badges-wrap[data-style="gold"] .ls-u.has-flag{background:rgba(4,4,10,.82) !important;border-color:rgba(255,255,255,.35) !important}',
        '.ls-badges-wrap[data-style="appletv"] .ls-u.has-flag{background:rgba(255,255,255,.17) !important;border-color:rgba(255,255,255,.25) !important}',

        /* мінімалістичний — теж зі шрифтом */
        '.ls-mstrip{font-family:var(--ls-font,inherit)}'

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

        applyFont();

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
        tmdbInfo('tv', id, callback);
    }

    function tmdbInfo(method, id, callback) {
        id = method === 'tv' ? id : 'm' + id; // ключ кешу: серіали — як раніше, фільми — з «m»
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
                var path = (id + '').charAt(0) === 'm' ? 'movie/' + (id + '').slice(1) : 'tv/' + id;
                var url = Lampa.TMDB.api(path + '?api_key=' + Lampa.TMDB.key() + '&language=uk');

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
            countries: (j.origin_country && j.origin_country.length) ? j.origin_country
                : (j.production_countries || []).map(function (c) { return c.iso_3166_1; })
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

    /* TV: новини, реаліті, ток-шоу (жанри TMDB) */
    function isShow(d) {
        var ids = [].concat(d.genre_ids || []);
        if (d.genres) for (var i = 0; i < d.genres.length; i++) ids.push(d.genres[i].id);
        for (var j = 0; j < ids.length; j++) if (ids[j] === 10763 || ids[j] === 10764 || ids[j] === 10767) return true;
        return false;
    }

    function isTv(d) {
        return !!(d.name || d.original_name || d.first_air_date || d.number_of_seasons || d.method === 'tv' || d.media_type === 'tv');
    }

    function yearOf(d) {
        var date = d.release_date || d.first_air_date || d.last_air_date || '';
        var y = (date + '').slice(0, 4);
        return /^\d{4}$/.test(y) ? y : d.release_year && d.release_year !== '0000' ? d.release_year : '';
    }

    function countryAsFlag() {
        var v = Lampa.Storage.get(ID + '_country_view', '') + '';
        if (v === 'text') return false;
        if (v === 'flag') return true;
        var old = Lampa.Storage.get(ID + '_flags', true);
        return !(old === false || old === 'false');
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

    var STYLES = ['panel', 'neon', 'appletv', 'gold', 'minimal', 'color'];
    var PANEL_SKINS = ['panel', 'neon', 'appletv', 'gold'];

    function badgeStyle() {
        var st = Lampa.Storage.get(ID + '_style', 'panel') + '';
        return STYLES.indexOf(st) >= 0 ? st : 'panel';
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

    /* Розпізнаємо мову озвучки: поле languages від парсера + назва роздачі */
    var RX_UA = /(\bukr\b|\bukrainian\b|\bua\b|укр|україн|украин|toloka|uaflix)/i;
    var RX_PL = /(\bpol\b|\bpolish\b|\bpolsk|\blektor\b|dubbing[\s._-]*pl\b|\bpl[\s._-]*dub|\bpldub|\bdubpl|\bpl\b|польськ|польск)/i;
    /* субтитри — це не доріжка: вирізаємо їх перед пошуком */
    var RX_SUBS = /(sub(?:s|titles?)?\s*[\(\[:]?\s*(?:[a-z]{3}\s*,\s*)*pol[^)\]]*[\)\]]?|\bplsub\b|\bpl[\s._-]*sub|napisy[\s._-]*pl|\bnapisy\b|субтитр[^|,;\]]*)/gi;

    function detectLangs(results) {
        var found = [];
        function add(l) { if (found.indexOf(l) < 0) found.push(l); }

        for (var i = 0; i < results.length && i < 300; i++) {
            var r = results[i] || {};
            var langs = [].concat(r.languages || r.Languages || []);

            // аудіодоріжки з ffprobe (якщо парсер їх віддає)
            var ff = r.ffprobe || [];
            for (var f = 0; f < ff.length; f++) {
                if (ff[f] && ff[f].codec_type === 'audio' && ff[f].tags && ff[f].tags.language) langs.push(ff[f].tags.language);
            }

            for (var j = 0; j < langs.length; j++) {
                var code = (langs[j] + '').toLowerCase();
                if (code === 'ukr' || code === 'uk' || code === 'ua') add('UA');
                else if (code === 'pol' || code === 'pl') add('PL');
                else if (code && code !== 'und') add('EN'); // інші мови — як EN
            }

            var title = (r.Title || r.title || '') + ' ' + [].concat(r.voices || r.Voices || [], (r.info && r.info.voices) || []).join(' ');
            if (RX_UA.test(title)) add('UA');
            if (/\beng\b|\benglish\b|англ/i.test(title.replace(RX_SUBS, ' '))) add('EN');
            if (RX_PL.test(title.replace(RX_SUBS, ' '))) add('PL');
        }
        return found;
    }

    /* Найкраща якість серед роздач (без екранок); якщо є лише екранки — CAM */
    var RX_CAM = /\b(camrip|cam|ts|telesync|tc|telecine|hdts|hdtc|tsrip)\b|экранк|екранк/i;

    function detectQuality(results) {
        var best = 0, cam = false;

        for (var i = 0; i < results.length && i < 300; i++) {
            var r = results[i] || {};
            var title = (r.Title || r.title || '') + '';
            var info = r.info || {};
            var q = parseInt(info.quality || r.quality, 10) || 0;

            if (!q) {
                if (/2160p|\b4k\b|\buhd\b/i.test(title)) q = 2160;
                else if (/1080[pi]/i.test(title)) q = 1080;
                else if (/720p/i.test(title)) q = 720;
                else if (/480p|dvdrip|\bsd\b/i.test(title)) q = 480;
            }

            // відео з ffprobe — найточніше
            var ff = r.ffprobe || [];
            for (var f = 0; f < ff.length; f++) {
                var v = ff[f];
                if (v && v.codec_type === 'video' && v.width) {
                    var byWidth = v.width >= 3200 ? 2160 : v.width >= 1800 ? 1080 : v.width >= 1200 ? 720 : 480;
                    if (byWidth > q) q = byWidth;
                }
            }

            if (!q) continue;
            if (RX_CAM.test(title)) { cam = true; continue; }
            if (q > best) best = q;
        }

        if (best >= 2160) return '4K';
        if (best >= 1080) return '1080P';
        if (best >= 720) return '720P';
        if (best > 0) return 'SD';
        return cam ? 'CAM' : '';
    }

    function normUrl(url) {
        url = (url || '') + '';
        url = url.replace(/^\s+|\s+$/g, '').replace(/\/+$/, '');
        if (!url) return '';
        if (url.toLowerCase() === 'jacred.xyz') url = 'jac.red';
        if (!/^https?:\/\//i.test(url)) {
            if (Lampa.Utils && Lampa.Utils.checkEmptyUrl) url = Lampa.Utils.checkEmptyUrl(url);
            else url = (/^(\d+\.){3}\d+|localhost/.test(url) ? 'http://' : 'https://') + url;
        }
        return url.replace(/\/+$/, '');
    }

    /* Список парсерів: ваші з налаштувань Lampa, потім резервний */
    function parserList() {
        var src = Lampa.Storage.get(ID + '_audio_src', 'auto');
        var list = [];
        if (src === 'tmdb') return list;

        function add(url, key) {
            url = normUrl(url);
            if (!url) return;
            for (var i = 0; i < list.length; i++) if (list[i].url === url) return;
            list.push({ url: url, key: key || '' });
        }

        var type = Lampa.Storage.get('parser_torrent_type', 'jackett');
        if (!type || type === 'jackett') {
            add(Lampa.Storage.get('jackett_url', ''), Lampa.Storage.get('jackett_key', ''));
            add(Lampa.Storage.get('jackett_url_two', ''), Lampa.Storage.get('jackett_key_two', ''));
        }

        if (src === 'auto') {
            var fb = Lampa.Storage.get(ID + '_audio_fallback', 'jac-red.ru');
            if (fb && fb !== 'none') add(fb, '');
        }
        return list;
    }

    function useParser() {
        if (Lampa.Storage.get(ID + '_audio_src', 'auto') === 'tmdb') return false;
        return parserList().length > 0 || !!plJackett() || opt('pl_dub');
    }

    function parserUrl(p, d) {
        var tv = isTv(d);
        var title = d.title || d.name || '';
        var orig = d.original_title || d.original_name || title;
        var year = yearOf(d);

        return p.url + '/api/v2.0/indexers/all/results?apikey=' + encodeURIComponent(p.key) +
            '&Query=' + encodeURIComponent(orig) +
            '&title=' + encodeURIComponent(title) +
            '&title_original=' + encodeURIComponent(orig) +
            (year ? '&year=' + encodeURIComponent(year) : '') +
            '&is_serial=' + (tv ? '2' : '1') +
            '&Category[]=' + (tv ? '5000' : '2000');
    }

    /* Пробуємо парсери по черзі, поки якийсь не відповість */
    function askParsers(d, done) {
        var list = parserList();
        var idx = 0;

        function next() {
            if (idx >= list.length) return done(null, null);
            var p = list[idx++];

            if (aNetwork.timeout) aNetwork.timeout(15000);
            aNetwork.silent(parserUrl(p, d), function (json) {
                try { if (typeof json === 'string') json = JSON.parse(json); } catch (e) { json = null; }
                var results = json && (json.Results || json.results);
                if (results && results.length) done(results, p);
                else next();
            }, next);
        }
        next();
    }

    /* ---------------- Польські джерела ---------------- */

    function plainTitle(str) {
        return (str || '').toLowerCase()
            .replace(/[ąà]/g, 'a').replace(/[ćç]/g, 'c').replace(/ę/g, 'e').replace(/ł/g, 'l').replace(/ń/g, 'n')
            .replace(/ó/g, 'o').replace(/ś/g, 's').replace(/[źż]/g, 'z')
            .replace(/&/g, ' and ').replace(/[^a-z0-9а-яіїєґё]+/g, ' ').replace(/^\s+|\s+$/g, '');
    }

    function plJackett() {
        var url = normUrl(Lampa.Storage.get(ID + '_pl_jackett_url', ''));
        return url ? { url: url, key: Lampa.Storage.get(ID + '_pl_jackett_key', '') + '' } : null;
    }

    /* Ваш Jackett з польськими трекерами: шукаємо PL (і UA) у роздачах */
    function askPlJackett(d, done) {
        var p = plJackett();
        if (!p) return done(null);

        aNetwork.silent(parserUrl(p, d), function (json) {
            try { if (typeof json === 'string') json = JSON.parse(json); } catch (e) { json = null; }
            var results = json && (json.Results || json.results);
            done(results ? detectLangs(results) : null);
        }, function () { done(null); });
    }

    /* dubbingpedia.pl: чи є польський дубляж саме цього фільму / серіалу */
    var DP_API = 'https://dubbingpedia.pl/w/api.php';

    function askDubbingpedia(d, done) {
        if (!opt('pl_dub')) return done(null);

        var orig = d.original_title || d.original_name || '';
        var origPlain = plainTitle(orig);
        var year = parseInt(yearOf(d), 10) || 0;
        if (!origPlain) return done(null);

        // спершу шукаємо «назва + рік», потім просто назву
        var queries = year ? [origPlain + ' ' + year, origPlain] : [origPlain];

        function check(q, next) {
            var searchUrl = DP_API + '?action=query&list=search&srwhat=text&srlimit=8&srprop=&format=json&origin=*&srsearch=' + encodeURIComponent(q);

            aNetwork.silent(searchUrl, function (json) {
                try { if (typeof json === 'string') json = JSON.parse(json); } catch (e) { json = null; }
                var hits = json && json.query && json.query.search;
                if (!hits) return done(null);
                if (!hits.length) return next();

                var titles = [];
                for (var i = 0; i < hits.length; i++) titles.push(hits[i].title);

                var pagesUrl = DP_API + '?action=query&prop=revisions&rvprop=content&rvslots=main&format=json&formatversion=2&origin=*&titles=' + encodeURIComponent(titles.join('|'));

                aNetwork.silent(pagesUrl, function (json2) {
                    try { if (typeof json2 === 'string') json2 = JSON.parse(json2); } catch (e) { json2 = null; }
                    var pages = json2 && json2.query && json2.query.pages;
                    if (!pages) return done(null);

                    for (var j = 0; j < pages.length; j++) {
                        var rev = pages[j].revisions && pages[j].revisions[0];
                        var text = rev ? (rev.slots && rev.slots.main ? rev.slots.main.content : rev.content) || '' : '';

                        // лише сторінки фільмів і серіалів, не ігри та не актори
                        if (!/\{\{\s*(film|serial|anime|program)/i.test(text)) continue;

                        var o = text.match(/\|\s*tytuł oryginalny\s*=\s*([^\n|]+)/i);
                        if (!o || plainTitle(o[1]) !== origPlain) continue;

                        var r = text.match(/\|\s*rok\s*=\s*(\d{4})/i);
                        if (year && r && Math.abs(parseInt(r[1], 10) - year) > 1 && !isTv(d)) continue;

                        return done(['PL']);
                    }
                    next();
                }, function () { done(null); });
            }, function () { done(null); });
        }

        var qi = 0;
        (function loop() {
            if (qi >= queries.length) return done([]);
            check(queries[qi++], loop);
        })();
    }

    var aQueue = [];
    var aWaiting = {};
    var aActive = 0;
    var aNetwork = null;

    function resetAudio() {
        for (var k in cache) if (k.indexOf('a') === 0 && k.indexOf('_') > 0 && /^a\d*_/.test(k)) delete cache[k];
        saveCache();
    }

    function audioInfo(data, callback) {
        var key = 'a4_' + (isTv(data) ? 'tv' : 'mv') + '_' + data.id;
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

                var found = null;      // null — жодне джерело не відповіло; інакше { a: [...], q: '' }
                var left = 3;

                function merge(list, quality) {
                    if (list) {
                        if (!found) found = { a: [], q: '' };
                        for (var i = 0; i < list.length; i++) if (found.a.indexOf(list[i]) < 0) found.a.push(list[i]);
                        if (quality && !found.q) found.q = quality;
                    }
                    if (--left) return;

                    aActive--;
                    if (found) {
                        cache[job.key] = { time: Date.now(), data: found };
                        saveCache();
                    }

                    var cbs = aWaiting[job.key] || [];
                    delete aWaiting[job.key];
                    for (var j = 0; j < cbs.length; j++) cbs[j](found);
                    aPump();
                }

                askParsers(job.data, function (results) { merge(results ? detectLangs(results) : null, results ? detectQuality(results) : ''); });
                askPlJackett(job.data, function (list) { merge(list); });
                askDubbingpedia(job.data, function (list) { merge(list); });
            })(aQueue.shift());
        }
    }

    /* Кнопка в налаштуваннях: перевірка на «Дюні 2» */
    function testParser() {
        if (!aNetwork) aNetwork = new Lampa.Reguest();
        Lampa.Noty.show(t('ls_audio_test_run'));

        var probe = { id: 693134, title: 'Дюна: Частина друга', original_title: 'Dune: Part Two', release_date: '2024-02-27' };

        askParsers(probe, function (results, p) {
            var msg = results
                ? t('ls_audio_test_ok').replace('{url}', p.url).replace('{n}', results.length).replace('{langs}', sortAudio(detectLangs(results)).join(', ') || '—') + ' · ' + t('ls_el_quality') + ': ' + (detectQuality(results) || '—')
                : t('ls_audio_test_fail');

            askDubbingpedia(probe, function (dp) {
                if (opt('pl_dub')) msg += ' · dubbingpedia.pl: ' + (dp === null ? t('ls_test_noanswer') : dp.length ? 'PL ✓' : '—');

                askPlJackett(probe, function (pj) {
                    if (plJackett()) msg += ' · ' + t('ls_pl_jackett_short') + ': ' + (pj === null ? t('ls_test_noanswer') : (sortAudio(pj).join(', ') || '—'));
                    Lampa.Noty.show(msg);
                });
            });
        });
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
            cat: tv ? (isShow(data) ? 'show' : 'tv') : 'movie',
            type: tv ? (isShow(data) ? t('ls_type_show') : t('ls_type_tv')) : t('ls_type_movie'),
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
        return countryAsFlag() && flagHtml(code) ? flagHtml(code) : esc(code);
    }

    function el(tag, cls, html) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (html !== undefined) e.innerHTML = html;
        return e;
    }

    /* Елементи моделі, які є що показати, з місцем і порядком */
    function placed(m) {
        var has = {
            type: true,
            vote: !!m.vote,
            quality: !!m.quality,
            year: !!m.year,
            country: !!m.country,
            audio: opt('audio') && m.audio.length > 0,
            ep: !!m.ep,
            info: !!m.info
        };

        var slots = { tl: [], tc: [], tr: [], bl: [], bc: [], br: [] };

        for (var i = 0; i < LAYOUT_KINDS.length; i++) {
            var kind = LAYOUT_KINDS[i];
            if (!has[kind]) continue;
            var l = layoutOf(kind);
            if (!slots[l.pos]) continue; // приховано
            slots[l.pos].push({ kind: kind, ord: l.ord, idx: i });
        }

        for (var p in slots) {
            slots[p].sort(function (a, b) { return a.ord - b.ord || a.idx - b.idx; });
        }
        return slots;
    }

    function audioNodes(m) {
        var out = [];
        for (var i = 0; i < m.audio.length; i++) {
            var tmp = document.createElement('div');
            tmp.innerHTML = audioHtml(m.audio[i]);
            out.push(tmp.firstChild);
        }
        return out;
    }

    /* Панелі (Obsidian, неонова, Apple TV, кінотеатр): один елемент */
    function panelUnit(kind, m) {
        var n;
        if (kind === 'audio') return audioNodes(m);
        if (kind === 'type') { n = item(m.cat, m.cat === 'movie' ? ICON.film : m.cat === 'show' ? ICON.signal : ICON.tv, m.type); n.classList.add('ls-cat'); }
        if (kind === 'vote') { n = item('vote', ICON.star, m.vote); n.classList.add(m.voteCls); }
        if (kind === 'quality') n = item('quality', ICON.gauge, m.quality);
        if (kind === 'year') n = item('year', '', m.year);
        if (kind === 'country') {
            var flag = countryAsFlag() && flagHtml(m.country);
            n = el('div', 'ls-i ls-i--country' + (flag ? ' has-flag' : ''), (flag ? '' : ICON.globe) + '<span>' + countryHtml(m.country) + '</span>');
        }
        if (kind === 'ep') { n = item('ep', m.ep.done ? ICON.check : ICON.clock, m.ep.text); n.classList.add(m.ep.done ? 'ep-done' : 'ep-wait'); }
        if (kind === 'info') { n = item(m.info.kind, m.info.kind === 'next' ? ICON.calendar : ICON.signal, m.info.text); if (m.info.cls) n.classList.add(m.info.cls); }
        return [n];
    }

    /* Кольорові плашки: один елемент */
    function colorUnit(kind, m) {
        function b(cls, html) { return el('div', 'ls-b ls-b--' + cls, html); }
        var n;
        if (kind === 'audio') return audioNodes(m);
        if (kind === 'type') { n = b('type', esc(m.type)); n.classList.add('is-' + m.cat); }
        if (kind === 'vote') { n = b('vote', m.vote); n.classList.add(m.voteCls); }
        if (kind === 'quality') n = b('quality', esc(m.quality));
        if (kind === 'year') n = b('year', esc(m.year));
        if (kind === 'country') { n = b('country', countryHtml(m.country)); if (countryAsFlag() && flagHtml(m.country)) n.classList.add('has-flag'); }
        if (kind === 'ep') { n = b('ep', esc(m.ep.text) + (m.ep.done ? ' ✓' : ICON.clock)); n.classList.add(m.ep.done ? 'ep-done' : 'ep-wait'); }
        if (kind === 'info') { n = b(m.info.kind, esc(m.info.text)); if (m.info.cls) n.classList.add(m.info.cls); }
        return [n];
    }

    /* Мінімалістичний: один елемент */
    function minimalUnit(kind, m, pos) {
        if (kind === 'audio') return audioNodes(m);
        if (kind === 'type') {
            var tab = pos === 'tc' || pos === 'bc';
            return [el('div', (tab ? 'ls-min-tab ' : 'ls-mtxt ') + 'is-' + m.cat, esc(m.type))];
        }
        if (kind === 'country') {
            var flag = countryAsFlag() && flagHtml(m.country);
            return [el('div', 'ls-mtxt ls-min-country' + (flag ? ' has-flag' : ''), countryHtml(m.country))];
        }
        var text = kind === 'ep' ? m.ep.text : kind === 'info' ? m.info.text : m[kind];
        return [el('div', 'ls-mtxt', esc(text))];
    }

    function fill(box, list, unit, m, pos) {
        for (var i = 0; i < list.length; i++) {
            var nodes = unit(list[i].kind, m, pos);
            for (var j = 0; j < nodes.length; j++) if (nodes[j]) box.appendChild(nodes[j]);
        }
    }

    /* Сітка з шести місць: однакові відступи від країв, однакова висота міток.
       Рейтинг і якість, що стоять поруч в одному місці, — в один рядок. */
    var INLINE_KINDS = ['vote', 'quality'];

    function renderGrid(wrap, m, unit, inline) {
        var slots = placed(m);

        [['top', ['tl', 'tc', 'tr']], ['bot', ['bl', 'bc', 'br']]].forEach(function (row) {
            var box = el('div', 'ls-rowbox ls-rowbox--' + row[0]);

            row[1].forEach(function (p) {
                if (!slots[p].length) return;
                var col = el('div', 'ls-pos ls-pos--' + p);
                var line = null;

                slots[p].forEach(function (sl) {
                    var nodes = unit(sl.kind, m, p);
                    var join = inline && INLINE_KINDS.indexOf(sl.kind) >= 0;

                    if (join) {
                        if (!line) { line = el('div', 'ls-inl'); col.appendChild(line); col.classList.add('ls-flexy'); }
                    } else line = null;

                    nodes.forEach(function (n) {
                        if (!n) return;
                        n.classList.add('ls-u');
                        (join ? line : col).appendChild(n);
                    });
                });

                box.appendChild(col);
            });

            if (box.childNodes.length) wrap.appendChild(box);
        });
    }

    function renderPanel(wrap, m) {
        renderGrid(wrap, m, panelUnit, true);
    }

    /* Стиль 2 — «Мінімалістичний»: смуги зверху й знизу */
    function renderMinimal(wrap, m) {
        var slots = placed(m);

        [['top', ['tl', 'tc', 'tr']], ['bot', ['bl', 'bc', 'br']]].forEach(function (strip) {
            var ps = strip[1];
            if (!slots[ps[0]].length && !slots[ps[1]].length && !slots[ps[2]].length) return;
            var box = el('div', 'ls-mstrip ls-mstrip--' + strip[0]);
            ['l', 'c', 'r'].forEach(function (side, i) {
                var sec = el('div', 'ls-msec ls-msec--' + side);
                fill(sec, slots[ps[i]], minimalUnit, m, ps[i]);
                box.appendChild(sec);
            });
            wrap.appendChild(box);
        });
    }

    /* Кольорові плашки */
    function renderColor(wrap, m) {
        renderGrid(wrap, m, colorUnit, false);
    }

    function render(wrap, model) {
        wrap.innerHTML = '';
        var st = badgeStyle();
        wrap.setAttribute('data-style', st);
        if (st === 'minimal') renderMinimal(wrap, model);
        else if (st === 'color') renderColor(wrap, model);
        else renderPanel(wrap, model); // Obsidian, неонова, Apple TV, кінотеатр
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
                    if (!model.country && info.countries && info.countries[0]) model.country = (info.countries[0] + '').toUpperCase();
                    applySeries(model, info);
                    render(wrap, model);
                });
            });
        }

        // фільми в списках Lampa приходять без країни — беремо з TMDB
        if (!model.tv && !model.country && data.id && tmdbLike && layoutOf('country').pos !== 'off') {
            whenVisible(card, function () {
                tmdbInfo('movie', data.id, function (info) {
                    if (!info || !wrap.parentNode || model.country) return;
                    if (info.countries && info.countries[0]) {
                        model.country = (info.countries[0] + '').toUpperCase();
                        render(wrap, model);
                    }
                });
            });
        }
        // серіал без даних серіалу (вимкнено) — теж довантажуємо країну
        if (model.tv && !model.country && data.id && tmdbLike && !opt('series') && layoutOf('country').pos !== 'off') {
            whenVisible(card, function () {
                tvInfo(data.id, function (info) {
                    if (!info || !wrap.parentNode || model.country) return;
                    if (info.countries && info.countries[0]) {
                        model.country = (info.countries[0] + '').toUpperCase();
                        render(wrap, model);
                    }
                });
            });
        }

        var needQuality = !model.quality && layoutOf('quality').pos !== 'off';

        if (data.id && (opt('audio') || needQuality) && useParser()) {
            whenVisible(card, function () {
                audioInfo(data, function (found) {
                    if (!found || !wrap.parentNode) return;
                    var langs = found.a || [];

                    if (opt('audio')) {
                        // якщо щось знайшли — оригінал теж є (як EN, якщо не UA/PL)
                        if (langs.length && !model.audio.length) addAudio(model, 'EN');
                        for (var i = 0; i < langs.length; i++) addAudio(model, langs[i]);
                    }
                    if (!model.quality && found.q) model.quality = found.q;

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
    /*  Прапорці доріжок у списку торентів                                 */
    /* ------------------------------------------------------------------ */

    var TFLAGS = { EN: 'gb', UA: 'ua', PL: 'pl' };

    function onTorrent(e) {
        if (e.type !== 'render' || !opt('enabled') || !opt('torrent_flags') || !e.element || !e.item) return;

        var node = e.item.jquery ? e.item[0] : e.item;
        if (!node || node.querySelector('.ls-tflags')) return;

        var langs = sortAudio(detectLangs([e.element]));
        if (!langs.length) return;

        var box = el('div', 'ls-tflags');
        for (var i = 0; i < langs.length; i++) {
            var code = langs[i];
            box.insertAdjacentHTML('beforeend',
                '<img class="ls-flag" src="https://flagcdn.com/w40/' + TFLAGS[code] + '.png" alt="' + code + '" title="' + code +
                '" onerror="this.outerHTML=\'<div class=&quot;ls-au ls-au--' + code.toLowerCase() + '&quot;>' + code + '</div>\'">');
        }

        var title = node.querySelector('.torrent-item__title');
        if (title && title.parentNode) title.parentNode.insertBefore(box, title.nextSibling);
        else node.insertBefore(box, node.firstChild);
    }

    /* ------------------------------------------------------------------ */
    /*  Старт                                                              */
    /* ------------------------------------------------------------------ */

    function start() {
        addSettings();
        addLayoutSettings();
        injectCss();
        loadCache();
        observeCards();
        Lampa.Listener.follow('full', onFull);
        Lampa.Listener.follow('torrent', onTorrent);
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
