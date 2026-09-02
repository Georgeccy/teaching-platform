'use strict';
/* ============================================================
   智学平台 · 前端共享层 (assets/app.js)
   - 零依赖，原生 JS
   - 鉴权 token 管理 (localStorage)
   - API 客户端 (自动带 Bearer)
   - 进度/练习事件上报 (POST /api/events)
   - 像素风登录/注册弹窗 + Toast 反馈
   用法：页面引入本文件后，调用 ZhiXue.* 方法。
   ============================================================ */
(function () {
  const TOKEN_KEY = 'zhixue-token';
  const USER_KEY = 'zhixue-user';

  let token = localStorage.getItem(TOKEN_KEY) || null;
  let user = (function () { try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch (e) { return null; } })();
  let progress = null;

  // ---- 注入像素风样式（弹窗 / Toast / 身份芯片），保证独立可用 ----
  function injectStyles() {
    if (document.getElementById('zx-styles')) return;
    const css = `
    .zx-overlay{position:fixed;inset:0;background:rgba(46,42,59,.55);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;}
    .zx-modal{width:360px;max-width:100%;background:var(--bg,#F4ECD8);border:3px solid var(--line,#2E2A3B);box-shadow:6px 6px 0 var(--shadow,#2E2A3B);padding:24px;}
    body.dark .zx-modal{background:var(--card,#2E2A3B);}
    .zx-modal h2{font-family:"Press Start 2P",monospace;font-size:14px;margin-bottom:4px;}
    .zx-modal .zx-sub{color:var(--muted,#6B6478);font-size:12px;margin-bottom:18px;}
    .zx-tabs{display:flex;gap:0;margin-bottom:16px;border:3px solid var(--line,#2E2A3B);}
    .zx-tabs button{flex:1;font-family:"Press Start 2P",monospace;font-size:9px;padding:10px;background:var(--card,#fff);border:none;cursor:pointer;color:var(--text,#2E2A3B);}
    .zx-tabs button.active{background:var(--pink,#FF5D8F);color:#fff;}
    .zx-field{margin-bottom:14px;}
    .zx-field label{display:block;font-size:12px;font-weight:700;margin-bottom:6px;}
    .zx-field input{width:100%;padding:11px 12px;border:3px solid var(--line,#2E2A3B);background:var(--card,#fff);color:var(--text,#2E2A3B);font-family:inherit;font-size:14px;outline:none;}
    .zx-field input:focus{box-shadow:3px 3px 0 var(--shadow,#2E2A3B);}
    .zx-submit{width:100%;font-family:"Press Start 2P",monospace;font-size:11px;padding:13px;background:var(--green,#4FC46A);color:#2E2A3B;border:3px solid var(--line,#2E2A3B);box-shadow:4px 4px 0 var(--shadow,#2E2A3B);cursor:pointer;transition:transform .1s;}
    .zx-submit:hover{transform:translate(-2px,-2px);}
    .zx-err{color:#FF5D8F;font-size:12px;min-height:16px;margin-top:8px;font-weight:700;}
    .zx-hint{margin-top:14px;font-size:11px;color:var(--muted,#6B6478);line-height:1.6;}
    .zx-hint code{background:var(--yellow,#FFC83D);color:#2E2A3B;padding:1px 5px;border:2px solid var(--line,#2E2A3B);}
    .zx-chip{display:inline-flex;align-items:center;gap:8px;}
    .zx-chip .avatar{width:46px;height:46px;flex-shrink:0;background:var(--green,#4FC46A);border:3px solid var(--line,#2E2A3B);box-shadow:4px 4px 0 var(--shadow,#2E2A3B);display:flex;align-items:center;justify-content:center;font-family:"Press Start 2P";font-size:10px;color:#2E2A3B;cursor:pointer;text-decoration:none;}
    .zx-chip .login-btn{font-family:"Press Start 2P",monospace;font-size:10px;padding:12px 14px;background:var(--pink,#FF5D8F);color:#fff;border:3px solid var(--line,#2E2A3B);box-shadow:4px 4px 0 var(--shadow,#2E2A3B);cursor:pointer;text-decoration:none;transition:transform .1s;}
    .zx-chip .login-btn:hover{transform:translate(-2px,-2px);}
    .zx-chip .name{font-weight:700;font-size:13px;}
    .zx-chip .role{font-size:10px;color:var(--muted,#6B6478);}
    .zx-toast{position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:var(--line,#2E2A3B);color:var(--bg,#F4ECD8);border:3px solid var(--line,#2E2A3B);box-shadow:4px 4px 0 rgba(0,0,0,.3);padding:12px 18px;font-size:13px;font-weight:700;z-index:10000;opacity:0;transition:opacity .2s, transform .2s;pointer-events:none;}
    .zx-toast.show{opacity:1;transform:translateX(-50%) translateY(-4px);}
    .zx-toast.ok{background:var(--green,#4FC46A);color:#2E2A3B;}
    .zx-toast.err{background:#FF5D8F;color:#fff;}
    `;
    const style = document.createElement('style');
    style.id = 'zx-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ---- 基础存储 ----
  function setSession(t, u) { token = t; user = u; localStorage.setItem(TOKEN_KEY, t); localStorage.setItem(USER_KEY, JSON.stringify(u)); }
  // 登出：清本地 + 通知服务端失效会话。
  // 之前只清 localStorage，服务端 token 在 30 天有效期内依然可用——
  // 在公用电脑登录后「退出」，拿到 token 的人仍可继续访问。
  // 这里用原生 fetch 而非 api()，避免 401 时 api() 回调 clearSession 造成递归。
  function clearSession() {
    const oldToken = token;
    token = null; user = null; progress = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    if (!oldToken) return;
    try {
      fetch('/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + oldToken },
      }).catch(() => {});
    } catch (e) { /* 服务端失效失败不影响本地登出 */ }
  }

  // ---- API 客户端 ----
  async function api(path, opts) {
    opts = opts || {};
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(path, { method: opts.method || 'GET', headers: headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
    let data = {};
    try { data = await res.json(); } catch (e) {}
    if (res.status === 401) { clearSession(); }
    if (!res.ok) throw new Error(data.error || ('请求失败 (' + res.status + ')'));
    return data;
  }

  function login(username, password) {
    return api('/api/login', { method: 'POST', body: { username: username, password: password } })
      .then((d) => { setSession(d.token, d.user); return d.user; });
  }
  function register(username, password, name, inviteCode) {
    return api('/api/register', {
      method: 'POST',
      body: { username: username, password: password, name: name, inviteCode: inviteCode || '' },
    }).then((d) => { setSession(d.token, d.user); return d.user; });
  }

  // ---- 进度上报 ----
  async function reportEvent(ev) {
    if (!user || !token) return null;
    try {
      const data = await api('/api/events', { method: 'POST', body: ev });
      progress = data.progress;
      window.dispatchEvent(new CustomEvent('zhixue:progress', { detail: progress }));
      return progress;
    } catch (e) {
      console.warn('[ZhiXue] 进度上报失败:', e.message);
      return null;
    }
  }
  async function loadProgress() {
    if (!user) return null;
    try { const d = await api('/api/progress'); progress = d.progress; return progress; } catch (e) { return null; }
  }

  // ---- Toast ----
  function toast(msg, type) {
    injectStyles();
    let t = document.querySelector('.zx-toast');
    if (!t) { t = document.createElement('div'); t.className = 'zx-toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.className = 'zx-toast show' + (type ? ' ' + type : '');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.className = 'zx-toast' + (type ? ' ' + type : ''); }, 2200);
  }

  // ---- 登录/注册弹窗 ----
  let loginResolver = null;
  function openLogin() {
    injectStyles();
    return new Promise((resolve) => {
      loginResolver = resolve;
      let overlay = document.querySelector('.zx-overlay');
      if (overlay) overlay.remove();
      overlay = document.createElement('div');
      overlay.className = 'zx-overlay';
      overlay.innerHTML = `
        <div class="zx-modal" role="dialog" aria-modal="true">
          <h2>智学平台</h2>
          <div class="zx-sub">登录以保存你的学习进度</div>
          <div class="zx-tabs">
            <button data-tab="login" class="active">登录</button>
            <button data-tab="register">注册</button>
          </div>
          <form id="zx-form">
            <div class="zx-field" id="zx-name-field" style="display:none">
              <label>姓名</label>
              <input type="text" id="zx-name" placeholder="例如：唐子涵" />
            </div>
            <div class="zx-field">
              <label>用户名</label>
              <input type="text" id="zx-user" placeholder="3–20 位字母、数字或下划线" autocomplete="username" />
            </div>
            <div class="zx-field">
              <label>密码</label>
              <input type="password" id="zx-pass" placeholder="至少 8 位，含字母和数字" autocomplete="current-password" />
            </div>
            <div class="zx-field" id="zx-invite-field" style="display:none">
              <label>邀请码</label>
              <input type="text" id="zx-invite" placeholder="向老师索取，例如 DSE-XXXXXX" autocomplete="off" />
            </div>
            <button type="submit" class="zx-submit" id="zx-submit">登 录</button>
            <div class="zx-err" id="zx-err"></div>
          </form>
          <div class="zx-hint" id="zx-hint"></div>
        </div>`;
      document.body.appendChild(overlay);

      const form = overlay.querySelector('#zx-form');
      const errEl = overlay.querySelector('#zx-err');
      const nameField = overlay.querySelector('#zx-name-field');
      const inviteField = overlay.querySelector('#zx-invite-field');
      const submitBtn = overlay.querySelector('#zx-submit');
      const hintEl = overlay.querySelector('#zx-hint');
      let mode = 'login';

      // 演示账号只在本地开发时提示；公网部署时显示邀请码引导，
      // 否则等于把可用账号密码写在登录框上。
      const isLocal = ['localhost', '127.0.0.1', '::1'].indexOf(location.hostname) >= 0;
      hintEl.innerHTML = isLocal
        ? '演示账号：教师 <code>teacher / teacher123</code><br/>学生 <code>tangzihan / student123</code>'
        : '还没有账号？点「注册」，需要向老师索取邀请码。';

      overlay.querySelectorAll('.zx-tabs button').forEach((b) => {
        b.addEventListener('click', () => {
          mode = b.dataset.tab;
          overlay.querySelectorAll('.zx-tabs button').forEach((x) => x.classList.remove('active'));
          b.classList.add('active');
          nameField.style.display = mode === 'register' ? 'block' : 'none';
          inviteField.style.display = mode === 'register' ? 'block' : 'none';
          submitBtn.textContent = mode === 'register' ? '注 册' : '登 录';
          errEl.textContent = '';
        });
      });

      overlay.addEventListener('click', (e) => { if (e.target === overlay) closeLogin(); });

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errEl.textContent = '';
        const username = overlay.querySelector('#zx-user').value.trim();
        const password = overlay.querySelector('#zx-pass').value;
        const name = overlay.querySelector('#zx-name').value.trim();
        const inviteCode = (overlay.querySelector('#zx-invite') || {}).value || '';
        if (!username || !password) { errEl.textContent = '请填写用户名和密码'; return; }
        if (mode === 'register' && !inviteCode.trim()) { errEl.textContent = '请填写邀请码'; return; }
        submitBtn.disabled = true;
        try {
          const u = mode === 'register'
            ? await register(username, password, name, inviteCode.trim())
            : await login(username, password);
          closeLogin();
          if (loginResolver) { loginResolver(u); loginResolver = null; }
        } catch (err) {
          errEl.textContent = err.message;
          submitBtn.disabled = false;
        }
      });

      setTimeout(() => overlay.querySelector('#zx-user').focus(), 50);
    });
  }
  function closeLogin() {
    const o = document.querySelector('.zx-overlay');
    if (o) o.remove();
  }
  function ensureLogin() {
    if (user && token) return Promise.resolve(user);
    return openLogin();
  }

  // ---- 身份芯片（插入顶栏） ----
  function renderAuthChip(el) {
    if (!el) return;
    injectStyles();
    el.innerHTML = '';
    if (user) {
      const initial = (user.name || user.username || '?').slice(0, 1);
      const dash = user.role === 'teacher' ? 'teacher.html' : 'dashboard.html';
      const wrap = document.createElement('span');
      wrap.className = 'zx-chip';
      wrap.innerHTML = `
        <a class="avatar" href="${dash}" title="${user.name}（点击进入${user.role === 'teacher' ? '教师看板' : '我的看板'}）">${initial}</a>
        <span style="display:flex;flex-direction:column;line-height:1.2">
          <span class="name">${user.name}</span>
          <span class="role">${user.role === 'teacher' ? '教师' : '学生'} · <a href="#" id="zx-logout" style="color:var(--blue,#4D7CFE)">退出</a></span>
        </span>`;
      el.appendChild(wrap);
      wrap.querySelector('#zx-logout').addEventListener('click', (e) => {
        e.preventDefault();
        clearSession();
        window.location.reload();
      });
    } else {
      const btn = document.createElement('a');
      btn.className = 'login-btn';
      btn.href = '#';
      btn.textContent = '登录 / 注册';
      btn.addEventListener('click', (e) => { e.preventDefault(); openLogin().then(() => window.location.reload()); });
      el.appendChild(btn);
    }
  }
  function initAuthChip(el) { renderAuthChip(el || document.getElementById('authChip')); }

  // ---- 特性开关（feature flags）----
  // 单一来源：学宝（像素宠物 / 积分榜 / 课件 HUD）默认隐藏，置 true 即全站开启。
  // 以下为各功能模块的独立开关：false = 暂时隐藏入口（导航栏 / 侧边栏 / 任意页面均不展示），true = 正常展示。
  // 同步持久化到 localStorage，供不加载本脚本的独立页（pet.html）读取。
  // 注意：本文件为唯一权威来源（不读取 localStorage 覆盖），要恢复某功能只需把对应值改为 true。
  const FEATURES = {
    xuebao: false,
    coursewareStudio: false, // 课件生成工坊（工具模块）：暂时隐藏
    mistakes: false,         // 错题本（学习功能）：暂时隐藏
    homework: false,         // 作业（学习功能）：暂时隐藏
    leaderboard: false,      // 排行榜（学习功能）：暂时隐藏
    settings: true           // 设置（学习功能）：保持可见
  };

  // ---- 按特性开关隐藏功能入口（导航栏 / 侧边栏 / 任意页面）----
  // 覆盖三种来源：① 带 data-feature="x" 的元素；② 指向被隐藏功能页的导航链接；
  // ③ 因全部子项隐藏而变空的「分组分隔标题」。
  function applyFeatureVisibility() {
    if (typeof document === 'undefined' || !document.querySelectorAll) return;
    var feats = (window.ZhiXue && window.ZhiXue.features) || FEATURES;
    var HREF_FEATURE = {
      'courseware-studio.html': 'coursewareStudio',
      'mistakes.html': 'mistakes',
      'homework.html': 'homework',
      'leaderboard.html': 'leaderboard'
    };
    function hide(el) { if (el && el.style) el.style.display = 'none'; }
    // ① data-feature 标记的元素（如工具区的「课件生成工坊」）
    document.querySelectorAll('[data-feature]').forEach(function (el) {
      var f = el.getAttribute('data-feature');
      if (feats[f] === false) hide(el);
    });
    // ② 指向被隐藏功能页的导航链接（覆盖各 xuebao 页面自身侧边栏）
    document.querySelectorAll('.sidebar .nav a, .nav a').forEach(function (a) {
      var h = a.getAttribute('href');
      if (h && HREF_FEATURE[h] && feats[HREF_FEATURE[h]] === false) hide(a);
    });
    // ③ 清理因隐藏而变空的「分组分隔标题」（如「工具」「学习」）
    document.querySelectorAll('.nav-sep').forEach(function (sep) {
      var sib = sep.nextElementSibling;
      var anyVisible = false;
      while (sib && !(sib.classList && sib.classList.contains('nav-sep'))) {
        if (sib.tagName === 'A' && sib.style.display !== 'none') anyVisible = true;
        sib = sib.nextElementSibling;
      }
      if (!anyVisible) hide(sep);
    });
  }
  if (document.readyState !== 'loading') applyFeatureVisibility();
  else document.addEventListener('DOMContentLoaded', applyFeatureVisibility);

  // ---- 暴露 API ----
  window.ZhiXue = {
    get user() { return user; },
    get token() { return token; },
    get progress() { return progress; },
    features: FEATURES,
    setSession, clearSession, api, login, register,
    ensureLogin, openLogin, closeLogin,
    reportEvent, loadProgress,
    toast, renderAuthChip, initAuthChip,
    injectStyles, applyFeatureVisibility,
  };
  try { localStorage.setItem('zhixue-features', JSON.stringify(FEATURES)); } catch (e) {}
})();
