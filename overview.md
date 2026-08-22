# 智学平台 · 本次交付概览

## 目标
1. 真正实现学习进度记录的端到端闭环。
2. 补齐 错题本 / 作业 / 排行榜 / 设置 四大功能页并接入导航。
3. 提供可让「所有学生注册 / 登录使用」的安全部署方案。

## 已完成

### 一、进度记录（端到端验证通过）
- 注册 → 做题上报 `/api/events` → `db.json` 持久化（`stats` / `weakPoints` / `history` / `completedUnits` / `streak`）。
- 经临时账号实测：9/10 练习后 `correct:9 total:10 streak:1 completedUnits:["reading-u999"]` 全部落盘，验证后清理。

### 二、四大功能页（连真实数据，像素复古风）
| 页面 | 数据来源 | 内容 |
|------|----------|------|
| `mistakes.html` 错题本 | `/api/progress` | 最弱维度、掌握度条、最近练习、复习建议 |
| `homework.html` 作业 | `manifest.json` + `completedUnits` | 全部单元 + 已完成/待完成状态（unit id 精确匹配） |
| `leaderboard.html` 排行榜 | `/api/leaderboard`（新增） | 班级排名（奖牌、正确率、连胜），高亮「你」 |
| `settings.html` 设置 | `/api/progress/reset`（新增） | 主题切换、账户信息、退出、重置进度 |

### 三、导航统一接入
- `assets/polish.js` 新增 `featureNav()`：自动修复 grammar.html 的 `href="#"` 占位，向其余学生页追加「学习」分区 4 链接并高亮当前页。teacher / 课件工坊 页保留自有导航。
- jsdom 验证：全部学生页导航含 4 链接、内容渲染、无 `href="#"` 残留。

### 四、部署安全 + 方案
- `server/index.js` 静态服务新增 DENY 名单：拒绝公开 `server/`、`deploy/`、`tools/`、隐藏文件、`.py/.sh/.command/.md`。
- 后端改为仅监听 `127.0.0.1:3000`（外部统一由 Caddy 反代）。
- `deploy/` 目录：`Caddyfile`（自动 HTTPS 反代）、`zhixue.service`（systemd 守护）、`deploy.sh`（更新脚本）、`DEPLOY.md`（分步部署指南）。

## 验证结果
- `node --check` 通过；server 重启后 `/` 与新页 200，`db.json`/`deploy/*`/`.py`/隐藏文件 403，`manifest.json` 200。
- `/api/leaderboard`、`/api/progress/reset` 实测 200。

## 后续建议
- 若仅限本班使用，可在 `/api/register` 加邀请码 / 白名单。
- 定期备份 `server/data/db.json`。
- 课件新增后触发同步（网页按钮或 `sync_courseware.py`）。
