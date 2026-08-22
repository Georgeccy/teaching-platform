'use strict';

// ============================================================
//  智学平台 · 零依赖 JSON 数据存储层
//  - 仅使用 Node 内置模块 (fs / crypto)
//  - 所有数据存于 server/data/db.json
//  - 首次启动自动注入种子数据（教师 + 多名学生 + 示例进度）
// ============================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// 薄弱点维度（与 DSE 唐子涵薄弱点对齐）
const WEAK_KEYS = ['tfng', 'pronoun', 'attitude', 'wordform', 'conjunction', 'intransitive'];
const WEAK_LABELS = {
  tfng: 'T/F/NG 判断',
  pronoun: '代词指代',
  attitude: '态度词推断',
  wordform: '词形转换',
  conjunction: '连词语序',
  intransitive: '不及物陷阱',
};

// 确定性随机（mulberry32），保证种子数据每次一致
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashPassword(password, salt) {
  const derived = crypto.scryptSync(password, salt, 32).toString('hex');
  return derived;
}

function makeSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function newId(prefix) {
  return prefix + '_' + crypto.randomBytes(6).toString('hex');
}

// ---- 默认进度结构 ----
function emptyProgress(name, userId) {
  const weak = {};
  WEAK_KEYS.forEach((k) => (weak[k] = 50 + Math.floor(Math.random() * 20)));
  return {
    userId,
    name,
    weakPoints: weak,
    petScore: 0, // 学宝积分（趣味货币，与学术进度分离）
    stats: { correct: 0, total: 0, streak: 0, maxStreak: 0, completedUnits: [] },
    history: [],
    questionTimings: [],
    updatedAt: Date.now(),
  };
}

// ---- 生成 14 天历史（用于趋势图） ----
function genHistory(rng, baseScore) {
  const history = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    // 周末练习少
    const dow = d.getDay();
    const sessions = dow === 0 || dow === 6 ? Math.floor(rng() * 2) : Math.floor(rng() * 3) + 1;
    for (let s = 0; s < sessions; s++) {
      const total = 8 + Math.floor(rng() * 8);
      const acc = Math.min(1, Math.max(0.4, baseScore / 100 + (rng() - 0.5) * 0.3));
      const correct = Math.round(total * acc);
      history.push({
        date: dateStr,
        type: ['reading', 'writing', 'grammar'][Math.floor(rng() * 3)],
        correct,
        total,
        score: Math.round((correct / total) * 100),
      });
    }
  }
  return history;
}

function buildSeed() {
  const db = { users: {}, sessions: {}, progress: {} };

  // 教师
  const teacherSalt = makeSalt();
  const teacherId = newId('u');
  db.users[teacherId] = {
    id: teacherId,
    username: 'teacher',
    name: '王老师',
    role: 'teacher',
    salt: teacherSalt,
    passwordHash: hashPassword('teacher123', teacherSalt),
  };

  // 学生
  const students = [
    { username: 'tangzihan', name: '唐子涵', base: 72 },
    { username: 'lihua', name: '李华', base: 81 },
    { username: 'zhangming', name: '张明', base: 64 },
    { username: 'chenxiao', name: '陈晓', base: 88 },
    { username: 'wangfang', name: '王芳', base: 59 },
    { username: 'liuyang', name: '刘洋', base: 76 },
  ];

  students.forEach((st, idx) => {
    const rng = mulberry32(1000 + idx * 7);
    const salt = makeSalt();
    const id = newId('u');
    db.users[id] = {
      id,
      username: st.username,
      name: st.name,
      role: 'student',
      salt,
      passwordHash: hashPassword('student123', salt),
    };
    const progress = emptyProgress(st.name, id);
    // 用种子随机设置薄弱点（唐子涵贴合设定）
    if (st.username === 'tangzihan') {
      progress.weakPoints = { tfng: 48, pronoun: 52, attitude: 55, wordform: 45, conjunction: 50, intransitive: 58 };
    } else {
      WEAK_KEYS.forEach((k) => (progress.weakPoints[k] = 40 + Math.floor(rng() * 50)));
    }
    progress.history = genHistory(rng, st.base);
    // 汇总 stats
    let correct = 0, total = 0, maxStreak = 0, run = 0;
    progress.history.forEach((h) => {
      correct += h.correct;
      total += h.total;
      if (h.score >= 60) { run++; maxStreak = Math.max(maxStreak, run); }
      else run = 0;
    });
    progress.stats = {
      correct,
      total,
      streak: run,
      maxStreak,
      completedUnits: ['reading-u1', 'reading-u2', 'grammar-sprint'].slice(0, 1 + Math.floor(rng() * 3)),
    };
    progress.updatedAt = Date.now();
    db.progress[id] = progress;
  });

  return db;
}

// ---- 持久化 ----
let cache = null;

function load() {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    cache = JSON.parse(raw);
  } catch (e) {
    cache = buildSeed();
    save();
  }
  return cache;
}

function save() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(cache, null, 2), 'utf8');
}

// ============================================================
//  对外 API
// ============================================================

function getUserByUsername(username) {
  const db = load();
  return Object.values(db.users).find((u) => u.username === username) || null;
}

function getUserById(id) {
  const db = load();
  return db.users[id] || null;
}

function createUser({ username, password, name, role = 'student' }) {
  const db = load();
  if (getUserByUsername(username)) return { error: '用户名已存在' };
  const salt = makeSalt();
  const id = newId('u');
  db.users[id] = {
    id,
    username,
    name: name || username,
    role,
    salt,
    passwordHash: hashPassword(password, salt),
  };
  db.progress[id] = emptyProgress(name || username, id);
  save();
  return { user: publicUser(db.users[id]), id };
}

function verifyPassword(user, password) {
  return hashPassword(password, user.salt) === user.passwordHash;
}

function publicUser(u) {
  return { id: u.id, username: u.username, name: u.name, role: u.role };
}

function createSession(userId) {
  const db = load();
  const token = crypto.randomBytes(24).toString('hex');
  db.sessions[token] = { userId, createdAt: Date.now(), expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30 };
  save();
  return token;
}

function getSessionUser(token) {
  if (!token) return null;
  const db = load();
  const s = db.sessions[token];
  if (!s) return null;
  if (s.expiresAt < Date.now()) {
    delete db.sessions[token];
    save();
    return null;
  }
  return getUserById(s.userId);
}

function getProgress(userId) {
  const db = load();
  return db.progress[userId] || null;
}

function saveProgress(userId, patch) {
  const db = load();
  if (!db.progress[userId]) return null;
  db.progress[userId] = Object.assign(db.progress[userId], patch, { updatedAt: Date.now() });
  save();
  return db.progress[userId];
}

// 上报一次练习事件，自动更新统计与连胜
function appendEvent(userId, ev) {
  const db = load();
  const p = db.progress[userId];
  if (!p) return null;
  const correct = Number(ev.correct) || 0;
  const total = Number(ev.total) || 0;
  if (total > 0) {
    p.stats.correct += correct;
    p.stats.total += total;
    const passed = correct / total >= 0.6;
    if (passed) {
      p.stats.streak += 1;
      p.stats.maxStreak = Math.max(p.stats.maxStreak, p.stats.streak);
    } else {
      p.stats.streak = 0;
    }
    // 更新对应薄弱点熟练度（简单指数滑动平均）
    if (ev.weakKey && p.weakPoints[ev.weakKey] != null) {
      const gain = (correct / total - 0.5) * 8; // -4 ~ +4
      p.weakPoints[ev.weakKey] = Math.max(0, Math.min(100, Math.round(p.weakPoints[ev.weakKey] + gain)));
    }
    p.history.push({
      date: new Date().toISOString().slice(0, 10),
      type: ev.type || 'practice',
      correct,
      total,
      score: Math.round((correct / total) * 100),
    });
  }
  if (ev.unit && !p.stats.completedUnits.includes(ev.unit)) {
    p.stats.completedUnits.push(ev.unit);
  }
  p.updatedAt = Date.now();
  save();
  return p;
}

// 记录单题作答用时（学生每题计时）
function appendQuestionTiming(userId, rec) {
  const db = load();
  const p = db.progress[userId];
  if (!p) return null;
  if (!Array.isArray(p.questionTimings)) p.questionTimings = [];
  p.questionTimings.push({
    session: rec.session || 'unknown',
    qid: rec.qid || '',
    type: rec.type || 'mc',
    ms: Number(rec.ms) || 0,
    correct: !!rec.correct,
    ts: Date.now(),
  });
  // 防止无限增长：仅保留最近 800 条
  if (p.questionTimings.length > 800) {
    p.questionTimings = p.questionTimings.slice(-800);
  }
  p.updatedAt = Date.now();
  save();
  return p;
}

// 教师总览聚合
function getTeacherOverview() {
  const db = load();
  const students = Object.values(db.users).filter((u) => u.role === 'student');
  const progs = students.map((u) => db.progress[u.id]).filter(Boolean);

  // KPI
  const totalExercises = progs.reduce((s, p) => s + p.stats.total, 0);
  const totalCorrect = progs.reduce((s, p) => s + p.stats.correct, 0);
  const classAvg = totalExercises ? Math.round((totalCorrect / totalExercises) * 100) : 0;
  const activeStudents = progs.filter((p) => (p.history[0] && isRecent(p.history[0].date)) || p.stats.total > 0).length;
  const avgStreak = progs.length ? Math.round(progs.reduce((s, p) => s + p.stats.maxStreak, 0) / progs.length) : 0;

  // 14 天班级趋势（按日期聚合平均分）
  const trendMap = {};
  progs.forEach((p) => {
    p.history.forEach((h) => {
      if (!trendMap[h.date]) trendMap[h.date] = { sum: 0, n: 0 };
      trendMap[h.date].sum += h.score;
      trendMap[h.date].n += 1;
    });
  });
  const trend = Object.keys(trendMap)
    .sort()
    .slice(-14)
    .map((date) => ({ date, avg: Math.round(trendMap[date].sum / trendMap[date].n) }));

  // 薄弱知识点排行（全班平均熟练度，越低越弱）
  const weakAgg = {};
  WEAK_KEYS.forEach((k) => (weakAgg[k] = { sum: 0, n: 0 }));
  progs.forEach((p) => {
    WEAK_KEYS.forEach((k) => {
      weakAgg[k].sum += p.weakPoints[k];
      weakAgg[k].n += 1;
    });
  });
  const weakRanking = WEAK_KEYS.map((k) => ({
    key: k,
    label: WEAK_LABELS[k],
    mastery: weakAgg[k].n ? Math.round(weakAgg[k].sum / weakAgg[k].n) : 0,
  })).sort((a, b) => a.mastery - b.mastery);

  // 学生明细
  const studentRows = progs.map((p) => {
    const acc = p.stats.total ? Math.round((p.stats.correct / p.stats.total) * 100) : 0;
    const weakest = WEAK_KEYS.map((k) => ({ key: k, label: WEAK_LABELS[k], mastery: p.weakPoints[k] }))
      .sort((a, b) => a.mastery - b.mastery)[0];
    return {
      id: p.userId,
      name: p.name,
      accuracy: acc,
      streak: p.stats.streak,
      maxStreak: p.stats.maxStreak,
      completed: p.stats.completedUnits.length,
      weakest,
    };
  }).sort((a, b) => b.accuracy - a.accuracy);

  return {
    kpis: {
      classAvg,
      activeStudents,
      totalStudents: students.length,
      avgStreak,
      totalExercises,
    },
    trend,
    weakRanking,
    students: studentRows,
  };
}

// 班级排行榜（学生也可访问，仅返回聚合排名，不含个体薄弱明细）
function getClassRanking() {
  const db = load();
  const students = Object.values(db.users).filter((u) => u.role === 'student');
  const progs = students.map((u) => db.progress[u.id]).filter(Boolean);
  return progs
    .map((p) => {
      const acc = p.stats.total ? Math.round((p.stats.correct / p.stats.total) * 100) : 0;
      return {
        id: p.userId,
        name: p.name,
        accuracy: acc,
        streak: p.stats.streak,
        maxStreak: p.stats.maxStreak,
        completed: p.stats.completedUnits.length,
        petScore: typeof p.petScore === 'number' ? p.petScore : 0,
      };
    })
    .sort((a, b) => b.accuracy - a.accuracy || b.completed - a.completed || a.name.localeCompare(b.name));
}

// 重置某用户学习进度（清空统计 / 历史 / 已完成单元，薄弱点回退默认值）
function resetProgress(userId) {
  const db = load();
  const u = db.users[userId];
  if (!u) return null;
  db.progress[userId] = emptyProgress(u.name, userId);
  save();
  return db.progress[userId];
}

// 学宝积分：答对 +分、答错 −分（趣味货币，与学术进度分离）
function adjustPetScore(userId, delta) {
  const db = load();
  const p = db.progress[userId];
  if (!p) return null;
  if (typeof p.petScore !== 'number') p.petScore = 0;
  const d = Number(delta) || 0;
  p.petScore = Math.max(-999, Math.min(9999, p.petScore + d));
  p.updatedAt = Date.now();
  save();
  return p.petScore;
}

function isRecent(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return (now - d) < 1000 * 60 * 60 * 24 * 7;
}

module.exports = {
  WEAK_KEYS,
  WEAK_LABELS,
  getUserByUsername,
  getUserById,
  createUser,
  verifyPassword,
  publicUser,
  createSession,
  getSessionUser,
  getProgress,
  saveProgress,
  appendEvent,
  appendQuestionTiming,
  getTeacherOverview,
  getClassRanking,
  resetProgress,
  adjustPetScore,
};
