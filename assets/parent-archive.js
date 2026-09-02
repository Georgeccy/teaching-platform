/* 智学平台 · 家长会「两级归档导航」
 * 班级层（网格）→ 学生层（列表）→ 学生资料详情，全程面包屑 + 返回上级 + 浏览器前进/后退。
 *
 * 数据模型说明：平台没有独立的学生名册实体，
 *   学生 = 某班级（含其子文件夹）已归档资料中出现的姓名，由后端 /students 接口派生；
 *   「学号」取学生账号的 username，未开通账号的显示「—」。
 * 与 parent-meeting.js 通过自定义事件解耦（不直接调用其内部函数）：
 *   archive → parent-meeting : zhixue:archive-open-material {id}
 *   parent-meeting → archive : zhixue:material-opened       {id}
 */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function api(path, opts) {
    if (window.ZhiXue && window.ZhiXue.api) return window.ZhiXue.api(path, opts);
    return fetch(path, {
      method: (opts && opts.method) || 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: opts && opts.body ? JSON.stringify(opts.body) : undefined,
    }).then(function (r) { return r.json(); });
  }
  function toast(m, t) { if (window.ZhiXue && window.ZhiXue.toast) window.ZhiXue.toast(m, t || 'info'); }
  function isTeacher() {
    var u = window.ZhiXue && window.ZhiXue.user;
    return !!(u && u.role === 'teacher');
  }

  var state = {
    mode: 'archive',     // 'archive' | 'flat'
    classId: '',         // 空 = 班级层；有值 = 学生层
    className: '',
    student: null,       // 当前学生对象（含 materials）
    doc: false,          // 是否正在查看资料详情
    tree: [],
    students: [],
    kw: '',
    loading: false,
    error: '',
    noPerm: !isTeacher(),
    currentId: '',       // 当前打开的材料 id
  };

  // ---------------- 路由 ----------------
  function params() { return new URLSearchParams(window.location.search); }
  function pushUrl(updates, replace) {
    var p = params();
    Object.keys(updates || {}).forEach(function (k) {
      var v = updates[k];
      if (v === null || v === undefined || v === '') p.delete(k);
      else p.set(k, v);
    });
    var qs = p.toString();
    var url = window.location.pathname + (qs ? '?' + qs : '');
    try {
      if (replace) window.history.replaceState({ zx: 1 }, '', url);
      else window.history.pushState({ zx: 1 }, '', url);
    } catch (e) {}
  }

  // ---------------- 导航动作 ----------------
  function goClasses() {
    state.classId = ''; state.className = '';
    state.student = null; state.doc = false; state.kw = '';
    $('avSearch').value = '';
    pushUrl({ view: 'archive', class: null, student: null });
    render();
    loadTree();
  }
  function goClass(c) {
    state.classId = c.id; state.className = c.name;
    state.student = null; state.doc = false; state.kw = '';
    $('avSearch').value = '';
    pushUrl({ view: 'archive', class: c.id, student: null });
    render();
    loadStudents(c.id);
  }
  // 点击学生 → 直达其最近一份资料（班级列表到资料详情共 2 次点击）
  function goStudent(st) {
    state.student = st; state.doc = true;
    pushUrl({ view: 'archive', class: state.classId, student: st.name });
    render();
    openMaterial(st.latestId || (st.materials && st.materials[0] && st.materials[0].id) || '');
  }
  function goBack() {
    if (state.doc) {                       // 资料详情 → 回到对应列表
      state.doc = false; state.student = null;
      pushUrl({ view: 'archive', class: state.classId || null, student: null });
      render();
      return;
    }
    if (state.classId) goClasses();        // 学生层 → 班级层
  }
  function switchMode(mode) {
    state.mode = mode;
    pushUrl({ view: mode === 'flat' ? 'flat' : 'archive' });
    if (mode === 'flat') { state.doc = true; }
    else if (!state.classId) { state.doc = false; }
    render();
  }

  // ---------------- 数据 ----------------
  function loadTree() {
    if (state.noPerm) { render(); return; }
    state.loading = true; state.error = ''; render();
    api('/api/class-folders/tree')
      .then(function (d) {
        state.tree = (d && d.tree) || [];
        state.loading = false;
        render();
      })
      .catch(function (e) {
        state.loading = false;
        state.error = (e && e.message) || '加载失败';
        if (/403|无权限/.test(state.error)) state.noPerm = true;
        render();
      });
  }
  function loadStudents(cid) {
    if (state.noPerm) { render(); return; }
    state.loading = true; state.error = ''; render();
    api('/api/class-folders/' + encodeURIComponent(cid) + '/students')
      .then(function (d) {
        state.students = (d && d.students) || [];
        if (d && d.class && d.class.name) state.className = d.class.name;
        state.loading = false;
        // URL 带 student 时（直接进 / 前进后退）自动定位到该学生
        var want = params().get('student');
        if (want) {
          var hit = state.students.filter(function (s) { return s.name === want; })[0];
          if (hit) { state.student = hit; state.doc = true; }
        }
        render();
        if (state.student && state.doc) {
          openMaterial(state.student.latestId || (state.student.materials[0] || {}).id || '');
        }
      })
      .catch(function (e) {
        state.loading = false;
        state.error = (e && e.message) || '加载失败';
        if (/403|无权限/.test(state.error)) state.noPerm = true;
        render();
      });
  }
  function openMaterial(id) {
    if (!id) { toast('该学生暂无可查看的资料', 'info'); return; }
    state.currentId = id;
    document.dispatchEvent(new CustomEvent('zhixue:archive-open-material', { detail: { id: id } }));
  }

  // ---------------- 渲染 ----------------
  function render() {
    var main = document.querySelector('.parent-main');
    if (!main) return;
    var inArchive = state.mode === 'archive';
    main.classList.toggle('archiving', inArchive);
    main.classList.toggle('at-doc', inArchive && state.doc);

    // 面包屑
    $('archiveCrumb').style.display = inArchive ? 'flex' : 'none';
    if (inArchive) $('acPath').innerHTML = crumbHtml();

    // 列表区（班级层 / 学生层）仅在「未查看资料详情」时显示
    var showList = inArchive && !state.doc;
    $('archiveView').style.display = showList ? 'block' : 'none';
    $('archiveMat').style.display = (inArchive && state.doc && state.student && state.student.materials.length > 1) ? 'flex' : 'none';
    if (showList) $('avBody').innerHTML = bodyHtml();
    if (inArchive && state.doc && state.student) renderMatChips();

    // 顶部标签
    Array.prototype.forEach.call(document.querySelectorAll('#viewTabs .vt'), function (b) {
      b.classList.toggle('active', b.getAttribute('data-view') === state.mode);
    });

    // 标题 / 搜索框占位
    if (state.classId) {
      $('avTitle').textContent = state.className || '班级';
      $('avSearch').placeholder = '搜索学生姓名…';
    } else {
      $('avTitle').textContent = '班级';
      $('avSearch').placeholder = '搜索班级名称…';
    }
    $('acBack').disabled = !(inArchive && (state.doc || state.classId));
  }

  function crumbHtml() {
    var html = '';
    var last = state.doc && state.student ? 'student' : (state.classId ? 'class' : 'root');
    html += '<li class="ac-item' + (last === 'root' && !state.classId ? ' active' : '') + '">' +
      '<button type="button" class="ac-link" data-go="root">家长会</button></li>';
    if (state.classId) {
      html += '<li class="ac-sep">›</li>';
      html += '<li class="ac-item' + (last === 'class' ? ' active' : '') + '">' +
        '<button type="button" class="ac-link" data-go="class">' + esc(state.className || '班级') + '</button></li>';
    }
    if (state.doc && state.student) {
      html += '<li class="ac-sep">›</li>';
      html += '<li class="ac-item active"><span class="ac-cur">' + esc(state.student.name) + '</span></li>';
    }
    return html;
  }

  function bodyHtml() {
    if (state.noPerm) {
      return '<div class="av-state perm"><div class="pixel">LOCKED</div>' +
        '<p>归档浏览仅<b>教师账号</b>可查看。<br>请使用教师账号登录后进入。</p></div>';
    }
    if (state.error && !state.loading) {
      return '<div class="av-state err"><div class="pixel">ERROR</div><p>' + esc(state.error) + '</p>' +
        '<button class="av-retry" type="button" data-act="retry">重试</button></div>';
    }
    if (state.loading && !state.tree.length && !state.students.length) {
      return '<div class="av-state loading"><div class="av-spin"></div>加载中…</div>';
    }
    return state.classId ? studentsHtml() : classesHtml();
  }

  function classesHtml() {
    var kw = state.kw.trim().toLowerCase();
    var list = state.tree.filter(function (c) {
      return !kw || String(c.name).toLowerCase().indexOf(kw) >= 0;
    });
    $('avSub').textContent = list.length + ' / ' + state.tree.length + ' 个班级';
    if (!state.tree.length) {
      return '<div class="av-state"><div class="pixel">EMPTY</div>' +
        '<p>还没有班级。<br>请先在「📁 班级管理」中新建班级，并把家长会材料归档进去。</p></div>';
    }
    if (!list.length) {
      return '<div class="av-state"><div class="pixel">NO RESULT</div>' +
        '<p>没有匹配「' + esc(state.kw) + '」的班级。</p></div>';
    }
    return '<div class="av-grid">' + list.map(function (c) {
      return '<button class="cls-card" type="button" data-cid="' + esc(c.id) + '">' +
        '<span class="cc-icon">🗂</span>' +
        '<span class="cc-name" title="' + esc(c.name) + '">' + esc(c.name) + '</span>' +
        '<span class="cc-stats">' +
          '<span class="st"><b>' + (c.studentCount || 0) + '</b> 学生</span>' +
          '<span class="st"><b>' + (c.fileCount || 0) + '</b> 份资料</span>' +
          (c.children && c.children.length ? '<span class="st"><b>' + c.children.length + '</b> 子文件夹</span>' : '') +
        '</span>' +
        '<span class="cc-go">进入 ›</span>' +
      '</button>';
    }).join('') + '</div>';
  }

  function studentsHtml() {
    var kw = state.kw.trim().toLowerCase();
    var list = state.students.filter(function (s) {
      return !kw || String(s.name).toLowerCase().indexOf(kw) >= 0 ||
        (s.username && String(s.username).toLowerCase().indexOf(kw) >= 0);
    });
    $('avSub').textContent = list.length + ' / ' + state.students.length + ' 位学生';
    if (!state.students.length) {
      return '<div class="av-state"><div class="pixel">EMPTY</div>' +
        '<p>该班级还没有已归档的家长会材料。<br>在「📁 班级管理」中把材料拖入该班级后，学生会自动出现在这里。</p></div>';
    }
    if (!list.length) {
      return '<div class="av-state"><div class="pixel">NO RESULT</div>' +
        '<p>没有匹配「' + esc(state.kw) + '」的学生。</p></div>';
    }
    return '<div class="av-list">' + list.map(function (s) {
      var initial = esc(String(s.name || '?').slice(0, 1));
      var sid = s.username ? esc(s.username) : '—';
      var latest = s.latestDate || '—';
      var badge = s.status === 'updated'
        ? '<span class="sr-badge ok">已更新</span>'
        : '<span class="sr-badge warn">待更新</span>';
      return '<button class="stu-row" type="button" data-sname="' + esc(s.name) + '">' +
        '<span class="sr-av">' + initial + '</span>' +
        '<span class="sr-main">' +
          '<span class="sr-name">' + esc(s.name) + '</span>' +
          '<span class="sr-meta">学号 ' + sid + ' · 最近 ' + esc(latest) + ' · ' + (s.materialCount || 0) + ' 份资料</span>' +
        '</span>' +
        badge +
        '<span class="sr-go">›</span>' +
      '</button>';
    }).join('') + '</div>';
  }

  function renderMatChips() {
    var st = state.student;
    $('archiveMat').innerHTML = '<span class="am-label">' + esc(st.name) + ' 的资料</span>' +
      st.materials.map(function (m) {
        var on = m.id === state.currentId ? ' on' : '';
        return '<button class="am-chip' + on + '" type="button" data-mid="' + esc(m.id) + '" title="' + esc(m.title) + '">' +
          esc(m.date || '无日期') + ' · ' + (m.kind === 'pdf' ? 'PDF' : 'MD') + '</button>';
      }).join('');
  }

  // ---------------- 事件 ----------------
  function bind() {
    var tabs = $('viewTabs');
    if (tabs) {
      tabs.addEventListener('click', function (e) {
        var b = e.target.closest('.vt');
        if (b) switchMode(b.getAttribute('data-view'));
      });
    }
    $('acBack').addEventListener('click', goBack);
    $('acPath').addEventListener('click', function (e) {
      var b = e.target.closest('.ac-link');
      if (!b) return;
      var go = b.getAttribute('data-go');
      if (go === 'root') goClasses();
      else if (go === 'class') { state.doc = false; state.student = null; pushUrl({ student: null }); render(); }
    });
    // 列表点击（事件委托）
    $('avBody').addEventListener('click', function (e) {
      var cls = e.target.closest('.cls-card');
      if (cls) {
        var cid = cls.getAttribute('data-cid');
        var c = state.tree.filter(function (x) { return x.id === cid; })[0];
        if (c) goClass(c);
        return;
      }
      var row = e.target.closest('.stu-row');
      if (row) {
        var nm = row.getAttribute('data-sname');
        var s = state.students.filter(function (x) { return x.name === nm; })[0];
        if (s) goStudent(s);
        return;
      }
      if (e.target.closest('[data-act="retry"]')) {
        if (state.classId) loadStudents(state.classId); else loadTree();
      }
    });
    // 学生资料切换
    $('archiveMat').addEventListener('click', function (e) {
      var chip = e.target.closest('.am-chip');
      if (!chip) return;
      state.currentId = chip.getAttribute('data-mid');
      renderMatChips();
      openMaterial(state.currentId);
    });
    // 搜索（防抖）
    var t = null;
    $('avSearch').addEventListener('input', function (e) {
      var v = e.target.value;
      if (t) clearTimeout(t);
      t = setTimeout(function () { state.kw = v; render(); }, 160);
    });
    $('avClear').addEventListener('click', function () {
      $('avSearch').value = ''; state.kw = ''; render(); $('avSearch').focus();
    });
    // 浏览器前进 / 后退
    window.addEventListener('popstate', function () { syncFromUrl(); });
    // 名册里的显式点击 → 切到资料详情（保留当前面包屑层级）
    document.addEventListener('zhixue:roster-open-material', function (e) {
      var id = e.detail && e.detail.id;
      if (!id) return;
      state.currentId = id;
      if (state.mode !== 'archive') return;
      state.doc = true;
      render();
    });
    // 任何材料被打开（含首屏自动选中）→ 仅同步当前 id 与切换条，不擅自切换层级，
    // 否则首屏自动选中会把归档导航顶到资料详情，班级层永远看不到。
    document.addEventListener('zhixue:material-opened', function (e) {
      var id = e.detail && e.detail.id;
      if (!id) return;
      state.currentId = id;
      if (state.mode === 'archive' && state.doc && state.student) renderMatChips();
    });
    // Esc：从资料详情退回列表
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && state.mode === 'archive' && state.doc && !$('docReader').classList.contains('show')) goBack();
    });
  }

  function syncFromUrl() {
    var p = params();
    var view = p.get('view');
    var cid = p.get('class') || '';
    var sname = p.get('student') || '';
    state.mode = view === 'flat' ? 'flat' : 'archive';
    if (state.mode === 'flat') { render(); return; }

    if (!cid) {
      if (state.classId || state.doc) { state.classId = ''; state.className = ''; state.student = null; state.doc = false; }
      render();
      if (!state.tree.length && !state.noPerm) loadTree();
      return;
    }
    if (cid !== state.classId) {
      state.classId = cid; state.className = ''; state.student = null; state.doc = false;
      render();
      loadStudents(cid);   // 载入后按 URL 的 student 自动定位
      return;
    }
    // 同一班级内切换：仅同步「是否查看资料 / 查看哪位学生」
    if (sname) {
      var hit = state.students.filter(function (s) { return s.name === sname; })[0];
      if (hit) { state.student = hit; state.doc = true; render(); openMaterial(hit.latestId || (hit.materials[0] || {}).id || ''); return; }
    }
    state.student = null; state.doc = false;
    render();
  }

  function init() {
    if (!$('archiveView')) return;
    bind();
    syncFromUrl();
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
