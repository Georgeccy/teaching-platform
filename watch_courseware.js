#!/usr/bin/env node
'use strict';

// ============================================================
//  智学平台 · 课件实时同步守护进程 (watch_courseware.js)
//  - 零依赖（仅用 Node 内置 fs）
//  - 轮询监听【四个班型】桌面文件夹：比对每个 html/md 文件的 (mtime+size) 签名，
//    任意变动 → 防抖 1.5s → 自动跑 sync_courseware.py
//  - 为何用轮询而非 fs.watch({recursive})：macOS 上 fs.watch 递归监听在
//    iCloud 同步的 ~/Desktop 下极易"静默失活"（不再派发事件），导致自动同步
//    时好时坏。轮询稳定、可预测、对新建子目录同样有效。
//  - 实际执行委托给 sync_runner.js（含跨进程锁 + 状态写入），与本进程/服务端共用
//  - 与后端服务互相独立：本进程崩溃不影响平台运行（启动器会自重启）
// ============================================================

const fs = require('fs');
const path = require('path');
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

const DEBOUNCE_MS = 1500;   // 检测到变动后防抖，合并突发改动
const POLL_MS = 3000;       // 轮询间隔（稳定且轻量）

let timer = null;

function log(msg) {
  const line = '[' + new Date().toISOString() + '] ' + msg + '\n';
  try { fs.appendFileSync(LOG, line); } catch (e) {}
  console.log(msg);
}

function scheduleSync(reason) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    log('🔄 触发同步（防抖结束）：' + reason);
    runSync(reason);
  }, DEBOUNCE_MS);
}

// ---- 递归计算目录下所有 html/md 文件的签名（mtimeMs:size） ----
function walk(dir, cb) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch (e) { return; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    let st;
    try { st = fs.statSync(full); } catch (err) { continue; }
    if (st.isDirectory()) {
      // 跳过 iCloud 占位 / 节点_modules / 隐藏目录
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      walk(full, cb);
    } else if (/\.(html|md)$/i.test(e.name)) {
      cb(full, st);
    }
  }
}

function signature(srcDir) {
  const map = {};
  walk(srcDir, (f, st) => { map[f] = st.mtimeMs + ':' + st.size; });
  return map;
}

// 比对上一轮签名，返回 { changed, detail }
function diffSignature(prevMap, curMap) {
  for (const f in curMap) {
    if (prevMap[f] !== curMap[f]) return { changed: true, detail: '改动 ' + f };
  }
  for (const f in prevMap) {
    if (!(f in curMap)) return { changed: true, detail: '删除 ' + f };
  }
  return { changed: false, detail: '' };
}

const prevSigs = {};   // srcDir -> 上一轮签名

function pollOnce() {
  try {
    const triggers = [];
    SOURCES.forEach((SRC) => {
      if (!fs.existsSync(SRC)) {
        if (prevSigs[SRC]) { delete prevSigs[SRC]; }
        return;
      }
      const cur = signature(SRC);
      const prev = prevSigs[SRC] || {};
      const d = diffSignature(prev, cur);
      if (d.changed) {
        triggers.push(SRC.replace(DESKTOP + '/', '') + (d.detail ? ' → ' + d.detail : ''));
        log('📝 检测到变动：' + triggers[triggers.length - 1]);
      }
      prevSigs[SRC] = cur;
    });
    if (triggers.length) scheduleSync(triggers.join(' ; '));
  } catch (e) {
    log('⚠️ 轮询异常（本轮跳过）：' + e.message);
  }
}

// 初次启动：先建立基线签名（避免立即误触发），再跑一次初始同步
SOURCES.forEach((SRC) => { if (fs.existsSync(SRC)) prevSigs[SRC] = signature(SRC); });
runSync('watcher 启动 / 初始同步');

log('👀 轮询监听已启动（间隔 ' + POLL_MS + 'ms）：\n  - ' + SOURCES.join('\n  - '));
setInterval(pollOnce, POLL_MS);

process.on('SIGTERM', () => { log('🛑 监听进程收到 SIGTERM，退出'); process.exit(0); });
process.on('SIGINT', () => { log('🛑 监听进程收到 SIGINT，退出'); process.exit(0); });
