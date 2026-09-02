'use strict';

// ============================================================
//  智学平台 · 零依赖 HTTP 服务
//  - 内置 http/fs/path/url，无第三方依赖
//  - 静态托管项目根目录 + /api JSON 接口
// ============================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const store = require('./store');
const pm = require('./parent-meetings');
const cf = require('./class-folders');
const cr = require('./classroom-rules');
const invites = require('./invites');
const { runSync } = require('../sync_runner');

const ROOT = path.join(__dirname, '..'); // 项目根 /Developer/zhixue-platform
const DATA_DIR = path.join(__dirname, 'data'); // 运行时数据目录（健康检查需探测可写性）
const PORT = process.env.PORT || 3000;

// 生产模式：由部署环境设置（systemd 里写 Environment=NODE_ENV=production）。
// 开启后：禁用演示密码登录、禁止把密码改成常见弱密码。
const IS_PROD = process.env.NODE_ENV === 'production' || process.env.ZHIXUE_ENV === 'production';

// 启动时植入家长会种子材料（首次运行且目录为空时）
pm.ensureSeeded();
// 启动时确保课堂规则有默认四条（首次运行时落盘）
cr.ensureSeeded();

// 启动自检：演示密码的种子账号是公开的，上线前必须改掉
(function warnDemoPasswords() {
  try {
    const risky = store.auditDemoPasswords(['teacher123', 'student123'], 20);
    if (!risky.length) return;
    console.warn('⚠️  以下账号仍在使用演示密码：' + risky.join('、'));
    console.warn('   修改方式：node server/set-password.js <用户名> <新密码>');
    if (IS_PROD) console.warn('⚠️  当前为生产模式，这些密码已被禁止登录，请尽快修改。');
  } catch (e) { /* 自检失败不影响启动 */ }
})();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function sendJSON(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

// 请求体上限：家长会 PDF 以 base64 上传（前端限制 ≤30MB），JSON 膨胀后约 40MB，此处留足余量。
// 没有上限时，一个持续不断的 POST 会把进程内存吃干（部署建议是 1GB 内存的 VPS）。
const MAX_BODY = 40 * 1024 * 1024;

function readBody(req, res) {
  return new Promise((resolve, reject) => {
    let data = '';
    let aborted = false;
    req.on('data', (c) => {
      if (aborted) return;
      data += c;
      if (data.length > MAX_BODY) {
        aborted = true;
        const err = new Error('请求体过大（上限 40MB）');
        err.statusCode = 413;
        // 先把 413 写给客户端，再断开。
        // 若直接 req.destroy()，客户端只会看到 connection reset，拿不到任何错误说明。
        try {
          res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8', Connection: 'close' });
          res.end(JSON.stringify({ error: err.message }));
        } catch (e) { /* 连接可能已断开 */ }
        reject(err);
        // 让响应先 flush 出去，再回收 socket；之后的数据直接丢弃，不再进内存
        setImmediate(() => { try { req.destroy(); } catch (e) {} });
      }
    });
    req.on('end', () => {
      if (aborted) return;
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

function getToken(req) {
  const auth = req.headers['authorization'] || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  // 兼容 query / cookie
  const q = url.parse(req.url, true).query;
  if (q.token) return q.token;
  return null;
}

function authUser(req) {
  return store.getSessionUser(getToken(req));
}

// ---------------- 课件生成工坊（Studio）模板库 ----------------
// 零依赖：模板（含 html + slots + type）存于 courseware/templates/<id>.json
// 复用机制：抽取参考课件的「模板骨架 + 文本槽位」，新内容只需填充槽位即可生成成品，
// 无需 AI 逐字生成，最大化降低 token 消耗。
const STUDIO_DIR = path.join(ROOT, 'courseware', 'templates');

function ensureStudioDir() {
  if (!fs.existsSync(STUDIO_DIR)) fs.mkdirSync(STUDIO_DIR, { recursive: true });
}

function listTemplates() {
  ensureStudioDir();
  const files = fs.readdirSync(STUDIO_DIR).filter((f) => f.endsWith('.json'));
  return files
    .map((f) => {
      try {
        const t = JSON.parse(fs.readFileSync(path.join(STUDIO_DIR, f), 'utf-8'));
        return {
          id: t.id,
          name: t.name,
          type: t.type,
          sourceName: t.sourceName || '',
          slotCount: Array.isArray(t.slots) ? t.slots.length : 0,
          detectedAt: t.detectedAt || null,
          updatedAt: t.updatedAt || null,
        };
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

function readTemplate(id) {
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id)) return null;
  const fp = path.join(STUDIO_DIR, id + '.json');
  if (!fs.existsSync(fp)) return null;
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf-8'));
  } catch (e) {
    return null;
  }
}

function writeTemplate(t) {
  ensureStudioDir();
  const id = t.id && /^[a-zA-Z0-9_-]{1,64}$/.test(t.id) ? t.id : 'tpl_' + crypto.randomBytes(6).toString('hex');
  const fp = path.join(STUDIO_DIR, id + '.json');
  const rec = {
    id,
    name: t.name || id,
    type: t.type || 'generic',
    sourceName: t.sourceName || '',
    html: t.html || '',
    slots: Array.isArray(t.slots) ? t.slots : [],
    detectedAt: t.detectedAt || Date.now(),
    updatedAt: Date.now(),
  };
  fs.writeFileSync(fp, JSON.stringify(rec, null, 2), 'utf-8');
  return rec;
}

function deleteTemplate(id) {
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id)) return false;
  const fp = path.join(STUDIO_DIR, id + '.json');
  if (!fs.existsSync(fp)) return false;
  fs.unlinkSync(fp);
  return true;
}

// ---------------- Live Reload（开发模式自动刷新） ----------------
// 零依赖：服务端用 SSE 推送「reload」事件，浏览器用 EventSource 接收后自动刷新。
const lrClients = new Set();
let lrTimer = null;

function startLiveReload() {
  if (process.env.LIVERELOAD === '0') return; // 设 LIVERELOAD=0 可关闭
  // 忽略：依赖、数据、状态文件、自身客户端脚本
  const IGNORE = /(node_modules|\.git|server\/data|\.watch_status\.json|livereload-client\.js)/;
  function broadcast() {
    if (lrTimer) clearTimeout(lrTimer);
    lrTimer = setTimeout(() => {
      const payload = 'event: reload\ndata: ' + Date.now() + '\n\n';
      lrClients.forEach((r) => {
        try { r.write(payload); } catch (e) { lrClients.delete(r); }
      });
      if (lrClients.size) console.log('🔄 Live Reload: 已通知 ' + lrClients.size + ' 个标签页刷新');
    }, 200);
  }
  try {
    fs.watch(ROOT, { recursive: true }, (event, filename) => {
      if (!filename) return;
      if (IGNORE.test(filename)) return;
      if (!/\.(html|css|js)$/.test(filename)) return;
      broadcast();
    });
    console.log('🔄 Live Reload 已开启：编辑任意 html/css/js，浏览器自动刷新');
  } catch (e) {
    console.warn('⚠️ Live Reload 监听失败（不影响服务）:', e.message);
  }
}

// ---------------- 输入校验 ----------------
// 注册是面向公网的入口，所有字段必须在服务端校验：
// 前端校验只是体验优化，绕过前端直接打接口才是攻击者的默认操作。
function validateUsername(v) {
  const s = String(v == null ? '' : v).trim();
  if (!s) return '请填写用户名';
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(s)) return '用户名需为 3–20 位字母、数字或下划线';
  return '';
}
function validatePassword(v) {
  const s = String(v == null ? '' : v);
  if (s.length < 8) return '密码至少 8 位';
  if (s.length > 72) return '密码过长（≤72 位）';
  if (!/[a-zA-Z]/.test(s) || !/[0-9]/.test(s)) return '密码需同时包含字母和数字';
  return '';
}
function validateName(v) {
  const s = String(v == null ? '' : v).trim();
  if (!s) return '请填写姓名';
  if (s.length > 20) return '姓名过长（≤20 字）';
  if (/[<>@#$%^&*\\/]/.test(s)) return '姓名含不支持的字符';
  return '';
}

// ---------------- IP 限流 ----------------
// 进程内滑动计数（重启即清空）。足以挡住脚本化暴力破解与批量刷号；
// 真正的分布式攻击应交给反向代理层（Caddy / nginx）处理。
const RATE_BUCKETS = new Map();
function clientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (xf) return String(xf).split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}
function rateLimit(key, max, windowMs) {
  const now = Date.now();
  let b = RATE_BUCKETS.get(key);
  if (!b || b.resetAt <= now) { b = { count: 0, resetAt: now + windowMs }; RATE_BUCKETS.set(key, b); }
  b.count++;
  const retryAfter = Math.max(1, Math.ceil((b.resetAt - now) / 1000));
  return { ok: b.count <= max, retryAfter: retryAfter };
}
function tooManyRequests(res, retryAfter) {
  res.setHeader('Retry-After', String(retryAfter));
  const hint = retryAfter > 60 ? Math.ceil(retryAfter / 60) + ' 分钟' : retryAfter + ' 秒';
  return sendJSON(res, 429, { error: '操作过于频繁，请 ' + hint + '后再试' });
}
// 定期清理过期桶，避免长期运行后内存只增不减
const RATE_GC = setInterval(() => {
  const now = Date.now();
  Array.from(RATE_BUCKETS.keys()).forEach((k) => {
    const b = RATE_BUCKETS.get(k);
    if (b && b.resetAt <= now) RATE_BUCKETS.delete(k);
  });
}, 10 * 60 * 1000);
if (RATE_GC.unref) RATE_GC.unref();

// 演示密码：生产环境禁止使用（db.json 种子账号的初始密码是公开的）
const DEMO_PASSWORDS = new Set(['teacher123', 'student123', '123456', 'password', '12345678']);

// ---------------- 家长会材料可见性 ----------------
// 家长会材料含学生姓名与谈话记录，属隐私：教师可看全部，学生只能看自己名下的。
function canReadMaterial(u, item) {
  if (!u) return false;
  if (u.role === 'teacher') return true;
  const a = String((item && item.studentName) || '').trim().toLowerCase();
  const b = String(u.name || '').trim().toLowerCase();
  return !!a && a === b;
}

// ---------------- API 路由 ----------------
async function handleApi(req, res, pathname) {
  // 健康检查：供 systemd / Caddy / 外部监控探活，无需登录。
  // 对外只给最小信息（存活 + 运行时长 + 数据目录可写）；教师登录后才附带数据量统计。
  if (pathname === '/api/health' && req.method === 'GET') {
    let writable = true;
    try {
      const probe = path.join(DATA_DIR, '.health-probe');
      fs.writeFileSync(probe, '1');
      fs.unlinkSync(probe);
    } catch (e) {
      writable = false;   // 磁盘满 / 权限错会在这里暴露，而不是等学生丢数据才发现
    }
    const u = authUser(req);
    const body = {
      ok: writable,
      uptime: Math.round(process.uptime()),
      env: IS_PROD ? 'production' : 'development',
      dataWritable: writable,
    };
    if (u && u.role === 'teacher') body.counts = store.stats();
    return sendJSON(res, writable ? 200 : 503, body);
  }

  // 注册（必须持有效邀请码；角色强制为 student，绝不信任客户端传入的 role）
  if (pathname === '/api/register' && req.method === 'POST') {
    const ip = clientIp(req);
    // 同一 IP 每小时最多 20 次注册：挡得住脚本批量刷号，
    // 又不会误伤「全班在同一个校园网 WiFi 下一起注册」的真实场景。
    const rl = rateLimit('reg:' + ip, 20, 60 * 60 * 1000);
    if (!rl.ok) return tooManyRequests(res, rl.retryAfter);

    const b = await readBody(req, res);
    const err = validateUsername(b.username) ||
                (store.getUserByUsername(String(b.username || '').trim()) ? '用户名已被占用' : '') ||
                validatePassword(b.password) ||
                validateName(b.name);
    if (err) return sendJSON(res, 400, { error: err });

    const inv = invites.validate(b.inviteCode);
    if (inv.error) return sendJSON(res, 400, { error: inv.error });

    // ⚠️ 关键：role 由服务端写死为 student。
    // 旧代码直接把请求体透传给 createUser（role 默认 'student'），
    // 攻击者只要多传一个 "role":"teacher" 就能注册成教师，看到全部班级与家长会材料。
    const r = store.createUser({
      username: String(b.username).trim(),
      password: b.password,
      name: String(b.name).trim(),
      role: 'student',
    });
    if (r.error) return sendJSON(res, 409, { error: r.error });

    invites.consume(b.inviteCode, r.id);      // 一码一用
    const token = store.createSession(r.id);
    return sendJSON(res, 200, { token, user: r.user });
  }

  // 登录（限流：同一 IP + 同一用户名 10 分钟最多 8 次失败）
  if (pathname === '/api/login' && req.method === 'POST') {
    const ip = clientIp(req);
    const b = await readBody(req, res);
    const uname = String(b.username || '').trim();

    const rl = rateLimit('login:' + ip + ':' + uname, 8, 10 * 60 * 1000);
    if (!rl.ok) return tooManyRequests(res, rl.retryAfter);
    const rlIp = rateLimit('login-ip:' + ip, 40, 10 * 60 * 1000);
    if (!rlIp.ok) return tooManyRequests(res, rlIp.retryAfter);

    const u = store.getUserByUsername(uname);
    if (!u || !store.verifyPassword(u, b.password || '')) {
      return sendJSON(res, 401, { error: '用户名或密码错误' });
    }
    if (IS_PROD && DEMO_PASSWORDS.has(String(b.password || ''))) {
      return sendJSON(res, 403, { error: '该账号仍在使用演示密码，请先执行 node server/set-password.js 修改后再登录' });
    }
    const token = store.createSession(u.id);
    return sendJSON(res, 200, { token, user: store.publicUser(u) });
  }

  // 登出：真·失效服务端会话（此前仅前端清 localStorage，token 在 30 天内依然可用）
  if (pathname === '/api/logout' && req.method === 'POST') {
    const token = getToken(req);
    store.deleteSession(token);
    return sendJSON(res, 200, { ok: true });
  }

  // 修改密码：校验旧密码 + 密码强度；成功后把该用户其它设备的会话全部踢下线
  if (pathname === '/api/change-password' && req.method === 'POST') {
    const u = authUser(req);
    if (!u) return sendJSON(res, 401, { error: '未登录' });
    const ip = clientIp(req);
    const rl = rateLimit('pw:' + ip, 10, 60 * 60 * 1000);
    if (!rl.ok) return tooManyRequests(res, rl.retryAfter);
    const b = await readBody(req, res);
    const err = validatePassword(b.newPassword);
    if (err) return sendJSON(res, 400, { error: err });
    if (IS_PROD && DEMO_PASSWORDS.has(String(b.newPassword || ''))) {
      return sendJSON(res, 400, { error: '新密码不能是常见弱密码' });
    }
    const r = store.changePassword(u.id, b.oldPassword, b.newPassword);
    if (r.error) return sendJSON(res, 400, { error: r.error });
    store.deleteUserSessions(u.id, getToken(req));   // 保留当前设备
    return sendJSON(res, 200, { ok: true });
  }

  // 当前用户
  if (pathname === '/api/me' && req.method === 'GET') {
    const u = authUser(req);
    if (!u) return sendJSON(res, 401, { error: '未登录' });
    return sendJSON(res, 200, { user: store.publicUser(u) });
  }

  // 读取进度
  if (pathname === '/api/progress' && req.method === 'GET') {
    const u = authUser(req);
    if (!u) return sendJSON(res, 401, { error: '未登录' });
    return sendJSON(res, 200, { progress: store.getProgress(u.id) || {} });
  }

  // 覆盖/合并进度（用于看板手动设置）
  if (pathname === '/api/progress' && req.method === 'POST') {
    const u = authUser(req);
    if (!u) return sendJSON(res, 401, { error: '未登录' });
    const b = await readBody(req, res);
    const updated = store.saveProgress(u.id, b.patch || {});
    return sendJSON(res, 200, { progress: updated });
  }

  // 上报练习事件（课件、移动端、看板调用）
  if (pathname === '/api/events' && req.method === 'POST') {
    const u = authUser(req);
    if (!u) return sendJSON(res, 401, { error: '未登录' });
    const b = await readBody(req, res);
    const updated = store.appendEvent(u.id, b);
    return sendJSON(res, 200, { progress: updated });
  }

  // 上报单题作答用时（统一阅读播放器调用）
  if (pathname === '/api/question-timing' && req.method === 'POST') {
    const u = authUser(req);
    if (!u) return sendJSON(res, 401, { error: '未登录' });
    const b = await readBody(req, res);
    const updated = store.appendQuestionTiming(u.id, b);
    return sendJSON(res, 200, { ok: true, count: (updated && updated.questionTimings.length) || 0 });
  }

  // 教师总览
  if (pathname === '/api/teacher/overview' && req.method === 'GET') {
    const u = authUser(req);
    if (!u) return sendJSON(res, 401, { error: '未登录' });
    if (u.role !== 'teacher') return sendJSON(res, 403, { error: '无权限' });
    return sendJSON(res, 200, store.getTeacherOverview());
  }

  // 班级排行榜（学生 / 教师均可访问，仅聚合排名，不含个体薄弱明细）
  if (pathname === '/api/leaderboard' && req.method === 'GET') {
    const u = authUser(req);
    if (!u) return sendJSON(res, 401, { error: '未登录' });
    return sendJSON(res, 200, { ranking: store.getClassRanking() });
  }

  // 重置当前用户学习进度
  if (pathname === '/api/progress/reset' && req.method === 'POST') {
    const u = authUser(req);
    if (!u) return sendJSON(res, 401, { error: '未登录' });
    const updated = store.resetProgress(u.id);
    return sendJSON(res, 200, { progress: updated });
  }

  // 学宝积分：答对 +分 / 答错 −分（趣味货币）
  if (pathname === '/api/pet' && req.method === 'POST') {
    const u = authUser(req);
    if (!u) return sendJSON(res, 401, { error: '未登录' });
    const b = await readBody(req, res);
    const delta = Number(b.delta) || 0;
    const petScore = store.adjustPetScore(u.id, delta);
    return sendJSON(res, 200, { petScore });
  }

  // 教师查看单个学生明细
  if (pathname.startsWith('/api/teacher/student/') && req.method === 'GET') {
    const u = authUser(req);
    if (!u || u.role !== 'teacher') return sendJSON(res, 403, { error: '无权限' });
    const id = pathname.split('/').pop();
    const p = store.getProgress(id);
    if (!p) return sendJSON(res, 404, { error: '学生不存在' });
    return sendJSON(res, 200, { progress: p });
  }

  // 立即同步（手动触发）：运行 sync_courseware.py（带跨进程锁，与监听守护互斥）
  if (pathname === '/api/sync' && req.method === 'POST') {
    runSync('手动：立即同步（网页按钮）', () => {});
    return sendJSON(res, 200, { ok: true, message: '同步已触发，稍候刷新即可看到最新课件' });
  }

  // 同步状态（前端轮询）：读取 .watch_status.json。
  // 该文件被静态 DENY 保护（/^\./ 隐藏文件不可经 HTTP 直接读取），故单独经此接口暴露，
  // 既保证前端能拿到实时状态，又避免把状态文件公开到静态目录。
  if (pathname === '/api/sync-status' && req.method === 'GET') {
    const statusFile = path.join(ROOT, '.watch_status.json');
    try {
      const raw = fs.readFileSync(statusFile, 'utf8');
      return sendJSON(res, 200, JSON.parse(raw));
    } catch (e) {
      return sendJSON(res, 200, { status: 'unknown', reason: '尚未同步', updatedAt: null });
    }
  }

  // ---------------- 家长会材料（教师主导） ----------------
  // ⚠️ 隐私边界：材料含学生姓名与谈话记录。
  // 旧实现未做鉴权，任何人 GET 本接口即可拿到全部材料；现已改为：
  //   教师 → 全部；学生 → 仅本人名下。未登录一律 401。
  // 列表：仅元数据（不含长 markdown 正文，节省带宽）
  if (pathname === '/api/parent-meetings' && req.method === 'GET') {
    const u = authUser(req);
    if (!u) return sendJSON(res, 401, { error: '请先登录' });
    const items = u.role === 'teacher'
      ? pm.list()
      : pm.list().filter((it) => canReadMaterial(u, it));
    return sendJSON(res, 200, { items });
  }

  // 读取单条：含 markdown 正文（按上面的可见性规则鉴权）
  const pmRead = pathname.match(/^\/api\/parent-meetings\/([A-Za-z0-9_-]{1,64})$/);
  if (pmRead && req.method === 'GET') {
    const u = authUser(req);
    if (!u) return sendJSON(res, 401, { error: '请先登录' });
    const item = pm.get(pmRead[1]);
    if (!item) return sendJSON(res, 404, { error: '家长会材料不存在' });
    if (!canReadMaterial(u, item)) return sendJSON(res, 403, { error: '无权查看该材料' });
    return sendJSON(res, 200, { item });
  }

  // 上传/覆盖：仅教师可写（Markdown）
  if (pathname === '/api/parent-meetings' && req.method === 'POST') {
    const u = authUser(req);
    if (!u || u.role !== 'teacher') return sendJSON(res, 403, { error: '无权限（仅教师可上传）' });
    const b = await readBody(req, res);
    const r = pm.upsert(b);
    if (r.error) return sendJSON(res, 400, { error: r.error });
    return sendJSON(res, 200, { ok: true, item: r.item });
  }

  // 批量删除：仅教师，body { ids: string[] }
  if (pathname === '/api/parent-meetings' && req.method === 'DELETE') {
    const u = authUser(req);
    if (!u || u.role !== 'teacher') return sendJSON(res, 403, { error: '无权限（仅教师可删除）' });
    const b = await readBody(req, res);
    const ids = Array.isArray(b.ids) ? b.ids : [];
    let deleted = 0;
    ids.forEach(function (id) { if (pm.remove(id)) deleted++; });
    return sendJSON(res, 200, { ok: true, deleted: deleted });
  }

  // 上传 PDF：仅教师可写（二进制原样保存，不解析文本）
  if (pathname === '/api/parent-meetings/pdf' && req.method === 'POST') {
    const u = authUser(req);
    if (!u || u.role !== 'teacher') return sendJSON(res, 403, { error: '无权限（仅教师可上传）' });
    const b = await readBody(req, res);
    const r = pm.uploadPdf(b);
    if (r.error) return sendJSON(res, 400, { error: r.error });
    return sendJSON(res, 200, { ok: true, item: r.item });
  }

  // 读取 PDF 二进制（供前端 <iframe> 原生预览）
  // 鉴权与列表/详情一致：教师全部，学生仅本人（此前只要登录就能读到任意学生的 PDF）
  const pmFile = pathname.match(/^\/api\/parent-meetings\/([A-Za-z0-9_-]{1,64})\/file$/);
  if (pmFile && req.method === 'GET') {
    const u = authUser(req);
    if (!u) return sendJSON(res, 401, { error: '请先登录' });
    const meta = pm.get(pmFile[1]);
    if (!meta) return sendJSON(res, 404, { error: 'PDF 不存在' });
    if (!canReadMaterial(u, meta)) return sendJSON(res, 403, { error: '无权查看该材料' });
    const f = pm.getFile(pmFile[1]);
    if (!f) return sendJSON(res, 404, { error: 'PDF 不存在' });
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Length': f.buf.length,
      'Content-Disposition': 'inline; filename="' + encodeURIComponent(f.meta.filename || 'parent-meeting.pdf') + '"',
      'Cache-Control': 'no-store',
    });
    return res.end(f.buf);
  }

  // 删除：仅教师
  const pmDel = pathname.match(/^\/api\/parent-meetings\/([A-Za-z0-9_-]{1,64})$/);
  if (pmDel && req.method === 'DELETE') {
    const u = authUser(req);
    if (!u || u.role !== 'teacher') return sendJSON(res, 403, { error: '无权限（仅教师可删除）' });
    const ok = pm.remove(pmDel[1]);
    return sendJSON(res, ok ? 200 : 404, ok ? { ok: true } : { error: '家长会材料不存在' });
  }

  // Live Reload SSE 通道（长连接，推送 reload 事件）
  if (pathname === '/api/livereload' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write('retry: 2000\n\n');
    lrClients.add(res);
    req.on('close', () => lrClients.delete(res));
    return; // 不调用 sendJSON，保持连接
  }

  // ---------------- 归档导航：由「已归档资料」派生文件夹树与学生列表 ----------------
  // 平台没有独立的学生名册实体：学生 = 某班级（含其子文件夹）已归档资料中出现的姓名。
  // 「学号」取学生账号的 username；未开通账号的学生为空，前端显示「—」。
  const STALE_DAYS = 180;

  function materialMap() {
    const byId = {};
    pm.list().forEach(function (m) { byId[m.id] = m; });
    return byId;
  }
  function studentUsernameMap() {
    const map = {};
    try {
      store.listStudents().forEach(function (s) {
        if (s.name) map[String(s.name).trim()] = s.username;
      });
    } catch (e) {}
    return map;
  }
  function distinctStudents(ids, byId) {
    const set = {};
    ids.forEach(function (fid) {
      const m = byId[fid];
      if (m && m.studentName) set[String(m.studentName).trim()] = true;
    });
    return Object.keys(set).length;
  }
  // 文件夹树 + 统计（顶层班级与其子文件夹都带上资料数 / 学生数）
  function buildFolderTree() {
    const byId = materialMap();
    return cf.tree().map(function (c) {
      const decorate = function (f) {
        const ids = cf.fileIdsDeep(f.id);
        return Object.assign({}, f, { fileCount: ids.length, studentCount: distinctStudents(ids, byId) });
      };
      const self = decorate(c);
      self.children = c.children.map(decorate);
      return self;
    });
  }
  // 由资料 id 列表派生学生列表（姓名 / 学号 / 资料数 / 最近家长会时间 / 状态）
  function deriveStudents(ids) {
    const byId = materialMap();
    const sMap = studentUsernameMap();
    const groups = {};
    ids.forEach(function (fid) {
      const m = byId[fid];
      if (!m) return;
      const key = String(m.studentName || '未命名学生').trim();
      if (!groups[key]) groups[key] = { name: key, materials: [] };
      groups[key].materials.push({
        id: m.id, title: m.title, date: m.date || '', kind: m.kind || 'md', updatedAt: m.updatedAt || 0,
      });
    });
    const now = Date.now();
    return Object.keys(groups).map(function (k) {
      const g = groups[k];
      g.materials.sort(function (a, b) {
        return String(b.date).localeCompare(String(a.date)) || (b.updatedAt - a.updatedAt);
      });
      const latest = g.materials[0] || null;
      const t = latest && latest.date ? Date.parse(latest.date + 'T00:00:00') : NaN;
      const stale = !latest || isNaN(t) || (now - t) > STALE_DAYS * 864e5;
      return {
        name: g.name,
        username: sMap[g.name] || '',     // 学号（未开通账号则为空）
        materialCount: g.materials.length,
        latestDate: latest ? latest.date : '',
        latestId: latest ? latest.id : '',
        status: stale ? 'stale' : 'updated',
        materials: g.materials,
      };
    }).sort(function (a, b) {
      return String(b.latestDate).localeCompare(String(a.latestDate)) || a.name.localeCompare(b.name, 'zh');
    });
  }

  // ---------------- 邀请码（注册准入，仅教师可管理） ----------------
  // 列表：含每张码的状态（可用 / 已用 / 已过期 / 已吊销）与使用者
  if (pathname === '/api/invite-codes' && req.method === 'GET') {
    const u = authUser(req);
    if (!u || u.role !== 'teacher') return sendJSON(res, 403, { error: '无权限（仅教师可查看邀请码）' });
    return sendJSON(res, 200, { codes: invites.list() });
  }
  // 批量生成：{ count, days, note }
  if (pathname === '/api/invite-codes' && req.method === 'POST') {
    const u = authUser(req);
    if (!u || u.role !== 'teacher') return sendJSON(res, 403, { error: '无权限（仅教师可生成邀请码）' });
    const b = await readBody(req, res);
    const r = invites.create({ count: b.count, days: b.days, note: b.note, createdBy: u.id });
    if (r.error) return sendJSON(res, 400, { error: r.error });
    return sendJSON(res, 200, { codes: r.codes });
  }
  // 吊销：把一枚码作废（已使用的码保留核销记录，便于追溯）
  const invDel = pathname.match(/^\/api\/invite-codes\/([A-Za-z0-9-]{1,32})$/);
  if (invDel && req.method === 'DELETE') {
    const u = authUser(req);
    if (!u || u.role !== 'teacher') return sendJSON(res, 403, { error: '无权限（仅教师可吊销邀请码）' });
    const r = invites.revoke(decodeURIComponent(invDel[1]));
    if (r.error) return sendJSON(res, 404, { error: r.error });
    return sendJSON(res, 200, { ok: true });
  }

  // ---------------- 课堂规则（全站悬浮入口的数据源） ----------------
  // 读取：所有登录用户（学生端也要能看）；修改 / 重置：仅教师
  if (pathname === '/api/classroom-rules' && req.method === 'GET') {
    const u = authUser(req);
    if (!u) return sendJSON(res, 401, { error: '请先登录' });
    return sendJSON(res, 200, cr.list());
  }
  if (pathname === '/api/classroom-rules' && req.method === 'PUT') {
    const u = authUser(req);
    if (!u || u.role !== 'teacher') return sendJSON(res, 403, { error: '仅教师可修改课堂规则' });
    const b = await readBody(req, res);
    const r = cr.save(b.items);
    if (r.error) return sendJSON(res, 400, { error: r.error });
    return sendJSON(res, 200, { items: r.items, updatedAt: r.updatedAt });
  }
  if (pathname === '/api/classroom-rules/reset' && req.method === 'POST') {
    const u = authUser(req);
    if (!u || u.role !== 'teacher') return sendJSON(res, 403, { error: '仅教师可重置课堂规则' });
    const d = cr.reset();
    return sendJSON(res, 200, { items: d.items, updatedAt: d.updatedAt });
  }

  // ---------------- 班级管理（班级文件夹） ----------------
  // 列表：教师可查看自己（平台级）的班级分组
  if (pathname === '/api/class-folders' && req.method === 'GET') {
    const u = authUser(req);
    if (!u || u.role !== 'teacher') return sendJSON(res, 403, { error: '无权限' });
    return sendJSON(res, 200, { classes: cf.list() });
  }

  // 新建班级文件夹
  if (pathname === '/api/class-folders' && req.method === 'POST') {
    const u = authUser(req);
    if (!u || u.role !== 'teacher') return sendJSON(res, 403, { error: '无权限' });
    const b = await readBody(req, res);
    // parentId 有值 → 在该班级下新建子文件夹；否则新建顶层班级
    const r = cf.create(b.name, b.parentId);
    if (r.error) return sendJSON(res, 400, { error: r.error });
    return sendJSON(res, 200, { class: r.class });
  }

  // 归档导航 · 文件夹树（顶层班级 + 子文件夹，含学生数 / 资料数）
  if (pathname === '/api/class-folders/tree' && req.method === 'GET') {
    const u = authUser(req);
    if (!u || u.role !== 'teacher') return sendJSON(res, 403, { error: '无权限' });
    return sendJSON(res, 200, { tree: buildFolderTree() });
  }

  // 归档导航 · 某班级下的学生（由已归档资料派生，非独立名册实体）
  const cfStudents = pathname.match(/^\/api\/class-folders\/([A-Za-z0-9_-]{1,64})\/students$/);
  if (cfStudents && req.method === 'GET') {
    const u = authUser(req);
    if (!u || u.role !== 'teacher') return sendJSON(res, 403, { error: '无权限' });
    const cls = cf.get(cfStudents[1]);
    if (!cls) return sendJSON(res, 404, { error: '班级不存在' });
    return sendJSON(res, 200, {
      class: { id: cls.id, name: cls.name },
      students: deriveStudents(cf.fileIdsDeep(cls.id)),
    });
  }

  // 批量归档：把多个材料统一归入目标文件夹（含同名冲突处理）
  const cfArchive = pathname.match(/^\/api\/class-folders\/([A-Za-z0-9_-]{1,64})\/archive$/);
  if (cfArchive && req.method === 'POST') {
    const u = authUser(req);
    if (!u || u.role !== 'teacher') return sendJSON(res, 403, { error: '无权限' });
    const b = await readBody(req, res);
    const ids = Array.isArray(b.fileIds) ? b.fileIds : [];
    if (!ids.length) return sendJSON(res, 400, { error: '请先选择要归档的材料' });
    const byId = materialMap();
    const nameOf = function (fid) {
      const m = byId[fid];
      return m ? (m.title || m.studentName || fid) : fid;
    };
    const r = cf.archiveMany(cfArchive[1], ids, b.conflict, nameOf);
    if (r.error) return sendJSON(res, 400, { error: r.error });
    const ok = r.results.filter(function (x) { return x.ok; }).length;
    return sendJSON(res, 200, { results: r.results, ok: ok, failed: r.results.length - ok });
  }

  // 删除班级文件夹（含其子文件夹）
  const cfId = pathname.match(/^\/api\/class-folders\/([A-Za-z0-9_-]{1,64})$/);
  if (cfId && req.method === 'DELETE') {
    const u = authUser(req);
    if (!u || u.role !== 'teacher') return sendJSON(res, 403, { error: '无权限' });
    const ok = cf.remove(cfId[1]);
    return sendJSON(res, ok ? 200 : 404, ok ? { ok: true } : { error: '班级不存在' });
  }

  // 将文件归入班级（移动语义：body: { fileIds: string[] }，归入前自动移出其它班级）
  const cfFiles = pathname.match(/^\/api\/class-folders\/([A-Za-z0-9_-]{1,64})\/files$/);
  if (cfFiles && req.method === 'POST') {
    const u = authUser(req);
    if (!u || u.role !== 'teacher') return sendJSON(res, 403, { error: '无权限' });
    const b = await readBody(req, res);
    const r = cf.addFiles(cfFiles[1], b.fileIds || []);
    if (r.error) return sendJSON(res, 400, { error: r.error });
    return sendJSON(res, 200, { class: r.class, added: r.added });
  }

  // 从班级移除单个文件（fileId 经 URL 编码）
  const cfFile = pathname.match(/^\/api\/class-folders\/([A-Za-z0-9_-]{1,64})\/files\/(.+)$/);
  if (cfFile && req.method === 'DELETE') {
    const u = authUser(req);
    if (!u || u.role !== 'teacher') return sendJSON(res, 403, { error: '无权限' });
    let fileId = cfFile[2];
    try { fileId = decodeURIComponent(fileId); } catch (e) {}
    const ok = cf.removeFile(cfFile[1], fileId);
    return sendJSON(res, ok ? 200 : 404, ok ? { ok: true } : { error: '文件不存在' });
  }

  // ---------------- 课件生成工坊：模板库 CRUD ----------------
  // 列出已保存模板（含轻量元数据）
  if (pathname === '/api/studio/templates' && req.method === 'GET') {
    return sendJSON(res, 200, { templates: listTemplates() });
  }

  // 保存 / 新建模板（body: { id?, name, type, sourceName, html, slots }）
  if (pathname === '/api/studio/template' && req.method === 'POST') {
    const b = await readBody(req, res);
    if (!b.html || !Array.isArray(b.slots)) {
      return sendJSON(res, 400, { error: '模板缺少 html 或 slots' });
    }
    const rec = writeTemplate(b);
    return sendJSON(res, 200, { ok: true, id: rec.id });
  }

  // 读取单个模板 / 删除模板：/api/studio/template/:id
  const tplMatch = pathname.match(/^\/api\/studio\/template\/([a-zA-Z0-9_-]+)$/);
  if (tplMatch) {
    const id = tplMatch[1];
    if (req.method === 'GET') {
      const t = readTemplate(id);
      if (!t) return sendJSON(res, 404, { error: '模板不存在' });
      return sendJSON(res, 200, t);
    }
    if (req.method === 'DELETE') {
      const ok = deleteTemplate(id);
      return sendJSON(res, ok ? 200 : 404, ok ? { ok: true } : { error: '模板不存在' });
    }
  }

  // ---------------- 课件生成工坊：一键发布到课件库 ----------------
  // 把生成的成品写入 courseware/<type>/，并在 manifest.json 追加条目（studio:true），
  // 再触发同步重建 reading.html / writing.html，使新单元出现在单元库。
  if (pathname === '/api/studio/publish' && req.method === 'POST') {
    const b = await readBody(req, res);
    if (!b.html) return sendJSON(res, 400, { error: '缺少 html' });
    const type = b.type === 'reading' ? 'reading' : 'writing';
    const clean = (typeof b.name === 'string' && b.name.trim()) ? b.name.trim() : 'studio';
    const rand = crypto.randomBytes(4).toString('hex');
    const filename = 'studio_' + rand + '.html';
    const relFile = 'courseware/' + type + '/' + filename;
    const absFile = path.join(ROOT, relFile);
    const typeDir = path.join(ROOT, 'courseware', type);
    if (!fs.existsSync(typeDir)) fs.mkdirSync(typeDir, { recursive: true });
    fs.writeFileSync(absFile, b.html, 'utf-8');

    // 更新 manifest.json
    const manifestPath = path.join(ROOT, 'courseware', 'manifest.json');
    let manifest = {};
    try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')); } catch (e) {}
    const sec = manifest[type] || (manifest[type] = {});
    let maxKey = 0;
    Object.keys(sec).forEach((k) => { const n = parseInt(k, 10); if (!isNaN(n) && n > maxKey) maxKey = n; });
    const key = String(maxKey + 1);
    sec[key] = {
      file: relFile,
      title: (b.title && b.title.trim()) || clean,
      sub: (b.sub && b.sub.trim()) || ('Studio 发布 · ' + (type === 'reading' ? 'Paper 1' : 'Paper 2')),
      desc: (b.desc && b.desc.trim()) || '由课件生成工坊生成的单元课件。',
      tag: type === 'reading' ? 'READING' : 'WRITING',
      color: (b.color && b.color.trim()) || 'teal',
      progress: 0, version: 1, studio: true, publishedAt: Date.now(),
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

    // 触发同步重建库页（runSync 内部已处理跨进程锁，与监听守护互斥）
    try { runSync('studio 发布：重建库页', () => {}); } catch (e) {}
    return sendJSON(res, 200, { ok: true, file: relFile, unit: key });
  }

  // 未知 API：先把请求体读完再响应。否则 Node 会在响应结束时销毁 socket，
  // 浏览器控制台报 net::ERR_CONNECTION_RESET（带 body 的 POST/DELETE 尤其明显）。
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    try { await readBody(req, res); } catch (e) {}
  }
  return sendJSON(res, 404, { error: 'API 不存在: ' + pathname });
}

// ---------------- 静态文件 ----------------
function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  // 防目录穿越
  const safe = path.normalize(rel).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(ROOT, safe);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  // ---- 部署安全：拒绝公开访问后端 / 数据 / 开发脚本 / 隐藏文件 ----
  const rel2 = safe.replace(/^[\\/]+/, '');
  const DENY = [
    /^server[\\/]/i,            // 后端代码 + 数据（含 db.json）
    /^tools[\\/]/i,             // 开发工具目录
    /^deploy[\\/]/i,            // 部署配置（Caddyfile / systemd / 脚本）
    /^\./,                      // 隐藏文件/目录（.watch_status.json/.qa-screens/.workbuddy/.DS_Store）
    /\.py$/i,                   // Python 源码 / 同步脚本
    /\.command$/i,              // macOS 启动脚本
    /\.sh$/i,                   // Shell 脚本
    /\.md$/i,                   // 文档
    /^(sync_runner|watch_courseware)\.js$/i, // 根目录服务端脚本
  ];
  if (DENY.some((re) => re.test(rel2))) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      // SPA 回退到 index.html
      filePath = path.join(ROOT, 'index.html');
    }
    const ext = path.extname(filePath).toLowerCase();
    fs.readFile(filePath, (e, content) => {
      if (e) {
        res.writeHead(404);
        return res.end('Not Found');
      }
      // 注入 Live Reload 客户端（仅 html，且幂等，避免重复注入）
      if (ext === '.html' && content.indexOf('livereload-client.js') === -1) {
        let html = content.toString('utf-8');
        const inject = '\n<script src="/assets/livereload-client.js"></script>\n';
        const idx = html.lastIndexOf('</body>');
        html = idx === -1 ? html + inject : html.slice(0, idx) + inject + html.slice(idx);
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/html; charset=utf-8' });
        return res.end(html);
      }
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(content);
    });
  });
}

// ---------------- 服务器 ----------------
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url);
  const pathname = parsed.pathname;
  try {
    if (pathname.startsWith('/api/')) {
      await handleApi(req, res, pathname);
    } else {
      serveStatic(req, res, pathname);
    }
  } catch (err) {
    // 已知的业务错误（如请求体超限）按各自状态码返回，其余才算服务器内部错误
    const code = err && err.statusCode ? err.statusCode : 500;
    if (code === 500) console.error('Server error:', err);
    else console.warn('请求被拒 [' + code + ']:', err.message);
    if (!res.headersSent) {
      // 请求体超限时连接可能已被 destroy，写回会抛错，这里静默兜住
      try { sendJSON(res, code, { error: err.message || '服务器内部错误' }); } catch (e) {}
    }
  }
});

// 仅监听本机回环，外部流量统一由 Caddy / Nginx 反代进入（部署安全）
server.listen(PORT, '127.0.0.1', () => {
  console.log('✅ 智学平台后端已启动 → http://127.0.0.1:' + PORT);
  console.log('   静态根目录:', ROOT);
  console.log('   运行模式:', IS_PROD ? 'production（演示密码已禁用）' : 'development');
  // 演示账号只在本机开发时打印；生产环境把账号密码写进日志没有意义，反而增加暴露面
  if (!IS_PROD) console.log('   默认账号  教师: teacher / teacher123   学生: tangzihan / student123');
  startLiveReload();
});
