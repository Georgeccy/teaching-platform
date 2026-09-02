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
  // 关键修复：传给 Python 子进程一份「干净」环境。
  // 直接继承 process.env 会把 WorkBuddy/Electron 启动上下文里的
  // LD_LIBRARY_PATH / ELECTRON_RUN_AS_NODE / CONDA_* / PYTHONHOME / PYTHONPATH
  // 等变量带进去，这些会干扰托管 venv python 的动态链接与子进程启动，
  // 导致 sync_courseware.py 在复制/重建阶段莫名以 exit 1 退出且无报错。
  const cleanEnv = { HOME: process.env.HOME, USER: process.env.USER, LANG: process.env.LANG || 'en_US.UTF-8', LC_ALL: process.env.LC_ALL || 'en_US.UTF-8', LC_CTYPE: process.env.LC_CTYPE || 'UTF-8', TMPDIR: process.env.TMPDIR, TEMP: process.env.TEMP, TMP: process.env.TMP };
  // 中文本地名 / 文件名正确编解码
  cleanEnv.PYTHONUTF8 = '1';
  cleanEnv.PYTHONIOENCODING = 'utf-8';
  if (process.env.PATH) cleanEnv.PATH = process.env.PATH;
  const p = spawn(PY, [SYNC], { cwd: PROJ, env: cleanEnv });
  let out = '';
  let dbg = '';
  p.stdout.on('data', (d) => { out += d.toString(); dbg += d.toString(); });
  p.stderr.on('data', (d) => { out += d.toString(); dbg += d.toString(); });
  p.on('close', (code, signal) => {
    releaseLock();
    const lines = out.split('\n').map((s) => s.trim()).filter(Boolean);
    const summary = lines.slice(-6).join(' | ');
    // 完整输出落到调试日志，便于定位（仅保留最近一次）
    try { fs.writeFileSync('/tmp/zhixue_sync_debug.log', '[' + new Date().toISOString() + '] reason=' + reason + ' code=' + code + ' signal=' + (signal || '') + '\n--- FULL OUTPUT ---\n' + dbg + '\n'); } catch (e) {}
    if (code === 0) {
      writeStatus({ status: 'ok', exitCode: code, reason: reason, summary: summary });
    } else {
      writeStatus({ status: 'error', exitCode: code, reason: reason, summary: summary, error: (signal ? 'killed by ' + signal : 'Python 退出码 ' + code), tail: lines.slice(-15).join('\n') });
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
