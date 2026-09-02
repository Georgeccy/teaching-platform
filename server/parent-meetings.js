'use strict';

// ============================================================
//  智学平台 · 家长会材料存储层（零依赖）
//  - 索引：server/data/parent-meetings.json
//  - 内容：server/data/parent-meetings/<id>.md（原始 markdown）
//  - 元数据（id/studentName/title/date/filename/updatedAt）存于索引文件，
//    内容（长 markdown）单独落盘，避免索引文件膨胀。
//  - 首次启动时若目录为空，从同目录的 _seed_*.md 自动植入种子材料。
// ============================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const DIR = path.join(DATA_DIR, 'parent-meetings');
const INDEX_FILE = path.join(DIR, 'index.json');

// 确保目录存在（仅在首次写入时创建）
function ensureDir() {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
}

function readIndex() {
  ensureDir();
  try {
    return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  } catch (e) {
    return { items: {} };
  }
}

function writeIndex(idx) {
  ensureDir();
  fs.writeFileSync(INDEX_FILE, JSON.stringify(idx, null, 2), 'utf8');
}

// 简易 slugify：保留中日韩字符，仅替换空白与不安全符号
function slugify(s) {
  if (!s) return '';
  return String(s)
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[\\/:*?"<>|]/g, '')
    .slice(0, 64);
}

function newId() {
  return 'pm_' + crypto.randomBytes(5).toString('hex');
}

// id 合法性校验（防止路径穿越 / 注入）：仅允许 ASCII 字母数字下划线连字符，长度 ≤ 128
function validId(id) {
  return typeof id === 'string' && id.length > 0 && id.length <= 128 && !/[\/\\\x00]/.test(id) && /^[A-Za-z0-9_-]+$/.test(id);
}

// 从 PDF 文件名推测学生姓名（取扩展名前、首个非姓名分隔符之前的中英文字符段）
function guessNameFromFilename(filename) {
  if (!filename) return '未命名学生';
  const base = filename.replace(/\.[^.]+$/, '').trim();
  const m = base.match(/^[^\s_·\-]+/);
  return (m ? m[0] : base).slice(0, 24) || '未命名学生';
}

// 从 markdown 首行解析出学生姓名（约定：首行形如 "# 张淳安 · ..." 或 "# 张淳安 ..."）
function parseTitle(md) {
  const firstLine = (md.split('\n').find((l) => l.trim().startsWith('#')) || '').trim();
  const m = firstLine.replace(/^#+\s*/, '').match(/^([^·\s|｜]+)/);
  return m ? m[1].trim() : '';
}

// 从 markdown 中解析日期（"日期：2026-08-23"）
function parseDate(md) {
  const m = md.match(/日期[:：]\s*(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  // 兜底用文件 mtime 的 yyyy-mm-dd
  return new Date().toISOString().slice(0, 10);
}

// ---- 列表（轻量：不含 markdown 正文） ----
function list() {
  const idx = readIndex();
  return Object.values(idx.items)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

// ---- 读取单条（含 markdown 正文；PDF 条目返回 kind/pdf 标记，不含二进制） ----
function get(id) {
  if (!validId(id)) return null;
  const idx = readIndex();
  const meta = idx.items[id];
  if (!meta) return null;
  let content = '';
  if (meta.kind !== 'pdf') {
    try { content = fs.readFileSync(path.join(DIR, meta.filename), 'utf8'); } catch (e) {}
  }
  return { ...meta, content };
}

// ---- 读取 PDF 二进制（供 /file 端点直接流式返回浏览器预览） ----
function getFile(id) {
  if (!validId(id)) return null;
  const meta = readIndex().items[id];
  if (!meta || meta.kind !== 'pdf') return null;
  const file = path.join(DIR, meta.filename);
  if (!fs.existsSync(file)) return null;
  let buf;
  try { buf = fs.readFileSync(file); } catch (e) { return null; }
  return { meta, buf };
}

// ---- 创建或覆盖（upsert） ----
// payload: { id?, studentName?, title?, content, filename? }
//  - 若提供 id 则覆盖；否则按 studentName+date 生成稳定 id
//  - 解析 markdown 头部补全 studentName/title/date 字段
function upsert(payload) {
  if (!payload || typeof payload.content !== 'string' || !payload.content.trim()) {
    return { error: '缺少 markdown 内容' };
  }
  const idx = readIndex();
  const md = payload.content;
  const studentName = (payload.studentName || parseTitle(md) || '未命名学生').trim();
  const date = (payload.date || '').trim() || parseDate(md);
  // 默认标题带上日期：同一学生的多份材料才不会同名（否则批量归档时必然撞名）
  const title = (payload.title || '').trim() || (studentName + ' · ' + date + ' 家长会材料');

  let id = payload.id && !/[\/\\\x00]/.test(payload.id) && payload.id.length <= 128 ? payload.id : '';
  if (!id) {
    // 每次上传生成唯一 id：保证批量上传时每个文件都独立成条、互不覆盖
    id = newId();
  }

  // 文件名：以稳定 id 命名（ASCII 安全），与索引同步
  const filename = id + '.md';
  const file = path.join(DIR, filename);
  fs.writeFileSync(file, md, 'utf8');

  const meta = {
    id,
    kind: 'md',
    studentName,
    title,
    date,
    filename,
    bytes: Buffer.byteLength(md, 'utf8'),
    updatedAt: Date.now(),
  };
  idx.items[id] = meta;
  writeIndex(idx);
  return { item: meta };
}

// ---- 上传 PDF（二进制落盘，不解析/不提取文本，仅原样保存供前端预览） ----
// payload: { id?, studentName?, title?, date?, filename, dataUrl }
//  dataUrl 形如 "data:application/pdf;base64,...."（前端 FileReader.readAsDataURL 得到）
//  采用 base64 DataURL 进 JSON，避免引入 multipart 解析依赖。
function uploadPdf(payload) {
  if (!payload || typeof payload.dataUrl !== 'string' || !/^data:/.test(payload.dataUrl)) {
    return { error: '缺少 PDF 数据' };
  }
  const m = payload.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return { error: 'PDF 数据格式不正确' };
  const mime = m[1].toLowerCase();
  if (mime !== 'application/pdf') return { error: '仅支持 PDF 格式' };
  let buf;
  try { buf = Buffer.from(m[2], 'base64'); } catch (e) { return { error: 'PDF 解码失败' }; }
  if (!buf.length) return { error: 'PDF 内容为空' };
  if (buf.length > 30 * 1024 * 1024) return { error: 'PDF 过大（>30MB）' };

  const studentName = (payload.studentName || '').trim() || guessNameFromFilename(payload.filename || '');
  const date = (payload.date || '').trim() || new Date().toISOString().slice(0, 10);
  // 同上：默认标题带日期，避免同一学生的多份 PDF 同名
  const title = (payload.title || '').trim() || (studentName + ' · ' + date + ' 家长会 PDF');

  let id = validId(payload.id) ? payload.id : newId();
  const filename = id + '.pdf';
  const file = path.join(DIR, filename);
  fs.writeFileSync(file, buf);

  const meta = {
    id,
    kind: 'pdf',
    studentName,
    title,
    date,
    filename,
    mime: 'application/pdf',
    bytes: buf.length,
    updatedAt: Date.now(),
  };
  const idx = readIndex();
  idx.items[id] = meta;
  writeIndex(idx);
  return { item: meta };
}

// ---- 删除 ----
function remove(id) {
  if (!id || /[\/\\\x00]/.test(id) || id.length > 128) return false;
  const idx = readIndex();
  const meta = idx.items[id];
  if (!meta) return false;
  try { fs.unlinkSync(path.join(DIR, meta.filename)); } catch (e) {}
  delete idx.items[id];
  writeIndex(idx);
  return true;
}

// ---- 首次启动：扫描 _seed_*.md 自动植入 ----
function ensureSeeded() {
  ensureDir();
  const idx = readIndex();
  if (Object.keys(idx.items).length > 0) return; // 已有内容，不重复植入
  if (!fs.existsSync(DIR)) return;
  const seeds = fs.readdirSync(DIR).filter((f) => /^_seed_.*\.md$/.test(f));
  seeds.forEach((f) => {
    try {
      const md = fs.readFileSync(path.join(DIR, f), 'utf8');
      upsert({ content: md });
    } catch (e) {}
  });
  if (seeds.length) console.log('🌱 已植入家长会种子材料 × ' + seeds.length);
}

module.exports = {
  list,
  get,
  getFile,
  upsert,
  uploadPdf,
  remove,
  ensureSeeded,
};
