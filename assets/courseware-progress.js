'use strict';
/* ============================================================
   智学平台 · 课件进度桥接 (assets/courseware-progress.js)
   由 sync_courseware.py / build_sprint.py 注入到每个课件页。
   仅依赖 window.ZhiXue（assets/app.js 提供，加载时不注入任何 UI）。
   读取 window.__ZX__ 配置，支持两种上报模式：
     - mode:'score'  : 观察分数显示（.sb-correct/.sb-total 或 #sbCorrect/#sbTotal），
                       按增量上报（兼容正确/错误/总分递增等多种计分模型）
     - mode:'quiz'   : 包裹 window.checkQuiz，依据选项 .correct/.wrong 上报
   未登录时显示像素风提示条，可一键唤起登录。
   ============================================================ */
(function () {
  function init() {
    if (!window.ZhiXue || !window.ZhiXue.reportEvent) return;

    var cfg = window.__ZX__ || { kind: 'courseware', unit: 'unknown', weakKey: 'general', mode: 'score' };
    var bannerShown = false;

    // ---- 未登录提示条 ----
    function showLoginHint() {
      if (bannerShown) return;
      bannerShown = true;
      if (document.getElementById('zx-prog-hint')) return;
      var b = document.createElement('div');
      b.id = 'zx-prog-hint';
      b.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:9998;background:#2E2A3B;color:#F4ECD8;border:3px solid #2E2A3B;box-shadow:4px 4px 0 rgba(0,0,0,.35);padding:10px 14px;font-size:12px;font-weight:700;display:flex;gap:10px;align-items:center;font-family:inherit;max-width:340px;line-height:1.5;';
      b.innerHTML = '<span>🔒 未登录，本页练习进度不会被保存</span>';
      var btn = document.createElement('a');
      btn.textContent = '去登录';
      btn.style.cssText = 'background:#FF5D8F;color:#fff;border:2px solid #2E2A3B;padding:6px 10px;cursor:pointer;text-decoration:none;font-family:"Press Start 2P",monospace;font-size:9px;flex-shrink:0;';
      btn.addEventListener('click', function () {
        if (window.ZhiXue && window.ZhiXue.ensureLogin) {
          window.ZhiXue.ensureLogin().then(function () { location.reload(); });
        }
      });
      b.appendChild(btn);
      document.body.appendChild(b);
    }

    // ---- 上报（未登录则提示并返回） ----
    function report(correct, total, weakKey) {
      if (!(window.ZhiXue && window.ZhiXue.user && window.ZhiXue.token)) { showLoginHint(); return; }
      var wk = weakKey || cfg.weakKey;
      try {
        ZhiXue.reportEvent({ type: cfg.kind, correct: correct, total: total, weakKey: wk, unit: cfg.unit });
      } catch (e) { /* 静默失败，不影响练习 */ }
    }

    // ---- 模式 A：包裹 checkQuiz（写作课件） ----
    if (cfg.mode === 'quiz') {
      if (typeof window.checkQuiz === 'function') {
        var orig = window.checkQuiz;
        var reportedCards = new WeakSet(); // 防止重复点击同一题卡重复上报
        window.checkQuiz = function (el) {
          var r = orig.apply(this, arguments);
          try {
            var card = el && el.closest ? el.closest('.quiz-card') : null;
            if (card && reportedCards.has(card)) return r;
            if (el && el.classList) {
              if (el.classList.contains('correct')) { report(1, 1); if (card) reportedCards.add(card); }
              else if (el.classList.contains('wrong')) { report(0, 1); if (card) reportedCards.add(card); }
            }
          } catch (e) {}
          return r;
        };
      }
      return;
    }

    // ---- 模式 B：分数观察（阅读 / 语法冲刺） ----
    var selCorrect = cfg.selCorrect || '.score-badge .sb-correct';
    var selTotal = cfg.selTotal || '.score-badge .sb-total';
    var cEl = document.querySelector(selCorrect);
    var tEl = document.querySelector(selTotal);
    if (!cEl || !tEl) return;

    var lastC = parseInt(cEl.textContent, 10) || 0;
    var lastT = parseInt(tEl.textContent, 10) || 0;
    var accC = 0, accT = 0, deb = null;

    function flush() {
      if (accC || accT) report(accC, accT);
      accC = 0; accT = 0; deb = null;
    }
    function onMut() {
      var nc = parseInt(cEl.textContent, 10) || 0;
      var nt = parseInt(tEl.textContent, 10) || 0;
      var dc = nc - lastC, dtInc = nt - lastT;
      // 计分重置 / 回看：直接同步基线，不报错也不上报
      if (dc < 0 || dtInc < 0) { lastC = nc; lastT = nt; return; }
      if (dc > 0 || dtInc > 0) {
        accC += dc;                       // 本批新增正确数
        accT += (dtInc > 0 ? dtInc : 1);  // 每答一题计 1（错误且总分固定时也计 1）
      }
      lastC = nc; lastT = nt;
      if (!deb) deb = setTimeout(flush, 700); // 防抖：合并连击
    }
    var obs = new MutationObserver(onMut);
    obs.observe(cEl, { childList: true, characterData: true, subtree: true });
    obs.observe(tEl, { childList: true, characterData: true, subtree: true });
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
