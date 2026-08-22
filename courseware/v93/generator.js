/* =====================================================================
 * 课件生成工坊 · skill 文档 → 交互课件生成器 (V9.3 fCC × Khan)
 * ---------------------------------------------------------------------
 * 纯字符串 / 解析逻辑，无浏览器 API 依赖，可在 Node 与浏览器复用。
 * 输入：阅读/写作笔记 Markdown（原材料 skill 文档格式）
 * 输出：单文件、自包含的交互课件 HTML（内联 V9.3 CSS/JS）
 * ===================================================================== */
(function (global) {
  'use strict';

  /* ---------------- 内嵌 V9.3 外壳片段（来自 skill 参考 partials） ---------------- */
  const SIDEBAR_HTML = `<aside class="sidebar" id="sidebar">
  <div class="sidebar-header">
    <div class="sidebar-logo">&lt;/&gt; READING</div>
    <button class="sidebar-toggle" onclick="toggleSidebar()" title="Toggle sidebar">☰</button>
  </div>
  <div class="sidebar-nav" id="sidebarNav"></div>
  <div class="sidebar-score">
    <div class="score-ring">
      <svg viewBox="0 0 36 36">
        <circle class="ring-bg" cx="18" cy="18" r="14"/>
        <circle class="ring-fg" cx="18" cy="18" r="14" stroke-dasharray="87.96" stroke-dashoffset="87.96"/>
      </svg>
      <div class="ring-text">0%</div>
    </div>
    <div class="score-detail">
      <div class="sd-label">Score</div>
      <div class="sd-val">0/0</div>
    </div>
  </div>
  <div class="sidebar-footer">
    <button class="theme-toggle" onclick="toggleDarkMode()" title="Toggle dark mode (D)">☽</button>
    <span class="theme-label">Dark Mode</span>
  </div>
</aside>`;

  const TOPBAR_HTML = `<div class="topbar">
  <span class="course-tag">DSE · READING</span>
  <span class="slide-title mono" id="topbarTitle"></span>
  <span class="progress-dots" id="progressDots"></span>
  <span class="score-badge">
    <span class="sb-correct">0</span><span class="sb-divider">/</span><span class="sb-total">0</span>
  </span>
  <span class="streak-badge" style="display:none">
    <span class="streak-fire">🔥</span><span class="streak-count">0</span>
  </span>
  <span class="zoom-controls">
    <button class="zoom-btn" id="zoomOutBtn" onclick="zoomOut()">−</button>
    <span class="zoom-level" id="zoomLevelLabel" onclick="resetZoom()">100%</span>
    <button class="zoom-btn" id="zoomInBtn" onclick="zoomIn()">+</button>
  </span>
  <span class="timer-wrap">
    <span class="timer-input-wrap" id="timerWrap" oncontextmenu="event.preventDefault();cycleDuration()" title="Right-click to cycle presets (1/2/3/5/10 min)">
      <input class="t-min" id="timerMin" type="number" min="0" max="99" value="5">
      <span class="t-colon">:</span>
      <input class="t-sec" id="timerSec" type="number" min="0" max="59" value="00">
      <span class="timer-done-label">TIME UP</span>
    </span>
    <button class="timer-play" id="timerPlayBtn" onclick="toggleTimer()">▶</button>
    <button class="timer-reset" onclick="resetTimer()">Reset</button>
  </span>
  <button class="hardmode-btn" id="hardmodeBtn" onclick="toggleHardMode()" title="Toggle hard mode: show full passage">🔒 Easy</button>
  <button class="clear-hl-btn" onclick="clearAllHighlights()" title="Clear all highlights">🗑 Clear</button>
</div>`;

  /* ---------------- 工具函数 ---------------- */
  function escapeAttr(s) {
    return (s == null ? '' : String(s)).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  function escapeHtml(s) {
    return (s == null ? '' : String(s)).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  }
  function mdInline(s) {
    s = (s == null ? '' : String(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return s;
  }
  function stripMd(s) {
    return (s == null ? '' : String(s)).replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '').trim();
  }
  function firstPart(s) {
    if (!s) return '';
    const a = s.split('—');
    if (a.length > 1) return a[0].trim();
    const b = s.split('·');
    return (b[0] || '').trim();
  }
  function normalizeTFNG(v) {
    v = (v || '').toUpperCase().replace(/\*/g, '').replace(/\./g, '').trim();
    if (v === 'T' || v === 'TRUE' || v === '是') return 'T';
    if (v === 'F' || v === 'FALSE' || v === '否') return 'F';
    if (v === 'NG' || v === 'NOT GIVEN' || v === 'NONE' || v === '未提及') return 'NG';
    return v;
  }

  /* ---------------- Markdown 表格解析 ---------------- */
  function splitRow(line) {
    return line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(s => s.trim());
  }
  function parseMdTables(text) {
    const lines = (text || '').split('\n');
    const tables = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
        const headers = splitRow(line);
        i += 2;
        const rows = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(splitRow(lines[i])); i++; }
        tables.push({ headers, rows });
      } else { i++; }
    }
    return tables;
  }

  /* ---------------- 分节 ---------------- */
  function splitSections(md) {
    const lines = (md || '').replace(/\r\n/g, '\n').split('\n');
    const sections = [];
    let cur = null;
    for (const raw of lines) {
      const h = raw.match(/^##\s+(.*)$/);
      if (h) {
        if (cur) sections.push(cur);
        cur = { title: h[1].trim(), lines: [] };
      } else {
        if (!cur) cur = { title: '', lines: [] };
        cur.lines.push(raw);
      }
    }
    if (cur) sections.push(cur);
    return sections;
  }
  function classifySection(title) {
    if (/使用说明|使用指引|使用帮助/.test(title)) return 'usage';
    if (/入门测/.test(title)) return 'entry';
    if (/出门测/.test(title)) return 'exit';
    if (/逐段精读|精读/.test(title) && !/全文/.test(title)) return 'close';
    if (/核心词汇|词汇表|词汇/.test(title)) return 'vocab';
    if (/考点/.test(title)) return 'exam';
    if (/同义/.test(title)) return 'synonym';
    if (/词语卡片|词卡/.test(title)) return 'wordcard';
    if (/写作/.test(title)) return 'writing';
    if (/原文全文|全文/.test(title)) return 'fulltext';
    return 'other';
  }

  /* ---------------- 各节解析 ---------------- */
  function parseTableTest(body, kind) {
    const tables = parseMdTables(body);
    if (!tables.length) return null;
    const t = tables[0];
    const rows = t.rows.map(r => ({
      no: r[0] || '',
      en: stripMd(r[1] || ''),
      cn: stripMd(r[2] || '')
    })).filter(x => x.en);
    if (!rows.length) return null;
    const instr = body.match(/\*\*Instructions:\*\*\s*([^\n]*)/i) || body.match(/指令[：:]\s*([^\n]*)/);
    return {
      heading: kind === 'entry' ? '入门测 · 核心名词' : '出门测 · 输出能力',
      instruction: instr ? instr[1].trim() : '',
      rows
    };
  }

  function parseCloseReading(lines) {
    const out = [];
    let cur = null;
    let paraBuf = null;
    function flushPara() { if (paraBuf) { cur.paragraphs.push(paraBuf); paraBuf = null; } }
    function flushText() { if (cur) { flushPara(); out.push(cur); cur = null; } }
    for (const l of lines) {
      const sub = l.match(/^###\s+(.*)$/);
      if (sub) { flushText(); cur = { heading: sub[1].trim(), paragraphs: [] }; continue; }
      if (!cur) continue;
      const paraMarker = l.match(/^\s*\**\s*\[(\d+)\]\s*\**\s*(.*)$/) || l.match(/^\s*\**(\d+)\s*[\]\.\)]\s*\**\s*(.*)$/);
      if (paraMarker) {
        flushPara();
        paraBuf = { no: paraMarker[1], en: [paraMarker[2]], cn: '' };
        continue;
      }
      const tr = l.match(/^>\s*中文翻译[：:]\s?(.*)$/) || l.match(/^>\s*(.*)$/);
      if (tr && paraBuf) {
        paraBuf.cn = (paraBuf.cn ? paraBuf.cn + ' ' : '') + tr[1].trim();
        continue;
      }
      if (paraBuf && l.trim()) paraBuf.en.push(l.trim());
    }
    flushText();
    return out;
  }

  function parseVocab(lines, vocab) {
    // 按 ### 子节标题分类（名词/动词/形容词/短语），再解析各子节内的表格
    const subs = [];
    let cur = null;
    for (const l of lines) {
      const m = l.match(/^###\s+(.*)$/);
      if (m) { if (cur) subs.push(cur); cur = { title: m[1].trim(), body: [] }; }
      else { if (!cur) cur = { title: '', body: [] }; cur.body.push(l); }
    }
    if (cur) subs.push(cur);
    for (const s of subs) {
      const t = s.title;
      let key = null;
      if (/名词/.test(t)) key = 'nouns';
      else if (/动词/.test(t)) key = 'verbs';
      else if (/形容词/.test(t)) key = 'adjs';
      else if (/短语/.test(t)) key = 'phrases';
      else continue;
      const tables = parseMdTables(s.body.join('\n'));
      for (const tbl of tables) {
        for (const r of tbl.rows) {
          const word = stripMd(r[0] || '');
          if (!word) continue;
          const pos = stripMd(r[1] || '');
          const cn = stripMd(r[2] || '');
          const para = stripMd(r[3] || '');
          const writing = stripMd(r[r.length - 1] || '') || stripMd(r[4] || '');
          vocab[key].push({ word, pos, cn, para, writing });
        }
      }
    }
  }

  function parseExam(lines) {
    const out = [];
    const subs = [];
    let cur = null;
    for (const l of lines) {
      const m = l.match(/^###\s+(.*)$/);
      if (m) { if (cur) subs.push(cur); cur = { title: m[1].trim(), lines: [] }; }
      else { if (!cur) cur = { title: '', lines: [] }; cur.lines.push(l); }
    }
    if (cur) subs.push(cur);
    for (const s of subs) {
      const qm = s.title.match(/Q\s*(\d+)/i) || s.title.match(/(\d+)/);
      const q = {
        q: qm ? qm[1] : String(out.length + 1),
        title: s.title,
        question: '', locate: '', method: '', trap: '',
        options: [], tfng: []
      };
      const body = s.lines.join('\n');
      const qLine = body.match(/\*\*题目[：:]\*\*\s*([\s\S]*?)(?=\n🔵|\n💡|\n⚠️|\n\*\*选项|$)/);
      if (qLine) q.question = stripMd(qLine[1].trim());
      const loc = body.match(/🔵\s*考点定位[：:]\s*([^\n]*)/); if (loc) q.locate = loc[1].trim();
      const met = body.match(/💡\s*解题思路[：:]\s*([^\n]*)/); if (met) q.method = met[1].trim();
      const trp = body.match(/⚠️\s*陷阱提醒[：:]\s*([^\n]*)/); if (trp) q.trap = trp[1].trim();
      const optBlock = body.match(/\*\*选项[：:]\*\*\s*([\s\S]*?)(?=\n---|\n🔵|\n💡|\n⚠️|\n\*\*考点|$)/);
      if (optBlock) {
        const optLines = optBlock[1].split('\n').filter(l => /^\s*[-*]\s+/.test(l));
        for (const ol of optLines) {
          const lm = ol.match(/^\s*[-*]\s+\**\s*([A-Da-d])\b\s*\**\s*(.*)$/i);
          if (!lm) continue;
          const letter = lm[1].toUpperCase();
          const txt = lm[2].replace(/\*\*/g, '').replace(/✅|❌/g, '').replace(/^[—–\-:：\s]+/, '').trim();
          const correct = /✅/.test(ol);
          q.options.push({ letter, text: txt, correct });
        }
      }
      const tfngTables = parseMdTables(body).filter(t => /小问/.test(t.headers.join(' ')) && /答案/.test(t.headers.join(' ')));
      for (const tt of tfngTables) {
        for (const r of tt.rows) {
          q.tfng.push({ sub: r[0] || '', answer: normalizeTFNG(r[1] || ''), reason: stripMd(r[2] || '') });
        }
      }
      if (q.question || q.options.length || q.tfng.length) out.push(q);
    }
    return out;
  }

  function parseSynonym(body) {
    const tables = parseMdTables(body);
    const out = [];
    for (const t of tables) {
      for (const r of t.rows) {
        out.push({
          src: stripMd(r[0] || ''), srcCn: stripMd(r[1] || ''),
          tgt: stripMd(r[2] || ''), tgtCn: stripMd(r[3] || ''), ref: stripMd(r[4] || '')
        });
      }
    }
    return out;
  }

  function parseWordCards(body) {
    const tables = parseMdTables(body);
    const out = [];
    for (const t of tables) {
      for (const r of t.rows) {
        const cat = stripMd(r[0] || '');
        if (!cat) continue;
        const items = (r[1] || '').split('·').map(s => s.trim()).filter(Boolean).map(s => {
          const cjk = s.match(/[一-鿿]/);
          if (cjk && cjk.index > 0) {
            return { en: s.slice(0, cjk.index).trim(), cn: s.slice(cjk.index).trim() };
          }
          return { en: s.trim(), cn: '' };
        });
        out.push({ cat, items });
      }
    }
    return out;
  }

  function parseWriting(lines) {
    const subs = [];
    let cur = null;
    for (const l of lines) {
      const m = l.match(/^###\s+(.*)$/);
      if (m) { if (cur) subs.push(cur); cur = { title: m[1].trim(), body: [] }; }
      else { if (!cur) cur = { title: '', body: [] }; cur.body.push(l); }
    }
    if (cur) subs.push(cur);
    const out = [];
    for (const s of subs) {
      if (!s.title && !s.body.join('').trim()) continue;
      const tables = parseMdTables(s.body.join('\n'));
      out.push({ title: s.title || '写作迁移', tables: tables.map(t => ({ headers: t.headers, rows: t.rows })) });
    }
    return out;
  }

  /* ---------------- 顶层解析 ---------------- */
  function parseSkillDoc(md) {
    const lines = (md || '').replace(/\r\n/g, '\n').split('\n');
    const model = {
      titleRaw: '', emoji: '', titleMain: '', subtitle: '', usage: [],
      entry: null, exit: null, close: [], vocab: { nouns: [], verbs: [], adjs: [], phrases: [] },
      exam: [], synonym: [], wordcard: [], writing: [], fulltext: []
    };
    for (const l of lines) {
      const m = l.match(/^#\s+([^#].*)$/);
      if (m) {
        model.titleRaw = m[1].trim();
        const tm = model.titleRaw.match(/^(\p{Extended_Pictographic}(?:\u200d|\ufe0f|[\u{1F3FB}-\u{1F3FF}])*)\s*(.*)$/u);
        if (tm) { model.emoji = tm[1]; model.titleMain = tm[2]; }
        else model.titleMain = model.titleRaw;
        model.subtitle = (model.titleMain.split('—').pop() || '').trim() || model.titleMain;
        break;
      }
    }
    if (!model.titleRaw) {
      for (const l of lines) { if (l.trim()) { model.titleRaw = l.trim(); model.titleMain = l.trim(); model.subtitle = l.trim(); break; } }
    }
    const sections = splitSections(md);
    for (const sec of sections) {
      const type = classifySection(sec.title);
      const body = sec.lines.join('\n');
      if (type === 'usage') {
        model.usage = sec.lines.filter(l => /^>\s?/.test(l)).map(l => l.replace(/^>\s?/, '').trim()).filter(Boolean);
      } else if (type === 'entry') {
        model.entry = parseTableTest(body, 'entry');
      } else if (type === 'exit') {
        model.exit = parseTableTest(body, 'exit');
      } else if (type === 'close') {
        model.close.push(...parseCloseReading(sec.lines));
      } else if (type === 'vocab') {
        parseVocab(sec.lines, model.vocab);
      } else if (type === 'exam') {
        model.exam.push(...parseExam(sec.lines));
      } else if (type === 'synonym') {
        model.synonym = parseSynonym(body);
      } else if (type === 'wordcard') {
        model.wordcard = parseWordCards(body);
      } else if (type === 'writing') {
        model.writing.push(...parseWriting(sec.lines));
      } else if (type === 'fulltext') {
        model.fulltext.push(...parseCloseReading(sec.lines));
      }
    }
    return model;
  }

  /* ---------------- Slide 构建器 ---------------- */
  function buildCover(m) {
    const titleMain = m.titleMain || m.titleRaw || '课件';
    const sub = m.subtitle || '';
    const cls = firstPart(sub) || 'DSE READING';
    const metaCards = [
      { l: 'CLASS', v: cls, s: 'Reading Notes' },
      { l: 'PAPER', v: 'Paper 1', s: 'Interactive' },
      { l: 'ENGINE', v: 'fCC × Khan', s: 'V9.3' }
    ].map(c => `<div class="s1-meta-card"><div class="sm-label">${escapeAttr(c.l)}</div><div class="sm-value">${mdInline(c.v)}</div><div class="sm-sub">${escapeAttr(c.s)}</div></div>`).join('');
    return `<section class="slide is-active" data-title="${escapeAttr(titleMain)}" data-section="cover" data-part="">
<div class="s1-card-wrapper">
  <div class="xdf-header-bar">
    <div class="xdf-logo-text">DSE READING <span>// Paper 1</span></div>
    <div class="xdf-sub-text">${mdInline(sub)}</div>
  </div>
  <div style="padding:28px 32px">
    <div class="slide-h1" style="text-align:center;margin-bottom:6px">${m.emoji ? escapeHtml(m.emoji) + ' ' : ''}${mdInline(titleMain)}</div>
    <div class="slide-h2" style="text-align:center;color:var(--fcc-purple-dark);margin-bottom:24px">${mdInline(sub)}</div>
    <div style="display:flex;justify-content:center;margin-bottom:20px">
      <div class="class-badge">${mdInline(cls)}</div>
    </div>
    <div class="s1-meta-grid">${metaCards}</div>
  </div>
  <div class="xdf-grid-pattern"><span>USE ARROW KEYS // SWIPE TO NAVIGATE</span></div>
</div>
</section>`;
  }

  function buildFlipSlide(items, heading, section, part, lead) {
    const list = items.filter(i => i && i.q).slice(0, 15);
    const cards = list.map(it => `<div class="flip-card" onclick="this.classList.toggle('flipped')">
    <div class="flip-card-inner">
      <div class="flip-face flip-front"><div class="flip-q">${mdInline(it.q)}</div><div class="flip-hint">tap</div></div>
      <div class="flip-face flip-back"><div class="flip-ans">${mdInline(it.a)}</div></div>
    </div>
  </div>`).join('');
    const n = list.length;
    const grid = n > 10 ? 'g5' : (n > 7 ? 'g4' : 'g3');
    return `<section class="slide" data-title="${escapeAttr(heading)}" data-section="${section}" data-part="${escapeAttr(part)}">
<div class="sec-label">${mdInline(part)}</div>
<div class="slide-h3" style="margin-bottom:10px">${mdInline(heading)}</div>
${lead ? `<p style="font-size:18px;color:var(--text-2);margin-bottom:16px">${mdInline(lead)}</p>` : ''}
<div class="flip-grid ${grid}">${cards}</div>
</section>`;
  }

  function buildCloseSlide(cr) {
    const paras = cr.paragraphs.map(p =>
      `<div class="passage-excerpt"><div class="para-num">¶${escapeAttr(p.no || '?')}</div>${mdInline(p.en.join(' ').replace(/\s+/g, ' ').trim())}</div>`
    ).join('');
    const trans = cr.paragraphs.filter(p => p.cn).map(p =>
      `<p style="font-size:16px;margin-bottom:10px"><strong>¶${escapeAttr(p.no || '?')}</strong> ${mdInline(p.cn)}</p>`
    ).join('');
    return `<section class="slide" data-title="${escapeAttr(cr.heading)}" data-section="close-reading" data-part="Reading">
<div class="sec-label">Close Reading</div>
<div class="slide-h3" style="margin-bottom:12px">${mdInline(cr.heading)}</div>
<div class="split-view" style="max-height:680px">
  <div class="split-left" oncontextmenu="handleHighlight(event, this)">
    <h4>${mdInline(cr.heading)}</h4>
    ${paras}
  </div>
  <div class="split-right">
    <div class="card" style="padding:16px 20px">
      <div class="sec-label" style="font-size:15px">中文翻译</div>
      ${trans || '<p style="font-size:16px;color:var(--text-2)">（暂无翻译）</p>'}
    </div>
  </div>
</div>
</section>`;
  }

  function buildExamSlide(q) {
    let qhtml = '';
    if (q.options.length) {
      const opts = q.options.map(o =>
        `<span class="pmcq-opt" data-correct="${o.correct ? 'true' : 'false'}" data-explain="${escapeAttr(o.text)}" onclick="checkMCAuto(this)"><span class="pl">${o.letter}</span>${mdInline(o.text)}</span>`
      ).join('');
      qhtml = `<div class="practice-mcq" id="q${escapeAttr(q.q)}-box">
  <div class="pmcq-label">Q${escapeAttr(q.q)} · MC · 1 mark(s)</div>
  <div class="pmcq-q">${mdInline(q.question)}</div>
  <div class="pmcq-options">${opts}</div>
</div>`;
    } else if (q.tfng.length) {
      const groups = q.tfng.map(t =>
        `<p style="font-size:15px;margin-bottom:8px"><strong>${mdInline(t.sub)}</strong></p>
  <div class="tfng-group" data-answer="${escapeAttr(t.answer)}" data-explain="${escapeAttr(t.reason)}">
    <span class="tfng-btn" onclick="checkTFNG(this,'T')"><b>T</b></span>
    <span class="tfng-btn" onclick="checkTFNG(this,'F')"><b>F</b></span>
    <span class="tfng-btn" onclick="checkTFNG(this,'NG')"><b>NG</b></span>
  </div>`
      ).join('');
      qhtml = `<div class="practice-mcq" id="q${escapeAttr(q.q)}-box">
  <div class="pmcq-label">Q${escapeAttr(q.q)} · TFNG · ${q.tfng.length} mark(s)</div>
  <div class="pmcq-q">${mdInline(q.question)}</div>
  <div class="card" style="margin-bottom:8px;padding:12px 14px">${groups}</div>
</div>`;
    } else {
      qhtml = `<div class="practice-mcq" id="q${escapeAttr(q.q)}-box">
  <div class="pmcq-label">Q${escapeAttr(q.q)} · Reading</div>
  <div class="pmcq-q">${mdInline(q.question)}</div>
  <div class="sa-input-wrap">
    <textarea class="sa-input" placeholder="Type your answer..."></textarea>
    <button class="sa-submit" onclick="submitShortAnswer(this)">Submit</button>
  </div>
  <div class="sa-result"><div class="sa-label">Your answer:</div><div class="sa-your-ans"></div><div class="sa-correct-ans"></div></div>
</div>`;
    }
    const ref = [];
    if (q.locate) ref.push(`<p><span class="method-badge">🔵 考点定位</span> ${mdInline(q.locate)}</p>`);
    if (q.method) ref.push(`<p><span class="method-badge" style="background:var(--fcc-green)">💡 解题思路</span> ${mdInline(q.method)}</p>`);
    if (q.trap) ref.push(`<p><span class="method-badge" style="background:var(--brand-red);color:#fff">⚠️ 陷阱</span> ${mdInline(q.trap)}</p>`);
    return `<section class="slide" data-title="Q${escapeAttr(q.q)} ${escapeAttr(stripMd(q.title))}" data-section="practice" data-part="Practice">
<div class="sec-label">Exam Point · Q${escapeAttr(q.q)}</div>
<div class="slide-h3" style="margin-bottom:12px">${mdInline(q.title)}</div>
<div class="split-view" style="max-height:680px">
  <div class="split-left" style="overflow-y:auto">
    <div class="card accent" style="padding:16px 20px">${ref.join('') || '<p style="font-size:16px">（无解析）</p>'}</div>
  </div>
  <div class="split-right">${qhtml}</div>
</div>
</section>`;
  }

  function buildSynonymSlide(syn) {
    const rows = syn.map(s =>
      `<tr><td>${mdInline(s.src)}</td><td style="color:var(--text-2)">${mdInline(s.srcCn)}</td><td>${mdInline(s.tgt)}</td><td style="color:var(--text-2)">${mdInline(s.tgtCn)}</td><td style="font-family:'Hack',monospace;font-size:13px">${mdInline(s.ref)}</td></tr>`
    ).join('');
    return `<section class="slide" data-title="同义替换积累" data-section="practice" data-part="Practice">
<div class="sec-label">Synonym Bank</div>
<div class="slide-h3" style="margin-bottom:12px">同义替换积累</div>
<div class="card" style="padding:16px 20px;margin-bottom:12px"><p style="font-size:16px">DSE 阅读最核心的技能：识别<b>题目中的词</b>与<b>原文中的词</b>之间的同义替换关系。</p></div>
<div class="tb-wrap"><table>
  <tr><th>原文表达</th><th>中文</th><th>题目/选项表达</th><th>中文</th><th>出处</th></tr>
  ${rows}
</table></div>
</section>`;
  }

  function buildWritingSlide(w) {
    const tables = w.tables.map(t => {
      const head = t.headers.map(h => `<th>${mdInline(h)}</th>`).join('');
      const rows = t.rows.map(r => `<tr>${r.map(c => `<td>${mdInline(c)}</td>`).join('')}</tr>`).join('');
      return `<div class="tb-wrap" style="margin-bottom:14px"><table><tr>${head}</tr>${rows}</table></div>`;
    }).join('');
    return `<section class="slide" data-title="${escapeAttr(w.title) || '写作迁移'}" data-section="close-reading" data-part="Writing">
<div class="sec-label">Writing Transfer</div>
<div class="slide-h3" style="margin-bottom:12px">${mdInline(w.title) || '写作迁移表达'}</div>
${tables || '<p style="font-size:18px;color:var(--text-2)">（暂无内容）</p>'}
</section>`;
  }

  function buildFullTextSlide(ft) {
    const paras = ft.paragraphs.map(p =>
      `<div class="passage-excerpt"><div class="para-num">§${escapeAttr(p.no || '?')}</div>${mdInline(p.en.join(' ').replace(/\s+/g, ' ').trim())}</div>`
    ).join('');
    return `<section class="slide" data-title="${escapeAttr(ft.heading) || '原文全文'}" data-section="close-reading" data-part="Reading">
<div class="sec-label">Full Text</div>
<div class="slide-h3" style="margin-bottom:12px">${mdInline(ft.heading) || '原文全文'}</div>
<div class="split-left" style="overflow-y:auto;max-height:680px">
  <h4>${mdInline(ft.heading)}</h4>
  ${paras}
</div>
</section>`;
  }

  function buildDone() {
    return `<section class="slide" data-title="Well Done!" data-section="done" data-part="">
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;height:100%">
  <div style="font-size:72px;margin-bottom:24px">🎉</div>
  <h2 class="slide-h2">Well Done!</h2>
  <p style="font-size:20px;color:var(--text-2);max-width:600px;line-height:1.8;margin-bottom:28px">你已学完本单元的核心词汇、精读与考点。继续练习，保持手感！</p>
  <div class="score-badge" style="font-size:18px;padding:10px 24px;margin-bottom:20px">
    <span class="sb-correct" id="finalScore">0</span><span class="sb-divider">/</span><span class="sb-total" id="finalTotal">0</span>
  </div>
  <button class="reveal-btn" onclick="launchConfetti()" style="font-size:22px;padding:12px 32px">🎊 Celebrate!</button>
</div>
</section>`;
  }

  /* ---------------- 组装 ---------------- */
  function generate(model, css, js) {
    const slides = [];
    slides.push(buildCover(model));
    if (model.entry && model.entry.rows.length) {
      slides.push(buildFlipSlide(model.entry.rows.map(r => ({ q: r.en, a: r.cn || '(自查)' })),
        '入门测 · 核心名词', 'entry-test', 'Warm-up', '先过一遍核心名词，中英互译自查'));
    }
    const vocabCats = [
      { key: 'nouns', label: '名词 Nouns' },
      { key: 'verbs', label: '动词 Verbs' },
      { key: 'adjs', label: '形容词 Adjectives' },
      { key: 'phrases', label: '重点短语 Phrases' }
    ];
    for (const c of vocabCats) {
      const arr = model.vocab[c.key];
      if (arr && arr.length) {
        slides.push(buildFlipSlide(arr.map(v => ({ q: v.word, a: (v.cn || '(自查)') + (v.pos ? ' · ' + v.pos : '') })),
          '核心词汇 · ' + c.label, 'close-reading', 'Vocabulary', '点击卡片翻转：英文 → 中文释义'));
      }
    }
    for (const cr of model.close) slides.push(buildCloseSlide(cr));
    for (const q of model.exam) slides.push(buildExamSlide(q));
    if (model.synonym.length) slides.push(buildSynonymSlide(model.synonym));
    for (const wc of model.wordcard) {
      if (wc.items.length) {
        slides.push(buildFlipSlide(wc.items.filter(i => i.en).map(i => ({ q: i.en, a: i.cn || '(自查)' })),
          '词语卡片 · ' + wc.cat, 'close-reading', 'Word Cards', '点击翻转查看中文'));
      }
    }
    for (const w of model.writing) slides.push(buildWritingSlide(w));
    for (const ft of model.fulltext) slides.push(buildFullTextSlide(ft));
    if (model.exit && model.exit.rows.length) {
      slides.push(buildFlipSlide(model.exit.rows.map(r => ({ q: r.en, a: r.cn || '(自查)' })),
        '出门测 · 动词/短语', 'exit-test', 'Exit', '学完后再测一次输出能力'));
    }
    slides.push(buildDone());

    return { html: wrapDeck(slides.join('\n'), model.titleRaw || '课件', css, js, slides.length), count: slides.length };
  }

  /* =====================================================================
   * V2 —— 指令驱动渲染（Markdown 即模板）
   * 上传的 Markdown 文档本身是模板：:::slide 控制分页，:::grid/card/split/
   * callout 控制布局，:::mcq/tfng/flip 控制交互组件。生成器只负责渲染。
   * 无 :::slide 时回退到 v1 skill-doc 解析（向下兼容）。
   * ===================================================================== */

  function parseAttrs(str) {
    const out = {};
    if (!str) return out;
    const re = /([\w-]+)\s*=\s*("([^"]*)"|'([^']*)'|(\S+))/g;
    let m;
    while ((m = re.exec(str)) !== null) {
      out[m[1]] = m[3] !== undefined ? m[3] : (m[4] !== undefined ? m[4] : m[5]);
    }
    return out;
  }

  function mdInlineV2(s) {
    s = (s == null ? '' : String(s))
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    s = s.replace(/\*\*\[(\d+)\]\*\*/g, '<span class="para-marker">[$1]</span>');
    s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">');
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return s;
  }

  function renderMarkdown(md) {
    const lines = (md || '').replace(/\r\n/g, '\n').split('\n');
    const out = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (/^```/.test(line)) {
        const code = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i++; }
        i++;
        out.push('<pre class="md-code"><code>' + escapeHtml(code.join('\n')) + '</code></pre>');
        continue;
      }
      const h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        const lvl = h[1].length;
        out.push('<h' + lvl + ' class="md-h' + lvl + '">' + mdInlineV2(h[2]) + '</h' + lvl + '>');
        i++; continue;
      }
      if (/^\s*([-*_])\1{2,}\s*$/.test(line)) { out.push('<hr class="md-hr">'); i++; continue; }
      if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
        const headers = splitRow(line);
        i += 2;
        const rows = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(splitRow(lines[i])); i++; }
        const th = headers.map(c => '<th>' + mdInlineV2(c) + '</th>').join('');
        const trs = rows.map(r => '<tr>' + r.map(c => '<td>' + mdInlineV2(c) + '</td>').join('') + '</tr>').join('');
        out.push('<div class="tb-wrap"><table><thead><tr>' + th + '</tr></thead><tbody>' + trs + '</tbody></table></div>');
        continue;
      }
      if (/^>\s?/.test(line)) {
        const buf = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
        const isTrans = /中文翻译/i.test(buf[0] || '');
        out.push('<blockquote class="md-quote' + (isTrans ? ' translation' : '') + '">' + mdInlineV2(buf.join('<br>')) + '</blockquote>');
        continue;
      }
      if (/^\s*[-*+]\s+/.test(line)) {
        const buf = [];
        while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) { buf.push(lines[i].replace(/^\s*[-*+]\s+/, '')); i++; }
        out.push('<ul class="md-ul">' + buf.map(b => '<li>' + mdInlineV2(b) + '</li>').join('') + '</ul>');
        continue;
      }
      if (!line.trim()) { i++; continue; }
      const buf = [];
      while (i < lines.length && lines[i].trim() &&
             !/^(#{1,6}\s|>\s?|\s*[-*+]\s+|\s*\|)/.test(lines[i]) &&
             !/^```/.test(lines[i]) && !/^\s*([-*_])\1{2,}\s*$/.test(lines[i])) {
        buf.push(lines[i]); i++;
      }
      out.push('<p class="md-p">' + mdInlineV2(buf.join(' ')) + '</p>');
    }
    return out.join('\n');
  }

  function parseBlocks(text) {
    const lines = (text || '').split('\n');
    const root = { type: 'root', children: [] };
    const stack = [root];
    let mdBuf = [];
    function flushMd() {
      if (mdBuf.length) { stack[stack.length - 1].children.push({ type: 'md', text: mdBuf.join('\n') }); mdBuf = []; }
    }
    for (const line of lines) {
      const open = line.match(/^:::\s*([a-zA-Z][\w-]*)\s*(.*)$/);
      const close = /^:::\s*$/.test(line);
      if (open) {
        flushMd();
        const node = { type: 'fence', name: open[1].toLowerCase(), attrs: parseAttrs(open[2]), children: [] };
        stack[stack.length - 1].children.push(node);
        stack.push(node);
      } else if (close) {
        flushMd();
        if (stack.length > 1) stack.pop();
      } else {
        mdBuf.push(line);
      }
    }
    flushMd();
    return root.children;
  }

  function renderBlocks(blocks) {
    return blocks.map(b => b.type === 'md' ? renderMarkdown(b.text) : renderDirective(b.name, b.attrs, b.children)).join('\n');
  }
  function flattenMd(blocks) {
    return blocks.filter(b => b.type === 'md').map(b => b.text).join('\n');
  }

  function renderDirective(name, attrs, children) {
    switch (name) {
      case 'grid':
        return '<div class="grid" style="--cols:' + (attrs.cols || '2') + ';--gap:' + (attrs.gap || '6') + '">' + renderBlocks(children) + '</div>';
      case 'card':
        return '<div class="card">' + renderBlocks(children) + '</div>';
      case 'split':
        return '<div class="split">' + renderBlocks(children) + '</div>';
      case 'split-left':
      case 'split-right':
        return '<div class="split-pane ' + name + '">' + renderBlocks(children) + '</div>';
      case 'callout': {
        const t = (attrs.type || 'note').toLowerCase();
        return '<div class="callout callout-' + t + '">' + renderBlocks(children) + '</div>';
      }
      case 'mcq': return renderMcq(attrs, children);
      case 'tfng': return renderTfng(attrs, children);
      case 'flip': return renderFlip(attrs, children);
      default:
        return '<div class="unknown-block" data-name="' + escapeAttr(name) + '">' + renderBlocks(children) + '</div>';
    }
  }

  function renderMcq(attrs, children) {
    const lines = flattenMd(children).split('\n');
    let q = '', opts = [], inOpts = false;
    for (const l of lines) {
      const om = l.match(/^\s*[-*]\s+([A-Da-d])\b[\.\、\)]?\s*(.*)$/);
      if (om) {
        inOpts = true;
        const letter = om[1].toUpperCase();
        const t = om[2].replace(/✅|❌/g, '').replace(/^\s*[-–—:]+\s*/, '').trim();
        opts.push({ letter, text: t, correct: /✅/.test(l) });
      } else if (!inOpts && l.trim()) {
        q += (q ? '\n' : '') + l.trim();
      }
    }
    const answer = (attrs.answer || '').toUpperCase();
    if (!opts.length) opts = [{ letter: 'A', text: '(未提供选项)', correct: false }];
    const optHtml = opts.map(o => {
      const isCorrect = answer ? (answer === o.letter) : o.correct;
      return '<button class="mc-opt pmcq-opt" data-correct="' + (isCorrect ? 'true' : 'false') + '" onclick="checkMCAuto(this)"><span class="mc-letter">' + o.letter + '</span><span class="mc-text">' + mdInlineV2(o.text) + '</span></button>';
    }).join('');
    return '<div class="practice-mcq mcq"><div class="mcq-q">' + mdInlineV2(q) + '</div><div class="mcq-opts">' + optHtml + '</div></div>';
  }

  function renderTfng(attrs, children) {
    const lines = flattenMd(children).split('\n');
    let q = '', inOpts = false;
    const labels = [];
    for (const l of lines) {
      const om = l.match(/^\s*[-*]\s+(.*)$/);
      if (om) {
        inOpts = true;
        const lab = om[1].trim();
        if (/true/i.test(lab)) labels.push('TRUE');
        else if (/false/i.test(lab)) labels.push('FALSE');
        else if (/not\s*given|ng|未提及/i.test(lab)) labels.push('NOT GIVEN');
        else labels.push(lab.toUpperCase());
      } else if (!inOpts && l.trim()) {
        q += (q ? '\n' : '') + l.trim();
      }
    }
    const set = labels.length ? labels : ['TRUE', 'FALSE', 'NOT GIVEN'];
    const answer = (attrs.answer || 'TRUE').toUpperCase();
    const btns = set.map(lab => '<button class="tfng-btn" onclick="checkTFNG(this,\'' + lab + '\')">' + lab + '</button>').join('');
    return '<div class="practice-mcq tfng"><div class="mcq-q">' + mdInlineV2(q) + '</div><div class="tfng-group" data-answer="' + escapeAttr(answer) + '" data-explain="">' + btns + '</div></div>';
  }

  function renderFlip(attrs, children) {
    const front = attrs.front || '?';
    const backHtml = attrs.back || flattenMd(children).trim();
    return '<div class="flip-card" onclick="this.classList.toggle(\'flipped\')"><div class="flip-card-inner"><div class="flip-face flip-front"><div class="flip-q">' + mdInlineV2(front) + '</div><div class="flip-hint">点击翻转</div></div><div class="flip-face flip-back"><div class="flip-ans">' + mdInlineV2(backHtml) + '</div></div></div></div>';
  }

  function parseFrontmatter(md) {
    const m = (md || '').match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
    if (!m) return { meta: {}, body: md };
    const meta = {};
    m[1].split('\n').forEach(l => {
      const kv = l.match(/^([\w-]+)\s*[:=]\s*(.*)$/);
      if (kv) meta[kv[1].toLowerCase()] = kv[2].trim().replace(/^["']|["']$/g, '');
    });
    return { meta, body: md.slice(m[0].length) };
  }

  function parseTemplate(md) {
    const { meta, body } = parseFrontmatter(md);
    if (!/:::slide/i.test(body)) return null; // 回退 v1
    const blocks = parseBlocks(body);
    const slides = [];
    let first = true;
    for (const n of blocks) {
      if (n.type !== 'fence') continue;
      const a = n.attrs;
      const inner = renderBlocks(n.children);
      const cls = first ? 'slide is-active' : 'slide';
      first = false;
      slides.push('<section class="' + cls + '" data-title="' + escapeAttr(a.title || (meta.title || 'Slide')) + '" data-section="' + escapeAttr(a.section || '') + '" data-part="' + escapeAttr(a.part || '') + '">' + inner + '</section>');
    }
    if (!slides.length) return null;
    return { meta, slides, count: slides.length };
  }

  function wrapDeck(slidesHtml, title, css, js, count) {
    return '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>' + mdInline(title || '课件') + '</title>\n<style>' + (css || '') + '</style>\n</head>\n<body>\n<div class="deck">\n' + SIDEBAR_HTML + '\n<div class="main-area">\n' + TOPBAR_HTML + '\n' + slidesHtml + '\n</div>\n</div>\n<div class="progress-bar" id="progressBar"></div>\n<div class="page-counter"><span class="pc-cur" id="pcCur" onclick="editPageCounter()">1</span><span class="pc-total" id="pcTotal"> / ' + (count || 1) + '</span></div>\n<script>' + (js || '') + '</script>\n</body>\n</html>';
  }

  function generateTemplate(model, css, js) {
    let html = wrapDeck(model.slides.join('\n'), model.meta.title || '课件', css, js, model.count);
    const accent = (model.meta.accent || 'emerald').toLowerCase();
    const font = (model.meta.font || 'satoshi').toLowerCase();
    html = html.replace('<html lang="zh-CN">',
      '<html lang="zh-CN" data-accent="' + escapeAttr(accent) + '" data-font="' + escapeAttr(font) + '">');
    return html;
  }

  function buildFromMarkdown(md, css, js) {
    const tpl = parseTemplate(md);
    if (tpl) return { html: generateTemplate(tpl, css, js), count: tpl.count, mode: 'template' };
    const m = parseSkillDoc(md);
    const g = generate(m, css, js);
    return { html: g.html, count: g.count, mode: 'skilldoc' };
  }

  const API = {
    parseSkillDoc, generate, mdInline, stripMd, parseMdTables,
    parseTemplate, generateTemplate, buildFromMarkdown, parseFrontmatter, parseBlocks, renderMarkdown, wrapDeck,
    SIDEBAR_HTML, TOPBAR_HTML,
    _buildCover: buildCover, _buildExamSlide: buildExamSlide // 暴露给测试
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  global.CoursewareGen = API;
})(typeof window !== 'undefined' ? window : globalThis);
