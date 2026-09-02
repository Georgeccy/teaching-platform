/* ============================================================
   智学平台 · 课间小游戏引擎
   - 界面分离：主菜单启动器 → 贪吃蛇 / 俄罗斯方块 各自独立视图，
     同一时刻仅一个视图可见且只有它能接收键盘事件，离开即暂停，互不干扰。
   - 俄罗斯方块 (Tetris)：7-bag 随机 / SRS 旋转踢墙 / 落点幽灵 / Hold 暂存 /
                          锁定延迟 / 标准计分(B2B 连击 + T-Spin)
   - 贪吃蛇 (Snake)：输入缓冲(禁止反向) / 食物随机+得分 / 边界&自身碰撞 /
                    难度(速度)调节 / 穿墙 / 结束&通关&重新开始
   纯前端、零依赖；主题色从 body 读取；最高分存 localStorage
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 工具 ---------- */
  function $(id) { return document.getElementById(id); }
  function cssVar(name, fallback) {
    var v = (getComputedStyle(document.body).getPropertyValue(name) || '').trim();
    return v || fallback;
  }
  function hiKey(k) { return 'zhixue-game-' + k; }
  function getHi(k) { var n = parseInt(localStorage.getItem(hiKey(k)) || '0', 10); return isNaN(n) ? 0 : n; }
  function setHi(k, v) { if (v > getHi(k)) localStorage.setItem(hiKey(k), String(v)); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function announce(msg) { if (window.ZhiXue && ZhiXue.toast) ZhiXue.toast(msg, 'ok'); }

  // 像素方块（带斜角高光，贴合复古风）
  function drawBlock(ctx, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = 'rgba(255,255,255,.30)';
    ctx.fillRect(x, y, size, Math.max(2, size * 0.16));
    ctx.fillRect(x, y, Math.max(2, size * 0.16), size);
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.fillRect(x, y + size - Math.max(2, size * 0.16), size, Math.max(2, size * 0.16));
    ctx.fillRect(x + size - Math.max(2, size * 0.16), y, Math.max(2, size * 0.16), size);
  }
  function clearCv(ctx, w, h) { ctx.fillStyle = cssVar('--card', '#fff'); ctx.fillRect(0, 0, w, h); }
  function overlayText(ctx, w, h, lines) {
    ctx.fillStyle = 'rgba(46,42,59,.72)';
    ctx.fillRect(0, h / 2 - 34, w, 68);
    ctx.fillStyle = '#F4ECD8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '12px "Press Start 2P", monospace';
    for (var i = 0; i < lines.length; i++) ctx.fillText(lines[i], w / 2, h / 2 - (lines.length - 1) * 11 + i * 22);
  }

  // 当前可见视图：'menu' | 'snake' | 'tetris' —— 决定键盘事件归属，杜绝两局互相干扰
  var currentView = 'menu';
  var ctrls = {}; // { snake: {...}, tetris: {...} } 各视图暴露 exit() 等控制

  function showView(name) {
    ['menu', 'snake', 'tetris'].forEach(function (v) {
      var el = $('view-' + v);
      if (el) el.style.display = (v === name) ? 'block' : 'none';
    });
    // 离开某游戏视图时暂停它的循环，保证互不干扰
    if (currentView === 'snake' && name !== 'snake' && ctrls.snake && ctrls.snake.exit) ctrls.snake.exit();
    if (currentView === 'tetris' && name !== 'tetris' && ctrls.tetris && ctrls.tetris.exit) ctrls.tetris.exit();
    currentView = name;
  }

  /* ===========================================================
     俄罗斯方块 —— 拟真引擎
     =========================================================== */
  function initTetris() {
    var cv = $('tCanvas'), ctx = cv && cv.getContext('2d');
    var ncv = $('tNext'), nctx = ncv && ncv.getContext('2d');
    var hcv = $('tHold'), hctx = hcv && hcv.getContext('2d');
    if (!cv || !ctx) return { exit: function () {} };

    var COLS = 10, ROWS = 20, CELL = 22;

    // SRS 标准方块：每个 piece 的 4 个旋转态（spawn→R→2→L）
    var SHAPES = {
      I: { c: '#4DD0E1', states: [
        [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
        [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
        [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
        [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]]
      ]},
      O: { c: '#FFD54F', states: [
        [[1,1],[1,1]],[[1,1],[1,1]],[[1,1],[1,1]],[[1,1],[1,1]]
      ]},
      T: { c: '#BA68C8', states: [
        [[0,1,0],[1,1,1],[0,0,0]],
        [[0,1,0],[0,1,1],[0,1,0]],
        [[0,0,0],[1,1,1],[0,1,0]],
        [[0,1,0],[1,1,0],[0,1,0]]
      ]},
      S: { c: '#81C784', states: [
        [[0,1,1],[1,1,0],[0,0,0]],
        [[0,1,0],[0,1,1],[0,0,1]],
        [[0,0,0],[0,1,1],[1,1,0]],
        [[1,0,0],[1,1,0],[0,1,0]]
      ]},
      Z: { c: '#E57373', states: [
        [[1,1,0],[0,1,1],[0,0,0]],
        [[0,0,1],[0,1,1],[0,1,0]],
        [[0,0,0],[1,1,0],[0,1,1]],
        [[0,1,0],[1,1,0],[1,0,0]]
      ]},
      J: { c: '#64B5F6', states: [
        [[1,0,0],[1,1,1],[0,0,0]],
        [[0,1,1],[0,1,0],[0,1,0]],
        [[0,0,0],[1,1,1],[0,0,1]],
        [[0,1,0],[0,1,0],[1,1,0]]
      ]},
      L: { c: '#FFB74D', states: [
        [[0,0,1],[1,1,1],[0,0,0]],
        [[0,1,0],[0,1,0],[0,1,1]],
        [[0,0,0],[1,1,1],[1,0,0]],
        [[1,1,0],[0,1,0],[0,1,0]]
      ]}
    };
    var KEYS = ['I','O','T','S','Z','J','L'];

    // SRS 踢墙偏移表（屏幕坐标：x 向右、y 向下为正；Test1 永远是 (0,0)）
    var KICKS_JLSTZ = {
      '0>1': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
      '1>0': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
      '1>2': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
      '2>1': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
      '2>3': [[0,0],[1,0],[1,-1],[0,2],[1,-2]],
      '3>2': [[0,0],[-1,0],[-1,1],[0,-2],[-1,2]],
      '3>0': [[0,0],[-1,0],[-1,1],[0,-2],[-1,2]],
      '0>3': [[0,0],[1,0],[1,-1],[0,2],[1,-2]]
    };
    var KICKS_I = {
      '0>1': [[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
      '1>0': [[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
      '1>2': [[0,0],[-1,0],[2,0],[-1,-2],[2,1]],
      '2>1': [[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
      '2>3': [[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
      '3>2': [[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
      '3>0': [[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
      '0>3': [[0,0],[-1,0],[2,0],[-1,-2],[2,1]]
    };

    var board = null, cur = null, nextType = null, holdType = null, holdUsed = false;
    var score = 0, lines = 0, level = 1, b2b = false, combo = -1;
    var bag = [];
    var dropAcc = 0, lastT = 0, lastFrameT = 0, raf = null;
    var running = false, paused = false, over = false;
    var lockActive = false, lockResets = 0, lockAt = 0, lastActionRotate = false;
    var LOCK_DELAY = 500;

    function emptyBoard() {
      var b = [];
      for (var r = 0; r < ROWS; r++) b.push(new Array(COLS).fill(0));
      return b;
    }
    function cellsOf(m) {
      var out = [];
      for (var r = 0; r < m.length; r++) for (var c = 0; c < m[r].length; c++) if (m[r][c]) out.push([r, c]);
      return out;
    }
    function collide(m, ox, oy) {
      var cells = cellsOf(m);
      for (var i = 0; i < cells.length; i++) {
        var x = ox + cells[i][1], y = oy + cells[i][0];
        if (x < 0 || x >= COLS || y >= ROWS) return true;
        if (y >= 0 && board[y][x]) return true;
      }
      return false;
    }
    // 7-bag：每袋含 7 种各一次，洗牌后依次发出，杜绝长旱/长涝
    function nextFromBag() {
      if (bag.length === 0) { bag = KEYS.slice(); shuffle(bag); }
      return bag.pop();
    }
    function mkPiece(type) {
      var s = SHAPES[type], m = s.states[0];
      return { type: type, rot: 0, m: m, c: s.c, x: Math.floor((COLS - m[0].length) / 2), y: 0 };
    }
    function spawn() {
      var t = nextType != null ? nextType : nextFromBag();
      nextType = nextFromBag();
      cur = mkPiece(t);
      lastActionRotate = false; holdUsed = false; lockActive = false;
      if (collide(cur.m, cur.x, cur.y)) { gameOver(); return; }
      groundCheck();
    }
    function spawnSpecific(type) {
      cur = mkPiece(type);
      lastActionRotate = false; lockActive = false;
      if (collide(cur.m, cur.x, cur.y)) { gameOver(); return; }
      groundCheck();
    }
    function writePiece() {
      var cells = cellsOf(cur.m);
      for (var i = 0; i < cells.length; i++) {
        var x = cur.x + cells[i][1], y = cur.y + cells[i][0];
        if (y >= 0 && y < ROWS && x >= 0 && x < COLS) board[y][x] = cur.c;
      }
    }
    function clearLines() {
      var cleared = 0;
      for (var r = ROWS - 1; r >= 0; r--) {
        var full = true;
        for (var c = 0; c < COLS; c++) if (!board[r][c]) { full = false; break; }
        if (full) { board.splice(r, 1); board.unshift(new Array(COLS).fill(0)); cleared++; r++; }
      }
      return cleared;
    }
    // T-Spin 判定：上一步是旋转，且 T 中心点周围 4 角中 ≥3 个被占（墙或方块）
    function isTSpin() {
      if (cur.type !== 'T' || !lastActionRotate) return false;
      var cx = cur.x + 1, cy = cur.y + 1;
      var corners = [[cx - 1, cy - 1], [cx + 1, cy - 1], [cx - 1, cy + 1], [cx + 1, cy + 1]];
      var occ = 0;
      for (var i = 0; i < 4; i++) {
        var x = corners[i][0], y = corners[i][1];
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS || board[y][x]) occ++;
      }
      return occ >= 3;
    }
    function lockPiece() {
      var tspin = isTSpin();
      writePiece();
      var cleared = clearLines();
      if (cleared > 0) {
        var base = tspin ? ([0, 800, 1200, 1600][cleared] || 1600) : [0, 100, 300, 500, 800][cleared];
        var pts = base * level;
        var difficult = (cleared > 0) && (tspin || cleared === 4);
        if (difficult) { if (b2b) pts = Math.floor(pts * 1.5); b2b = true; }
        else b2b = false;
        combo++;
        if (combo > 0) pts += 50 * combo * level;
        score += pts; lines += cleared; level = Math.floor(lines / 10) + 1;
        if (tspin) announce('T-SPIN' + (cleared ? ' ' + cleared + ' 连' : '') + ' +' + pts);
        updateHud();
      } else {
        combo = -1;
        if (tspin) { score += 400 * level; updateHud(); announce('T-SPIN +' + (400 * level)); }
      }
      spawn();
      draw();
    }
    function move(dx) {
      if (!running || paused || over) return;
      if (!collide(cur.m, cur.x + dx, cur.y)) {
        cur.x += dx; lastActionRotate = false; groundCheck(); onMove(); draw();
      }
    }
    function rotate(dir) { // +1 顺时针，-1 逆时针
      if (!running || paused || over) return;
      var from = cur.rot, to = (from + (dir > 0 ? 1 : 3)) % 4;
      var table = cur.type === 'I' ? KICKS_I : KICKS_JLSTZ;
      var kicks = table[from + '>' + to]; if (!kicks) return;
      var m = SHAPES[cur.type].states[to];
      for (var i = 0; i < kicks.length; i++) {
        var nx = cur.x + kicks[i][0], ny = cur.y + kicks[i][1];
        if (!collide(m, nx, ny)) {
          cur.m = m; cur.rot = to; cur.x = nx; cur.y = ny;
          lastActionRotate = true; groundCheck(); onMove(); draw(); return;
        }
      }
    }
    function softDrop() {
      if (!running || paused || over) return;
      if (!collide(cur.m, cur.x, cur.y + 1)) {
        cur.y++; score += 1; lastActionRotate = false; groundCheck(); onMove(); updateHud(); draw();
      } else lockPiece();
    }
    function hardDrop() {
      if (!running || paused || over) return;
      var d = 0;
      while (!collide(cur.m, cur.x, cur.y + 1)) { cur.y++; d++; }
      score += d * 2; lastActionRotate = false;
      lockPiece();
    }
    function hold() {
      if (!running || paused || over || holdUsed) return;
      holdUsed = true;
      if (holdType === null) { holdType = cur.type; spawn(); }
      else { var t = holdType; holdType = cur.type; spawnSpecific(t); }
      drawHold();
    }
    // 锁定延迟：落地后给 0.5s 缓冲，期间移动/旋转可复位（最多 15 次）
    function groundCheck() {
      lockActive = collide(cur.m, cur.x, cur.y + 1);
      if (lockActive) { lockResets = 0; lockAt = lastFrameT + LOCK_DELAY; }
    }
    function onMove() {
      if (lockActive && lockResets < 15) { lockResets++; lockAt = lastFrameT + LOCK_DELAY; }
    }
    function speed() { return Math.max(100, 800 - (level - 1) * 70); }
    function updateHud() {
      $('tScore').textContent = score;
      $('tLevel').textContent = level;
      $('tLines').textContent = lines;
      $('tB2b').textContent = b2b ? 'B2B' : '—';
      $('tHi').textContent = getHi('tetris');
    }
    function drawGhost() {
      var gy = cur.y, m = cur.m;
      while (!collide(m, cur.x, gy + 1)) gy++;
      var cells = cellsOf(m);
      ctx.save(); ctx.globalAlpha = 0.20;
      for (var i = 0; i < cells.length; i++) {
        var x = cur.x + cells[i][1], y = gy + cells[i][0];
        if (y >= 0) drawBlock(ctx, x * CELL, y * CELL, CELL, cur.c);
      }
      ctx.restore();
      ctx.save(); ctx.strokeStyle = cur.c; ctx.globalAlpha = 0.55; ctx.lineWidth = 2;
      for (var j = 0; j < cells.length; j++) {
        var gx = cur.x + cells[j][1], gy2 = gy + cells[j][0];
        if (gy2 >= 0) ctx.strokeRect(gx * CELL + 1, gy2 * CELL + 1, CELL - 2, CELL - 2);
      }
      ctx.restore();
    }
    function drawGrid() {
      ctx.strokeStyle = 'rgba(46,42,59,.08)'; ctx.lineWidth = 1;
      for (var x = 1; x < COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, ROWS * CELL); ctx.stroke(); }
      for (var y = 1; y < ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(COLS * CELL, y * CELL); ctx.stroke(); }
    }
    function draw() {
      clearCv(ctx, cv.width, cv.height); drawGrid();
      for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++)
        if (board[r][c]) drawBlock(ctx, c * CELL, r * CELL, CELL, board[r][c]);
      if (cur && !over) {
        drawGhost();
        var cells = cellsOf(cur.m);
        for (var i = 0; i < cells.length; i++) {
          var x = cur.x + cells[i][1], y = cur.y + cells[i][0];
          if (y >= 0) drawBlock(ctx, x * CELL, y * CELL, CELL, cur.c);
        }
      }
      if (ncv && nctx && nextType != null) drawPreview(nctx, ncv, nextType);
      if (over) overlayText(ctx, cv.width, cv.height, ['GAME OVER', '得分 ' + score]);
      else if (paused) overlayText(ctx, cv.width, cv.height, ['暂停中', '按 P 继续']);
      else if (!running) overlayText(ctx, cv.width, cv.height, ['按 开始', '或 空格']);
    }
    function drawPreview(c, cvs, type) {
      clearCv(c, cvs.width, cvs.height);
      var m = SHAPES[type].states[0], col = SHAPES[type].c, cs = 18;
      var cells = cellsOf(m);
      var off = Math.floor((cvs.width - cs * m.length) / 2);
      var coff = Math.floor((cvs.height - cs * m.length) / 2);
      for (var i = 0; i < cells.length; i++) drawBlock(c, off + cells[i][1] * cs, coff + cells[i][0] * cs, cs, col);
    }
    function drawHold() {
      if (hcv && hctx && holdType != null) drawPreview(hctx, hcv, holdType);
      else if (hcv && hctx) clearCv(hctx, hcv.width, hcv.height);
    }
    function loop(t) {
      if (!running || paused || over) { raf = null; return; }
      lastFrameT = t;
      var dt = t - lastT; lastT = t; dropAcc += dt;
      var iv = speed();
      if (dropAcc >= iv) {
        dropAcc = 0;
        if (!collide(cur.m, cur.x, cur.y + 1)) { cur.y++; lastActionRotate = false; groundCheck(); }
        else groundCheck();
      }
      if (lockActive && t >= lockAt) lockPiece();
      draw();
      raf = requestAnimationFrame(loop);
    }
    function startLoop() { if (!raf) { lastT = 0; raf = requestAnimationFrame(loop); } }
    function start() {
      if (over || !running) {
        board = emptyBoard(); score = 0; lines = 0; level = 1; b2b = false; combo = -1;
        nextType = null; holdType = null; holdUsed = false; over = false; paused = false; running = true;
        bag = []; drawHold();
        spawn(); updateHud();
      }
      paused = false; running = true; startLoop();
      $('tStart').textContent = '重新开始';
      draw();
    }
    function togglePause() {
      if (!running || over) return;
      paused = !paused;
      if (paused) { if (raf) cancelAnimationFrame(raf); raf = null; }
      else startLoop();
      draw();
    }
    function gameOver() {
      over = true; running = false;
      if (raf) cancelAnimationFrame(raf); raf = null;
      setHi('tetris', score); updateHud(); draw();
      announce('俄罗斯方块结束 · 得分 ' + score);
    }

    // 键盘：仅当本视图激活时响应
    document.addEventListener('keydown', function (e) {
      if (currentView !== 'tetris') return;
      var k = e.key;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].indexOf(k) >= 0) e.preventDefault();
      if (k === 'ArrowLeft') move(-1);
      else if (k === 'ArrowRight') move(1);
      else if (k === 'ArrowUp' || k === 'x' || k === 'X') rotate(1);
      else if (k === 'z' || k === 'Z') rotate(-1);
      else if (k === 'ArrowDown') softDrop();
      else if (k === ' ') { if (!running || over) start(); else hardDrop(); }
      else if (k === 'c' || k === 'C') hold();
      else if (k === 'p' || k === 'P') togglePause();
    });
    document.querySelectorAll('#tetrisCard .dpad button').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.dataset.k;
        if (a === 'left') move(-1);
        else if (a === 'right') move(1);
        else if (a === 'up') rotate(1);
        else if (a === 'down') softDrop();
        else if (a === 'mid') hardDrop();
      });
    });
    $('tStart').addEventListener('click', function () { start(); });
    $('tPause').addEventListener('click', function () { togglePause(); });
    var hb = $('tHoldBtn'); if (hb) hb.addEventListener('click', function () { hold(); });

    // 离开本视图 → 暂停循环（互不干扰）
    function exit() { if (running && !over && !paused) togglePause(); }

    // 初始状态：空棋盘 + 预览一个随机方块，等待「开始」
    board = emptyBoard(); nextType = nextFromBag(); holdType = null;
    updateHud(); draw(); drawHold();

    return { exit: exit };
  }

  /* ===========================================================
     贪吃蛇 —— 完整引擎（方向/食物/碰撞/难度/结束/重开）
     =========================================================== */
  function initSnake() {
    var cv = $('sCanvas'), ctx = cv && cv.getContext('2d');
    if (!cv || !ctx) return { exit: function () {} };

    var COLS = 20, ROWS = 20, CELL = 16;
    // 难度 → 基础速度(ms/格) 与 加速下限（吃到豆后递减速，但不低于 floor）
    var DIFF = {
      easy:   { base: 150, floor: 70,  label: '简单' },
      normal: { base: 110, floor: 50,  label: '普通' },
      hard:   { base: 75,  floor: 40,  label: '困难' },
      hell:   { base: 45,  floor: 32,  label: '地狱' }
    };

    // 所有可变状态集中在一个对象里：属性访问无歧义，杜绝裸变量闭包在调试中
    // 出现的 “同一变量不同作用域读取到不同值” 现象。
    var S = {
      snake: [], dirQueue: [], dir: { x: 1, y: 0 },
      food: null, score: 0, length: 3, tickMs: DIFF.normal.base,
      running: false, paused: false, over: false, won: false,
      wrap: false, timer: null,
      diffKey: 'normal', baseTick: DIFF.normal.base, minFloor: DIFF.normal.floor
    };
    var card = $('snakeCard');

    function reset() {
      S.snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
      S.dir = { x: 1, y: 0 }; S.dirQueue = [];
      S.score = 0; S.length = 3; S.tickMs = S.baseTick;
      S.over = false; S.won = false; S.paused = false; S.running = false;
      if (card) card.dataset.state = 'idle';
      placeFood(); updateHud(); draw();
    }
    // 食物随机生成：在所有空格中等概率取样，绝不落在蛇身上。
    // 注意：food 必须是 {x, y} 坐标对象（与 head / draw 的访问方式一致），
    // 不能用 [x, y] 数组——否则 head.x === food.x 会恒为假，永远吃不到。
    function placeFood() {
      var free = [];
      for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++)
        if (!S.snake.some(function (s) { return s.x === c && s.y === r; })) free.push([c, r]);
      var idx = Math.floor(Math.random() * free.length);
      S.food = free.length ? { x: free[idx][0], y: free[idx][1] } : null;
    }
    function updateHud() {
      $('sScore').textContent = S.score;
      $('sLen').textContent = S.length;
      $('sHi').textContent = getHi('snake');
    }
    // 输入缓冲队列：最多缓存 2 个转向，杜绝“快速连按导致瞬间 180° 自杀”
    function queueDir(d) {
      var last = S.dirQueue.length ? S.dirQueue[S.dirQueue.length - 1] : S.dir;
      if (d.x === -last.x && d.y === -last.y) return;       // 禁止 180° 反向
      if (d.x === last.x && d.y === last.y) return;          // 同向忽略
      if (S.dirQueue.length < 2) S.dirQueue.push(d); else S.dirQueue[1] = d;
    }
    // 用单一 interval 驱动；速度变化/暂停/离场都通过 reschedule 重建，干净无漂移
    function reschedule() {
      if (S.timer) { clearInterval(S.timer); S.timer = null; }
      if (S.running && !S.paused && !S.over) S.timer = setInterval(tick, S.tickMs);
    }
    function die() {
      S.over = true; S.running = false; S.won = false;
      if (S.timer) { clearInterval(S.timer); S.timer = null; }
      if (card) card.dataset.state = 'over';
      setHi('snake', S.score); updateHud(); draw();
      announce('贪吃蛇结束 · 得分 ' + S.score);
    }
    function win() {
      S.over = true; S.won = true; S.running = false;
      if (S.timer) { clearInterval(S.timer); S.timer = null; }
      if (card) card.dataset.state = 'win';
      setHi('snake', S.score); updateHud(); draw();
      announce('通关！蛇填满全场 · 得分 ' + S.score);
    }
    function tick() {
      if (!S.running || S.paused || S.over) return;
      // 取出一个缓冲转向（再次确认不是反向，避免同帧内连续两次转向自杀）
      if (S.dirQueue.length) {
        var nd = S.dirQueue.shift();
        if (!(nd.x === -S.dir.x && nd.y === -S.dir.y)) S.dir = nd;
      }
      var head = { x: S.snake[0].x + S.dir.x, y: S.snake[0].y + S.dir.y };
      // 边界碰撞
      if (S.wrap) {
        if (head.x < 0) head.x = COLS - 1; else if (head.x >= COLS) head.x = 0;
        if (head.y < 0) head.y = ROWS - 1; else if (head.y >= ROWS) head.y = 0;
      } else if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
        return die();
      }
      // 自身碰撞（尾巴本回合会移动，故排除末节）
      for (var i = 0; i < S.snake.length - 1; i++)
        if (S.snake[i].x === head.x && S.snake[i].y === head.y) return die();
      S.snake.unshift(head);
      if (S.food && head.x === S.food.x && head.y === S.food.y) {
        S.score += 10; S.length = S.snake.length;
        if (S.tickMs > S.minFloor) S.tickMs = Math.max(S.minFloor, S.tickMs - 4); // 越吃越快
        updateHud(); placeFood();
        if (S.food === null) return win();   // 无空格可放 → 通关
        reschedule();
      } else {
        S.snake.pop(); S.length = S.snake.length;
      }
      draw();
    }
    function draw() {
      clearCv(ctx, cv.width, cv.height);
      ctx.strokeStyle = 'rgba(46,42,59,.08)'; ctx.lineWidth = 1;
      for (var x = 1; x < COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, ROWS * CELL); ctx.stroke(); }
      for (var y = 1; y < ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(COLS * CELL, y * CELL); ctx.stroke(); }
      // 未开始：干净棋盘 + 提示（无蛇、无食物、无眼睛）
      if (!S.running && !S.over) {
        overlayText(ctx, cv.width, cv.height, ['按 开始', '或 空格']);
        return;
      }
      if (S.food) drawBlock(ctx, S.food.x * CELL, S.food.y * CELL, CELL, cssVar('--pink', '#FF5D8F'));
      for (var i = 0; i < S.snake.length; i++) {
        var s = S.snake[i];
        drawBlock(ctx, s.x * CELL, s.y * CELL, CELL, i === 0 ? cssVar('--green', '#4FC46A') : '#7FD89A');
      }
      if (S.snake.length) {
        var h = S.snake[0], ex = h.x * CELL, ey = h.y * CELL;
        ctx.fillStyle = '#2E2A3B';
        var e = Math.max(2, CELL * 0.18);
        if (S.dir.x === 1) { ctx.fillRect(ex + CELL * 0.6, ey + CELL * 0.2, e, e); ctx.fillRect(ex + CELL * 0.6, ey + CELL * 0.6, e, e); }
        else if (S.dir.x === -1) { ctx.fillRect(ex + CELL * 0.2, ey + CELL * 0.2, e, e); ctx.fillRect(ex + CELL * 0.2, ey + CELL * 0.6, e, e); }
        else if (S.dir.y === -1) { ctx.fillRect(ex + CELL * 0.2, ey + CELL * 0.2, e, e); ctx.fillRect(ex + CELL * 0.6, ey + CELL * 0.2, e, e); }
        else { ctx.fillRect(ex + CELL * 0.2, ey + CELL * 0.6, e, e); ctx.fillRect(ex + CELL * 0.6, ey + CELL * 0.6, e, e); }
      }
      if (S.won) overlayText(ctx, cv.width, cv.height, ['通关！', '得分 ' + S.score]);
      else if (S.over) overlayText(ctx, cv.width, cv.height, ['GAME OVER', '得分 ' + S.score]);
      else if (S.paused) overlayText(ctx, cv.width, cv.height, ['暂停中', '按 P 继续']);
    }
    function start() {
      reset();
      S.running = true; S.over = false; S.won = false; S.paused = false;
      if (card) card.dataset.state = 'running';
      reschedule();
      $('sStart').textContent = '重新开始';
      draw();
    }
    function togglePause() {
      if (!S.running || S.over) return;
      S.paused = !S.paused; draw();
      if (card) card.dataset.state = S.paused ? 'paused' : 'running';
      if (S.paused) { if (S.timer) { clearInterval(S.timer); S.timer = null; } }
      else reschedule();
    }
    function setDifficulty(d) {
      if (!DIFF[d]) return;
      S.diffKey = d; S.baseTick = DIFF[d].base; S.minFloor = DIFF[d].floor;
      if (S.running || S.over) start();          // 进行中切换难度 → 以新速度重开一局（可预期）
      else { S.tickMs = S.baseTick; draw(); }
      announce('难度：' + DIFF[d].label);
    }

    // 键盘：仅当本视图激活时响应
    document.addEventListener('keydown', function (e) {
      if (currentView !== 'snake') return;
      var k = e.key;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].indexOf(k) >= 0) e.preventDefault();
      if (k === 'ArrowUp') queueDir({ x: 0, y: -1 });
      else if (k === 'ArrowDown') queueDir({ x: 0, y: 1 });
      else if (k === 'ArrowLeft') queueDir({ x: -1, y: 0 });
      else if (k === 'ArrowRight') queueDir({ x: 1, y: 0 });
      else if (k === ' ') { if (!S.running || S.over) start(); }
      else if (k === 'p' || k === 'P') togglePause();
    });
    document.querySelectorAll('#snakeCard .dpad button').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.dataset.k;
        if (a === 'up') queueDir({ x: 0, y: -1 });
        else if (a === 'down') queueDir({ x: 0, y: 1 });
        else if (a === 'left') queueDir({ x: -1, y: 0 });
        else if (a === 'right') queueDir({ x: 1, y: 0 });
        else if (a === 'mid') { if (!S.running || S.over) start(); else togglePause(); }
      });
    });
    $('sStart').addEventListener('click', function () { start(); });
    $('sPause').addEventListener('click', function () { togglePause(); });
    var wcb = $('sWrap'); if (wcb) wcb.addEventListener('change', function () { S.wrap = wcb.checked; if (!S.running) draw(); });
    // 难度分段控件
    document.querySelectorAll('#snakeDiff .seg-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('#snakeDiff .seg-btn').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        setDifficulty(b.dataset.d);
      });
    });

    // 离开本视图 → 暂停循环（互不干扰）
    function exit() {
      if (S.running && !S.over) { S.paused = true; if (S.timer) { clearInterval(S.timer); S.timer = null; } }
    }

    reset(); draw();
    return { exit: exit, setDifficulty: setDifficulty };
  }

  /* ===========================================================
     视图切换接线
     =========================================================== */
  function init() {
    ctrls.snake = initSnake();
    ctrls.tetris = initTetris();

    var ls = $('launchSnake'); if (ls) ls.addEventListener('click', function () { showView('snake'); });
    var lt = $('launchTetris'); if (lt) lt.addEventListener('click', function () { showView('tetris'); });
    var sb = $('snakeBack'); if (sb) sb.addEventListener('click', function () { showView('menu'); });
    var tb = $('tetrisBack'); if (tb) tb.addEventListener('click', function () { showView('menu'); });

    showView('menu'); // 默认显示主菜单
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
