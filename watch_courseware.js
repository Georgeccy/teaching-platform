#!/usr/bin/env node
'use strict';

// ============================================================
//  智学平台 · 课件实时同步守护进程 (watch_courseware.js)
//  - 零依赖（仅用 Node 内置 fs）
//  - 递归监听【四个班型】桌面文件夹，任意 html/md 变动 → 防抖 1.5s → 自动跑 sync_courseware.py
//  - 实际执行委托给 sync_runner.js（含跨进程锁 + 状态写入），与本进程/服务端共用
//  - 与后端服务互相独立：本进程崩溃不影响平台运行
// ============================================================

const fs = require('fs');
const { runSync } = require('./sync_runner');

const DESKTOP = '/Users/chenchengyu/Desktop';
// 四个班型文件夹（与 sync_courseware.py 的 CLASS_TYPES 保持一致）
const SOURCES = [
  '加速班【港】',
  '真题&模拟题',
  '预备班',
  '加速班【内地】',
].map((d) => DESKTOP + '/' + d);
const LOG = '/tmp/zhixue_watch.log';

const DEBOUNCE_MS = 1500;

let timer = null;

function log(msg) {
  const line = '[' + new Date().toISOString() + '] ' + msg + '\n';
  try { fs.appendFileSync(LOG, line); } catch (e) {}
  console.log(msg);
}

function scheduleSync(reason) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => runSync(reason), DEBOUNCE_MS);
}

// 初次启动先跑一次，保证平台是最新状态
runSync('watcher 启动 / 初始同步');

SOURCES.forEach((SRC) => {
  if (!fs.existsSync(SRC)) {
    log('⚠️ 课件源目录不存在：' + SRC + '；若稍后创建会自动同步');
    return;
  }
  try {
    fs.watch(SRC, { recursive: true }, (event, filename) => {
      if (!filename) return;                       // macOS 偶尔返回 null，忽略
      if (!/\.(html|md)$/i.test(filename)) return; // 只关心课件本体与讲义 md
      log('📝 检测到变动：' + filename + ' (' + event + ') @ ' + SRC);
      scheduleSync(filename);
    });
    log('👀 正在监听课件源目录：' + SRC);
  } catch (e) {
    log('❌ 监听失败：' + SRC + ' → ' + e.message);
  }
});

process.on('SIGTERM', () => { log('🛑 监听进程收到 SIGTERM，退出'); process.exit(0); });
process.on('SIGINT', () => { log('🛑 监听进程收到 SIGINT，退出'); process.exit(0); });
