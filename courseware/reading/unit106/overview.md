# 2023DSE-Paper1_v5 — 制作记录

## 2026-09-02：以 2015DSE-Paper1_v1 为参考的全功能统一迭代

来源版本：`2023DSE-Paper1_v4/`（原版保留未动；zip 备份：`_backup_20260902/2023DSE-Paper1_v4_backup_20260902.zip`）

### 统一内容（对齐 2015_v1 功能集）
1. **Topbar 重构**：📊 Show Data / 🔒 Easy / 💡 Tips / 📝 Notes / 🗑 Clear / ↺ Reset / 🎨 Theme 收进「⋯」菜单；🎲 随机点名直达导航栏
2. **📝 Notes 笔记**：右侧滑入面板、按页 localStorage 持久化（NOTE_KEY=`xdf-dse2023-p1-note_`）、300ms 防抖自动保存
3. **🧱 砖块正确率**：80 砖块（75 裸 acc-badge 包裹 + Q6 已有 5）+ Q6 改错题错词解耦；Show Data 一键全碎/复原（含状态 cov 回放）
4. **响应式收纳**：<1300 隐 course-tag；<1024 计时器紧凑；<768 隐标题/连击+换行兜底；<430 隐缩放
5. **悬浮修复**：reveal-btn / q1-tap-btn 悬浮改亮紫底+深色文字（废除 brightness 连带提亮白字）
5b. **改错题解耦（Q6）**：错词从 `.cloze` 改专用 `.q64-wrong`（data-wrong/data-correct），脱离 cloze 位置索引状态回放（回放错位会把正确答案写进题干）；revealQ1Row 重绑 + Tap 自动击碎该行砖块
6. **DECK_KEY**：`xdf-dse2023-p1-state` → `xdf-dse2023-p1-v5-state`（版本隔离惯例；旧版保存的答题记录重置，笔记不受影响）
7. **移植方式**：直接修补 index.html / js / css（该课件无 gen 脚本，index.html 即源）

### 验证（headless，4 尺寸 × 全功能）
菜单开合且各项在视口内、Notes 输入→重载→持久化、Picker 开启→滚动落点、Easy⇄Hard、Show Data 全碎+Restore、改错题（初始错词/Tap→点击揭示正确词）/1280/1024/768/375 零溢出零裁剪、零页面错误。JS `node --check` 通过。

---

# 以下为来源版本历史记录 ---

# 2023 DSE Paper 1 网页课件 v4 — Overview

## What was done

Iterated from v3 to v4 with one critical bug fix:

### Bug Fix: Drag-and-Drop Cross-Slide Collision (Q22 / page 16)

**Symptom:** On page 16 (Q22 · Character Match), dragging an option (A–E) into a drop zone would display the option text from a *different* question (Q20 · Timeline on page 14) instead of the intended option.

**Root cause:** `initDragDrop()` in `js/main.js` used `document.querySelector('.draggable[data-word="' + word + '"]')` in the drop handlers — a **global DOM lookup**. Both Q20 and Q22 use `data-word` values "A" through "E", so the selector always returned the **first match in document order** (Q20's element), regardless of which slide the user was on.

**Fix:** Replaced the data-word lookup with `document.querySelector('.draggable.dragging')` — the `.dragging` class is added in the `dragstart` handler and removed in `dragend` (which fires after `drop`), so it reliably identifies the exact element being dragged without any scope collision.

**Verification (headless Chrome):**
- V3 (before fix): dragging "A. Parents" (Q22) → placed "A. Timothy caused an explosion" (Q20) ❌
- V4 (after fix): dragging "A. Parents" (Q22) → placed "A. Parents" (Q22) ✅
- Q20's pool confirmed not affected by Q22 drags ✅

## File structure
```
2023DSE-Paper1_v4/
├── index.html    (title updated to v4)
├── css/main.css  (unchanged from v3)
└── js/main.js    (2 lines changed: drop handlers for zones + pools)
```
