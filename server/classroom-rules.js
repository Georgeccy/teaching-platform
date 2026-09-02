'use strict';

// ============================================================
//  智学平台 · 课堂规则存储层（零依赖）
//  数据：server/data/classroom-rules.json → { items: [{ id, text }], updatedAt }
//  权限：所有登录用户可读；仅教师可增删改排序（鉴权在路由层）
//  约束：最多 20 条，每条 ≤120 字，去空白后不得为空，同一份规则内不允许完全重复
//  顺序：items 数组顺序即展示顺序（教师端上移/下移直接改数组顺序）
// ============================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'classroom-rules.json');

const MAX_ITEMS = 20;
const MAX_LEN = 120;

// 默认四条（已润色：语气明确但不生硬）
const DEFAULT_RULES = [
  '老师讲话时，请保持安静，同学之间不要大声讨论。',
  '上课期间请勿使用手机或佩戴耳机。',
  '如无法按时提交作业，请单独向老师说明原因。',
  '课堂上请使用文明用语，不对老师或同学说粗话。',
];

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}
function newId() {
  return 'cr_' + crypto.randomBytes(4).toString('hex');
}
function defaults() {
  return DEFAULT_RULES.map(function (t) { return { id: newId(), text: t }; });
}

// 读取即归一化：脏数据（缺字段 / 空文本 / 超长 / 超量）在读取时被修正，
// 与 class-folders.read() 同思路，避免新代码路径被旧数据打爆。
function read() {
  ensureDir();
  let db = null;
  try {
    db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch (e) {
    db = null;
  }
  if (!db || typeof db !== 'object') db = { items: defaults(), updatedAt: Date.now() };
  if (!Array.isArray(db.items)) db.items = defaults();
  db.items = db.items
    .filter(function (it) { return it && typeof it.text === 'string' && it.text.trim(); })
    .slice(0, MAX_ITEMS)
    .map(function (it) {
      return {
        id: (typeof it.id === 'string' && it.id) ? it.id : newId(),
        text: it.text.trim().slice(0, MAX_LEN),
      };
    });
  return db;
}

// 原子写入：先写 .tmp 再 rename（与 store.save() 同策略）。
// 直接 writeFileSync 会先截断原文件，写入途中被杀会留下半截 JSON。
function write(db) {
  ensureDir();
  db.updatedAt = Date.now();
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmp, FILE);
  return db;
}

function list() {
  const db = read();
  return { items: db.items, updatedAt: db.updatedAt || 0 };
}

// 保存：入参 [{ id?, text }] → 校验后整体覆盖（顺序即展示顺序）
// id 保留可让前端的 DOM 复用，避免重排闪烁；新条目由服务端补 id。
function save(input) {
  if (!Array.isArray(input)) return { error: '规则格式不正确' };
  if (input.length > MAX_ITEMS) return { error: '规则最多 ' + MAX_ITEMS + ' 条' };
  const out = [];
  const seen = {};
  for (let i = 0; i < input.length; i++) {
    const raw = input[i] || {};
    const text = typeof raw.text === 'string' ? raw.text.trim() : '';
    const n = out.length + 1;
    if (!text) return { error: '第 ' + n + ' 条内容不能为空' };
    if (text.length > MAX_LEN) return { error: '第 ' + n + ' 条超长（≤' + MAX_LEN + ' 字）' };
    if (seen[text]) return { error: '第 ' + n + ' 条与前面的内容重复' };
    seen[text] = true;
    const id = (typeof raw.id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(raw.id)) ? raw.id : newId();
    out.push({ id: id, text: text });
  }
  const db = write({ items: out, updatedAt: Date.now() });
  return { items: db.items, updatedAt: db.updatedAt };
}

function reset() {
  return write({ items: defaults(), updatedAt: Date.now() });
}

// 首次启动植入默认四条（与 parent-meetings.ensureSeeded 同模式，仅在文件不存在时写入）
function ensureSeeded() {
  ensureDir();
  if (!fs.existsSync(FILE)) write({ items: defaults(), updatedAt: Date.now() });
}

module.exports = {
  list, save, reset, ensureSeeded,
  MAX_ITEMS: MAX_ITEMS,
  MAX_LEN: MAX_LEN,
  DEFAULT_RULES: DEFAULT_RULES,
};
