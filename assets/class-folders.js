/* 智学平台 · 班级管理（班级文件夹）
 * 模型：每个文件夹对应一个班级，文件夹内为「已归入的文件」列表（指向家长会材料 id）。
 * 交互：左侧「文件库」列出所有已导入的材料（可拖拽），右侧「班级文件夹」为拖放目标；
 *       将文件拖到某个文件夹即完成归类（移动语义：同一文件仅归属一个班级）；
 *       拖回文件库可解除归类；文件夹内的文件也可拖到另一个文件夹实现转移。
 * 复用平台 auth（window.ZhiXue.api / toast）与像素复古视觉令牌。
 */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function api(path, opts) {
    if (window.ZhiXue && window.ZhiXue.api) return window.ZhiXue.api(path, opts);
    return fetch(path, {
      method: (opts && opts.method) || 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: opts && opts.body ? JSON.stringify(opts.body) : undefined,
    }).then(function (r) { return r.json(); });
  }
  function toast(m, t) { if (window.ZhiXue && window.ZhiXue.toast) window.ZhiXue.toast(m, t || 'info'); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function fileLabel(f) { return f.title || f.studentName || f.filename || '未命名'; }

  // 自定义拖拽 MIME：仅接受本功能发起的拖拽，避免把外部拖入的普通文本误当成文件 id
  var DND_MIME = 'application/x-zhixue-file';

  var state = {
    classes: [],
    files: [],
    filter: '',
    dnd: { fid: '', active: false },  // 拖拽进行中：延迟刷新，避免拖拽源节点被重建
    pending: false,                   // 拖拽期间累积的「待刷新」标记
    // ---- 批量整合归档 ----
    selected: new Set(),   // 已选材料 id：按 id 记录，筛选/重渲染后依然保留
    tree: [],              // 文件夹树（班级 + 子文件夹）
    pickTarget: null,      // 当前选中的目标文件夹 {id, name, parentId}
    pickKw: '',            // 文件夹选择器搜索词
    running: false,        // 归档执行中
    lastFailed: [],        // 上一轮失败的材料 id，供「重试失败项」
  };

  function isTeacher() {
    var u = window.ZhiXue && window.ZhiXue.user;
    return !!(u && u.role === 'teacher');
  }

  function openModal() {
    $('classModal').classList.add('show');
    refresh();
  }
  function closeModal() {
    $('classModal').classList.remove('show');
  }

  // 班级顺序稳定化：会话内保持既有顺序（避免拖放后文件夹在光标下跳动），新建的排在最前
  function stableOrder(list) {
    var prev = state.classes.map(function (c) { return c.id; });
    if (!prev.length) return list;
    var known = [], fresh = [];
    list.forEach(function (c) { (prev.indexOf(c.id) >= 0 ? known : fresh).push(c); });
    known.sort(function (a, b) { return prev.indexOf(a.id) - prev.indexOf(b.id); });
    return fresh.concat(known);
  }

  // 一次性拉取「班级 + 文件库」再统一渲染，避免两次渲染造成的状态撕裂（班级已更新、文件名还是旧的）
  function refresh() {
    return Promise.all([api('/api/class-folders'), api('/api/parent-meetings')])
      .then(function (rs) {
        state.classes = stableOrder((rs[0] && rs[0].classes) || []);
        state.files = (rs[1] && rs[1].items) || [];
        renderFolders();
        renderLibrary();
      })
      .catch(function (e) { toast('刷新失败：' + (e.message || e), 'error'); });
  }
  // 某文件已归入的班级 id 列表（本地由 state.classes 推导，无需额外请求）
  function classesOf(fid) {
    return state.classes.filter(function (c) { return (c.files || []).indexOf(fid) >= 0; })
      .map(function (c) { return c.id; });
  }

  // ---- 左侧：文件库（拖拽源 + 批量选择源） ----
  // 当前筛选结果（「全选当前筛选」与批量归档共用同一份口径）
  function filteredFiles() {
    var kw = state.filter.trim().toLowerCase();
    return state.files.filter(function (f) {
      return !kw || fileLabel(f).toLowerCase().indexOf(kw) >= 0;
    });
  }
  function fileById(fid) {
    var hit = null;
    state.files.forEach(function (f) { if (f.id === fid) hit = f; });
    return hit;
  }
  function renderLibrary() {
    var host = $('fileLib');
    var list = filteredFiles();
    $('libCount').textContent = list.length + ' / ' + state.files.length;
    updateSelBar();
    if (!state.files.length) {
      host.innerHTML = '<div class="class-empty-sm">还没有已导入的文件。<br>请先在首页上传家长会材料（Markdown / PDF）。</div>';
      return;
    }
    if (!list.length) {
      host.innerHTML = '<div class="class-empty-sm">没有匹配「' + esc(state.filter) + '」的文件。</div>';
      return;
    }
    host.innerHTML = list.map(function (f) {
      var cids = classesOf(f.id);
      var tags = cids.length
        ? '<span class="fl-tags">' + cids.map(function (id) {
            var c = null;
            state.classes.forEach(function (x) { if (x.id === id) c = x; });
            return '<span class="fl-tag">' + esc(c ? c.name : id) + '</span>';
          }).join('') + '</span>'
        : '<span class="fl-untagged">未归类</span>';
      var on = state.selected.has(f.id) ? ' sel' : '';
      return '<div class="file-card' + on + '" draggable="true" data-fid="' + esc(f.id) + '">' +
        '<span class="fc-cb" aria-hidden="true"></span>' +
        '<span class="fl-badge kind-' + (f.kind === 'pdf' ? 'pdf' : 'md') + '">' + (f.kind === 'pdf' ? 'PDF' : 'MD') + '</span>' +
        '<span class="fl-name" title="' + esc(fileLabel(f)) + '">' + esc(fileLabel(f)) + '</span>' +
        tags +
      '</div>';
    }).join('');
    // 拖拽事件改为在容器上委托（bindDnd），重渲染后无需重新绑定
  }

  // ---- 批量选择（按 id 记录，筛选切换 / 重渲染后依然保留） ----
  function toggleSel(fid) {
    if (state.selected.has(fid)) state.selected.delete(fid);
    else state.selected.add(fid);
    var card = document.querySelector('.file-card[data-fid="' + fid + '"]');
    if (card) card.classList.toggle('sel', state.selected.has(fid));
    updateSelBar();
  }
  function selAllFiltered() {
    var list = filteredFiles();
    if (!list.length) { toast('当前筛选没有可选择的材料', 'info'); return; }
    list.forEach(function (f) { state.selected.add(f.id); });
    renderLibrary();
    updateSelBar();
  }
  function clearSel() {
    state.selected.clear();
    renderLibrary();
    updateSelBar();
  }
  function updateSelBar() {
    var n = state.selected.size;
    if ($('selCount')) $('selCount').textContent = n;
    var btn = $('batchArchiveBtn');
    if (btn) {
      var can = n > 0 && isTeacher() && !state.running;
      btn.disabled = !can;
      btn.title = !isTeacher() ? '仅教师可执行批量归档'
        : (n === 0 ? '请先勾选要归档的材料' : ('把已选 ' + n + ' 份材料归档到目标文件夹'));
    }
    var all = $('selAll');
    if (all) {
      var list = filteredFiles();
      var picked = list.filter(function (f) { return state.selected.has(f.id); }).length;
      all.checked = list.length > 0 && picked === list.length;
      all.indeterminate = picked > 0 && picked < list.length;
    }
  }

  // ---- 右侧：班级文件夹（拖放目标） ----
  function renderFolders() {
    var host = $('classList');
    if (!state.classes.length) {
      host.innerHTML = '<div class="class-empty-sm">还没有班级，先新建一个吧。</div>';
      return;
    }
    host.innerHTML = state.classes.map(function (c) {
      var files = (c.files || []);
      var inner = files.length
        ? files.map(function (fid) {
            var f = state.files.find(function (x) { return x.id === fid; });
            var name = f ? fileLabel(f) : fid;
            return '<div class="cf-file" draggable="true" data-fid="' + esc(fid) + '" title="' + esc(name) + '">' +
              '<span class="cf-fname">' + esc(name) + '</span>' +
              '<button class="cf-rm" data-rm="' + esc(fid) + '" title="移出该班" type="button">×</button>' +
            '</div>';
          }).join('')
        : '<div class="cf-empty">把左侧文件拖到这里归类</div>';
      return '<div class="class-card folder" data-id="' + esc(c.id) + '">' +
        '<div class="cf-head">' +
          '<span class="cn">' + esc(c.name) + '</span>' +
          '<span class="cc">' + files.length + ' 份</span>' +
          '<span class="cx" data-del="' + esc(c.id) + '" title="删除班级">×</span>' +
        '</div>' +
        '<div class="cf-body">' + inner + '</div>' +
      '</div>';
    }).join('');

    host.querySelectorAll('.cf-rm').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var cid = b.closest('.class-card').getAttribute('data-id');
        unassignFile(cid, b.getAttribute('data-rm'));
      });
    });
    host.querySelectorAll('.cf-head .cx').forEach(function (b) {
      b.addEventListener('click', function (e) { e.stopPropagation(); deleteClass(b.getAttribute('data-del')); });
    });
  }

  // ---------------- 拖拽（事件委托 + 自定义 MIME，跨浏览器稳定） ----------------
  // 约定：dragenter 与 dragover 都必须 preventDefault，否则 Firefox / Safari 会判定该区域
  //       不允许放置，drop 事件根本不触发（Chrome 较宽松，故旧代码在 Chrome 下「看起来正常」）。
  // 拖拽源（.file-card / .cf-file）与放置区（#fileLib / .class-card.folder）统一在容器上委托，
  // 这样每次重渲染都不必重新绑定，也不会在拖拽过程中被重建的 DOM 打断。

  function isFileDrag(e) {
    var dt = e.dataTransfer;
    if (!dt || !dt.types) return false;
    return Array.prototype.indexOf.call(dt.types, DND_MIME) >= 0;
  }
  // 读取被拖文件 id：优先自定义 MIME，且必须命中真实存在的材料，杜绝垃圾/外部文本入库
  function readFileId(dt) {
    if (!dt) return '';
    var raw = '';
    try { raw = dt.getData(DND_MIME) || dt.getData('text/plain') || ''; } catch (err) {}
    raw = String(raw || '').trim();
    if (!raw) return '';
    var hit = state.files.some(function (f) { return f.id === raw; });
    return hit ? raw : '';
  }
  // 命中放置区：班级文件夹卡片优先，否则文件库容器
  function zoneOf(e) {
    var t = e.target;
    if (!t || !t.closest) return null;
    var card = t.closest('.class-card.folder');
    if (card) return card;
    if (t.closest('#fileLib')) return $('fileLib');
    return null;
  }
  // 高亮当前放置区（dragover 持续触发，天然消除跨子元素时的闪烁）
  function highlight(zone) {
    var on = document.querySelectorAll('.drop-over');
    Array.prototype.forEach.call(on, function (el) { if (el !== zone) el.classList.remove('drop-over'); });
    if (zone) zone.classList.add('drop-over');
  }
  function clearHighlight() { highlight(null); }

  function onDragStart(e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-fid]') : null;
    if (!el) return;
    var fid = el.getAttribute('data-fid') || '';
    try {
      e.dataTransfer.setData(DND_MIME, fid);
      e.dataTransfer.setData('text/plain', fid);
    } catch (err) {}
    e.dataTransfer.effectAllowed = 'move';
    state.dnd.fid = fid;
    state.dnd.active = true;
    el.classList.add('dragging');
    document.body.classList.add('dnd-active');
  }
  function onDragEnd() {
    state.dnd.active = false;
    state.dnd.fid = '';
    document.body.classList.remove('dnd-active');
    clearHighlight();
    var on = document.querySelectorAll('.dragging');
    Array.prototype.forEach.call(on, function (el) { el.classList.remove('dragging'); });
    // 拖拽期间累积的变更，在此统一刷新（此时拖拽源已安全释放）
    if (state.pending) { state.pending = false; refresh(); }
  }
  function onZoneOver(e) {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    highlight(zoneOf(e));
  }
  function onZoneLeave(e) {
    var host = e.currentTarget;
    // 仍在同一容器内（跨子元素移动）时不清除，交由随后的 dragover 重新高亮
    if (e.relatedTarget && host.contains(e.relatedTarget)) return;
    clearHighlight();
  }
  function onZoneDrop(e) {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    var zone = zoneOf(e);
    clearHighlight();
    var fid = readFileId(e.dataTransfer);
    if (!fid || !zone) return;
    if (zone.id === 'fileLib') unassignAll(fid);
    else assignTo(zone, fid);
  }

  function bindDnd() {
    [$('fileLib'), $('classList')].forEach(function (host) {
      if (!host) return;
      host.addEventListener('dragstart', onDragStart);
      host.addEventListener('dragend', onDragEnd);
      host.addEventListener('dragenter', onZoneOver);
      host.addEventListener('dragover', onZoneOver);
      host.addEventListener('dragleave', onZoneLeave);
      host.addEventListener('drop', onZoneDrop);
    });
    // 拖出整个弹窗 / 在页面空白处松手时，也要清理高亮与状态
    document.addEventListener('dragend', function () { if (state.dnd.active) onDragEnd(); });
    document.addEventListener('drop', function (e) {
      if (state.dnd.active && !zoneOf(e)) { clearHighlight(); }
    });
  }

  function classById(id) {
    var hit = null;
    state.classes.forEach(function (c) { if (c.id === id) hit = c; });
    return hit;
  }
  // 归入班级（拖放到文件夹卡片）
  function assignTo(card, fid) {
    var cid = card.getAttribute('data-id') || '';
    if (!cid) return;
    var c = classById(cid);
    var name = c ? c.name : '该班级';
    // 已在同班视为无操作，避免无意义请求与「假成功」提示
    if (c && (c.files || []).indexOf(fid) >= 0) { toast('该文件已在「' + name + '」', 'info'); return; }
    api('/api/class-folders/' + cid + '/files', { method: 'POST', body: { fileIds: [fid] } })
      .then(function () { afterChange('已归入「' + name + '」'); })
      .catch(function (e) { toast('归类失败：' + (e.message || e), 'error'); });
  }
  function unassignFile(classId, fid) {
    api('/api/class-folders/' + classId + '/files/' + encodeURIComponent(fid), { method: 'DELETE' })
      .then(function () { afterChange('已移出该班'); })
      .catch(function (e) { toast('移出失败：' + (e.message || e), 'error'); });
  }
  function unassignAll(fid) {
    var cids = classesOf(fid);
    if (!cids.length) { toast('该文件尚未归类', 'info'); return; }
    Promise.all(cids.map(function (cid) {
      return api('/api/class-folders/' + cid + '/files/' + encodeURIComponent(fid), { method: 'DELETE' });
    }))
      .then(function () { afterChange('已解除归类'); })
      .catch(function (e) { toast('解除失败：' + (e.message || e), 'error'); });
  }
  function afterChange(msg) {
    toast(msg, 'success');
    // 拖拽尚未结束时推迟刷新：若此刻重建 DOM，正在被拖动的节点会被销毁，
    // dragend 不再触发，残留 .dragging / 高亮状态，后续拖拽随即错乱。
    if (state.dnd.active) { state.pending = true; return; }
    refresh();
  }

  function createClass() {
    var name = $('classNameInput').value.trim();
    if (!name) { toast('请输入班级名称', 'error'); return; }
    api('/api/class-folders', { method: 'POST', body: { name: name } })
      .then(function (d) {
        state.classes.unshift(d.class);
        $('classNameInput').value = '';
        renderFolders();
        toast('已创建班级：' + name, 'success');
      })
      .catch(function (e) { toast('创建失败：' + (e.message || e), 'error'); });
  }
  function deleteClass(id) {
    var c = state.classes.find(function (x) { return x.id === id; });
    if (!confirm('确定删除班级「' + (c ? c.name : '') + '」？归入该班的文件将一并解除归类。')) return;
    api('/api/class-folders/' + id, { method: 'DELETE' })
      .then(function () {
        state.classes = state.classes.filter(function (x) { return x.id !== id; });
        renderFolders();
        toast('已删除班级', 'success');
      })
      .catch(function (e) { toast('删除失败：' + (e.message || e), 'error'); });
  }

  // ============================================================
  //  批量整合归档
  //  流程：勾选材料 → 选目标文件夹（可搜索 / 新建子文件夹）→ 处理同名冲突 → 归档 → 结果汇总（可重试）
  // ============================================================
  function showArchiveErr(msg) {
    var el = $('archiveErr');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
  }
  function setProgress(pct, text) {
    if ($('apFill')) $('apFill').style.width = Math.max(0, Math.min(100, Math.round(pct))) + '%';
    if ($('apText')) $('apText').textContent = text;
  }
  function selectedFiles() {
    var out = [];
    state.files.forEach(function (f) { if (state.selected.has(f.id)) out.push(f); });
    return out;
  }

  function openArchiveModal() {
    if (!isTeacher()) { toast('仅教师可执行批量归档', 'error'); return; }
    if (!state.selected.size) { toast('请先勾选要归档的材料', 'info'); return; }
    $('archiveModal').classList.add('show');
    $('archiveErr').classList.remove('show');
    $('archiveProgress').style.display = 'none';
    $('archiveResult').style.display = 'none';
    if ($('retryBtn')) $('retryBtn').style.display = 'none';
    state.pickKw = '';
    if ($('folderFilter')) $('folderFilter').value = '';
    state.pickTarget = null;
    renderPickList();
    loadTree();
  }
  function closeArchiveModal() {
    if (state.running) { toast('归档进行中，请稍候…', 'info'); return; }
    $('archiveModal').classList.remove('show');
  }

  function loadTree() {
    if ($('folderPicker')) $('folderPicker').innerHTML = '<div class="class-empty-sm">加载中…</div>';
    api('/api/class-folders/tree')
      .then(function (d) {
        state.tree = (d && d.tree) || [];
        renderPicker();
        updateConfirm();
      })
      .catch(function (e) { showArchiveErr('加载文件夹失败：' + ((e && e.message) || e)); });
  }

  function renderPicker() {
    var host = $('folderPicker');
    if (!host) return;
    var kw = state.pickKw.trim().toLowerCase();
    var rows = [];
    state.tree.forEach(function (c) {
      var selfHit = !kw || String(c.name).toLowerCase().indexOf(kw) >= 0;
      var kids = (c.children || []).filter(function (s) {
        return !kw || String(s.name).toLowerCase().indexOf(kw) >= 0;
      });
      if (selfHit) rows.push({ id: c.id, name: c.name, parentId: null, fileCount: c.fileCount, level: 0 });
      kids.forEach(function (s) {
        rows.push({ id: s.id, name: s.name, parentId: c.id, fileCount: s.fileCount, level: 1 });
      });
    });
    if (!state.tree.length) {
      host.innerHTML = '<div class="class-empty-sm">还没有班级，请先在班级管理里新建一个。</div>';
      return;
    }
    if (!rows.length) {
      host.innerHTML = '<div class="class-empty-sm">没有匹配「' + esc(state.pickKw) + '」的文件夹。</div>';
      return;
    }
    host.innerHTML = rows.map(function (r) {
      var on = state.pickTarget && state.pickTarget.id === r.id ? ' on' : '';
      return '<button class="fp-row lv' + r.level + on + '" type="button" data-folder="' + esc(r.id) + '">' +
        '<span class="fp-ico">' + (r.level ? '📁' : '🗂') + '</span>' +
        '<span class="fp-name">' + esc(r.name) + '</span>' +
        '<span class="fp-meta">' + (r.fileCount || 0) + ' 份</span>' +
        '<span class="fp-check">✓</span>' +
      '</button>';
    }).join('');
  }

  function renderPickList() {
    var host = $('pickList');
    if (!host) return;
    var files = selectedFiles();
    if ($('pickCount')) $('pickCount').textContent = files.length;
    if (!files.length) {
      host.innerHTML = '<div class="class-empty-sm">还没有勾选材料。</div>';
      updateConfirm();
      return;
    }
    host.innerHTML = files.map(function (f) {
      return '<div class="pl-item">' +
        '<span class="pl-badge kind-' + (f.kind === 'pdf' ? 'pdf' : 'md') + '">' + (f.kind === 'pdf' ? 'PDF' : 'MD') + '</span>' +
        '<span class="pl-name" title="' + esc(fileLabel(f)) + '">' + esc(fileLabel(f)) + '</span>' +
        '<button class="pl-rm" type="button" data-rm="' + esc(f.id) + '" title="取消这一条">×</button>' +
      '</div>';
    }).join('');
    updateConfirm();
  }

  // 同名冲突：目标文件夹里已存在展示名相同的材料
  function conflictsFor(tid) {
    var t = null;
    state.classes.forEach(function (c) { if (c.id === tid) t = c; });
    if (!t) return [];
    var existing = {};
    (t.files || []).forEach(function (fid) {
      var f = fileById(fid);
      if (f) existing[fileLabel(f)] = true;
    });
    var out = [];
    selectedFiles().forEach(function (f) { if (existing[fileLabel(f)]) out.push(f); });
    return out;
  }
  function updateConflictTip() {
    var tip = $('conflictTip');
    if (!tip) return;
    if (!state.pickTarget) { tip.textContent = '请先选择目标文件夹'; tip.className = 'conflict-tip'; return; }
    var cs = conflictsFor(state.pickTarget.id);
    if (!cs.length) { tip.textContent = '未检测到同名冲突'; tip.className = 'conflict-tip ok'; return; }
    tip.className = 'conflict-tip warn';
    tip.textContent = '检测到 ' + cs.length + ' 项同名：' +
      cs.slice(0, 3).map(function (f) { return fileLabel(f); }).join('、') + (cs.length > 3 ? ' 等' : '');
  }
  function updateConfirm() {
    var btn = $('archiveConfirm');
    if (btn) btn.disabled = !(state.pickTarget && state.selected.size && isTeacher() && !state.running);
    updateConflictTip();
  }

  // 分批处理：每批 5 条，既给出真实进度，也便于单批失败时精确定位
  function runArchive(ids) {
    if (!state.pickTarget) { showArchiveErr('请选择目标文件夹'); return; }
    if (!ids || !ids.length) { showArchiveErr('没有待归档的材料'); return; }
    var el = document.querySelector('input[name="conflict"]:checked');
    var conflict = el ? el.value : 'rename';
    var targetId = state.pickTarget.id;

    state.running = true;
    $('archiveErr').classList.remove('show');
    $('archiveResult').style.display = 'none';
    $('archiveProgress').style.display = 'block';
    if ($('retryBtn')) $('retryBtn').style.display = 'none';
    updateConfirm(); updateSelBar();
    setProgress(0, '准备中…');

    var CHUNK = 5;
    var batches = [];
    for (var i = 0; i < ids.length; i += CHUNK) batches.push(ids.slice(i, i + CHUNK));
    var done = 0, all = [];

    function step(k) {
      if (k >= batches.length) { finish(all); return; }
      setProgress((done / ids.length) * 100, '正在归档 ' + Math.min(done + CHUNK, ids.length) + ' / ' + ids.length + '…');
      api('/api/class-folders/' + targetId + '/archive', {
        method: 'POST', body: { fileIds: batches[k], conflict: conflict },
      }).then(function (d) {
        (d.results || []).forEach(function (r) { all.push(r); });
        done += batches[k].length;
        step(k + 1);
      }).catch(function (e) {
        // 整批失败（网络 / 权限）→ 逐条记为失败，保证结果可展示、可重试
        batches[k].forEach(function (fid) {
          all.push({ fileId: fid, ok: false, action: 'error', reason: (e && e.message) || '请求失败' });
        });
        done += batches[k].length;
        step(k + 1);
      });
    }
    step(0);
  }

  function finish(results) {
    state.running = false;
    setProgress(100, '完成');
    var ok = results.filter(function (r) { return r.ok; });
    var bad = results.filter(function (r) { return !r.ok; });
    state.lastFailed = bad.map(function (r) { return r.fileId; });

    var host = $('archiveResult');
    var html = '<div class="ar-sum">' +
      '<span class="ar-ok">成功 <b>' + ok.length + '</b></span>' +
      '<span class="ar-bad' + (bad.length ? '' : ' zero') + '">失败 <b>' + bad.length + '</b></span>' +
    '</div>';
    if (bad.length) {
      html += '<div class="ar-fail"><div class="ar-fail-h">失败明细</div>' + bad.map(function (r) {
        var f = fileById(r.fileId);
        return '<div class="ar-fail-row"><span class="nm">' + esc(f ? fileLabel(f) : r.fileId) + '</span>' +
          '<span class="why">' + esc(r.reason || '未知原因') + '</span></div>';
      }).join('') + '</div>';
    }
    host.innerHTML = html;
    host.style.display = 'block';
    if ($('retryBtn')) $('retryBtn').style.display = bad.length ? '' : 'none';

    refresh();
    if (!bad.length) {
      clearSel();
      toast('已归档 ' + ok.length + ' 份材料', 'success');
    } else {
      toast('成功 ' + ok.length + ' 项，失败 ' + bad.length + ' 项', 'error');
    }
    updateConfirm(); updateSelBar();
  }

  // 在「选中的班级」下新建子文件夹（若当前选中的是子文件夹，则在其所属班级下新建）
  function createSub() {
    var name = ($('newSubInput').value || '').trim();
    if (!name) { showArchiveErr('请输入子文件夹名称'); return; }
    var parentId = state.pickTarget ? (state.pickTarget.parentId || state.pickTarget.id) : '';
    if (!parentId) { showArchiveErr('请先选中一个班级，再新建子文件夹'); return; }
    api('/api/class-folders', { method: 'POST', body: { name: name, parentId: parentId } })
      .then(function (d) {
        $('newSubInput').value = '';
        // 清空搜索词并直接选中新文件夹：否则它可能被过滤条件挡住，看起来像「点了没反应」
        state.pickKw = '';
        if ($('folderFilter')) $('folderFilter').value = '';
        var nc = d && d.class;
        if (nc) state.pickTarget = { id: nc.id, name: nc.name, parentId: nc.parentId || null };
        toast('已新建子文件夹：' + name, 'success');
        loadTree();
        refresh();
      })
      .catch(function (e) { showArchiveErr('新建失败：' + ((e && e.message) || e)); });
  }

  function bind() {
    // 页面未包含班级管理弹窗时直接跳过，避免空引用报错
    if (!$('classModal')) return;
    var btn = $('classManageBtn');
    if (btn) btn.addEventListener('click', openModal);
    $('classClose').addEventListener('click', closeModal);
    $('classModal').addEventListener('click', function (e) { if (e.target.id === 'classModal') closeModal(); });
    $('classCreate').addEventListener('click', createClass);
    $('classNameInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') createClass(); });
    $('libFilter').addEventListener('input', function (e) { state.filter = e.target.value; renderLibrary(); });
    // ---- 批量选择 / 批量整合归档 ----
    $('selAll').addEventListener('change', function (e) {
      if (e.target.checked) selAllFiltered(); else clearSel();
    });
    $('batchArchiveBtn').addEventListener('click', openArchiveModal);
    // 点击文件卡片即勾选/取消（拖拽不会触发 click，二者互不干扰）
    $('fileLib').addEventListener('click', function (e) {
      var card = e.target.closest('.file-card');
      if (card) toggleSel(card.getAttribute('data-fid'));
    });
    $('archiveClose').addEventListener('click', closeArchiveModal);
    $('archiveCancel').addEventListener('click', closeArchiveModal);
    $('archiveModal').addEventListener('click', function (e) {
      if (e.target.id === 'archiveModal') closeArchiveModal();
    });
    $('folderFilter').addEventListener('input', function (e) { state.pickKw = e.target.value; renderPicker(); });
    $('folderPicker').addEventListener('click', function (e) {
      var row = e.target.closest('.fp-row');
      if (!row) return;
      var id = row.getAttribute('data-folder');
      var hit = null;
      state.tree.forEach(function (c) {
        if (c.id === id) hit = { id: c.id, name: c.name, parentId: null };
        (c.children || []).forEach(function (s) {
          if (s.id === id) hit = { id: s.id, name: s.name, parentId: c.id };
        });
      });
      state.pickTarget = hit;
      renderPicker();
      updateConfirm();
    });
    $('newSubBtn').addEventListener('click', createSub);
    $('newSubInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') createSub(); });
    // 已选清单：逐条取消
    $('pickList').addEventListener('click', function (e) {
      var rm = e.target.closest('[data-rm]');
      if (!rm) return;
      state.selected.delete(rm.getAttribute('data-rm'));
      renderLibrary();
      renderPickList();
      if (!state.selected.size) closeArchiveModal();
    });
    Array.prototype.forEach.call(document.querySelectorAll('input[name="conflict"]'), function (r) {
      r.addEventListener('change', updateConflictTip);
    });
    $('archiveConfirm').addEventListener('click', function () {
      runArchive(Array.from(state.selected));
    });
    $('retryBtn').addEventListener('click', function () {
      if (!state.lastFailed.length) { toast('没有可重试的失败项', 'info'); return; }
      runArchive(state.lastFailed.slice());
    });
    bindDnd();
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && $('classModal').classList.contains('show')) closeModal();
    });
  }

  if (document.readyState !== 'loading') bind();
  else document.addEventListener('DOMContentLoaded', bind);
})();
