(function () {
    'use strict';

    if (window.plugin_card_badges_obsidian_ua) return;
    window.plugin_card_badges_obsidian_ua = true;

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
        obsidian: 'Obsidian (Темний мінімалізм)',
        color: 'Кольоровий (Акцентний)'
    };

    function getSetting(key, def) {
        return Lampa.Storage.get('cb_obs_' + key, def);
    }

    // Ін'єкція стилів
    function injectStyles() {
        const styleId = 'card-badges-obsidian-styles';
        if (document.getElementById(styleId)) return;

        const css = `
            .cb-obs-zone {
                position: absolute;
                display: flex;
                flex-wrap: wrap;
                gap: 0.25em;
                z-index: 5;
                pointer-events: none;
                max-width: 90%;
            }
            .cb-obs-zone--top_left { top: 0.4em; left: 0.4em; align-items: flex-start; justify-content: flex-start; }
            .cb-obs-zone--top_center { top: 0.4em; left: 50%; transform: translateX(-50%); align-items: center; justify-content: center; }
            .cb-obs-zone--top_right { top: 0.4em; right: 0.4em; align-items: flex-end; justify-content: flex-end; }
            .cb-obs-zone--bottom_left { bottom: 0.4em; left: 0.4em; align-items: flex-start; justify-content: flex-start; }
            .cb-obs-zone--bottom_center { bottom: 0.4em; left: 50%; transform: translateX(-50%); align-items: center; justify-content: center; }
            .cb-obs-zone--bottom_right { bottom: 0.4em; right: 0.4em; align-items: flex-end; justify-content: flex-end; }

            .cb-obs-badge {
                padding: 0.2em 0.5em;
                border-radius: 0.35em;
                font-size: 0.72em;
                font-weight: 500;
                line-height: 1.15;
                letter-spacing: 0.03em;
                white-space: nowrap;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
            }

            .cb-obs-badge--obsidian {
                background: rgba(26, 28, 32, 0.85);
                backdrop-filter: blur(6px);
                -webkit-backdrop-filter: blur(6px);
                color: #dcddde;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .cb-obs-badge--color.cb-type { background: rgba(53, 59, 72, 0.9); color: #70a1ff; border: 1px solid rgba(112, 161, 255, 0.2); }
            .cb-obs-badge--badge-rating { background: rgba(46, 204, 113, 0.25); color: #2ecc71; border: 1px solid rgba(46, 204, 113, 0.3); }
            .cb-obs-badge--badge-rating-low { background: rgba(231, 76, 60, 0.25); color: #e74c3c; border: 1px solid rgba(231, 76, 60, 0.3); }
            .cb-obs-badge--color.cb-quality { background: rgba(241, 196, 15, 0.25); color: #f1c40f; border: 1px solid rgba(241, 196, 15, 0.3); }
            .cb-obs-badge--color.cb-seasons { background: rgba(22, 160, 133, 0.25); color: #1abc9c; border: 1px solid rgba(22, 160, 133, 0.3); }
            .cb-obs-badge--color.cb-next-ep { background: rgba(211, 84, 0, 0.25); color: #e67e22; border: 1px solid rgba(211, 84, 0, 0.3); }
            .cb-obs-badge--color.cb-meta { background: rgba(127, 140, 141, 0.25); color: #bdc3c7; border: 1px solid rgba(127, 140, 141, 0.2); }

            .card.cb-obs-hover-scale {
                transition: transform 0.22s cubic-bezier(0.25, 0.8, 0.25, 1);
            }
            .card.cb-obs-hover-scale.focus,
            .card.cb-obs-hover-scale:hover {
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
            component: 'card_badges_obs',
            name: 'Оформлення карток (Obsidian)',
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="3"></rect>
                    <path d="M3 9h18"></path>
                    <path d="M9 21V9"></path>
                   </svg>`
        });

        Lampa.SettingsApi.addParam({
            component: 'card_badges_obs',
            param: {
                name: 'cb_obs_theme_style',
                type: 'select',
                values: STYLE_OPTIONS,
                default: 'obsidian'
            },
            field: {
                name: 'Візуальний стиль бейджів',
                description: 'Оберіть палітру в стилі Obsidian'
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'card_badges_obs',
            param: {
                name: 'cb_obs_hover_scale',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Масштаб картки при фокусі',
                description: 'Плавне збільшення картки при наведенні'
            }
        });

        CONFIG_ITEMS.forEach(item => {
            let defaultPos = 'top_left';
            if (item.key === 'rating') defaultPos = 'top_right';
            if (item.key === 'quality') defaultPos = 'bottom_left';
            if (item.key === 'year' || item.key === 'country') defaultPos = 'bottom_right';
            if (item.key === 'seasons') defaultPos = 'bottom_left';

            Lampa.SettingsApi.addParam({
                component: 'card_badges_obs',
                param: {
                    name: 'cb_obs_pos_' + item.key,
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
        const themeStyle = getSetting('theme_style', 'obsidian');
        const themeClass = themeStyle === 'color' ? `cb-obs-badge--color ${typeClass}` : 'cb-obs-badge--obsidian';
        return `<span class="cb-obs-badge ${themeClass}">${text}</span>`;
    }

    // Головна функція рендерингу бейджів на картку
    function renderCardBadges(cardElement) {
        if (!cardElement || cardElement.dataset.cbObsProcessed === 'true') return;

        // Шукаємо дані картки різними способами (jQuery / DOM properties / data-атрибути)
        let data = cardElement.card_data || $(cardElement).data('item');
        if (!data && window.jQuery) {
            data = $(cardElement).data('data');
        }
        if (!data) return; // Якщо даних ще немає — пропускаємо, дочекаємось наступного тику

        const view = cardElement.querySelector('.card__view') || cardElement.querySelector('.card__imgbox') || cardElement;
        if (!view) return;

        cardElement.dataset.cbObsProcessed = 'true';

        if (Lampa.Storage.get('cb_obs_hover_scale', true)) {
            cardElement.classList.add('cb-obs-hover-scale');
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
                const cls = vote >= 6.5 ? 'cb-obs-badge--badge-rating' : 'cb-obs-badge--badge-rating-low';
                return { pos: mode, html: createBadge('★ ' + vote.toFixed(1), cls) };
            })(),

            quality: (() => {
                const mode = getSetting('pos_quality', 'bottom_left');
                if (mode === 'off') return null;
                const quality = data.quality || data.video_quality || (data.info && data.info.quality) || data.max_quality || '';
                if (!quality) return null;
                return { pos: mode, html: createBadge(quality, 'cb-quality') };
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
                zoneDiv.className = `cb-obs-zone cb-obs-zone--${posKey}`;
                zoneDiv.innerHTML = items.join('');
                view.appendChild(zoneDiv);
            }
        });
    }

    // Спостерігач за DOM для нових карток
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

        // Також додатково проходимо по вже наявних картках на екрані
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
