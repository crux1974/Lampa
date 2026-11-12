(function () {
    'use strict';

    if (window.plugin_card_badges_ua) return;
    window.plugin_card_badges_ua = true;

    const CONFIG_ITEMS = [
        { key: 'type',    title: 'Тип контенту', desc: 'Мітка Фільм або Серіал' },
        { key: 'rating',  title: 'Рейтинг', desc: 'Оцінка контенту (TMDB)' },
        { key: 'quality', title: 'Якість', desc: 'Відображення якості (4K, FHD, SD тощо)' },
        { key: 'seasons', title: 'Інформація про сезони', desc: 'Відображення кількості сезонів та серій' },
        { key: 'next_ep', title: 'Дата виходу серії', desc: 'Зворотний відлік днів до виходу наступного епізоду' },
        { key: 'country', title: 'Країна', desc: 'Країна виробництва контенту' },
        { key: 'year',    title: 'Рік виходу', desc: 'Рік виходу фільму чи серіалу' }
    ];

    const POSITION_OPTIONS = {
        off: 'Вимкнено',
        top_left: 'Вгорі зліва',
        top_center: 'Вгорі по центру',
        top_right: 'Вгорі справа',
        bottom_left: 'Внизу зліва',
        bottom_center: 'Внизу по центру',
        bottom_right: 'Внизу справа'
    };

    const STYLE_OPTIONS = {
        transparent: 'Прозорі бейджі (Мінімалізм)',
        color: 'Кольорові бейджі (Класика)'
    };

    function getSetting(key, def) {
        return Lampa.Storage.get('cb_ua_' + key, def);
    }

    // Ін'єкція стандартних стилів (без Obsidian)
    function injectStyles() {
        const styleId = 'card-badges-ua-styles';
        if (document.getElementById(styleId)) return;

        const css = `
            .cb-ua-zone {
                position: absolute;
                display: flex;
                flex-wrap: wrap;
                gap: 0.25em;
                z-index: 5;
                pointer-events: none;
                max-width: 90%;
            }
            .cb-ua-zone--top_left { top: 0.4em; left: 0.4em; align-items: flex-start; justify-content: flex-start; }
            .cb-ua-zone--top_center { top: 0.4em; left: 50%; transform: translateX(-50%); align-items: center; justify-content: center; }
            .cb-ua-zone--top_right { top: 0.4em; right: 0.4em; align-items: flex-end; justify-content: flex-end; }
            .cb-ua-zone--bottom_left { bottom: 0.4em; left: 0.4em; align-items: flex-start; justify-content: flex-start; }
            .cb-ua-zone--bottom_center { bottom: 0.4em; left: 50%; transform: translateX(-50%); align-items: center; justify-content: center; }
            .cb-ua-zone--bottom_right { bottom: 0.4em; right: 0.4em; align-items: flex-end; justify-content: flex-end; }

            .cb-ua-badge {
                padding: 0.2em 0.45em;
                border-radius: 0.3em;
                font-size: 0.73em;
                font-weight: 600;
                line-height: 1.1;
                letter-spacing: 0.02em;
                text-transform: uppercase;
                white-space: nowrap;
            }

            /* Прозорий стиль */
            .cb-ua-badge--transparent {
                background: rgba(15, 15, 20, 0.7);
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
                color: #ffffff;
                border: 1px solid rgba(255, 255, 255, 0.15);
            }

            /* Кольоровий стиль */
            .cb-ua-badge--color.cb-type { background: #2b7de9; color: #fff; }
            .cb-ua-badge--color.cb-rating { background: #27ae60; color: #fff; }
            .cb-ua-badge--color.cb-rating-low { background: #c0392b; color: #fff; }
            .cb-ua-badge--color.cb-quality { background: #e67e22; color: #fff; }
            .cb-ua-badge--color.cb-seasons { background: #16a085; color: #fff; }
            .cb-ua-badge--color.cb-next-ep { background: #d35400; color: #fff; }
            .cb-ua-badge--color.cb-meta { background: #7f8c8d; color: #fff; }

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

    // Реєстрація меню налаштувань
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
                name: 'cb_ua_theme_style',
                type: 'select',
                values: STYLE_OPTIONS,
                default: 'transparent'
            },
            field: {
                name: 'Стиль бейджів',
                description: 'Оберіть прозорі або кольорові мітки'
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
            let defaultPos = 'top_left';
            if (item.key === 'rating') defaultPos = 'top_right';
            if (item.key === 'quality') defaultPos = 'bottom_left';
            if (item.key === 'year' || item.key === 'country') defaultPos = 'bottom_right';
            if (item.key === 'seasons') defaultPos = 'bottom_left';

            Lampa.SettingsApi.addParam({
                component: 'card_badges_ua_menu',
                param: {
                    name: 'cb_ua_pos_' + item.key,
                    type: 'select',
                    values: POSITION_OPTIONS,
                    default: defaultPos
                },
                field: {
                    name: item.title + ' — Позиція',
                    description: item.desc
                }
            });
        });
    }

    function createBadge(text, typeClass) {
        if (!text) return '';
        const themeStyle = getSetting('theme_style', 'transparent');
        const themeClass = themeStyle === 'color' ? `cb-ua-badge--color ${typeClass}` : 'cb-ua-badge--transparent';
        return `<span class="cb-ua-badge ${themeClass}">${text}</span>`;
    }

    // Розширена функція пошуку якості у всіх можливих полях картки
    function extractQuality(data) {
        if (!data) return '';
        
        // 1. Перевірка стандартних прямих полів
        if (data.quality) return data.quality;
        if (data.video_quality) return data.video_quality;
        if (data.max_quality) return data.max_quality;

        // 2. Перевірка вкладених об'єктів (info, details тощо)
        if (data.info) {
            if (data.info.quality) return data.info.quality;
            if (data.info.video_quality) return data.info.video_quality;
        }

        // 3. Пошук у масивах торрентів або джерел (якщо передано)
        if (Array.isArray(data.sources) && data.sources.length > 0) {
            for (let src of data.sources) {
                if (src.quality) return src.quality;
            }
        }

        // 4. Пошук індикатора якості в назві або перекладів (якщо плагін парсить з назви)
        const rawString = (data.title || '') + ' ' + (data.original_title || '') + ' ' + (data.info_text || '');
        const qualityMatch = rawString.match(/(4K|2160p|1080p|720p|HDRip|BDRip|WEB-DL)/i);
        if (qualityMatch) {
            return qualityMatch[0].toUpperCase();
        }

        return '';
    }

    // Рендеринг бейджів
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
                return { pos: mode, html: createBadge(isTv ? 'Серіал' : 'Фільм', 'cb-type') };
            })(),

            rating: (() => {
                const mode = getSetting('pos_rating', 'top_right');
                if (mode === 'off') return null;
                const vote = parseFloat(data.vote_average || (data.vote && data.vote.average) || 0);
                if (vote <= 0) return null;
                const cls = vote >= 6.5 ? 'cb-ua-badge--badge-rating' : 'cb-ua-badge--badge-rating-low';
                return { pos: mode, html: createBadge('★ ' + vote.toFixed(1), cls) };
            })(),

            quality: (() => {
                const mode = getSetting('pos_quality', 'bottom_left');
                if (mode === 'off') return null;
                const qualityText = extractQuality(data);
                if (!qualityText) return null;
                return { pos: mode, html: createBadge(qualityText, 'cb-quality') };
            })(),

            seasons: (() => {
                const mode = getSetting('pos_seasons', 'bottom_left');
                if (mode === 'off' || !isTv) return null;
                const seasonsCount = data.number_of_seasons || (data.seasons ? data.seasons.length : 0);
                if (!seasonsCount) return null;
                return { pos: mode, html: createBadge(`${seasonsCount} сез.`, 'cb-seasons') };
            })(),

            next_ep: (() => {
                const mode = getSetting('pos_next_ep', 'off');
                if (mode === 'off' || !isTv || !data.next_episode_to_air || !data.next_episode_to_air.air_date) return null;
                const diffDays = Math.ceil((new Date(data.next_episode_to_air.air_date) - new Date()) / (1000 * 60 * 60 * 24));
                if (diffDays < 0) return null;
                const label = diffDays === 0 ? 'Сьогодні' : `Через ${diffDays} дн.`;
                return { pos: mode, html: createBadge(label, 'cb-next-ep') };
            })(),

            country: (() => {
                const mode = getSetting('pos_country', 'off');
                if (mode === 'off') return null;
                const countries = data.origin_country || (data.production_countries ? data.production_countries.map(c => c.iso_3166_1) : []);
                if (countries.length === 0) return null;
                return { pos: mode, html: createBadge(countries[0], 'cb-meta') };
            })(),

            year: (() => {
                const mode = getSetting('pos_year', 'bottom_right');
                if (mode === 'off') return null;
                const year = (data.release_date || data.first_air_date || '').slice(0, 4);
                if (!year) return null;
                return { pos: mode, html: createBadge(year, 'cb-meta') };
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
