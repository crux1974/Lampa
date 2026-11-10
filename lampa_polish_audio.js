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
