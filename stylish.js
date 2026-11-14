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
    var VERSION = '1.3.1';

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
        ls_audio_src_auto:   'Автоматично (ваш парсер + резервний)',
        ls_audio_src_tmdb:   'Лише мова оригіналу (TMDB)',
        ls_audio_src_parser: 'Лише ваш парсер (Lampac / Jackett)',
        ls_audio_fallback:   'Резервний парсер',
        ls_audio_fallback_d: 'Використовується, якщо ваш парсер не налаштований або не відповідає',
        ls_audio_test:       'Перевірити пошук доріжок',
        ls_audio_test_run:   'Перевіряю парсер…',
        ls_audio_test_ok:    'Парсер працює: {url}. Знайдено роздач: {n}. Доріжки: {langs}',
        ls_audio_test_fail:  'Жоден парсер не відповів. Перевірте адресу парсера',
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
                name: ID + '_audio_fallback',
                type: 'select',
                values: { 'jac-red.ru': 'jac-red.ru', 'jac.red': 'jac.red', none: '—' },
                'default': 'jac-red.ru'
            },
            field: { name: t('ls_audio_fallback'), description: t('ls_audio_fallback_d') },
            onChange: function () { resetAudio(); redecorate(); }
        });

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
    /* -----------------------------------------
