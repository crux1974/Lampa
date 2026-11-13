/*
 * Lampa Video Splash — відео-заставка запуску для Lampa
 * Програє lampa_horror_intro.mp4 на весь екран при старті застосунку.
 *
 * Підключення:
 *   1. Покладіть lampa_video_splash.js і lampa_horror_intro.mp4 в одну папку на хостингу.
 *   2. Lampa → Налаштування → Розширення → Додати плагін → URL до lampa_video_splash.js.
 *
 * Налаштування (необов'язково), задати до підключення плагіна:
 *   window.LAMPA_SPLASH = { video:'https://.../my.mp4', sound:true, skippable:true, maxSeconds:20 };
 *   video     — інший URL відео (за замовчуванням файл поруч із плагіном)
 *   sound     — зі звуком (якщо браузер не дозволяє автозвук, відео піде без звуку)
 *   skippable — пропуск будь-якою клавішею, кліком або дотиком
 *   maxSeconds— запобіжник: заставка зникне не пізніше ніж через стільки секунд
 */
(function () {
  'use strict';
  if (window.__lampa_video_splash__) return;
  window.__lampa_video_splash__ = true;

  var CFG = { video: '', sound: true, skippable: true, maxSeconds: 20, file: 'lampa_horror_intro.mp4' };
  var user = window.LAMPA_SPLASH;
  if (user) for (var k in user) if (user.hasOwnProperty(k)) CFG[k] = user[k];

  function baseUrl() {
    var src = '';
    try { if (document.currentScript && document.currentScript.src) src = document.currentScript.src; } catch (e) {}
    if (!src) {
      var list = document.getElementsByTagName('script');
      for (var i = list.length - 1; i >= 0; i--) {
        if (list[i].src && list[i].src.indexOf('lampa_video_splash') !== -1) { src = list[i].src; break; }
      }
    }
    return src ? src.replace(/[?#].*$/, '').replace(/[^\/]*$/, '') : '';
  }
  var VIDEO_URL = CFG.video || (baseUrl() + CFG.file);

  var box, vid, done = false, guard = 0;

  function finish(fast) {
    if (done) return;
    done = true;
    clearTimeout(guard);
    document.removeEventListener('keydown', onKey, true);
    function kill() {
      try { vid.pause(); vid.removeAttribute('src'); vid.load(); } catch (e) {}
      if (box && box.parentNode) box.parentNode.removeChild(box);
    }
    if (fast) { kill(); return; }
    try { box.style.transition = 'opacity .35s'; box.style.opacity = '0'; } catch (e) {}
    setTimeout(kill, 380);
  }
  function onKey(e) {
    if (!CFG.skippable) return;
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    finish(false);
  }
  function start() {
    if (!document.body) { document.addEventListener('DOMContentLoaded', start); return; }
    box = document.createElement('div');
    box.id = 'lampa-video-splash';
    box.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;background:#000;z-index:2147483647;opacity:1;';
    vid = document.createElement('video');
    vid.style.cssText = 'width:100%;height:100%;object-fit:contain;display:block;background:#000;';
    vid.setAttribute('playsinline', '');
    vid.setAttribute('webkit-playsinline', '');
    vid.preload = 'auto';
    vid.muted = !CFG.sound;
    vid.addEventListener('ended', function () { finish(false); });
    vid.addEventListener('error', function () { finish(true); });
    box.appendChild(vid);
    document.body.appendChild(box);
    if (CFG.skippable) {
      document.addEventListener('keydown', onKey, true);
      box.addEventListener('click', function () { finish(false); });
      box.addEventListener('touchstart', function () { finish(false); });
    }
    guard = setTimeout(function () { finish(false); }, CFG.maxSeconds * 1000);
    vid.src = VIDEO_URL;
    function go() {
      var p;
      try { p = vid.play(); } catch (e) { p = null; }
      if (p && p.catch) {
        p.catch(function () {
          // автозвук заборонено — пробуємо без звуку
          if (done) return;
          vid.muted = true;
          try {
            var p2 = vid.play();
            if (p2 && p2.catch) p2.catch(function () { finish(true); });
          } catch (e2) { finish(true); }
        });
      }
    }
    go();
  }

  window.LampaVideoSplash = { play: function () { if (!done && box) return; done = false; start(); }, skip: function () { finish(false); } };
  start();
})();
