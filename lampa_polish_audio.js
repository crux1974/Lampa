/*
 * Polish Audio for Lampa
 * ----------------------
 * 1) Автоматично вибирає польську аудіодоріжку, вбудовану у відео/торент (TorrServer).
 * 2) Опційно: підключає ЗОВНІШНЮ польську доріжку (URL на mp3/aac/m4a/webm), 
 *    синхронізуючи її з відео, а оригінальний звук приглушуючи.
 *
 * Підключення: Налаштування -> Розширення -> додати плагін за URL цього файлу.
 *
 * ВАЖЛИВО: працює у вбудованому HTML5-плеєрі Lampa (веб, Tizen, WebOS, браузер).
 * Зовнішні плеєри (Android: MX/VLC/внутрішній ExoPlayer) контролюються самим плеєром —
 * плагін на них не впливає.
 */
(function () {
    'use strict';

    if (window.plugin_polish_audio_ready) return;
    window.plugin_polish_audio_ready = true;

    var PLUGIN = 'polish_audio';
    var PL_REGEX = /(^|[^a-z])(pl|pol|polish|polski|polska|lektor|pl-pl)([^a-z]|$)|польськ|polski|polish/i;

    var ext = { audio: null, video: null, handlers: [], timer: null };

    /* ---------- Налаштування ---------- */
    function initSettings() {
        Lampa.SettingsApi.addComponent({
            component: PLUGIN,
            name: 'Польська доріжка',
            icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>'
        });

        Lampa.SettingsApi.addParam({
            component: PLUGIN,
            param: { name: PLUGIN + '_auto', type: 'trigger', default: true },
            field: {
                name: 'Автовибір польської доріжки',
                description: 'Вмикати польську доріжку, якщо вона є у файлі'
            }
        });

        Lampa.SettingsApi.addParam({
            component: PLUGIN,
            param: { name: PLUGIN + '_external_on', type: 'trigger', default: false },
            field: {
                name: 'Використовувати зовнішню доріжку',
                description: 'Підключати окремий аудіофайл і синхронізувати з відео'
            }
        });

        Lampa.SettingsApi.addParam({
            component: PLUGIN,
            param: { name: PLUGIN + '_external_url', type: 'input', default: '' },
            field: {
                name: 'URL зовнішньої доріжки',
                description: 'Підтримується шаблон {title}, {year}, {id} (TMDB id), напр. http://host/pl/{id}.mp3'
            }
        });

        Lampa.SettingsApi.addParam({
            component: PLUGIN,
            param: { name: PLUGIN + '_offset', type: 'input', default: '0' },
            field: {
                name: 'Зсув синхронізації (сек)',
                description: 'Додатне значення — звук іде пізніше, від’ємне — раніше'
            }
        });
    }

    function opt(name, def) {
        return Lampa.Storage.field(PLUGIN + '_' + name) !== undefined
            ? Lampa.Storage.field(PLUGIN + '_' + name) : def;
    }

    /* ---------- Утиліти ---------- */
    function getVideoEl() {
        return document.querySelector('.player video') || document.querySelector('video');
    }

    function notify(text) {
        try { Lampa.Noty.show(text); } catch (e) {}
    }

    function isPolish(track) {
        var s = [track.language, track.lang, track.label, track.name, track.title]
            .filter(Boolean).join(' ');
        return PL_REGEX.test(s);
    }

    /* ---------- 1. Автовибір вбудованої доріжки ---------- */
    function selectEmbeddedPolish(tracksList) {
        var list = [];
        try {
            if (tracksList && tracksList.length !== undefined) {
                for (var i = 0; i < tracksList.length; i++) list.push(tracksList[i]);
            }
        } catch (e) {}

        var polish = list.filter(isPolish)[0];
        if (!polish) return false;

        try {
            // HTML5 audioTracks: вмикаємо польську, решту вимикаємо
            var video = getVideoEl();
            if (video && video.audioTracks && video.audioTracks.length) {
                for (var j = 0; j < video.audioTracks.length; j++) {
                    var t = video.audioTracks[j];
                    t.enabled = isPolish(t);
                }
            } else {
                list.forEach(function (t) { t.enabled = (t === polish); t.selected = (t === polish); });
            }
            notify('Польську аудіодоріжку увімкнено');
            return true;
        } catch (e) {
            console.log(PLUGIN, 'select error', e);
            return false;
        }
    }

    /* ---------- 2. Зовнішня доріжка ---------- */
    function buildUrl() {
        var tpl = String(opt('external_url', '') || '').trim();
        if (!tpl) return '';
        var card = {};
        try { card = Lampa.Activity.active().movie || {}; } catch (e) {}
        var title = card.title || card.name || card.original_title || card.original_name || '';
        var year = (card.release_date || card.first_air_date || '').slice(0, 4);
        return tpl
            .replace('{title}', encodeURIComponent(title))
            .replace('{year}', year)
            .replace('{id}', card.id || '');
    }

    function bind(target, event, fn) {
        target.addEventListener(event, fn);
        ext.handlers.push({ target: target, event: event, fn: fn });
    }

    function stopExternal() {
        ext.handlers.forEach(function (h) { h.target.removeEventListener(h.event, h.fn); });
        ext.handlers = [];
        if (ext.timer) { clearInterval(ext.timer); ext.timer = null; }
        if (ext.audio) {
            try { ext.audio.pause(); ext.audio.removeAttribute('src'); ext.audio.load(); } catch (e) {}
            ext.audio = null;
        }
        if (ext.video) { try { ext.video.muted = false; } catch (e) {} ext.video = null; }
    }

    function startExternal() {
        stopExternal();
        var url = buildUrl();
        var video = getVideoEl();
        if (!url || !video) return;

        var offset = parseFloat(opt('offset', '0')) || 0;
        var audio = new Audio();
        audio.preload = 'auto';
        audio.src = url;
        audio.crossOrigin = 'anonymous';
        ext.audio = audio;
        ext.video = video;

        function targetTime() { return Math.max(0, video.currentTime + offset); }
        function sync(force) {
            if (!ext.audio) return;
            var diff = Math.abs(audio.currentTime - targetTime());
            if (force || diff > 0.35) {
                try { audio.currentTime = targetTime(); } catch (e) {}
            }
        }

        audio.addEventListener('error', function () {
            notify('Не вдалося завантажити польську доріжку');
            try { video.muted = false; } catch (e) {}
        });

        audio.addEventListener('canplay', function () {
            video.muted = true;               // приглушуємо оригінал лише коли зовнішня доріжка готова
            audio.volume = video.volume;
            sync(true);
            if (!video.paused) audio.play().catch(function () {});
            notify('Зовнішню польську доріжку підключено');
        }, { once: true });

        bind(video, 'play',        function () { sync(true); audio.play().catch(function () {}); });
        bind(video, 'playing',     function () { sync(true); audio.play().catch(function () {}); });
        bind(video, 'pause',       function () { audio.pause(); });
        bind(video, 'waiting',     function () { audio.pause(); });
        bind(video, 'seeking',     function () { sync(true); });
        bind(video, 'seeked',      function () { sync(true); if (!video.paused) audio.play().catch(function () {}); });
        bind(video, 'ratechange',  function () { audio.playbackRate = video.playbackRate; });
        bind(video, 'volumechange', function () {
            // тримаємо відео приглушеним, а гучність переносимо на зовнішню доріжку
            if (!video.muted && audio.readyState > 0) video.muted = true;
            audio.volume = video.volume;
        });
        bind(video, 'ended',       function () { audio.pause(); });

        ext.timer = setInterval(function () {
            if (!video.paused && !video.seeking) sync(false);
        }, 1500);
    }

    /* ---------- Підписка на події плеєра ---------- */
    function hookPlayer() {
        // Вбудовані доріжки приходять подією 'tracks'
        try {
            Lampa.PlayerVideo.listener.follow('tracks', function (e) {
                if (opt('auto', true)) selectEmbeddedPolish(e.tracks);
            });
        } catch (e) { console.log(PLUGIN, 'tracks hook failed', e); }

        // Старт відео -> зовнішня доріжка
        try {
            Lampa.PlayerVideo.listener.follow('canplay', function () {
                if (opt('external_on', false)) startExternal();
            });
        } catch (e) {}

        // Закриття плеєра -> прибираємо
        try {
            Lampa.Player.listener.follow('destroy', stopExternal);
        } catch (e) {}
    }

    function start() {
        initSettings();
        hookPlayer();
        console.log(PLUGIN, 'loaded');
    }

    if (window.appready) start();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();

