#!/usr/bin/env node
'use strict';

// ============================================================
//  智学平台 · 命令行改密码（离线运维工具）
//  用途：上线前把公开的演示密码（teacher123 / student123）改掉，
//        或在学生忘记密码时由老师重置。
//  用法：
//    node server/set-password.js <用户名> <新密码>
//  例：
//    node server/set-password.js teacher MyStr0ngPass
//
//  注意：修改前必须先停掉服务。原因：store.js 在内存里缓存 db.json，
//        服务运行中本工具的写入会被服务下一次 save() 用旧缓存覆盖（等于白改）。
//        本工具会先探测 /api/health，服务在跑就直接拒绝并给出操作步骤。
// ============================================================

const path = require('path');
const http = require('http');
const store = require('./store');

const DEMO = new Set(['teacher123', 'student123', '123456', 'password', '12345678']);
const PORT = process.env.PORT || 3000;

function fail(msg) {
  console.error('❌ ' + msg);
  process.exit(1);
}

// 探测服务是否在运行（健康检查接口，无需登录）
function serviceRunning() {
  return new Promise((resolve) => {
    const req = http.request(
      { host: '127.0.0.1', port: PORT, path: '/api/health', method: 'GET', timeout: 800 },
      (res) => { res.resume(); resolve(true); }
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.end();
  });
}

const [username, newPassword] = process.argv.slice(2);

if (!username || !newPassword) {
  console.log('用法：node server/set-password.js <用户名> <新密码>');
  console.log('例：  node server/set-password.js teacher MyStr0ngPass');
  process.exit(1);
}

serviceRunning().then((running) => {
  if (running) {
    console.error('❌ 检测到服务正在运行（127.0.0.1:' + PORT + ' 有响应）');
    console.error('   服务在内存中缓存了 db.json，此时改密码会被它的下一次写入覆盖。');
    console.error('   请先停服务再改：');
    console.error('     sudo systemctl stop zhixue');
    console.error('     node server/set-password.js ' + username + ' <新密码>');
    console.error('     sudo systemctl start zhixue');
    process.exit(1);
  }

  const user = store.getUserByUsername(username);
  if (!user) fail('用户不存在：' + username);

  if (newPassword.length < 8) fail('新密码至少 8 位');
  if (newPassword.length > 72) fail('新密码过长（≤72 位）');
  if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) fail('新密码需同时包含字母和数字');
  if (DEMO.has(newPassword)) fail('新密码是公开已知的演示密码，请换一个');

  const r = store.changePassword(user.id, null, newPassword, true);
  if (r.error) fail(r.error);

  // 改密后把该用户所有会话清空，强制重新登录
  const kicked = store.deleteUserSessions(user.id);

  console.log('✅ 已更新密码：' + username + '（' + (user.name || '') + '，角色 ' + user.role + '）');
  if (kicked) console.log('   已失效该用户的 ' + kicked + ' 个登录会话，需重新登录');
  console.log('   数据文件：' + path.join(__dirname, 'data', 'db.json'));
});
