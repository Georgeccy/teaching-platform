/* 智学平台 · 家长会呈现界面
 * - 自包含 Markdown 解析器（零依赖），输出仿 PDF 报告样式的 HTML
 * - 学生名册 / 文档展示 / 上传 / 删除（教师权限）
 * - 与平台共享 auth（window.ZhiXue.user / ZhiXue.api）与主题（polish.js 自动接管 #themeBtn）
 */
(function () {
  'use strict';

  // ============================================================
  //  Markdown 解析器
  //  支持：# 标题（h1-h4）、GFM 表格、bullet/numbered 列表、引用块（>）、分隔线（---）、
  //        行内 **bold** / *italic* / `code` / [link]() / ![image]()、fenced code。
  //  扩展：
  //    · 表格中「每个单元格都整段加粗」的行自动标记为 .hl（高亮行，对应 PDF 综合结论行）
  //    · 引用块（> ...）内每行渲染为独立段落，便于多行提示框
  // ============================================================

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  // 行内格式化：要求在已经过 escapeHtml 的字符串上调用（code/link/image 内部内容再 escape 一次）
  function renderInline(text) {
    // 0) 删除线 ~~text~~（最先处理，避免被其它规则吞掉）
    text = text.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    // 1) 行内代码（保护内容，不再被后续规则处理）
    text = text.replace(/`([^`]+)`/g, function (_, code) {
      return '<code>' + escapeHtml(code) + '</code>';
    });
    // 2) 图片
    text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, function (_, alt, src) {
      return '<img src="' + escapeHtml(src) + '" alt="' + escapeHtml(alt) + '" />';
    });
    // 3) 链接
    text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, label, href) {
      var safe = escapeHtml(href);
      // 站内相对链接直接放行；其它加 target=_blank
      var ext = /^https?:\/\//.test(href) || safe.indexOf('//') === 0;
      return '<a href="' + safe + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + escapeHtml(label) + '</a>';
    });
    // 4) 加粗 **...** 与 __...__
    text = text.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__([^_\n]+)__/g, '<strong>$1</strong>');
    // 5) 斜体 *...* 与 _..._
    text = text.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    text = text.replace(/(^|[^\w])_([^_\n]+)_(?![\w_])/g, '$1<em>$2</em>');
    return text;
  }

  // 解析表格的一行：返回 trim 后的单元格数组
  function splitCells(line) {
    var s = line.trim();
    // 去掉首尾的 |（如有），然后按 | 切分
    if (s.charAt(0) === '|') s = s.slice(1);
    if (s.charAt(s.length - 1) === '|') s = s.slice(0, -1);
    return s.split('|').map(function (c) { return c.trim(); });
  }

  function isTableSeparator(line) {
    var t = line.trim();
    if (!/\|/.test(t)) return false;
    if (!/---/.test(t)) return false;
    return /^\|?[\s\-:|]+\|?$/.test(t);
  }

  function allCellsFullyBold(cells) {
    if (!cells.length) return false;
    return cells.every(function (c) {
      var t = c.replace(/<[^>]+>/g, '').trim();
      return /^\*\*[^*].*[^*]\*\*$/.test(t) || /^\*\*[^*]+\*\*$/.test(t);
    });
  }

  // 由表格分隔行推断每列对齐方式
  function alignOf(c) {
    c = (c || '').trim();
    var left = c.charAt(0) === ':';
    var right = c.charAt(c.length - 1) === ':';
    if (left && right) return 'center';
    if (right) return 'right';
    if (left) return 'left';
    return '';
  }
  function renderTable(headerCells, rowLines, aligns) {
    aligns = aligns || headerCells.map(function () { return ''; });
    var clsFor = function (i) { var a = aligns[i]; return a ? ' class="' + a + '"' : ''; };
    var thead = '<thead><tr>' +
      headerCells.map(function (c, i) { return '<th' + clsFor(i) + '>' + renderInline(escapeHtml(c)) + '</th>'; }).join('') +
      '</tr></thead>';
    var rows = rowLines.map(function (line) {
      var cells = splitCells(line);
      var hl = allCellsFullyBold(cells);
      var trCls = hl ? ' class="hl"' : '';
      return '<tr' + trCls + '>' +
        cells.map(function (c, i) { return '<td' + clsFor(i) + '>' + renderInline(escapeHtml(c)) + '</td>'; }).join('') +
        '</tr>';
    }).join('');
    return '<div class="doc-table-wrap"><table class="doc-table">' + thead + '<tbody>' + rows + '</tbody></table></div>';
  }

  // GitHub 风格提示框：[!NOTE] / [!TIP] / [!WARNING] / [!IMPORTANT] / [!CAUTION]
  var ADMON = { NOTE: 'info', INFO: 'info', TIP: 'tip', SUCCESS: 'tip', HINT: 'tip', WARNING: 'warn', CAUTION: 'danger', DANGER: 'danger', IMPORTANT: 'important' };
  function renderBlockquote(text) {
    var raw = text.trim();
    var adm = raw.match(/^\[!([A-Za-z]+)\]\s*([\s\S]*)$/);
    if (adm) {
      var type = ADMON[adm[1].toUpperCase()] || 'info';
      var label = adm[1].toUpperCase();
      var body = adm[2].trim();
      var inner = body.split('\n').filter(Boolean).map(function (l) {
        return '<p>' + renderInline(escapeHtml(l)) + '</p>';
      }).join('');
      return '<div class="doc-callout callout-' + type + '">' +
        '<div class="co-head">' + label + '</div>' +
        '<div class="co-body">' + inner + '</div></div>';
    }
    // 每行渲染为独立段落（保留换行视觉）
    var lines = text.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
    var inner2 = lines.map(function (l) {
      return '<p>' + renderInline(escapeHtml(l)) + '</p>';
    }).join('');
    return '<blockquote class="doc-quote">' + inner2 + '</blockquote>';
  }

  function renderList(items, ordered) {
    var tag = ordered ? 'ol' : 'ul';
    var lis = items.map(function (it) {
      return '<li>' + renderInline(escapeHtml(it)) + '</li>';
    }).join('');
    return '<' + tag + '>' + lis + '</' + tag + '>';
  }

  function renderCodeBlock(lang, content) {
    var label = lang ? '<div class="doc-code-lang">' + escapeHtml(lang) + '</div>' : '';
    return '<div class="doc-code">' + label + '<pre><code>' + escapeHtml(content) + '</code></pre></div>';
  }

  function renderHeading(level, text) {
    var safe = renderInline(escapeHtml(text));
    return '<h' + level + ' class="doc-h' + level + '">' + safe + '</h' + level + '>';
  }

  // 识别列表项标记（支持 - * + • 与 1. 2) 等），返回 { indent, ordered, content }
  function matchListItem(line, minIndent) {
    var m = line.match(/^(\s*)([-*+•]|\d+[.)])\s+(.*)$/);
    if (!m) return null;
    if (m[1].length < minIndent) return null;
    return { indent: m[1].length, ordered: /\d/.test(m[2]), content: m[3] };
  }
  // 任务清单：- [ ] / - [x]
  function isTaskItem(content) {
    var m = content.match(/^\[([ xX])\]\s+(.*)$/);
    return m ? { checked: m[1].toLowerCase() === 'x', text: m[2] } : null;
  }
  // 递归解析列表（同一缩进层级为同列项；更深缩进为嵌套子列表；支持任务清单）
  function parseList(lines, start, baseIndent) {
    var first = matchListItem(lines[start], baseIndent);
    if (!first) return null;
    var ordered = first.ordered;
    var itemIndent = first.indent;
    var items = [];
    var i = start;
    while (i < lines.length) {
      if (lines[i].trim() === '') { i++; continue; }   // 跳过空行（松散列表项间隔）
      var mm = matchListItem(lines[i], baseIndent);
      if (!mm || mm.indent !== itemIndent) break;        // 同级不同缩进 / 非标记 → 列表结束
      var content = mm.content;
      i++;
      var contLines = [];
      var childHtml = '';
      var childDone = false;
      while (i < lines.length) {
        if (lines[i].trim() === '') break;               // 空行结束本项续行收集
        var childM = matchListItem(lines[i], itemIndent + 1);
        if (childM) {                                    // 更深缩进的标记 → 嵌套子列表
          var sub = parseList(lines, i, itemIndent + 1);
          childHtml += sub.html; i = sub.nextIndex; childDone = true;
          break;
        }
        if (matchListItem(lines[i], itemIndent)) break;  // 同级下一个列表项 → 结束本项（交回外层处理）
        var cIndent = (lines[i].match(/^\s*/) || [''])[0].length;
        if (cIndent > itemIndent) { contLines.push(lines[i].slice(itemIndent)); i++; }
        else if (cIndent === itemIndent) { contLines.push(lines[i].trim()); i++; }
        else break;
      }
      var inner = renderInline(escapeHtml(content));
      var tail = contLines.join('\n');
      if (tail) inner += ' ' + renderInline(escapeHtml(tail));
      if (childDone && childHtml) inner += childHtml;
      var task = isTaskItem(content);
      if (task) {
        items.push('<li class="doc-task"><label><input type="checkbox" disabled' + (task.checked ? ' checked' : '') + '><span>' + inner + '</span></label></li>');
      } else {
        items.push('<li>' + inner + '</li>');
      }
    }
    var tag = ordered ? 'ol' : 'ul';
    return { html: '<' + tag + ' class="doc-list">' + items.join('') + '</' + tag + '>', nextIndex: i };
  }

  function parseMarkdown(md) {
    if (typeof md !== 'string' || !md) return '';
    md = md.replace(/\r\n/g, '\n');
    var lines = md.split('\n');
    var blocks = [];
    var i = 0;

    while (i < lines.length) {
      var line = lines[i];

      // 跳过纯空行
      if (!line.trim()) { i++; continue; }

      // Fenced code block ```...```
      if (/^```/.test(line)) {
        var lang = line.replace(/^```/, '').trim();
        var content = '';
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) {
          content += (content ? '\n' : '') + lines[i];
          i++;
        }
        if (i < lines.length) i++; // 跳过闭合 ```
        blocks.push({ type: 'code', lang: lang, content: content });
        continue;
      }

      // 表格：当前行像表头，下一行是分隔线（分隔行同时决定列对齐）
      if (/\|/.test(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
        var headerCells = splitCells(line);
        var sepCells = splitCells(lines[i + 1]);
        var aligns = sepCells.map(alignOf);
        i += 2;
        var rowLines = [];
        while (i < lines.length && lines[i].trim() && /\|/.test(lines[i]) && !/^```/.test(lines[i])) {
          rowLines.push(lines[i]);
          i++;
        }
        blocks.push({ type: 'table', header: headerCells, rows: rowLines, aligns: aligns });
        continue;
      }

      // 水平线 --- / *** / ___
      if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
        blocks.push({ type: 'hr' });
        i++;
        continue;
      }

      // 标题 # - ####
      var hm = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
      if (hm) {
        blocks.push({ type: 'h', level: Math.min(hm[1].length, 4), text: hm[2] });
        i++;
        continue;
      }

      // 引用块 > （连续多行合并）
      if (/^>\s?/.test(line)) {
        var buf = [];
        while (i < lines.length && (/^>\s?/.test(lines[i]) || (lines[i].trim() === '' && i + 1 < lines.length && /^>\s?/.test(lines[i + 1])))) {
          buf.push(lines[i].replace(/^>\s?/, ''));
          i++;
        }
        blocks.push({ type: 'quote', text: buf.join('\n') });
        continue;
      }

      // 列表（有序 / 无序，支持嵌套与任务清单）
      if (matchListItem(line, 0)) {
        var lst = parseList(lines, i, 0);
        blocks.push({ type: 'listhtml', html: lst.html });
        i = lst.nextIndex;
        continue;
      }

      // 段落：合并到下一个空行/块起始
      var para = line;
      i++;
      while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|>\s?|---\s*$|\s*[-*+•]\s|\s*\d+\.\s|```)/.test(lines[i])) {
        para += '\n' + lines[i];
        i++;
      }
      blocks.push({ type: 'p', text: para });
    }

    // 渲染
    return blocks.map(function (b) {
      switch (b.type) {
        case 'h':        return renderHeading(b.level, b.text);
        case 'p':        return '<p>' + renderInline(escapeHtml(b.text)) + '</p>';
        case 'ul':       return renderList(b.items, false);
        case 'ol':       return renderList(b.items, true);
        case 'quote':    return renderBlockquote(b.text);
        case 'code':     return renderCodeBlock(b.lang, b.content);
        case 'hr':       return '<hr class="doc-hr" />';
        case 'table':    return renderTable(b.header, b.rows, b.aligns);
        case 'listhtml': return b.html;
      }
      return '';
    }).join('\n');
  }

  // ============================================================
  //  状态与 API
  // ============================================================
  var state = {
    items: [],
    currentId: null,
    user: null,
    isTeacher: false,
    queue: [],            // 批量上传队列：{ id, file, kind, status, progress, error, title, item }
    currentPdfUrl: '',     // 当前 PDF 预览地址（含 token），供沉浸式阅读复用
    currentPdfName: '',
    selected: new Set(),   // 多选模式下的选中 id 集合
    multiMode: false,      // 是否处于多选模式
    currentItem: null,     // 当前正在查看的家长会材料（供全屏阅读复用）
    readerZoom: 1.2,       // 全屏阅读内容缩放：默认放大，统一适用于 Markdown 与 PDF
    readerZoomEl: null,    // 当前阅读内容元素（article / iframe），用于应用 zoom
  };

  function $(id) { return document.getElementById(id); }
  function authHeader() {
    var zx = window.ZhiXue;
    if (zx && zx.token) return { 'Authorization': 'Bearer ' + zx.token };
    return {};
  }
  function api(path, opts) {
    var zx = window.ZhiXue;
    if (zx && zx.api) return zx.api(path, opts);
    // 兜底直接 fetch（无 token）
    return fetch(path, {
      method: (opts && opts.method) || 'GET',
      headers: Object.assign({ 'Content-Type': 'application/json' }, authHeader()),
      body: opts && opts.body ? JSON.stringify(opts.body) : undefined,
    }).then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || ('HTTP ' + r.status)); return d; }); });
  }
  function toast(msg, type) { if (window.ZhiXue && window.ZhiXue.toast) window.ZhiXue.toast(msg, type || 'info'); }

  // ============================================================
  //  列表 & 文档
  // ============================================================
  function loadList() {
    api('/api/parent-meetings')
      .then(function (d) {
        state.items = (d && d.items) || [];
        renderList();
        // 自动选中第一份（保持上次选中也行，但简单起见每次进首页都选第一份）
        if (state.items.length) {
          // 若 URL 带 ?id= 则选中指定
          var qid = new URLSearchParams(window.location.search).get('id');
          var pick = qid ? state.items.find(function (it) { return it.id === qid; }) : state.items[0];
          if (!pick) pick = state.items[0];
          selectItem(pick.id);
        } else {
          showEmpty();
        }
      })
      .catch(function (e) {
        $('studentList').innerHTML = '<div class="student-empty">加载失败：' + escapeHtml(e.message || String(e)) + '</div>';
        showEmpty('加载失败：' + (e.message || String(e)));
      });
  }

  function renderList() {
    var host = $('studentList');
    if (!state.items.length) {
      host.innerHTML = '<div class="student-empty">还没有家长会材料。<br/>点击下方按钮上传第一份。</div>';
      return;
    }
    host.innerHTML = state.items.map(function (it) {
      var active = it.id === state.currentId ? ' active' : '';
      var sel = state.selected.has(it.id) ? ' sel' : '';
      var initials = (it.studentName || '?').slice(0, 1);
      var date = it.date || '';
      var kind = it.kind === 'pdf' ? 'PDF' : 'MD';
      return '<button class="student-card' + active + sel + '" data-id="' + escapeHtml(it.id) + '" type="button">' +
        '<span class="cb" data-cb="' + escapeHtml(it.id) + '"></span>' +
        '<span class="av">' + escapeHtml(initials) + '</span>' +
        '<span class="meta">' +
          '<div class="name">' + escapeHtml(it.studentName || '未命名') + '</div>' +
          '<div class="date">' + escapeHtml(date) + '</div>' +
        '</span>' +
        '<span class="kind-badge kind-' + (it.kind === 'pdf' ? 'pdf' : 'md') + '">' + kind + '</span>' +
        '<span class="x" title="删除" data-del="' + escapeHtml(it.id) + '">×</span>' +
      '</button>';
    }).join('');
  }

  function selectItem(id) {
    state.currentId = id;
    // 更新 URL ?id=（便于分享/刷新保留）
    try {
      var u = new URL(window.location.href);
      u.searchParams.set('id', id);
      window.history.replaceState({}, '', u.toString());
    } catch (e) {}
    // 更新名册 active
    [].forEach.call(document.querySelectorAll('.student-card'), function (el) {
      el.classList.toggle('active', el.getAttribute('data-id') === id);
    });
    // 加载并渲染
    $('docEmpty').style.display = 'none';
    $('docToolbar').style.display = 'none';
    $('docPaper').style.display = 'none';
    $('docPdf').style.display = 'none';
    $('docPdf').innerHTML = '';
    $('openPdfBtn').style.display = 'none';
    $('openMdTabBtn').style.display = 'none';
    $('docLoading').style.display = 'block';
    $('docLoading').textContent = '加载中…';
    $('crumbName').textContent = '加载中…';
    // 通知归档导航：已进入资料详情（用于同步面包屑与列表显隐）
    try { document.dispatchEvent(new CustomEvent('zhixue:material-opened', { detail: { id: id } })); } catch (e) {}
    api('/api/parent-meetings/' + encodeURIComponent(id))
      .then(function (d) {
        var it = d && d.item;
        if (!it) throw new Error('材料不存在');
        renderDocument(it);
      })
      .catch(function (e) {
        $('docLoading').textContent = '';
        $('docLoading').style.display = 'none';
        showEmpty('加载失败：' + (e.message || String(e)));
      });
  }

  function renderDocument(item) {
    state.currentItem = item;
    $('docLoading').style.display = 'none';
    $('docEmpty').style.display = 'none';
    $('docToolbar').style.display = 'flex';
    $('docTitle').textContent = item.studentName || '未命名学生';
    $('docDate').textContent = item.date || '--';
    $('crumbName').textContent = item.studentName || '未命名';
    // 全屏阅读按钮：Markdown 与 PDF 均支持
    $('viewReaderBtn').style.display = 'flex';
    $('viewReaderBtn').onclick = function () { openReader(); };
    // 「在新标签页打开」按钮：仅 Markdown 显示（PDF 走原生预览的新标签）
    $('openMdTabBtn').style.display = (item.kind === 'pdf') ? 'none' : 'flex';
    $('openMdTabBtn').onclick = function () { openMarkdownInNewTab(item); };

    if (item.kind === 'pdf') {
      // PDF：直接交给浏览器原生 PDF 预览，不做任何解析/文本提取。
      // iframe 子资源请求不会自动带上 Authorization 头，故把登录 token 作为
      // query 参数附带（后端 getToken 已支持 ?token=），否则浏览器预览会 401。
      var tk = (window.ZhiXue && window.ZhiXue.token) ? encodeURIComponent(window.ZhiXue.token) : '';
      var url = '/api/parent-meetings/' + encodeURIComponent(item.id) + '/file' + (tk ? '?token=' + tk : '');
      state.currentPdfUrl = url;
      state.currentPdfName = item.studentName || '';
      $('docPaper').style.display = 'none';
      $('docPdf').style.display = 'block';
      // 内联预览：去掉多余说明条，PDF 直接占满，控件收进顶部工具条（新标签 / 全屏）
      $('docPdf').innerHTML =
        '<iframe class="doc-pdf-frame" src="' + url + '" title="PDF 预览：' + escapeHtml(item.studentName || '') + '"></iframe>';
      $('openPdfBtn').style.display = 'flex';
      $('openPdfBtn').onclick = function () { window.open(url, '_blank', 'noopener'); };
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    // Markdown：解析为报告样式
    $('docPdf').style.display = 'none';
    $('docPdf').innerHTML = '';
    $('openPdfBtn').style.display = 'none';
    $('docPaper').style.display = 'block';
    $('docPaper').innerHTML = parseMarkdown(item.content || '');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  // ---------------- 在新标签页打开 Markdown（独立自包含 HTML，保持同名样式） ----------------
  async function openMarkdownInNewTab(item) {
    var md = parseMarkdown(item.content || '');
    var css = '';
    try {
      var r1 = await fetch('assets/shell.css'); if (r1.ok) css += await r1.text();
      var r2 = await fetch('assets/parent-meeting.css'); if (r2.ok) css += await r2.text();
    } catch (e) { css = ''; }
    var title = item.studentName || '家长会材料';
    var page =
      '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' + escapeHtml(title) + '</title><style>' + css + '</style></head>' +
      '<body style="margin:0;background:#F4ECD8;padding:24px 14px;display:block;">' +
      '<article class="doc-paper" style="margin:0 auto;">' + md + '</article>' +
      '</body></html>';
    var blob = new Blob([page], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener');
    setTimeout(function () { try { URL.revokeObjectURL(url); } catch (e) {} }, 60000);
  }

  // ---------------- 全屏阅读模式（Markdown / PDF 通用，类似 PDF viewer 全屏） ----------------
  function openReader() {
    var item = state.currentItem;
    if (!item) return;
    var ov = $('docReader');
    var body = $('docReaderBody');
    var contentEl = null;
    body.innerHTML = '';
    body.scrollTop = 0;
    $('readerTitle').textContent = item.studentName || '未命名学生';
    $('readerDate').textContent = item.date || '';

    if (item.kind === 'pdf') {
      // PDF：复用带 token 的预览地址，内嵌 iframe（原生 PDF 阅读器自行滚动，天然铺满）
      var tk = (window.ZhiXue && window.ZhiXue.token) ? encodeURIComponent(window.ZhiXue.token) : '';
      var url = '/api/parent-meetings/' + encodeURIComponent(item.id) + '/file' + (tk ? '?token=' + tk : '');
      $('readerNewtab').href = url;
      $('readerNewtab').onclick = null;
      $('readerNewtab').style.display = '';
      $('readerFillBtn').style.display = 'none';   // 铺满切换仅对 Markdown 有意义
      ov.classList.remove('fill');
      var fr = document.createElement('iframe');
      fr.className = 'doc-reader-frame';
      fr.src = url;
      fr.title = 'PDF 阅读：' + (item.studentName || '');
      contentEl = fr;
      body.appendChild(fr);
    } else {
      // Markdown：解析结果进入阅读面板，默认铺满全屏（无多余边距），可一键切换边距
      $('readerNewtab').style.display = '';
      $('readerNewtab').removeAttribute('href');
      $('readerNewtab').onclick = function (e) { e.preventDefault(); openMarkdownInNewTab(item); };
      $('readerFillBtn').style.display = '';
      $('readerFillBtn').title = '退出铺满（恢复边距）';
      ov.classList.add('fill');
      var art = document.createElement('article');
      art.className = 'doc-paper doc-reader-paper';
      art.innerHTML = parseMarkdown(item.content || '');
      contentEl = art;
      body.appendChild(art);
    }
    // 内容缩放：统一放大 Markdown / PDF（默认 1.2 倍，进入全屏铺满即更清晰、铺满全屏空间）
    state.readerZoomEl = contentEl;
    if (contentEl) contentEl.style.zoom = state.readerZoom;
    updateZoomLabel();
    ov.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  function closeReader() {
    var ov = $('docReader');
    if (!ov.classList.contains('show')) return;
    ov.classList.remove('show');
    $('docReaderBody').innerHTML = '';   // 释放 iframe（停止 PDF 网络请求）
    state.readerZoomEl = null;
    document.body.style.overflow = '';
    if (document.fullscreenElement) { try { document.exitFullscreen(); } catch (e) {} }
  }
  // ---------------- 阅读区缩放（统一适用 Markdown 与 PDF） ----------------
  function updateZoomLabel() {
    var el = $('readerZoomLabel');
    if (el) el.textContent = Math.round(state.readerZoom * 100) + '%';
  }
  function applyZoom() {
    if (state.readerZoomEl) state.readerZoomEl.style.zoom = state.readerZoom;
    updateZoomLabel();
  }
  function changeZoom(delta) {
    // 步长 10%，范围 50%–250%
    var next = Math.round((state.readerZoom + delta) * 100) / 100;
    state.readerZoom = Math.min(2.5, Math.max(0.5, next));
    applyZoom();
  }
  // 系统级全屏（浏览器原生 Fullscreen API，可选增强；失败不影响覆盖层全屏）
  function toggleNativeFs() {
    var ov = $('docReader');
    if (!ov.classList.contains('show')) return;
    if (!document.fullscreenElement) {
      var fn = ov.requestFullscreen || ov.webkitRequestFullscreen || ov.mozRequestFullScreen;
      if (fn) { try { fn.call(ov); } catch (e) { toast('当前浏览器不支持系统全屏'); } }
      else toast('当前浏览器不支持系统全屏');
    } else {
      var ex = document.exitFullscreen || document.webkitExitFullscreen;
      if (ex) { try { ex.call(document); } catch (e) {} }
    }
  }

  function showEmpty(msg) {
    $('docLoading').style.display = 'none';
    $('docPaper').style.display = 'none';
    $('docPdf').style.display = 'none';
    $('docPdf').innerHTML = '';
    $('openPdfBtn').style.display = 'none';
    $('docToolbar').style.display = 'none';
    $('docEmpty').style.display = 'block';
    $('crumbName').textContent = '未选择';
    if (msg) {
      $('docEmpty').innerHTML = '<div class="pixel">ERROR</div><p>' + escapeHtml(msg) + '</p>';
    } else {
      $('docEmpty').innerHTML = '<div class="pixel">EMPTY</div><p>从左侧选择一位学生，或上传一份新的家长会材料。</p>';
    }
  }

  // ============================================================
  //  上传
  // ============================================================
  // ============================================================
  //  批量上传（多选 + 逐文件进度 + 错误处理）
  // ============================================================
  var Q_STATUS = { queued: '待上传', uploading: '上传中', done: '已完成', error: '失败' };

  function openUploadModal() {
    $('uploadModal').classList.add('show');
    $('uploadErr').classList.remove('show');
    $('titleInput').value = '';
    state.queue = [];
    renderQueue();
    $('uploadConfirm').disabled = true;
    $('uploadConfirm').textContent = '上传';
  }
  function closeUploadModal() {
    $('uploadModal').classList.remove('show');
    state.queue = [];
  }
  function validateFile(file) {
    var isMd = (/\.md$/i.test(file.name) || file.type === 'text/markdown');
    var isPdf = (/\.pdf$/i.test(file.name) || file.type === 'application/pdf' || (file.type || '').indexOf('pdf') !== -1);
    if (!isMd && !isPdf) return '仅支持 .md / .pdf 文件';
    if (isMd && file.size > 2 * 1024 * 1024) return 'Markdown 文件过大（>2MB）';
    if (isPdf && file.size > 30 * 1024 * 1024) return 'PDF 文件过大（>30MB）';
    return null;
  }
  function detectKind(file) {
    return (/\.pdf$/i.test(file.name) || (file.type || '').indexOf('pdf') !== -1) ? 'pdf' : 'md';
  }
  function handleFileSelect(files) {
    if (!files || !files.length) return;
    var title = $('titleInput').value.trim();
    [].forEach.call(files, function (file) {
      // 去重：同名同大小视为同一文件
      if (state.queue.some(function (q) { return q.file.name === file.name && q.file.size === file.size; })) return;
      var err = validateFile(file);
      state.queue.push({
        id: 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        file: file,
        kind: detectKind(file),
        status: err ? 'error' : 'queued',
        progress: 0,
        error: err || '',
        skip: !!err,          // 校验失败（类型/大小）不可上传，仅展示错误，不进入上传队列
        title: title,         // 可选的统一标题（留空则回退到原始文件名）
        name: file.name.replace(/\.[^.]+$/, ''), // 原始文件名（去扩展名）→ 作为展示标题与 studentName
        item: null,
      });
    });
    renderQueue();
  }
  function removeQueueItem(id) {
    state.queue = state.queue.filter(function (q) { return q.id !== id; });
    renderQueue();
  }
  function clearQueue() {
    state.queue = [];
    renderQueue();
  }
  function formatSize(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1024 / 1024).toFixed(2) + ' MB';
  }
  function showUploadErr(msg) {
    var el = $('uploadErr');
    el.textContent = msg;
    el.classList.add('show');
  }
  function renderQueue() {
    var host = $('fileQueue');
    var clearBtn = $('fileQueueClear');
    if (!state.queue.length) {
      host.style.display = 'none'; host.innerHTML = '';
      clearBtn.style.display = 'none';
      $('uploadConfirm').disabled = true;
      return;
    }
    host.style.display = 'block';
    clearBtn.style.display = 'inline-block';
    host.innerHTML = state.queue.map(function (it) {
      var pct = it.status === 'done' ? 100 : (it.progress || 0);
      var barCls = it.status === 'error' ? ' err' : (it.status === 'done' ? ' done' : '');
      var showBar = (it.status === 'uploading' || it.status === 'done' || it.status === 'error');
      var errTxt = it.status === 'error' ? '<div class="fq-err">' + escapeHtml(it.error) + '</div>' : '';
      var stTxt = Q_STATUS[it.status] + (it.status === 'uploading' ? ' ' + pct + '%' : '');
      return '<div class="file-queue-item st-' + it.status + '">' +
        '<span class="badge kind-' + (it.kind === 'pdf' ? 'pdf' : 'md') + '">' + (it.kind === 'pdf' ? 'PDF' : 'MD') + '</span>' +
        '<span class="name">' + escapeHtml(it.file.name) + '</span>' +
        '<span class="size">' + formatSize(it.file.size) + '</span>' +
        '<span class="status">' + stTxt + '</span>' +
        '<button class="remove" type="button" data-rm="' + it.id + '" title="移除">×</button>' +
        (showBar ? '<div class="fq-progress"><div class="fq-bar' + barCls + '" style="width:' + pct + '%"></div></div>' : '') +
        errTxt +
      '</div>';
    }).join('');
    var hasPending = state.queue.some(function (q) { return q.status === 'queued' || (q.status === 'error' && !q.skip); });
    $('uploadConfirm').disabled = !hasPending;
  }

  // 单文件上传（XHR 以支持上传进度反馈）
  function readAsText(file) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(String(fr.result || '')); };
      fr.onerror = function () { reject(new Error('读取文件失败')); };
      fr.readAsText(file, 'utf-8');
    });
  }
  function readAsDataURL(file) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(String(fr.result || '')); };
      fr.onerror = function () { reject(new Error('读取文件失败')); };
      fr.readAsDataURL(file);
    });
  }
  function authBearer() {
    var zx = window.ZhiXue;
    return (zx && zx.token) ? 'Bearer ' + zx.token : '';
  }
  function uploadOne(item, onProgress) {
    return new Promise(function (resolve, reject) {
      var file = item.file;
      var send = function (payload, url) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        var auth = authBearer();
        if (auth) xhr.setRequestHeader('Authorization', auth);
        xhr.upload.onprogress = function (e) {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText)); } catch (e) { resolve({}); }
          } else {
            var msg = '上传失败';
            try { var d = JSON.parse(xhr.responseText); msg = d.error || msg; } catch (e2) {}
            reject(new Error(msg + ' (HTTP ' + xhr.status + ')'));
          }
        };
        xhr.onerror = function () { reject(new Error('网络错误，上传中断')); };
        xhr.send(JSON.stringify(payload));
      };
      // 展示标题以「原始文件名（去扩展名）」为准，确保与用户所选文件一致；
      // 若用户在弹窗中填了统一标题则优先采用（批量场景下为可选覆盖）。
      var displayName = item.title || item.name || guessNameFromFilename(file.name);
      if (item.kind === 'pdf') {
        readAsDataURL(file).then(function (dataUrl) {
          onProgress(2);
          send({ filename: file.name, dataUrl: dataUrl, title: displayName, studentName: displayName }, '/api/parent-meetings/pdf');
        }).catch(reject);
      } else {
        readAsText(file).then(function (content) {
          onProgress(2);
          send({ content: content, title: displayName, studentName: displayName }, '/api/parent-meetings');
        }).catch(reject);
      }
    });
  }

  // 批量上传：逐个上传队列中的文件，单文件失败不中断其余，进度/错误逐条反馈
  function startUpload() {
    var btn = $('uploadConfirm');
    var todo = state.queue.filter(function (q) { return q.status === 'queued' || (q.status === 'error' && !q.skip); });
    if (!todo.length) { $('uploadConfirm').disabled = true; return; }
    todo.forEach(function (q) { q.status = 'queued'; q.progress = 0; q.error = ''; });
    btn.disabled = true;
    btn.textContent = '上传中…';
    renderQueue();

    var step = function (i) {
      if (i >= todo.length) {
        var ok = state.queue.filter(function (q) { return q.status === 'done'; }).length;
        var errs = state.queue.filter(function (q) { return q.status === 'error' && !q.skip; }).length;
        btn.textContent = errs ? '重试失败项' : '上传';
        $('uploadErr').classList.remove('show');
        api('/api/parent-meetings').then(function (dd) {
          state.items = (dd && dd.items) || [];
          renderList();
          var firstOk = state.queue.find(function (q) { return q.status === 'done' && q.item; });
          if (firstOk && firstOk.item) selectItem(firstOk.item.id);
          else if (state.items.length) selectItem(state.items[0].id);
        });
        if (errs === 0) { closeUploadModal(); toast('已上传 ' + ok + ' 份材料', 'success'); }
        else { showUploadErr(ok + ' 份成功，' + errs + ' 份失败（可移除或重试）'); toast(ok + ' 份成功，' + errs + ' 份失败', 'error'); }
        return;
      }
      var item = todo[i];
      item.status = 'uploading'; item.progress = 0; renderQueue();
      uploadOne(item, function (p) { item.progress = p; renderQueue(); })
        .then(function (d) {
          item.status = 'done'; item.progress = 100; item.item = (d && d.item) || null;
          renderQueue(); step(i + 1);
        })
        .catch(function (e) {
          item.status = 'error'; item.error = (e && e.message) || '上传失败';
          renderQueue(); step(i + 1); // 单文件失败不中断其余
        });
    };
    step(0);
  }

  // 从文件名推测学生姓名（与后端一致：取扩展名前、首个非姓名分隔符前的中英文字符段）
  function guessNameFromFilename(filename) {
    if (!filename) return '未命名学生';
    var base = filename.replace(/\.[^.]+$/, '').trim();
    var m = base.match(/^[^\s_·\-]+/);
    return (m ? m[0] : base).slice(0, 24) || '未命名学生';
  }

  // ============================================================
  //  删除
  // ============================================================
  function confirmDelete(id) {
    var item = state.items.find(function (it) { return it.id === id; });
    var name = item ? item.studentName : '该学生';
    if (!confirm('确定删除「' + name + '」的家长会材料？此操作不可撤销。')) return;
    api('/api/parent-meetings/' + encodeURIComponent(id), { method: 'DELETE' })
      .then(function () {
        toast('已删除', 'success');
        state.items = state.items.filter(function (it) { return it.id !== id; });
        renderList();
        if (state.currentId === id) {
          state.currentId = null;
          if (state.items.length) {
            selectItem(state.items[0].id);
          } else {
            showEmpty();
            $('studentList').innerHTML = '<div class="student-empty">还没有家长会材料。<br/>点击下方按钮上传第一份。</div>';
          }
        }
      })
      .catch(function (e) { toast('删除失败：' + (e.message || String(e)), 'error'); });
  }

  // ============================================================
  //  批量删除（多选模式）
  // ============================================================
  function toggleMultiMode() {
    state.multiMode = !state.multiMode;
    document.body.classList.toggle('multi', state.multiMode);
    $('multiToggle').textContent = state.multiMode ? '✓ 退出多选' : '☐ 多选删除';
    if (!state.multiMode) state.selected.clear();
    renderList();
    updateBatchBar();
  }
  function toggleSelect(id) {
    if (state.selected.has(id)) state.selected.delete(id);
    else state.selected.add(id);
    var card = document.querySelector('.student-card[data-id="' + id + '"]');
    if (card) card.classList.toggle('sel', state.selected.has(id));
    updateBatchBar();
  }
  function selectAll() {
    state.items.forEach(function (it) { state.selected.add(it.id); });
    renderList();
    updateBatchBar();
  }
  function clearSel() {
    state.selected.clear();
    renderList();
    updateBatchBar();
  }
  function updateBatchBar() {
    var bar = $('batchBar');
    if (!state.multiMode) { bar.style.display = 'none'; return; }
    bar.style.display = 'flex';
    $('batchCount').textContent = state.selected.size;
    $('batchDelete').disabled = state.selected.size === 0;
  }
  function deleteSelected() {
    if (!state.selected.size) return;
    var n = state.selected.size;
    if (!confirm('确定删除选中的 ' + n + ' 份材料？此操作不可撤销。')) return;
    var ids = Array.from(state.selected);
    api('/api/parent-meetings', { method: 'DELETE', body: { ids: ids } })
      .then(function (d) {
        var del = (d && typeof d.deleted === 'number') ? d.deleted : n;
        toast('已删除 ' + del + ' 份材料', 'success');
        state.items = state.items.filter(function (it) { return !state.selected.has(it.id); });
        state.selected.clear();
        renderList();
        updateBatchBar();
        if (state.currentId && !state.items.some(function (it) { return it.id === state.currentId; })) {
          if (state.items.length) selectItem(state.items[0].id);
          else { showEmpty(); $('studentList').innerHTML = '<div class="student-empty">还没有家长会材料。<br/>点击下方按钮上传第一份。</div>'; }
        }
      })
      .catch(function (e) { toast('批量删除失败：' + (e.message || String(e)), 'error'); });
  }

  // ============================================================
  //  事件绑定
  // ============================================================
  function bindEvents() {
    // 名册点击 / 删除 / 多选
    $('studentList').addEventListener('click', function (e) {
      var card = e.target.closest('.student-card');
      if (!card) return;
      var id = card.getAttribute('data-id');
      var delBtn = e.target.closest('[data-del]');
      if (state.multiMode) {
        if (delBtn) return;           // 多选模式下屏蔽单条删除
        toggleSelect(id);
        return;
      }
      if (delBtn) { e.stopPropagation(); confirmDelete(id); return; }
      selectItem(id);
      // 名册里的显式点击（区别于首屏自动选中）→ 通知归档导航切到资料详情
      try { document.dispatchEvent(new CustomEvent('zhixue:roster-open-material', { detail: { id: id } })); } catch (err) {}
    });
    // 顶部删除
    $('deleteBtn').addEventListener('click', function () {
      if (state.currentId) confirmDelete(state.currentId);
    });
    // 批量删除（多选模式）
    $('multiToggle').addEventListener('click', toggleMultiMode);
    $('batchAll').addEventListener('click', selectAll);
    $('batchClear').addEventListener('click', clearSel);
    $('batchDelete').addEventListener('click', deleteSelected);
    // 上传弹窗
    $('uploadBtn').addEventListener('click', openUploadModal);
    $('uploadCancel').addEventListener('click', closeUploadModal);
    $('uploadConfirm').addEventListener('click', startUpload);
    $('uploadModal').addEventListener('click', function (e) {
      if (e.target.id === 'uploadModal') closeUploadModal();
    });
    // 批量选择：点击拖拽区 → 打开文件选择（input 已 multiple）
    var fileInput = $('fileInput');
    $('fileDrop').addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', function () {
      if (fileInput.files && fileInput.files.length) handleFileSelect(fileInput.files);
      fileInput.value = ''; // 允许再次选择同一文件
    });
    // 清空整个队列
    $('fileQueueClear').addEventListener('click', clearQueue);
    // 队列内单条移除（事件委托）
    $('fileQueue').addEventListener('click', function (e) {
      var rm = e.target.closest('[data-rm]');
      if (rm) removeQueueItem(rm.getAttribute('data-rm'));
    });
    // 拖拽多选
    ['dragenter', 'dragover'].forEach(function (ev) {
      $('fileDrop').addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); $('fileDrop').classList.add('over'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      $('fileDrop').addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); $('fileDrop').classList.remove('over'); });
    });
    $('fileDrop').addEventListener('drop', function (e) {
      var dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length) handleFileSelect(dt.files);
    });
    // 全屏阅读：关闭按钮 / 点击背景 / 系统全屏 / Esc
    $('readerClose').addEventListener('click', closeReader);
    $('readerFs').addEventListener('click', toggleNativeFs);
    // 阅读区缩放：＋ / −
    $('readerZoomIn').addEventListener('click', function () { changeZoom(0.1); });
    $('readerZoomOut').addEventListener('click', function () { changeZoom(-0.1); });
    // 铺满 / 边距切换（仅 Markdown 阅读生效；PDF 始终铺满）
    $('readerFillBtn').addEventListener('click', function () {
      var ov = $('docReader');
      var on = ov.classList.toggle('fill');
      $('readerFillBtn').title = on ? '退出铺满（恢复边距）' : '铺满全屏';
    });
    $('docReader').addEventListener('click', function (e) {
      if (e.target.id === 'docReader') closeReader();
    });
    // 归档导航请求打开某份材料（班级 → 学生 → 资料详情）
    document.addEventListener('zhixue:archive-open-material', function (e) {
      var id = e.detail && e.detail.id;
      if (id) selectItem(id);
    });
    // ESC：优先关全屏阅读，否则关上传弹窗
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if ($('docReader').classList.contains('show')) closeReader();
      else if ($('uploadModal').classList.contains('show')) closeUploadModal();
    });
  }

  // ============================================================
  //  初始化
  // ============================================================
  function init() {
    state.user = (window.ZhiXue && window.ZhiXue.user) || null;
    if (!state.user) {
      // 未登录：跳回首页并提示登录
      window.location.href = 'index.html';
      return;
    }
    state.isTeacher = state.user.role === 'teacher';
    if (!state.isTeacher) {
      // 学生不可访问家长会（含其他学生评估材料，属教师隐私功能）
      document.body.innerHTML =
        '<div style="max-width:520px;margin:14vh auto;padding:32px;text-align:center;' +
        'background:var(--card,#fff);border:3px solid var(--line,#2E2A3B);box-shadow:6px 6px 0 var(--shadow,#2E2A3B)">' +
        '<h2 style="font-family:&quot;Press Start 2P&quot;,monospace;font-size:14px;margin-bottom:14px">家长会</h2>' +
        '<p style="font-size:14px;line-height:1.7;color:var(--muted,#6B6478)">家长会资料仅<b>教师账号</b>可查看。<br>' +
        '请使用教师账号登录后，从侧边栏「工具 · 家长会」进入。</p>' +
        '<p style="margin-top:18px"><a href="index.html" style="font-family:&quot;Press Start 2P&quot;,monospace;' +
        'font-size:11px;padding:12px 16px;background:var(--green,#4FC46A);color:#2E2A3B;' +
        'border:3px solid var(--line,#2E2A3B);box-shadow:4px 4px 0 var(--shadow,#2E2A3B);text-decoration:none">返回首页</a></p>' +
        '</div>';
      return;
    }
    document.body.classList.toggle('role-teacher', state.isTeacher);
    $('roleTag').textContent = state.isTeacher ? '教师' : '学生';
    bindEvents();
    loadList();
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
