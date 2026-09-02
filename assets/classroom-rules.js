/* 智学平台 · 课堂规则（全站悬浮入口 + 弹窗）
 * 用法：页面引入 assets/classroom-rules.css 与本页面（放在 app.js 之后）即可自动挂载。
 * - 悬浮按钮固定在左下角，任何页面一键打开课堂规则
 * - 所有登录用户可查看；教师可增删改与排序，学生只读
 * - 数据来自 GET /api/classroom-rules；失败时回退本地缓存，再回退内置默认四条
 * - 交互：✕ / 点击遮罩 / Esc 关闭；编辑态下 Esc 取消并恢复原文案，Enter 保存
 */
(function () {
  'use strict';
  if (window.__crMounted) return;   // 防止重复引入时挂载两次
  window.__crMounted = true;

  var API = '/api/classroom-rules';
  var CACHE_KEY = 'zhixue-classroom-rules';
  var MAX_LEN = 120;
  var MAX_ITEMS = 20;
  var DEFAULTS = [
    '老师讲话时，请保持安静，同学之间不要大声讨论。',
    '上课期间请勿使用手机或佩戴耳机。',
    '如无法按时提交作业，请单独向老师说明原因。',
    '课堂上请使用文明用语，不对老师或同学说粗话。',
  ];

  var state = { items: [], editing: false, draft: [], firstLoad: true };
  var els = {};
  var lastFocus = null;

  // ---------------- 基础工具 ----------------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function toast(msg, type) {
    if (window.ZhiXue && window.ZhiXue.toast) window.ZhiXue.toast(msg, type || 'info');
  }
  function isTeacher() {
    var u = window.ZhiXue && window.ZhiXue.user;
    return !!(u && u.role === 'teacher');
  }
  function call(path, opts) {
    if (window.ZhiXue && window.ZhiXue.api) return window.ZhiXue.api(path, opts);
    return Promise.reject(new Error('未加载 app.js'));
  }
  function clone(arr) {
    return arr.map(function (it) { return { id: it.id, text: it.text }; });
  }
  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var d = JSON.parse(raw);
      return d && Array.isArray(d.items) ? d.items : null;
    } catch (e) { return null; }
  }
  function writeCache(items) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ items: items, at: Date.now() })); } catch (e) {}
  }

  // ---------------- 挂载 DOM ----------------
  function mount() {
    var fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'cr-fab';
    fab.id = 'crFab';
    fab.title = '查看课堂规则';
    fab.innerHTML = '<span class="cr-ico">📋</span><span>课堂规则</span>';

    var overlay = document.createElement('div');
    overlay.className = 'cr-overlay';
    overlay.id = 'crOverlay';
    overlay.innerHTML =
      '<div class="cr-modal" role="dialog" aria-modal="true" aria-labelledby="crTitle">' +
        '<div class="cr-head">' +
          '<h2 id="crTitle">课堂规则</h2>' +
          '<button class="cr-close" id="crClose" type="button" aria-label="关闭">✕</button>' +
        '</div>' +
        '<div class="cr-body" id="crBody"></div>' +
        '<div class="cr-foot" id="crFoot"></div>' +
      '</div>';

    document.body.appendChild(fab);
    document.body.appendChild(overlay);

    els.fab = fab;
    els.overlay = overlay;
    els.body = overlay.querySelector('#crBody');
    els.foot = overlay.querySelector('#crFoot');
    els.close = overlay.querySelector('#crClose');

    fab.addEventListener('click', openModal);
    els.close.addEventListener('click', function () { closeModal(); });
    // 点击遮罩空白处关闭（点到弹窗本体不关）
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(true); });

    // 事件委托：编辑区的上移 / 下移 / 删除 / 添加
    els.body.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-act]') : null;
      if (!b) return;
      var act = b.getAttribute('data-act');
      var i = parseInt(b.getAttribute('data-i'), 10);
      if (act === 'up') move(i, -1);
      else if (act === 'down') move(i, 1);
      else if (act === 'del') del(i);
      else if (act === 'add') add();
    });
    // 实时校验：输入即校验当前行，并把值写回草稿
    els.body.addEventListener('input', function (e) {
      var inp = e.target;
      if (!inp.classList || !inp.classList.contains('cr-input')) return;
      var i = parseInt(inp.getAttribute('data-i'), 10);
      if (isNaN(i) || !state.draft[i]) return;
      state.draft[i].text = inp.value;
      validateRow(i);
    });
    els.body.addEventListener('keydown', function (e) {
      if (!e.target.classList || !e.target.classList.contains('cr-input')) return;
      if (e.key === 'Enter') { e.preventDefault(); save(); }
    });

    els.foot.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-act]') : null;
      if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'edit') enterEdit();
      else if (act === 'cancel') cancelEdit();
      else if (act === 'save') save();
      else if (act === 'add') { if (!state.editing) enterEdit(); add(); }
      else if (act === 'reset') resetDefaults();
      else if (act === 'close') closeModal(true);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !els.overlay.classList.contains('open')) return;
      if (state.editing) cancelEdit();   // 编辑态：Esc 取消并恢复原文案
      else closeModal();
    });
  }

  // ---------------- 数据 ----------------
  function fetchRules() {
    return call(API).then(function (d) {
      if (d && Array.isArray(d.items)) {
        state.items = d.items.map(function (it) { return { id: it.id, text: it.text }; });
        writeCache(state.items);
      }
    }).catch(function () {
      // 未登录 / 网络异常：先用本地缓存，再用内置默认四条
      if (!state.items.length) state.items = readCache() || DEFAULTS.map(function (t) { return { id: '', text: t }; });
    });
  }

  // ---------------- 渲染 ----------------
  function renderBody() {
    if (state.editing) {
      if (!state.draft.length) {
        els.body.innerHTML = '<div class="cr-empty">还没有规则，点击「＋ 添加一条」开始编写。</div>';
        return;
      }
      els.body.innerHTML = '<div class="cr-rows">' + state.draft.map(function (it, i) {
        return '' +
          '<div class="cr-row" data-row="' + i + '">' +
            '<div class="cr-row-main">' +
              '<input class="cr-input" type="text" data-i="' + i + '" maxlength="' + MAX_LEN + '" value="' + esc(it.text) + '" aria-label="第 ' + (i + 1) + ' 条规则内容" />' +
              '<div class="cr-row-err" data-err="' + i + '"></div>' +
            '</div>' +
            '<div class="cr-row-btns">' +
              '<button class="cr-mini" type="button" data-act="up" data-i="' + i + '"' + (i === 0 ? ' disabled' : '') + ' title="上移" aria-label="上移第 ' + (i + 1) + ' 条">↑</button>' +
              '<button class="cr-mini" type="button" data-act="down" data-i="' + i + '"' + (i === state.draft.length - 1 ? ' disabled' : '') + ' title="下移" aria-label="下移第 ' + (i + 1) + ' 条">↓</button>' +
              '<button class="cr-mini del" type="button" data-act="del" data-i="' + i + '" title="删除" aria-label="删除第 ' + (i + 1) + ' 条">✕</button>' +
            '</div>' +
          '</div>';
      }).join('') + '</div>';
      // 渲染后立即校验一遍，让复制进来的重复项立刻标红
      state.draft.forEach(function (_, i) { validateRow(i); });
      return;
    }

    if (!state.items.length) {
      els.body.innerHTML = '<div class="cr-empty">暂无课堂规则' + (isTeacher() ? '，点击「编辑」添加。' : '。') + '</div>';
      return;
    }
    els.body.innerHTML = '<ol class="cr-list">' + state.items.map(function (it, i) {
      return '<li><span class="cr-no">' + (i + 1) + '</span><p>' + esc(it.text) + '</p></li>';
    }).join('') + '</ol>';
  }

  function renderFoot() {
    if (state.editing) {
      els.foot.innerHTML = '' +
        '<button class="cr-btn green" type="button" data-act="save">保存</button>' +
        '<button class="cr-btn ghost" type="button" data-act="cancel">取消</button>' +
        '<button class="cr-btn" type="button" data-act="add">＋ 添加一条</button>' +
        '<span class="cr-spacer"></span>' +
        '<button class="cr-btn pink" type="button" data-act="reset">恢复默认</button>' +
        '<div class="cr-tip" style="flex:1 0 100%">回车保存 · Esc 取消 · 最多 ' + MAX_ITEMS + ' 条，每条 ≤' + MAX_LEN + ' 字</div>';
      return;
    }
    els.foot.innerHTML = '' +
      (isTeacher() ? '<button class="cr-btn" type="button" data-act="edit">✎ 编辑</button>' : '') +
      '<span class="cr-spacer"></span>' +
      '<span class="cr-tip">' + (isTeacher() ? '仅教师可编辑' : '本规则由老师维护') + '</span>' +
      '<button class="cr-btn ghost" type="button" data-act="close">关闭</button>';
  }

  function render() { renderBody(); renderFoot(); }

  // ---------------- 校验 ----------------
  // 返回 { err: '' } 表示该行合法；否则返回错误文案
  function rowError(i) {
    var t = (state.draft[i] ? state.draft[i].text : '').trim();
    if (!t) return { err: '内容不能为空' };
    if (t.length > MAX_LEN) return { err: '超长（≤' + MAX_LEN + ' 字）' };
    for (var k = 0; k < state.draft.length; k++) {
      if (k !== i && (state.draft[k].text || '').trim() === t) return { err: '与第 ' + (k + 1) + ' 条重复' };
    }
    return { err: '' };
  }
  function validateRow(i) {
    var r = rowError(i);
    var row = els.body.querySelector('[data-row="' + i + '"]');
    var errEl = els.body.querySelector('[data-err="' + i + '"]');
    if (errEl) errEl.textContent = r.err;
    if (row) { if (r.err) row.classList.add('bad'); else row.classList.remove('bad'); }
    return !r.err;
  }
  function validateAll() {
    var firstBad = -1;
    for (var i = 0; i < state.draft.length; i++) {
      if (!validateRow(i) && firstBad < 0) firstBad = i;
    }
    return firstBad;
  }

  // ---------------- 编辑操作 ----------------
  function enterEdit() {
    if (!isTeacher()) { toast('仅教师可编辑课堂规则', 'err'); return; }
    state.draft = clone(state.items);
    state.editing = true;
    render();
    var first = els.body.querySelector('.cr-input');
    if (first) first.focus();
  }
  function cancelEdit() {
    state.editing = false;      // 草稿丢弃 → 界面回到原文案
    state.draft = [];
    render();
  }
  function move(i, delta) {
    var j = i + delta;
    if (j < 0 || j >= state.draft.length) return;
    var tmp = state.draft[i];
    state.draft[i] = state.draft[j];
    state.draft[j] = tmp;
    renderBody();
    var next = els.body.querySelector('[data-row="' + j + '"] .cr-input');
    if (next) next.focus();
  }
  function del(i) {
    state.draft.splice(i, 1);
    renderBody();
  }
  function add() {
    if (state.draft.length >= MAX_ITEMS) { toast('最多 ' + MAX_ITEMS + ' 条', 'err'); return; }
    state.draft.push({ id: '', text: '' });
    renderBody();
    var all = els.body.querySelectorAll('.cr-input');
    var last = all[all.length - 1];
    if (last) last.focus();
  }
  function save() {
    if (!isTeacher()) { toast('仅教师可编辑课堂规则', 'err'); return; }
    if (!state.draft.length) {
      // 空列表视为清空规则，需二次确认，避免误删全部
      if (!window.confirm('保存后课堂规则将被清空，确定吗？')) return;
    }
    var bad = validateAll();
    if (bad >= 0) {
      toast('请先修正标红的条目', 'err');
      var el = els.body.querySelector('[data-row="' + bad + '"] .cr-input');
      if (el) el.focus();
      return;
    }
    var payload = state.draft.map(function (it) {
      return { id: it.id || '', text: (it.text || '').trim() };
    });
    var btn = els.foot.querySelector('[data-act="save"]');
    if (btn) { btn.disabled = true; btn.textContent = '保存中'; }
    call(API, { method: 'PUT', body: { items: payload } })
      .then(function (d) {
        state.items = (d && d.items) ? d.items.map(function (it) { return { id: it.id, text: it.text }; })
                                     : payload.map(function (it) { return { id: it.id, text: it.text }; });
        writeCache(state.items);
        state.editing = false;
        state.draft = [];
        render();
        toast('课堂规则已保存', 'ok');
      })
      .catch(function (e) {
        toast(e && e.message ? e.message : '保存失败', 'err');
      })
      .then(function () {
        var b = els.foot.querySelector('[data-act="save"]');
        if (b) { b.disabled = false; b.textContent = '保存'; }
      });
  }
  function resetDefaults() {
    if (!isTeacher()) return;
    if (!window.confirm('恢复为系统默认四条规则？当前内容将被覆盖。')) return;
    call(API + '/reset', { method: 'POST' })
      .then(function (d) {
        state.items = (d && d.items) ? d.items.map(function (it) { return { id: it.id, text: it.text }; }) : DEFAULTS.map(function (t) { return { id: '', text: t }; });
        writeCache(state.items);
        state.editing = false;
        state.draft = [];
        render();
        toast('已恢复默认规则', 'ok');
      })
      .catch(function (e) { toast(e && e.message ? e.message : '恢复失败', 'err'); });
  }

  // ---------------- 开关弹窗 ----------------
  function isDirty() {
    return JSON.stringify(state.draft.map(function (i) { return i.text; })) !==
           JSON.stringify(state.items.map(function (i) { return i.text; }));
  }
  function openModal() {
    lastFocus = document.activeElement;
    els.overlay.classList.add('open');
    document.body.classList.add('cr-locked');
    render();                                   // 先用缓存/默认渲染，保证瞬时可见
    fetchRules().then(function () {
      if (!state.editing) render();             // 拉取完成后刷新（编辑中不打断输入）
    });
    els.close.focus({ preventScroll: true });
  }
  // fromOverlay：由点击遮罩触发时，若编辑中有未保存改动，先确认
  function closeModal(fromOverlay) {
    if (state.editing && isDirty() && fromOverlay) {
      if (!window.confirm('有未保存的修改，确定关闭吗？')) return;
    }
    state.editing = false;
    state.draft = [];
    els.overlay.classList.remove('open');
    document.body.classList.remove('cr-locked');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  // ---------------- 启动 ----------------
  function boot() {
    var cached = readCache();
    if (cached) state.items = cached.map(function (it) { return { id: it.id || '', text: it.text }; });
    mount();
    fetchRules();     // 预取一次，点击时弹窗已是最新内容
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
