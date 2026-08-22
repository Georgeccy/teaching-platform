// ============================================================
// DSE Reading Courseware MAX — Interactions V7 · v8
// v8: 从单文件 HTML 拆出为 js/main.js（内容不变）
// ============================================================

// Score Tracker
var scoreState = { correct: 0, wrong: 0, total: 0, streak: 0, maxStreak: 0 };
function recordAnswer(isCorrect) {
  scoreState.total++;
  if (isCorrect) { scoreState.correct++; scoreState.streak++; if (scoreState.streak > scoreState.maxStreak) scoreState.maxStreak = scoreState.streak; }
  else { scoreState.wrong++; scoreState.streak = 0; }
  updateScoreDisplay();
  if (isCorrect) { showToast('Correct! +1', 'success'); playRewardSound(); }
  else { showToast('Not quite. Keep going!', 'error'); playWrongSound(); }
  if (scoreState.streak >= 3) showToast('🔥 ' + scoreState.streak + ' streak!', 'info');
}

// Sound effects using Web Audio API
var audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playRewardSound() {
  try {
    var ctx = getAudioCtx();
    var now = ctx.currentTime;
    // Pleasant ascending chime
    var notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach(function(freq, i) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.2, now + i * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now + i * 0.1); osc.stop(now + i * 0.1 + 0.4);
    });
  } catch(e) {}
}

function playWrongSound() {
  try {
    var ctx = getAudioCtx();
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.3);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.35);
  } catch(e) {}
}

function playTimeUpBeep() {
  try {
    var ctx = getAudioCtx();
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.15);
  } catch(e) {}
}

function playTimeUpBeepSeries() {
  for (var i = 0; i < 3; i++) {
    setTimeout(function() { playTimeUpBeep(); }, i * 250);
  }
}
function updateScoreDisplay() {
  var badge = document.querySelector('.score-badge');
  if (badge) { badge.querySelector('.sb-correct').textContent = scoreState.correct; badge.querySelector('.sb-total').textContent = scoreState.total; badge.classList.remove('pulse'); void badge.offsetWidth; badge.classList.add('pulse'); }
  var ringFg = document.querySelector('.ring-fg'), ringText = document.querySelector('.ring-text');
  if (ringFg && scoreState.total > 0) { var pct = scoreState.correct / scoreState.total, c = 2 * Math.PI * 14; ringFg.style.strokeDasharray = c; ringFg.style.strokeDashoffset = c * (1 - pct); ringText.textContent = Math.round(pct * 100) + '%'; }
  var sdVal = document.querySelector('.sd-val'); if (sdVal) sdVal.textContent = scoreState.correct + '/' + scoreState.total;
  var streakCount = document.querySelector('.streak-badge .streak-count'); if (streakCount) streakCount.textContent = scoreState.streak;
  var streakContainer = document.querySelector('.streak-badge'); if (streakContainer) streakContainer.style.display = scoreState.streak >= 2 ? 'inline-flex' : 'none';
  var fs = document.getElementById('finalScore'), ft = document.getElementById('finalTotal');
  if (fs) fs.textContent = scoreState.correct; if (ft) ft.textContent = scoreState.total;
}
function showToast(msg, type) { var t = document.createElement('div'); t.className = 'toast ' + (type || 'info'); t.textContent = msg; document.body.appendChild(t); setTimeout(function() { if (t.parentNode) t.remove(); }, 3200); }

// Timer
var timerDuration = 300, timerRemaining = 300, timerRunning = false, timerInterval = null, timerDone = false;
var durations = [60, 120, 180, 300, 600], durIdx = 3;
function updateTimerDisplay() { var m = Math.floor(timerRemaining / 60), s = timerRemaining % 60; requestAnimationFrame(function() { var me = document.getElementById('timerMin'), se = document.getElementById('timerSec'); if (me) me.value = m; if (se) se.value = s < 10 ? '0' + s : s; }); }
function readTimerFromInputs() { var m = parseInt(document.getElementById('timerMin').value) || 0, s = parseInt(document.getElementById('timerSec').value) || 0; if (m < 0) m = 0; if (s < 0) s = 0; if (s > 59) s = 59; return m * 60 + s; }
function toggleTimer() {
  if (timerRunning) { clearInterval(timerInterval); timerInterval = null; timerRunning = false; document.getElementById('timerWrap').classList.remove('running'); document.getElementById('timerPlayBtn').classList.remove('running'); document.getElementById('timerPlayBtn').textContent = '\u25b6'; }
  else { if (timerDone) resetTimer(); if (timerRemaining <= 0) { var v = readTimerFromInputs(); if (v > 0) { timerDuration = v; timerRemaining = v; } else { timerDuration = 60; timerRemaining = 60; } updateTimerDisplay(); }
    timerInterval = setInterval(function() { timerRemaining--; updateTimerDisplay(); if (timerRemaining <= 0) { clearInterval(timerInterval); timerInterval = null; timerRunning = false; timerDone = true; document.getElementById('timerWrap').classList.remove('running'); document.getElementById('timerWrap').classList.add('done'); document.getElementById('timerPlayBtn').classList.remove('running'); document.getElementById('timerPlayBtn').classList.add('done'); document.getElementById('timerPlayBtn').textContent = '\u25b6'; showToast('\u23f1 Time is up!', 'error'); playTimeUpBeepSeries(); } }, 1000);
    timerRunning = true; timerDone = false; document.getElementById('timerWrap').classList.remove('done'); document.getElementById('timerWrap').classList.add('running'); document.getElementById('timerPlayBtn').classList.remove('done'); document.getElementById('timerPlayBtn').classList.add('running'); document.getElementById('timerPlayBtn').textContent = '\u23f8'; }
}
function resetTimer() { clearInterval(timerInterval); timerInterval = null; timerRunning = false; timerDone = false; timerRemaining = timerDuration; updateTimerDisplay(); document.getElementById('timerWrap').classList.remove('running', 'done'); document.getElementById('timerPlayBtn').classList.remove('running', 'done'); document.getElementById('timerPlayBtn').textContent = '\u25b6'; }
function cycleDuration() { durIdx = (durIdx + 1) % durations.length; timerDuration = durations[durIdx]; timerRemaining = timerDuration; timerDone = false; updateTimerDisplay(); clearInterval(timerInterval); timerInterval = null; timerRunning = false; document.getElementById('timerWrap').classList.remove('running', 'done'); document.getElementById('timerPlayBtn').classList.remove('running', 'done'); document.getElementById('timerPlayBtn').textContent = '\u25b6'; }
document.addEventListener('DOMContentLoaded', function() { var me = document.getElementById('timerMin'), se = document.getElementById('timerSec'); function sync() { if (!timerRunning && !timerDone) { var v = readTimerFromInputs(); if (v > 0) { timerDuration = v; timerRemaining = v; } } } if (me) me.addEventListener('change', sync); if (se) se.addEventListener('change', sync); });

// Zoom
var ZOOM_MIN = 0.8, ZOOM_MAX = 1.6, ZOOM_STEP = 0.1;
var zoomLevel = (function() { var s = parseFloat(localStorage.getItem('xdf-zoom-level')); return (!isNaN(s) && s >= ZOOM_MIN && s <= ZOOM_MAX) ? s : 1; })();
function applyZoom() { zoomLevel = Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomLevel)) * 100) / 100; document.documentElement.style.setProperty('--zoom-scale', zoomLevel); var l = document.getElementById('zoomLevelLabel'); if (l) l.textContent = Math.round(zoomLevel * 100) + '%'; var o = document.getElementById('zoomOutBtn'), i = document.getElementById('zoomInBtn'); if (o) o.disabled = zoomLevel <= ZOOM_MIN + 1e-6; if (i) i.disabled = zoomLevel >= ZOOM_MAX - 1e-6; try { localStorage.setItem('xdf-zoom-level', String(zoomLevel)); } catch (e) {} }
function zoomIn() { zoomLevel += ZOOM_STEP; applyZoom(); }
function zoomOut() { zoomLevel -= ZOOM_STEP; applyZoom(); }
function resetZoom() { zoomLevel = 1; applyZoom(); }
applyZoom();

// Dark Mode
function toggleDarkMode() { document.body.classList.toggle('dark'); var isDark = document.body.classList.contains('dark'); try { localStorage.setItem('xdf-dark-mode', isDark ? '1' : '0'); } catch (e) {} var btn = document.querySelector('.theme-toggle'); if (btn) btn.textContent = isDark ? '\u2600' : '\u263D'; showToast(isDark ? 'Dark mode on' : 'Light mode on', 'info'); }
function initDarkMode() { try { if (localStorage.getItem('xdf-dark-mode') === '1') { document.body.classList.add('dark'); var btn = document.querySelector('.theme-toggle'); if (btn) btn.textContent = '\u2600'; } } catch (e) {} }
initDarkMode();

// Sidebar
function toggleSidebar() { document.querySelector('.sidebar').classList.toggle('collapsed'); try { localStorage.setItem('xdf-sidebar-collapsed', document.querySelector('.sidebar').classList.contains('collapsed') ? '1' : '0'); } catch (e) {} }
function initSidebar() { try { if (localStorage.getItem('xdf-sidebar-collapsed') === '1') { var s = document.querySelector('.sidebar'); if (s) s.classList.add('collapsed'); } } catch (e) {} }
function buildSidebarNav() {
  var nav = document.querySelector('.sidebar-nav'); if (!nav) return; nav.innerHTML = '';
  var slides = document.querySelectorAll('.slide'), currentPart = '';
  slides.forEach(function(s, i) {
    var title = s.dataset.title || 'Slide ' + (i + 1), sectionType = s.dataset.section || '';
    var icon = '\u25CB';
    if (sectionType === 'cover') icon = '\uD83C\uDFE0'; else if (sectionType === 'entry-test') icon = '\uD83D\uDEAA'; else if (sectionType === 'practice') icon = '\u270F\uFE0F'; else if (sectionType === 'close-reading') icon = '\uD83D\uDCD6'; else if (sectionType === 'exit-test') icon = '\uD83D\uDEAA'; else if (sectionType === 'divider') icon = '\uD83D\uDFE2'; else if (sectionType === 'done') icon = '\uD83C\uDF89';
    var part = s.dataset.part || '';
    if (part && part !== currentPart) { currentPart = part; var secLabel = document.createElement('div'); secLabel.className = 'sidebar-section-label'; secLabel.textContent = part; nav.appendChild(secLabel); }
    var item = document.createElement('div'); item.className = 'sidebar-item' + (i === current ? ' active' : ''); item.dataset.slideIndex = i;
    item.innerHTML = '<span class="si-icon">' + icon + '</span><span class="si-label">' + title + '</span>';
    item.onclick = function() { goTo(parseInt(this.dataset.slideIndex)); };
    nav.appendChild(item);
  });
}

// Navigation
var current = 0;
var scrollPositions = {}; // per data-hard-group scroll positions

function saveScrollPosition() {
  var slides = document.querySelectorAll('.slide');
  if (!slides[current]) return;
  var group = slides[current].dataset.hardGroup;
  if (!group) return;
  var splitLeft = slides[current].querySelector('.split-left');
  if (splitLeft) scrollPositions[group] = splitLeft.scrollTop;
}

function restoreScrollPosition() {
  var slides = document.querySelectorAll('.slide');
  if (!slides[current]) return;
  var group = slides[current].dataset.hardGroup;
  var splitLeft = slides[current].querySelector('.split-left');
  if (!group || !splitLeft) { slides[current].scrollTop = 0; return; }
  splitLeft.scrollTop = scrollPositions[group] || 0;
}

function initDots() { var slides = document.querySelectorAll('.slide'), dots = document.getElementById('progressDots'); if (!dots) return; dots.innerHTML = ''; slides.forEach(function(_, i) { var d = document.createElement('span'); d.className = 'dot'; d.dataset.pn = '' + (i + 1); d.onclick = function() { goTo(i); }; dots.appendChild(d); }); }
function updateUI() {
  var slides = document.querySelectorAll('.slide'); slides.forEach(function(s, i) { s.classList.toggle('is-active', i === current); });
  var dots = document.getElementById('progressDots'); if (dots) { dots.querySelectorAll('.dot').forEach(function(d, i) { d.classList.toggle('active', i === current); d.classList.toggle('passed', i < current); }); }
  var pct = slides.length > 1 ? Math.round((current / (slides.length - 1)) * 100) : 0;
  var bar = document.getElementById('progressBar'); if (bar) bar.style.width = pct + '%';
  var tt = document.getElementById('topbarTitle'); if (tt) tt.textContent = slides[current].dataset.title || '';
  var pcCur = document.getElementById('pcCur'), pcTotal = document.getElementById('pcTotal');
  if (pcCur) pcCur.textContent = (current + 1); if (pcTotal) pcTotal.textContent = ' / ' + slides.length;
  slides[current].scrollTop = 0;
  restoreScrollPosition();
  reapplyAllHighlights();
  document.querySelectorAll('.sidebar-item').forEach(function(item) { var idx = parseInt(item.dataset.slideIndex); item.classList.toggle('active', idx === current); });
  var ai = document.querySelector('.sidebar-item.active'); if (ai) ai.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
function goTo(i) { var slides = document.querySelectorAll('.slide'); if (i < 0 || i >= slides.length || i === current) return; saveScrollPosition(); current = i; updateUI(); applyHardMode(); restoreScrollPosition(); }
document.addEventListener('keydown', function(e) { if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(current + 1); if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goTo(current - 1); });
function editPageCounter() {
  var curEl = document.getElementById('pcCur'), total = document.querySelectorAll('.slide').length;
  var input = document.createElement('input'); input.type = 'number'; input.className = 'pc-cur-input'; input.min = 1; input.max = total; input.value = current + 1;
  curEl.replaceWith(input); input.focus(); input.select();
  function finish() { var val = parseInt(input.value); var span = document.createElement('span'); span.className = 'pc-cur'; span.id = 'pcCur'; span.onclick = editPageCounter; if (!isNaN(val) && val >= 1 && val <= total && val !== current + 1) { span.textContent = val; input.replaceWith(span); goTo(val - 1); } else { span.textContent = current + 1; input.replaceWith(span); } }
  input.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); finish(); } if (e.key === 'Escape') { e.preventDefault(); var s = document.createElement('span'); s.className = 'pc-cur'; s.id = 'pcCur'; s.onclick = editPageCounter; s.textContent = current + 1; input.replaceWith(s); } });
  input.addEventListener('blur', finish);
}

// MC Check
function checkMC(el, isCorrect, containerId, explanation) {
  var container = document.getElementById(containerId); if (!container || el.classList.contains('answered')) return;
  var allOpts = container.querySelectorAll('.pmcq-opt'), correctOpt = null;
  allOpts.forEach(function(o) { if (o.getAttribute('data-correct') === 'true') correctOpt = o; });
  el.classList.add('answered'); el.classList.add(isCorrect ? 'correct' : 'wrong');
  recordAnswer(isCorrect);
  var practiceBox = el.closest('.practice-mcq') || container.parentNode;
  var oldBanner = practiceBox.querySelector(':scope > .mc-banner'); if (oldBanner) oldBanner.remove();
  var banner = document.createElement('div'); banner.className = isCorrect ? 'mc-banner mc-correct' : 'mc-banner mc-wrong';
  banner.innerHTML = '<div class="tick">' + (isCorrect ? '\u2705' : '\u274c') + '</div><div><div class="at">' + (isCorrect ? 'Correct!' : 'Incorrect') + '</div><div class="asub">' + (explanation || '') + '</div></div>';
  container.insertAdjacentElement('afterend', banner);
  var answeredCount = container.querySelectorAll('.pmcq-opt.answered').length;
  if (isCorrect || answeredCount >= allOpts.length) { if (correctOpt && !isCorrect) correctOpt.classList.add('correct-revealed'); container.classList.add('answered'); }
}
function checkMCAuto(el) {
  if (el.classList.contains('answered')) return;
  var container = el.closest('.practice-mcq'); if (!container || container.classList.contains('answered')) return;
  var isCorrect = el.getAttribute('data-correct') === 'true';
  el.classList.add(isCorrect ? 'correct' : 'wrong'); el.classList.add('answered');
  recordAnswer(isCorrect);
  if (isCorrect) { container.classList.add('answered'); container.querySelectorAll('.pmcq-opt').forEach(function(o) { o.classList.add('answered'); }); var banner = document.createElement('div'); banner.className = 'mc-banner mc-correct'; banner.innerHTML = '<span class="tick">\u2705</span><div><div class="at">Correct!</div></div>'; container.insertAdjacentElement('afterend', banner);
    // Show associated method-badge if present
    var methodWrap = container.parentNode.querySelector('.method-wrap');
    if (methodWrap) methodWrap.style.display = 'block';
  }
  else { var b2 = document.createElement('div'); b2.className = 'mc-banner mc-wrong'; b2.innerHTML = '<span class="tick">\u274c</span><div><div class="at">Not quite</div><div class="asub">' + (el.getAttribute('data-explain') || '') + '</div></div>'; container.insertAdjacentElement('afterend', b2); }
}

function toggleRev(id) { var el = document.getElementById(id); if (el) el.classList.toggle('show'); }
function revealCloze(el) { if (el.classList.contains('revealed')) return; el.textContent = el.getAttribute('data-answer'); el.classList.add('revealed'); }

// TFNG (True / False / Not Given) — answer stored on the parent .tfng-group via data-answer
function checkTFNG(btn) {
  var group = btn.closest('.tfng-group');
  if (!group || group.classList.contains('answered')) return;
  var correct = group.getAttribute('data-answer');
  var picked = btn.textContent.trim();
  var isCorrect = (picked === correct);
  group.classList.add('answered');
  group.querySelectorAll('.tfng-btn').forEach(function(b) {
    if (b.textContent.trim() === correct) b.classList.add('correct');
    else if (b === btn && !isCorrect) b.classList.add('wrong');
  });
  recordAnswer(isCorrect);
}

// Q1 Two-step reveal
function revealQ1Row(rowId) {
  var row = document.getElementById(rowId);
  if (!row) return;
  row.classList.add('revealed');
  // Attach click handlers to cloze spans so they become clickable
  var clozes = row.querySelectorAll('.cloze');
  for (var i = 0; i < clozes.length; i++) {
    clozes[i].onclick = function() { revealCloze(this); };
  }
  var btn = row.querySelector('.q1-tap-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Revealed ✓'; }
}

// Q16 Hidden hints
function revealQ16Hints() {
  var hints = document.getElementById('q16-hints');
  if (hints) hints.style.display = 'block';
}

// Q20 Drag-Drop
(function() {
  var draggedEl = null;
  function initQ20Drag() {
    var pool = document.getElementById('q20-pool');
    var zones = document.querySelectorAll('.drop-zone');
    var draggables = document.querySelectorAll('#q20-pool .draggable');

    draggables.forEach(function(d) {
      d.addEventListener('dragstart', function(e) {
        draggedEl = d;
        e.dataTransfer.effectAllowed = 'move';
        d.classList.add('dragging');
      });
      d.addEventListener('dragend', function() {
        d.classList.remove('dragging');
        draggedEl = null;
        zones.forEach(function(z) { z.classList.remove('drag-over'); });
      });
      // Touch support
      d.addEventListener('touchstart', function(e) {
        draggedEl = d;
        d.classList.add('dragging');
      }, {passive: true});
      d.addEventListener('touchend', function() {
        if (!draggedEl) return;
        var touch = event.changedTouches[0];
        var target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target) {
          var zone = target.closest('.drop-zone');
          if (zone) { placeInZone(draggedEl, zone); }
        }
        d.classList.remove('dragging');
        draggedEl = null;
      }, {passive: true});
    });

    zones.forEach(function(z) {
      z.addEventListener('dragover', function(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; z.classList.add('drag-over'); if (typeof autoScrollToVisible === 'function') autoScrollToVisible(e, z); });
      z.addEventListener('dragleave', function() { z.classList.remove('drag-over'); });
      z.addEventListener('drop', function(e) {
        e.preventDefault();
        z.classList.remove('drag-over');
        if (draggedEl) { placeInZone(draggedEl, z); }
      });
    });

    pool.addEventListener('dragover', function(e) { e.preventDefault(); if (typeof autoScrollToVisible === 'function') autoScrollToVisible(e, pool); });
    pool.addEventListener('drop', function(e) {
      e.preventDefault();
      if (draggedEl) { pool.appendChild(draggedEl); draggedEl.classList.remove('correct-placed','wrong-placed'); sortDraggablesInPool(pool); }
    });
  }

  function placeInZone(el, zone) {
    var content = zone.querySelector('.drop-content');
    // If zone already has a draggable, return it to pool
    var existing = content.querySelector('.draggable');
    if (existing) { var p = document.getElementById('q20-pool'); p.appendChild(existing); existing.classList.remove('correct-placed','wrong-placed'); sortDraggablesInPool(p); }
    content.appendChild(el);
    el.classList.remove('correct-placed','wrong-placed');
  }

  function sortDraggablesInPool(pool) {
    if (!pool) return;
    var items = Array.from(pool.querySelectorAll('.draggable'));
    items.sort(function(a, b) { return (a.dataset.word || '').localeCompare(b.dataset.word || ''); });
    items.forEach(function(it) { pool.appendChild(it); });
  }

  window.checkQ20Drag = function() {
    var zones = document.querySelectorAll('#q20-pool ~ div .drop-zone');
    var correct = 0, total = 5;
    var answers = { 'I': 'E', 'II': 'B', 'III': 'A', 'IV': 'C', 'notused': 'D' };
    zones.forEach(function(z) {
      var accept = z.dataset.accept;
      var placed = z.querySelector('.draggable');
      if (placed) {
        var cat = placed.dataset.cat;
        placed.classList.remove('correct-placed','wrong-placed');
        if (cat === accept) { placed.classList.add('correct-placed'); correct++; }
        else { placed.classList.add('wrong-placed'); }
      }
    });
    var result = document.getElementById('q20-result');
    if (result) {
      result.style.display = 'block';
      if (correct === total) {
        result.style.background = 'rgba(0,71,27,.08)';
        result.style.border = '2px solid var(--fcc-green-dark)';
        result.style.color = 'var(--fcc-green-dark)';
        result.innerHTML = '✅ All correct! ' + correct + '/' + total + '<br>Section I → E. Double-duped! / Section II → B. An explosion / Section III → A. Steering / Section IV → C. New language / Not Used → D. Hitting back' + '<br><br><span class="method-badge">🔑 三步法：Step 1 Skim 首尾句判断每个 section 的 function。Step 2 从最容易确定的开始匹配。Step 3 排除确认，划掉已用选项。</span>';
      } else {
        result.style.background = '#FFF5F5';
        result.style.border = '2px solid var(--brand-red)';
        result.style.color = 'var(--brand-red)';
        result.innerHTML = '❌ ' + correct + '/' + total + ' correct. Wrong-placed items are highlighted in red. Try again!' + '<br><br><span class="method-badge">🔑 三步法：Step 1 Skim 首尾句判断每个 section 的 function。Step 2 从最容易确定的开始匹配。Step 3 排除确认，划掉已用选项。</span>';
      }
    }
  };

  window.resetQ20Drag = function() {
    var pool = document.getElementById('q20-pool');
    var draggables = document.querySelectorAll('#q20-pool .draggable, .drop-zone .draggable');
    draggables.forEach(function(d) {
      d.classList.remove('correct-placed','wrong-placed');
      pool.appendChild(d);
    });
    sortDraggablesInPool(pool);
    var result = document.getElementById('q20-result');
    if (result) result.style.display = 'none';
  };

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQ20Drag);
  } else {
    initQ20Drag();
  }
})();

// Q17 Drag-Drop — Character-Comment Matching
(function() {
  var q17dragged = null;
  function initQ17Drag() {
    var pool = document.getElementById('q17-pool');
    var zones = document.querySelectorAll('#q17-pool ~ div .drop-zone');
    var draggables = document.querySelectorAll('#q17-pool .draggable');

    draggables.forEach(function(d) {
      d.addEventListener('dragstart', function(e) {
        q17dragged = d;
        e.dataTransfer.effectAllowed = 'move';
        d.classList.add('dragging');
      });
      d.addEventListener('dragend', function() {
        d.classList.remove('dragging');
        q17dragged = null;
        zones.forEach(function(z) { z.classList.remove('drag-over'); });
      });
      d.addEventListener('touchstart', function(e) {
        q17dragged = d;
        d.classList.add('dragging');
      }, {passive: true});
      d.addEventListener('touchend', function() {
        if (!q17dragged) return;
        var touch = event.changedTouches[0];
        var target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target) {
          var zone = target.closest('.drop-zone');
          if (zone && zone.id && zone.id.indexOf('q17-dz') === 0) { q17placeInZone(q17dragged, zone); }
        }
        d.classList.remove('dragging');
        q17dragged = null;
      }, {passive: true});
    });

    zones.forEach(function(z) {
      z.addEventListener('dragover', function(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; z.classList.add('drag-over'); if (typeof autoScrollToVisible === 'function') autoScrollToVisible(e, z); });
      z.addEventListener('dragleave', function() { z.classList.remove('drag-over'); });
      z.addEventListener('drop', function(e) {
        e.preventDefault();
        z.classList.remove('drag-over');
        if (q17dragged) { q17placeInZone(q17dragged, z); }
      });
    });

    pool.addEventListener('dragover', function(e) { e.preventDefault(); if (typeof autoScrollToVisible === 'function') autoScrollToVisible(e, pool); });
    pool.addEventListener('drop', function(e) {
      e.preventDefault();
      if (q17dragged) { pool.appendChild(q17dragged); q17dragged.classList.remove('correct-placed','wrong-placed'); sortQ17Draggables(pool); }
    });
  }

  function q17placeInZone(el, zone) {
    var content = zone.querySelector('.drop-content');
    var existing = content.querySelector('.draggable');
    if (existing) { var p = document.getElementById('q17-pool'); p.appendChild(existing); existing.classList.remove('correct-placed','wrong-placed'); sortQ17Draggables(p); }
    content.appendChild(el);
    el.classList.remove('correct-placed','wrong-placed');
  }

  function sortQ17Draggables(pool) {
    if (!pool) return;
    var items = Array.from(pool.querySelectorAll('.draggable'));
    items.sort(function(a, b) { return (a.dataset.word || '').localeCompare(b.dataset.word || ''); });
    items.forEach(function(it) { pool.appendChild(it); });
  }

  window.checkQ17Drag = function() {
    var poolZones = document.getElementById('q17-pool');
    var q17zones = [document.getElementById('q17-dz-i'), document.getElementById('q17-dz-ii'), document.getElementById('q17-dz-iii'), document.getElementById('q17-dz-iv'), document.getElementById('q17-dz-v'), document.getElementById('q17-dz-vi')];
    var correct = 0, total = 6;
    q17zones.forEach(function(z) {
      if (!z) return;
      var accept = z.dataset.accept;
      var placed = z.querySelector('.draggable');
      if (placed) {
        var cat = placed.dataset.cat;
        placed.classList.remove('correct-placed','wrong-placed');
        if (cat === accept) { placed.classList.add('correct-placed'); correct++; }
        else { placed.classList.add('wrong-placed'); }
      }
    });
    var result = document.getElementById('q17-result');
    if (result) {
      result.style.display = 'block';
      if (correct === total) {
        result.style.background = 'rgba(0,71,27,.08)';
        result.style.border = '2px solid var(--fcc-green-dark)';
        result.style.color = 'var(--fcc-green-dark)';
        result.innerHTML = '✅ All correct! ' + correct + '/' + total + '<br>A→(v) · B→(iii) · C→(iv) · D→(i) · E→(vi) · F→(ii)<br><br><span class="method-badge">🔑 三步法：(1) 建立"人物卡片"（职业+立场）；(2) 判断每条 comment 的语气；(3) 匹配检查一致性。</span>';
      } else {
        result.style.background = '#FFF5F5';
        result.style.border = '2px solid var(--brand-red)';
        result.style.color = 'var(--brand-red)';
        result.innerHTML = '❌ ' + correct + '/' + total + ' correct. Wrong-placed items are highlighted in red. Try again!<br><br><span class="method-badge">🔑 三步法：(1) 建立"人物卡片"（职业+立场）；(2) 判断每条 comment 的语气；(3) 匹配检查一致性。</span>';
      }
    }
  };

  window.resetQ17Drag = function() {
    var pool = document.getElementById('q17-pool');
    var draggables = document.querySelectorAll('#q17-pool .draggable, #q17-pool ~ div .drop-zone .draggable');
    draggables.forEach(function(d) {
      d.classList.remove('correct-placed','wrong-placed');
      pool.appendChild(d);
    });
    sortQ17Draggables(pool);
    var result = document.getElementById('q17-result');
    if (result) result.style.display = 'none';
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQ17Drag);
  } else {
    initQ17Drag();
  }
})();

// FP1 Drag-Drop — Subheading Matching (§8-10)
(function() {
  var fp1dragged = null;
  function initFP1Drag() {
    var pool = document.getElementById('fp1-pool');
    var zones = document.querySelectorAll('#fp1-pool ~ div .drop-zone');
    var draggables = document.querySelectorAll('#fp1-pool .draggable');

    draggables.forEach(function(d) {
      d.addEventListener('dragstart', function(e) {
        fp1dragged = d;
        e.dataTransfer.effectAllowed = 'move';
        d.classList.add('dragging');
      });
      d.addEventListener('dragend', function() {
        d.classList.remove('dragging');
        fp1dragged = null;
        zones.forEach(function(z) { z.classList.remove('drag-over'); });
      });
      d.addEventListener('touchstart', function(e) {
        fp1dragged = d;
        d.classList.add('dragging');
      }, {passive: true});
      d.addEventListener('touchend', function() {
        if (!fp1dragged) return;
        var touch = event.changedTouches[0];
        var target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target) {
          var zone = target.closest('.drop-zone');
          if (zone && zone.id && zone.id.indexOf('fp1-dz') === 0) { fp1placeInZone(fp1dragged, zone); }
        }
        d.classList.remove('dragging');
        fp1dragged = null;
      }, {passive: true});
    });

    zones.forEach(function(z) {
      z.addEventListener('dragover', function(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; z.classList.add('drag-over'); if (typeof autoScrollToVisible === 'function') autoScrollToVisible(e, z); });
      z.addEventListener('dragleave', function() { z.classList.remove('drag-over'); });
      z.addEventListener('drop', function(e) {
        e.preventDefault();
        z.classList.remove('drag-over');
        if (fp1dragged) { fp1placeInZone(fp1dragged, z); }
      });
    });

    pool.addEventListener('dragover', function(e) { e.preventDefault(); if (typeof autoScrollToVisible === 'function') autoScrollToVisible(e, pool); });
    pool.addEventListener('drop', function(e) {
      e.preventDefault();
      if (fp1dragged) { pool.appendChild(fp1dragged); fp1dragged.classList.remove('correct-placed','wrong-placed'); sortFP1Draggables(pool); }
    });
  }

  function fp1placeInZone(el, zone) {
    var content = zone.querySelector('.drop-content');
    var existing = content.querySelector('.draggable');
    if (existing) { var p = document.getElementById('fp1-pool'); p.appendChild(existing); existing.classList.remove('correct-placed','wrong-placed'); sortFP1Draggables(p); }
    content.appendChild(el);
    el.classList.remove('correct-placed','wrong-placed');
  }

  function sortFP1Draggables(pool) {
    if (!pool) return;
    var items = Array.from(pool.querySelectorAll('.draggable'));
    items.sort(function(a, b) { return (a.dataset.word || '').localeCompare(b.dataset.word || ''); });
    items.forEach(function(it) { pool.appendChild(it); });
  }

  window.checkFP1Drag = function() {
    var fp1zones = [document.getElementById('fp1-dz-i'), document.getElementById('fp1-dz-ii'), document.getElementById('fp1-dz-iii'), document.getElementById('fp1-dz-iv')];
    var correct = 0, total = 4;
    fp1zones.forEach(function(z) {
      if (!z) return;
      var accept = z.dataset.accept;
      var placed = z.querySelector('.draggable');
      if (placed) {
        var cat = placed.dataset.cat;
        placed.classList.remove('correct-placed','wrong-placed');
        if (cat === accept) { placed.classList.add('correct-placed'); correct++; }
        else { placed.classList.add('wrong-placed'); }
      }
    });
    var result = document.getElementById('fp1-result');
    if (result) {
      result.style.display = 'block';
      if (correct === total) {
        result.style.background = 'rgba(0,71,27,.08)';
        result.style.border = '2px solid var(--fcc-green-dark)';
        result.style.color = 'var(--fcc-green-dark)';
        result.innerHTML = '✅ All correct! ' + correct + '/' + total + '<br>(i)→§10 · (ii)→§8 · (iii)→X · (iv)→§9';
      } else {
        result.style.background = '#FFF5F5';
        result.style.border = '2px solid var(--brand-red)';
        result.style.color = 'var(--brand-red)';
        result.innerHTML = '❌ ' + correct + '/' + total + ' correct. Try again!';
      }
    }
  };

  window.resetFP1Drag = function() {
    var pool = document.getElementById('fp1-pool');
    var draggables = document.querySelectorAll('#fp1-pool .draggable, #fp1-pool ~ div .drop-zone .draggable');
    draggables.forEach(function(d) {
      d.classList.remove('correct-placed','wrong-placed');
      pool.appendChild(d);
    });
    sortFP1Draggables(pool);
    var result = document.getElementById('fp1-result');
    if (result) result.style.display = 'none';
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFP1Drag);
  } else {
    initFP1Drag();
  }
})();

// Drag auto-scroll: when dragging near scrollable container edge, auto-scroll
function findScrollableAncestor(el) {
  var node = el;
  while (node && node !== document.body && node !== document.documentElement) {
    var cs = window.getComputedStyle(node);
    if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && node.scrollHeight - node.clientHeight > 2) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}
var __edgeScroll = { raf: null, container: null, dir: 0, speed: 0 };
function stopEdgeAutoScroll() {
  if (__edgeScroll.raf) cancelAnimationFrame(__edgeScroll.raf);
  __edgeScroll.raf = null; __edgeScroll.container = null; __edgeScroll.dir = 0; __edgeScroll.speed = 0;
}
function runEdgeAutoScroll() {
  if (!__edgeScroll.container || !__edgeScroll.dir) { __edgeScroll.raf = null; return; }
  __edgeScroll.container.scrollTop += __edgeScroll.dir * __edgeScroll.speed;
  __edgeScroll.raf = requestAnimationFrame(runEdgeAutoScroll);
}
function autoScrollToVisible(e, refEl) {
  try {
    var container = findScrollableAncestor(refEl || (e && e.target));
    if (!container || !e || typeof e.clientY !== 'number') { stopEdgeAutoScroll(); return; }
    var rect = container.getBoundingClientRect();
    var edge = 55;
    var distBottom = rect.bottom - e.clientY;
    var distTop = e.clientY - rect.top;
    if (distBottom >= 0 && distBottom < edge && container.scrollTop + container.clientHeight < container.scrollHeight - 1) {
      __edgeScroll.container = container; __edgeScroll.dir = 1;
      __edgeScroll.speed = 2 + (edge - distBottom) / edge * 7;
      if (!__edgeScroll.raf) __edgeScroll.raf = requestAnimationFrame(runEdgeAutoScroll);
    } else if (distTop >= 0 && distTop < edge && container.scrollTop > 0) {
      __edgeScroll.container = container; __edgeScroll.dir = -1;
      __edgeScroll.speed = 2 + (edge - distTop) / edge * 7;
      if (!__edgeScroll.raf) __edgeScroll.raf = requestAnimationFrame(runEdgeAutoScroll);
    } else {
      stopEdgeAutoScroll();
    }
  } catch (err) {}
}
document.addEventListener('dragend', stopEdgeAutoScroll);
document.addEventListener('drop', stopEdgeAutoScroll);

// Right-click highlight
function passageHash(text) { var h = 0; for (var i = 0; i < text.length; i++) { h = ((h << 5) - h) + text.charCodeAt(i); h |= 0; } return 'hl_' + Math.abs(h); }
function getHighlights(el) { var k = passageHash(el.textContent); try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch (e) { return []; } }
function saveHighlights(el, arr) { var k = passageHash(el.textContent); try { localStorage.setItem(k, JSON.stringify(arr)); } catch (e) {} }
function applyHighlights(el) { var list = getHighlights(el); if (!list.length) return; list.forEach(function(txt) { if (!txt || !txt.trim()) return; function walk(node) { if (node.nodeType === 3) { var val = node.nodeValue; if (val.indexOf(txt) >= 0) { var span = document.createElement('span'); span.className = 'user-highlight'; var idx = val.indexOf(txt); span.textContent = txt; var b = document.createTextNode(val.substring(0, idx)), a = document.createTextNode(val.substring(idx + txt.length)), p = node.parentNode; p.insertBefore(b, node); p.insertBefore(span, node); p.insertBefore(a, node); p.removeChild(node); } } else if (node.nodeType === 1 && node.nodeName !== 'SCRIPT' && !node.classList.contains('user-highlight')) { Array.from(node.childNodes).forEach(walk); } } walk(el); }); }
function handleHighlight(e, el) { e.preventDefault(); var sel = window.getSelection(); if (!sel || sel.isCollapsed) return; var range = sel.getRangeAt(0); if (!el.contains(range.commonAncestorContainer) && !el.contains(range.startContainer)) return; var startNode = range.startContainer, parent = startNode.nodeType === 3 ? startNode.parentNode : startNode; var existing = parent.closest && parent.closest('.user-highlight'); if (existing) { var ht = existing.textContent, t = document.createTextNode(ht); existing.parentNode.replaceChild(t, existing); var list = getHighlights(el), idx = list.indexOf(ht); if (idx >= 0) list.splice(idx, 1); saveHighlights(el, list); } else { try { var span = document.createElement('span'); span.className = 'user-highlight'; var fragment = range.extractContents(), ht = fragment.textContent; span.appendChild(fragment); range.insertNode(span); if (ht && ht.trim()) { var list = getHighlights(el); if (list.indexOf(ht) < 0) list.push(ht); saveHighlights(el, list); } } catch (err) {} } sel.removeAllRanges(); }
function reapplyAllHighlights() { var sel = hardMode ? '.passage-excerpt, .split-right, .split-left' : '.passage-excerpt, .split-right'; document.querySelectorAll(sel).forEach(applyHighlights); }
function clearAllHighlights() { document.querySelectorAll('.user-highlight').forEach(function(s) { var t = document.createTextNode(s.textContent); s.parentNode.replaceChild(t, s); }); var keys = []; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.startsWith('hl_')) keys.push(k); } keys.forEach(function(k) { localStorage.removeItem(k); }); showToast('Highlights cleared', 'info'); }

// Confetti — GREEN THEME COLORS
function launchConfetti() { var w = document.createElement('div'); w.className = 'confetti-wrap'; document.body.appendChild(w); var colors = ['#0B8235', '#4CAF50', '#C85D0A', '#1A6DAF', '#C0392B', '#FFD54F', '#b8e6b8', '#99c9ff', '#acd157']; for (var i = 0; i < 80; i++) { var p = document.createElement('div'); p.className = 'c-piece'; p.style.left = Math.random() * 100 + '%'; p.style.width = (6 + Math.random() * 10) + 'px'; p.style.height = p.style.width; p.style.borderRadius = Math.random() > .5 ? '50%' : '2px'; p.style.background = colors[Math.floor(Math.random() * colors.length)]; p.style.animationDuration = (2 + Math.random() * 3) + 's'; p.style.animationDelay = (Math.random() * 2) + 's'; w.appendChild(p); } setTimeout(function() { w.remove(); }, 6000); }

// Touch Swipe
(function() { var tsX = 0, tsY = 0, threshold = 50, ratio = 1.5; function isScrollable(el) { if (!el) return false; var s = window.getComputedStyle(el); return (s.overflowY === 'auto' || s.overflowY === 'scroll') && el.scrollHeight > el.clientHeight; }
  document.addEventListener('touchstart', function(e) { var t = e.target, inScroll = false; while (t && t !== document.body) { if (isScrollable(t)) { inScroll = true; break; } t = t.parentElement; } if (inScroll) { tsX = 0; tsY = 0; return; } tsX = e.changedTouches[0].screenX; tsY = e.changedTouches[0].screenY; }, { passive: true });
  document.addEventListener('touchend', function(e) { if (tsX === 0 && tsY === 0) return; var ex = e.changedTouches[0].screenX, ey = e.changedTouches[0].screenY, dx = ex - tsX, dy = ey - tsY; tsX = 0; tsY = 0; if (Math.abs(dx) < threshold) return; if (Math.abs(dy) > Math.abs(dx) * ratio) return; if (dx < 0) goTo(current + 1); else goTo(current - 1); }, { passive: true });
})();

// Keyboard
document.addEventListener('keydown', function(e) {
  if (e.key === 'd' && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); toggleDarkMode(); }
  if (e.key === 's' && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); toggleSidebar(); }
});

// Init
initDots(); updateUI(); initSidebar();
document.addEventListener('DOMContentLoaded', function() { buildSidebarNav(); reapplyAllHighlights(); });
// Right-side highlight support via event delegation
document.addEventListener('contextmenu', function(e) {
  var splitRight = e.target.closest('.split-right');
  if (splitRight) { handleHighlight(e, splitRight); }
});

// ============================================================
// Hard Mode — Full Passage Toggle
// ============================================================
var hardMode = false;
var hardModeOriginals = {};

function splitLeftHTML(textName) {
  var template = document.getElementById('hard-template-' + textName);
  return template ? template.innerHTML : '';
}

function toggleHardMode() {
  hardMode = !hardMode;
  var btn = document.getElementById('hardmodeBtn');
  if (hardMode) {
    btn.textContent = '🔓 Hard';
    btn.classList.add('active');
  } else {
    btn.textContent = '🔒 Easy';
    btn.classList.remove('active');
  }
  applyHardMode();
}

function applyHardMode() {
  var slides = document.querySelectorAll('.slide[data-hard-group]');
  slides.forEach(function(slide) {
    var group = slide.dataset.hardGroup;
    var splitLeft = slide.querySelector('.split-left');
    if (!splitLeft) return;

    var slideId = slide.dataset.title;

    if (hardMode) {
      if (!hardModeOriginals[slideId]) {
        hardModeOriginals[slideId] = splitLeft.innerHTML;
      }
      splitLeft.innerHTML = splitLeftHTML(group);
    } else {
      var orig = hardModeOriginals[slideId];
      if (orig) {
        splitLeft.innerHTML = orig;
        delete hardModeOriginals[slideId];
      }
    }
  });
  reapplyAllHighlights();
}
