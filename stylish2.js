/*!
 * Стильний інтерфейс 2.0 — плагін для Lampa
 * https://github.com/crux1974/Lampa
 *
 * Розділи «Рейтинги» і «Зовнішній вигляд» — власний код плагіна.
 * Розділ «Інформаційна панель» побудовано на основі плагіна
 * «Інтерфейс +» (interface+.js) автора ko31k — https://github.com/ko31k/LMP
 * Код змінено: власне меню українською, прибрано функції, які не ввійшли
 * до «Стильного інтерфейсу». Оригінальна ліцензія — нижче.
 *
 * MIT License
 *
 * Copyright (c) 2025 ko31k
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
(function () {
    'use strict';


    var SUI_VERSION = '2.0.0';
    // Функції «Інтерфейс +», яких немає в меню «Стильного інтерфейсу», вимкнені
    var SUI_FORCED = {
        interface_mod_new_theme_select: 'default',
        interface_mod_new_hide_info_panel: false,
        interface_mod_new_mobile_center: false,
        interface_mod_new_hide_tagline: false,
        interface_mod_new_colored_ratings: false,
        interface_mod_new_colored_status: false,
        interface_mod_new_all_buttons_v1: false,
        interface_mod_new_icon_only: false,
        interface_mod_new_colored_buttons: false,
        interface_mod_new_hide_year_title: false,
        interface_mod_new_year_on_cards: false,
        interface_mod_new_rating_on_cards: false,
        interface_mod_new_alt_badges: false,
        interface_mod_new_type_badges: false,
        interface_mod_new_alt_type_badges: false,
        interface_mod_new_episode_alt_cards: false,
        interface_mod_new_episode_numbers_only: false,
        interface_mod_new_mt: '-0.5',
        interface_mod_new_mb: '1'
    };
    try {
        Object.keys(SUI_FORCED).forEach(function (k) {
            var cur = Lampa.Storage.get(k, '__none__');
            if (String(cur) !== String(SUI_FORCED[k])) Lampa.Storage.set(k, SUI_FORCED[k]);
        });
    } catch (e) { }

    var IFX_TITLE_SIZE_DEFAULT = 0.75;
    var IFX_TMDB_UA_TTL_MS = 1000 * 60 * 60 * 24 * 2;
    var IFX_TMDB_UA_CACHE_PREFIX = 'ifx_tmdb_ua_title_v1.7:';
    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function (searchString, position) {
            position = position || 0;
            return this.indexOf(searchString, position) === position;
        };
    }
    function plural(n, one, two, five) {
        n = Math.abs(n) % 100;
        if (n >= 5 && n <= 20) return five;
        n = n % 10;
        if (n === 1) return one;
        if (n >= 2 && n <= 4) return two;
        return five;
    }
    function getBool(key, def) {
        var v = Lampa.Storage.get(key, def);
        if (typeof v === 'string') v = v.trim().toLowerCase();
        return v === true || v === 'true' || v === 1 || v === '1';
    }
    function cacheGet(key) {
        try {
            var raw = Lampa.Storage.get(key);
            if (!raw) return null;
            var obj = (typeof raw === 'string') ? JSON.parse(raw) : raw;
            if (!obj || !obj.t || !obj.v) return null;
            if ((Date.now() - obj.t) > IFX_TMDB_UA_TTL_MS) return null;
            return String(obj.v || '').trim();
        } catch (e) { return null; }
    }
    function cacheSet(key, val) {
        try {
            var obj = { t: Date.now(), v: String(val || '').trim() };
            Lampa.Storage.set(key, JSON.stringify(obj));
        } catch (e) { }
    }
    function tmdbCacheKey(movie) {
        if (!movie) return '';
        var id = movie.tmdb_id || movie.id;
        if (!id) return '';
        var isTvShow = (
            /tv|serial/i.test(movie.type || movie.media_type) ||
            movie.number_of_seasons > 0 ||
            (movie.seasons && movie.seasons.length > 0) ||
            movie.first_air_date
        );
        var type = isTvShow ? 'tv' : 'movie';
        return IFX_TMDB_UA_CACHE_PREFIX + type + ':' + String(id);
    }
    function isMonoEnabled() {
        try {
            return getBool('interface_mod_new_mono_mode', false);
        } catch (e) {
            return false;
        }
    }
    function isMonoFor(settingKey) {
        return isMonoEnabled() && getBool(settingKey, false);
    }
    function applyMonoBadgeStyle(el) {
        if (!el || !el.style) return;
        [
            'background-color', 'color', 'border', 'border-color', 'border-width', 'border-style',
            'box-shadow', 'text-shadow'
        ].forEach(function (p) {
            try { el.style.removeProperty(p); } catch (e) { }
        });
        el.style.setProperty('border-width', '1px', 'important');
        el.style.setProperty('border-style', 'solid', 'important');
        el.style.setProperty('border-color', 'rgba(255,255,255,.45)', 'important');
        el.style.setProperty('background-color', 'rgba(255,255,255,.08)', 'important');
        el.style.setProperty('color', '#fff', 'important');
    }
    function calculateAverageEpisodeDuration(movie) {
        if (!movie || typeof movie !== 'object') return 0;
        var total = 0,
            count = 0;
        if (Array.isArray(movie.episode_run_time) && movie.episode_run_time.length) {
            movie.episode_run_time.forEach(function (m) {
                if (m > 0 && m <= 200) {
                    total += m;
                    count++;
                }
            });
        } else if (Array.isArray(movie.seasons)) {
            movie.seasons.forEach(function (s) {
                if (Array.isArray(s.episodes)) {
                    s.episodes.forEach(function (e) {
                        if (e.runtime && e.runtime > 0 && e.runtime <= 200) {
                            total += e.runtime;
                            count++;
                        }
                    });
                }
            });
        }
        if (count > 0) return Math.round(total / count);
        if (movie.last_episode_to_air && movie.last_episode_to_air.runtime &&
            movie.last_episode_to_air.runtime > 0 && movie.last_episode_to_air.runtime <= 200) {
            return movie.last_episode_to_air.runtime;
        }
        return 0;
    }
    function formatDurationMinutes(minutes) {
        if (!minutes || minutes <= 0) return '';
        var h = Math.floor(minutes / 60),
            m = minutes % 60,
            out = '';
        if (h > 0) {
            out += h + ' ' + plural(h, 'година', 'години', 'годин');
            if (m > 0) out += ' ' + m + ' ' + plural(m, 'хвилина', 'хвилини', 'хвилин');
        } else {
            out += m + ' ' + plural(m, 'хвилина', 'хвилини', 'хвилин');
        }
        return out;
    }

    Lampa.Lang.add({
        interface_mod_new_group_title: {
            en: 'Interface +',
            uk: 'Інтерфейс +'
        },
        interface_mod_new_plugin_name: {
            en: 'Interface +',
            uk: 'Інтерфейс +'
        },
        interface_mod_new_hide_info_panel: {
            en: 'Hide info panel',
            uk: 'Приховати інфо-панель'
        },
        interface_mod_new_hide_info_panel_desc: {
            en: 'Completely hides the info panel with details',
            uk: 'Повністю приховує панель з інформацією (тривалість, жанри тощо)'
        },
        interface_mod_new_info_panel: {
            en: 'New info panel',
            uk: 'Нова інфо-панель'
        },
        interface_mod_new_info_panel_desc: {
            en: 'Colored and rephrased info line',
            uk: 'Кольорова та перефразована інформаційна панель'
        },
        interface_mod_new_margins_menu: {
            en: 'Configure panel margins',
            uk: 'Налаштувати відступи для панелі'
        },
        interface_mod_new_margins_menu_desc: {
            en: 'Allows changing top and bottom margins for the info panel',
            uk: 'Дозволяє змінити відступ зверху чи знизу для інфо-панелі'
        },
        interface_mod_new_mt: {
            en: 'Edit top margin',
            uk: 'Редагувати відступ зверху'
        },
        interface_mod_new_mt_desc: {
            en: 'Default: -0.5. Supports "+" and "-" values.',
            uk: 'За замовчуванням -0.5. Можна вводити як додатні, так і від\'ємні значення.'
        },
        interface_mod_new_mb: {
            en: 'Edit bottom margin',
            uk: 'Редагувати відступ знизу'
        },
        interface_mod_new_mb_desc: {
            en: 'Default: 1. Supports "+" and "-" values.',
            uk: 'За замовчуванням 1. Можна вводити як додатні, так і від\'ємні значення.'
        },
        interface_mod_new_mobile_center: {
            en: 'Mobile centering',
            uk: 'Центрування на мобільних'
        },
        interface_mod_new_mobile_center_desc: {
            en: 'Center title, info and buttons on portrait screens',
            uk: 'Центрувати заголовок, інфо-панель та кнопки на вертикальних екранах'
        },
        interface_mod_new_hide_tagline: {
            en: 'Hide tagline',
            uk: 'Приховати слоган'
        },
        interface_mod_new_hide_tagline_desc: {
            en: 'Hide the movie/series tagline under the title',
            uk: 'Приховує слоган фільму/серіалу під головною назвою'
        },
        interface_mod_new_colored_bookmarks: {
            en: 'Colored bookmark icons',
            uk: 'Кольорові іконки закладок'
        },
        interface_mod_new_colored_bookmarks_desc: {
            en: 'Colorize icons for Bookmarks, History, and Likes on cards',
            uk: 'Підсвічувати кольорами іконки (Закладки, Історія, Пізніше)'
        },
        interface_mod_new_colored_ratings: {
            en: 'Colored rating',
            uk: 'Кольоровий рейтинг'
        },
        interface_mod_new_colored_ratings_desc: {
            en: 'Enable colored rating highlight',
            uk: 'Увімкнути кольорове виділення рейтингу в повній картці'
        },
        interface_mod_new_show_status: {
            en: 'Show statuses',
            uk: 'Показувати статуси'
        },
        interface_mod_new_show_status_desc: {
            en: 'Show or hide movie/series statuses',
            uk: 'Відображати або приховувати статус фільму/серіалу (напр. "Випущено")'
        },
        interface_mod_new_show_age: {
            en: 'Show age rating',
            uk: 'Показувати віковий рейтинг'
        },
        interface_mod_new_show_age_desc: {
            en: 'Show or hide age rating badge (PG)',
            uk: 'Відображати або приховувати плашку вікового рейтингу (PG)'
        },
        interface_mod_new_colored_status: {
            en: 'Colored statuses',
            uk: 'Кольорові статуси'
        },
        interface_mod_new_colored_status_desc: {
            en: 'Colorize series status',
            uk: 'Підсвічувати статус фільму/серіалу в повній картці'
        },
        interface_mod_new_colored_age: {
            en: 'Colored age rating',
            uk: 'Кольоровий віковий рейтинг '
        },
        interface_mod_new_colored_age_desc: {
            en: 'Colorize age rating',
            uk: 'Підсвічувати віковий рейтинг в повній картці'
        },
        interface_mod_new_mono_mode: {
            en: 'Monochrome override',
            uk: 'Монохромний режим (Ч/Б)'
        },
        interface_mod_new_mono_mode_desc: {
            en: 'Overrides colors for statuses, age rating and the new info panel (only when those options are enabled)',
            uk: 'Перекриває кольори для статусів, PG та нової інфо-панелі (якщо відповідні опції увімкнені)'
        },
        interface_mod_new_theme_select_title: {
            en: 'Interface theme',
            uk: 'Тема інтерфейсу'
        },
        interface_mod_new_theme_default: {
            en: 'Default',
            uk: 'За замовчуванням'
        },
        interface_mod_new_theme_emerald_v1: {
            en: 'Emerald V1',
            uk: 'Emerald V1'
        },
        interface_mod_new_theme_emerald_v2: {
            en: 'Emerald V2',
            uk: 'Emerald V2'
        },
        interface_mod_new_theme_aurora: {
            en: 'Aurora',
            uk: 'Aurora'
        },
        interface_mod_new_theme_netflix: {
            en: 'Netflix Style',
            uk: 'Netflix Style'
        },
        interface_mod_new_theme_spotify: {
            en: 'Spotify Dark',
            uk: 'Spotify Dark'
        },
        interface_mod_new_theme_cyberpunk: {
            en: 'Cyberpunk Neon',
            uk: 'Cyberpunk Neon'
        },
        interface_mod_new_theme_amoled: {
            en: 'Amoled Black',
            uk: 'Amoled Black'
        },
        interface_mod_new_theme_ocean: {
            en: 'Ocean Glass',
            uk: 'Ocean Glass'
        },
        interface_mod_new_theme_mint: {
            en: 'Mint Fresh',
            uk: 'Mint Fresh'
        },
        interface_mod_new_theme_dark_mint: {
            en: 'Dark Mint',
            uk: 'Dark Mint'
        },
        interface_mod_new_theme_prime: {
            en: 'Prime Blue',
            uk: 'Prime Blue'
        },
        interface_mod_new_theme_twitch: {
            en: 'Twitch Dark',
            uk: 'Twitch Dark'
        },
        interface_mod_new_theme_apple: {
            en: 'Apple Glass',
            uk: 'Apple Glass'
        },
        interface_mod_new_theme_hulu: {
            en: 'Hulu Green',
            uk: 'Hulu Green'
        },
        interface_mod_new_title_mode: {
            en: 'Titles under header',
            uk: 'Назви під заголовком'
        },
        interface_mod_new_title_mode_desc: {
            en: 'Show original title, localized title, both, or hide',
            uk: 'Показувати оригінальну, локалізовану, обидві або вимкнути'
        },
        interface_mod_new_tmdb_api_key_name: {
            en: 'TMDB API Key',
            uk: 'TMDB API Ключ'
        },
        interface_mod_new_tmdb_api_key_desc: {
            en: 'Custom API key for accurate Ukrainian titles',
            uk: 'Власний ключ для точного отримання українських назв'
        },
        interface_mod_new_title_mode_off: { en: 'No', uk: 'Ні' },
        interface_mod_new_title_mode_orig: { en: 'Original title', uk: 'Оригінальна назва' },
        interface_mod_new_title_mode_loc: { en: 'Localized title', uk: 'Локалізована назва' },
        interface_mod_new_title_mode_orig_loc: { en: 'Original / Localized', uk: 'Оригінальна / Локалізована назва' },
        interface_mod_new_title_size_name: { en: 'Title size', uk: 'Розмір назви' },
        interface_mod_new_title_size_desc: { en: 'Font size (default 0.75)', uk: 'Розмір шрифту (за замовч. 0.75)' },
        interface_mod_new_all_buttons_v1: {
            en: 'All buttons in card',
            uk: 'Всі кнопки в картці'
        },
        interface_mod_new_all_buttons_desc: {
            en: 'Show all buttons in the card.',
            uk: 'Показує всі кнопки у картці (Потрібне перезавантаження)'
        },
        interface_mod_new_icon_only: {
            en: 'Icons only',
            uk: 'Кнопки без тексту'
        },
        interface_mod_new_icon_only_desc: {
            en: 'Hide button labels, keep only icons',
            uk: 'Ховає підписи на кнопках, лишає тільки іконки'
        },
        interface_mod_new_colored_buttons: {
            en: 'Colored buttons',
            uk: 'Кольорові кнопки'
        },
        interface_mod_new_colored_buttons_desc: {
            en: 'Colorize card buttons and update icons',
            uk: 'Оновлює іконки та кольори кнопок онлайн, торенти, трейлери'
        },
        torr_mod_frame: {
            uk: 'Кольорова рамка блоку торентів',
            en: 'Colored torrent frame by seeders'
        },
        torr_mod_frame_desc: {
            uk: 'Підсвічувати блоки торентів кольоровою рамкою залежно від кількості сідерів',
            en: 'Outline torrent rows based on seeder count'
        },
        torr_mod_bitrate: {
            uk: 'Кольоровий  бітрейт',
            en: 'Bitrate-based coloring'
        },
        torr_mod_bitrate_desc: {
            uk: 'Підсвічувати бітрейт кольором в залежності від розміру',
            en: 'Color bitrate by value'
        },
        torr_mod_seeds: {
            uk: 'Кольорова кількість роздаючих',
            en: 'Seeder count coloring'
        },
        torr_mod_seeds_desc: {
            uk: 'Підсвічувати кількість сідерів на роздачі: \n0–5 — червоний, 6–19 — жовтий, 20 і вище — зелений',
            en: 'Seeders: 0–5 red, 6–19 yellow, 20+ green'
        },
    });

    function getTitleSizeEm() {
        var raw = Lampa.Storage.get('interface_mod_new_title_size', String(IFX_TITLE_SIZE_DEFAULT));
        var n = parseFloat(String(raw).replace(',', '.'));
        if (!isFinite(n) || n <= 0) n = IFX_TITLE_SIZE_DEFAULT;
        if (n < 0.4) n = 0.4;
        if (n > 2.5) n = 2.5;
        return n;
    }
    function applyTitleSizeNow() {
        try {
            var n = getTitleSizeEm();
            document.documentElement.style.setProperty('--ifx-title-size', n + 'em');
        } catch (e) { }
    }
    function applyMargins() {
        var mt = String(Lampa.Storage.get('interface_mod_new_mt', '-0.5')).trim();
        var mb = String(Lampa.Storage.get('interface_mod_new_mb', '1')).trim();
        if (mt !== '' && !isNaN(mt)) mt += 'em';
        if (mb !== '' && !isNaN(mb)) mb += 'em';
        var id = 'ifx_margins_dynamic';
        var st = document.getElementById(id);
        if (!st) {
            st = document.createElement('style');
            st.id = id;
            document.head.appendChild(st);
        }
        st.textContent = '.full-start-new__details, .full-start__details { margin-top: ' + mt + ' !important; margin-bottom: ' + mb + ' !important; }';
    }
    Lampa.Template.add('settings_ifx_margins', '<div></div>');
    function pickUaFromTranslations(res, type) {
        try {
            var tr = res && res.translations && res.translations.translations;
            if (!tr || !tr.length) return '';
            var ua = null;
            for (var i = 0; i < tr.length; i++) {
                var t = tr[i];
                if (!t) continue;
                if (String(t.iso_639_1 || '').toLowerCase() === 'uk') { ua = t; break; }
                if (String(t.iso_3166_1 || '').toUpperCase() === 'UA') { ua = t; }
            }
            if (!ua || !ua.data) return '';
            var s = (type === 'tv') ? (ua.data.name || ua.data.title) : (ua.data.title || ua.data.name);
            return String(s || '').trim();
        } catch (e) {
            return '';
        }
    }
    function fetchTmdbUaTitle(movie, cb) {
        try {
            if (!movie) return cb('');
            var id = movie.tmdb_id || movie.id;
            if (!id) return cb('');
            var isTvShow = (
                /tv|serial/i.test(movie.type || movie.media_type) ||
                movie.number_of_seasons > 0 ||
                (movie.seasons && movie.seasons.length > 0) ||
                movie.first_air_date
            );
            var type = isTvShow ? 'tv' : 'movie';
            var key = tmdbCacheKey(movie);
            if (key) {
                var hit = cacheGet(key);
                if (hit) return cb(hit);
            }
            var userApiKey = String(Lampa.Storage.get('interface_mod_new_tmdb_api_key') || '').trim();
            var defaultApiKey = '1ad1fd4b4938e876aa6c96d0cded9395';
            var activeApiKey = userApiKey || defaultApiKey;
            var onSuccess = function (title) {
                if (title && key) cacheSet(key, title);
                cb(title || '');
            };
            if (activeApiKey) {
                var url = 'https://api.themoviedb.org/3/' + type + '/' + id + '?api_key=' + activeApiKey + '&language=uk-UA&append_to_response=translations';
                $.ajax({
                    url: url,
                    type: 'GET',
                    dataType: 'json',
                    success: function (res) {
                        var title = pickUaFromTranslations(res, type);
                        if (!title) title = (type === 'tv') ? res.name : res.title;
                        if (title) {
                            onSuccess(title);
                        } else {
                            fallbackLampaApi();
                        }
                    },
                    error: function () {
                        fallbackLampaApi();
                    }
                });
            } else {
                fallbackLampaApi();
            }
            function fallbackLampaApi() {
                if (Lampa.Api && typeof Lampa.Api.tmdb === 'function') {
                    var bust = Date.now();
                    Lampa.Api.tmdb(type + '/' + id, { language: 'uk-UA', append_to_response: 'translations', _ifx: bust }, function (res) {
                        var title = pickUaFromTranslations(res, type);
                        if (!title) title = (type === 'tv') ? res.name : res.title;
                        onSuccess(title);
                    }, function () {
                        fallbackTMDB();
                    });
                } else {
                    fallbackTMDB();
                }
            }
            function fallbackTMDB() {
                if (Lampa.TMDB && typeof Lampa.TMDB.get === 'function') {
                    Lampa.TMDB.get(type, id, { language: 'uk-UA', append_to_response: 'translations' }, function (res) {
                        var title = pickUaFromTranslations(res, type);
                        if (!title) title = (type === 'tv') ? res.name : res.title;
                        onSuccess(title);
                    }, function () {
                        cb('');
                    });
                } else {
                    cb('');
                }
            }
        } catch (e) {
            cb('');
        }
    }
    function getLocalizedTitleAsync(movie, cb) {
        if (!movie) return cb('');
        fetchTmdbUaTitle(movie, function (uaTitle) {
            if (uaTitle) {
                return cb(uaTitle);
            }
            var uiLoc = String((movie && (movie.title || movie.name)) || '').trim();
            cb(uiLoc);
        });
    }
    function getOriginalTitleEnabled() {
        var rawNew = Lampa.Storage.get('interface_mod_new_en_data');
        if (typeof rawNew !== 'undefined') return getBool('interface_mod_new_en_data', true);
        return getBool('interface_mod_new_english_data', false);
    }
    function getTitleMode() {
        var m = Lampa.Storage.get('interface_mod_new_title_mode_v1');
        if (typeof m !== 'undefined' && m !== null && m !== '') {
            m = String(m);
            if (m === 'orig_ua') m = 'orig_loc';
            if (m !== 'off' && m !== 'orig' && m !== 'loc' && m !== 'orig_loc') m = 'orig';
            return m;
        }
        var old = Lampa.Storage.get('interface_mod_new_en_data');
        if (typeof old !== 'undefined') return getBool('interface_mod_new_en_data', true) ? 'orig' : 'off';
        var older = Lampa.Storage.get('interface_mod_new_english_data');
        if (typeof older !== 'undefined') return getBool('interface_mod_new_english_data', false) ? 'orig' : 'off';
        return 'orig';
    }
    var settings = {
        info_panel: getBool('interface_mod_new_info_panel', true),
        hide_info_panel: getBool('interface_mod_new_hide_info_panel', false),
        mobile_center: getBool('interface_mod_new_mobile_center', false),
        hide_tagline: getBool('interface_mod_new_hide_tagline', false),
        colored_ratings: getBool('interface_mod_new_colored_ratings', false),
        show_status: getBool('interface_mod_new_show_status', true),
        show_age: getBool('interface_mod_new_show_age', true),
        colored_status: getBool('interface_mod_new_colored_status', false),
        colored_age: getBool('interface_mod_new_colored_age', false),
        mono_mode: getBool('interface_mod_new_mono_mode', false),
        theme: (Lampa.Storage.get('interface_mod_new_theme_select', 'default') || 'default'),
        en_data: getOriginalTitleEnabled(),
        all_buttons: getBool('interface_mod_new_all_buttons_v1', false),
        icon_only: getBool('interface_mod_new_icon_only', false),
        colored_buttons: getBool('interface_mod_new_colored_buttons', false),
        tor_frame: getBool('interface_mod_new_tor_frame', true),
        tor_bitrate: getBool('interface_mod_new_tor_bitrate', true),
        tor_seeds: getBool('interface_mod_new_tor_seeds', true),
    };
    var __ifx_last = {
        details: null,
        movie: null,
        originalHTML: '',
        isTv: false,
        fullRoot: null
    };
    var __ifx_btn_cache = {
        container: null,
        nodes: null
    };

    function injectFallbackCss() {
        if (document.getElementById('ifx_fallback_css')) return;
        var st = document.createElement('style');
        st.id = 'ifx_fallback_css';
        st.textContent = `
      .ifx-status-fallback{ border-color:#fff !important; background:none !important; color:inherit !important; }
      .ifx-age-fallback{    border-color:#fff !important; background:none !important; color:inherit !important; }
    `;
        document.head.appendChild(st);
    }
    function ensureStylesPriority(ids) {
        var head = document.head;
        ids.forEach(function (id) {
            var el = document.getElementById(id);
            if (el && el.parentNode === head) {
                head.removeChild(el);
                head.appendChild(el);
            }
        });
    }

    (function injectBaseCss() {
        if (document.getElementById('interface_mod_base')) return;
        var css = `
  .full-start-new__details{
    color:#fff !important;
    margin:-0.45em !important;
    margin-bottom:1em !important;
    display:flex !important;
    align-items:center !important;
    flex-wrap:wrap !important;
    min-height:1.9em !important;
    font-size:1.1em !important;
  }
  *:not(input){
    -webkit-user-select:none !important;
    -moz-user-select:none !important;
    -ms-user-select:none !important;
    user-select:none !important;
  }
  *{
    -webkit-tap-highlight-color:transparent;
    -webkit-touch-callout:none;
    box-sizing:border-box;
    outline:none;
    -webkit-user-drag:none;
  }
  .full-start-new__rate-line > * {
    margin-left: 0 !important;
    margin-right: 1em !important;
    flex-shrink: 0;
    flex-grow: 0;
  }
  .ifx-original-title{
    color: #ccc; 
    font-size: var(--ifx-title-size, 0.75em);
    font-weight: 600;
    margin-top: 4px;
    border-left: 2px solid #777;
    padding-left: 8px;
    text-shadow: 
      1px 1px 2px rgba(0, 0, 0, 0.9),
      -1px -1px 2px rgba(0, 0, 0, 0.6),
      0 0 6px rgba(0, 0, 0, 0.9);
  }
  .full-start-new__head {
    text-shadow: 
      1px 1px 2px rgba(0, 0, 0, 0.9),
      -1px -1px 2px rgba(0, 0, 0, 0.6),
      0 0 6px rgba(0, 0, 0, 0.9);
}
  .ifx-btn-icon-only .full-start__button span,
  .ifx-btn-icon-only .full-start__button .full-start__text{
    display:none !important;
  }
  .full-start__buttons.ifx-flex,
  .full-start-new__buttons.ifx-flex{
    display:flex !important;
    flex-wrap:wrap !important;
    gap:10px !important;
  }
  body.ifx-hide-status .full-start__status,
  body.ifx-hide-status .full-start-new__status,
  body.ifx-hide-status .full-start__soon,
  body.ifx-hide-status .full-start-new__soon,
  body.ifx-hide-status .full-start [data-status],
  body.ifx-hide-status .full-start-new [data-status] {
    display: none !important;
  }
  .applecation .applecation__meta .full-start__pg {
  margin-left: 0.7em !important; 
  }
  body.ifx-hide-pg .full-start__pg,
  body.ifx-hide-pg .full-start-new__pg,
  body.ifx-hide-pg .full-start [data-pg],
  body.ifx-hide-pg .full-start-new [data-pg],
  body.ifx-hide-pg .full-start [data-age],
  body.ifx-hide-pg .full-start-new [data-age] {
    display: none !important;
  }
`;
        var st = document.createElement('style');
        st.id = 'interface_mod_base';
        st.textContent = css;
        document.head.appendChild(st);
    })();
    function setTaglineHidden(hidden) {
        var id = 'ifx_hide_tagline_css';
        var el = document.getElementById(id);
        if (el) el.remove();
        if (hidden) {
            var css = '.full-start-new__tagline, .full-start__tagline, .full--tagline { display: none !important; }';
            var st = document.createElement('style');
            st.id = id;
            st.textContent = css;
            document.head.appendChild(st);
        }
    }
    function setInfoPanelHidden(hidden) {
        var id = 'ifx_hide_info_panel_css';
        var el = document.getElementById(id);
        if (el) el.remove();
        if (hidden) {
            var css = '.full-start-new__details, .full-start__details { display: none !important; }';
            var st = document.createElement('style');
            st.id = id;
            st.textContent = css;
            document.head.appendChild(st);
        }
    }
    function injectMobilePosterCss() {
        if (document.getElementById('ifx_mobile_poster_css')) return;
        var st = document.createElement('style');
        st.id = 'ifx_mobile_poster_css';
        st.textContent =
            '@media screen and (max-width: 400px) {' +
            '.full-start-new__img{' +
            '-webkit-mask-image:-webkit-gradient(linear,left top,left bottom,color-stop(40%,white),to(rgba(255,255,255,0)));' +
            '-webkit-mask-image:-webkit-linear-gradient(top,white 40%,rgba(255,255,255,0) 100%);' +
            'mask-image:-webkit-gradient(linear,left top,left bottom,color-stop(40%,white),to(rgba(255,255,255,0)));' +
            'mask-image:linear-gradient(to bottom,white 40%,rgba(255,255,255,0) 100%);' +
            '}' +
            '.full-start-new__right{' +
            'background:-webkit-gradient(linear,left top,left bottom,from(rgba(0,0,0,0.5)),to(rgba(0,0,0,0)));' +
            'background:-webkit-linear-gradient(top,rgba(0,0,0,0.5) 0%,rgba(0,0,0,0) 100%);' +
            'background:-moz-linear-gradient(top,rgba(0,0,0,0.5) 0%,rgba(0,0,0,0) 100%);' +
            'background:-o-linear-gradient(top,rgba(0,0,0,0.5) 0%,rgba(0,0,0,0) 100%);' +
            'background:linear-gradient(to bottom,rgba(0,0,0,0.5) 0%,rgba(0,0,0,0) 100%);' +
            '-webkit-backdrop-filter:blur(1em);' +
            'backdrop-filter:blur(1em);' +
            '}' +
            '}';
        document.head.appendChild(st);
    }
    function setMobileCenteringEnabled(enabled) {
        var id = 'ifx_mobile_center_css';
        var el = document.getElementById(id);
        if (el) el.remove();
        if (!enabled) return;
        var css = `
      @media (max-aspect-ratio: 1/1) {
        .full-start-new__title, .full-start__title { 
            text-align: center !important; 
            width: 100%;
        }
        .full-start-new__tagline, .full-start__tagline, .full--tagline { text-align: center !important; justify-content: center !important; }
        .full-start-new__head, .full-start__head { align-items: center !important; text-align: center !important; }
        .ifx-original-title { border-left: none !important; padding-left: 0 !important; margin-left: auto !important; margin-right: auto !important; border-bottom: 2px solid #777; padding-bottom: 2px; }
        .full-start-new__details, .full-start__details { justify-content: center !important; text-align: center !important; }
        .full-start-new__details > div, .full-start__details > div { align-items: center !important; margin-left: 0 !important; margin-right: 0 !important; }
        .full-start-new__details > div > div, .full-start__details > div > div { justify-content: center !important; }
        .full-start-new__rate-line, .full-start__rate-line { justify-content: center !important; flex-wrap: wrap !important; }
        .quality-badges-under-rate, .quality-badges-after-details { justify-content: center !important; }
        .full-start-new__buttons, .full-start__buttons { justify-content: center !important; }
      }
    `;
        var st = document.createElement('style');
        st.id = id;
        st.textContent = css;
        document.head.appendChild(st);
    }

    function injectBookmarksCss() {
        if (document.getElementById('ifx_bookmarks_css')) return;
        var st = document.createElement('style');
        st.id = 'ifx_bookmarks_css';
        st.textContent = `
      body.ifx-colored-bookmarks .card__icon.icon--book {
        filter: brightness(0) saturate(100%) invert(37%) sepia(94%) saturate(3583%) hue-rotate(204deg) brightness(102%) contrast(105%) !important;
      }
      body.ifx-colored-bookmarks .card__icon.icon--history {
        filter: brightness(0) saturate(100%) invert(59%) sepia(63%) saturate(452%) hue-rotate(80deg) brightness(97%) contrast(92%) !important;
      }
      body.ifx-colored-bookmarks .card__icon.icon--like {
        filter: brightness(0) saturate(100%) invert(12%) sepia(90%) saturate(6871%) hue-rotate(358deg) brightness(109%) contrast(113%) !important;
      }
      body.ifx-colored-bookmarks .card__icon.icon--wath {
        filter: brightness(0) saturate(100%) invert(63%) sepia(83%) saturate(2274%) hue-rotate(354deg) brightness(101%) contrast(104%) !important;
      }
    `;
        document.head.appendChild(st);
    }   
  
    function toggleBookmarksColor(enabled) {
        document.body.classList.toggle('ifx-colored-bookmarks', enabled);
    }

    function applyTheme(theme) {
        var old = document.getElementById('interface_mod_theme');
        if (old) old.remove();
        if (!theme || theme === 'default') return;
        var b = '.menu__item, .settings-folder, .settings-param, .selectbox-item, .full-start__button, .full-descr__tag, .player-panel .button, .custom-online-btn, .custom-torrent-btn, .main2-more-btn, .simple-button, .menu__version';
        var f = '.menu__item.focus, .menu__item.traverse, .menu__item.hover, .settings-folder.focus, .settings-param.focus, .selectbox-item.focus, .full-start__button.focus, .full-descr__tag.focus, .player-panel .button.focus, .custom-online-btn.focus, .custom-torrent-btn.focus, .main2-more-btn.focus, .simple-button.focus, .menu__version.focus';
        var c = '.card.focus .card__view::after, .card.hover .card__view::after';
        var m = '.settings__content, .settings-input__content, .selectbox__content, .modal__content';
        var performanceCss = b + ' { transition: transform 0.2s ease-out, box-shadow 0.2s ease-out, background-color 0.2s ease-out, color 0.2s ease-out !important; } ';
        var themeCss = {
            emerald_v1:
                'body { background: linear-gradient(135deg, #0c1619 0%, #132730 50%, #18323a 100%) !important; color: #dfdfdf !important; } ' +
                b + ' { border-radius: 1.0em !important; } ' +
                f + ' { background: linear-gradient(to right, #1a594d, #0e3652) !important; color: #fff !important; box-shadow: 0 2px 8px rgba(26,89,77,.25) !important; } ' +
                c + ' { border: 2px solid #1a594d !important; box-shadow: 0 0 10px rgba(26,89,77,.35) !important; border-radius: 1.0em !important; } ' +
                m + ' { background: rgba(12,22,25,.97) !important; border: 1px solid rgba(26,89,77,.12) !important; border-radius: 1.0em !important; }',
            emerald_v2:
                'body { background: radial-gradient(1200px 600px at 70% 10%, #214a57 0%, transparent 60%), linear-gradient(135deg, #112229 0%, #15303a 45%, #0f1c22 100%) !important; color:#e6f2ef !important; } ' +
                b + ' { border-radius: .85em !important; } ' +
                f + ' { background: linear-gradient(90deg, rgba(38,164,131,0.95), rgba(18,94,138,0.95)) !important; color:#fff !important; -webkit-backdrop-filter: blur(2px) !important; backdrop-filter: blur(2px) !important; box-shadow:0 6px 18px rgba(18,94,138,.35) !important; } ' +
                c + ' { border: 3px solid rgba(38,164,131,0.9) !important; box-shadow: 0 0 20px rgba(38,164,131,.45) !important; border-radius: .9em !important; } ' +
                m + ' { background: rgba(10,24,29,0.98) !important; border: 1px solid rgba(38,164,131,.15) !important; border-radius: .9em !important; }',
            aurora:
                'body { background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%) !important; color: #ffffff !important; } ' +
                b + ' { border-radius: .85em !important; } ' +
                f + ' { background: linear-gradient(90deg, #aa4b6b, #6b6b83, #3b8d99) !important; color:#fff !important; box-shadow: 0 0 20px rgba(170,75,107,.35) !important; } ' +
                c + ' { border: 2px solid #aa4b6b !important; box-shadow: 0 0 22px rgba(170,75,107,.45) !important; border-radius: .9em !important; } ' +
                m + ' { background: rgba(20, 32, 39, 0.98) !important; border: 1px solid rgba(59,141,153,.18) !important; border-radius: .9em !important; }',
            netflix:
                'body { background: #141414 !important; color: #ffffff !important; } ' +
                b + ' { border-radius: 0.4em !important; } ' +
                f + ' { background: #E50914 !important; color: #fff !important; box-shadow: 0 4px 15px rgba(229,9,20,.4) !important; } ' +
                c + ' { border: 3px solid #E50914 !important; box-shadow: 0 0 18px rgba(229,9,20,.5) !important; border-radius: 0.4em !important; } ' +
                m + ' { background: rgba(20, 20, 20, 0.98) !important; border: 1px solid rgba(229,9,20,.25) !important; border-radius: 0.4em !important; }',
            spotify:
                'body { background: linear-gradient(135deg, #282828 0%, #121212 40%, #000000 100%) !important; color: #ffffff !important; } ' +
                b + ' { border-radius: 2em !important; } ' +
                f + ' { background: #1DB954 !important; color: #000 !important; box-shadow: 0 4px 15px rgba(29,185,84,.3) !important; font-weight: bold !important; } ' +
                c + ' { border: 3px solid #1DB954 !important; box-shadow: 0 0 15px rgba(29,185,84,.4) !important; border-radius: 0.6em !important; } ' +
                m + ' { background: rgba(18, 18, 18, 0.98) !important; border: 1px solid rgba(29,185,84,.2) !important; border-radius: 0.6em !important; }',
            cyberpunk:
                'body { background: linear-gradient(135deg, #09090e 0%, #1a0b2e 100%) !important; color: #e0e0e0 !important; } ' +
                b + ' { border-radius: 0.3em !important; } ' +
                f + ' { background: linear-gradient(90deg, #ff003c, #00f0ff) !important; color: #fff !important; box-shadow: 0 0 15px rgba(255,0,60,.6) !important; } ' +
                c + ' { border: 2px solid #00f0ff !important; box-shadow: 0 0 20px rgba(0,240,255,.6), inset 0 0 10px rgba(255,0,60,.4) !important; border-radius: 0.3em !important; } ' +
                m + ' { background: rgba(10, 10, 15, 0.96) !important; border: 1px solid #ff003c !important; border-radius: 0.3em !important; }',
            amoled:
                'body { background: #000000 !important; color: #dfdfdf !important; } ' +
                b + ' { border-radius: 0.5em !important; } ' +
                f + ' { background: #bb86fc !important; color: #000 !important; box-shadow: 0 0 12px rgba(187,134,252,.5) !important; font-weight: 600 !important; } ' +
                c + ' { border: 2px solid #bb86fc !important; box-shadow: 0 0 15px rgba(187,134,252,.4) !important; border-radius: 0.5em !important; } ' +
                m + ' { background: #0a0a0a !important; border: 1px solid rgba(187,134,252,.2) !important; border-radius: 0.5em !important; }',
            ocean:
                'body { background: radial-gradient(circle at top right, #122238, #050a14) !important; color: #e6f1ff !important; } ' +
                b + ' { border-radius: 0.4em !important; } ' +
                f + ' { background: rgba(100,255,218,0.15) !important; color: #64ffda !important; box-shadow: 0 0 15px rgba(100,255,218,.25), inset 0 0 0 1px #64ffda !important; -webkit-backdrop-filter: blur(4px) !important; backdrop-filter: blur(4px) !important; } ' +
                c + ' { border: 2px solid #64ffda !important; box-shadow: 0 0 20px rgba(100,255,218,.3) !important; border-radius: 0.4em !important; } ' +
                m + ' { background: rgba(10, 18, 32, 0.98) !important; border: 1px solid rgba(100,255,218,.2) !important; border-radius: 0.4em !important; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5) !important; }',
            dark_mint:
                'body { background: linear-gradient(135deg, #050e0d 0%, #0a1614 50%, #11211e 100%) !important; color: #e6f2ef !important; } ' +
                b + ' { border-radius: 0.6em !important; } ' +
                f + ' { background: rgba(0, 184, 148, 0.15) !important; color: #00b894 !important; box-shadow: 0 0 15px rgba(0, 184, 148, 0.25), inset 0 0 0 1px #00b894 !important; -webkit-backdrop-filter: blur(4px) !important; backdrop-filter: blur(4px) !important; } ' +
                c + ' { border: 2px solid #00b894 !important; box-shadow: 0 0 20px rgba(0, 184, 148, 0.3) !important; border-radius: 0.8em !important; } ' +
                m + ' { background: rgba(5, 11, 10, 0.98) !important; border: 1px solid rgba(0, 184, 148, 0.2) !important; border-radius: 0.6em !important; }',
            mint:
                'body { background: linear-gradient(135deg, #122220 0%, #1c3633 50%, #254a46 100%) !important; color: #ffffff !important; } ' +
                b + ' { border-radius: 0.6em !important; } ' +
                f + ' { background: rgba(46, 204, 113, 0.15) !important; color: #2ecc71 !important; box-shadow: 0 0 15px rgba(46, 204, 113, 0.25), inset 0 0 0 1px #2ecc71 !important; -webkit-backdrop-filter: blur(4px) !important; backdrop-filter: blur(4px) !important; } ' +
                c + ' { border: 2px solid #2ecc71 !important; box-shadow: 0 0 20px rgba(46, 204, 113, 0.3) !important; border-radius: 0.8em !important; } ' +
                m + ' { background: rgba(18, 34, 32, 0.98) !important; border: 1px solid rgba(46, 204, 113, 0.2) !important; border-radius: 0.6em !important; }',
            prime:
                'body { background: linear-gradient(135deg, #1e2b3c 0%, #232f3e 100%) !important; color: #ffffff !important; } ' +
                b + ' { border-radius: 0.4em !important; } ' +
                f + ' { background: #00a8e1 !important; color: #fff !important; box-shadow: 0 4px 12px rgba(0, 168, 225, 0.4) !important; } ' +
                c + ' { border: 2px solid #00a8e1 !important; box-shadow: 0 0 15px rgba(0, 168, 225, 0.4) !important; border-radius: 0.4em !important; } ' +
                m + ' { background: rgba(30, 43, 60, 0.98) !important; border: 1px solid rgba(0, 168, 225, 0.2) !important; border-radius: 0.4em !important; }',
            twitch:
                'body { background: radial-gradient(circle at 50% 0%, #201533 0%, #0e0e10 80%) !important; color: #efeff1 !important; } ' +
                b + ' { border-radius: 0.4em !important; } ' +
                f + ' { background: #9146FF !important; color: #fff !important; box-shadow: 0 4px 15px rgba(145, 70, 255, 0.4) !important; } ' +
                c + ' { border: 2px solid #9146FF !important; box-shadow: 0 0 15px rgba(145, 70, 255, 0.4) !important; border-radius: 0.4em !important; } ' +
                m + ' { background: rgba(24, 24, 27, 0.98) !important; border: 1px solid rgba(145, 70, 255, 0.2) !important; border-radius: 0.4em !important; }',
            apple:
                'body { background: linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 100%) !important; color: #ffffff !important; } ' +
                b + ' { border-radius: 0.8em !important; } ' +
                f + ' { background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.15) 100%) !important; color: #fff !important; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 0 1.5px rgba(255, 255, 255, 0.6) !important; -webkit-backdrop-filter: blur(15px) !important; backdrop-filter: blur(15px) !important; } ' +
                c + ' { border: 2px solid rgba(255, 255, 255, 0.8) !important; box-shadow: 0 0 20px rgba(255, 255, 255, 0.3) !important; border-radius: 0.8em !important; } ' +
                m + ' { background: rgba(30, 30, 30, 0.2) !important; border: 1px solid rgba(255, 255, 255, 0.2) !important; border-radius: 1em !important; -webkit-backdrop-filter: blur(12px) !important; backdrop-filter: blur(12px) !important; }',
            hulu:
                'body { background: radial-gradient(ellipse at top, #1a3020 0%, #0f1210 80%) !important; color: #ffffff !important; } ' +
                b + ' { border-radius: 0.4em !important; } ' +
                f + ' { background: #1ce783 !important; color: #000 !important; font-weight: bold !important; box-shadow: 0 4px 15px rgba(28, 231, 131, 0.3) !important; } ' +
                c + ' { border: 2px solid #1ce783 !important; box-shadow: 0 0 15px rgba(28, 231, 131, 0.3) !important; border-radius: 0.4em !important; } ' +
                m + ' { background: rgba(15, 18, 16, 0.98) !important; border: 1px solid rgba(28, 231, 131, 0.2) !important; border-radius: 0.4em !important; }'
        };
        var st = document.createElement('style');
        st.id = 'interface_mod_theme';
        st.textContent = performanceCss + (themeCss[theme] || '');
        document.head.appendChild(st);
        if (typeof ensureStylesPriority === 'function') {
            ensureStylesPriority(['interface_mod_theme']);
        }
    }

    var STATUS_BASE_SEL = '.full-start__status, .full-start-new__status, .full-start__soon, .full-start-new__soon, .full-start [data-status], .full-start-new [data-status]';
    var AGE_BASE_SEL = '.full-start__pg, .full-start-new__pg, .full-start [data-pg], .full-start-new [data-pg], .full-start [data-age], .full-start-new [data-age]';

    function initInterfaceModSettingsUI() {
        if (window.__ifx_settings_ready) return;
        window.__ifx_settings_ready = true;
        var SUI = 'stylish_ui', SUI_INFO = 'stylish_ui_info';
        var T = function (k) { return Lampa.Lang.translate(k); };
        Lampa.SettingsApi.addComponent({
            component: SUI,
            name: 'Стильний інтерфейс',
            icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" stroke-width="2"/><path d="M7 8h10M7 12h6M7 16h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
        });
        var add = Lampa.SettingsApi.addParam;
        function openSub(id) {
            Lampa.Settings.create(id, { onBack: function () { Lampa.Settings.create(SUI); } });
        }
        add({
            component: SUI,
            param: { name: 'stylish_ui_head', type: 'title' },
            field: { name: 'Стильний інтерфейс ' + SUI_VERSION }
        });
        add({
            component: SUI,
            param: { name: 'stylish_ui_open_info', type: 'button' },
            field: { name: '1. Інформаційна панель', description: 'Кольорова панель, назви, статуси, віковий рейтинг, торенти, ключ TMDB' },
            onChange: function () { openSub(SUI_INFO); }
        });
        add({
            component: SUI,
            param: { name: 'stylish_ui_open_rt', type: 'button' },
            field: { name: '2. Рейтинги', description: 'IMDb, Rotten Tomatoes, Metacritic, Trakt, Letterboxd, нагороди' },
            onChange: function () { if (window.SUI_open) window.SUI_open('stylish_ui_rt'); }
        });
        add({
            component: SUI,
            param: { name: 'stylish_ui_open_look', type: 'button' },
            field: { name: '3. Зовнішній вигляд', description: 'Розмір карток, мітки UA/PL, сторінка фільму, редактор кнопок' },
            onChange: function () { if (window.SUI_open) window.SUI_open('stylish_ui_look'); }
        });

        // ---- 1. Інформаційна панель (підменю) ----
        Lampa.Template.add('settings_' + SUI_INFO, '<div></div>');
        add({ component: SUI_INFO, param: { name: 'stylish_ui_info_head', type: 'title' }, field: { name: 'Інформаційна панель' } });
        add({   // 1a
            component: SUI_INFO,
            param: { name: 'interface_mod_new_info_panel', type: 'trigger', values: true, default: true },
            field: { name: 'Кольорова інформаційна панель', description: T('interface_mod_new_info_panel_desc') }
        });
        add({   // 2a
            component: SUI_INFO,
            param: { name: 'interface_mod_new_mono_mode', type: 'trigger', values: true, default: false },
            field: { name: 'Чорно-біла панель', description: T('interface_mod_new_mono_mode_desc') }
        });
        add({   // 3a
            component: SUI_INFO,
            param: { name: 'interface_mod_new_title_mode_v1', type: 'select', values: { off: 'Ні', orig: 'Оригінальна назва', loc: 'Локалізована назва', orig_loc: 'Оригінальна / локалізована назва' }, default: 'orig_loc' },
            field: { name: 'Назва під заголовком', description: T('interface_mod_new_title_mode_desc') }
        });
        add({   // 4a
            component: SUI_INFO,
            param: { name: 'interface_mod_new_title_size', type: 'input', values: true, default: '0.75' },
            field: { name: 'Розмір назви', description: 'Розмір шрифту (за замовчуванням 0.75)' }
        });
        add({   // 5a
            component: SUI_INFO,
            param: { name: 'interface_mod_new_colored_bookmarks', type: 'trigger', values: true, default: true },
            field: { name: 'Кольорові іконки закладок', description: 'Підсвічувати кольорами іконки (Закладки, Історія, Пізніше)' }
        });
        add({   // 6a
            component: SUI_INFO,
            param: { name: 'interface_mod_new_show_status', type: 'trigger', values: true, default: true },
            field: { name: 'Показувати статуси', description: 'Відображати статус фільму/серіалу в повній картці' }
        });
        add({   // 7a
            component: SUI_INFO,
            param: { name: 'interface_mod_new_show_age', type: 'trigger', values: true, default: true },
            field: { name: 'Показувати віковий рейтинг', description: 'Відображати або приховувати плашку вікового рейтингу (PG)' }
        });
        add({   // 8a
            component: SUI_INFO,
            param: { name: 'interface_mod_new_colored_age', type: 'trigger', values: true, default: false },
            field: { name: 'Кольоровий віковий рейтинг', description: 'Підсвічувати віковий рейтинг у повній картці' }
        });
        add({   // 9a
            component: SUI_INFO,
            param: { name: 'interface_mod_new_tor_frame', type: 'trigger', values: true, default: true },
            field: { name: 'Кольорова рамка блоку торентів', description: 'Підсвічувати блоки торентів кольоровою рамкою залежно від кількості сідерів' }
        });
        add({   // 10a
            component: SUI_INFO,
            param: { name: 'interface_mod_new_tor_bitrate', type: 'trigger', values: true, default: true },
            field: { name: 'Кольоровий бітрейт', description: 'Підсвічувати бітрейт кольором залежно від розміру' }
        });
        add({   // 11a
            component: SUI_INFO,
            param: { name: 'interface_mod_new_tor_seeds', type: 'trigger', values: true, default: true },
            field: { name: 'Кольорова кількість роздаючих', description: 'Підсвічувати кількість сідерів: 0–5 — червоний, 6–19 — жовтий, 20 і більше — зелений' }
        });
        add({   // 12a
            component: SUI_INFO,
            param: { name: 'interface_mod_new_tmdb_api_key', type: 'input', values: true, default: '' },
            field: { name: 'TMDB API ключ', description: 'Власний ключ для стабільного отримання українських назв' }
        });
        function moveAfterInterface() {
            var $folders = $('.settings-folder');
            var $interface = $folders.filter(function () {
                return $(this).data('component') === 'interface';
            });
            var $mod = $folders.filter(function () {
                return $(this).data('component') === 'stylish_ui';
            });
            if ($interface.length && $mod.length && $mod.prev()[0] !== $interface[0]) $mod.insertAfter($interface);
        }
        var tries = 0,
            t = setInterval(function () {
                moveAfterInterface();
                if (++tries >= 40) clearInterval(t);
            }, 150);
        var obsMenu = new MutationObserver(function () {
            moveAfterInterface();
        });
        obsMenu.observe(document.body, {
            childList: true,
            subtree: true
        });
        function closeOpenSelects() {
            setTimeout(function () {
                $('.selectbox').remove();
                Lampa.Settings.update();
            }, 60);
        }
        if (!window.__ifx_patch_storage) {
            window.__ifx_patch_storage = true;
            var _set = Lampa.Storage.set;
            Lampa.Storage.set = function (key, val) {
                var res = _set.apply(this, arguments);
                if (typeof key === 'string' && key.indexOf('interface_mod_new_') === 0) {
                    switch (key) {
                        case 'interface_mod_new_info_panel':
                            settings.info_panel = getBool(key, true);
                            rebuildInfoPanelActive();
                            break;
                        case 'interface_mod_new_mobile_center':
                            settings.mobile_center = getBool(key, false);
                            setMobileCenteringEnabled(settings.mobile_center);
                            break;
                        case 'interface_mod_new_hide_tagline':
                            settings.hide_tagline = getBool(key, false);
                            setTaglineHidden(settings.hide_tagline);
                            break;
                        case 'interface_mod_new_hide_info_panel':
                            settings.hide_info_panel = getBool(key, false);
                            setInfoPanelHidden(settings.hide_info_panel);
                            break;
                        case 'interface_mod_new_colored_bookmarks':
                            toggleBookmarksColor(getBool(key, true));
                            break;
                        case 'interface_mod_new_colored_ratings':
                            settings.colored_ratings = getBool(key, false);
                            if (settings.colored_ratings) updateVoteColors();
                            else clearVoteColors();
                            break;
                        case 'interface_mod_new_show_status':
                            settings.show_status = getBool(key, true);
                            document.body.classList.toggle('ifx-hide-status', !settings.show_status);
                            break;
                        case 'interface_mod_new_show_age':
                            settings.show_age = getBool(key, true);
                            document.body.classList.toggle('ifx-hide-pg', !settings.show_age);
                            break;
                        case 'interface_mod_new_colored_status':
                            settings.colored_status = getBool(key, false);
                            setStatusBaseCssEnabled(settings.colored_status);
                            if (settings.colored_status) enableStatusColoring();
                            else disableStatusColoring(true);
                            break;
                        case 'interface_mod_new_colored_age':
                            settings.colored_age = getBool(key, false);
                            setAgeBaseCssEnabled(settings.colored_age);
                            if (settings.colored_age) enableAgeColoring();
                            else disableAgeColoring(true);
                            break;
                        case 'interface_mod_new_mono_mode':
                            settings.mono_mode = getBool(key, false);
                            rebuildInfoPanelActive();
                            if (settings.colored_status) applyStatusOnceIn(document);
                            if (settings.colored_age) applyAgeOnceIn(document);
                            break;
                        case 'interface_mod_new_theme_select':
                            settings.theme = (val || 'default');
                            applyTheme(settings.theme);
                            break;
                        case 'interface_mod_new_all_buttons_v1':
                            settings.all_buttons = getBool(key, false);
                            rebuildButtonsNow();
                            break;
                        case 'interface_mod_new_icon_only':
                            settings.icon_only = getBool(key, false);
                            rebuildButtonsNow();
                            break;
                        case 'interface_mod_new_colored_buttons':
                            settings.colored_buttons = getBool(key, false);
                            setColoredButtonsEnabled(settings.colored_buttons);
                            break;
                        case 'interface_mod_new_tor_frame':
                            settings.tor_frame = getBool(key, true);
                            if (window.runTorrentStyleRefresh) window.runTorrentStyleRefresh();
                            break;
                        case 'interface_mod_new_tor_bitrate':
                            settings.tor_bitrate = getBool(key, true);
                            if (window.runTorrentStyleRefresh) window.runTorrentStyleRefresh();
                            break;
                        case 'interface_mod_new_tor_seeds':
                            settings.tor_seeds = getBool(key, true);
                            if (window.runTorrentStyleRefresh) window.runTorrentStyleRefresh();
                            break;
                        case 'interface_mod_new_title_mode_v1':
                            applyOriginalTitleToggle();
                            break;
                        case 'interface_mod_new_mt':
                        case 'interface_mod_new_mb':
                            applyMargins();
                            break;
                        case 'interface_mod_new_title_size':
                            applyTitleSizeNow();
                            applyOriginalTitleToggle();
                            break;
                    }
                }
                return res;
            };
        }
    }

    function buildInfoPanel(details, movie, isTvShow, originalDetails) {
        var mono = isMonoFor('interface_mod_new_info_panel');
        var container = $('<div>').css({
            display: 'flex',
            'flex-direction': 'column',
            width: '100%',
            gap: '0em',
            margin: '-1.0em 0 0.2em 0.45em'
        });
        var row1 = $('<div>').css({ display: 'flex', 'flex-wrap': 'wrap', gap: '0.2em', 'align-items': 'center', margin: '0 0 0.2em 0' });
        var row2 = $('<div>').css({ display: 'flex', 'flex-wrap': 'wrap', gap: '0.2em', 'align-items': 'center', margin: '0 0 0.2em 0' });
        var row3 = $('<div>').css({ display: 'flex', 'flex-wrap': 'wrap', gap: '0.2em', 'align-items': 'center', margin: '0 0 0.2em 0' });
        var row4 = $('<div>').css({ display: 'flex', 'flex-wrap': 'wrap', gap: '0.2em', 'align-items': 'flex-start', margin: '0 0 0.2em 0' });
        var colors = {
            seasons: { bg: 'rgba(52,152,219,0.8)', text: 'white' },
            episodes: { bg: 'rgba(46,204,113,0.8)', text: 'white' },
            duration: { bg: 'rgba(52,152,219,0.8)', text: 'white' },
            next: { bg: 'rgba(230,126,34,0.9)', text: 'white' },
            genres: {
                'Бойовик': { bg: 'rgba(231,76,60,.85)', text: 'white' }, 'Пригоди': { bg: 'rgba(39,174,96,.85)', text: 'white' },
                'Мультфільм': { bg: 'rgba(155,89,182,.85)', text: 'white' }, 'Комедія': { bg: 'rgba(241,196,15,.9)', text: 'black' },
                'Кримінал': { bg: 'rgba(88,24,69,.85)', text: 'white' }, 'Документальний': { bg: 'rgba(22,160,133,.85)', text: 'white' },
                'Драма': { bg: 'rgba(102,51,153,.85)', text: 'white' }, 'Сімейний': { bg: 'rgba(139,195,74,.90)', text: 'white' },
                'Фентезі': { bg: 'rgba(22,110,116,.85)', text: 'white' }, 'Історія': { bg: 'rgba(121,85,72,.85)', text: 'white' },
                'Жахи': { bg: 'rgba(155,27,48,.85)', text: 'white' }, 'Музика': { bg: 'rgba(63,81,181,.85)', text: 'white' },
                'Детектив': { bg: 'rgba(52,73,94,.85)', text: 'white' }, 'Мелодрама': { bg: 'rgba(233,30,99,.85)', text: 'white' },
                'Фантастика': { bg: 'rgba(41,128,185,.85)', text: 'white' }, 'Трилер': { bg: 'rgba(165,27,11,.90)', text: 'white' },
                'Військовий': { bg: 'rgba(85,107,47,.85)', text: 'white' }, 'Вестерн': { bg: 'rgba(211,84,0,.85)', text: 'white' },
                'Бойовик і Пригоди': { bg: 'rgba(231,76,60,.85)', text: 'white' }, 'Дитячий': { bg: 'rgba(0,188,212,.85)', text: 'white' },
                'Новини': { bg: 'rgba(70,130,180,.85)', text: 'white' }, 'Реаліті-шоу': { bg: 'rgba(230,126,34,.9)', text: 'white' },
                'НФ і Фентезі': { bg: 'rgba(41,128,185,.85)', text: 'white' }, 'Мильна опера': { bg: 'rgba(233,30,99,.85)', text: 'white' },
                'Ток-шоу': { bg: 'rgba(241,196,15,.9)', text: 'black' }, 'Війна і Політика': { bg: 'rgba(96,125,139,.85)', text: 'white' },
                'Екшн і Пригоди': { bg: 'rgba(231,76,60,.85)', text: 'white' },
                'Екшн': { bg: 'rgba(231,76,60,.85)', text: 'white' },
                'Науково фантастичний': { bg: 'rgba(40,53,147,.90)', text: 'white' },
                'Науково-фантастичний': { bg: 'rgba(40,53,147,.90)', text: 'white' },
                'Наукова фантастика': { bg: 'rgba(40,53,147,.90)', text: 'white' },
                'Наукова-фантастика': { bg: 'rgba(40,53,147,.90)', text: 'white' },
                'Науково-фантастика': { bg: 'rgba(40,53,147,.90)', text: 'white' }
            }
        };
        var baseBadge = {
            'border-radius': '0.3em',
            border: '0',
            'font-size': '1.0em',
            padding: '0.2em 0.6em',
            display: 'inline-block',
            'white-space': 'nowrap',
            'line-height': '1.2em',
            'margin-right': '0.4em',
            'margin-bottom': '0.2em'
        };
        function badgeCss(bg, text) {
            if (mono) {
                return $.extend({}, baseBadge, {
                    'background-color': 'rgba(255,255,255,.08)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,.45)'
                });
            }
            return $.extend({}, baseBadge, {
                'background-color': bg,
                color: text
            });
        }
        var baseGenre = {
            'border-radius': '0.3em',
            border: '0',
            'font-size': '1.0em',
            padding: '0.2em 0.6em',
            display: 'inline-block',
            'white-space': 'nowrap',
            'line-height': '1.2em',
            'margin-right': '0.4em',
            'margin-bottom': '0.2em'
        };
        function genreCss(bg, text) {
            if (mono) {
                return $.extend({}, baseGenre, {
                    'background-color': 'rgba(255,255,255,.08)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,.45)'
                });
            }
            return $.extend({}, baseGenre, {
                'background-color': bg,
                color: text
            });
        }
        if (isTvShow && Array.isArray(movie.seasons)) {
            var totalEps = 0, airedEps = 0, now = new Date(), hasEpisodes = false;
            movie.seasons.forEach(function (s) {
                if (s.season_number === 0) return;
                if (s.episode_count) totalEps += s.episode_count;
                if (Array.isArray(s.episodes) && s.episodes.length) {
                    hasEpisodes = true;
                    s.episodes.forEach(function (e) {
                        if (e.air_date && new Date(e.air_date) <= now) airedEps++;
                    });
                } else if (s.air_date && new Date(s.air_date) <= now && s.episode_count) {
                    airedEps += s.episode_count;
                }
            });
            if (!hasEpisodes && movie.next_episode_to_air && movie.next_episode_to_air.season_number && movie.next_episode_to_air.episode_number) {
                var nextS = movie.next_episode_to_air.season_number, nextE = movie.next_episode_to_air.episode_number, rem = 0;
                movie.seasons.forEach(function (s) {
                    if (s.season_number === nextS) rem += (s.episode_count || 0) - nextE + 1;
                    else if (s.season_number > nextS) rem += s.episode_count || 0;
                });
                if (rem > 0 && totalEps > 0) airedEps = Math.max(0, totalEps - rem);
            }
            var epsText = '';
            if (totalEps > 0 && airedEps > 0 && airedEps < totalEps) epsText = airedEps + ' ' + plural(airedEps, 'Серія', 'Серії', 'Серій') + ' з ' + totalEps;
            else if (totalEps > 0) epsText = totalEps + ' ' + plural(totalEps, 'Серія', 'Серії', 'Серій');
            if (epsText) row1.append(
                $('<span>').text(epsText).css(badgeCss(colors.episodes.bg, colors.episodes.text))
            );
        }
        if (isTvShow && movie.next_episode_to_air && movie.next_episode_to_air.air_date) {
            var nextDate = new Date(movie.next_episode_to_air.air_date), today = new Date();
            nextDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            var diff = Math.floor((nextDate - today) / (1000 * 60 * 60 * 24));
            var txt = diff === 0 ? 'Наступна серія вже сьогодні'
                : diff === 1 ? 'Наступна серія вже завтра'
                    : diff > 1 ? ('Наступна серія через ' + diff + ' ' + plural(diff, 'день', 'дні', 'днів'))
                        : '';
            if (txt) row2.append(
                $('<span>').text(txt).css(badgeCss(colors.next.bg, colors.next.text))
            );
        }
        if (!isTvShow && movie.runtime > 0) {
            var mins = movie.runtime, h = Math.floor(mins / 60), m = mins % 60;
            var tt = 'Тривалість фільму: ';
            if (h > 0) tt += h + ' ' + plural(h, 'година', 'години', 'годин');
            if (m > 0) tt += (h > 0 ? ' ' : '') + m + ' хв.';
            row3.append(
                $('<span>').text(tt).css(badgeCss(colors.duration.bg, colors.duration.text))
            );
        } else if (isTvShow) {
            var avg = calculateAverageEpisodeDuration(movie);
            if (avg > 0) row3.append(
                $('<span>').text('Тривалість серії ≈ ' + formatDurationMinutes(avg))
                    .css(badgeCss(colors.duration.bg, colors.duration.text))
            );
        }
        var seasonsCount = (movie.season_count || movie.number_of_seasons || (movie.seasons ? movie.seasons.filter(function (s) {
            return s.season_number !== 0;
        }).length : 0)) || 0;
        if (isTvShow && seasonsCount > 0) {
            row4.append(
                $('<span>').text('Сезони: ' + seasonsCount).css(badgeCss(colors.seasons.bg, colors.seasons.text))
            );
        }
        var genreList = [];
        if (Array.isArray(movie.genres) && movie.genres.length) {
            genreList = movie.genres.map(function (g) { return g.name; });
        }
        genreList = genreList.filter(Boolean).filter(function (v, i, a) { return a.indexOf(v) === i; });
        genreList.forEach(function (gn) {
            var c = colors.genres[gn] || { bg: 'rgba(255,255,255,.12)', text: 'white' };
            row4.append(
                $('<span>').text(gn).css(genreCss(c.bg, c.text))
            );
        });
        container.append(row1);
        if (row2.children().length) container.append(row2);
        if (row3.children().length) container.append(row3);
        if (row4.children().length) container.append(row4);
        details.append(container);
    }
    function rebuildInfoPanelActive() {
        var enabled = getBool('interface_mod_new_info_panel', true);
        if (!__ifx_last.details || !__ifx_last.details.length) return;
        if (!enabled) {
            __ifx_last.details.html(__ifx_last.originalHTML);
        } else {
            __ifx_last.details.empty();
            buildInfoPanel(__ifx_last.details, __ifx_last.movie, __ifx_last.isTv, __ifx_last.originalHTML);
        }
    }
    function newInfoPanel() {
        Lampa.Listener.follow('full', function (data) {
            if (data.type !== 'complite') return;
            setTimeout(function () {
                var root = $(data.object.activity.render());
                var details = root.find('.full-start-new__details, .full-start__details').first();
                if (!details.length) return;
                var movie = data.data.movie || {};
                var isTvShow = (movie && (
                    movie.number_of_seasons > 0 ||
                    (movie.seasons && movie.seasons.length > 0) ||
                    movie.type === 'tv' || movie.type === 'serial'
                ));
                __ifx_last.details = details;
                __ifx_last.movie = movie;
                __ifx_last.isTv = isTvShow;
                __ifx_last.originalHTML = details.html();
                __ifx_last.fullRoot = root;
                if (!getBool('interface_mod_new_info_panel', true)) return;
                details.empty();
                buildInfoPanel(details, movie, isTvShow, __ifx_last.originalHTML);
            }, 100);
        });
    }

    function updateVoteColors() {
        if (!getBool('interface_mod_new_colored_ratings', false)) return;
        var SEL = [
            '.card__vote',
            '.full-start__rate',
            '.full-start-new__rate',
            '.info__rate',
            '.card__imdb-rate',
            '.card__kinopoisk-rate'
        ].join(',');
        function paint(el) {
            var txt = ($(el).text() || '').trim();
            var m = txt.match(/(\d+(\.\d+)?)/);
            if (!m) return;
            var v = parseFloat(m[0]);
            if (isNaN(v) || v < 0 || v > 10) return;
            var color = (v <= 3) ? 'red' : (v < 6) ? 'orange' : (v < 8) ? 'cornflowerblue' : 'lawngreen';
            $(el).css('color', color);
        }
        $(SEL).each(function () {
            paint(this);
        });
    }
    function clearVoteColors() {
        var SEL = '.card__vote, .full-start__rate, .full-start-new__rate, .info__rate, .card__imdb-rate, .card__kinopoisk-rate';
        $(SEL).css({
            color: '',
            border: ''
        });
    }
    var __voteObserverDebounce = null;
    function setupVoteColorsObserver() {
        setTimeout(function () {
            if (getBool('interface_mod_new_colored_ratings', false)) updateVoteColors();
        }, 400);
        var obs = new MutationObserver(function () {
            if (getBool('interface_mod_new_colored_ratings', false)) {
                if (__voteObserverDebounce) clearTimeout(__voteObserverDebounce);
                __voteObserverDebounce = setTimeout(updateVoteColors, 200);
            }
        });
        obs.observe(document.body, {
            childList: true,
            subtree: true
        });
        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'complite' && getBool('interface_mod_new_colored_ratings', false)) setTimeout(updateVoteColors, 100);
        });
    }

    function setStatusBaseCssEnabled(enabled) {
        var idEn = 'interface_mod_status_enabled';
        var idDis = 'interface_mod_status_disabled';
        document.getElementById(idEn) && document.getElementById(idEn).remove();
        document.getElementById(idDis) && document.getElementById(idDis).remove();
        var st = document.createElement('style');
        if (enabled) {
            st.id = idEn;
            st.textContent =
                STATUS_BASE_SEL + '{' +
                'font-size:1.2em!important;' +
                'border:1px solid transparent!important;' +
                'border-radius:0.2em!important;' +
                'padding:0.3em!important;' +
                'margin-right:0.3em!important;' +
                'margin-left:0!important;' +
                'display:inline-block;' +
                '}';
        } else {
            st.id = idDis;
            st.textContent =
                STATUS_BASE_SEL + '{' +
                'font-size:1.2em!important;' +
                'border:1px solid #fff!important;' +
                'border-radius:0.2em!important;' +
                'padding:0.3em!important;' +
                'margin-right:0.3em!important;' +
                'margin-left:0!important;' +
                'display:inline-block;' +
                '}';
        }
        document.head.appendChild(st);
    }
    function setAgeBaseCssEnabled(enabled) {
        var idEn = 'interface_mod_age_enabled';
        var idDis = 'interface_mod_age_disabled';
        document.getElementById(idEn) && document.getElementById(idEn).remove();
        document.getElementById(idDis) && document.getElementById(idDis).remove();
        var st = document.createElement('style');
        if (enabled) {
            st.id = idEn;
            st.textContent =
                AGE_BASE_SEL + '{' +
                'font-size:1.2em!important;' +
                'border:1px solid transparent!important;' +
                'border-radius:0.2em!important;' +
                'padding:0.3em!important;' +
                'margin-right:0.3em!important;' +
                'margin-left:0!important;' +
                '}';
        } else {
            st.id = idDis;
            st.textContent =
                AGE_BASE_SEL + '{' +
                'font-size:1.2em!important;' +
                'border:1px solid #fff!important;' +
                'border-radius:0.2em!important;' +
                'padding:0.3em!important;' +
                'margin-right:0.3em!important;' +
                'margin-left:0!important;' +
                '}';
        }
        document.head.appendChild(st);
    }

    var __statusObserver = null;
    var __statusFollowReady = false;
    function applyStatusOnceIn(elRoot) {
        if (!getBool('interface_mod_new_colored_status', false)) return;
        var mono = isMonoFor('interface_mod_new_colored_status');
        var palette = {
            completed: { bg: 'rgba(46,204,113,.85)', text: 'white' },
            canceled: { bg: 'rgba(231,76,60,.9)', text: 'white' },
            ongoing: { bg: 'rgba(243,156,18,.95)', text: 'black' },
            production: { bg: 'rgba(52,152,219,.9)', text: 'white' },
            planned: { bg: 'rgba(155,89,182,.9)', text: 'white' },
            pilot: { bg: 'rgba(230,126,34,.95)', text: 'white' },
            released: { bg: 'rgba(26,188,156,.9)', text: 'white' },
            rumored: { bg: 'rgba(149,165,166,.9)', text: 'white' },
            post: { bg: 'rgba(0,188,212,.9)', text: 'white' },
            soon: { bg: 'rgba(142,68,173,.95)', text: 'white' }
        };
        var $root = $(elRoot || document);
        $root.find(STATUS_BASE_SEL).each(function () {
            var el = this;
            var t = ($(el).text() || '').trim();
            var key = '';
            if (/заверш/i.test(t) || /ended/i.test(t)) key = 'completed';
            else if (/скасов/i.test(t) || /cancel(l)?ed/i.test(t)) key = 'canceled';
            else if (/онгоїн|виходить|триває/i.test(t) || /returning/i.test(t)) key = 'ongoing';
            else if (/виробництв/i.test(t) || /in\s*production/i.test(t)) key = 'production';
            else if (/заплан/i.test(t) || /planned/i.test(t)) key = 'planned';
            else if (/пілот/i.test(t) || /pilot/i.test(t)) key = 'pilot';
            else if (/випущ/i.test(t) || /released/i.test(t)) key = 'released';
            else if (/чутк/i.test(t) || /rumored/i.test(t)) key = 'rumored';
            else if (/пост/i.test(t) || /post/i.test(t)) key = 'post';
            else if (/незабаром|скоро|soon/i.test(t)) key = 'soon';
            el.classList.remove('ifx-status-fallback');
            if (!key) {
                el.classList.add('ifx-status-fallback');
                el.style.setProperty('border-width', '1px', 'important');
                el.style.setProperty('border-style', 'solid', 'important');
                el.style.setProperty('border-color', '#fff', 'important');
                el.style.setProperty('background-color', 'transparent', 'important');
                el.style.setProperty('color', 'inherit', 'important');
                return;
            }
            if (mono) {
                applyMonoBadgeStyle(el);
                //el.style.setProperty('display', 'inline-block', 'important');
                el.style.display = 'inline-block';
                return;
            }
            var c = palette[key];
            $(el).css({
                'background-color': c.bg,
                color: c.text,
                'border-color': 'transparent',
                'display': 'inline-block'
            });
        });
    }
    function enableStatusColoring() {
        applyStatusOnceIn(document);
        if (__statusObserver) __statusObserver.disconnect();
        __statusObserver = new MutationObserver(function (muts) {
            if (!getBool('interface_mod_new_colored_status', false)) return;
            muts.forEach(function (m) {
                (m.addedNodes || []).forEach(function (n) {
                    if (n.nodeType !== 1) return;
                    applyStatusOnceIn(n);
                });
            });
        });
        __statusObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        if (!__statusFollowReady) {
            __statusFollowReady = true;
            Lampa.Listener.follow('full', function (e) {
                if (e.type === 'complite' && getBool('interface_mod_new_colored_status', false)) {
                    setTimeout(function () {
                        applyStatusOnceIn(e.object.activity.render());
                    }, 120);
                }
            });
        }
    }
    function disableStatusColoring(clearInline) {
        if (__statusObserver) {
            __statusObserver.disconnect();
            __statusObserver = null;
        }
        if (clearInline) $(STATUS_BASE_SEL).each(function () {
            this.classList.remove('ifx-status-fallback');
            this.style.removeProperty('border-width');
            this.style.removeProperty('border-style');
            this.style.removeProperty('border-color');
            this.style.removeProperty('background-color');
            this.style.removeProperty('color');
            this.style.removeProperty('display');
        }).css({
            'background-color': '',
            color: '',
            border: ''
        });
    }

    var __ageObserver = null;
    var __ageFollowReady = false;
    var __ageGroups = {
        kids: ['G', 'TV-Y', 'TV-G', '0+', '3+', '0', '3'],
        children: ['PG', 'TV-PG', 'TV-Y7', '6+', '7+', '6', '7'],
        teens: ['PG-13', 'TV-14', '12+', '13+', '14+', '12', '13', '14'],
        almostAdult: ['R', 'TV-MA', '16+', '17+', '16', '17'],
        adult: ['NC-17', '18+', '18', 'X']
    };
    var __ageColors = {
        kids: {
            bg: '#2ecc71',
            text: 'white'
        },
        children: {
            bg: '#3498db',
            text: 'white'
        },
        teens: {
            bg: '#f1c40f',
            text: 'black'
        },
        almostAdult: {
            bg: '#e67e22',
            text: 'white'
        },
        adult: {
            bg: '#e74c3c',
            text: 'white'
        }
    };
    function ageCategoryFor(text) {
        var t = (text || '').trim();
        var mm = t.match(/(^|\D)(\d{1,2})\s*\+(?=\D|$)/);
        if (mm) {
            var n = parseInt(mm[2], 10);
            if (n >= 18) return 'adult';
            if (n >= 17) return 'almostAdult';
            if (n >= 13) return 'teens';
            if (n >= 6) return 'children';
            return 'kids';
        }
        var ORDER = ['adult', 'almostAdult', 'teens', 'children', 'kids'];
        for (var oi = 0; oi < ORDER.length; oi++) {
            var k = ORDER[oi];
            if (__ageGroups[k] && __ageGroups[k].some(function (mark) {
                var mEsc = (mark || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\+/g, '\\+');
                var re = new RegExp('(^|\\D)' + mEsc + '(?=\\D|$)', 'i');
                return re.test(t);
            })) return k;
        }
        return '';
    }
    function applyAgeOnceIn(elRoot) {
        if (!getBool('interface_mod_new_colored_age', false)) return;
        var mono = isMonoFor('interface_mod_new_colored_age');
        var $root = $(elRoot || document);
        $root.find(AGE_BASE_SEL).each(function () {
            var el = this;
            var t = (el.textContent || '').trim();
            if (!t) {
                var attr = ((el.getAttribute('data-age') || el.getAttribute('data-pg') || '') + '').trim();
                if (attr) t = attr;
            }
            if (!t) {
                el.classList.add('hide');
                el.classList.remove('ifx-age-fallback');
                ['border-width', 'border-style', 'border-color', 'background-color', 'color', 'display'].forEach(function (p) {
                    el.style.removeProperty(p);
                });
                return;
            }
            el.classList.remove('hide');
            el.classList.remove('ifx-age-fallback');
            ['border-width', 'border-style', 'border-color', 'background-color', 'color'].forEach(function (p) {
                el.style.removeProperty(p);
            });
            var g = ageCategoryFor(t);
            if (g) {
                if (mono) {
                    applyMonoBadgeStyle(el);
                    el.style.display = 'inline-block';
                    return;
                }
                var c = __ageColors[g];
                $(el).css({
                    'background-color': c.bg,
                    color: c.text,
                    'border-color': 'transparent'
                });
                el.style.display = 'inline-block';
            } else {
                el.classList.add('ifx-age-fallback');
                el.style.setProperty('border-width', '1px', 'important');
                el.style.setProperty('border-style', 'solid', 'important');
                el.style.setProperty('border-color', '#fff', 'important');
                el.style.setProperty('background-color', 'transparent', 'important');
                el.style.setProperty('color', 'inherit', 'important');
                el.style.display = 'inline-block';
            }
        });
    }
    function enableAgeColoring() {
        applyAgeOnceIn(document);
        if (__ageObserver) __ageObserver.disconnect();
        __ageObserver = new MutationObserver(function (muts) {
            if (!getBool('interface_mod_new_colored_age', false)) return;
            muts.forEach(function (m) {
                (m.addedNodes || []).forEach(function (n) {
                    if (n.nodeType !== 1) return;
                    if (n.matches && n.matches(AGE_BASE_SEL)) applyAgeOnceIn(n);
                    $(n).find && $(n).find(AGE_BASE_SEL).each(function () {
                        applyAgeOnceIn(this);
                    });
                });
                if (m.type === 'attributes' && m.target && m.target.nodeType === 1) {
                    var target = m.target;
                    if (target.matches && target.matches(AGE_BASE_SEL)) {
                        applyAgeOnceIn(target);
                    }
                }
                if (m.type === 'characterData' && m.target && m.target.parentNode) {
                    var parent = m.target.parentNode;
                    if (parent.matches && parent.matches(AGE_BASE_SEL)) {
                        applyAgeOnceIn(parent);
                    }
                }
            });
        });
        __ageObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true,
            attributeFilter: ['class', 'data-age', 'data-pg', 'style']
        });
        if (!__ageFollowReady) {
            __ageFollowReady = true;
            Lampa.Listener.follow('full', function (e) {
                if (e.type === 'complite' && getBool('interface_mod_new_colored_age', false)) {
                    var root = e.object.activity.render();
                    setTimeout(function () {
                        applyAgeOnceIn(root);
                    }, 120);
                    [100, 300, 800, 1600].forEach(function (ms) {
                        setTimeout(function () {
                            applyAgeOnceIn(root);
                        }, ms);
                    });
                }
            });
        }
    }
    function disableAgeColoring(clearInline) {
        if (__ageObserver) {
            __ageObserver.disconnect();
            __ageObserver = null;
        }
        if (clearInline) $(AGE_BASE_SEL).each(function () {
            this.classList.remove('ifx-age-fallback');
            this.style.removeProperty('border-width');
            this.style.removeProperty('border-style');
            this.style.removeProperty('border-color');
            this.style.removeProperty('background-color');
            this.style.removeProperty('color');
        }).css({
            'background-color': '',
            color: '',
            border: '1px solid #fff',
            'display': 'inline-block'
        });
    }

    function setOriginalTitle(fullRoot, movie) {
        if (!fullRoot || !movie) return;
        var head = fullRoot.find('.full-start-new__head, .full-start__head').first();
        if (!head.length) return;
        head.find('.ifx-original-title').remove();
        var mode = getTitleMode();
        if (mode === 'off') return;
        var original = String(movie.original_title || movie.original_name || movie.original || '').trim();
        var uiLoc = String((movie.title || movie.name) || '').trim();
        function render(text) {
            text = String(text || '').trim();
            if (!text) return;
            $('<div class="ifx-original-title"></div>').text(text).appendTo(head);
        }
        if (mode === 'orig') {
            return render(original || uiLoc);
        }
        if (mode === 'loc') {
            return getLocalizedTitleAsync(movie, function (loc) {
                render(loc || uiLoc || original);
            });
        }
        return getLocalizedTitleAsync(movie, function (loc) {
            loc = String(loc || uiLoc || '').trim();
            var a = original || '';
            var b = loc || '';
            if (!a && b) return render(b);
            if (a && !b) return render(a);
            if (a && b && a.toLowerCase() === b.toLowerCase()) return render(a);
            render(a + ' / ' + b);
        });
    }
    function applyOriginalTitleToggle() {
        if (!__ifx_last.fullRoot) return;
        var head = __ifx_last.fullRoot.find('.full-start-new__head, .full-start__head').first();
        if (!head.length) return;
        head.find('.ifx-original-title').remove();
        if (getTitleMode() !== 'off') setOriginalTitle(__ifx_last.fullRoot, __ifx_last.movie || {});
    }

    function isPlayBtn($b) {
        var cls = ($b.attr('class') || '').toLowerCase();
        var act = String($b.data('action') || '').toLowerCase();
        var txt = ($b.text() || '').trim().toLowerCase();
        if (/trailer/.test(cls) || /trailer/.test(act) || /трейлер|trailer/.test(txt)) return false;
        if (/(^|\s)(button--play|view--play|button--player|view--player)(\s|$)/.test(cls)) return true;
        if (/(^|\s)(play|player|resume|continue)(\s|$)/.test(act)) return true;
        if (/^(play|відтворити|продовжити|старт)$/i.test(txt)) return true;
        return false;
    }
    function reorderAndShowButtons(fullRoot) {
        if (!fullRoot) return;
        var $container = fullRoot.find('.full-start-new__buttons, .full-start__buttons').first();
        if (!$container.length) return;
        fullRoot.find('.button--play, .button--player, .view--play, .view--player').remove();
        var $source = fullRoot.find(
            '.buttons--container .full-start__button, ' +
            '.full-start__buttons .full-start__button, ' +
            '.full-start-new__buttons .full-start__button'
        );
        var seen = new Set();
        function sig($b) {
            return ($b.attr('data-action') || '') + '|' + ($b.attr('href') || '') + '|' + ($b.attr('class') || '');
        }
        var groups = {
            online: [],
            torrent: [],
            trailer: [],
            other: []
        };
        $source.each(function () {
            var $b = $(this);
            if (isPlayBtn($b)) return;
            var s = sig($b);
            if (seen.has(s)) return;
            seen.add(s);
            var cls = ($b.attr('class') || '').toLowerCase();
            if (cls.includes('online')) {
                groups.online.push($b);
            } else if (cls.includes('torrent')) {
                groups.torrent.push($b);
            } else if (cls.includes('trailer')) {
                groups.trailer.push($b);
            } else {
                groups.other.push($b.clone(true));
            }
        });
        var needToggle = false;
        try {
            needToggle = (Lampa.Controller.enabled().name === 'full_start');
        } catch (e) { }
        if (needToggle) {
            try {
                Lampa.Controller.toggle('settings_component');
            } catch (e) { }
        }
        $container.empty();
        ['online', 'torrent', 'trailer', 'other'].forEach(function (cat) {
            groups[cat].forEach(function ($b) {
                $container.append($b);
            });
        });
        $container.find('.full-start__button').filter(function () {
            return $(this).text().trim() === '' && $(this).find('svg').length === 0;
        }).remove();
        $container.addClass('controller');
        applyIconOnlyClass(fullRoot);
        if (needToggle) {
            setTimeout(function () {
                try {
                    Lampa.Controller.toggle('full_start');
                } catch (e) { }
            }, 80);
        }
    }
    function restoreButtons() {
        if (!__ifx_btn_cache.container || !__ifx_btn_cache.nodes) return;
        var needToggle = false;
        try {
            needToggle = (Lampa.Controller.enabled().name === 'full_start');
        } catch (e) { }
        if (needToggle) {
            try {
                Lampa.Controller.toggle('settings_component');
            } catch (e) { }
        }
        var $c = __ifx_btn_cache.container;
        $c.empty().append(__ifx_btn_cache.nodes.clone(true, true));
        $c.addClass('controller');
        if (needToggle) {
            setTimeout(function () {
                try {
                    Lampa.Controller.toggle('full_start');
                } catch (e) { }
            }, 80);
        }
        applyIconOnlyClass(__ifx_last.fullRoot || $(document));
    }
    function rebuildButtonsNow() {
        if (!__ifx_last.fullRoot) return;
        if (settings.all_buttons) {
            reorderAndShowButtons(__ifx_last.fullRoot);
        } else {
            restoreButtons();
        }
        applyIconOnlyClass(__ifx_last.fullRoot);
        if (settings.colored_buttons) applyColoredButtonsIn(__ifx_last.fullRoot);
    }
    function applyIconOnlyClass(fullRoot) {
        var $c = fullRoot.find('.full-start-new__buttons, .full-start__buttons').first();
        if (!$c.length) return;
        if (settings.icon_only) {
            $c.addClass('ifx-btn-icon-only')
                .find('.full-start__button').css('min-width', 'auto');
        } else {
            $c.removeClass('ifx-btn-icon-only')
                .find('.full-start__button').css('min-width', '');
        }
    }

    var __ifx_colbtn = {
        styleId: 'interface_mod_colored_buttons'
    };
    function injectColoredButtonsCss() {
        if (document.getElementById(__ifx_colbtn.styleId)) return;
        var css = `
  .head__action.selector.open--feed svg path { fill: #2196F3 !important; }
  .full-start__button {
    transition: transform 0.2s ease !important;
    position: relative;
  }
  .full-start__button:active {
    transform: scale(0.98) !important;
  }
  .full-start__button.ifx-bandera-online svg path,
  .full-start__button.ifx-bandera-online svg rect {
    fill: unset !important;
  }
  :root{
    --ifx-bazarnet-play-color: #8b5cf6; 
  }
  .full-start__button.view--online.lampac--button[data-subtitle*="BazarNetUA"] svg path{
    fill: var(--ifx-bazarnet-play-color) !important;
  }
  .full-start__button.view--online.lampac--button[data-subtitle*="BazarNetUA"] svg{
    color: var(--ifx-bazarnet-play-color) !important;
  }
  .full-start__button.view--online:not(.ifx-bandera-online):not(.lampac--button) svg path {
    fill: #2196f3 !important;
  }
  .full-start__button.view--online.lampac--button:not(.ifx-bandera-online):not([data-subtitle*="BazarNetUA"]) svg path{
  fill:#2196f3 !important;
  }
  .full-start__button.view--online:not(.ifx-bandera-online):not(.lampac--button) svg{
  color: #2196f3 !important;
  }
  .full-start__button.view--torrent svg path { fill: lime !important; }
  .full-start__button.view--trailer svg path { fill: #f44336 !important; }
  .full-start__button.loading::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: rgba(255,255,255,0.5);
    animation: ifx_loading 1s linear infinite;
  }
  @keyframes ifx_loading {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;
        var st = document.createElement('style');
        st.id = __ifx_colbtn.styleId;
        st.textContent = css;
        document.head.appendChild(st);
    }
    function removeColoredButtonsCss() {
        var el = document.getElementById(__ifx_colbtn.styleId);
        if (el) el.remove();
    }
    function makeOnlineUaSvg() {
        var gid = 'ifx_ua_grad_' + Math.random().toString(16).slice(2);
        return (
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
            '<defs>' +
            '<linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="#156DD1"/>' +
            '<stop offset="50%" stop-color="#156DD1"/>' +
            '<stop offset="50%" stop-color="#FFD948"/>' +
            '<stop offset="100%" stop-color="#FFD948"/>' +
            '</linearGradient>' +
            '</defs>' +
            '<path style="fill:url(#' + gid + ') !important" d="M20.331 14.644l-13.794-13.831 17.55 10.075zM2.938 0c-0.813 0.425-1.356 1.2-1.356 2.206v27.581c0 1.006 0.544 1.781 1.356 2.206l16.038-16zM29.512 14.1l-3.681-2.131-4.106 4.031 4.106 4.031 3.756-2.131c1.125-0.893 1.125-2.906-0.075-3.8zM6.538 31.188l17.55-10.075-3.756-3.756z"/>' +
            '</svg>'
        );
    }
    function isBanderaOnlineBtn($btn) {
        if (!$btn || !$btn.length) return false;
        var sub = String($btn.attr('data-subtitle') || '').toLowerCase();
        var txt = String($btn.text() || '').toLowerCase();
        if (sub.indexOf('bandera online') !== -1) return true;
        if (txt.indexOf('mmssixxx') !== -1) return true;
        return false;
    }
    var SVG_MAP = {
        torrent: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="50px" height="50px"><path d="M25,2C12.317,2,2,12.317,2,25s10.317,23,23,23s23-10.317,23-23S37.683,2,25,2zM40.5,30.963c-3.1,0-4.9-2.4-4.9-2.4S34.1,35,27,35c-1.4,0-3.6-0.837-3.6-0.837l4.17,9.643C26.727,43.92,25.874,44,25,44c-2.157,0-4.222-0.377-6.155-1.039L9.237,16.851c0,0-0.7-1.2,0.4-1.5c1.1-0.3,5.4-1.2,5.4-1.2s1.475-0.494,1.8,0.5c0.5,1.3,4.063,11.112,4.063,11.112S22.6,29,27.4,29c4.7,0,5.9-3.437,5.7-3.937c-1.2-3-4.993-11.862-4.993-11.862s-0.6-1.1,0.8-1.4c1.4-0.3,3.8-0.7,3.8-0.7s1.105-0.163,1.6,0.8c0.738,1.437,5.193,11.262,5.193,11.262s1.1,2.9,3.3,2.9c0.464,0,0.834-0.046,1.152-0.104c-0.082,1.635-0.348,3.221-0.817,4.722C42.541,30.867,41.756,30.963,40.5,30.963z"/></svg>',
        online: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M20.331 14.644l-13.794-13.831 17.55 10.075zM2.938 0c-0.813 0.425-1.356 1.2-1.356 2.206v27.581c0 1.006 0.544 1.781 1.356 2.206l16.038-16zM29.512 14.1l-3.681-2.131-4.106 4.031 4.106 4.031 3.756-2.131c1.125-0.893 1.125-2.906-0.075-3.8zM6.538 31.188l17.55-10.075-3.756-3.756z"/></svg>',
        trailer: '<svg height="70" viewBox="0 0 80 70" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M71.2555 2.08955C74.6975 3.2397 77.4083 6.62804 78.3283 10.9306C80 18.7291 80 35 80 35C80 35 80 51.2709 78.3283 59.0694C77.4083 63.372 74.6975 66.7603 71.2555 67.9104C65.0167 70 40 70 40 70C40 70 14.9833 70 8.74453 67.9104C5.3025 66.7603 2.59172 63.372 1.67172 59.0694C0 51.2709 0 35 0 35C0 35 0 18.7291 1.67172 10.9306C2.59172 6.62804 5.3025 3.2395 8.74453 2.08955C14.9833 0 40 0 40 0C40 0 65.0167 0 71.2555 2.08955ZM55.5909 35.0004L29.9773 49.5714V20.4286L55.5909 35.0004Z"/></svg>'
    };
    function isBazarNetBtn($btn) {
        var sub = String($btn.attr('data-subtitle') || '');
        return sub.indexOf('BazarNetUA') !== -1;
    }
    function replaceIconsIn($root) {
        $root = $root && $root.length ? $root : $(document);
        ['torrent', 'trailer'].forEach(function (kind) {
            $root.find('.full-start__button.view--' + kind + ' svg').each(function () {
                var $svg = $(this);
                var $btn = $svg.closest('.full-start__button');
                if (!$btn.data('ifxOrigSvg')) $btn.data('ifxOrigSvg', $svg.prop('outerHTML'));
                $svg.replaceWith(SVG_MAP[kind]);
            });
        });
        $root.find('.full-start__button.view--online svg').each(function () {
            var $svg = $(this);
            var $btn = $svg.closest('.full-start__button');
            if (!$btn.data('ifxOrigSvg')) $btn.data('ifxOrigSvg', $svg.prop('outerHTML'));
            if (isBanderaOnlineBtn($btn)) {
                $btn.addClass('ifx-bandera-online');
                $svg.replaceWith(makeOnlineUaSvg());
                return;
            }
            if (isBazarNetBtn($btn)) {
                $btn.removeClass('ifx-bandera-online');
                $svg.replaceWith(SVG_MAP.online);
                return;
            }
            $btn.removeClass('ifx-bandera-online');
            $svg.replaceWith(SVG_MAP.online);
        });
    }
    function restoreIconsIn($root) {
        $root = $root && $root.length ? $root : $(document);
        $root.find('.full-start__button').each(function () {
            var $btn = $(this);
            var orig = $btn.data('ifxOrigSvg');
            if (orig) {
                var $current = $btn.find('svg').first();
                if ($current.length) $current.replaceWith(orig);
                $btn.removeData('ifxOrigSvg');
            }
            $btn.removeClass('ifx-bandera-online');
        });
    }
    function applyColoredButtonsIn(root) {
        injectColoredButtonsCss();
        replaceIconsIn(root);
    }
    function setColoredButtonsEnabled(enabled) {
        if (enabled) {
            injectColoredButtonsCss();
            if (__ifx_last.fullRoot) replaceIconsIn(__ifx_last.fullRoot);
            else replaceIconsIn($(document));
        } else {
            removeColoredButtonsCss();
            restoreIconsIn($(document));
        }
    }

    function wireFullCardEnhancers() {
        Lampa.Listener.follow('full', function (e) {
            if (e.type !== 'complite') return;
            setTimeout(function () {
                var root = $(e.object.activity.render());
                var $container = root.find('.full-start-new__buttons, .full-start__buttons').first();
                if ($container.length) {
                    __ifx_btn_cache.container = $container;
                    __ifx_btn_cache.nodes = $container.children().clone(true, true);
                }
                __ifx_last.fullRoot = root;
                __ifx_last.movie = e.data.movie || __ifx_last.movie || {};
                setOriginalTitle(root, __ifx_last.movie);
                if (settings.all_buttons) reorderAndShowButtons(root);
                applyIconOnlyClass(root);
                if (settings.colored_buttons) {
                    applyColoredButtonsIn(root);
                    setTimeout(function () { try { replaceIconsIn(root); } catch (e) { } }, 300);
                    setTimeout(function () { try { replaceIconsIn(root); } catch (e) { } }, 900);
                }
            }, 120);
        });
    }
    Lampa.Listener.follow('full', function (e) {
        if (e.type === 'complite') {
            setTimeout(function () {
                try {
                    if (window.runTorrentStyleRefresh) window.runTorrentStyleRefresh();
                } catch (e) { }
            }, 120);
        }
    });
    (function observeTorrents() {
        var obs = new MutationObserver(function (muts) {
            if (typeof window.runTorrentStyleRefresh === 'function') {
                clearTimeout(window.__ifx_tor_debounce);
                window.__ifx_tor_debounce = setTimeout(function () {
                    try {
                        window.runTorrentStyleRefresh();
                    } catch (e) { }
                }, 200);
            }
        });
        try {
            obs.observe(document.body, {
                subtree: true,
                childList: true
            });
        } catch (e) { }
    })();

    function startPlugin() {
        window.lampa_settings = window.lampa_settings || {};
        window.lampa_settings.blur_poster = false;
        injectFallbackCss();
        injectMobilePosterCss();
        initInterfaceModSettingsUI();
        newInfoPanel();
        applyMargins();
        setupVoteColorsObserver();
        setTaglineHidden(settings.hide_tagline);
        setInfoPanelHidden(settings.hide_info_panel);
        document.body.classList.toggle('ifx-hide-status', !settings.show_status);
        document.body.classList.toggle('ifx-hide-pg', !settings.show_age);
        injectBookmarksCss();
        toggleBookmarksColor(getBool('interface_mod_new_colored_bookmarks', true));
        if (settings.colored_ratings) updateVoteColors();
        setStatusBaseCssEnabled(settings.colored_status);
        if (settings.colored_status) enableStatusColoring();
        else disableStatusColoring(true);
        setAgeBaseCssEnabled(settings.colored_age);
        if (settings.colored_age) enableAgeColoring();
        else disableAgeColoring(true);
        setMobileCenteringEnabled(settings.mobile_center);
        if (settings.theme) applyTheme(settings.theme);
        applyTitleSizeNow();
        wireFullCardEnhancers();
        setColoredButtonsEnabled(settings.colored_buttons);
        try {
            if (window.runTorrentStyleRefresh) window.runTorrentStyleRefresh();
        } catch (e) { }
    }
    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    }
    (function () {
        try {
            (function () {
                const UKRAINE_FLAG_SVG =
                    '<svg class="ua-flag-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 15" aria-hidden="true" focusable="false">' +
                    '<rect width="20" height="7.5" y="0" fill="#0057B7"/>' +
                    '<rect width="20" height="7.5" y="7.5" fill="#FFD700"/>' +
                    '</svg>';
                const REPLACEMENTS = [
                    ['Uaflix', 'UAFlix'],
                    ['Zetvideo', 'UaFlix'],
                    ['Нет истории просмотра', 'Історія перегляду відсутня'],
                    ['Дублированный', 'Дубльований'],
                    ['Дубляж', 'Дубльований'],
                    ['Многоголосый', 'багатоголосий'],
                    ['многоголосый', 'багатоголосий'],
                    ['двухголосый', 'двоголосий'],
                    ['Украинский', UKRAINE_FLAG_SVG + ' Українською'],
                    ['украинский', UKRAINE_FLAG_SVG + ' Українською'],
                    ['Український', UKRAINE_FLAG_SVG + ' Українською'],
                    ['Украинская', UKRAINE_FLAG_SVG + ' Українською'],
                    ['Українська', UKRAINE_FLAG_SVG + ' Українською'],
                    {
                        pattern: /\bUkr\b/gi,
                        replacement: UKRAINE_FLAG_SVG + ' Українською',
                        condition: (text) => !text.includes('flag-container')
                    },
                    {
                        pattern: /\bUa\b/gi,
                        replacement: UKRAINE_FLAG_SVG + ' UA',
                        condition: (text) => !text.includes('flag-container')
                    }
                ];
                const FLAG_STYLES = `
          .flag-container {
              display: inline-flex;
              align-items: center;
              vertical-align: middle;
              height: 1.27em;
              margin-left: 3px;
          }
          .flag-svg {
              display: inline-block;
              vertical-align: middle;
              margin-right: 2px;
              margin-top: -5.5px;
              border-radius: 5px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              border: 1px solid rgba(0,0,0,0.15);
              width: 22.56px;
              height: 17.14px;
          }
          @media (max-width: 767px) {
              .flag-svg {
                  width: 16.03px;
                  height: 12.19px;
                  margin-right: 1px;
                  margin-top: -4px;
              }
          }
          .flag-container ~ span,
          .flag-container + * {
              vertical-align: middle;
          }
          .ua-flag-processed {
              position: relative;
          }
          .filter-item .flag-svg,
          .selector-item .flag-svg,
          .dropdown-item .flag-svg,
          .voice-option .flag-svg,
          .audio-option .flag-svg {
              margin-right: 1px;
              margin-top: -2px;
              width: 18.05px;
              height: 13.54px;
          }
          @media (max-width: 767px) {
              .filter-item .flag-svg,
              .selector-item .flag-svg,
              .dropdown-item .flag-svg,
              .voice-option .flag-svg,
              .audio-option .flag-svg {
                  width: 11.97px;
                  height: 8.98px;
                  margin-right: 0px;
                  margin-top: -1px;
              }
          }
          .online-prestige__description,
          .video-description,
          [class*="description"],
          [class*="info"] {
              line-height: 1.5;
          }
      `;
                const STYLES = {
                    '.torrent-item__seeds span.low-seeds': {
                        'color': '#ff5f6d',
                        'background': 'rgba(255, 95, 109, 0.10)',
                        'border': '1.4px solid rgba(255, 95, 109, 0.5)',
                        'text-shadow': '0 0 5px rgba(255, 95, 109, 0.4)',
                        'box-shadow': '0 0 8px rgba(255, 95, 109, 0.2)'
                    },
                    '.torrent-item__seeds span.medium-seeds': {
                        'color': '#ffc371',
                        'background': 'rgba(255, 195, 113, 0.10)',
                        'border': '1.4px solid rgba(255, 195, 113, 0.5)',
                        'text-shadow': '0 0 5px rgba(255, 195, 113, 0.4)',
                        'box-shadow': '0 0 8px rgba(255, 195, 113, 0.2)'
                    },
                    '.torrent-item__seeds span.high-seeds': {
                        'color': '#77cdb2',
                        'background': 'rgba(119, 205, 178, 0.10)',
                        'border': '1.4px solid rgba(119, 205, 178, 0.5)',
                        'text-shadow': '0 0 5px rgba(119, 205, 178, 0.4)',
                        'box-shadow': '0 0 8px rgba(119, 205, 178, 0.2)'
                    },
                    '.torrent-item__bitrate span.low-bitrate': {
                        'color': '#ffc371',
                        'background': 'rgba(255, 195, 113, 0.10)',
                        'border': '1.4px solid rgba(255, 195, 113, 0.5)',
                        'text-shadow': '0 0 5px rgba(255, 195, 113, 0.4)',
                        'box-shadow': '0 0 8px rgba(255, 195, 113, 0.2)'
                    },
                    '.torrent-item__bitrate span.medium-bitrate': {
                        'color': '#77cdb2',
                        'background': 'rgba(119, 205, 178, 0.10)',
                        'border': '1.4px solid rgba(119, 205, 178, 0.5)',
                        'text-shadow': '0 0 5px rgba(119, 205, 178, 0.4)',
                        'box-shadow': '0 0 8px rgba(119, 205, 178, 0.2)'
                    },
                    '.torrent-item__bitrate span.high-bitrate': {
                        'color': '#ff5f6d',
                        'background': 'rgba(255, 95, 109, 0.10)',
                        'border': '1.4px solid rgba(255, 95, 109, 0.5)',
                        'text-shadow': '0 0 5px rgba(255, 95, 109, 0.4)',
                        'box-shadow': '0 0 8px rgba(255, 95, 109, 0.2)'
                    },
                    '.torrent-item__grabs span.grabs': {
                        'color': '#4db6ff',
                        'background': 'rgba(77, 182, 255, 0.12)',
                        'border': '1.4px solid rgba(77, 182, 255, 0.5)',
                        'text-shadow': '0 0 5px rgba(77, 182, 255, 0.35)',
                        'box-shadow': '0 0 8px rgba(77, 182, 255, 0.18)'
                    },
                    '.torrent-item__grabs span.high-grabs': {
                        'color': '#4db6ff',
                        'background': 'rgba(77, 182, 255, 0.16)',
                        'border': '1.4px solid rgba(77, 182, 255, 0.7)',
                        'text-shadow': '0 0 5px rgba(77, 182, 255, 0.4)',
                        'box-shadow': '0 0 8px rgba(77, 182, 255, 0.22)'
                    },
                    '.torrent-item.low-seeds': {
                        'border': '2px solid rgba(255, 95, 109, 0.45)',
                        'border-radius': '6px',
                        'box-sizing': 'border-box'
                    },
                    '.torrent-item.medium-seeds': {
                        'border': '2px solid rgba(255, 195, 113, 0.45)',
                        'border-radius': '6px',
                        'box-sizing': 'border-box'
                    },
                    '.torrent-item.high-seeds': {
                        'border': '2px solid rgba(119, 205, 178, 0.45)',
                        'border-radius': '6px',
                        'box-sizing': 'border-box'
                    },
                    '.torrent-item__tracker.utopia': { 'color': '#9b59b6', 'font-weight': 'bold' },
                    '.torrent-item__tracker.toloka': { 'color': '#3498db', 'font-weight': 'bold' },
                    '.torrent-item__tracker.mazepa': { 'color': '#C9A0DC', 'font-weight': 'bold' }
                };
                let style = document.createElement('style');
                style.innerHTML = FLAG_STYLES + '\n' + Object.entries(STYLES).map(([selector, props]) => {
                    return `${selector} { ${Object.entries(props).map(([prop, val]) => `${prop}: ${val} !important`).join('; ')} }`;
                }).join('\n');
                document.head.appendChild(style);
                const UKRAINIAN_STUDIOS = [
                    'DniproFilm', 'Дніпрофільм', 'Цікава Ідея', 'Колодій Трейлерів',
                    'UaFlix', 'BaibaKo', 'В одне рило', 'Так Треба Продакшн',
                    'TreleMore', 'Гуртом', 'Exit Studio', 'FilmUA', 'Novator Film',
                    'LeDoyen', 'Postmodern', 'Pryanik', 'CinemaVoice', 'UkrainianVoice'
                ];
                function processVoiceFilters() {
                    const voiceFilterSelectors = [
                        '[data-type="voice"]', '[data-type="audio"]',
                        '.voice-options', '.audio-options',
                        '.voice-list', '.audio-list',
                        '.studio-list', '.translation-filter', '.dubbing-filter'
                    ];
                    voiceFilterSelectors.forEach(selector => {
                        try {
                            const filters = document.querySelectorAll(selector);
                            filters.forEach(filter => {
                                if (filter.classList.contains('ua-voice-processed')) return;
                                let html = filter.innerHTML;
                                let changed = false;
                                UKRAINIAN_STUDIOS.forEach(studio => {
                                    if (html.includes(studio) && !html.includes(UKRAINE_FLAG_SVG)) {
                                        html = html.replace(new RegExp(studio, 'g'), UKRAINE_FLAG_SVG + ' ' + studio);
                                        changed = true;
                                    }
                                });
                                if (html.includes('Українська') && !html.includes(UKRAINE_FLAG_SVG)) {
                                    html = html.replace(/Українська/g, UKRAINE_FLAG_SVG + ' Українська');
                                    changed = true;
                                }
                                if (html.includes('Украинская') && !html.includes(UKRAINE_FLAG_SVG)) {
                                    html = html.replace(/Украинская/g, UKRAINE_FLAG_SVG + ' Українська');
                                    changed = true;
                                }
                                if (html.includes('Ukr') && !html.includes(UKRAINE_FLAG_SVG)) {
                                    html = html.replace(/Ukr/gi, UKRAINE_FLAG_SVG + ' Українською');
                                    changed = true;
                                }
                                if (changed) {
                                    filter.innerHTML = html;
                                    filter.classList.add('ua-voice-processed');
                                    filter.querySelectorAll('svg.ua-flag-svg').forEach(svg => {
                                        //filter.querySelectorAll('svg').forEach(svg => {
                                        if (!svg.closest('.flag-container')) {
                                            svg.classList.add('flag-svg');
                                            const wrapper = document.createElement('span');
                                            wrapper.className = 'flag-container';
                                            svg.parentNode.insertBefore(wrapper, svg);
                                            wrapper.appendChild(svg);
                                        }
                                    });
                                }
                            });
                        } catch (error) {
                            console.warn('Помилка обробки фільтрів озвучення:', error);
                        }
                    });
                }
                function replaceTexts() {
                    const safeContainers = [
                        '.online-prestige-watched__body',
                        '.online-prestige--full .online-prestige__title',
                        '.online-prestige--full .online-prestige__info',
                        '.online-prestige__description',
                        '.video-description',
                        '.content__description',
                        '.movie-info',
                        '.series-info'
                    ];
                    const processSafeElements = () => {
                        const selectors = safeContainers.map(s => s + ':not(.ua-flag-processed)').join(', ');
                        try {
                            const elements = document.querySelectorAll(selectors);
                            elements.forEach(element => {
                                if (element.closest('.hidden, [style*="display: none"]')) return;
                                let html = element.innerHTML;
                                let changed = false;
                                REPLACEMENTS.forEach(item => {
                                    if (Array.isArray(item)) {
                                        if (html.includes(item[0]) && !html.includes(UKRAINE_FLAG_SVG)) {
                                            html = html.replace(new RegExp(item[0], 'g'), item[1]);
                                            changed = true;
                                        }
                                    } else if (item.pattern) {
                                        if ((!item.condition || item.condition(html)) && item.pattern.test(html) && !html.includes(UKRAINE_FLAG_SVG)) {
                                            html = html.replace(item.pattern, item.replacement);
                                            changed = true;
                                        }
                                    }
                                });
                                if (changed) {
                                    element.innerHTML = html;
                                    element.classList.add('ua-flag-processed');
                                    element.querySelectorAll('svg.ua-flag-svg').forEach(svg => {
                                        //element.querySelectorAll('svg').forEach(svg => {
                                        if (!svg.closest('.flag-container')) {
                                            svg.classList.add('flag-svg');
                                            const wrapper = document.createElement('span');
                                            wrapper.className = 'flag-container';
                                            svg.parentNode.insertBefore(wrapper, svg);
                                            wrapper.appendChild(svg);
                                            if (svg.nextSibling && svg.nextSibling.nodeType === 3) {
                                                wrapper.appendChild(svg.nextSibling);
                                            }
                                        }
                                    });
                                }
                            });
                        } catch (error) {
                            console.warn('Помилка обробки селекторів:', error);
                        }
                    };
                    const startTime = Date.now();
                    const TIME_LIMIT = 50;
                    processSafeElements();
                    if (Date.now() - startTime < TIME_LIMIT) {
                        processVoiceFilters();
                    }
                }
                function updateTorrentStyles() {
                    const visibleElements = {
                        seeds: document.querySelectorAll('.torrent-item__seeds span:not([style*="display: none"])'),
                        bitrate: document.querySelectorAll('.torrent-item__bitrate span:not([style*="display: none"])'),
                        grabs: document.querySelectorAll('.torrent-item__grabs span:not([style*="display: none"])'),
                        tracker: document.querySelectorAll('.torrent-item__tracker:not([style*="display: none"])')
                    };
                    if (visibleElements.seeds.length > 0) {
                        visibleElements.seeds.forEach(span => {
                            const seeds = parseInt(span.textContent) || 0;
                            const torrentItem = span.closest('.torrent-item');
                            span.classList.remove('low-seeds', 'medium-seeds', 'high-seeds');
                            if (torrentItem) {
                                torrentItem.classList.remove('low-seeds', 'medium-seeds', 'high-seeds');
                            }
                            if (seeds <= 5) {
                                span.classList.add('low-seeds');
                                if (torrentItem) torrentItem.classList.add('low-seeds');
                            } else if (seeds <= 19) {
                                span.classList.add('medium-seeds');
                                if (torrentItem) torrentItem.classList.add('medium-seeds');
                            } else {
                                span.classList.add('high-seeds');
                                if (torrentItem) torrentItem.classList.add('high-seeds');
                            }
                        });
                    }
                    if (visibleElements.bitrate.length > 0) {
                        visibleElements.bitrate.forEach(span => {
                            const bitrate = parseFloat(span.textContent) || 0;
                            span.classList.remove('low-bitrate', 'medium-bitrate', 'high-bitrate');
                            if (bitrate <= 10) {
                                span.classList.add('low-bitrate');
                            } else if (bitrate <= 60) {
                                span.classList.add('medium-bitrate');
                            } else {
                                span.classList.add('high-bitrate');
                            }
                        });
                    }
                    if (visibleElements.grabs.length > 0) {
                        visibleElements.grabs.forEach(span => {
                            const grabs = parseInt(span.textContent) || 0;
                            span.classList.add('grabs');
                            span.classList.remove('high-grabs');
                            if (grabs > 10) span.classList.add('high-grabs');
                        });
                    }
                    if (visibleElements.tracker.length > 0) {
                        visibleElements.tracker.forEach(tracker => {
                            const text = tracker.textContent.trim().toLowerCase();
                            tracker.classList.remove('utopia', 'toloka', 'mazepa');
                            if (text.includes('utopia')) tracker.classList.add('utopia');
                            else if (text.includes('toloka')) tracker.classList.add('toloka');
                            else if (text.includes('mazepa')) tracker.classList.add('mazepa');
                        });
                    }
                }
                function updateAll() {
                    try {
                        replaceTexts();
                        updateTorrentStyles();
                    } catch (error) {
                        console.warn('Помилка оновлення:', error);
                    }
                }
                let updateTimeout = null;
                const observer = new MutationObserver(mutations => {
                    const hasImportantChanges = mutations.some(mutation => {
                        return mutation.addedNodes.length > 0 &&
                            !mutation.target.closest('.hidden, [style*="display: none"]');
                    });
                    if (hasImportantChanges) {
                        clearTimeout(updateTimeout);
                        updateTimeout = setTimeout(updateAll, 250);
                    }
                });
                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: false,
                    characterData: false
                });
                setTimeout(updateAll, 1000);
            })();
        } catch (e) {
            try {
                console.error('torrents+mod error', e);
            } catch (_e) { }
        }
    })();
    (function () {
        function getBool(key, def) {
            var v = Lampa.Storage.get(key);
            if (v === true || v === false) return v;
            if (v === 'true') return true;
            if (v === 'false') return false;
            if (v == null) return def;
            return !!v;
        }
        function apply() {
            var s = document.getElementById('torr_mod_overrides');
            if (!s) {
                s = document.createElement('style');
                s.id = 'torr_mod_overrides';
                document.head.appendChild(s);
            }
            var ef = getBool('interface_mod_new_tor_frame', true),
                eb = getBool('interface_mod_new_tor_bitrate', true),
                es = getBool('interface_mod_new_tor_seeds', true);
            var css = '';
            if (!eb) {
                css += '.torrent-item__bitrate span.low-bitrate, .torrent-item__bitrate span.medium-bitrate, .torrent-item__bitrate span.high-bitrate { color: inherit !important; background: none !important; border: none !important; font-weight: inherit !important; }\n';
            }
            if (!es) {
                css += '.torrent-item__seeds span.low-seeds, .torrent-item__seeds span.medium-seeds, .torrent-item__seeds span.high-seeds { color: inherit !important; background: none !important; border: none !important; font-weight: inherit !important; }\n';
            }
            if (!ef) {
                css += '.torrent-item.low-seeds, .torrent-item.medium-seeds, .torrent-item.high-seeds { border: none !important; box-shadow: none !important; }\n';
            }
            s.textContent = css;
        }
        window.runTorrentStyleRefresh = apply;
        setTimeout(apply, 0);
    })();

    (function () {
        Lampa.Lang.add({
            ifx_year_on_cards: { uk: 'Показувати рік на картці', en: 'Show year on card' },
            ifx_year_on_cards_desc: { uk: 'Увімкнути/Вимкнути відображення року на постері', en: 'Year displayed on the poster only' },
            ifx_hide_year_title: { uk: 'Приховати рік з назви', en: 'Hide year from title' },
            ifx_hide_year_title_desc: { uk: 'Вирізає рік з кінця назв фільмів/серіалів', en: 'Strips the year from the end of titles in lists' },
            ifx_show_rating_on_cards: { uk: 'Показувати рейтинг на картці', en: 'Show rating on card' },
            ifx_show_rating_on_cards_desc: {
                uk: 'Увімкнути/Вимкнути стандартний рейтинг на постері',
                en: 'Toggle the built-in rating badge on list posters'
            },
            ifx_alt_badges: { uk: 'Альтернативні мітки', en: 'Alternative badges' },
            ifx_alt_badges_desc: { uk: 'Мітки "рік" і "рейтинг" у іншому стилі', en: 'Year & Rating  alternative style' },
            ifx_type_badges: { uk: 'Показувати мітки "Фільм / Серіал" знизу', en: '"Show Movie / Series" badges (bottom)' },
            ifx_type_badges_desc: { uk: 'Замінює стандартну мітку TV на нові кольорові мітки внизу постера.', en: 'Replaces the default TV badge with new colored badges at the bottom.' },
            ifx_alt_type_badges: { uk: 'Додати додаткову мітку "Фільм" зверху', en: 'Add "Movie" badge (top)' },
            ifx_alt_type_badges_desc: { uk: 'Додає синю мітку "Movie" на постер, яка доповнює стандартну червону мітку "TV".', en: 'Adds a blue "Movie" badge matching the default red "TV" badge.' },
            ifx_episode_alt_cards: { uk: 'Альтернативні "Найближчі епізоди"', en: 'Alternative "Upcoming Episodes"' },
            ifx_episode_alt_cards_desc: { uk: 'Компактний вигляд блоку "Найближчі епізоди"', en: 'Compact view for the "Upcoming Episodes" block' },
            ifx_episode_num_only: { uk: 'Показувати лише номер серії', en: 'Show episode number only' },
            ifx_episode_num_only_desc: { uk: 'Завжди показувати номер серії у вигляді "Серія N" замість назви', en: 'Always show "Episode N" instead of the title' }
        });
        var KEY_YEAR = 'interface_mod_new_year_on_cards';
        var KEY_ALT = 'interface_mod_new_episode_alt_cards';
        var KEY_HIDE_YEAR_TITLE = 'interface_mod_new_hide_year_title';
        var KEY_NUM = 'interface_mod_new_episode_numbers_only';
        var KEY_RATING = 'interface_mod_new_rating_on_cards';
        var KEY_TYPE_BADGES = 'interface_mod_new_type_badges';
        var KEY_ALT_TYPE_BADGES = 'interface_mod_new_alt_type_badges';
        var S = {
            year_on: (Lampa.Storage.get(KEY_YEAR, false) === true || Lampa.Storage.get(KEY_YEAR, 'false') === 'true'),
            hide_year_title: (Lampa.Storage.get(KEY_HIDE_YEAR_TITLE, false) === true || Lampa.Storage.get(KEY_HIDE_YEAR_TITLE, 'false') === 'true'),
            alt_ep: (Lampa.Storage.get(KEY_ALT, false) === true || Lampa.Storage.get(KEY_ALT, 'false') === 'true'),
            num_only: (Lampa.Storage.get(KEY_NUM, false) === true || Lampa.Storage.get(KEY_NUM, 'false') === 'true'),
            show_rate: (Lampa.Storage.get(KEY_RATING, true) === true || Lampa.Storage.get(KEY_RATING, 'true') === 'true'),
            type_badges: (Lampa.Storage.get(KEY_TYPE_BADGES, false) === true || Lampa.Storage.get(KEY_TYPE_BADGES, 'false') === 'true'),
            alt_type_badges: (Lampa.Storage.get(KEY_ALT_TYPE_BADGES, false) === true || Lampa.Storage.get(KEY_ALT_TYPE_BADGES, 'false') === 'true')
        };
        function ensureCss() {
            var id = 'ifx_css_stable_final_v2';
            if (document.getElementById(id)) return;
            var st = document.createElement('style');
            st.id = id;
            st.textContent = `
      .ifx-pill{
        background: rgba(0,0,0,.5);
        color:#fff; font-size:1.3em; font-weight:700;
        padding:.2em .5em; border-radius:1em; line-height:1;
        white-space:nowrap;
      }
      .ifx-corner-stack{
        position:absolute; right:.3em; bottom:.3em;
        display:flex; flex-direction:column; align-items:flex-end;
        gap:2px; z-index:10; pointer-events:none;
      }
      .ifx-corner-stack > *{ pointer-events:auto; }
      .ifx-corner-stack .card__vote, .ifx-corner-stack .card_vote{
        position:static !important; right:auto !important; bottom:auto !important; top:auto !important; left:auto !important;
        background: rgba(0,0,0,.5); color:#fff; font-size:1.3em; font-weight:700;
        padding:.2em .5em; border-radius:1em; line-height:1;
      }
      .card .card__view{ position:relative; }
      .card-episode .full-episode{ position:relative; }
      body.ifx-ep-alt .card-episode .full-episode .card__title{
        position:absolute; left:.7em; top:.7em; right:.7em; margin:0;
        z-index:2; text-shadow:0 1px 2px rgba(0,0,0,.35);
      }
      body.ifx-ep-alt .card-episode .full-episode__num{ display:none !important; }
      body.ifx-ep-alt .card-episode .full-episode__body > .card__age{ display:none !important; }
      body.ifx-num-only .card-episode .full-episode__num{ display:none !important; }
      .ifx-hide-age .card__age{ display:none !important; }
      body.ifx-no-rate .card__view > .card__vote,
      body.ifx-no-rate .card__view > .card_vote,
      body.ifx-no-rate .ifx-corner-stack > .card__vote,
      body.ifx-no-rate .ifx-corner-stack > .card_vote {
        display: none !important;
      }
      .torrent-item__bitrate span,
      .torrent-item__seeds span,
      .torrent-item__grabs span {
        border-radius: 0.3em !important;
        padding: 0.3em 0.5em !important;
        font-weight: bold !important;
        display: inline-block !important;
        line-height: 1.2 !important;
        transition: all 0.2s ease !important;
      }
      .torrent-item.focus {
        outline: none !important;
        border: 3px solid #ffffff !important;
        box-shadow: 0 0 15px rgba(255, 255, 255, 0.4) !important;
        transform: scale(1.01) !important;
        z-index: 10 !important;
        background: rgba(255, 255, 255, 0.1) !important;
      }
    `;
            document.head.appendChild(st);
        }
        function ensureTypeBadgesCss() {
            var el = document.getElementById('ifx_type_badges_css');
            if (el) el.remove();
            var st = document.createElement('style');
            st.id = 'ifx_type_badges_css';
            st.textContent = `
    body.ifx-type-badges .card__type { display: none !important; }
    .ifx-bottom-left-stack {
      position: absolute; left: .3em; bottom: .3em;
      display: flex; flex-direction: column; align-items: flex-start;
      gap: 2px; z-index: 10; pointer-events: none;
    }
    .ifx-bottom-left-stack > * { pointer-events: auto; }
    .ifx-pill-movie { color: #81c784 !important; } 
    .ifx-pill-series { color: #64b5f6 !important; } 
    body.ifx-alt-type-badges .card__type.ifx-movie-type {
        background: #4285F4 !important; 
        color: #fff !important;
    }
    body:not(.ifx-alt-type-badges) .card__type.ifx-movie-type { display: none !important; }
  `;
            document.head.appendChild(st);
        }
        function ifxSyncAltBadgeThemeFromQuality() {
            try {
                var q = document.querySelector('.card--season-complete, .card--season-progress')
                    || document.querySelector('.card__quality');
                var inner = q ? (q.querySelector('div') || q) : null;
                var bg = 'rgba(61,161,141,0.9)';
                var fg = '#FFFFFF';
                if (q) {
                    var csQ = getComputedStyle(q);
                    if (csQ.backgroundColor) bg = csQ.backgroundColor;
                }
                if (inner) {
                    var csI = getComputedStyle(inner);
                    if (csI.color) fg = csI.color;
                }
                var root = document.documentElement;
                root.style.setProperty('--ifx-badge-bg', bg);
                root.style.setProperty('--ifx-badge-color', fg);
            } catch (e) { }
        }
        function ensureAltBadgesCss() {
            var st = document.getElementById('ifx_alt_badges_css');
            var RIGHT_OFFSET = '.3em';
            var BOTTOM_OFFSET = '.50em';
            var RADIUS = '0.3em';
            var FONT_FAMILY = "'Roboto Condensed','Arial Narrow',Arial,sans-serif";
            var FONT_WEIGHT = '600';
            var FONT_SIZE = '0.9em';
            var PAD_Y = '.39em';
            var PAD_X = '.39em';
            var UPPERCASE = true;
            var css = `
    body.ifx-alt-badges .card .card__view{ position:relative; }
    body.ifx-alt-badges .ifx-corner-stack{
      position:absolute; right:${RIGHT_OFFSET}; bottom:${BOTTOM_OFFSET};
      margin-right:0;
      display:flex; flex-direction:column; align-items:flex-end;
      gap:0.04em; z-index:10; pointer-events:none;
    }
    body.ifx-alt-badges .ifx-corner-stack > *{ pointer-events:auto; }
    body.ifx-alt-badges .ifx-corner-stack .card__vote,
    body.ifx-alt-badges .ifx-corner-stack .card_vote,
    body.ifx-alt-badges .ifx-corner-stack .ifx-year-pill{
      position:static !important;
      background: var(--ifx-badge-bg, rgba(61,161,141,0.9)) !important;
      color: var(--ifx-badge-color, #FFFFFF) !important;
      border-radius: ${RADIUS};
      padding: ${PAD_Y} ${PAD_X} !important;         
      font-family: ${FONT_FAMILY};
      font-weight: ${FONT_WEIGHT};
      font-size: ${FONT_SIZE} !important;            
      line-height: 1.2;
      ${UPPERCASE ? 'text-transform: uppercase;' : ''}
      text-shadow: 0.5px 0.5px 1px rgba(0,0,0,0.3);
      box-sizing: border-box;
      display: inline-flex; align-items: center;
      white-space: nowrap;
    }
    body.ifx-alt-badges .card__view > .card__vote,
    body.ifx-alt-badges .card__view > .card_vote{
      position:absolute !important;
      right:${RIGHT_OFFSET} !important;
      bottom:${BOTTOM_OFFSET} !important;
      margin-right:0 !important;
      background: var(--ifx-badge-bg, rgba(61,161,141,0.9)) !important;
      color: var(--ifx-badge-color, #FFFFFF) !important;
      border-radius: ${RADIUS};
      padding: ${PAD_Y} ${PAD_X} !important;         
      font-family: ${FONT_FAMILY} !important;
      font-weight: ${FONT_WEIGHT} !important;
      font-size: ${FONT_SIZE} !important;            
      line-height: 1.2;
      ${UPPERCASE ? 'text-transform: uppercase;' : ''}
      text-shadow: 0.5px 0.5px 1px rgba(0,0,0,0.3);
      z-index: 11;
      box-sizing: border-box;
      display: inline-flex; align-items: center;
      white-space: nowrap;
    }
  `;
            if (st) { st.textContent = css; }
            else { st = document.createElement('style'); st.id = 'ifx_alt_badges_css'; st.textContent = css; document.head.appendChild(st); }
        }
        var tplEpisodeOriginal = null;
        var tplEpisodeAlt =
            '<div class="card-episode selector layer--visible layer--render">\
      <div class="card-episode__body">\
        <div class="full-episode">\
          <div class="full-episode__img"><img/></div>\
          <div class="full-episode__body">\
            <div class="card__title">{title}</div>\
            <div class="card__age">{release_year}</div>\
            <div class="full-episode__num">{num}</div>\
            <div class="full-episode__name">{name}</div>\
            <div class="full-episode__date">{date}</div>\
          </div>\
        </div>\
      </div>\
      <div class="card-episode__footer hide">\
        <div class="card__imgbox">\
          <div class="card__view"><img class="card__img"/></div>\
        </div>\
        <div class="card__left">\
          <div class="card__title">{title}</div>\
          <div class="card__age">{release_year}</div>\
        </div>\
      </div>\
    </div>';
        function setEpisodeAlt(on) {
            if (tplEpisodeOriginal === null) {
                try { tplEpisodeOriginal = Lampa.Template.get('card_episode', {}, true); } catch (e) { tplEpisodeOriginal = null; }
            }
            Lampa.Template.add('card_episode', on ? tplEpisodeAlt : (tplEpisodeOriginal || tplEpisodeAlt));
            document.body.classList.toggle('ifx-ep-alt', !!on);
            document.body.classList.toggle('ifx-num-only', S.num_only);
            try { Lampa.Settings.update(); } catch (e) { }
        }
        function episodeWord() {
            var code = (Lampa.Lang && Lampa.Lang.code) || 'uk';
            return code.indexOf('en') === 0 ? 'Episode' : 'Серія';
        }
        var __ifx_yearCache = window.__ifx_yearCache || new WeakMap();
        window.__ifx_yearCache = __ifx_yearCache;
        function __ifx_getYear_orig($root) {
            var d = $root.data() || {};
            var y = (d.first_air_date || '').slice(0, 4)
                || (d.release_date || '').slice(0, 4)
                || d.release_year
                || d.year;
            if (/^(19|20)\d{2}$/.test(String(y))) return String(y);
            var ageTxt = ($root.find('.card__age').first().text() || '').trim();
            var mAge = ageTxt.match(/(19|20)\d{2}/);
            if (mAge) return mAge[0];
            var title = ($root.find('.card__title').first().text() || '').trim();
            var mTitle =
                title.match(/[\[\(]\s*((?:19|20)\d{2})\s*[\]\)]\s*$/) ||
                title.match(/(?:[–—·\/-]\s*)((?:19|20)\d{2})\s*$/);
            if (mTitle) return mTitle[1];
            return '';
        }
        function getYear($root) {
            try {
                var el = $root && $root[0];
                if (el && __ifx_yearCache.has(el)) return __ifx_yearCache.get(el);
                var y = __ifx_getYear_orig($root) || '';
                if (el) __ifx_yearCache.set(el, y);
                return y;
            } catch (e) {
                return __ifx_getYear_orig($root);
            }
        }
        function ensureStack($anchor) {
            var $stack = $anchor.children('.ifx-corner-stack');
            if (!$stack.length) $stack = $('<div class="ifx-corner-stack"></div>').appendTo($anchor);
            return $stack;
        }
        function stripYear(txt) {
            var s = String(txt || '');
            s = s.replace(/\s*\((19|20)\d{2}\)\s*$/, '');
            s = s.replace(/\s*\[(19|20)\d{2}\]\s*$/, '');
            s = s.replace(/\s*[–—\-·]\s*(19|20)\d{2}\s*$/, '');
            s = s.replace(/\s*\/\s*(19|20)\d{2}\s*$/, '');
            return s;
        }
        function applyTitleYearHide($scope) {
            $scope = $scope || $(document.body);
            var hideOnly = getBool('interface_mod_new_hide_year_title', false);
            var doHide = S.year_on || hideOnly;
            $scope.find('.ifx-hide-age .card__title').each(function () {
                var $t = $(this);
                if ($t.find('.card__age').length) {
                    var saved = $t.data('ifx-title-orig');
                    if (typeof saved === 'string') { $t.text(saved); $t.removeData('ifx-title-orig'); }
                    return;
                }
                if (doHide) {
                    var orig = $t.data('ifx-title-orig');
                    if (!orig) $t.data('ifx-title-orig', $t.text());
                    var base = orig || $t.text();
                    var stripped = stripYear(base);
                    if (stripped !== $t.text()) $t.text(stripped.trim());
                } else {
                    var sv = $t.data('ifx-title-orig');
                    if (typeof sv === 'string') { $t.text(sv); $t.removeData('ifx-title-orig'); }
                }
            });
        }
        function applyListCard($card) {
            var $view = $card.find('.card__view').first();
            if (!$view.length) return;
            var $vote = $view.find('.card__vote, .card_vote').first();
            var $stack = ensureStack($view);
            var hardHide = !S.show_rate || document.body.classList.contains('ifx-no-rate');
            if ($vote.length) {
                if (hardHide) {
                    $vote.addClass('ifx-vote-hidden').hide();
                } else {
                    $vote.removeClass('ifx-vote-hidden').show();
                    var useStack = S.year_on || document.body.classList.contains('ifx-alt-badges');
                    if (useStack && !$vote.parent().is($stack)) $stack.prepend($vote);
                }
            }
            if (S.year_on || S.hide_year_title) {
                $card.addClass('ifx-hide-age');
            } else {
                $card.removeClass('ifx-hide-age');
            }
            if (S.year_on) {
                if (!$stack.children('.ifx-year-pill').length) {
                    var y = getYear($card);
                    if (y) $('<div class="ifx-pill ifx-year-pill"></div>').text(y).appendTo($stack);
                }
            } else {
                $stack.children('.ifx-year-pill').remove();
            }
            var isPerson = $card.hasClass('card--person') || $card.closest('.scroll--persons, .items--persons, .crew').length > 0;
            var isMusic = $card.hasClass('card--vinyl') || $card.closest('.vinyl-line, .vinyl-all-grid, .vinyl-main').length > 0;
            if (!isPerson && !isMusic) {
                var isTv = $card.hasClass('card--tv') || $card.find('.card__type').text().trim() === 'TV';
                var cardText = $card.text().toLowerCase();
                var hasMovieTraits = $card.find('.card__age').length > 0 ||
                    $card.find('.card__vote').length > 0 ||
                    /\b(19|20)\d{2}\b/.test(cardText);
                if (isTv || hasMovieTraits) {
                    var typeText = isTv ? 'Серіал' : 'Фільм';
                    if (S.type_badges) {
                        var $leftStack = $view.children('.ifx-bottom-left-stack');
                        if (!$leftStack.length) {
                            $leftStack = $('<div class="ifx-bottom-left-stack"></div>').appendTo($view);
                        }
                        var $typePill = $leftStack.children('.ifx-type-pill');
                        if (!$typePill.length) {
                            $typePill = $('<div class="ifx-pill ifx-type-pill"></div>').appendTo($leftStack);
                        }
                        $typePill.text(typeText);
                        $typePill.removeClass('ifx-pill-movie ifx-pill-series');
                        $typePill.addClass(isTv ? 'ifx-pill-series' : 'ifx-pill-movie');
                    } else {
                        $view.children('.ifx-bottom-left-stack').remove();
                    }
                    if (S.alt_type_badges) {
                        if (!isTv) {
                            var $movieType = $view.children('.ifx-movie-type');
                            if (!$movieType.length) {
                                $('<div class="card__type ifx-movie-type">Movie</div>').appendTo($view);
                            }
                        } else {
                            $view.children('.ifx-movie-type').remove();
                        }
                    } else {
                        $view.children('.ifx-movie-type').remove();
                    }
                } else {
                    $view.children('.ifx-bottom-left-stack').remove();
                    $view.children('.ifx-movie-type').remove();
                }
            } else {
                $view.children('.ifx-bottom-left-stack').remove();
                $view.children('.ifx-movie-type').remove();
            }
        }
        function applyEpisodeCard($ep) {
            var $full = $ep.find('.full-episode').first();
            if (!$full.length) return;
            var $stack = ensureStack($full);
            if (!$stack.children('.ifx-year-pill').length) {
                var y = getYear($ep);
                if (y) $('<div class="ifx-pill ifx-year-pill"></div>').text(y).appendTo($stack);
            }
            if (S.year_on) $full.addClass('ifx-hide-age'); else $full.removeClass('ifx-hide-age');
        }
        function injectAll($scope) {
            $scope = $scope || $(document.body);
            $scope.find('.card').each(function () {
                var $c = $(this);
                if ($c.closest('.full-start, .full-start-new, .full, .details').length) return;
                applyListCard($c);
            });
            $scope.find('.card-episode').each(function () {
                var $ep = $(this);
                var $full = $ep.find('.full-episode').first();
                if (S.year_on) {
                    applyEpisodeCard($ep);
                } else {
                    $full.removeClass('ifx-hide-age');
                    $full.find('.ifx-year-pill').remove();
                }
            });
            applyNumberOnly($scope);
            applyTitleYearHide($scope);
        }
        function applyNumberOnly($scope) {
            $scope = $scope || $(document.body);
            var force = S.num_only;
            $scope.find('.card-episode .full-episode').each(function () {
                var $root = $(this);
                var $name = $root.find('.full-episode__name').first();
                if (!$name.length) return;
                if (!force) {
                    var orig = $name.data('ifx-orig');
                    if (typeof orig === 'string') { $name.text(orig); $name.removeData('ifx-orig'); }
                    return;
                }
                var $num = $root.find('.full-episode__num').first();
                var n = ($num.text() || '').trim();
                if (!n) {
                    var m = ($name.text() || '').match(/\d+/);
                    if (m) n = m[0];
                }
                if (!n) return;
                if (!$name.data('ifx-orig')) $name.data('ifx-orig', $name.text());
                $name.text(episodeWord() + ' ' + String(parseInt(n, 10)));
            });
        }
        var mo = null;
        var moDebounce = null;
        function enableObserver() {
            if (mo) return;
            mo = new MutationObserver(function (muts) {
                for (var i = 0; i < muts.length; i++) {
                    if (muts[i].addedNodes && muts[i].addedNodes.length) {
                        if (moDebounce) clearTimeout(moDebounce);
                        moDebounce = setTimeout(function () { injectAll($(document.body)); }, 200);
                        break;
                    }
                }
            });
            try { mo.observe(document.body, { subtree: true, childList: true }); } catch (e) { }
        }
        function disableObserver() { if (mo) { try { mo.disconnect(); } catch (e) { } mo = null; } }
        if (!window.__ifx_storage_stable_final_v2) {
            window.__ifx_storage_stable_final_v2 = true;
            var _prev = Lampa.Storage.set;
            Lampa.Storage.set = function (k, v) {
                var r = _prev.apply(this, arguments);
                if (typeof k === 'string' && k.indexOf('interface_mod_new_') === 0) {
                    if (k === KEY_YEAR) {
                        S.year_on = (v === true || v === 'true' || Lampa.Storage.get(KEY_YEAR, 'false') === 'true');
                        ensureCss();
                        injectAll($(document.body));
                    }
                    if (k === KEY_ALT) {
                        S.alt_ep = (v === true || v === 'true' || Lampa.Storage.get(KEY_ALT, 'false') === 'true');
                        setEpisodeAlt(S.alt_ep);
                        setTimeout(function () { injectAll($(document.body)); }, 50);
                    }
                    if (k === KEY_NUM) {
                        S.num_only = (v === true || v === 'true' || Lampa.Storage.get(KEY_NUM, 'false') === 'true');
                        document.body.classList.toggle('ifx-num-only', S.num_only);
                        applyNumberOnly($(document.body));
                    }
                    if (k === KEY_TYPE_BADGES) {
                        S.type_badges = (v === true || v === 'true');
                        if (S.type_badges) {
                            S.alt_type_badges = false;
                            Lampa.Storage.set(KEY_ALT_TYPE_BADGES, false);
                        }
                        document.body.classList.toggle('ifx-type-badges', S.type_badges);
                        document.body.classList.toggle('ifx-alt-type-badges', S.alt_type_badges);
                        ensureTypeBadgesCss();
                        setTimeout(function () { injectAll($(document.body)); }, 50);
                    }
                    if (k === KEY_ALT_TYPE_BADGES) {
                        S.alt_type_badges = (v === true || v === 'true');
                        if (S.alt_type_badges) {
                            S.type_badges = false;
                            Lampa.Storage.set(KEY_TYPE_BADGES, false);
                        }
                        document.body.classList.toggle('ifx-type-badges', S.type_badges);
                        document.body.classList.toggle('ifx-alt-type-badges', S.alt_type_badges);
                        ensureTypeBadgesCss();
                        setTimeout(function () { injectAll($(document.body)); }, 50);
                    }
                    if (k === 'interface_mod_new_alt_badges') {
                        var on = (v === true || v === 'true' || Lampa.Storage.get('interface_mod_new_alt_badges', 'false') === 'true');
                        ensureAltBadgesCss();
                        document.body.classList.toggle('ifx-alt-badges', on);
                        if (on) ifxSyncAltBadgeThemeFromQuality();
                    }
                    if (k === KEY_RATING) {
                        S.show_rate = (v === true || v === 'true' || Lampa.Storage.get(KEY_RATING, 'true') === 'true');
                        document.body.classList.toggle('ifx-no-rate', !S.show_rate);
                        injectAll($(document.body));
                    }
                    if (k === KEY_HIDE_YEAR_TITLE) {
                        S.hide_year_title = (v === true || v === 'true' || Lampa.Storage.get(KEY_HIDE_YEAR_TITLE, 'false') === 'true');
                        injectAll($(document.body));
                    }
                }
                return r;
            };
        }
        function boot() {
            ensureCss();
            setEpisodeAlt(S.alt_ep);
            ensureTypeBadgesCss();
            document.body.classList.toggle('ifx-type-badges', S.type_badges);
            document.body.classList.toggle('ifx-alt-type-badges', S.alt_type_badges);
            enableObserver();
            injectAll($(document.body));
            ensureAltBadgesCss();
            var altOn = (Lampa.Storage.get('interface_mod_new_alt_badges', false) === true
                || Lampa.Storage.get('interface_mod_new_alt_badges', 'false') === 'true');
            document.body.classList.toggle('ifx-alt-badges', altOn);
            if (altOn) ifxSyncAltBadgeThemeFromQuality();
            document.body.classList.toggle('ifx-no-rate', !S.show_rate);
        }
        if (window.appready) boot();
        else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') boot(); });
    })();
})();




/* ==========================================================================
 * Стильний інтерфейс 2.0 — розділи «Рейтинги» та «Зовнішній вигляд».
 * Власний код плагіна (ідеї функцій — Yarik's Mod і LMX Pack, код не запозичено).
 * ========================================================================== */
(function () {
    'use strict';
    if (window.__sui_extra) return;
    window.__sui_extra = true;

    var P = 'sui_';
    var SUI = 'stylish_ui', RT = 'stylish_ui_rt', RT_SEL = 'stylish_ui_rt_sel', LOOK = 'stylish_ui_look';

    function S(k, d) {
        var v = Lampa.Storage.get(P + k, d);
        if (v === 'true') return true;
        if (v === 'false') return false;
        return v;
    }
    function setS(k, v) { Lampa.Storage.set(P + k, v); }
    function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function trim(t) { return String(t == null ? '' : t).replace(/^\s+|\s+$/g, ''); }

    function cacheGet(store, key, ttl) {
        try {
            var all = Lampa.Storage.get(store, '{}');
            if (typeof all === 'string') all = JSON.parse(all || '{}');
            var it = all && all[key];
            if (it && Date.now() - it.t < (it.ttl || ttl)) return it.v;
        } catch (e) { }
        return null;
    }
    function cacheSet(store, key, val, ttl) {
        try {
            var all = Lampa.Storage.get(store, '{}');
            if (typeof all === 'string') all = JSON.parse(all || '{}');
            all = all || {};
            all[key] = { t: Date.now(), v: val, ttl: ttl };
            var keys = Object.keys(all);
            if (keys.length > 700) {
                keys.sort(function (a, b) { return all[a].t - all[b].t; });
                for (var i = 0; i < keys.length - 500; i++) delete all[keys[i]];
            }
            Lampa.Storage.set(store, all);
        } catch (e) { }
    }

    function getJSON(url, ok, fail) {
        var done = false;
        var x = new XMLHttpRequest();
        var tm = setTimeout(function () { if (!done) { done = true; try { x.abort(); } catch (e) { } if (fail) fail('timeout'); } }, 12000);
        try {
            x.open('GET', url, true);
            x.onload = function () {
                if (done) return; done = true; clearTimeout(tm);
                if (x.status < 200 || x.status >= 300) return fail && fail('http ' + x.status);
                var j = null;
                try { j = JSON.parse(x.responseText); } catch (e) { return fail && fail('json'); }
                ok(j);
            };
            x.onerror = function () { if (!done) { done = true; clearTimeout(tm); if (fail) fail('net'); } };
            x.send(null);
        } catch (e) { if (!done) { done = true; clearTimeout(tm); if (fail) fail('err'); } }
    }

    function tmdbUrl(path) {
        var key = '';
        try { key = Lampa.Storage.get('interface_mod_new_tmdb_api_key', '') || (Lampa.TMDB && Lampa.TMDB.key ? Lampa.TMDB.key() : ''); } catch (e) { }
        var u = path + (path.indexOf('?') < 0 ? '?' : '&') + 'api_key=' + key;
        try { if (Lampa.TMDB && Lampa.TMDB.api) return Lampa.TMDB.api(u); } catch (e) { }
        return 'https://api.themoviedb.org/3/' + u;
    }
    function tmdbImg(path) {
        var u = 'https://image.tmdb.org/t/p/w500' + path;
        try { if (Lampa.TMDB && Lampa.TMDB.image) return Lampa.TMDB.image('t/p/w500' + path); } catch (e) { }
        return u;
    }
    function isTv(m) { return !!(m && (m.name || m.first_air_date || m.number_of_seasons || /tv/i.test(m.media_type || m.type || ''))); }

    /* ======================================================================
     * 2. РЕЙТИНГИ
     * ==================================================================== */
    var RATINGS = [
        { key: 'tmdb', name: 'TMDB', color: '#01b4e4' },
        { key: 'imdb', name: 'IMDb', color: '#f5c518' },
        { key: 'rt', name: 'Rotten Tomatoes', short: 'RT', color: '#fa320a' },
        { key: 'popcorn', name: 'RT Audience', short: 'RT 🍿', color: '#ffb000' },
        { key: 'mc', name: 'Metacritic', short: 'MC', color: '#66cc33' },
        { key: 'trakt', name: 'Trakt', color: '#ed1c24' },
        { key: 'letterboxd', name: 'Letterboxd', short: 'LB', color: '#40bcf4' },
        { key: 'mdblist', name: 'MDBList Score', short: 'MDB', color: '#4284f5' },
        { key: 'awards', name: 'Нагороди', short: '🏆', color: '#e5b80b' }
    ];
    function rtOn(key) { return S('rt_show_' + key, true) !== false; }

    function scoreColor(v10) {
        if (v10 == null || isNaN(v10)) return '#ddd';
        if (v10 >= 7.5) return '#3fd16b';
        if (v10 >= 6) return '#f5c518';
        if (v10 >= 4) return '#ff9b3d';
        return '#ff5a5a';
    }

    function rtCss() {
        var id = 'sui-rt-css', el = document.getElementById(id);
        if (!el) { el = document.createElement('style'); el.id = id; document.head.appendChild(el); }
        var size = S('rt_size', '1.1em'), gap = S('rt_gap', '0.5em'), ml = S('rt_ml', '0em'), mt = S('rt_mt', '10px'), sat = S('rt_sat', '100%');
        el.textContent =
            '.sui-rt{display:flex;flex-wrap:wrap;align-items:center;gap:' + gap + ';margin:' + mt + ' 0 ' + mt + ' ' + ml + ';font-size:' + size + ';filter:saturate(' + sat + ')}' +
            '.sui-rt__i{display:inline-flex;align-items:center;gap:.35em;padding:.25em .6em;border-radius:.45em;line-height:1.2;white-space:nowrap}' +
            '.sui-rt--normal .sui-rt__i{background:rgba(0,0,0,.45)}' +
            '.sui-rt--apple .sui-rt__i{background:rgba(255,255,255,.12);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.18)}' +
            '.sui-rt--apple_lite .sui-rt__i{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18)}' +
            '.sui-rt__n{font-weight:700;font-size:.8em;letter-spacing:.02em}' +
            '.sui-rt__v{font-weight:700}';
    }

    // отримати IMDb id: з картки, або через TMDB external_ids
    function imdbIdFor(m, cb) {
        if (m.imdb_id) return cb(m.imdb_id);
        var ck = (isTv(m) ? 'tv' : 'movie') + ':' + m.id;
        var c = cacheGet('sui_imdb', ck, 30 * 864e5);
        if (c) return cb(c);
        getJSON(tmdbUrl((isTv(m) ? 'tv/' : 'movie/') + m.id + '/external_ids'), function (j) {
            var id = j && j.imdb_id;
            if (id) cacheSet('sui_imdb', ck, id, 30 * 864e5);
            cb(id || '');
        }, function () { cb(''); });
    }

    function fetchMdb(m, cb) {
        var key = trim(S('rt_mdb_key', ''));
        if (!key) return cb(null);
        var url = 'https://mdblist.com/api/?apikey=' + encodeURIComponent(key) + '&tm=' + m.id + '&m=' + (isTv(m) ? 'show' : 'movie');
        getJSON(url, function (j) {
            if (!j || j.response === false) return cb(null);
            var out = { imdbid: j.imdbid };
            (j.ratings || []).forEach(function (r) {
                if (r.value == null || r.value === 0) return;
                var map = { imdb: 'imdb', tomatoes: 'rt', tomatoesaudience: 'popcorn', popcorn: 'popcorn', metacritic: 'mc', trakt: 'trakt', letterboxd: 'letterboxd' };
                var k = map[r.source];
                if (k) out[k] = r.value;
            });
            if (j.score) out.mdblist = j.score;
            cb(out);
        }, function () { cb(null); });
    }

    function fetchOmdb(imdb, cb) {
        var key = trim(S('rt_omdb_key', ''));
        if (!key || !imdb) return cb(null);
        getJSON('https://www.omdbapi.com/?apikey=' + encodeURIComponent(key) + '&i=' + imdb, function (j) {
            if (!j || j.Response === 'False') return cb(null);
            var out = {};
            if (j.imdbRating && j.imdbRating !== 'N/A') out.imdb = parseFloat(j.imdbRating);
            (j.Ratings || []).forEach(function (r) {
                if (r.Source === 'Rotten Tomatoes') out.rt = parseInt(r.Value, 10);
                if (r.Source === 'Metacritic') out.mc = parseInt(r.Value, 10);
            });
            if (j.Awards && j.Awards !== 'N/A') out.awards = j.Awards;
            cb(out);
        }, function () { cb(null); });
    }

    function collectRatings(m, cb) {
        var ck = (isTv(m) ? 'tv' : 'movie') + ':' + m.id;
        var cached = cacheGet('sui_rt_cache', ck, 3 * 864e5);
        if (cached) return cb(cached);
        var res = {};
        fetchMdb(m, function (md) {
            if (md) for (var k in md) res[k] = md[k];
            var imdb = (md && md.imdbid) || m.imdb_id;
            var next = function (id) {
                fetchOmdb(id, function (om) {
                    if (om) for (var k2 in om) if (res[k2] == null) res[k2] = om[k2];
                    if (Object.keys(res).length) cacheSet('sui_rt_cache', ck, res, 3 * 864e5);
                    cb(res);
                });
            };
            if (imdb) next(imdb); else imdbIdFor(m, next);
        });
    }

    function pl(n, one, few, many) { n = Math.abs(n) % 100; if (n >= 5 && n <= 20) return many; n = n % 10; if (n === 1) return one; if (n >= 2 && n <= 4) return few; return many; }
    function awardsText(a) {
        var s = String(a || '');
        var oscar = s.match(/Won (\d+) Oscar/i), wins = s.match(/(\d+) wins?/i), noms = s.match(/(\d+) nomination/i);
        if (oscar) return oscar[1] + ' ' + pl(+oscar[1], 'Оскар', 'Оскари', 'Оскарів') + (wins ? ' · ' + wins[1] + ' ' + pl(+wins[1], 'перемога', 'перемоги', 'перемог') : '');
        if (wins) return wins[1] + ' ' + pl(+wins[1], 'перемога', 'перемоги', 'перемог') + (noms ? ' · ' + noms[1] + ' номін.' : '');
        if (noms) return noms[1] + ' ' + pl(+noms[1], 'номінація', 'номінації', 'номінацій');
        return '';
    }

    function renderRatings(root, m, data) {
        root.find('.sui-rt').remove();
        var items = [];
        RATINGS.forEach(function (r) {
            if (!rtOn(r.key)) return;
            var v = r.key === 'tmdb' ? (m.vote_average ? Math.round(m.vote_average * 10) / 10 : null) : data[r.key];
            if (v == null || v === '' || (typeof v === 'number' && isNaN(v))) return;
            var shown, v10;
            if (r.key === 'awards') { shown = awardsText(v); if (!shown) return; v10 = 8; }
            else if (r.key === 'rt' || r.key === 'popcorn' || r.key === 'mc' || r.key === 'mdblist' || r.key === 'trakt') { shown = Math.round(v) + (r.key === 'mc' || r.key === 'mdblist' ? '' : '%'); v10 = v / 10; }
            else if (r.key === 'letterboxd') { shown = (Math.round(v * 10) / 10).toFixed(1); v10 = v * 2; }
            else { shown = (Math.round(v * 10) / 10).toFixed(1); v10 = v; }
            items.push('<span class="sui-rt__i"><span class="sui-rt__n" style="color:' + r.color + '">' + esc(r.short || r.name) + '</span><span class="sui-rt__v" style="color:' + scoreColor(v10) + '">' + esc(shown) + '</span></span>');
        });
        if (!items.length) return;
        var box = $('<div class="sui-rt sui-rt--' + esc(S('rt_style', 'normal')) + '">' + items.join('') + '</div>');
        var line = root.find('.full-start-new__rate-line, .full-start__rate-line').first();
        if (line.length) line.after(box); else root.find('.full-start-new__title, .full-start__title').first().after(box);
    }

    function onFullRatings(e) {
        if (S('rt_enable', true) === false) return;
        var m = e.data && e.data.movie;
        if (!m || !m.id) return;
        var root = e.object && e.object.activity ? $(e.object.activity.render()) : $('.full-start-new').closest('.activity');
        rtCss();
        renderRatings(root, m, {});                     // TMDB одразу
        collectRatings(m, function (data) { renderRatings(root, m, data || {}); });
    }

    /* ======================================================================
     * 3. ЗОВНІШНІЙ ВИГЛЯД
     * ==================================================================== */
    function lookCss() {
        var id = 'sui-look-css', el = document.getElementById(id);
        if (!el) { el = document.createElement('style'); el.id = id; document.head.appendChild(el); }
        var size = S('card_size', '1');
        var css = '';
        if (size !== '1') css += '.card:not(.card--wide):not(.card--collection){font-size:' + size + 'em}';
        css +=
            '.sui-badges{position:absolute;left:.4em;top:.4em;z-index:3;display:flex;flex-direction:column;gap:.25em;pointer-events:none}' +
            '.sui-badge{display:inline-flex;align-items:center;justify-content:center;min-width:1.9em;height:1.25em;padding:0 .35em;border-radius:.3em;font:700 .75em/1 Arial,sans-serif;color:#fff;box-shadow:0 1px 3px rgba(0,0,0,.6)}' +
            '.sui-badge--ua.sui-badge--flag{background:linear-gradient(#0057b7 50%,#ffd700 50%);color:transparent;width:1.9em}' +
            '.sui-badge--pl.sui-badge--flag{background:linear-gradient(#fff 50%,#dc143c 50%);color:transparent;width:1.9em}' +
            '.sui-badge--ua.sui-badge--text{background:#0057b7;color:#ffd700}' +
            '.sui-badge--pl.sui-badge--text{background:#dc143c;color:#fff}' +
            '.sui-logo{max-width:min(28em,90%);max-height:6em;display:block;object-fit:contain;object-position:left center}' +
            '.sui-hidden{display:none!important}';
        // ---- нижня інформаційна панель на постерах ----
        var bs = S('bot_size', '0.8em'), st = S('bot_style', 'standard'), design = S('card_design', 'classic');
        css +=
            '.sui-bot{position:absolute;left:0;right:0;bottom:0;z-index:3;display:flex;flex-wrap:wrap;gap:.3em;align-items:flex-end;padding:1.6em .45em .45em;font-size:' + bs + ';pointer-events:none;border-radius:0 0 .5em .5em}' +
            '.sui-bot--standard{background:linear-gradient(transparent,rgba(0,0,0,.75))}' +
            '.sui-bot__b{display:inline-flex;align-items:center;padding:.15em .45em;border-radius:.35em;font:700 1em/1.2 Arial,sans-serif;color:#fff;white-space:nowrap}' +
            '.sui-bot--standard .sui-bot__b{background:rgba(0,0,0,.55)}' +
            '.sui-bot--glass .sui-bot__b{background:rgba(255,255,255,.16);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.25)}' +
            '.sui-bot--neon .sui-bot__b{background:rgba(10,12,24,.75);border:1px solid currentColor;box-shadow:0 0 .4em currentColor}' +
            '.sui-bot__sp{flex:1}' +
            '.sui-rate{position:absolute;z-index:4;font-size:' + bs + ';padding:.15em .45em;border-radius:.35em;font:700 1em/1.2 Arial,sans-serif;pointer-events:none}' +
            '.sui-rate{font-size:' + bs + '}' +
            '.sui-bot--standard ~ .sui-rate,.sui-rate.sui-rate--standard{background:rgba(0,0,0,.65)}' +
            '.sui-rate--glass{background:rgba(255,255,255,.16);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.25)}' +
            '.sui-rate--neon{background:rgba(10,12,24,.75);border:1px solid currentColor;box-shadow:0 0 .4em currentColor}' +
            '.sui-rate--tl{left:.4em;top:.4em}.sui-rate--tr{right:.4em;top:.4em}.sui-rate--bl{left:.4em;bottom:.4em}.sui-rate--br{right:.4em;bottom:.4em}' +
            '.sui-badges--tr{left:auto;right:.4em;align-items:flex-end}';
        if (S('native_vote', true) === false) css += '.card .card__vote{display:none!important}';
        if (design === 'square') css += '.card .card__view,.card .card__img{border-radius:0!important}';
        if (design === 'shadow') css += '.card .card__view{box-shadow:0 .5em 1.2em rgba(0,0,0,.65)}';
        if (design === 'minimal') css += '.card .card__title,.card .card__age{display:none!important}';
        el.textContent = css;
    }

    /* ---- мітки UA / PL на картках (дані — з парсера торентів) ---- */
    var RX_UA = /(^|[^a-z0-9])(ukr|ua|ukrainian)([^a-z0-9]|$)|ukr[ _-]?(dub|aud|voice)|(^|[^а-яіїєґa-z])укр(\.|[^а-яіїєґ]|$)|українськ|украинск/i;
    var RX_PL = /(^|[^a-z0-9])(pl|pol|polish)([^a-z0-9]|$)|lektor|polsk|dubbing[ ._-]?pl|pl[ ._-]?dub/i;
    var RX_SUBS = /(sub|субт|napisy)/i;

    function langOf(it) {
        var t = String(it.title || it.Title || ''), v = it.voices, l = it.languages;
        var vs = v && v.join ? v.join(' | ') : String(v || ''), ls = l && l.join ? l.join(' ') : String(l || '');
        var hay = t + ' | ' + vs;
        return {
            ua: RX_UA.test(hay) || /(^|[^a-z])(uk|ukr|ua)([^a-z]|$)/i.test(ls),
            pl: (RX_PL.test(hay) && !RX_SUBS.test((hay.match(RX_PL) || [''])[0])) || /(^|[^a-z])(pl|pol)([^a-z]|$)/i.test(ls)
        };
    }

    function parserHosts() {
        var out = [], url = '', key = '';
        try { url = trim(Lampa.Storage.get('jackett_url', '')).replace(/\/+$/, ''); key = trim(Lampa.Storage.get('jackett_key', '')); } catch (e) { }
        if (url) {
            if (!/^https?:\/\//i.test(url)) url = 'http://' + url;
            out.push({ base: url, v: 2, key: key });
            out.push({ base: url, v: 1, key: key });
        }
        out.push({ base: 'https://jac.red', v: 1, key: '' });
        return out;
    }
    function parserUrl(h, q, yr) {
        if (h.v === 2) return h.base + '/api/v2.0/indexers/all/results?apikey=' + encodeURIComponent(h.key || '') + '&Query=' + encodeURIComponent(q) + (yr ? '&year=' + yr : '');
        return h.base + '/api/v1.0/torrents?search=' + encodeURIComponent(q) + (yr ? '&year=' + yr : '') + '&exact=true';
    }

    var queue = [], running = 0, MAXRUN = 2;
    function lookupLangs(d, cb) {
        var title = d.original_title || d.original_name || d.title || d.name || '';
        var yr = parseInt(String(d.release_date || d.first_air_date || '').slice(0, 4), 10) || 0;
        var ck = (d.name ? 'tv' : 'movie') + ':' + (d.id || title) ;
        var c = cacheGet('sui_lang', ck, 3 * 864e5);
        if (c) return cb(c);
        queue.push({ d: d, title: title, yr: yr, ck: ck, cb: cb });
        pump();
    }
    function pump() {
        while (running < MAXRUN && queue.length) (function (job) {
            running++;
            var hosts = parserHosts(), i = 0;
            function next() {
                if (i >= hosts.length) { running--; job.cb({ ua: false, pl: false }); return pump(); }
                var h = hosts[i++];
                getJSON(parserUrl(h, job.title, job.yr), function (j) {
                    var arr = Array.isArray(j) ? j : ((j && (j.Results || j.results)) || []);
                    var r = { ua: false, pl: false };
                    for (var k = 0; k < arr.length; k++) { var l = langOf(arr[k] || {}); if (l.ua) r.ua = true; if (l.pl) r.pl = true; }
                    cacheSet('sui_lang', job.ck, r, arr.length ? 3 * 864e5 : 12 * 36e5);
                    running--; job.cb(r); pump();
                }, next);
            }
            next();
        })(queue.shift());
    }

    function badgeHtml(r) {
        if (S('badges', true) === false) return '';
        var style = S('badge_style', 'flag') === 'text' ? 'text' : 'flag', out = '';
        if (r.ua && S('badge_ua', true) !== false) out += '<span class="sui-badge sui-badge--ua sui-badge--' + style + '">UA</span>';
        if (r.pl && S('badge_pl', true) !== false) out += '<span class="sui-badge sui-badge--pl sui-badge--' + style + '">PL</span>';
        return out ? '<div class="sui-badges">' + out + '</div>' : '';
    }

    function decorateCard(el) {
        if (!el || el.__sui_done) return;
        var d = el.card_data;
        if (!d || !d.id) return;
        el.__sui_done = true;
        lookupLangs(d, function (r) {
            var view = el.querySelector('.card__view');
            if (!view) return;
            var old = view.querySelector('.sui-badges');
            if (old) old.parentNode.removeChild(old);
            var h = badgeHtml(r);
            if (h) view.insertAdjacentHTML('beforeend', h);
            var nb = view.querySelector('.sui-badges');
            if (nb && view.querySelector('.sui-rate--tl')) nb.classList.add('sui-badges--tr');
        });
    }

    function voteColor(v) { return v >= 7.5 ? '#3fd16b' : v >= 6 ? '#f5c518' : v >= 4 ? '#ff9b3d' : '#ff5a5a'; }

    function infoCard(el) {
        var d = el && el.card_data, view = el && el.querySelector('.card__view');
        if (!d || !view) return;
        var old = view.querySelectorAll('.sui-bot,.sui-rate');
        for (var i = 0; i < old.length; i++) old[i].parentNode.removeChild(old[i]);
        if (S('bot_panel', false) !== true) return;
        var st = S('bot_style', 'standard'), pos = S('bot_rate_pos', 'br'), parts = [];
        if (S('bot_year', true) !== false) {
            var y = String(d.release_date || d.first_air_date || '').slice(0, 4);
            if (/^\d{4}$/.test(y)) parts.push('<span class="sui-bot__b">' + y + '</span>');
        }
        if (S('bot_season', true) !== false) {
            var le = d.last_episode_to_air, se = '';
            if (le && le.season_number) se = 'S' + le.season_number + (le.episode_number ? ' · E' + le.episode_number : '');
            else if (d.number_of_seasons) se = 'S' + d.number_of_seasons;
            if (se) parts.push('<span class="sui-bot__b" style="color:#9fd3ff">' + se + '</span>');
        }
        var vote = parseFloat(d.vote_average), rateHtml = '';
        if (S('bot_rating', true) !== false && vote > 0) {
            var vt = (Math.round(vote * 10) / 10).toFixed(1);
            if (pos === 'bl' || pos === 'br') {
                var b = '<span class="sui-bot__b" style="color:' + voteColor(vote) + '">★ ' + vt + '</span>';
                if (pos === 'bl') parts.unshift(b); else { parts.push('<span class="sui-bot__sp"></span>'); parts.push(b); }
            } else rateHtml = '<span class="sui-rate sui-rate--' + pos + ' sui-rate--' + st + '" style="color:' + voteColor(vote) + '">★ ' + vt + '</span>';
        }
        if (parts.length) view.insertAdjacentHTML('beforeend', '<div class="sui-bot sui-bot--' + st + '">' + parts.join('') + '</div>');
        if (rateHtml) view.insertAdjacentHTML('beforeend', rateHtml);
        var ua = view.querySelector('.sui-badges');
        if (ua) ua.classList.toggle('sui-badges--tr', !!rateHtml && pos === 'tl');
    }
    function refreshInfo() {
        var list = document.querySelectorAll('.card');
        for (var i = 0; i < list.length; i++) infoCard(list[i]);
    }

    var io = null;
    var watching = false;
    function watchCards() {
        if (watching) return;
        watching = true;
        if (window.IntersectionObserver && !io) {
            io = new IntersectionObserver(function (ents) {
                ents.forEach(function (en) { if (en.isIntersecting) { io.unobserve(en.target); decorateCard(en.target); } });
            }, { rootMargin: '300px' });
        }
        function scan(root) {
            var list = (root.querySelectorAll ? root.querySelectorAll('.card') : []);
            for (var i = 0; i < list.length; i++) {
                if (list[i].__sui_seen) continue;
                list[i].__sui_seen = true;
                infoCard(list[i]);
                if (io) io.observe(list[i]); else if (S('badges', true) !== false) decorateCard(list[i]);
            }
        }
        scan(document);
        new MutationObserver(function (ms) {
            for (var i = 0; i < ms.length; i++) for (var j = 0; j < ms[i].addedNodes.length; j++) {
                var n = ms[i].addedNodes[j];
                if (n.nodeType !== 1) continue;
                if (n.classList && n.classList.contains('card')) { if (!n.__sui_seen) { n.__sui_seen = true; infoCard(n); if (io) io.observe(n); else if (S('badges', true) !== false) decorateCard(n); } }
                else scan(n);
            }
        }).observe(document.body, { childList: true, subtree: true });
    }
    function refreshBadges() {
        var list = document.querySelectorAll('.card');
        for (var i = 0; i < list.length; i++) { list[i].__sui_done = false; var b = list[i].querySelector('.sui-badges'); if (b) b.parentNode.removeChild(b); decorateCard(list[i]); }
    }

    /* ---- сторінка фільму ---- */
    function hideRows(root) {
        var seasons = S('hide_seasons', false) === true, comments = S('hide_comments', false) === true;
        if (!seasons && !comments) return;
        var tComments = '', tSeason = '', tSeries = '';
        try { tComments = Lampa.Lang.translate('title_comments'); tSeason = Lampa.Lang.translate('torrent_serial_season'); tSeries = Lampa.Lang.translate('full_series_release'); } catch (e) { }
        root.find('.items-line').each(function () {
            var t = trim($(this).find('.items-line__title').first().text());
            if (!t) return;
            var isC = t === tComments || /^(коментар|комментар|comments)/i.test(t);
            var isS = (tSeason && t.indexOf(tSeason) === 0) || t === tSeries || /^(сезон|season|сезони|seasons)/i.test(t);
            if ((comments && isC) || (seasons && isS)) $(this).addClass('sui-hidden');
        });
    }

    function applyLogo(root, m) {
        if (S('logo', false) !== true) return;
        var title = root.find('.full-start-new__title, .full-start__title').first();
        if (!title.length || title.find('.sui-logo').length) return;
        var ck = (isTv(m) ? 'tv' : 'movie') + ':' + m.id;
        var put = function (path) {
            if (!path) return;
            var img = new Image();
            img.className = 'sui-logo';
            img.alt = title.text();
            img.onload = function () { title.data('sui-text', title.html()); title.empty().append(img); };
            img.src = tmdbImg(path);
        };
        var c = cacheGet('sui_logo', ck, 7 * 864e5);
        if (c !== null) return put(c);
        getJSON(tmdbUrl((isTv(m) ? 'tv/' : 'movie/') + m.id + '/images?include_image_language=uk,en,null'), function (j) {
            var logos = (j && j.logos) || [], pick = null;
            ['uk', 'en', null].some(function (lng) {
                for (var i = 0; i < logos.length; i++) if ((logos[i].iso_639_1 || null) === lng) { pick = logos[i].file_path; return true; }
                return false;
            });
            if (!pick && logos.length) pick = logos[0].file_path;
            cacheSet('sui_logo', ck, pick || '', 7 * 864e5);
            put(pick);
        }, function () { });
    }

    /* ---- редактор кнопок ---- */
    function btnId($b) {
        var cls = ($b.attr('class') || '').split(/\s+/), i;
        for (i = 0; i < cls.length; i++) if (/^(button|view)--/.test(cls[i])) return cls[i];
        return 'txt:' + trim($b.text()).slice(0, 30);
    }
    function knownButtons() { var k = S('btn_known', '{}'); if (typeof k === 'string') { try { k = JSON.parse(k); } catch (e) { k = {}; } } return k || {}; }
    function hiddenButtons() { var h = S('btn_hidden', '[]'); if (typeof h === 'string') { try { h = JSON.parse(h); } catch (e) { h = []; } } return h || []; }

    function applyButtons(root) {
        var known = knownButtons(), hidden = hiddenButtons(), changed = false;
        root.find('.full-start-new__buttons .full-start__button, .full-start__buttons .full-start__button').each(function () {
            var $b = $(this), id = btnId($b), name = trim($b.find('span').first().text()) || trim($b.text()) || ($b.hasClass('button--options') ? 'Додатково (⋯)' : id);
            if (!known[id] || known[id] !== name) { known[id] = name; changed = true; }
            $b.toggleClass('sui-hidden', hidden.indexOf(id) >= 0);
        });
        if (changed) setS('btn_known', known);
    }

    function openButtonEditor() {
        var known = knownButtons(), hidden = hiddenButtons(), ids = Object.keys(known);
        if (!ids.length) { Lampa.Noty.show('Спершу відкрийте будь-який фільм — кнопки з’являться тут'); return; }
        var items = ids.map(function (id) { return { title: known[id], id: id, checkbox: true, checked: hidden.indexOf(id) < 0 }; });
        Lampa.Select.show({
            title: 'Кнопки на сторінці фільму',
            items: items,
            onCheck: function (a) {
                var h = hiddenButtons(), i = h.indexOf(a.id);
                if (a.checked) { if (i >= 0) h.splice(i, 1); } else if (i < 0) h.push(a.id);
                setS('btn_hidden', h);
            },
            onBack: function () { Lampa.Controller.toggle('settings_component'); }
        });
    }

    function onFullLook(e) {
        var m = e.data && e.data.movie;
        if (!m) return;
        var root = e.object && e.object.activity ? $(e.object.activity.render()) : $('.activity--active');
        applyLogo(root, m);
        applyButtons(root);
        hideRows(root);
        setTimeout(function () { hideRows(root); applyButtons(root); }, 800);
        setTimeout(function () { hideRows(root); }, 2500);
    }

    /* ======================================================================
     * МЕНЮ
     * ==================================================================== */
    function open(id) { Lampa.Settings.create(id, { onBack: function () { Lampa.Settings.create(id === RT_SEL ? RT : SUI); } }); }
    window.SUI_open = open;

    function sel(comp, key, title, desc, values, def) {
        Lampa.SettingsApi.addParam({ component: comp, param: { name: P + key, type: 'select', values: values, default: def }, field: { name: title, description: desc } });
    }
    function trg(comp, key, title, desc, def) {
        Lampa.SettingsApi.addParam({ component: comp, param: { name: P + key, type: 'trigger', default: def }, field: { name: title, description: desc } });
    }
    function inp(comp, key, title, desc) {
        Lampa.SettingsApi.addParam({ component: comp, param: { name: P + key, type: 'input', values: '', default: '', placeholder: '' }, field: { name: title, description: desc } });
    }
    function ttl(comp, name, text) { Lampa.SettingsApi.addParam({ component: comp, param: { name: P + name, type: 'title' }, field: { name: text } }); }
    function btn(comp, name, title, desc, fn) { Lampa.SettingsApi.addParam({ component: comp, param: { name: P + name, type: 'button' }, field: { name: title, description: desc }, onChange: fn }); }

    function sizes(list) { var o = {}; list.forEach(function (v) { o[v] = v; }); return o; }

    function addMenus() {
        [RT, RT_SEL, LOOK].forEach(function (c) { Lampa.Template.add('settings_' + c, '<div></div>'); });

        // ---- 13a / 14a: у кінці «Інформаційної панелі» ----
        var INFO = 'stylish_ui_info';
        ttl(INFO, 'bot_head', 'Нижня інформаційна панель');
        trg(INFO, 'bot_panel', 'Увімкнути', 'Плашка внизу постера з роком, сезоном і рейтингом', false);
        sel(INFO, 'bot_style', 'Стиль', 'Вигляд бейджів на постері', { standard: 'Стандартний', glass: 'Скло (Apple)', neon: 'Неон' }, 'standard');
        sel(INFO, 'card_design', 'Тип дизайну карток', '', { classic: 'Класичний', square: 'Без заокруглень', shadow: 'З тінню', minimal: 'Мінімалістичний (без підпису)' }, 'classic');
        sel(INFO, 'bot_size', 'Розмір бейджів', '', sizes(['0.6em', '0.7em', '0.8em', '0.9em', '1em', '1.1em', '1.2em']), '0.8em');
        sel(INFO, 'bot_rate_pos', 'Позиція рейтингу', '', { br: 'Справа знизу', bl: 'Зліва знизу', tr: 'Справа зверху', tl: 'Зліва зверху' }, 'br');
        ttl(INFO, 'bot_badges_head', 'Наявність бейджів');
        trg(INFO, 'bot_year', 'Бейдж року', 'Рік виходу на постері', true);
        trg(INFO, 'bot_season', 'Бейдж сезону/серії', 'Для серіалів: S3 · E8 (якщо Lampa знає сезон)', true);
        trg(INFO, 'bot_rating', 'Бейдж рейтингу (TMDB)', 'Оцінка TMDB кольором', true);
        trg(INFO, 'native_vote', 'Рейтинги на картці', 'Стандартна оцінка Lampa на постері', true);

        // ---- 2. Рейтинги ----
        ttl(RT, 'rt_head', 'Рейтинги');
        trg(RT, 'rt_enable', 'Показувати рейтинги', 'Рейтинги IMDb, Rotten Tomatoes, Metacritic та інших у повній картці', true);
        inp(RT, 'rt_omdb_key', 'OMDB API ключ', 'Безкоштовний ключ: omdbapi.com/apikey.aspx — IMDb, Rotten Tomatoes, Metacritic, нагороди');
        inp(RT, 'rt_mdb_key', 'MDBList API ключ', 'Безкоштовний ключ: mdblist.com → Preferences → API — усі джерела одразу');
        sel(RT, 'rt_style', 'Стиль блоку', 'Зовнішній вигляд рейтингів', { normal: 'Звичайний', apple: 'Apple (скло з розмиттям)', apple_lite: 'Apple Lite (без розмиття)' }, 'normal');
        sel(RT, 'rt_size', 'Розмір рейтингів', '', sizes(['0.8em', '0.9em', '1em', '1.1em', '1.2em', '1.3em', '1.5em']), '1.1em');
        sel(RT, 'rt_gap', 'Відстань між рейтингами', '', sizes(['0.2em', '0.3em', '0.5em', '0.7em', '1em']), '0.5em');
        sel(RT, 'rt_ml', 'Відступ зліва', '', sizes(['0em', '0.5em', '1em', '1.5em', '2em']), '0em');
        sel(RT, 'rt_mt', 'Відступ до інших рядків', '', sizes(['0px', '5px', '10px', '15px', '20px']), '10px');
        sel(RT, 'rt_sat', 'Насиченість', '', { '100%': '100% (стандарт)', '75%': '75%', '50%': '50%', '25%': '25%', '0%': '0% (Ч/Б)' }, '100%');
        btn(RT, 'rt_sel_open', 'Вибір рейтингів', 'Увімкнути або вимкнути джерела', function () { open(RT_SEL); });
        btn(RT, 'rt_clear', 'Очистити кеш рейтингів', 'Якщо рейтинги застаріли', function () { Lampa.Storage.set('sui_rt_cache', {}); Lampa.Noty.show('Кеш рейтингів очищено'); });

        ttl(RT_SEL, 'rt_sel_head', 'Вибір рейтингів');
        RATINGS.forEach(function (r) { trg(RT_SEL, 'rt_show_' + r.key, r.name, '', true); });

        // ---- 3. Зовнішній вигляд ----
        ttl(LOOK, 'look_cards', 'Картки');
        sel(LOOK, 'card_size', 'Розмір карток', 'Розмір постерів у рядах', { '0.8': 'Дрібні (80%)', '0.9': 'Менші (90%)', '1': 'Стандартні', '1.1': 'Більші (110%)', '1.2': 'Великі (120%)' }, '1');

        ttl(LOOK, 'look_badges', 'Мітки на картках');
        trg(LOOK, 'badges', 'Показувати мітки', 'Мітки звукових доріжок на постерах (дані з парсера торентів)', true);
        trg(LOOK, 'badge_ua', 'Мітка UA', 'Українська звукова доріжка', true);
        trg(LOOK, 'badge_pl', 'Мітка PL', 'Польська звукова доріжка', true);
        sel(LOOK, 'badge_style', 'Вигляд міток', '', { flag: 'Прапорець', text: 'Текст UA / PL' }, 'flag');

        ttl(LOOK, 'look_full', 'Сторінка фільму');
        trg(LOOK, 'hide_seasons', 'Сховати розділ «Сезони»', 'Ряд серій/сезонів у повній картці', false);
        trg(LOOK, 'hide_comments', 'Сховати коментарі', 'Ряд коментарів у повній картці', false);
        trg(LOOK, 'logo', 'Логотип замість назви', 'Показувати логотип фільму з TMDB (українською, якщо є)', false);
        btn(LOOK, 'btn_editor', 'Редактор кнопок', 'Які кнопки показувати на сторінці фільму', openButtonEditor);
    }

    function start() {
        addMenus();
        lookCss();
        rtCss();
        watchCards();
        Lampa.Listener.follow('full', function (e) {
            if (e.type !== 'complite') return;
            try { onFullRatings(e); } catch (er) { }
            try { onFullLook(e); } catch (er) { }
        });
        Lampa.Storage.listener.follow('change', function (e) {
            var n = String(e.name || '');
            if (n.indexOf(P + 'rt_') === 0) rtCss();
            if (n === P + 'card_size' || n === P + 'card_design' || n === P + 'bot_size' || n === P + 'bot_style' || n === P + 'native_vote') lookCss();
            if (/^sui_(bot_|native_vote)/.test(n)) refreshInfo();
            if (n === P + 'badges' || n === P + 'badge_ua' || n === P + 'badge_pl' || n === P + 'badge_style') { if (n === P + 'badges' && S('badges', true) !== false) watchCards(); refreshBadges(); }
        });
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });
})();
