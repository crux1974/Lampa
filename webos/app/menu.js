/*
 * Alcopac UA — меню адрес сервера.
 * Довге натискання «Назад» (понад 1 с) відкриває список адрес:
 * вибрати, додати, змінити, видалити. Коротке натискання — звичайне «Назад» у Lampa.
 */
(function () {
  'use strict';

  var KEY = 'mylampa_url2';
  var LIST = 'mylampa_list';
  // Режим «напряму»: сторінка з сервера, дані застосунку передані через window.name
  var NAMED = null;
  try { NAMED = JSON.parse(window.name || 'null'); } catch (e) {}
  var DIRECT = !!(NAMED && NAMED.alco && /^https?:/i.test(window.location.protocol));
  if (DIRECT) {
    window.ALCO_START = window.ALCO_START || NAMED.start;
    window.ALCO_DEFAULT_URL = window.ALCO_DEFAULT_URL || NAMED.def;
    try {
      if (NAMED.cur) window.localStorage.setItem(KEY, NAMED.cur);
      // список адрес: об'єднуємо те, що прийшло від застосунку, з тим, що вже збережено тут, — нічого не губимо
      var mine = []; try { mine = JSON.parse(window.localStorage.getItem(LIST) || '[]') || []; } catch (e) { mine = []; }
      var merged = [];
      [].concat(NAMED.list || [], mine, NAMED.cur ? [NAMED.cur] : [], [location.origin]).forEach(function (u) {
        u = String(u || '').replace(/\/+$/, '');
        if (u && /^https?:\/\//i.test(u) && merged.indexOf(u) < 0) merged.push(u);
      });
      var gone = []; try { gone = JSON.parse(window.localStorage.getItem('alco_removed') || '[]') || []; } catch (e) { gone = []; }
      (NAMED.removed || []).forEach(function (u) { if (gone.indexOf(u) < 0) gone.push(u); });
      window.localStorage.setItem('alco_removed', JSON.stringify(gone));
      NAMED.removed = gone;
      merged = merged.filter(function (u) { return gone.indexOf(u) < 0 || u === location.origin || u === String(NAMED.cur || '').replace(/\/+$/, ''); });
      window.localStorage.setItem(LIST, JSON.stringify(merged));
      NAMED.list = merged;
      window.name = JSON.stringify(NAMED);
    } catch (e) {}
  }
  var DEFAULT_URL = window.ALCO_DEFAULT_URL || 'http://92-5-178-165.sslip.io';
  var LONG_MS = 1000;
  var BACK = { 461: 1, 8: 1, 27: 1 };

  function ls(k, v) {
    try {
      if (arguments.length > 1) window.localStorage.setItem(k, v);
      return window.localStorage.getItem(k);
    } catch (e) { return null; }
  }

  function norm(u) {
    u = (u || '').replace(/^\s+|\s+$/g, '').replace(/\/+$/, '');
    if (!u) return '';
    if (!/^https?:\/\//i.test(u)) u = 'http://' + u;
    return /^https?:\/\/[^\s\/?#]+/i.test(u) ? u : '';
  }

  function current() { return norm(ls(KEY)) || DEFAULT_URL; }

  function list() {
    var l = [];
    try { l = JSON.parse(ls(LIST) || '[]'); } catch (e) {}
    if (!(l instanceof Array)) l = [];
    var c = current();
    if (l.indexOf(c) < 0) l.unshift(c);
    return l;
  }

  function saveList(l) { ls(LIST, JSON.stringify(l)); }

  function short(u) { return u.replace(/^https?:\/\//i, ''); }

  function restart() {
    var start = window.ALCO_START || (window.location.href.split('#')[0]);
    if (DIRECT) {
      // повертаємось у застосунок, щоб він запам'ятав нову адресу; якщо телевізор не пустить — відкриваємо її напряму
      var nu = current();
      try { NAMED.cur = nu; NAMED.list = list(); window.name = JSON.stringify(NAMED); } catch (e) {}
      setTimeout(function () { try { window.location.replace(nu); } catch (e) {} }, 1500);
      try { window.location.replace(start + '?srv=' + encodeURIComponent(nu)); } catch (e) {}
      return;
    }
    try { window.location.replace(start); } catch (e) { window.location.reload(); }
  }

  function switchTo(u) {
    u = norm(u);
    if (!u) return;
    var l = list();
    if (l.indexOf(u) < 0) l.push(u);
    saveList(l);
    ls(KEY, u);
    try { var g2 = JSON.parse(ls('alco_removed') || '[]') || []; g2 = g2.filter(function (x) { return x !== u; }); ls('alco_removed', JSON.stringify(g2)); if (DIRECT && NAMED) { NAMED.removed = g2; NAMED.list = l; } } catch (e) {}
    // застосунок на телевізорі не завжди запам'ятовує нову адресу (з http-сторінки його пам'ять недоступна),
    // тож запам'ятовуємо вибір і тут: наступного запуску ця адреса сама перекине на вибрану
    if (DIRECT) {
      try { if (u.replace(/\/+$/, '') !== location.origin) localStorage.setItem('alco_prefer', u); else localStorage.removeItem('alco_prefer'); } catch (e) {}
      try { NAMED.chosen = u; } catch (e) {}
    }
    restart();
  }

  /* ---------------- вигляд ---------------- */

  var css = '' +
    '#alco-menu{position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483647;background:rgba(5,8,14,.88);font-family:Arial,Helvetica,sans-serif;color:#e8eaf0}' +
    '#alco-menu .am-box{position:absolute;left:50%;top:50%;width:1000px;margin-left:-500px;-webkit-transform:translateY(-50%);transform:translateY(-50%);background:#151a26;border-radius:24px;padding:40px 50px;box-shadow:0 20px 80px rgba(0,0,0,.6)}' +
    '#alco-menu h2{margin:0 0 6px;font-size:44px}#alco-menu h2 b{color:#FFD700}' +
    '#alco-menu .am-hint{font-size:24px;color:#8a92a6;margin-bottom:28px}' +
    '#alco-menu .am-row{display:-webkit-box;display:flex;margin:10px 0}' +
    '#alco-menu .am-btn{padding:18px 26px;font-size:30px;border-radius:14px;background:#1f2638;border:4px solid #1f2638;margin-right:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#alco-menu .am-main{-webkit-box-flex:1;flex:1}' +
    '#alco-menu .am-btn.am-f{border-color:#FFD700;background:#2a3350}' +
    '#alco-menu .am-cur{color:#FFD700}' +
    '#alco-menu .am-sub{font-size:22px;color:#8a92a6;margin-left:12px}' +
    '#alco-menu input{width:100%;box-sizing:border-box;font-size:34px;padding:18px 22px;border-radius:12px;border:4px solid #0057B7;background:#0d111b;color:#fff;margin:6px 0 18px}' +
    '#alco-menu input.am-f{border-color:#FFD700}';

  var root = null, grid = [], fy = 0, fx = 0, mode = 'list', editing = null;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function build() {
    if (!document.getElementById('alco-menu-css')) {
      var st = document.createElement('style');
      st.id = 'alco-menu-css';
      st.textContent = css;
      (document.head || document.documentElement).appendChild(st);
    }
    if (root) root.parentNode && root.parentNode.removeChild(root);
    root = el('div');
    root.id = 'alco-menu';
    var box = el('div', 'am-box');
    root.appendChild(box);
    var h = el('h2');
    h.innerHTML = 'Адреса <b>Alcopac UA</b>';
    box.appendChild(h);
    grid = [];

    if (mode === 'list') {
      box.appendChild(el('div', 'am-hint', '◀ ▶ — змінити або видалити · OK — відкрити · Назад — закрити · відкрити: утримати ◀'));
      var cur = current();
      list().forEach(function (u) {
        var row = el('div', 'am-row');
        var main = el('div', 'am-btn am-main' + (u === cur ? ' am-cur' : ''), (u === cur ? '✓ ' : '') + short(u));
        if (u === cur) main.appendChild(el('span', 'am-sub', 'поточна'));
        var ed = el('div', 'am-btn', '✎');
        var del = el('div', 'am-btn', '✕');
        row.appendChild(main); row.appendChild(ed); row.appendChild(del);
        box.appendChild(row);
        grid.push([
          { node: main, act: function () { if (u === cur) close(); else switchTo(u); } },
          { node: ed, act: function () { edit(u); } },
          { node: del, act: function () { remove(u); } }
        ]);
      });
      if (DIRECT && list().length > 1) {
        var xRow = el('div', 'am-row');
        var xb = el('div', 'am-btn am-main', '⇄ Перенести налаштування сюди з іншої адреси');
        xRow.appendChild(xb); box.appendChild(xRow);
        grid.push([{ node: xb, act: function () { mode = 'xfer'; render(0, 0); } }]);
      }
      var lRow = el('div', 'am-row');
      var lb = el('div', 'am-btn am-main', '📋 Журнал запуску');
      lRow.appendChild(lb); box.appendChild(lRow);
      grid.push([{ node: lb, act: function () { mode = 'log'; render(0, 0); } }]);
      var tRow = el('div', 'am-row');
      var tb = el('div', 'am-btn am-main', '🔍 Перевірка пульта');
      tRow.appendChild(tb); box.appendChild(tRow);
      grid.push([{ node: tb, act: function () { close(); keyTest(); } }]);
      var addRow = el('div', 'am-row');
      var add = el('div', 'am-btn am-main', '+ Додати адресу');
      addRow.appendChild(add);
      box.appendChild(addRow);
      grid.push([{ node: add, act: function () { edit(null); } }]);
    } else if (mode === 'xfer') {
      box.appendChild(el('div', 'am-hint', 'Звідки перенести розширення й налаштування на ' + short(current()) + '? Поточні налаштування тут буде замінено.'));
      var here = current();
      list().forEach(function (u) {
        if (u === here) return;
        var r = el('div', 'am-row'), b = el('div', 'am-btn am-main', '⇄ ' + short(u));
        r.appendChild(b); box.appendChild(r);
        grid.push([{ node: b, act: function () {
          try { NAMED = NAMED || { alco: 1 }; NAMED.sui_export_to = here; NAMED.cur = here; window.name = JSON.stringify(NAMED); } catch (e) {}
          try { window.location.replace(u); } catch (e) {}
        } }]);
      });
      var xbk = el('div', 'am-btn am-main', 'Назад');
      var xr = el('div', 'am-row'); xr.appendChild(xbk); box.appendChild(xr);
      grid.push([{ node: xbk, act: function () { mode = 'list'; render(0, 0); } }]);
    } else if (mode === 'log') {
      box.appendChild(el('div', 'am-hint', 'Сфотографуйте й надішліть · OK — назад'));
      var get = function (k) { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch (e) { return []; } };
      var imp = /Plugins.*(load list|clear list|cache)|Extensions|Quota|Пам|error|fail|warn:/i;
      var cur = (window.ALCO_LOG || []).filter(function (l) { return imp.test(l) && !/StorageWorker|Premiere|Content row/.test(l); }).slice(-16);
      var pl = '';
      try { pl = (JSON.parse(localStorage.getItem('plugins') || '[]') || []).map(function (p) { return (p.status ? '✓ ' : '✗ ') + String(p.url || p).replace(/^https?:\/\//, ''); }).join('\n'); } catch (e) { pl = 'помилка читання: ' + e.message; }
      var pre = el('div', 'am-hint', '');
      pre.style.cssText = 'white-space:pre-wrap;font:17px/1.3 monospace;max-height:72vh;overflow:hidden;text-align:left';
      pre.textContent = '— Розширення в пам\u2019яті —\n' + (pl || '(порожньо)') + '\n\n— Запуск —\n' + cur.join('\n');
      box.appendChild(pre);
      var bk = el('div', 'am-btn am-main', 'Назад');
      var r0 = el('div', 'am-row'); r0.appendChild(bk); box.appendChild(r0);
      grid.push([{ node: bk, act: function () { mode = 'list'; render(0, 0); } }]);
    } else {
      box.appendChild(el('div', 'am-hint', editing ? 'Змініть адресу і натисніть «Зберегти»' : 'Введіть адресу сервера, наприклад http://92-5-178-165.sslip.io'));
      var inp = document.createElement('input');
      inp.type = 'text';
      inp.setAttribute('autocomplete', 'off');
      inp.value = editing || 'http://';
      box.appendChild(inp);
      var r = el('div', 'am-row');
      var save = el('div', 'am-btn am-main', 'Зберегти й відкрити');
      var cancel = el('div', 'am-btn', 'Скасувати');
      r.appendChild(save); r.appendChild(cancel);
      box.appendChild(r);
      grid.push([{ node: inp, input: true }]);
      grid.push([
        { node: save, act: function () { saveEdit(inp.value); } },
        { node: cancel, act: function () { mode = 'list'; render(0, 0); } }
      ]);
    }
    document.body.appendChild(root);
  }

  function paint() {
    for (var y = 0; y < grid.length; y++)
      for (var x = 0; x < grid[y].length; x++) {
        var n = grid[y][x].node;
        n.className = n.className.replace(/\s*am-f/g, '') + (y === fy && x === fx ? ' am-f' : '');
      }
    var c = grid[fy] && grid[fy][fx];
    if (c && c.input) { try { c.node.focus(); } catch (e) {} }
    else if (document.activeElement && document.activeElement.blur && document.activeElement.tagName === 'INPUT') document.activeElement.blur();
    if (c && c.node.scrollIntoView) { try { c.node.scrollIntoView({ block: 'nearest' }); } catch (e) {} }
  }

  function render(y, x) { build(); fy = y || 0; fx = x || 0; paint(); }

  function edit(u) { editing = u; mode = 'edit'; render(0, 0); }

  function saveEdit(v) {
    var u = norm(v);
    if (!u) return;
    var l = list();
    if (editing) {
      l = l.map(function (x) { return x === editing ? u : x; });
      var uniq = [];
      l.forEach(function (x) { if (uniq.indexOf(x) < 0) uniq.push(x); });
      saveList(uniq);
      if (editing === current()) { ls(KEY, u); restart(); return; }
      mode = 'list'; render(0, 0);
    } else switchTo(u);
  }

  function remove(u) {
    var l = list().filter(function (x) { return x !== u; });
    if (!l.length) return;                 // останню адресу не видаляємо
    saveList(l);
    if (u === current()) ls(KEY, l[0]);
    // запам'ятати видалення, щоб адреса не повернулась зі старого списку застосунку
    try {
      var g = JSON.parse(ls('alco_removed') || '[]') || []; if (g.indexOf(u) < 0) g.push(u); ls('alco_removed', JSON.stringify(g));
      if (DIRECT && NAMED) { NAMED.removed = g; NAMED.list = l; window.name = JSON.stringify(NAMED); }
    } catch (e) {}
    render(Math.min(fy, l.length - 1), 0);
  }

  function open() { mode = 'list'; editing = null; render(0, 0); }

  function close() {
    if (root && root.parentNode) root.parentNode.removeChild(root);
    root = null;
  }

  function isOpen() { return !!root; }

  /* ---------------- пульт ---------------- */

  function code(e) { return e.keyCode || e.which || 0; }

  function menuKey(e) {
    var k = code(e);
    var c = grid[fy] && grid[fy][fx];
    var inInput = c && c.input;

    if (BACK[k] && !(inInput && k === 8)) {
      if (mode === 'edit') { mode = 'list'; render(0, 0); } else close();
    }
    else if (k === 38) { if (fy > 0) { fy--; fx = Math.min(fx, grid[fy].length - 1); paint(); } }
    else if (k === 40) { if (fy < grid.length - 1) { fy++; fx = Math.min(fx, grid[fy].length - 1); paint(); } }
    else if (k === 37 && !inInput) { if (fx > 0) { fx--; paint(); } }
    else if (k === 39 && !inInput) { if (fx < grid[fy].length - 1) { fx++; paint(); } }
    else if (k === 13) {
      if (inInput) saveEdit(c.node.value);
      else if (c && c.act) c.act();
    }
    else if (inInput) return; // звичайне введення тексту

    e.preventDefault();
  }


  /* Перевірка пульта: показує, які сигнали приходять від кнопок (закривається сама через 15 с без натискань) */
  function keyTest() {
    var box = document.createElement('div');
    box.id = 'alco-keytest';
    box.style.cssText = 'position:fixed;left:40px;top:40px;width:900px;z-index:2147483647;background:rgba(10,14,24,.95);color:#e8eaf0;font:26px Arial;padding:24px 30px;border-radius:18px;border:3px solid #FFD700';
    var lines = [];
    function add(t) {
      lines.unshift(t); lines = lines.slice(0, 12);
      box.innerHTML = '<b style="color:#FFD700">Перевірка пульта</b> — натискайте кнопки й дивіться коди. <b style="color:#FFD700">OK — закрити</b><br><br>' + lines.join('<br>');
      idle = Date.now();
    }
    var idle = Date.now();
    function lampaState() {
      var L = window.Lampa, out = [];
      try { out.push('екран=' + L.Controller.enabled().name); } catch (e) {}
      try { out.push('сторінок=' + L.Activity.all().length); } catch (e) {}
      try { out.push('платформа=' + L.Platform.get()); } catch (e) { try { out.push('платформа=' + L.Storage.get('platform')); } catch (e2) {} }
      return out.join(' · ');
    }
    function finish() {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('keyup', onKey, true);
      window.removeEventListener('popstate', onPop, true);
      document.removeEventListener('visibilitychange', onVis, true);
      if (box.parentNode) box.parentNode.removeChild(box);
    }
    var okDown = false;
    function onKey(e) {
      var k = e.keyCode || e.which;
      if (k === 13) {                                     // OK — закрити перевірку (у Lampa не передаємо)
        e.stopImmediatePropagation(); e.preventDefault();
        if (e.type === 'keydown') okDown = true;
        else if (okDown) finish();
        return;
      }
      add(e.type + ' — код ' + k + ' · key=' + e.key + (e.repeat ? ' · повтор' : ''));
      if (e.type === 'keydown' && k === 461) {
        var before = lampaState();
        setTimeout(function () { add('&nbsp;&nbsp;Lampa до: ' + before + '<br>&nbsp;&nbsp;Lampa після: ' + lampaState()); }, 400);
      }
    }
    try { window.Lampa.Keypad.listener.follow('back', function () { if (box.parentNode) add('&nbsp;&nbsp;✔ Lampa отримала «Назад»'); }); } catch (e) {}
    function onPop() { add('popstate — історія назад (системний «Назад»)'); }
    function onVis() { add('visibilitychange — ' + document.visibilityState); }
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('keyup', onKey, true);
    window.addEventListener('popstate', onPop, true);
    document.addEventListener('visibilitychange', onVis, true);
    document.body.appendChild(box);
    add('готово, чекаю на натискання…');
    (function tick() {
      if (!box.parentNode) return;
      if (Date.now() - idle > 60000) return finish();    // запасне автозакриття через хвилину
      setTimeout(tick, 500);
    })();
  }

  /* Утримання джойстика вліво (понад 1,2 с) — меню адрес.
     Короткі натискання вліво нічим не затримуються: вони одразу йдуть у Lampa. */
  var HOLD_MS = 1000, GAP_MS = 250;
  var holdStart = 0, holdLast = 0, holdOpened = false, lPress = false, lTimer = null;

  if (window.__alcoKD) {
    window.removeEventListener('keydown', window.__alcoKD, true);
    window.removeEventListener('keyup', window.__alcoKU, true);
  }

  /* Утримання «Назад» (понад 0,55 с — раніше, ніж телевізор забере кнопку собі) — меню адрес; коротке «Назад» передаємо Lampa при відпусканні */
  var BACK_HOLD = 400, bPress = false, bOpened = false, bTimer = null, synthetic = false;
  function fake(type, k) {
    var ev;
    try { ev = new KeyboardEvent(type, { bubbles: true, cancelable: true, key: 'GoBack' }); }
    catch (e) { ev = document.createEvent('Event'); ev.initEvent(type, true, true); }
    try {
      Object.defineProperty(ev, 'keyCode', { get: function () { return k; } });
      Object.defineProperty(ev, 'which', { get: function () { return k; } });
    } catch (e) {}
    synthetic = true;
    try { (document.activeElement || document.body).dispatchEvent(ev); } catch (e) {}
    synthetic = false;
  }
  function backDown(e) {
    e.stopImmediatePropagation(); e.preventDefault();
    if (bPress) return;                                   // автоповтор, поки тримають
    bPress = true; bOpened = false;
    clearTimeout(bTimer);
    bTimer = setTimeout(function () { if (bPress) { bOpened = true; open(); } }, BACK_HOLD);
  }
  function backUp(e) {
    e.stopImmediatePropagation(); e.preventDefault();
    clearTimeout(bTimer);
    var opened = bOpened;
    bPress = false; bOpened = false;
    if (!opened) { fake('keydown', 461); fake('keyup', 461); }   // коротке — звичайне «Назад»
  }

  window.__alcoKD = function (e) {
    if (synthetic) return;
    var k = code(e);
    if (isOpen()) {
      e.stopImmediatePropagation();
      if (k === 37 && holdOpened && lPress) { e.preventDefault(); return; }
      holdOpened = false; lPress = false;
      return menuKey(e);
    }
    if (k !== 37) return;
    // ◀: натискання одразу йде в Lampa; якщо кнопку не відпустили за 1 с — меню адрес
    // (не залежить від того, чи шле пульт повтори)
    if (!lPress) {
      lPress = true;
      clearTimeout(lTimer);
      lTimer = setTimeout(function () { if (lPress) { holdOpened = true; open(); } }, HOLD_MS);
    }
  };

  window.__alcoKU = function (e) {
    if (synthetic) return;
    var k = code(e);
    if (k === 37) { lPress = false; clearTimeout(lTimer); if (isOpen() && holdOpened) { holdOpened = false; e.stopImmediatePropagation(); return; } }
    if (isOpen()) e.stopImmediatePropagation();
  };

  window.addEventListener('keydown', window.__alcoKD, true);
  window.addEventListener('keyup', window.__alcoKU, true);

  /* Пункт «Адреса сервера» у головному меню й налаштуваннях Lampa */
  var ICO = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="6" rx="1.5" stroke="currentColor" stroke-width="2"/><rect x="3" y="14" width="18" height="6" rx="1.5" stroke="currentColor" stroke-width="2"/><circle cx="7" cy="7" r="1.2" fill="currentColor"/><circle cx="7" cy="17" r="1.2" fill="currentColor"/></svg>';
  var hookTries = 0;
  function hookLampa() {
    if (window.__alcoHooked) return;
    var L = window.Lampa;
    if (!L || !L.Listener || !L.SettingsApi) { if (++hookTries < 120) setTimeout(hookLampa, 500); return; }
    window.__alcoHooked = true;
    function go() {
      try {
        L.SettingsApi.addComponent({ component: 'alco_addr', name: 'Адреса сервера', icon: ICO });
        L.SettingsApi.addParam({
          component: 'alco_addr',
          param: { name: 'alco_addr_open', type: 'button' },
          field: { name: 'Змінити адресу сервера', description: 'Зараз: ' + short(current()) },
          onChange: function () { window.AlcoMenu.open(); }
        });
      } catch (e) {}
      try { if (L.Menu && L.Menu.addButton) L.Menu.addButton(ICO, 'Адреса сервера', function () { window.AlcoMenu.open(); }); } catch (e) {}
    }
    if (window.appready) go();
    else L.Listener.follow('app', function (e) { if (e.type === 'ready') go(); });
  }
  if (window.__alcoInside || !document.getElementById('error')) hookLampa();

  /* Сторож: якщо Lampa з цього сервера не стартувала всередині застосунку за 12 с —
     відкриваємо адресу напряму і запам'ятовуємо це для неї */
  function hostOf(u) { var m = (u || '').match(/^https?:\/\/([^\/?#]+)/i); return m ? m[1].toLowerCase() : ''; }
  if (window.__alcoInside && !window.__alcoWatch) {
    window.__alcoWatch = true;
    var started = Date.now();
    (function watch() {
      if (window.appready) { ls('mylampa_mode_' + hostOf(current()), 'inside'); return; }
      if (Date.now() - started > 90000) return;      // більше не перемикаємося «напряму»: інша пам'ять — губились розширення
      setTimeout(watch, 1000);
    })();
  }

  window.AlcoMenu = { open: open, close: close, isOpen: isOpen, current: current, list: list };
  window.AlcoMenu.forget = function (u) { ls('mylampa_mode_' + hostOf(u || current()), ''); };
})();
