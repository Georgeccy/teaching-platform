
// ============================================================
// DSE Reading Courseware MAX — Interactions V7
// Inspired by: freeCodeCamp (terminal-chic UX) + Khan Academy (teacher tools)
// Base: V6 reading-interactions.js
// ============================================================

// === Score Tracker (new in V7) ===
var scoreState = { correct: 0, wrong: 0, total: 0, streak: 0, maxStreak: 0 };
function recordAnswer(isCorrect) {
  scoreState.total++;
  if (isCorrect) {
    scoreState.correct++;
    scoreState.streak++;
    if (scoreState.streak > scoreState.maxStreak) scoreState.maxStreak = scoreState.streak;
  } else {
    scoreState.wrong++;
    scoreState.streak = 0;
  }
  updateScoreDisplay();
  if (isCorrect) showToast('Correct! +1', 'success');
  else showToast('Not quite. Keep going!', 'error');
  if (scoreState.streak >= 3) showToast('🔥 ' + scoreState.streak + ' streak!', 'info');
  // Sound feedback (V8 §16)
  if (isCorrect) playRewardSound(); else playWrongSound();
}
function updateScoreDisplay() {
  var badge = document.querySelector('.score-badge');
  if (badge) {
    badge.querySelector('.sb-correct').textContent = scoreState.correct;
    badge.querySelector('.sb-total').textContent = scoreState.total;
    badge.classList.remove('pulse');
    void badge.offsetWidth;
    badge.classList.add('pulse');
  }
  var ringFg = document.querySelector('.ring-fg');
  var ringText = document.querySelector('.ring-text');
  if (ringFg && scoreState.total > 0) {
    var pct = scoreState.correct / scoreState.total;
    var circumference = 2 * Math.PI * 14;
    ringFg.style.strokeDasharray = circumference;
    ringFg.style.strokeDashoffset = circumference * (1 - pct);
    ringText.textContent = Math.round(pct * 100) + '%';
  }
  var sdVal = document.querySelector('.sd-val');
  if (sdVal) sdVal.textContent = scoreState.correct + '/' + scoreState.total;
  var streakBadge = document.querySelector('.streak-badge .streak-count');
  if (streakBadge) streakBadge.textContent = scoreState.streak;
  var streakContainer = document.querySelector('.streak-badge');
  if (streakContainer) streakContainer.style.display = scoreState.streak >= 2 ? 'inline-flex' : 'none';
  // Fix: also populate the Done-slide badge (querySelector only hits the first .score-badge)
  var fs = document.getElementById('finalScore'), ft = document.getElementById('finalTotal');
  if (fs) fs.textContent = scoreState.correct;
  if (ft) ft.textContent = scoreState.total;
}

// === Toast Notifications (new in V7) ===
function showToast(msg, type) {
  var toast = document.createElement('div');
  toast.className = 'toast ' + (type || 'info');
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(function() { if (toast.parentNode) toast.remove(); }, 3200);
}

// === Sound Effects (V8 §16 — Web Audio API 合成，无外部文件) ===
var audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function playRewardSound() { // 答对：C5→E5→G5 sine 上行三连音
  try {
    var ctx = getAudioCtx();
    [523.25, 659.25, 783.99].forEach(function(freq, i) {
      var osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, ctx.currentTime + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + i * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.09 + 0.22);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.09); osc.stop(ctx.currentTime + i * 0.09 + 0.25);
    });
  } catch (e) {}
}
function playWrongSound() { // 答错：200→100Hz sawtooth 下滑
  try {
    var ctx = getAudioCtx();
    var osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
}
function playTimeUpBeep() { // 单声：880Hz square 短促
  try {
    var ctx = getAudioCtx();
    var osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = 'square'; osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.16);
  } catch (e) {}
}
function playTimeUpBeepSeries() { // 计时到：3 次滴滴滴，间隔 250ms
  playTimeUpBeep();
  setTimeout(playTimeUpBeep, 250);
  setTimeout(playTimeUpBeep, 500);
}

// === Timer (V7 — fCC-styled) ===
var timerDuration = 300, timerRemaining = 300, timerRunning = false, timerInterval = null, timerDone = false;
var durations = [60, 120, 180, 300, 600], durIdx = 3;
function updateTimerDisplay() {
  var min = Math.floor(timerRemaining / 60), sec = timerRemaining % 60;
  requestAnimationFrame(function() {
    var minEl = document.getElementById('timerMin');
    var secEl = document.getElementById('timerSec');
    if (minEl) minEl.value = min;
    if (secEl) secEl.value = sec < 10 ? '0' + sec : sec;
  });
}
function readTimerFromInputs() {
  var m = parseInt(document.getElementById('timerMin').value) || 0;
  var s = parseInt(document.getElementById('timerSec').value) || 0;
  if (m < 0) m = 0; if (s < 0) s = 0; if (s > 59) s = 59; return m * 60 + s;
}
function toggleTimer() {
  if (timerRunning) {
    clearInterval(timerInterval); timerInterval = null; timerRunning = false;
    document.getElementById('timerWrap').classList.remove('running');
    document.getElementById('timerPlayBtn').classList.remove('running');
    document.getElementById('timerPlayBtn').textContent = '\u25b6';
  } else {
    if (timerDone) { resetTimer(); }
    if (timerRemaining <= 0) {
      var v = readTimerFromInputs();
      if (v > 0) { timerDuration = v; timerRemaining = v; }
      else { timerDuration = 60; timerRemaining = 60; }
      updateTimerDisplay();
    }
    timerInterval = setInterval(function() {
      timerRemaining--; updateTimerDisplay();
      if (timerRemaining <= 0) {
        clearInterval(timerInterval); timerInterval = null; timerRunning = false; timerDone = true;
        document.getElementById('timerWrap').classList.remove('running');
        document.getElementById('timerWrap').classList.add('done');
        document.getElementById('timerPlayBtn').classList.remove('running');
        document.getElementById('timerPlayBtn').classList.add('done');
        document.getElementById('timerPlayBtn').textContent = '\u25b6';
        showToast('⏱ Time is up!', 'error');
        playTimeUpBeepSeries();
      }
    }, 1000);
    timerRunning = true; timerDone = false;
    document.getElementById('timerWrap').classList.remove('done');
    document.getElementById('timerWrap').classList.add('running');
    document.getElementById('timerPlayBtn').classList.remove('done');
    document.getElementById('timerPlayBtn').classList.add('running');
    document.getElementById('timerPlayBtn').textContent = '\u23f8';
  }
}
function resetTimer() {
  clearInterval(timerInterval); timerInterval = null;
  timerRunning = false; timerDone = false;
  timerRemaining = timerDuration;
  updateTimerDisplay();
  document.getElementById('timerWrap').classList.remove('running', 'done');
  document.getElementById('timerPlayBtn').classList.remove('running', 'done');
  document.getElementById('timerPlayBtn').textContent = '\u25b6';
}
function cycleDuration() {
  durIdx = (durIdx + 1) % durations.length;
  timerDuration = durations[durIdx]; timerRemaining = timerDuration; timerDone = false;
  updateTimerDisplay();
  clearInterval(timerInterval); timerInterval = null; timerRunning = false;
  document.getElementById('timerWrap').classList.remove('running', 'done');
  document.getElementById('timerPlayBtn').classList.remove('running', 'done');
  document.getElementById('timerPlayBtn').textContent = '\u25b6';
}
document.addEventListener('DOMContentLoaded', function() {
  var minEl = document.getElementById('timerMin');
  var secEl = document.getElementById('timerSec');
  function syncFromInputs() {
    if (!timerRunning && !timerDone) {
      var v = readTimerFromInputs();
      if (v > 0) { timerDuration = v; timerRemaining = v; }
    }
  }
  if (minEl) minEl.addEventListener('change', syncFromInputs);
  if (secEl) secEl.addEventListener('change', syncFromInputs);
});

// === Zoom controls ===
var ZOOM_MIN = 0.8, ZOOM_MAX = 1.6, ZOOM_STEP = 0.1;
var zoomLevel = (function() {
  var saved = parseFloat(localStorage.getItem('xdf-zoom-level'));
  return (!isNaN(saved) && saved >= ZOOM_MIN && saved <= ZOOM_MAX) ? saved : 1;
})();
function applyZoom() {
  zoomLevel = Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomLevel)) * 100) / 100;
  document.documentElement.style.setProperty('--zoom-scale', zoomLevel);
  var label = document.getElementById('zoomLevelLabel');
  if (label) label.textContent = Math.round(zoomLevel * 100) + '%';
  var outBtn = document.getElementById('zoomOutBtn'), inBtn = document.getElementById('zoomInBtn');
  if (outBtn) outBtn.disabled = zoomLevel <= ZOOM_MIN + 1e-6;
  if (inBtn) inBtn.disabled = zoomLevel >= ZOOM_MAX - 1e-6;
  try { localStorage.setItem('xdf-zoom-level', String(zoomLevel)); } catch (e) {}
}
function zoomIn() { zoomLevel += ZOOM_STEP; applyZoom(); }
function zoomOut() { zoomLevel -= ZOOM_STEP; applyZoom(); }
function resetZoom() { zoomLevel = 1; applyZoom(); }
applyZoom();

// === Dark Mode (new in V7) ===
function toggleDarkMode() {
  document.body.classList.toggle('dark');
  var isDark = document.body.classList.contains('dark');
  try { localStorage.setItem('xdf-dark-mode', isDark ? '1' : '0'); } catch (e) {}
  var btn = document.querySelector('.theme-toggle');
  if (btn) btn.textContent = isDark ? '\u2600' : '\u263D';
  showToast(isDark ? 'Dark mode on' : 'Light mode on', 'info');
}
function initDarkMode() {
  try {
    var saved = localStorage.getItem('xdf-dark-mode');
    if (saved === '1') {
      document.body.classList.add('dark');
      var btn = document.querySelector('.theme-toggle');
      if (btn) btn.textContent = '\u2600';
    }
  } catch (e) {}
}
initDarkMode();

// === Sidebar (new in V7) ===
function toggleSidebar() {
  var sidebar = document.querySelector('.sidebar');
  if (sidebar) sidebar.classList.toggle('collapsed');
  try {
    localStorage.setItem('xdf-sidebar-collapsed', document.querySelector('.sidebar').classList.contains('collapsed') ? '1' : '0');
  } catch (e) {}
}
function initSidebar() {
  try {
    var saved = localStorage.getItem('xdf-sidebar-collapsed');
    if (saved === '1') {
      var sidebar = document.querySelector('.sidebar');
      if (sidebar) sidebar.classList.add('collapsed');
    }
  } catch (e) {}
}
function buildSidebarNav() {
  var nav = document.querySelector('.sidebar-nav');
  if (!nav) return;
  nav.innerHTML = '';
  var slides = document.querySelectorAll('.slide');
  var currentPart = '';
  slides.forEach(function(slide, i) {
    var title = slide.dataset.title || 'Slide ' + (i + 1);
    var sectionType = slide.dataset.section || '';
    var icon = '\u25CB';
    if (sectionType === 'cover') icon = '\uD83C\uDFE0';
    else if (sectionType === 'entry-test') icon = '\uD83D\uDEAA';
    else if (sectionType === 'practice') icon = '\u270F\uFE0F';
    else if (sectionType === 'close-reading') icon = '\uD83D\uDCD6';
    else if (sectionType === 'exit-test') icon = '\uD83D\uDEAA';
    else if (sectionType === 'divider') icon = '\uD83D\uDFE2';
    else if (sectionType === 'done') icon = '\uD83C\uDF89';
    else icon = '\u25CB';

    // Section headers
    var part = slide.dataset.part || '';
    if (part && part !== currentPart) {
      currentPart = part;
      var secLabel = document.createElement('div');
      secLabel.className = 'sidebar-section-label';
      secLabel.textContent = part;
      nav.appendChild(secLabel);
    }

    var item = document.createElement('div');
    item.className = 'sidebar-item' + (i === current ? ' active' : '');
    item.dataset.slideIndex = i;
    item.innerHTML = '<span class="si-icon">' + icon + '</span><span class="si-label">' + title + '</span>';
    item.onclick = function() { goTo(i); };
    nav.appendChild(item);
  });
}

// === Navigation ===
var current = 0;
function initDots() {
  var slides = document.querySelectorAll('.slide');
  var dots = document.getElementById('progressDots');
  if (!dots) return;
  dots.innerHTML = '';
  slides.forEach(function(_, i) {
    var d = document.createElement('span');
    d.className = 'dot';
    d.dataset.pn = 'Slide ' + (i + 1);
    d.onclick = function() { goTo(i); };
    dots.appendChild(d);
  });
}
function updateUI() {
  var slides = document.querySelectorAll('.slide');
  slides.forEach(function(s, i) { s.classList.toggle('is-active', i === current); });
  var dots = document.getElementById('progressDots');
  if (dots) {
    var dotEls = dots.querySelectorAll('.dot');
    dotEls.forEach(function(d, i) {
      d.classList.toggle('active', i === current);
      d.classList.toggle('passed', i < current);
    });
  }
  var pct = slides.length > 1 ? Math.round((current / (slides.length - 1)) * 100) : 0;
  var bar = document.getElementById('progressBar');
  if (bar) bar.style.width = pct + '%';
  var topTitle = document.getElementById('topbarTitle');
  if (topTitle) topTitle.textContent = slides[current].dataset.title || '';
  var pcCur = document.getElementById('pcCur');
  var pcTotal = document.getElementById('pcTotal');
  if (pcCur) pcCur.textContent = (current + 1);
  if (pcTotal) pcTotal.textContent = ' / ' + slides.length;
  slides[current].scrollTop = 0;
  if (current === slides.length - 1) launchConfetti();
  reapplyAllHighlights();
  // Update sidebar active state
  document.querySelectorAll('.sidebar-item').forEach(function(item) {
    var idx = parseInt(item.dataset.slideIndex);
    item.classList.toggle('active', idx === current);
  });
  // Scroll sidebar to active item
  var activeItem = document.querySelector('.sidebar-item.active');
  if (activeItem) activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
function goTo(i) {
  var slides = document.querySelectorAll('.slide');
  if (i < 0 || i >= slides.length || i === current) return;
  saveScrollPosition();
  current = i;
  updateUI();
  if (typeof applyHardMode === 'function' && hardMode) applyHardMode();
  restoreScrollPosition();
}
document.addEventListener('keydown', function(e) {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(current + 1);
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goTo(current - 1);
});
function editPageCounter() {
  var curEl = document.getElementById('pcCur');
  var total = document.querySelectorAll('.slide').length;
  var input = document.createElement('input');
  input.type = 'number'; input.className = 'pc-cur-input';
  input.min = 1; input.max = total; input.value = current + 1;
  curEl.replaceWith(input); input.focus(); input.select();
  function finish() {
    var val = parseInt(input.value);
    var span = document.createElement('span');
    span.className = 'pc-cur'; span.id = 'pcCur'; span.onclick = editPageCounter;
    if (!isNaN(val) && val >= 1 && val <= total && val !== current + 1) { span.textContent = val; input.replaceWith(span); goTo(val - 1); }
    else { span.textContent = current + 1; input.replaceWith(span); }
  }
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); finish(); }
    if (e.key === 'Escape') { e.preventDefault(); var s = document.createElement('span'); s.className = 'pc-cur'; s.id = 'pcCur'; s.onclick = editPageCounter; s.textContent = current + 1; input.replaceWith(s); }
  });
  input.addEventListener('blur', finish);
}

// === Signal word progressive reveal ===
var negList = [];
function revealNextSignal(slideId) {
  var pool = document.querySelectorAll('.slide.is-active .sigword.pending');
  if (!pool.length) return;
  var target = pool[0];
  var pair = target.dataset.pair || '';
  var cls = negList.indexOf(pair) >= 0 ? 'revealed-neg' : 'revealed-pos';
  var zh = target.dataset.zh || '';
  var wrapper = document.createElement('span');
  wrapper.className = 'sigword ' + cls;
  wrapper.dataset.pair = pair;
  wrapper.dataset.zh = zh;
  wrapper.innerHTML = pair + ' <span style="font-size:14px;color:var(--fcc-blue);font-weight:600">(' + zh + ')</span>';
  target.replaceWith(wrapper);
  updateCounter(slideId);
}
function updateCounter(slideId) {
  var total = document.querySelectorAll('.slide.is-active .sigword').length;
  var revealed = document.querySelectorAll('.slide.is-active .sigword.revealed-pos, .slide.is-active .sigword.revealed-neg').length;
  var counter = document.getElementById(slideId + '-counter');
  if (counter) counter.textContent = revealed + '/' + total;
}
function resetSignals(slideId) {
  var revealed = document.querySelectorAll('.slide.is-active .sigword.revealed-pos, .slide.is-active .sigword.revealed-neg');
  revealed.forEach(function(el) {
    var pair = el.dataset.pair || '';
    var zh = el.dataset.zh || '';
    var newEl = document.createElement('span');
    newEl.className = 'sigword pending';
    newEl.dataset.pair = pair;
    newEl.dataset.zh = zh;
    newEl.textContent = pair;
    el.replaceWith(newEl);
  });
  var counter = document.getElementById(slideId + '-counter');
  if (counter) { var total = document.querySelectorAll('.slide.is-active .sigword').length; counter.textContent = '0/' + total; }
}

// === Drag & Drop ===
function initDragDrop(scope) {
  var draggables = document.querySelectorAll(scope ? scope + ' .draggable' : '.draggable');
  var zones = document.querySelectorAll(scope ? scope + ' .drop-zone' : '.drop-zone');
  var pools = document.querySelectorAll(scope ? scope + ' .word-pool' : '.word-pool');
  draggables.forEach(function(d) {
    d.addEventListener('dragstart', function(e) { e.dataTransfer.setData('text/plain', d.dataset.word); d.classList.add('dragging'); });
    d.addEventListener('dragend', function(e) { d.classList.remove('dragging'); });
  });
  zones.forEach(function(z) {
    z.addEventListener('dragover', function(e) { e.preventDefault(); z.classList.add('drag-over'); if (typeof autoScrollToVisible === 'function') autoScrollToVisible(e, z); });
    z.addEventListener('dragleave', function(e) { z.classList.remove('drag-over'); });
    z.addEventListener('drop', function(e) {
      e.preventDefault(); z.classList.remove('drag-over');
      var word = e.dataTransfer.getData('text/plain');
      var dragged = document.querySelector('.draggable[data-word="' + word + '"]');
      if (dragged) { var content = z.querySelector('.drop-content'); if (content) content.appendChild(dragged); dragged.classList.remove('correct-placed', 'wrong-placed'); }
    });
  });
  pools.forEach(function(p) {
    p.addEventListener('dragover', function(e) { e.preventDefault(); p.classList.add('drag-over'); if (typeof autoScrollToVisible === 'function') autoScrollToVisible(e, p); });
    p.addEventListener('dragleave', function(e) { p.classList.remove('drag-over'); });
    p.addEventListener('drop', function(e) {
      e.preventDefault(); p.classList.remove('drag-over');
      var word = e.dataTransfer.getData('text/plain');
      var dragged = document.querySelector('.draggable[data-word="' + word + '"]');
      if (dragged) { p.appendChild(dragged); dragged.classList.remove('correct-placed', 'wrong-placed'); if (typeof sortDraggablesInPool === 'function') sortDraggablesInPool(p); }
    });
  });
}
function checkDragDrop() {
  var placed = document.querySelectorAll('.draggable');
  var correctCount = 0, wrongCount = 0;
  placed.forEach(function(d) {
    var parent = d.closest('.drop-zone');
    var cat = parent ? parent.dataset.cat : '';
    if (cat === d.dataset.cat) { d.classList.add('correct-placed'); d.classList.remove('wrong-placed'); correctCount++; }
    else { d.classList.add('wrong-placed'); d.classList.remove('correct-placed'); wrongCount++; }
  });
  var result = document.getElementById('drag-result');
  if (!result) return;
  result.style.display = 'block';
  var total = placed.length;
  var remaining = document.querySelectorAll('#word-pool .draggable').length;
  result.innerHTML = '<div class="card accent" style="text-align:center"><h4>\u63d0\u4ea4\u7ed3\u679c\uff1a\u2705 ' + correctCount + ' \u6b63\u786e / \u274c ' + wrongCount + ' \u9519\u8bef / \ud83d\udce6 ' + remaining + ' \u672a\u62d6\u5165</h4>' + (correctCount === total ? '<p style="color:var(--fcc-green-dark);font-size:20px;margin-top:10px">\ud83c\udf89 \u5168\u90e8\u6b63\u786e\uff01</p>' : '') + '</div>';
}
function resetDragDrop() {
  var pool = document.getElementById('word-pool');
  if (pool) {
    document.querySelectorAll('#dz-pos .draggable, #dz-neg .draggable, #word-pool .draggable').forEach(function(d) {
      d.classList.remove('correct-placed', 'wrong-placed');
      pool.appendChild(d);
    });
    if (typeof sortDraggablesInPool === 'function') sortDraggablesInPool(pool);
  }
  var result = document.getElementById('drag-result');
  if (result) result.style.display = 'none';
}

// === MC check (V7 — with score tracking) ===
function checkMC(el, isCorrect, containerId, explanation) {
  var container = document.getElementById(containerId);
  if (!container) return;
  if (el.classList.contains('answered')) return;
  var allOpts = container.querySelectorAll('.pmcq-opt');
  var correctOpt = null;
  allOpts.forEach(function(o) { if (o.getAttribute('data-correct') === 'true') { correctOpt = o; } });
  el.classList.add('answered');
  el.classList.add(isCorrect ? 'correct' : 'wrong');
  // Record score
  recordAnswer(isCorrect);
  var practiceBox = el.closest('.practice-mcq') || container.parentNode;
  var oldBanner = practiceBox.querySelector(':scope > .mc-banner');
  if (oldBanner) oldBanner.remove();
  var exp = explanation || '';
  var banner = document.createElement('div');
  banner.className = isCorrect ? 'mc-banner mc-correct' : 'mc-banner mc-wrong';
  banner.innerHTML = '<div class="tick">' + (isCorrect ? '\u2705' : '\u274c') + '</div><div><div class="at">' + (isCorrect ? 'Correct!' : 'Incorrect') + '</div><div class="asub">' + exp + '</div></div>';
  container.insertAdjacentElement('afterend', banner);
  var answeredCount = container.querySelectorAll('.pmcq-opt.answered').length;
  var allAnswered = answeredCount >= allOpts.length;
  if (isCorrect || allAnswered) {
    if (correctOpt && !isCorrect) correctOpt.classList.add('correct-revealed');
    container.classList.add('answered');
  }
}

// Simplified MC check (auto-detect from data-correct)
function checkMCAuto(el) {
  if (el.classList.contains('answered')) return;
  var container = el.closest('.practice-mcq');
  if (!container || container.classList.contains('answered')) return;
  var isCorrect = el.getAttribute('data-correct') === 'true';
  el.classList.add(isCorrect ? 'correct' : 'wrong');
  el.classList.add('answered');
  recordAnswer(isCorrect);
  if (isCorrect) {
    container.classList.add('answered');
    container.classList.add('correct-revealed');
    var allOpts = container.querySelectorAll('.pmcq-opt');
    allOpts.forEach(function(o) { o.classList.add('answered'); });
    var banner = document.createElement('div');
    banner.className = 'mc-banner mc-correct';
    banner.innerHTML = '<span class="tick">\u2705</span><div><div class="at">Correct!</div></div>';
    container.insertAdjacentElement('afterend', banner);
    // V8 §19: method-badge 与答案绑定 — 答对时显示 .method-wrap
    var methodWrap = container.querySelector('.method-wrap');
    if (methodWrap) methodWrap.style.display = 'block';
  } else {
    var banner = document.createElement('div');
    banner.className = 'mc-banner mc-wrong';
    banner.innerHTML = '<span class="tick">\u274c</span><div><div class="at">Not quite</div><div class="asub">' + (el.getAttribute('data-explain') || '') + '</div></div>';
    container.insertAdjacentElement('afterend', banner);
  }
}

function toggleRev(id) { var el = document.getElementById(id); if (el) el.classList.toggle('show'); }

// === TFNG check (V7 — with score tracking) ===
function checkTFNG(btn, correctVal) {
  var group = btn.parentElement;
  if (group.classList.contains('answered')) return;
  // Fix: truth lives in the group's data-answer attribute. The onclick contract
  // passes the button's own label as correctVal, so without this line chosen===correctVal always.
  correctVal = group.getAttribute('data-answer') || correctVal;
  var chosen = btn.textContent.trim();
  var isCorrect = chosen === correctVal;
  group.classList.add('answered');
  btn.classList.add(isCorrect ? 'correct' : 'wrong');
  recordAnswer(isCorrect);
  if (!isCorrect) {
    var btns = group.querySelectorAll('.tfng-btn');
    btns.forEach(function(b) { if (b.textContent.trim() === correctVal) b.classList.add('correct'); });
  }
  var ans = group.getAttribute('data-explain') || '';
  var banner = document.createElement('div');
  banner.className = 'mc-banner ' + (isCorrect ? 'mc-correct' : 'mc-wrong');
  banner.innerHTML = '<span class="tick">' + (isCorrect ? '\u2705' : '\u274c') + '</span><div><div class="at">' + (isCorrect ? 'Correct!' : 'The answer is ' + correctVal) + '</div><div class="asub">' + ans + '</div></div>';
  group.insertAdjacentElement('afterend', banner);
}

function revealCloze(el) {
  if (el.classList.contains('revealed')) return;
  el.textContent = el.getAttribute('data-answer');
  el.classList.add('revealed');
}

// === Proofreading row reveal (模板 11 — 两步揭示) ===
// Step 1: 点击 "Tap to reveal" → 行内错词变为虚线 cloze（高亮可疑位置）
// Step 2: 点击该词 → revealCloze 显示正确答案
// 无误行（.q1-no-mistake）在 Step 1 时直接显示 ✓
function revealQ1Row(rowId) {
  var row = document.getElementById(rowId);
  if (!row) return;
  row.classList.add('revealed');
  var clozes = row.querySelectorAll('.cloze');
  for (var i = 0; i < clozes.length; i++) {
    clozes[i].onclick = function() { revealCloze(this); };
  }
  var btn = row.querySelector('.q1-tap-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Revealed ✓'; }
}

// === Chronological order reveal (模板 10 — 逐行揭示时序答案) ===
// 行结构：<span class="order-placeholder" id="ph-XXX">____</span>
//         <span class="order-answer" id="ans-XXX" style="display:none">7 (2021)</span>
function revealOrder(qid) {
  var ph = document.getElementById('ph-' + qid);
  var ans = document.getElementById('ans-' + qid);
  if (ph) ph.style.display = 'none';
  if (ans) ans.style.display = 'inline';
}

// === Short Answer ===
function submitShortAnswer(btn) {
  var wrap = btn.closest('.sa-input-wrap');
  var input = wrap.querySelector('.sa-input');
  var userAns = input.value.trim();
  if (!userAns) {
    input.style.borderColor = 'var(--brand-red)';
    input.setAttribute('placeholder', 'Please type your answer first...');
    setTimeout(function() { input.style.borderColor = ''; input.setAttribute('placeholder', 'Type your answer...'); }, 1500);
    return;
  }
  input.disabled = true;
  btn.disabled = true;
  btn.textContent = 'Submitted';
  var result = wrap.nextElementSibling;
  if (result && result.classList.contains('sa-result')) {
    result.classList.add('show');
    result.querySelector('.sa-your-ans').textContent = userAns;
  }
}

// === Right-click highlight in passage ===
function passageHash(text) {
  var h = 0; for (var i = 0; i < text.length; i++) { h = ((h << 5) - h) + text.charCodeAt(i); h |= 0; }
  return 'hl_' + Math.abs(h);
}
function getHighlights(passageEl) {
  var key = passageHash(passageEl.textContent);
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) { return []; }
}
function saveHighlights(passageEl, arr) {
  var key = passageHash(passageEl.textContent);
  try { localStorage.setItem(key, JSON.stringify(arr)); } catch (e) {}
}
function escapeRegex(s) { return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); }
function applyHighlights(passageEl) {
  var list = getHighlights(passageEl);
  if (!list.length) return;
  list.forEach(function(txt) {
    if (!txt || !txt.trim()) return;
    function walkAndReplace(node) {
      if (node.nodeType === 3) {
        var val = node.nodeValue;
        if (val.indexOf(txt) >= 0) {
          var span = document.createElement('span');
          span.className = 'user-highlight';
          var idx = val.indexOf(txt);
          span.textContent = txt;
          var before = document.createTextNode(val.substring(0, idx));
          var after = document.createTextNode(val.substring(idx + txt.length));
          var parent = node.parentNode;
          parent.insertBefore(before, node);
          parent.insertBefore(span, node);
          parent.insertBefore(after, node);
          parent.removeChild(node);
        }
      } else if (node.nodeType === 1 && node.nodeName !== 'SCRIPT' && !node.classList.contains('user-highlight')) {
        var children = Array.from(node.childNodes);
        children.forEach(walkAndReplace);
      }
    }
    walkAndReplace(passageEl);
  });
}
function handleHighlight(e, el) {
  e.preventDefault();
  var sel = window.getSelection();
  if (!sel || sel.isCollapsed) return;
  var range = sel.getRangeAt(0);
  if (!el.contains(range.commonAncestorContainer) && !el.contains(range.startContainer)) return;
  var startNode = range.startContainer;
  var parent = startNode.nodeType === 3 ? startNode.parentNode : startNode;
  var existingHl = parent.closest && parent.closest('.user-highlight');
  if (existingHl) {
    var hlText = existingHl.textContent;
    var text = document.createTextNode(hlText);
    existingHl.parentNode.replaceChild(text, existingHl);
    var list = getHighlights(el);
    var idx = list.indexOf(hlText);
    if (idx >= 0) list.splice(idx, 1);
    saveHighlights(el, list);
  } else {
    try {
      var span = document.createElement('span');
      span.className = 'user-highlight';
      var fragment = range.extractContents();
      var hlText = fragment.textContent;
      span.appendChild(fragment);
      range.insertNode(span);
      if (hlText && hlText.trim()) {
        var list = getHighlights(el);
        if (list.indexOf(hlText) < 0) list.push(hlText);
        saveHighlights(el, list);
      }
    } catch (err) {}
  }
  sel.removeAllRanges();
}
function reapplyAllHighlights() {
  // V8 §14.2 / §17.4：普通模式覆盖 .passage-excerpt + .split-right；
  // Hard 模式下 .split-left 被替换为全文模板，也需重新应用高亮（同文章组 hash 相同 → 高亮自动同步）
  var sel = (typeof hardMode !== 'undefined' && hardMode) ? '.passage-excerpt,.split-right,.split-left' : '.passage-excerpt,.split-right';
  document.querySelectorAll(sel).forEach(applyHighlights);
}

// V8 §14.2：右侧题目区也支持右键高亮（事件委托）
document.addEventListener('contextmenu', function(e) {
  var splitRight = e.target.closest('.split-right');
  if (splitRight) { handleHighlight(e, splitRight); }
});

function clearAllHighlights() {
  document.querySelectorAll('.user-highlight').forEach(function(span) {
    var text = document.createTextNode(span.textContent);
    span.parentNode.replaceChild(text, span);
  });
  var keysToRemove = [];
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    if (key && key.startsWith('hl_')) keysToRemove.push(key);
  }
  keysToRemove.forEach(function(k) { localStorage.removeItem(k); });
  showToast('Highlights cleared', 'info');
}

// Sort draggables in pool by data-word
function sortDraggablesInPool(pool) {
  if (!pool) return;
  var items = Array.from(pool.querySelectorAll('.draggable'));
  items.sort(function(a, b) { return (a.dataset.word || '').localeCompare(b.dataset.word || ''); });
  items.forEach(function(it) { pool.appendChild(it); });
}

// === Auto-scroll for drag near edges ===
function findScrollableAncestor(el) {
  var node = el;
  while (node && node !== document.body && node !== document.documentElement) {
    var cs = window.getComputedStyle(node);
    if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && node.scrollHeight - node.clientHeight > 2) return node;
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
    } else { stopEdgeAutoScroll(); }
  } catch (err) {}
}
document.addEventListener('dragend', stopEdgeAutoScroll);
document.addEventListener('drop', stopEdgeAutoScroll);

// === Confetti ===
function launchConfetti() {
  var wrap = document.createElement('div'); wrap.className = 'confetti-wrap'; document.body.appendChild(wrap);
  var colors = ['#0B8235', '#4CAF50', '#C85D0A', '#1A6DAF', '#C0392B', '#FFD54F', '#dbb8ff', '#99c9ff', '#acd157'];
  for (var i = 0; i < 80; i++) {
    var p = document.createElement('div'); p.className = 'c-piece';
    p.style.left = Math.random() * 100 + '%';
    p.style.width = (6 + Math.random() * 10) + 'px'; p.style.height = p.style.width;
    p.style.borderRadius = Math.random() > .5 ? '50%' : '2px';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.animationDuration = (2 + Math.random() * 3) + 's';
    p.style.animationDelay = (Math.random() * 2) + 's';
    wrap.appendChild(p);
  }
  setTimeout(function() { wrap.remove(); }, 6000);
}

// === Touch Swipe Navigation ===
(function() {
  var touchStartX = 0, touchStartY = 0;
  var swipeThreshold = 50;
  var swipeVerticalRatio = 1.5;
  function isScrollable(el) {
    if (!el) return false;
    var style = window.getComputedStyle(el);
    return (style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
  }
  document.addEventListener('touchstart', function(e) {
    var target = e.target;
    var inScrollable = false;
    while (target && target !== document.body) {
      if (isScrollable(target)) { inScrollable = true; break; }
      target = target.parentElement;
    }
    if (inScrollable) { touchStartX = 0; touchStartY = 0; return; }
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });
  document.addEventListener('touchend', function(e) {
    if (touchStartX === 0 && touchStartY === 0) return;
    var touchEndX = e.changedTouches[0].screenX;
    var touchEndY = e.changedTouches[0].screenY;
    var dx = touchEndX - touchStartX;
    var dy = touchEndY - touchStartY;
    touchStartX = 0; touchStartY = 0;
    if (Math.abs(dx) < swipeThreshold) return;
    if (Math.abs(dy) > Math.abs(dx) * swipeVerticalRatio) return;
    if (dx < 0) goTo(current + 1);
    else goTo(current - 1);
  }, { passive: true });
})();

// === Keyboard shortcuts (V7 enhanced) ===
document.addEventListener('keydown', function(e) {
  // D for dark mode
  if (e.key === 'd' && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
    toggleDarkMode();
  }
  // S for sidebar toggle
  if (e.key === 's' && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
    toggleSidebar();
  }
});

// === Hard Mode 变难模式 (V8 §17) ===
// slide 标记 data-hard-group="text1"；</div><!-- /deck --> 后放置
// <div id="hard-template-text1" style="display:none"> 全文模板（§N 编号）
var hardMode = false, hardModeOriginals = {};
function toggleHardMode() {
  hardMode = !hardMode;
  var btn = document.getElementById('hardmodeBtn');
  if (btn) { btn.textContent = hardMode ? '🔓 Hard' : '🔒 Easy'; btn.classList.toggle('active', hardMode); }
  applyHardMode();
}
function applyHardMode() {
  document.querySelectorAll('.slide[data-hard-group]').forEach(function(slide) {
    var splitLeft = slide.querySelector('.split-left');
    if (!splitLeft) return;
    var slideId = slide.dataset.title;
    if (hardMode) {
      if (!hardModeOriginals[slideId]) hardModeOriginals[slideId] = splitLeft.innerHTML;
      var tmpl = document.getElementById('hard-template-' + slide.dataset.hardGroup);
      if (tmpl) splitLeft.innerHTML = tmpl.innerHTML;
    } else {
      if (hardModeOriginals[slideId]) { splitLeft.innerHTML = hardModeOriginals[slideId]; delete hardModeOriginals[slideId]; }
    }
  });
  reapplyAllHighlights();
}

// === 同文章组滚动位置同步 (V8 §18) ===
var scrollPositions = {};
function saveScrollPosition() {
  var slides = document.querySelectorAll('.slide');
  var slide = slides[current];
  if (!slide || !slide.dataset.hardGroup) return;
  var splitLeft = slide.querySelector('.split-left');
  if (splitLeft) scrollPositions[slide.dataset.hardGroup] = splitLeft.scrollTop;
}
function restoreScrollPosition() {
  var slides = document.querySelectorAll('.slide');
  var slide = slides[current];
  if (!slide || !slide.dataset.hardGroup) return;
  var splitLeft = slide.querySelector('.split-left');
  var saved = scrollPositions[slide.dataset.hardGroup];
  if (splitLeft && typeof saved === 'number') splitLeft.scrollTop = saved;
}

// === Initialize ===
initDots(); updateUI(); initDragDrop(); initSidebar();
document.addEventListener('DOMContentLoaded', function() {
  buildSidebarNav();
  reapplyAllHighlights();
});
