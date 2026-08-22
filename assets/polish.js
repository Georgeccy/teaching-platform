/* 智学平台 · 小巧思（polish）
 * 统一为各 shell 页面提供：三态主题（浅/深/跟随系统）、顶部滚动进度条、
 * 回到顶部、滚动入场动画、单元数 count-up、磁性按钮、卡片按压反馈。
 * 自动在 DOMContentLoaded 初始化；元素缺失时静默跳过（安全降级）。
 */
(function () {
  'use strict';

  function reduceMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function $(s, r) { return (r || document).querySelector(s); }
  function $all(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }

  /* ---------- 主题：浅色 / 深色 / 跟随系统 ---------- */
  function theme(sel) {
    var btn = (typeof sel === 'string') ? $(sel) : sel;
    if (!btn || btn.getAttribute('data-theme-native')) return; // 工坊页保留自有主题逻辑
    var KEY = 'zhixue-theme';
    var modes = ['light', 'dark', 'system'];
    var ICON = { light: '🌙', dark: '☀️', system: '🌗' };
    var LABEL = { light: '主题：浅色', dark: '主题：深色', system: '主题：跟随系统' };
    function sysDark() {
      return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    function apply(mode) {
      var dark = (mode === 'dark') || (mode === 'system' && sysDark());
      document.body.classList.toggle('dark', !!dark);
      btn.textContent = ICON[mode];
      btn.title = LABEL[mode];
      btn.setAttribute('aria-label', LABEL[mode]);
    }
    function current() {
      var s = null;
      try { s = localStorage.getItem(KEY); } catch (e) {}
      return (s && modes.indexOf(s) >= 0) ? s : 'system';
    }
    apply(current());
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onSys = function () { if (current() === 'system') apply('system'); };
      if (mq.addEventListener) mq.addEventListener('change', onSys);
      else if (mq.addListener) mq.addListener(onSys);
    }
    btn.addEventListener('click', function () {
      var next = modes[(modes.indexOf(current()) + 1) % modes.length];
      try { localStorage.setItem(KEY, next); } catch (e) {}
      apply(next);
    });
  }

  /* ---------- 顶部滚动进度条 ---------- */
  function progress() {
    var bar = document.createElement('div');
    bar.className = 'zx-progress';
    bar.innerHTML = '<i></i>';
    document.body.appendChild(bar);
    var fill = bar.firstChild;
    function upd() {
      var d = document.documentElement;
      var st = d.scrollTop || document.body.scrollTop || 0;
      var sh = (d.scrollHeight - d.clientHeight) || 1;
      fill.style.width = (st / sh * 100) + '%';
    }
    window.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
    upd();
  }

  /* ---------- 回到顶部 ---------- */
  function toTop() {
    var b = document.createElement('button');
    b.className = 'zx-totop';
    b.type = 'button';
    b.textContent = '↑';
    b.title = '回到顶部';
    b.setAttribute('aria-label', '回到顶部');
    document.body.appendChild(b);
    b.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
    });
    function upd() {
      var st = document.documentElement.scrollTop || document.body.scrollTop || 0;
      b.classList.toggle('show', st > 400);
    }
    window.addEventListener('scroll', upd, { passive: true });
    upd();
  }

  /* ---------- 入场动画（滚动揭示，安全降级） ---------- */
  function reveal() {
    document.documentElement.classList.add('reveal-ready');
    var items = $all('.bx-sec, .sec-head, .hero, .filters, .card');
    if (!items.length) return;
    if (!('IntersectionObserver' in window) || reduceMotion()) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) {
      if (el.classList.contains('card')) {
        el.classList.add('reveal-fade');
        var grid = el.closest('.grid');
        var sibs = grid ? [].slice.call(grid.querySelectorAll('.card')) : [el];
        var i = sibs.indexOf(el);
        el.style.transitionDelay = ((i % 10) * 55) + 'ms';
      } else {
        el.classList.add('reveal');
      }
      io.observe(el);
    });
  }

  /* ---------- 单元数 count-up ---------- */
  function countUp() {
    if (reduceMotion()) return;
    $all('.sec-head .pixel, .bx-head .pixel').forEach(function (el) {
      var m = el.textContent.match(/(\d+)/);
      if (!m) return;
      var target = parseInt(m[1], 10);
      var pre = el.textContent.slice(0, m.index);
      var suf = el.textContent.slice(m.index + m[1].length);
      var start = null, dur = 700;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var val = Math.round(target * (1 - Math.pow(1 - p, 3))); // easeOutCubic
        el.textContent = pre + val + suf;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  /* ---------- 磁性按钮（轻微跟随光标） ---------- */
  function magnetic() {
    if (reduceMotion()) return;
    $all('.icon-btn').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
        var y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        btn.style.transform = 'translate(' + (x * 3 - 1.5).toFixed(1) + 'px,' + (y * 3 - 1.5).toFixed(1) + 'px)';
      });
      btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
    });
  }

  /* ---------- 收藏（localStorage，跨班型筛选） ---------- */
  var FAV = { list: [] };
  function getFavs() { try { return JSON.parse(localStorage.getItem('zhixue-favs') || '[]'); } catch (e) { return []; } }
  function setFavs(a) { FAV.list = a; try { localStorage.setItem('zhixue-favs', JSON.stringify(a)); } catch (e) {} }

  /* ---------- 搜索 + 班型筛选 + 收藏筛选 + 空状态 ---------- */
  function applyFilter() {
    var input = $('.search input');
    var term = (input && input.value || '').trim().toLowerCase();
    var a = $('.chip.active[data-f]');
    var f = a ? a.dataset.f : 'all';
    var cards = $all('.card');
    var visible = 0;
    cards.forEach(function (card) {
      var href = card.getAttribute('data-href') || '';
      var txt = (card.textContent || '').toLowerCase();
      var matchTerm = !term || txt.indexOf(term) >= 0;
      var sec = card.closest ? card.closest('.bx-sec') : null;
      var matchFav = (f !== 'fav') || FAV.list.indexOf(href) >= 0;
      var matchSec = (f === 'all' || f === 'fav') ? true : (sec && sec.dataset.bx === f);
      var show = matchTerm && matchFav && matchSec;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    $all('.bx-sec').forEach(function (sec) {
      if (f !== 'all' && f !== 'fav' && sec.dataset.bx !== f) { sec.style.display = 'none'; return; }
      var any = [].slice.call(sec.querySelectorAll('.card')).some(function (c) { return c.style.display !== 'none'; });
      sec.style.display = any ? '' : 'none';
    });
    var es = $('#emptyState');
    if (es) es.hidden = visible > 0;
  }

  function filter() {
    var input = $('.search input');
    var chips = $all('.chip[data-f]');
    if (input) input.addEventListener('input', applyFilter);
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        $all('.chip[data-f]').forEach(function (x) { x.classList.remove('active'); });
        c.classList.add('active');
        applyFilter();
      });
    });
    var cb = $('#clearFilters');
    if (cb) cb.addEventListener('click', function () {
      if (input) input.value = '';
      $all('.chip[data-f]').forEach(function (x) { x.classList.remove('active'); });
      var allc = $('.chip[data-f="all"]');
      if (allc) allc.classList.add('active');
      applyFilter();
      if (input) input.focus();
    });
    applyFilter();
  }

  /* ---------- 收藏星标按钮 ---------- */
  function fav() {
    setFavs(getFavs());
    function syncLabel() {
      var chip = $('#favChip');
      if (!chip) return;
      var n = FAV.list.length;
      chip.lastChild.nodeValue = n ? ' ★ 收藏 (' + n + ')' : ' ★ 收藏';
    }
    $all('.card .fav').forEach(function (btn) {
      var card = btn.closest('.card');
      var href = card.getAttribute('data-href') || '';
      var on = FAV.list.indexOf(href) >= 0;
      btn.classList.toggle('on', on);
      btn.textContent = on ? '★' : '☆';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var i = FAV.list.indexOf(href);
        if (i >= 0) FAV.list.splice(i, 1); else FAV.list.push(href);
        setFavs(FAV.list);
        var on2 = FAV.list.indexOf(href) >= 0;
        btn.classList.toggle('on', on2);
        btn.textContent = on2 ? '★' : '☆';
        syncLabel();
        applyFilter();
        try { window.dispatchEvent(new CustomEvent('zx-pet-react', { detail: { type: 'fav' } })); } catch (e) {}
      });
    });
    syncLabel();
  }

  /* ---------- 课型区块折叠/展开（持久化） ---------- */
  function collapse() {
    var list = document.getElementById('bxList');
    if (!list) return;
    var KEY = 'zhixue-bx-collapsed-' + (document.body.dataset.kind || 'x');
    function get() { try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch (e) { return new Set(); } }
    function set(s) { try { localStorage.setItem(KEY, JSON.stringify([].slice.call(s))); } catch (e) {} }
    var collapsed = get();
    $all('.bx-sec', list).forEach(function (sec) { sec.classList.toggle('collapsed', collapsed.has(sec.dataset.bx)); });
    list.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.bx-collapse') : null;
      if (!btn) return;
      var sec = btn.closest('.bx-sec');
      if (!sec) return;
      var bx = sec.dataset.bx;
      if (collapsed.has(bx)) { collapsed.delete(bx); sec.classList.remove('collapsed'); }
      else { collapsed.add(bx); sec.classList.add('collapsed'); }
      set(collapsed);
    });
  }

  /* ---------- 最近学习（首页快捷续学，记录课件打开） ---------- */
  function esc(s) { return (s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function recents() {
    var KEY = 'zhixue-recents';
    function get() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
    function set(a) { try { localStorage.setItem(KEY, JSON.stringify(a.slice(0, 6))); } catch (e) {} }
    // 记录课件打开（捕获阶段，在导航发生前写入）
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('.card .go') : null;
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (href.indexOf('courseware/') < 0) return;
      var card = a.closest('.card');
      var title = card && card.querySelector('h3') ? card.querySelector('h3').textContent : '单元';
      var sub = card && card.querySelector('.sub') ? card.querySelector('.sub').textContent : '';
      var list = get().filter(function (x) { return x.href !== href; });
      list.unshift({ title: title, sub: sub, href: href });
      set(list);
      try { window.dispatchEvent(new CustomEvent('zx-pet-react', { detail: { type: 'study' } })); } catch (e) {}
    }, true);
    // 首页渲染
    var rail = document.getElementById('recents');
    if (!rail) return;
    var grid = document.getElementById('recentGrid');
    var list = get();
    if (!list.length) { rail.hidden = true; return; }
    rail.hidden = false;
    grid.innerHTML = list.map(function (x) {
      return '<div class="card"><div class="cap" style="background:var(--green)">▶</div>'
        + '<h3>' + esc(x.title) + '</h3><div class="sub">' + esc(x.sub || '最近学习') + '</div>'
        + '<a class="go" href="' + x.href + '" target="_blank">继续 →</a></div>';
    }).join('');
  }

  /* ---------- 课件链接默认在新标签打开（平台默认运行于 Chrome） ----------
   * 早期版本会把 courseware/ 链接改写成 googlechrome:// URL Scheme 以「强制在 Chrome 打开」，
   * 但该 scheme 只能由其它 App（如 启动.command）唤起，在 Safari / WebView 内直接跟随会报
   * “Safari cannot open the page because the address is invalid.” 错误。
   * 现改为：以原生方式在新标签打开链接即可——平台通过 启动.command 默认在 Chrome 中运行，
   * 因此课件天然在 Chrome 内打开；在其它浏览器中则原生打开，不再报错。
   */
  function openChrome() {
    function mark(a) {
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (href.indexOf('courseware/') < 0) return;
      if (/^(googlechrome|googlechromes):/i.test(href)) return; // 已带 scheme 则跳过
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
    }
    // 捕获阶段：在浏览器按原生规则导航前补上 target，使其在新标签打开（不再改写 scheme）
    document.addEventListener('click', function (e) {
      if (e.button !== 0) return; // 仅左键；中/右键交回浏览器原生处理
      mark(e.target.closest ? e.target.closest('a[href*="courseware/"]') : null);
    }, true);
    // 初始化时也为已存在的课件链接补上 target（含动态生成的「最近学习」等）
    $all('a[href*="courseware/"]').forEach(mark);
  }

  /* ---------- 卡片 3D 倾斜 + 光标高光 ---------- */
  function tilt() {
    if (reduceMotion()) return;
    $all('.card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        var ry = (px - 0.5) * 8;
        var rx = (0.5 - py) * 8;
        card.style.transform = 'perspective(700px) translate(-3px,-3px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
      card.addEventListener('mouseleave', function () { card.style.transform = ''; });
    });
  }

  /* ---------- CTA 像素涟漪 ---------- */
  function ripple() {
    if (reduceMotion()) return;
    $all('.card .go').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var r = btn.getBoundingClientRect();
        var span = document.createElement('span');
        span.className = 'zx-ripple';
        var d = Math.max(r.width, r.height);
        span.style.width = span.style.height = d + 'px';
        span.style.left = (e.clientX - r.left - d / 2) + 'px';
        span.style.top = (e.clientY - r.top - d / 2) + 'px';
        btn.appendChild(span);
        setTimeout(function () { if (span.parentNode) span.parentNode.removeChild(span); }, 520);
      });
    });
  }

  /* ---------- 键盘快捷键：/ 搜索 · T 主题 · Esc 清空 ---------- */
  function shortcuts() {
    document.addEventListener('keydown', function (e) {
      var t = e.target;
      var typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (e.key === '/' && !typing) {
        var i = $('.search input');
        if (i) { e.preventDefault(); i.focus(); }
        return;
      }
      if (e.key === 'Escape' && typing) {
        var i2 = $('.search input');
        if (i2 && i2.value) { i2.value = ''; i2.dispatchEvent(new Event('input')); i2.blur(); }
        return;
      }
      if ((e.key === 't' || e.key === 'T') && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        var b = $('#themeBtn');
        if (b) { e.preventDefault(); b.click(); }
      }
    });
  }

  /* ---------- 像素宠物「学宝」：抚摸 / 拖拽 / 喂食 / 陪学 ---------- */
  function pet() {
    var KEY = 'zhixue-pet';
    var DEFAULT_NAME = '学宝';
    var SKINS = ['green', 'blue', 'pink', 'orange'];
    var PET_SVG =
      '<svg class="zx-pet-svg" viewBox="0 0 18 18" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">'
      + '<g class="pet-body">'
      + '<rect x="4" y="1" width="2" height="3" fill="var(--pet-ear)"/>'
      + '<rect x="12" y="1" width="2" height="3" fill="var(--pet-ear)"/>'
      + '<rect x="3" y="4" width="12" height="10" fill="var(--pet-body)"/>'
      + '<rect x="2" y="5" width="1" height="8" fill="var(--pet-body)"/>'
      + '<rect x="15" y="5" width="1" height="8" fill="var(--pet-body)"/>'
      + '<rect x="5" y="13" width="8" height="3" fill="var(--pet-belly)"/>'
      + '<rect x="4" y="9" width="1" height="1" fill="#E8A0A0"/>'
      + '<rect x="13" y="9" width="1" height="1" fill="#E8A0A0"/>'
      + '</g>'
      + '<g class="face face-neutral">'
      + '<rect x="6" y="7" width="2" height="2" fill="#F4ECD8"/><rect x="10" y="7" width="2" height="2" fill="#F4ECD8"/>'
      + '<rect x="6" y="8" width="2" height="1" fill="#2E2A3B"/><rect x="10" y="8" width="2" height="1" fill="#2E2A3B"/>'
      + '<rect x="8" y="10" width="2" height="1" fill="#F4ECD8"/>'
      + '</g>'
      + '<g class="face face-happy">'
      + '<rect x="6" y="8" width="1" height="1" fill="#F4ECD8"/><rect x="7" y="7" width="1" height="1" fill="#F4ECD8"/><rect x="8" y="8" width="1" height="1" fill="#F4ECD8"/>'
      + '<rect x="10" y="8" width="1" height="1" fill="#F4ECD8"/><rect x="11" y="7" width="1" height="1" fill="#F4ECD8"/><rect x="12" y="8" width="1" height="1" fill="#F4ECD8"/>'
      + '<rect x="6" y="9" width="1" height="1" fill="#F4ECD8"/><rect x="11" y="9" width="1" height="1" fill="#F4ECD8"/>'
      + '<rect x="7" y="10" width="4" height="1" fill="#F4ECD8"/>'
      + '</g>'
      + '<g class="face face-sleepy">'
      + '<rect x="6" y="8" width="2" height="1" fill="#F4ECD8"/><rect x="10" y="8" width="2" height="1" fill="#F4ECD8"/>'
      + '<rect x="8" y="10" width="2" height="1" fill="#F4ECD8"/>'
      + '</g>'
      + '</svg>';
    var MSGS = ['今天也要加油学 DSE 呀!', '做完一题就离 5** 更近一步~', '累了就摸摸我休息一下吧',
      'Reading 先看题目再回文章找答案哦', 'Writing 记得用连接词让逻辑更顺', '错题别怕，搞懂就是进步',
      '喝水! 护眼! 站起来伸个懒腰~', '你已经比昨天的自己强啦'];
    var PET_MSGS = ['摸摸头~', '好舒服 (◕‿◕)', '谢谢你陪我', '嘿嘿~', '再摸一下嘛'];
    var FEED_MSGS = ['好吃!', '吃饱啦，继续学!', '能量 +1', '学习力 up↑', '谢谢投喂~'];
    var FOOD = ['🍙', '📖', '🍪', '🥛', '✏️', '🍎'];
    var SKIN_SAY = ['换上森绿装!', '换上天空蓝!', '换上樱粉装!', '换上暖橙装!'];
    var REACT_FAV = ['收藏成功，你真用功!', '又锁定一个单元，赞!', '好习惯，考试不慌~'];
    var REACT_STUDY = ['开始学习啦，加油!', '专心致志，棒!', '陪你一起啃下来~'];

    function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
    function load() {
      var d = { name: DEFAULT_NAME, mood: 60, x: null, y: null, hidden: false, skin: 'green' };
      try { var s = JSON.parse(localStorage.getItem(KEY) || '{}'); for (var k in s) d[k] = s[k]; } catch (e) {}
      return d;
    }
    var st = load();
    if (SKINS.indexOf(st.skin) < 0) st.skin = 'green';

    function renderCall() {
      if (document.querySelector('.zx-pet-call')) return;
      var c = document.createElement('button');
      c.className = 'zx-pet-call'; c.type = 'button'; c.textContent = '🐾 召唤 ' + st.name;
      c.addEventListener('click', function () { if (c.parentNode) c.parentNode.removeChild(c); st.hidden = false; save(); pet(); });
      document.body.appendChild(c);
    }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }

    if (st.hidden) { renderCall(); return; }

    var root = document.createElement('div');
    root.className = 'zx-pet skin-' + st.skin;
    root.innerHTML = PET_SVG
      + '<div class="zx-pet-name">' + esc(st.name) + '</div>'
      + '<div class="zx-pet-mood"></div>'
      + '<div class="zx-pet-bubble"></div>'
      + '<div class="zx-pet-tools">'
      + '<button data-act="rename" title="改名">✎</button>'
      + '<button data-act="skin" title="换装">🎨</button>'
      + '<button data-act="play" title="跳舞">💃</button>'
      + '<button data-act="reset" title="归位">⌂</button>'
      + '<button data-act="hide" title="收起">×</button>'
      + '</div>';
    if (st.x != null && st.y != null) {
      root.style.left = st.x + 'px'; root.style.top = st.y + 'px';
      root.style.right = 'auto'; root.style.bottom = 'auto';
    }
    document.body.appendChild(root);

    var bubble = root.querySelector('.zx-pet-bubble');
    var nameEl = root.querySelector('.zx-pet-name');
    var moodEl = root.querySelector('.zx-pet-mood');
    var bubbleTimer;
    function say(msg, ms) {
      bubble.textContent = msg;
      bubble.classList.remove('flip');
      bubble.classList.add('show');
      // 宠物贴近视口顶部时，气泡上方放不下，自动翻到宠物下方（仍不遮挡宠物）
      var r = root.getBoundingClientRect();
      var bh = bubble.offsetHeight || 60;
      if (r.top - bh - 16 < 8) bubble.classList.add('flip');
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(function () { bubble.classList.remove('show'); }, ms || 2600);
    }
    function floatEmoji(em, cls) {
      var s = document.createElement('div'); s.className = 'zx-float' + (cls ? ' ' + cls : ''); s.textContent = em;
      root.appendChild(s); setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 1000);
    }
    function applyFace() {
      root.classList.remove('s-happy', 's-sleepy');
      if (st.mood < 25) root.classList.add('s-sleepy');
      else if (st.mood > 65) root.classList.add('s-happy');
    }
    function renderMood() {
      var n = Math.round(Math.max(0, Math.min(100, st.mood)) / 20);
      var html = '';
      for (var i = 0; i < 5; i++) html += '<i' + (i < n ? ' class="on"' : '') + '></i>';
      moodEl.innerHTML = html;
    }
    function setMood(v) { st.mood = Math.max(0, Math.min(100, v)); save(); applyFace(); renderMood(); }
    function hop() {
      if (reduceMotion()) return;
      root.classList.remove('hop'); void root.offsetWidth; root.classList.add('hop');
      setTimeout(function () { root.classList.remove('hop'); }, 520);
    }
    applyFace(); renderMood();

    function petted() {
      setMood(st.mood + 4);
      hop(); floatEmoji('♥'); say(pick(PET_MSGS));
    }
    function feed() {
      setMood(st.mood + 14);
      hop(); floatEmoji(pick(FOOD)); say(pick(FEED_MSGS));
    }

    var suppressClick = false;
    root.addEventListener('click', function (e) {
      if (e.target.closest('.zx-pet-tools') || e.target === nameEl) return;
      if (suppressClick) { suppressClick = false; return; }
      petted();
    });
    root.addEventListener('dblclick', function (e) {
      if (e.target.closest('.zx-pet-tools') || e.target === nameEl) return;
      feed();
    });

    /* 拖拽：抬起跟手 + 贴边归位 + 与点击清晰区分 */
    var drag = null;
    root.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.zx-pet-tools') || e.target === nameEl) return;
      drag = { sx: e.clientX, sy: e.clientY, l: root.offsetLeft, t: root.offsetTop, moved: false };
      try { root.setPointerCapture(e.pointerId); } catch (er) {}
    });
    root.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (!drag.moved && (Math.abs(dx) + Math.abs(dy) > 4)) {
        drag.moved = true; root.classList.add('dragging', 'quiet');
      }
      if (!drag.moved) return;
      var w = root.offsetWidth, h = root.offsetHeight;
      var nl = Math.max(8, Math.min(window.innerWidth - w - 8, drag.l + dx));
      var nt = Math.max(8, Math.min(window.innerHeight - h - 8, drag.t + dy));
      root.style.left = nl + 'px'; root.style.top = nt + 'px';
      root.style.right = 'auto'; root.style.bottom = 'auto';
    });
    function endDrag() {
      if (!drag) return;
      var wasMoved = drag.moved; drag = null;
      root.classList.remove('dragging');
      if (!wasMoved) return;
      suppressClick = true;
      root.classList.remove('quiet');
      root.classList.add('snapping');
      var w = root.offsetWidth;
      var cx = root.offsetLeft + w / 2;
      if (cx < window.innerWidth / 2) root.style.left = '8px';
      else root.style.left = (window.innerWidth - w - 8) + 'px';
      root.style.right = 'auto';
      st.x = root.offsetLeft; st.y = root.offsetTop; save();
      setTimeout(function () { root.classList.remove('snapping'); }, 300);
    }
    root.addEventListener('pointerup', endDrag);
    root.addEventListener('pointercancel', endDrag);

    root.querySelector('.zx-pet-tools').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; e.stopPropagation();
      var act = b.dataset.act;
      if (act === 'rename') { nameEl.setAttribute('contenteditable', 'true'); nameEl.focus(); }
      else if (act === 'skin') {
        var si = (SKINS.indexOf(st.skin) + 1) % SKINS.length;
        st.skin = SKINS[si];
        root.classList.remove('skin-green', 'skin-blue', 'skin-pink', 'skin-orange');
        root.classList.add('skin-' + st.skin);
        save(); say(SKIN_SAY[si]); floatEmoji('🎨');
      }
      else if (act === 'play') {
        root.classList.remove('dance'); void root.offsetWidth; root.classList.add('dance');
        floatEmoji('🎵'); say('来段即兴舞蹈~', 2200);
        setTimeout(function () { root.classList.remove('dance'); }, 1300);
      }
      else if (act === 'reset') {
        root.style.left = ''; root.style.top = ''; root.style.right = '18px'; root.style.bottom = '80px';
        st.x = null; st.y = null; save(); say('回到原位啦~');
      } else if (act === 'hide') {
        if (root.parentNode) root.parentNode.removeChild(root); st.hidden = true; save(); renderCall();
      }
    });
    nameEl.addEventListener('blur', function () {
      nameEl.removeAttribute('contenteditable');
      var n = nameEl.textContent.trim();
      if (n) { st.name = n; save(); } else { nameEl.textContent = st.name; }
    });
    nameEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); nameEl.blur(); } });

    /* 与学习行为联动：收藏 / 打开课件 → 宠物开心 */
    window.addEventListener('zx-pet-react', function (e) {
      var fav = e && e.detail && e.detail.type === 'fav';
      hop(); setMood(st.mood + (fav ? 10 : 6));
      say(pick(fav ? REACT_FAV : REACT_STUDY), 3000);
    });

    window.addEventListener('blur', function () { if (st.mood > 0) setMood(st.mood - 3); });
    setInterval(function () { if (st.mood > 0) setMood(st.mood - 1); }, 90000);
    setInterval(function () { say(pick(MSGS)); }, 45000);

    /* 偶尔自发蹦一下（更像活物） */
    if (!reduceMotion()) setInterval(function () { if (Math.random() < 0.5 && !document.hidden) hop(); }, 11000);

    /* 夜间模式：23:00–06:00 打瞌睡 */
    var hr = new Date().getHours();
    var night = (hr >= 23 || hr < 6);
    if (night) {
      root.classList.add('s-night');
      setInterval(function () { if (st.mood > 0) floatEmoji('Zzz', 'zzz'); }, 13000);
      setTimeout(function () { say('夜深啦，早点休息，明天再战 DSE~', 4200); }, 900);
    } else {
      setTimeout(function () { say('我是 ' + st.name + '，陪你一起学 DSE! 摸摸我、拖拖我、双击喂我~', 4200); }, 800);
    }
  }

  /* ---------- 学习工具导航：补齐 错题本 / 作业 / 排行榜 / 设置 入口 ---------- */
  function featureNav() {
    var cur = location.pathname.split('/').pop() || 'index.html';
    var BLOCK = { 'teacher.html': 1, 'courseware-studio.html': 1 };
    if (BLOCK[cur]) return;
    var nav = $('.sidebar .nav') || $('.nav');
    if (!nav) return;
    var FEAT = [
      { href: 'mistakes.html', label: '错题本' },
      { href: 'homework.html', label: '作业' },
      { href: 'leaderboard.html', label: '排行榜' },
      { href: 'settings.html', label: '设置' }
    ];
    // 1) 修正既有占位链接（href="#"）
    $all('a', nav).forEach(function (a) {
      if (a.getAttribute('href') === '#') {
        var t = (a.textContent || '').trim();
        FEAT.forEach(function (f) { if (t.indexOf(f.label) >= 0) a.setAttribute('href', f.href); });
      }
    });
    // 2) 补齐缺失入口
    var have = {};
    $all('a', nav).forEach(function (a) { have[a.getAttribute('href')] = 1; });
    var miss = FEAT.filter(function (f) { return !have[f.href]; });
    if (miss.length) {
      var sep = document.createElement('div');
      sep.className = 'nav-sep';
      sep.textContent = '学习';
      nav.appendChild(sep);
      miss.forEach(function (f) {
        var a = document.createElement('a');
        a.href = f.href;
        a.innerHTML = '<span class="dot"></span>' + f.label;
        if (f.href === cur) a.classList.add('active');
        nav.appendChild(a);
      });
    } else {
      // 入口已存在：仅确保当前功能页 active
      $all('a', nav).forEach(function (a) {
        var h = a.getAttribute('href');
        if (FEAT.some(function (f) { return f.href === h && f.href === cur; })) a.classList.add('active');
      });
    }
  }

  function init() {
    progress();
    toTop();
    recents();
    openChrome();
    reveal();
    countUp();
    magnetic();
    theme('#themeBtn');
    fav();
    filter();
    collapse();
    tilt();
    ripple();
    shortcuts();
    pet();
    featureNav();
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
