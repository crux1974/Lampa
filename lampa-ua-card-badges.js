/*
 * Українське оформлення бейджів карток Lampa
 * Налаштування: Lampa → Налаштування → Налаштування карток
 *
 * Плагін змінює лише вигляд наявних бейджів. Він не додає джерел відео
 * та не надсилає дані в інтернет.
 */
(function () {
    'use strict';

    var pluginKey = 'lampa_ua_card_badges_plugin';
    if (window[pluginKey]) return;
    window[pluginKey] = true;

    var choices = {
        hidden: 'Прихований',
        color: 'Кольоровий',
        transparent: 'Прозорий'
    };
    var initialized = false;

    var badges = [
        {
            id: 'type',
            title: 'Картки · Тип контенту',
            description: 'Позначка «Фільм», «Серіал» та інший тип.',
            selectors: ['.card__type', '.card__kind', '.card__content-type', '[data-card-badge="type"]']
        },
        {
            id: 'rating',
            title: 'Картки · Рейтинг',
            description: 'Оцінка фільму або серіалу.',
            selectors: ['.card__vote', '.card__rating', '[data-card-badge="rating"]']
        },
        {
            id: 'country',
            title: 'Картки · Країна',
            description: 'Прапор або назва країни, якщо їх додає картка чи інший плагін.',
            selectors: [
                '.card__country',
                '.card__countries',
                '.card__nation',
                '.card__origin',
                '[data-card-badge="country"]'
            ]
        },
        {
            id: 'seasons',
            title: 'Картки · Сезони та серії',
            description: 'Кількість сезонів або серій, якщо ці дані є на картці.',
            selectors: [
                '.card__season',
                '.card__seasons',
                '.card__season-count',
                '.card__episode',
                '.card__episodes',
                '[data-card-badge="seasons"]'
            ]
        },
        {
            id: 'episode_days',
            title: 'Картки · До нової серії',
            description: 'Позначка про дату або кількість днів до наступної серії.',
            selectors: [
                '.card__new-episode',
                '.card__next-episode',
                '.card__episode-date',
                '.card__release-countdown',
                '[data-card-badge="episode-days"]'
            ]
        },
        {
            id: 'quality',
            title: 'Картки · Якість',
            description: 'Позначки на кшталт 4K, UHD або HD.',
            selectors: ['.card__quality', '[data-card-badge="quality"]']
        },
        {
            id: 'year',
            title: 'Картки · Рік',
            description: 'Рік виходу фільму або серіалу.',
            selectors: [
                '.card__year',
                '.card__release-year',
                '.card__release_year',
                '[data-card-badge="year"]'
            ]
        }
    ];

    function getMode(badge) {
        var value = window.Lampa.Storage.field('lampa_ua_card_badge_' + badge.id);
        return Object.prototype.hasOwnProperty.call(choices, value) ? value : 'color';
    }

    function applySettings() {
        var root = document.documentElement;
        if (!root) return;

        badges.forEach(function (badge) {
            root.setAttribute('data-lampa-ua-badge-' + badge.id, getMode(badge));
        });
    }

    function makeStyles() {
        var rules = [];

        badges.forEach(function (badge) {
            var hiddenSelectors = badge.selectors.map(function (selector) {
                return 'html[data-lampa-ua-badge-' + badge.id + '="hidden"] .card ' + selector;
            });
            var transparentSelectors = badge.selectors.map(function (selector) {
                return 'html[data-lampa-ua-badge-' + badge.id + '="transparent"] .card ' + selector;
            });

            rules.push(
                hiddenSelectors.join(',\n') +
                '{display:none!important;}'
            );
            rules.push(
                transparentSelectors.join(',\n') +
                '{background-color:rgba(14,18,24,.62)!important;' +
                'color:#fff!important;' +
                'border:1px solid rgba(255,255,255,.28)!important;' +
                'border-radius:.38em!important;' +
                'box-shadow:none!important;' +
                'backdrop-filter:blur(6px);' +
                '-webkit-backdrop-filter:blur(6px);}'
            );
        });

        return rules.join('\n');
    }

    function showCompatibilityMessage() {
        if (window.Lampa && Lampa.Noty && typeof Lampa.Noty.show === 'function') {
            Lampa.Noty.show('Ця версія Lampa не підтримує налаштування плагінів.');
        }
    }

    function init() {
        if (initialized) return;

        if (!window.Lampa || !Lampa.SettingsApi ||
            typeof Lampa.SettingsApi.addParam !== 'function' ||
            typeof Lampa.SettingsApi.addComponent !== 'function' ||
            !Lampa.Storage || typeof Lampa.Storage.field !== 'function') {
            showCompatibilityMessage();
            return;
        }
        initialized = true;

        Lampa.SettingsApi.addComponent({
            component: 'lampa_ua_cards',
            name: 'Налаштування карток',
            icon: '<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="5" width="28" height="34" rx="3" stroke="currentColor" stroke-width="2"/><path d="M14 14h16M14 21h16M14 28h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
            after: 'interface'
        });

        if (!document.getElementById('lampa-ua-card-badges-styles')) {
            var style = document.createElement('style');
            style.id = 'lampa-ua-card-badges-styles';
            style.textContent = makeStyles();
            (document.head || document.documentElement).appendChild(style);
        }

        badges.forEach(function (badge) {
            Lampa.SettingsApi.addParam({
                component: 'lampa_ua_cards',
                param: {
                    name: 'lampa_ua_card_badge_' + badge.id,
                    type: 'select',
                    values: choices,
                    default: 'color'
                },
                field: {
                    name: badge.title,
                    description: badge.description
                },
                onChange: applySettings
            });
        });

        applySettings();
    }

    if (window.appready) {
        init();
    } else if (window.Lampa && Lampa.Listener && typeof Lampa.Listener.follow === 'function') {
        Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') init();
        });
    } else {
        showCompatibilityMessage();
    }
})();
