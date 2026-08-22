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
const { runSync } = require('../sync_runner');

const ROOT = path.join(__dirname, '..'); // 项目根 /Developer/zhixue-platform
const PORT = process.env.PORT || 3000;

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

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
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

// ---------------- API 路由 ----------------
async function handleApi(req, res, pathname) {
  // 注册
  if (pathname === '/api/register' && req.method === 'POST') {
    const b = await readBody(req);
    if (!b.username || !b.password) return sendJSON(res, 400, { error: '用户名和密码必填' });
    const r = store.createUser(b);
    if (r.error) return sendJSON(res, 409, { error: r.error });
    const token = store.createSession(r.id);
    return sendJSON(res, 200, { token, user: r.user });
  }

  // 登录
  if (pathname === '/api/login' && req.method === 'POST') {
    const b = await readBody(req);
    const u = store.getUserByUsername(b.username);
    if (!u || !store.verifyPassword(u, b.password || '')) {
      return sendJSON(res, 401, { error: '用户名或密码错误' });
    }
    const token = store.createSession(u.id);
    return sendJSON(res, 200, { token, user: store.publicUser(u) });
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
    const b = await readBody(req);
    const updated = store.saveProgress(u.id, b.patch || {});
    return sendJSON(res, 200, { progress: updated });
  }

  // 上报练习事件（课件、移动端、看板调用）
  if (pathname === '/api/events' && req.method === 'POST') {
    const u = authUser(req);
    if (!u) return sendJSON(res, 401, { error: '未登录' });
    const b = await readBody(req);
    const updated = store.appendEvent(u.id, b);
    return sendJSON(res, 200, { progress: updated });
  }

  // 上报单题作答用时（统一阅读播放器调用）
  if (pathname === '/api/question-timing' && req.method === 'POST') {
    const u = authUser(req);
    if (!u) return sendJSON(res, 401, { error: '未登录' });
    const b = await readBody(req);
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

  // ---------------- 课件生成工坊：模板库 CRUD ----------------
  // 列出已保存模板（含轻量元数据）
  if (pathname === '/api/studio/templates' && req.method === 'GET') {
    return sendJSON(res, 200, { templates: listTemplates() });
  }

  // 保存 / 新建模板（body: { id?, name, type, sourceName, html, slots }）
  if (pathname === '/api/studio/template' && req.method === 'POST') {
    const b = await readBody(req);
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
    const b = await readBody(req);
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
    console.error('Server error:', err);
    if (!res.headersSent) sendJSON(res, 500, { error: '服务器内部错误' });
  }
});

// 仅监听本机回环，外部流量统一由 Caddy / Nginx 反代进入（部署安全）
server.listen(PORT, '127.0.0.1', () => {
  console.log('✅ 智学平台后端已启动 → http://127.0.0.1:' + PORT);
  console.log('   静态根目录:', ROOT);
  console.log('   默认账号  教师: teacher / teacher123   学生: tangzihan / student123');
  startLiveReload();
});
