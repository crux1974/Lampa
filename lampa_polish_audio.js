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
            param: { name: PLUGIN + '_debug', type: 'trigger', default: false },
            field: { name: 'Діагностика', description: 'Показувати повідомлення про роботу прапора' }
        });

        Lampa.SettingsApi.addParam({
            component: PLUGIN,
            param: { name: PLUGIN + '_flag', type: 'trigger', default: true },
            field: {
                name: 'Прапор на обкладинці',
                description: 'Шукати торенти за назвою фільму й показувати прапор Польщі, якщо знайдено польську озвучку (потрібен налаштований парсер)'
            }
        });

        Lampa.SettingsApi.addParam({
            component: PLUGIN,
            param: { name: PLUGIN + '_badge', type: 'trigger', default: true },
            field: {
                name: 'Мітка PL у списку торентів',
                description: 'Показувати «PL», якщо в назві торента є польська озвучка'
            }
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
            param: { name: PLUGIN + '_external_url', type: 'input', values: '', placeholder: 'https://...', default: '' },
            field: {
                name: 'URL зовнішньої доріжки',
                description: 'Підтримується шаблон {title}, {year}, {id} (TMDB id), напр. http://host/pl/{id}.mp3'
            }
        });

        Lampa.SettingsApi.addParam({
            component: PLUGIN,
            param: { name: PLUGIN + '_offset', type: 'input', values: '', placeholder: '0', default: '0' },
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

    var FLAG_SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 10"><rect width="16" height="5" fill="#fff"/>' +
        '<rect y="5" width="16" height="5" fill="#dc143c"/></svg>');

    function dbg(text) {
        if (opt('debug', false)) notify('PL: ' + text);
        console.log(PLUGIN, text);
    }

    /* ---------- 3. Мітка PL у списку торентів ---------- */
    var SUB_REGEX = /napisy(\s*pl)?|(\bpl\s*)?\bsubs?\b(\s*pl)?|sub(titles?)?\s*pl|pl\s*sub(titles?)?|napisy/ig;
    // "Dubbing"/"Dub" без "PL" не рахуємо: це часто російська/українська студія (напр. Delta Dubbing)
    var AUDIO_REGEX = /(^|[^a-z0-9])(pl|pol|polish|polski|polska|lektor(\s*pl)?|(dubbing|dub|dubb?ing)[\s._-]*pl|pl[\s._-]*(dubbing|dub|dubb?ing|lektor)|pldub|plkino)([^a-z0-9]|$)|польськ|польск/i;

    function detectPolish(title) {
        title = String(title || '');
        if (!title) return null;
        var withoutSubs = title.replace(SUB_REGEX, ' ');
        if (AUDIO_REGEX.test(withoutSubs)) return 'audio';
        if (/(napisy|sub(titles?)?)\s*pl|pl\s*sub|napisy/i.test(title)) return 'sub';
        return null;
    }

    function injectCss() {
        if (document.getElementById('pl-audio-css')) return;
        var st = document.createElement('style');
        st.id = 'pl-audio-css';
        st.textContent =
            '.pl-audio-badge{display:inline-block;margin-right:.5em;padding:.05em .45em .05em 1.9em;border-radius:.3em;' +
            'font-size:.8em;font-weight:700;line-height:1.4;vertical-align:middle;color:#fff;background:#333 url("' + FLAG_SVG + '") .25em center/1.3em auto no-repeat}' +
            '.pl-audio-badge--sub{opacity:.7}';
        document.head.appendChild(st);
    }

    function markItem(item, title) {
        try {
            var el = item && item.jquery ? item[0] : item;
            if (!el || el.getAttribute('data-pl-checked')) return;
            var tEl = el.querySelector('.torrent-item__title') || el;
            title = title || tEl.textContent;
            el.setAttribute('data-pl-checked', '1');
            var kind = detectPolish(title);
            if (!kind) return;
            var b = document.createElement('span');
            b.className = 'pl-audio-badge' + (kind === 'sub' ? ' pl-audio-badge--sub' : '');
            b.textContent = kind === 'sub' ? 'PL sub' : 'PL';
            b.title = kind === 'sub' ? 'Польські субтитри' : 'Польська озвучка';
            tEl.insertBefore(b, tEl.firstChild);
        } catch (e) {}
    }

    function scanTorrents(root) {
        if (!opt('badge', true)) return;
        var nodes = (root || document).querySelectorAll('.torrent-item');
        for (var i = 0; i < nodes.length; i++) markItem(nodes[i]);
    }

    function hookTorrents() {
        injectCss();

        // Подія самої Lampa (якщо є у цій збірці)
        try {
            Lampa.Listener.follow('torrent', function (e) {
                if (e && e.type === 'render' && opt('badge', true)) {
                    var title = e.element && (e.element.title || e.element.Title);
                    markItem(e.item, title);
                }
            });
        } catch (e) {}

        // Запасний варіант: стежимо за DOM
        var timer = null;
        var obs = new MutationObserver(function () {
            if (timer) return;
            timer = setTimeout(function () { timer = null; scanTorrents(); }, 200);
        });
        obs.observe(document.body, { childList: true, subtree: true });
    }

    /* ---------- 4. Прапор Польщі на обкладинці картки ---------- */
    var CACHE_KEY = 'pl_audio_flag_cache';
    var CACHE_TTL = 24 * 3600 * 1000;

    function cacheGet(id) {
        try {
            var all = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
            var r = all[id];
            if (r && Date.now() - r.t < CACHE_TTL) return r.v;
        } catch (e) {}
        return null;
    }

    function cacheSet(id, v) {
        try {
            var all = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
            all[id] = { t: Date.now(), v: v };
            localStorage.setItem(CACHE_KEY, JSON.stringify(all));
        } catch (e) {}
    }

    function injectFlagCss() {
        if (document.getElementById('pl-flag-css')) return;
        var st = document.createElement('style');
        st.id = 'pl-flag-css';
        st.textContent =
            '.pl-flag{position:absolute;top:.6em;right:.6em;z-index:50;width:3em;height:1.9em;' +
            'border-radius:.25em;box-shadow:0 0 .5em rgba(0,0,0,.8);border:1px solid rgba(0,0,0,.4);' +
            'background:url("' + FLAG_SVG + '") center/cover no-repeat}';
        document.head.appendChild(st);
    }

    function addFlag(poster) {
        if (!poster || poster.querySelector('.pl-flag')) return;
        if (getComputedStyle(poster).position === 'static') poster.style.position = 'relative';
        var f = document.createElement('div');
        f.className = 'pl-flag';
        f.title = 'Є польська озвучка';
        poster.appendChild(f);
    }

    function hasPolishAudio(results) {
        for (var i = 0; i < (results || []).length; i++) {
            var r = results[i];
            if ((r.Seeders === undefined || r.Seeders > 0 || r.seeders > 0) &&
                detectPolish(r.Title || r.title) === 'audio') return true;
        }
        return false;
    }

    function searchParser(query, movie, done) {
        try {
            Lampa.Parser.get({ search: query, movie: movie, page: 1 }, function (json) {
                done(json && (json.Results || json.results) || []);
            }, function () { dbg('парсер не відповів'); done([]); });
        } catch (e) { dbg('парсер недоступний: ' + e.message); done([]); }
    }

    /* Польська назва з TMDB (language=pl) */
    function fetchPolishTitle(movie, done) {
        var type = movie.name || movie.original_name ? 'tv' : 'movie';
        var url;
        try {
            url = Lampa.TMDB.api(type + '/' + movie.id + '?api_key=' + Lampa.TMDB.key() + '&language=pl');
        } catch (e) { return done(''); }

        function finish(json) {
            var t = json && (json.title || json.name) || '';
            // TMDB повертає оригінал, якщо польського перекладу немає — це нам не потрібно
            var orig = movie.original_title || movie.original_name || '';
            done(t && t !== orig ? t : '');
        }

        try {
            new Lampa.Reguest().silent(url, finish, function () { done(''); });
        } catch (e) {
            try {
                fetch(url).then(function (r) { return r.json(); }).then(finish).catch(function () { done(''); });
            } catch (e2) { done(''); }
        }
    }

    function uniq(list) {
        var seen = {}, out = [];
        list.forEach(function (q) {
            q = String(q || '').replace(/\s+/g, ' ').trim();
            if (q && !seen[q.toLowerCase()]) { seen[q.toLowerCase()] = 1; out.push(q); }
        });
        return out;
    }

    function checkCard(movie, poster) {
        if (!movie || !poster || !opt('flag', true)) return;
        var key = movie.id + '_' + (movie.name ? 'tv' : 'movie');
        var cached = cacheGet(key);
        if (cached === true) return addFlag(poster);
        if (cached === false) { dbg('кеш: польської озвучки немає'); return; }

        var orig = movie.original_title || movie.original_name || '';
        var local = movie.title || movie.name || '';
        var year = (movie.release_date || movie.first_air_date || '').slice(0, 4);
        if (!orig && !local) return;

        fetchPolishTitle(movie, function (pl) {
            dbg('польська назва: ' + (pl || 'немає'));
            var queries = uniq([
                pl && (pl + ' ' + year),
                pl,
                pl && (pl + ' PL'),
                orig + ' ' + year,
                orig + ' PL',
                orig + ' lektor'
            ]);

            (function next(i) {
                if (i >= queries.length) { cacheSet(key, false); dbg('польську озвучку не знайдено'); return; }
                searchParser(queries[i], movie, function (results) {
                    dbg('запит «' + queries[i] + '»: торентів ' + results.length);
                    if (hasPolishAudio(results)) {
                        cacheSet(key, true);
                        addFlag(poster);
                    } else next(i + 1);
                });
            })(0);
        });
    }

    function hookCardFlag() {
        injectFlagCss();
        Lampa.Listener.follow('full', function (e) {
            if (e.type !== 'complite') return;
            try {
                var render = e.object.activity.render();
                var poster = render.find('.full-start-new__poster, .full-start__poster, .full-start__img, [class*="poster"]')[0];
                if (!poster) { dbg('обкладинку не знайдено'); return; }
                checkCard(e.data.movie, poster);
            } catch (err) { console.log(PLUGIN, 'flag error', err); }
        });
    }

    function start() {
        try {
            hookTorrents();
        } catch (e) {
            console.log(PLUGIN, 'torrent badge error', e);
        }
        try {
            hookCardFlag();
        } catch (e) {
            console.log(PLUGIN, 'card flag error', e);
        }
        try {
            initSettings();
        } catch (e) {
            console.log(PLUGIN, 'settings error', e);
            notify('PolishAudio settings: ' + (e && e.message));
        }
        try {
            hookPlayer();
        } catch (e) {
            console.log(PLUGIN, 'player error', e);
            notify('PolishAudio player: ' + (e && e.message));
        }
        console.log(PLUGIN, 'loaded');
    }

    if (window.appready) start();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();
