'use strict';

// ============================================================
//  智学平台 · 班级管理（班级文件夹）
//  零依赖：数据落盘 server/data/class-folders.json
//  结构：{ classes: { [id]: { id, name, parentId, files:[fileId], nameOverrides:{}, updatedAt } } }
//  - 两级：顶层 = 班级（parentId:null）；二级 = 班级下的子文件夹（parentId:班级 id）
//  - 文件夹内为「已归入的文件」列表（指向家长会材料 id）
//  - 文件即平台已导入的家长会材料（Markdown / PDF）；拖拽归类，移动语义：
//    同一文件同一时间仅归属一个文件夹，归入新处时自动从原处移出
//  - nameOverrides：只影响「在本文件夹内的展示名」，用于归档时自动重命名消歧；
//    不改材料本身标题（材料是共享引用，改标题会污染其它位置）
// ============================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'class-folders.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}
function read() {
  ensureDir();
  let db;
  try {
    db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch (e) {
    db = { classes: {} };
  }
  if (!db || typeof db !== 'object' || !db.classes || typeof db.classes !== 'object') db = { classes: {} };
  // 归一化（关键不变量）：任何班级记录都必须带 files 数组。
  // 早期「同学名单」版本创建的班级只有 students 字段、没有 files；
  // 若不在读取时补齐，addFiles 中 (cls.files || []) 能通过判空，
  // 但紧随其后的 cls.files.push(...) 会抛 TypeError → 接口 500 → 拖拽归类失败。
  Object.keys(db.classes).forEach(function (id) {
    var c = db.classes[id];
    if (!c || typeof c !== 'object') { delete db.classes[id]; return; }
    if (!Array.isArray(c.files)) c.files = [];
    // 层级不变量：parentId 必须是「存在的其它文件夹」，否则降级为顶层（null）。
    // 旧数据无此字段 → 顶层；父级被删除 → 降级为顶层，避免出现孤儿节点。
    if (c.parentId != null) {
      if (!validId(c.parentId) || c.parentId === id || !db.classes[c.parentId]) c.parentId = null;
      else if (db.classes[c.parentId].parentId != null) c.parentId = null; // 只支持两级
    } else {
      c.parentId = null;
    }
    if (!c.nameOverrides || typeof c.nameOverrides !== 'object') c.nameOverrides = {};
  });
  return db;
}
function write(db) {
  ensureDir();
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2), 'utf8');
}
function newId() {
  return 'cf_' + crypto.randomBytes(5).toString('hex');
}
// id 合法性校验：仅允许 ASCII 字母数字下划线连字符，长度 ≤ 128（同时用于 fileId）
function validId(id) {
  return typeof id === 'string' && id.length > 0 && id.length <= 128 && !/[\/\\\x00]/.test(id) && /^[A-Za-z0-9_-]+$/.test(id);
}
function normName(n) {
  return String(n == null ? '' : n).trim();
}

function list() {
  const db = read();
  return Object.values(db.classes).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}
function get(id) {
  if (!validId(id)) return null;
  return read().classes[id] || null;
}
// parentId 为空 → 新建顶层班级；否则在指定班级下新建子文件夹
function create(name, parentId) {
  const n = normName(name);
  if (!n) return { error: '名称不能为空' };
  if (n.length > 40) return { error: '名称过长（≤40字）' };
  const db = read();
  let parent = null;
  if (parentId != null && parentId !== '') {
    if (!validId(parentId) || !db.classes[parentId]) return { error: '上级班级不存在' };
    if (db.classes[parentId].parentId != null) return { error: '仅支持两级，子文件夹下不能再建子文件夹' };
    parent = db.classes[parentId];
  }
  const id = newId();
  const rec = {
    id,
    name: n,
    parentId: parent ? parent.id : null,
    files: [],
    nameOverrides: {},
    updatedAt: Date.now(),
  };
  db.classes[id] = rec;
  write(db);
  return { class: rec };
}
function remove(id) {
  if (!validId(id)) return false;
  const db = read();
  if (!db.classes[id]) return false;
  // 删除班级时一并删除其子文件夹，避免留下孤儿层级
  Object.keys(db.classes).forEach(function (oid) {
    if (db.classes[oid].parentId === id) delete db.classes[oid];
  });
  delete db.classes[id];
  write(db);
  return true;
}
// 文件夹树：顶层班级 + 其 children（子文件夹），供归档导航与文件夹选择器使用
function tree() {
  const db = read();
  const all = Object.values(db.classes);
  const tops = all.filter((c) => c.parentId == null)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return tops.map(function (c) {
    return {
      id: c.id,
      name: c.name,
      parentId: null,
      fileCount: c.files.length,
      children: all.filter((s) => s.parentId === c.id)
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        .map(function (s) { return { id: s.id, name: s.name, parentId: s.parentId, fileCount: s.files.length, children: [] }; }),
    };
  });
}
// 某文件夹（若为班级，则含其全部子文件夹）内的所有材料 id（去重）
function fileIdsDeep(id) {
  const db = read();
  const cls = db.classes[id];
  if (!cls) return [];
  const ids = (cls.files || []).slice();
  Object.keys(db.classes).forEach(function (oid) {
    if (db.classes[oid].parentId === id) {
      (db.classes[oid].files || []).forEach(function (f) { if (ids.indexOf(f) < 0) ids.push(f); });
    }
  });
  return ids;
}
// 将文件归入班级（移动语义：先把它从其它班级移出，再归入本班）
function addFiles(id, fileIds) {
  if (!validId(id)) return { error: '班级不存在' };
  if (!Array.isArray(fileIds)) fileIds = [];
  const db = read();
  const cls = db.classes[id];
  if (!cls) return { error: '班级不存在' };
  if (!Array.isArray(cls.files)) cls.files = [];   // 双保险（read() 已归一化）
  const added = [];
  fileIds.forEach(function (fid) {
    if (!validId(fid)) return;
    // 从其它班级移出（保证单归属 / 移动语义）
    Object.keys(db.classes).forEach(function (oid) {
      if (oid === id) return;
      const o = db.classes[oid];
      const i = (o.files || []).indexOf(fid);
      if (i >= 0) { o.files.splice(i, 1); o.updatedAt = Date.now(); }
    });
    if ((cls.files || []).indexOf(fid) < 0) { cls.files.push(fid); added.push(fid); }
  });
  cls.updatedAt = Date.now();
  write(db);
  return { class: cls, added: added.length };
}
function removeFile(id, fileId) {
  if (!validId(id) || !validId(fileId)) return false;
  const db = read();
  const cls = db.classes[id];
  if (!cls) return false;
  if (!Array.isArray(cls.files)) cls.files = [];   // 双保险（read() 已归一化）
  const i = cls.files.indexOf(fileId);
  if (i < 0) return false;
  cls.files.splice(i, 1);
  cls.updatedAt = Date.now();
  write(db);
  return true;
}
// 某文件当前所在的班级 id 列表（供前端展示「已归入」标记）
function classesForFile(fileId) {
  if (!validId(fileId)) return [];
  const db = read();
  return Object.keys(db.classes).filter(function (oid) {
    return (db.classes[oid].files || []).indexOf(fileId) >= 0;
  });
}

// 材料在某文件夹内的展示名：优先本文件夹的重命名覆盖，其次材料自身标题
function displayNameOf(cls, fid, nameOf) {
  const ov = (cls.nameOverrides || {})[fid];
  if (ov) return ov;
  return (nameOf && nameOf(fid)) || fid;
}

// 批量归档：把多个材料统一归入目标文件夹（移动语义），按 conflict 策略处理同名冲突。
//   conflict = 'overwrite' 覆盖：把目标内同名旧条目移出该文件夹，新条目归入
//              'rename'    自动重命名：两者都保留，新条目在本文件夹内的展示名加序号
//              'skip'      跳过：保留原条目，不归入新条目
// nameOf(fileId) → 材料展示名，由调用方（持有 parent-meetings 数据）注入，保持本模块无耦合。
// 返回逐条结果，供前端展示进度、失败原因与重试。
function archiveMany(id, fileIds, conflict, nameOf) {
  if (!validId(id)) return { error: '目标文件夹不存在' };
  if (!Array.isArray(fileIds)) fileIds = [];
  const mode = (conflict === 'overwrite' || conflict === 'rename') ? conflict : 'skip';
  const db = read();
  const cls = db.classes[id];
  if (!cls) return { error: '目标文件夹不存在' };
  if (!Array.isArray(cls.files)) cls.files = [];
  if (!cls.nameOverrides || typeof cls.nameOverrides !== 'object') cls.nameOverrides = {};

  const results = [];
  fileIds.forEach(function (fid) {
    if (!validId(fid)) { results.push({ fileId: fid, ok: false, action: 'invalid', reason: '材料标识不合法' }); return; }
    if (cls.files.indexOf(fid) >= 0) { results.push({ fileId: fid, ok: true, action: 'already', reason: '已在该文件夹' }); return; }

    const incomingName = (nameOf && nameOf(fid)) || fid;
    const dups = cls.files.filter(function (x) { return displayNameOf(cls, x, nameOf) === incomingName; });

    if (dups.length && mode === 'skip') {
      results.push({ fileId: fid, ok: false, action: 'skipped', reason: '目标已存在同名材料「' + incomingName + '」' });
      return;
    }
    if (dups.length && mode === 'overwrite') {
      dups.forEach(function (d) {
        const i = cls.files.indexOf(d);
        if (i >= 0) cls.files.splice(i, 1);
        delete cls.nameOverrides[d];
      });
    }

    // 移动语义：先从其它文件夹移出（并清掉那里的重命名覆盖）
    Object.keys(db.classes).forEach(function (oid) {
      if (oid === id) return;
      const o = db.classes[oid];
      const i = (o.files || []).indexOf(fid);
      if (i >= 0) {
        o.files.splice(i, 1);
        o.updatedAt = Date.now();
        if (o.nameOverrides) delete o.nameOverrides[fid];
      }
    });

    cls.files.push(fid);
    delete cls.nameOverrides[fid];

    // 仅当确实撞名时才加序号，避免无谓的 "(2)" 后缀
    if (mode === 'rename') {
      const used = {};
      cls.files.forEach(function (x) { if (x !== fid) used[displayNameOf(cls, x, nameOf)] = true; });
      let candidate = incomingName, n = 2;
      while (used[candidate]) { candidate = incomingName + ' (' + n + ')'; n++; }
      if (candidate !== incomingName) cls.nameOverrides[fid] = candidate;
    }

    results.push({
      fileId: fid,
      ok: true,
      action: mode === 'overwrite' && dups.length ? 'replaced' : 'archived',
      name: displayNameOf(cls, fid, nameOf),
    });
  });

  cls.updatedAt = Date.now();
  write(db);
  return { results: results };
}

// 供前端渲染文件夹内容：返回带展示名的条目列表
function entriesOf(id, nameOf) {
  const db = read();
  const cls = db.classes[id];
  if (!cls) return [];
  return (cls.files || []).map(function (fid) {
    return { fileId: fid, name: displayNameOf(cls, fid, nameOf) };
  });
}

module.exports = {
  list, get, create, remove, addFiles, removeFile, classesForFile,
  tree, fileIdsDeep, archiveMany, entriesOf, displayNameOf,
};
