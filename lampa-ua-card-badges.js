(function () {
    'use strict';

    if (window.plugin_card_badges_ua) return;
    window.plugin_card_badges_ua = true;

    const COUNTRIES_DATA = {
        'US': { name: 'США', flag: '🇺🇸' },
        'UA': { name: 'Україна', flag: '🇺🇦' },
        'GB': { name: 'Велика Британія', flag: '🇬🇧' },
        'FR': { name: 'Франція', flag: '🇫🇷' },
        'DE': { name: 'Німеччина', flag: '🇩🇪' },
        'CA': { name: 'Канада', flag: '🇨🇦' },
        'RU': { name: 'Росія', flag: '🇷🇺' },
        'JP': { name: 'Японія', flag: '🇯🇵' },
        'KR': { name: 'Південна Корея', flag: '🇰🇷' },
        'IT': { name: 'Італія', flag: '🇮🇹' },
        'ES': { name: 'Іспанія', flag: '🇪🇸' },
        'BR': { name: 'Бразилія', flag: '🇧🇷' },
        'AU': { name: 'Австралія', flag: '🇦🇺' },
        'IN': { name: 'Індія', flag: '🇮🇳' },
        'CN': { name: 'Китай', flag: '🇨🇳' },
        'PL': { name: 'Польща', flag: '🇵🇱' },
        'SE': { name: 'Швеція', flag: '🇸🇪' },
        'DK': { name: 'Данія', flag: '🇩🇰' },
        'NO': { name: 'Норвегія', flag: '🇳🇴' },
        'MX': { name: 'Мексика', flag: '🇲🇽' }
    };

    const CONFIG_ITEMS = [
        { key: 'type',    title: 'Тип контенту (Фільм / Серіал)', def: 'top_left' },
        { key: 'rating',  title: 'Рейтинг', def: 'top_right' },
        { key: 'quality', title: 'Якість', def: 'bottom_left' },
        { key: 'seasons', title: 'Інформація про сезони', def: 'bottom_left' },
        { key: 'next_ep', title: 'Дата виходу серії', def: 'off' },
        { key: 'country', title: 'Країна', def: 'bottom_right' },
        { key: 'year',    title: 'Рік виходу', def: 'bottom_right' }
    ];

    const POSITION_OPTIONS = {
        top_left: 'Вгорі зліва',
        top_center: 'Вгорі по центру',
        top_right: 'Вгорі справа',
        bottom_left: 'Внизу зліва',
        bottom_center: 'Внизу по центру',
        bottom_right: 'Внизу справа',
        off: 'Вимкнено'
    };

    const THEME_OPTIONS = {
        transparent: 'Прозора (Мінімалізм з розмиттям)',
        classic: 'Класична (Темно-сіра)',
        colored: 'Кольорова (Яскраві акценти)',
        neon: 'Неон (Синьо-блакитне свічення)',
        emerald: 'Смарагд (Зелений)',
        gold: 'Золото (Бурштиновий)'
    };

    const FONT_OPTIONS = {
        sans: 'Класичний (Без зарубок)',
        narrow: 'Сучасний (Компактний)',
        mono: 'Техно (Моноширинний)',
        bold: 'Кіно (Жирний брусковий)'
    };

    const COUNTRY_DISPLAY_OPTIONS = {
        text: 'Повна назва (наприклад, США)',
        flag: 'Емодзі-прапор (наприклад, 🇺🇸)'
    };

    function getSetting(key, def) {
        return Lampa.Storage.get('cb_ua_' + key, def);
    }

    function injectStyles() {
        const styleId = 'card-badges-ua-styles';
        if (document.getElementById(styleId)) return;

        const css = `
            .cb-ua-zone {
                position: absolute;
                display: flex;
                flex-direction: column;
                gap: 0.25em;
                z-index: 5;
                pointer-events: none;
                max-width: 90%;
            }
            .cb-ua-zone--top_left { top: 0.4em; left: 0.4em; align-items: flex-start; }
            .cb-ua-zone--top_center { top: 0.4em; left: 50%; transform: translateX(-50%); align-items: center; }
            .cb-ua-zone--top_right { top: 0.4em; right: 0.4em; align-items: flex-end; }
            .cb-ua-zone--bottom_left { bottom: 0.4em; left: 0.4em; align-items: flex-start; }
            .cb-ua-zone--bottom_center { bottom: 0.4em; left: 50%; transform: translateX(-50%); align-items: center; }
            .cb-ua-zone--bottom_right { bottom: 0.4em; right: 0.4em; align-items: flex-end; }

            .cb-ua-badge {
                padding: 0.2em 0.5em;
                border-radius: 0.35em;
                font-size: 0.72em;
                line-height: 1.15;
                letter-spacing: 0.03em;
                white-space: nowrap;
                box-shadow: 0 2px 5px rgba(0,0,0,0.4);
            }

            .cb-font-sans { font-family: Roboto, sans-serif; font-weight: 500; }
            .cb-font-narrow { font-family: 'Arial Narrow', sans-serif; font-weight: 700; text-transform: uppercase; }
            .cb-font-mono { font-family: monospace; font-weight: 600; }
            .cb-font-bold { font-family: Impact, sans-serif; font-weight: 400; letter-spacing: 0.05em; }

            .cb-theme-transparent { background: rgba(15, 15, 20, 0.65); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.15); }
            .cb-theme-classic { background: rgba(35, 35, 40, 0.9); color: #d0d0d0; border: 1px solid rgba(255, 255, 255, 0.08); }
            .cb-theme-colored { background: rgba(41, 128, 185, 0.9); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.2); }
            .cb-theme-neon { background: rgba(13, 27, 42, 0.88); color: #48cae4; border: 1px solid rgba(72, 202, 228, 0.3); backdrop-filter: blur(4px); }
            .cb-theme-emerald { background: rgba(15, 32, 26, 0.88); color: #52b788; border: 1px solid rgba(82, 183, 136, 0.3); backdrop-filter: blur(4px); }
            .cb-theme-gold { background: rgba(33, 27, 18, 0.88); color: #ffb703; border: 1px solid rgba(255, 183, 3, 0.3); backdrop-filter: blur(4px); }

            .card.cb-ua-hover-scale {
                transition: transform 0.2s ease-out;
            }
            .card.cb-ua-hover-scale.focus,
            .card.cb-ua-hover-scale:hover {
                transform: scale(1.04);
            }
        `;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = css;
        document.head.appendChild(style);
    }

    function initSettings() {
        if (!Lampa.SettingsApi) return;

        Lampa.SettingsApi.addComponent({
            component: 'card_badges_ua_menu',
            name: 'Налаштування карток',
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="3"></rect>
                    <line x1="7" y1="8" x2="13" y2="8"></line>
                    <line x1="7" y1="16" x2="17" y2="16"></line>
                   </svg>`
        });

        Lampa.SettingsApi.addParam({
            component: 'card_badges_ua_menu',
            param: {
                name: 'cb_ua_color_theme',
                type: 'select',
                values: THEME_OPTIONS,
                default: 'transparent'
            },
            field: {
                name: 'Колірна тема бейджів',
                description: 'Оберіть стиль забарвлення міток'
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'card_badges_ua_menu',
            param: {
                name: 'cb_ua_font_style',
                type: 'select',
                values: FONT_OPTIONS,
                default: 'sans'
            },
            field: {
                name: 'Стиль шрифту',
                description: 'Гарнітура тексту міток'
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'card_badges_ua_menu',
            param: {
                name: 'cb_ua_country_view',
                type: 'select',
                values: COUNTRY_DISPLAY_OPTIONS,
                default: 'text'
            },
            field: {
                name: 'Формат відображення країни',
                description: 'Показувати назву текстом чи прапором'
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'card_badges_ua_menu',
            param: {
                name: 'cb_ua_hover_scale',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Масштаб при наведенні',
                description: 'Збільшення картки при фокусі'
            }
        });

        CONFIG_ITEMS.forEach(item => {
            Lampa.SettingsApi.addParam({
                component: 'card_badges_ua_menu',
                param: {
                    name: 'cb_ua_pos_' + item.key,
                    type: 'select',
                    values: POSITION_OPTIONS,
                    default: item.def
                },
                field: {
                    name: item.title,
                    description: 'Оберіть місце виведення на картці'
                }
            });
        });
    }

    function createBadge(text) {
        if (!text) return '';
        const theme = getSetting('color_theme', 'transparent');
        const font = getSetting('font_style', 'sans');
        return `<span class="cb-ua-badge cb-theme-${theme} cb-font-${font}">${text}</span>`;
    }

    // Пошук якості через прямі дані та порівняння з кешем торрентів (Lampac / TorrServer / Jackett)
    function extractQuality(data) {
        if (!data) return '';
        
        // 1. Прямі поля
        if (data.quality) return data.quality;
        if (data.video_quality) return data.video_quality;
        if (data.max_quality) return data.max_quality;
        if (data.info && data.info.quality) return data.info.quality;
        if (data.card && data.card.quality) return data.card.quality;
        if (data.movie && data.movie.quality) return data.movie.quality;

        // 2. Пошук у сховищах торрентів або кеші Lampa за назвою
        const checkCollections = [
            data.sources, data.streams, data.torrents, data.files, 
            data.results, data.balancers, (data.balancer && data.balancer.results),
            window.torrents_cache, window.lampac_cache
        ];

        for (let collection of checkCollections) {
            if (Array.isArray(collection) && collection.length > 0) {
                for (let item of collection) {
                    if (!item) continue;
                    let textToCheck = (item.quality || item.name || item.title || item.file || item.text || '') + '';
                    let m = textToCheck.match(/(2160p|1080p|720p|4K|HDRip|WEB-DL|BDRip)/i);
                    if (m) {
                        let q = m[0].toUpperCase();
                        return q === '2160P' ? '4K' : q;
                    }
                }
            }
        }

        // 3. Звірка назви фільму з глобальним кешем активних переглядів/торрентів
        const cardTitle = (data.title || data.original_title || data.name || '').toLowerCase();
        if (cardTitle && window.Lampa && Lampa.Storage) {
            // Перевіряємо збережені дані останніх відкритих торрентів чи результатів пошуку
            let recentTorrents = Lampa.Storage.get('torrents_history') || Lampa.Storage.get('lampac_torrents') || [];
            if (Array.isArray(recentTorrents)) {
                for (let t of recentTorrents) {
                    let tTitle = (t.title || t.name || '').toLowerCase();
                    if (tTitle && (tTitle.includes(cardTitle) || cardTitle.includes(tTitle))) {
                        let tStr = (t.quality || t.name || '') + '';
                        let tm = tStr.match(/(2160p|1080p|720p|4K|HDRip|WEB-DL)/i);
                        if (tm) {
                            let q = tm[0].toUpperCase();
                            return q === '2160P' ? '4K' : q;
                        }
                    }
                }
            }
        }

        // 4. Глибоке сканування текстових полів картки
        const rawString = [
            data.title, data.original_title, data.name, 
            data.info_text, data.quality_text, 
            data.voice_name, data.translation,
            data.card_subtitle, data.overview
        ].filter(Boolean).join(' ');

        const match = rawString.match(/(2160p|1080p|720p|4K|HDRip|BDRip|WEB-DL|CAMRip)/i);
        if (match) {
            let q = match[0].toUpperCase();
            if (q === '2160P') q = '4K';
            return q;
        }

        return '';
    }

    function formatCountry(data) {
        let countries = [];
        if (Array.isArray(data.origin_country)) {
            countries = data.origin_country;
        } else if (Array.isArray(data.production_countries)) {
            countries = data.production_countries.map(c => c.iso_3166_1 || c.name);
        } else if (data.country) {
            countries = [data.country];
        }

        if (countries.length === 0) return '';
        const code = String(countries[0]).toUpperCase();
        const countryInfo = COUNTRIES_DATA[code];
        const viewMode = getSetting('country_view', 'text');

        if (!countryInfo) return code;

        return viewMode === 'flag' ? countryInfo.flag : countryInfo.name;
    }

    function renderCardBadges(cardElement) {
        if (!cardElement || cardElement.dataset.cbUaProcessed === 'true') return;

        let data = cardElement.card_data || $(cardElement).data('item');
        if (!data && window.jQuery) {
            data = $(cardElement).data('data');
        }
        if (!data) return;

        const view = cardElement.querySelector('.card__view') || cardElement.querySelector('.card__imgbox') || cardElement;
        if (!view) return;

        cardElement.dataset.cbUaProcessed = 'true';

        if (Lampa.Storage.get('cb_ua_hover_scale', true)) {
            cardElement.classList.add('cb-ua-hover-scale');
        }

        const isTv = Boolean(data.first_air_date || data.number_of_seasons || data.name || data.type === 'tv');

        const badgesMap = {
            type: (() => {
                const mode = getSetting('pos_type', 'top_left');
                if (mode === 'off') return null;
                return { pos: mode, html: createBadge(isTv ? 'Серіал' : 'Фільм') };
            })(),

            rating: (() => {
                const mode = getSetting('pos_rating', 'top_right');
                if (mode === 'off') return null;
                const vote = parseFloat(data.vote_average || (data.vote && data.vote.average) || 0);
                if (vote <= 0) return null;
                return { pos: mode, html: createBadge('★ ' + vote.toFixed(1)) };
            })(),

            quality: (() => {
                const mode = getSetting('pos_quality', 'bottom_left');
                if (mode === 'off') return null;
                const qualityText = extractQuality(data);
                if (!qualityText) return null;
                return { pos: mode, html: createBadge(qualityText) };
            })(),

            seasons: (() => {
                const mode = getSetting('pos_seasons', 'bottom_left');
                if (mode === 'off' || !isTv) return null;
                const seasonsCount = data.number_of_seasons || (data.seasons ? data.seasons.length : 0);
                if (!seasonsCount) return null;
                return { pos: mode, html: createBadge(`${seasonsCount} сез.`) };
            })(),

            next_ep: (() => {
                const mode = getSetting('pos_next_ep', 'off');
                if (mode === 'off' || !isTv || !data.next_episode_to_air || !data.next_episode_to_air.air_date) return null;
                const diffDays = Math.ceil((new Date(data.next_episode_to_air.air_date) - new Date()) / (1000 * 60 * 60 * 24));
                if (diffDays < 0) return null;
                const label = diffDays === 0 ? 'Сьогодні' : `Через ${diffDays} дн.`;
                return { pos: mode, html: createBadge(label) };
            })(),

            country: (() => {
                const mode = getSetting('pos_country', 'bottom_right');
                if (mode === 'off') return null;
                const countryText = formatCountry(data);
                if (!countryText) return null;
                return { pos: mode, html: createBadge(countryText) };
            })(),

            year: (() => {
                const mode = getSetting('pos_year', 'bottom_right');
                if (mode === 'off') return null;
                const year = (data.release_date || data.first_air_date || '').slice(0, 4);
                if (!year) return null;
                return { pos: mode, html: createBadge(year) };
            })()
        };

        const zones = {
            top_left: [],
            top_center: [],
            top_right: [],
            bottom_left: [],
            bottom_center: [],
            bottom_right: []
        };

        Object.values(badgesMap).forEach(item => {
            if (item && zones[item.pos]) {
                zones[item.pos].push(item.html);
            }
        });

        Object.keys(zones).forEach(posKey => {
            const items = zones[posKey];
            if (items.length > 0) {
                const zoneDiv = document.createElement('div');
                zoneDiv.className = `cb-ua-zone cb-ua-zone--${posKey}`;
                zoneDiv.innerHTML = items.join('');
                view.appendChild(zoneDiv);
            }
        });
    }

    function observeCards() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (!node || node.nodeType !== 1) return;
                    
                    if (node.classList && node.classList.contains('card')) {
                        renderCardBadges(node);
                    }
                    if (node.querySelectorAll) {
                        node.querySelectorAll('.card').forEach(card => renderCardBadges(card));
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
        document.querySelectorAll('.card').forEach(card => renderCardBadges(card));
    }

    function startPlugin() {
        injectStyles();
        initSettings();
        observeCards();
    }

    if (window.appready) {
        startPlugin();
    } else if (window.Lampa && Lampa.Listener) {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    } else {
        window.addEventListener('load', startPlugin);
    }
})();
