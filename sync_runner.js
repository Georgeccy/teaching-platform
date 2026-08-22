#!/usr/bin/env node
'use strict';

// ============================================================
//  智学平台 · 同步执行器 (sync_runner.js)
//  - 被「实时监听守护 watch_courseware.js」与「后端 /api/sync」共用
//  - 跨进程文件锁，避免监听与服务端同时跑 sync 互相踩文件
//  - 运行后把状态写入项目根 .watch_status.json（前端轮询）
//  - 零 npm 依赖
// ============================================================

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PROJ = '/Users/chenchengyu/Developer/zhixue-platform';
const PY = '/Users/chenchengyu/.workbuddy/binaries/python/envs/default/bin/python';
const SYNC = path.join(PROJ, 'sync_courseware.py');
const STATUS = path.join(PROJ, '.watch_status.json');
const LOCK = '/tmp/zhixue_sync.lock';
const LOCK_TTL_MS = 120000; // 锁超时：2 分钟视为陈旧，自动释放

function writeStatus(data) {
  data.updatedAt = new Date().toISOString();
  try { fs.writeFileSync(STATUS, JSON.stringify(data, null, 2)); } catch (e) {}
}

function lockStale() {
  try {
    const s = fs.statSync(LOCK);
    return (Date.now() - s.mtimeMs) > LOCK_TTL_MS;
  } catch (e) { return false; }
}

function acquireLock() {
  if (fs.existsSync(LOCK) && lockStale()) {
    try { fs.unlinkSync(LOCK); } catch (e) {}
  }
  try {
    // 原子排他创建：锁已存在则抛错
    fs.writeFileSync(LOCK, String(process.pid), { flag: 'wx' });
    return true;
  } catch (e) { return false; }
}

function releaseLock() {
  try { fs.unlinkSync(LOCK); } catch (e) {}
}

// runSync(reason, cb?) —— cb(err, {code|skipped})
function runSync(reason, cb) {
  if (!acquireLock()) {
    writeStatus({ status: 'running', reason: reason, note: 'skipped: 已有同步进行中' });
    if (cb) cb(null, { skipped: true });
    return;
  }
  writeStatus({ status: 'running', reason: reason });
  const p = spawn(PY, [SYNC], { cwd: PROJ, env: process.env });
  let out = '';
  p.stdout.on('data', (d) => { out += d.toString(); });
  p.stderr.on('data', (d) => { out += d.toString(); });
  p.on('close', (code) => {
    releaseLock();
    const lines = out.split('\n').map((s) => s.trim()).filter(Boolean);
    const summary = lines.slice(-6).join(' | ');
    if (code === 0) {
      writeStatus({ status: 'ok', exitCode: code, reason: reason, summary: summary });
    } else {
      writeStatus({ status: 'error', exitCode: code, reason: reason, summary: summary });
    }
    if (cb) cb(null, { code: code });
  });
  p.on('error', (err) => {
    releaseLock();
    writeStatus({ status: 'error', error: err.message, reason: reason });
    if (cb) cb(err);
  });
}

module.exports = { runSync };
