'use strict';

// ============================================================
//  智学平台 · 邀请码（注册准入）
//  数据：server/data/invite-codes.json → { codes: { CODE: {...} } }
//  规则：
//   - 仅教师可生成 / 查看 / 吊销
//   - 注册时必须携带一枚有效邀请码：存在 + 未使用 + 未吊销 + 未过期
//   - 一码一用（用后即焚）：核销时写入 usedBy / usedAt
//   - 码本身不加密存储，但只存大写码值，不存任何学生信息（核销后才关联 userId）
// ============================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'invite-codes.json');

// 去掉易混淆字符：0/O、1/I/L，避免学生手抄出错
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LEN = 6;
const MAX_BATCH = 100;          // 单次最多生成 100 张
const DEFAULT_DAYS = 30;        // 默认有效期 30 天

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function read() {
  ensureDir();
  let db = null;
  try {
    db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch (e) {
    db = null;
  }
  if (!db || typeof db !== 'object' || !db.codes || typeof db.codes !== 'object') db = { codes: {} };
  // 归一化：补齐缺失字段，过期状态由读取时计算，不写死
  Object.keys(db.codes).forEach((k) => {
    const c = db.codes[k];
    if (!c || typeof c !== 'object') { delete db.codes[k]; return; }
    if (typeof c.code !== 'string') c.code = k;
    if (!c.createdAt) c.createdAt = Date.now();
    if (c.expiresAt == null) c.expiresAt = c.createdAt + DEFAULT_DAYS * 864e5;
    if (c.revoked == null) c.revoked = false;
    if (c.usedBy == null) c.usedBy = '';
  });
  return db;
}

// 原子写入：先写 .tmp 再 rename，避免写入中途被杀导致数据文件损坏
function write(db) {
  ensureDir();
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmp, FILE);
  return db;
}

function newCode() {
  const bytes = crypto.randomBytes(CODE_LEN);
  let out = '';
  for (let i = 0; i < CODE_LEN; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return 'DSE-' + out;
}

function statusOf(c) {
  if (c.revoked) return 'revoked';
  if (c.usedBy) return 'used';
  if (c.expiresAt < Date.now()) return 'expired';
  return 'active';
}

function publicView(c) {
  return {
    code: c.code,
    status: statusOf(c),
    note: c.note || '',
    createdAt: c.createdAt,
    expiresAt: c.expiresAt,
    usedBy: c.usedBy || '',        // 仅教师可见（接口层已鉴权）
    usedAt: c.usedAt || 0,
  };
}

// 列表（教师用）：未使用的排前面，同状态按创建时间倒序
function list() {
  const db = read();
  const order = { active: 0, used: 1, expired: 2, revoked: 3 };
  return Object.values(db.codes)
    .map(publicView)
    .sort((a, b) => (order[a.status] - order[b.status]) || (b.createdAt - a.createdAt));
}

// 批量生成：count 张，有效期 days 天
function create(opts) {
  const o = opts || {};
  const count = Math.min(MAX_BATCH, Math.max(1, parseInt(o.count, 10) || 1));
  const days = Math.min(365, Math.max(1, parseInt(o.days, 10) || DEFAULT_DAYS));
  const db = read();
  const made = [];
  for (let i = 0; i < count; i++) {
    let code = newCode();
    let guard = 0;
    while (db.codes[code] && guard++ < 20) code = newCode();   // 极小概率撞码，重试
    const rec = {
      code,
      note: String(o.note || '').trim().slice(0, 60),
      createdBy: o.createdBy || '',
      createdAt: Date.now(),
      expiresAt: Date.now() + days * 864e5,
      usedBy: '',
      usedAt: 0,
      revoked: false,
    };
    db.codes[code] = rec;
    made.push(publicView(rec));
  }
  write(db);
  return { codes: made };
}

// 校验：返回 { ok: true } 或 { error: '原因' }
function validate(code) {
  const c = String(code || '').trim().toUpperCase();
  if (!c) return { error: '请填写邀请码' };
  const db = read();
  const rec = db.codes[c];
  if (!rec) return { error: '邀请码无效' };
  if (rec.revoked) return { error: '邀请码已被吊销' };
  if (rec.usedBy) return { error: '邀请码已被使用' };
  if (rec.expiresAt < Date.now()) return { error: '邀请码已过期' };
  return { ok: true };
}

// 核销：把码标记为已被该用户使用（一码一用）
function consume(code, userId) {
  const c = String(code || '').trim().toUpperCase();
  const db = read();
  const rec = db.codes[c];
  if (!rec) return { error: '邀请码无效' };
  if (rec.revoked) return { error: '邀请码已被吊销' };
  if (rec.usedBy) return { error: '邀请码已被使用' };
  if (rec.expiresAt < Date.now()) return { error: '邀请码已过期' };
  rec.usedBy = userId || '';
  rec.usedAt = Date.now();
  write(db);
  return { ok: true, code: c };
}

// 吊销：仅对未使用的码有意义；已使用的码保留核销记录用于追溯
function revoke(code) {
  const c = String(code || '').trim().toUpperCase();
  const db = read();
  const rec = db.codes[c];
  if (!rec) return { error: '邀请码不存在' };
  rec.revoked = true;
  write(db);
  return { ok: true };
}

module.exports = { list, create, validate, consume, revoke, MAX_BATCH, DEFAULT_DAYS };
