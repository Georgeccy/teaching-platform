'use strict';
/* ============================================================
   智学平台 · 学宝 HUD 注入脚本 (assets/courseware-pet.js)
   由 sync_courseware.py 注入到每个课件页（注入在进度桥之后）。
   仅依赖 window.ZhiXue（assets/app.js 提供）。
   读取 window.__ZX__ 配置，侦测学生「答对 / 答错」：
     - mode:'quiz'  : 包裹 window.checkQuiz，依据 .correct/.wrong
     - mode:'score' : 观察 .sb-correct/.sb-total 增量
   答对 +10、答错 -5，学宝出声（机器人声 v1）+ 阈值触发唱歌卡片，
   积分真实落盘到 /api/pet，联动班级排行榜。
   ============================================================ */
(function () {
  var GAIN = 10, LOSS = -5;         // 答对加分 / 答错扣分
  var TEACHER_LINE = 10;            // 正分达此 → 老师唱歌
  var STUDENT_LINE = -10;           // 负分达此 → 学生唱歌

  var GAIN_LINES = ['不错不错，学宝给你点个赞！', '这题稳了，加十分！', '学到了，学宝替你开心！', '答对啦，学宝蹦一下！'];
  var LOSS_LINES = ['哎呀，这题先欠着～', '没关系，下题翻盘！', '学宝陪你一起复盘～', '小失误，别慌！'];
  var TEACHER_LINES = ['正分到啦，该老师献唱一首！🎤', '老师唱歌时间到，准备好掌声！'];
  var STUDENT_LINES = ['负分啦，轮到学生来一首歌～🎶', '学生登场，献唱一首给大家！'];

  function init() {
    if (!window.ZhiXue) return;
    // 学宝 HUD：特性开关关闭时完全不注入（默认隐藏）
    if (window.ZhiXue.features && window.ZhiXue.features.xuebao === false) return;
    var cfg = window.__ZX__ || { kind: 'courseware', unit: 'unknown', mode: 'score' };
    var loggedIn = !!(window.ZhiXue.user && window.ZhiXue.token);
    var petScore = 0;
    var region = 'mid';            // 'pos' | 'neg' | 'mid'
    var hintShown = false;

    // ---------- 语音（机器人声 v1）----------
    function say(text) {
      try {
        if (!('speechSynthesis' in window)) return;
        var u = new SpeechSynthesisUtterance(text);
        u.lang = 'zh-CN'; u.rate = 1.05; u.pitch = 1.15;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      } catch (e) {}
    }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    // ---------- 未登录提示 ----------
    function showLoginHint() {
      if (hintShown || document.getElementById('zx-pet-hint')) return;
      hintShown = true;
      var b = document.createElement('div');
      b.id = 'zx-pet-hint';
      b.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:9997;background:#2E2A3B;color:#F4ECD8;border:3px solid #2E2A3B;box-shadow:4px 4px 0 rgba(0,0,0,.35);padding:10px 14px;font-size:12px;font-weight:700;display:flex;gap:10px;align-items:center;font-family:inherit;max-width:320px;line-height:1.5;';
      b.innerHTML = '<span>🔒 登录后学宝积分才会保存</span>';
      var btn = document.createElement('a');
      btn.textContent = '去登录';
      btn.style.cssText = 'background:#FF5D8F;color:#fff;border:2px solid #2E2A3B;padding:6px 10px;cursor:pointer;text-decoration:none;font-family:"Press Start 2P",monospace;font-size:9px;flex-shrink:0;';
      btn.addEventListener('click', function () {
        if (window.ZhiXue && window.ZhiXue.ensureLogin) window.ZhiXue.ensureLogin().then(function () { location.reload(); });
      });
      b.appendChild(btn);
      document.body.appendChild(b);
    }

    // ---------- HUD ----------
    var style = document.createElement('style');
    style.textContent = '' +
      '.zx-pet-hud{position:fixed;right:16px;bottom:16px;z-index:9998;display:flex;align-items:center;gap:10px;background:#2E2A3B;color:#F4ECD8;border:3px solid #2E2A3B;box-shadow:4px 4px 0 rgba(0,0,0,.35);padding:10px 14px;font-family:inherit;user-select:none;}' +
      '.zx-pet-mascot{font-size:30px;line-height:1;transition:transform .18s cubic-bezier(.34,1.56,.64,1);}' +
      '.zx-pet-hud.bounce .zx-pet-mascot{transform:translateY(-10px) scale(1.18) rotate(-6deg);}' +
      '.zx-pet-hud.shake .zx-pet-mascot{animation:zxpet-shake .4s;}' +
      '@keyframes zxpet-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px) rotate(-8deg)}40%{transform:translateX(6px) rotate(8deg)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}' +
      '.zx-pet-info{text-align:left;}' +
      '.zx-pet-label{font-size:9px;letter-spacing:1px;opacity:.8;font-family:"Press Start 2P",monospace;}' +
      '.zx-pet-score{font-size:22px;font-weight:700;line-height:1.1;}' +
      '.zx-pet-delta{position:absolute;right:14px;top:-6px;font-size:14px;font-weight:700;opacity:0;transition:opacity .2s,transform .5s;pointer-events:none;}' +
      '.zx-pet-delta.show{opacity:1;transform:translateY(-18px);}' +
      '.zx-pet-card{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:10000;background:#F4ECD8;color:#2E2A3B;border:4px solid #2E2A3B;box-shadow:8px 8px 0 rgba(0,0,0,.4);padding:26px 30px;max-width:360px;text-align:center;font-family:inherit;}' +
      '.zx-pet-card h2{margin:0 0 10px;font-size:20px;}' +
      '.zx-pet-card p{margin:0 0 16px;font-size:14px;line-height:1.6;}' +
      '.zx-pet-card button{background:#FF5D8F;color:#fff;border:3px solid #2E2A3B;box-shadow:3px 3px 0 #2E2A3B;padding:8px 18px;font-family:"Press Start 2P",monospace;font-size:10px;cursor:pointer;}';
    document.head.appendChild(style);

    var hud = document.createElement('div');
    hud.className = 'zx-pet-hud';
    hud.id = 'zx-pet';
    hud.innerHTML =
      '<div class="zx-pet-mascot">🐤</div>' +
      '<div class="zx-pet-info"><div class="zx-pet-label">学宝积分</div><div class="zx-pet-score">0</div></div>' +
      '<div class="zx-pet-delta"></div>';
    document.body.appendChild(hud);
    var scoreEl = hud.querySelector('.zx-pet-score');
    var deltaEl = hud.querySelector('.zx-pet-delta');

    function setScore(v) {
      petScore = v;
      scoreEl.textContent = v;
      // 阈值区域切换 → 触发唱歌卡片
      var newRegion = v >= TEACHER_LINE ? 'pos' : (v <= STUDENT_LINE ? 'neg' : 'mid');
      if (newRegion !== region) {
        if (newRegion === 'pos') showSingCard('teacher');
        else if (newRegion === 'neg') showSingCard('student');
        region = newRegion;
      }
    }

    function flash(delta, ok) {
      deltaEl.textContent = (delta > 0 ? '+' : '') + delta;
      deltaEl.style.color = ok ? '#2E9E5B' : '#D6455B';
      deltaEl.classList.add('show');
      hud.classList.remove('bounce', 'shake');
      void hud.offsetWidth;
      hud.classList.add(ok ? 'bounce' : 'shake');
      setTimeout(function () { deltaEl.classList.remove('show'); }, 600);
      setTimeout(function () { hud.classList.remove('bounce', 'shake'); }, 500);
    }

    function showSingCard(who) {
      if (document.getElementById('zx-pet-card')) return;
      var card = document.createElement('div');
      card.className = 'zx-pet-card';
      card.id = 'zx-pet-card';
      if (who === 'teacher') {
        card.innerHTML = '<h2>🎤 老师唱歌时间到！</h2><p>' + pick(TEACHER_LINES) + '</p><button>收到～</button>';
        say(pick(TEACHER_LINES));
      } else {
        card.innerHTML = '<h2>🎶 学生来一首歌！</h2><p>' + pick(STUDENT_LINES) + '</p><button>这就唱～</button>';
        say(pick(STUDENT_LINES));
      }
      card.querySelector('button').addEventListener('click', function () { card.remove(); });
      document.body.appendChild(card);
    }

    // ---------- 上报积分 ----------
    function award(delta, ok) {
      flash(delta, ok);
      if (!(window.ZhiXue.user && window.ZhiXue.token)) { showLoginHint(); setScore(petScore + delta); return; }
      try {
        ZhiXue.api('/api/pet', { method: 'POST', body: { delta: delta } })
          .then(function (d) { if (d && typeof d.petScore === 'number') setScore(d.petScore); })
          .catch(function () { setScore(petScore + delta); });
      } catch (e) { setScore(petScore + delta); }
    }

    function onAnswer(ok) { award(ok ? GAIN : LOSS, ok); say(ok ? pick(GAIN_LINES) : pick(LOSS_LINES)); }

    // ---------- 模式 A：包裹 checkQuiz（写作课件）----------
    if (cfg.mode === 'quiz') {
      if (typeof window.checkQuiz === 'function') {
        var orig = window.checkQuiz;
        var done = new WeakSet();
        window.checkQuiz = function (el) {
          var r = orig.apply(this, arguments);
          try {
            var card = el && el.closest ? el.closest('.quiz-card') : null;
            if (card && done.has(card)) return r;
            if (el && el.classList) {
              if (el.classList.contains('correct')) { onAnswer(true); if (card) done.add(card); }
              else if (el.classList.contains('wrong')) { onAnswer(false); if (card) done.add(card); }
            }
          } catch (e) {}
          return r;
        };
      }
    } else {
      // ---------- 模式 B：分数观察（阅读 / 语法冲刺）----------
      var selC = cfg.selCorrect || '.score-badge .sb-correct';
      var selT = cfg.selTotal || '.score-badge .sb-total';
      var cEl = document.querySelector(selC);
      var tEl = document.querySelector(selT);
      if (cEl && tEl) {
        var lastC = parseInt(cEl.textContent, 10) || 0;
        var lastT = parseInt(tEl.textContent, 10) || 0;
        var obs = new MutationObserver(function () {
          var nc = parseInt(cEl.textContent, 10) || 0;
          var nt = parseInt(tEl.textContent, 10) || 0;
          var dc = nc - lastC, dt = nt - lastT;
          if (dc < 0 || dt < 0) { lastC = nc; lastT = nt; return; } // 重置/回看：仅同步基线
          for (var i = 0; i < dc; i++) onAnswer(true);
          for (var j = 0; j < (dt - dc); j++) onAnswer(false);
          lastC = nc; lastT = nt;
        });
        obs.observe(cEl, { childList: true, characterData: true, subtree: true });
        obs.observe(tEl, { childList: true, characterData: true, subtree: true });
      }
    }

    // ---------- 拉取已有积分 ----------
    if (window.ZhiXue.user && window.ZhiXue.token) {
      try {
        ZhiXue.api('/api/progress').then(function (d) {
          var p = (d && d.progress) || {};
          setScore(typeof p.petScore === 'number' ? p.petScore : 0);
        }).catch(function () {});
      } catch (e) {}
    }
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
