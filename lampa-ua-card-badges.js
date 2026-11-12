(function () {
    'use strict';

    if (window.plugin_card_badges_ua) return;
    window.plugin_card_badges_ua = true;

    // Конфігурація всіх параметрів (як у відео)
    const CONFIG_ITEMS = [
        { key: 'seasons', title: 'Інформація про сезони', desc: 'Відображення кількості сезонів та серій' },
        { key: 'next_ep', title: 'Дата виходу серії', desc: 'Зворотний відлік днів до виходу наступного епізоду' },
        { key: 'type',    title: 'Тип контенту', desc: 'Мітка Фільм або Серіал' },
        { key: 'quality', title: 'Якість фільмів та серіалів', desc: 'Відображення якості (4K, FHD, SD тощо)' },
        { key: 'rating',  title: 'Рейтинг', desc: 'Оцінка контенту (TMDB)' },
        { key: 'country', title: 'Режим відображення країни', desc: 'Країна виробництва контенту' },
        { key: 'year',    title: 'Відображення року', desc: 'Рік виходу фільму чи серіалу' }
    ];

    const STYLE_OPTIONS = {
        off: 'Вимкнено',
        color: 'Кольоровий бейдж',
        transparent: 'Прозорий бейдж'
    };

    // Отримання значення налаштування
    function getSetting(key) {
        return Lampa.Storage.get('cb_ua_' + key, 'transparent');
    }

    // Додавання CSS-стилів для бейджів та карток
    function injectStyles() {
        const styleId = 'card-badges-ua-styles';
        if (document.getElementById(styleId)) return;

        const css = `
            .cb-ua-top-bar {
                position: absolute;
                top: 0.4em;
                left: 0.4em;
                right: 0.4em;
                display: flex;
                flex-wrap: wrap;
                gap: 0.25em;
                z-index: 5;
                pointer-events: none;
            }
            .cb-ua-bottom-bar {
                position: absolute;
                bottom: 0.4em;
                left: 0.4em;
                right: 0.4em;
                display: flex;
                flex-wrap: wrap;
                justify-content: space-between;
                align-items: flex-end;
                gap: 0.25em;
                z-index: 5;
                pointer-events: none;
            }
            .cb-ua-badge {
                padding: 0.2em 0.45em;
                border-radius: 0.3em;
                font-size: 0.75em;
                font-weight: 600;
                line-height: 1.1;
                letter-spacing: 0.02em;
                text-transform: uppercase;
                white-space: nowrap;
            }
            /* Прозорий стиль (як у відео) */
            .cb-ua-badge--transparent {
                background: rgba(15, 15, 20, 0.65);
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
                color: #ffffff;
                border: 1px solid rgba(255, 255, 255, 0.18);
            }
            /* Кольорові бейджі */
            .cb-ua-badge--color.cb-type-movie { background: #2b7de9; color: #fff; }
            .cb-ua-badge--color.cb-type-tv    { background: #8e44ad; color: #fff; }
            .cb-ua-badge--color.cb-rating     { background: #27ae60; color: #fff; }
            .cb-ua-badge--color.cb-rating-low { background: #c0392b; color: #fff; }
            .cb-ua-badge--color.cb-quality    { background: #e67e22; color: #fff; }
            .cb-ua-badge--color.cb-seasons    { background: #16a085; color: #fff; }
            .cb-ua-badge--color.cb-next-ep    { background: #d35400; color: #fff; }
            .cb-ua-badge--color.cb-country    { background: #34495e; color: #fff; }
            .cb-ua-badge--color.cb-year       { background: #7f8c8d; color: #fff; }

            /* Збільшення картки при наведенні */
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
        // Створюємо окремий компонент налаштувань "Налаштування карток"
        Lampa.SettingsApi.addComponent({
            component: 'card_badges_ua',
            name: 'Налаштування карток',
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="3"></rect>
                    <line x1="7" y1="8" x2="13" y2="8"></line>
                    <line x1="7" y1="16" x2="17" y2="16"></line>
                   </svg>`
        });

        // Швидкий перемикач для всіх бейджів одразу
        Lampa.SettingsApi.addParam({
            component: 'card_badges_ua',
            param: {
                name: 'cb_ua_master_preset',
                type: 'select',
                values: {
                    custom: 'Індивідуальне налаштування',
                    all_transparent: 'Увімкнути всі прозорі бейджі',
                    all_color: 'Увімкнути всі кольорові бейджі',
                    all_off: 'Вимкнути всі бейджі'
                },
                default: 'custom'
            },
            field: {
                name: 'Швидке налаштування всіх бейджів',
                description: 'Застосувати єдиний стиль до всіх елементів картки одразу'
            },
            onChange: function (value) {
                if (value === 'custom') return;
                const targetStyle = value.replace('all_', '');
                CONFIG_ITEMS.forEach(item => {
                    Lampa.Storage.set('cb_ua_' + item.key, targetStyle);
                });
                Lampa.Settings.update();
                Lampa.Noty.show('Стиль застосовано до всіх бейджів');
            }
        });

        // Окремий перемикач масштабу при наведенні
        Lampa.SettingsApi.addParam({
            component: 'card_badges_ua',
            param: {
                name: 'cb_ua_hover_scale',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Масштаб при наведенні',
                description: 'Плавне збільшення картки при фокусі'
            }
        });

        // Додаємо індивідуальні налаштування для кожного бейджа
        CONFIG_ITEMS.forEach(item => {
            Lampa.SettingsApi.addParam({
                component: 'card_badges_ua',
                param: {
                    name: 'cb_ua_' + item.key,
                    type: 'select',
                    values: STYLE_OPTIONS,
                    default: 'transparent'
                },
                field: {
                    name: item.title,
                    description: item.desc
                },
                onChange: function () {
                    Lampa.Storage.set('cb_ua_master_preset', 'custom');
                }
            });
        });
    }

    // Генерація HTML одного бейджа
    function createBadge(text, styleMode, extraClass) {
        if (!text || styleMode === 'off') return '';
        const modeClass = styleMode === 'color' ? 'cb-ua-badge--color' : 'cb-ua-badge--transparent';
        return `<span class="cb-ua-badge ${modeClass} ${extraClass}">${text}</span>`;
    }

    // Рендеринг бейджів на конкретній картці
    function renderCardBadges(cardElement, data) {
        if (!cardElement || !data) return;
        const view = cardElement.querySelector('.card__view');
        if (!view || view.dataset.cbUaProcessed) return;
        view.dataset.cbUaProcessed = 'true';

        if (Lampa.Storage.get('cb_ua_hover_scale', true)) {
            cardElement.classList.add('cb-ua-hover-scale');
        }

        const isTv = Boolean(data.first_air_date || data.number_of_seasons || data.name);
        let topBadges = '';
        let bottomLeftBadges = '';
        let bottomRightBadges = '';

        // 1. Тип контенту (Верхній бар)
        const typeMode = getSetting('type');
        if (typeMode !== 'off') {
            topBadges += createBadge(
                isTv ? 'Серіал' : 'Фільм',
                typeMode,
                isTv ? 'cb-type-tv' : 'cb-type-movie'
            );
        }

        // 2. Рейтинг (Верхній бар)
        const ratingMode = getSetting('rating');
        const vote = parseFloat(data.vote_average || 0);
        if (ratingMode !== 'off' && vote > 0) {
            topBadges += createBadge(
                '★ ' + vote.toFixed(1),
                ratingMode,
                vote >= 6.5 ? 'cb-rating' : 'cb-rating-low'
            );
        }

        // 3. Якість (Верхній бар)
        const qualityMode = getSetting('quality');
        if (qualityMode !== 'off' && data.quality) {
            topBadges += createBadge(data.quality, qualityMode, 'cb-quality');
        }

        // 4. Сезони (Нижній бар)
        const seasonsMode = getSetting('seasons');
        if (seasonsMode !== 'off' && isTv && data.number_of_seasons) {
            bottomLeftBadges += createBadge(`${data.number_of_seasons} сез.`, seasonsMode, 'cb-seasons');
        }

        // 5. Дата виходу наступної серії (Нижній бар)
        const nextEpMode = getSetting('next_ep');
        if (nextEpMode !== 'off' && isTv && data.next_episode_to_air && data.next_episode_to_air.air_date) {
            const diffDays = Math.ceil((new Date(data.next_episode_to_air.air_date) - new Date()) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0) {
                const label = diffDays === 0 ? 'Сьогодні' : `Через ${diffDays} дн.`;
                bottomLeftBadges += createBadge(label, nextEpMode, 'cb-next-ep');
            }
        }

        // 6. Країна (Нижній бар праворуч)
        const countryMode = getSetting('country');
        const countries = data.origin_country || (data.production_countries ? data.production_countries.map(c => c.iso_3166_1) : []);
        if (countryMode !== 'off' && countries.length > 0) {
            bottomRightBadges += createBadge(countries[0], countryMode, 'cb-country');
        }

        // 7. Рік виходу (Нижній бар праворуч)
        const yearMode = getSetting('year');
        const releaseDate = data.release_date || data.first_air_date || '';
        const year = releaseDate.slice(0, 4);
        if (yearMode !== 'off' && year) {
            bottomRightBadges += createBadge(year, yearMode, 'cb-year');
        }

        // Вставка контейнерів у картку (постер)
        if (topBadges) {
            const topDiv = document.createElement('div');
            topDiv.className = 'cb-ua-top-bar';
            topDiv.innerHTML = topBadges;
            view.appendChild(topDiv);
        }

        if (bottomLeftBadges || bottomRightBadges) {
            const bottomDiv = document.createElement('div');
            bottomDiv.className = 'cb-ua-bottom-bar';
            bottomDiv.innerHTML = `
                <div style="display:flex;gap:0.25em;flex-wrap:wrap;">${bottomLeftBadges}</div>
                <div style="display:flex;gap:0.25em;flex-wrap:wrap;">${bottomRightBadges}</div>
            `;
            view.appendChild(bottomDiv);
        }
    }

    // Відстеження створення карток у DOM
    function observeCards() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType !== 1) return;
                    const cards = node.classList && node.classList.contains('card')
                        ? [node]
                        : node.querySelectorAll ? node.querySelectorAll('.card') : [];

                    cards.forEach(card => {
                        const cardData = card.card_data || $(card).data('item');
                        if (cardData) renderCardBadges(card, cardData);
                    });
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Запуск плагіна після готовності Lampa
    function startPlugin() {
        injectStyles();
        initSettings();
        observeCards();
    }

    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    }
})();
