# 2018DSE-Paper1_v2 — 制作记录

## 2026-09-02：以 2015DSE-Paper1_v1 为参考的全功能统一迭代

来源版本：`2018DSE-Paper1_v1/`（原版保留未动；zip 备份：`_backup_20260902/2018DSE-Paper1_v1_backup_20260902.zip`）

### 统一内容（对齐 2015_v1 功能集）
1. **Topbar 重构**：📊 Show Data / 🔒 Easy / 📝 Notes / 🗑 Clear / ↺ Reset / 🎨 Theme 收进「⋯」菜单；🎲 随机点名直达导航栏
2. **📝 Notes 笔记**：右侧滑入面板、按页 localStorage 持久化（NOTE_KEY=`xdf-dse2018-p1-note_`）、300ms 防抖自动保存
3. **🧱 砖块正确率**：裸 rate-chip 已有砖块 128；Show Data 一键全碎/复原（含状态 cov 回放）
4. **响应式收纳**：<1300 隐 course-tag；<1024 计时器紧凑；<768 隐标题/连击+换行兜底；<430 隐缩放
5. **悬浮修复**：reveal-btn / q1-tap-btn 悬浮改亮紫底+深色文字（废除 brightness 连带提亮白字）
6. **DECK_KEY**：`xdf-dse2018-p1-state` → `xdf-dse2018-p1-v2-state`（版本隔离惯例；旧版保存的答题记录重置，笔记不受影响）
7. **移植方式**：直接修补 index.html / js / css（gen_2018.py HEAD 同步修补，未来 regen 不回退）

### 验证（headless，4 尺寸 × 全功能）
菜单开合且各项在视口内、Notes 输入→重载→持久化、Picker 开启→滚动落点、Easy⇄Hard、Show Data 全碎+Restore、1280/1024/768/375 零溢出零裁剪、零页面错误。JS `node --check` 通过 + gen ast.parse 通过。

---

# 以下为来源版本历史记录 ---

# 2018 DSE Paper 1 阅读卷 网页课件 v1 — 制作记录

## 2026-08-21：初版生成（基于 2024DSE-Paper1_v4 模板）

### 依据
`/Users/chenchengyu/Downloads/HKDSE_2018_English_Paper1_Reading_QA (1).md`（2018 DSE Paper 1 官方评卷参考，含 71 题答案、正确率与全卷篇章）。
模板：`2024DSE-Paper1_v4`（整目录复制，改 `DECK_KEY` 为 `xdf-dse2018-p1-state`）。

### 试卷结构（36 张幻灯片）
- **Part A（Q1–Q22）**：Text 1 音乐课程分类广告 + Text 2 音乐与专注力（含读者评论）
- **Part B1（Q23–Q45）**：Text 3 蜂蜇急救指南 + Text 4 香港城市养蜂人
- **Part B2（Q46–Q71）**：Text 5 人工授粉 + Text 6 Sweetness and Light
- 每部分含 divider / Entry Test（翻转卡）/ 题目页 / Close Reading（sigwords）/ Exit Test / Recap（难题榜）
- 全卷数据榜（Top-10 / Bottom-10 正确率表）+ 考生表现分析（54,382 名考生；Part A 54.3% / B1 47.9% / B2 52.5%）+ Well Done 收尾页

### 题型组件统计
- rate-chip ×128（全部覆盖砖块遮盖）、cloze 填空 ×40、practice-mcq ×81、tfng-group ×10、Q71 匹配题（word-pool 拖放 ×6）

### 新功能 1：正确率像素砖块遮盖（本版核心特性）
- 所有正确率 chip（`rate-cover-wrap`）初始被像素砖块遮盖（`.rate-cover`，砖纹用 repeating-linear-gradient 绘制）。
- **第 1 次点击**：砖块出现裂缝（`.cracked`：两道斜裂纹 + 抖动动画）。
- **第 2 次点击**：砖块碎裂消失（`.shattered` 缩放淡出 + 12 个像素碎片颗粒飞溅 `spawnFragments`），露出下方正确率。
- 遮盖状态持久化：`deckState.cov`（"slideIdx:coverIdx" → 1），刷新不还原。
- 暗色模式砖块配色已适配（`body.dark .rate-cover`）。

### 新功能 2：Show Data 按钮
- 原 "Show Tips" 按钮重命名为 **📊 Show Data**（`showAllData()`），点击一次性击碎全部遮盖，显示所有题目正确率；快捷键 H 同步改为该功能。
- 已全部揭示时点击提示 "All data already revealed"；揭示后按钮变为 "📊 Data Shown ✓"。
- 旧 `toggleHints()` 函数保留但不再被按钮/H 键引用。

### 生成方式
两段式 Python 生成器（避免单文件写入超限）：
- `gen_part1.py`：helpers（`chip`/`mcq`/`sa`/`tfng_slide`/`cloze`/`flip_grid`/`sig`/`slide`/`split`）+ 全部篇章文本 + Part A slides 1–11
- `gen_2018.py`：B1/B2 slides 12–36 + HTML 外壳（侧边栏/顶栏/Show Data 按钮）+ 输出 index.html

### 验证
- HTML 标签平衡（div 1333/span 849/section 36/button 59/table 8/tr 53/td 142/th 24 全配对）✅
- `node --check js/main.js` ✅；`hitCover` 绑定 128 处与遮盖数一致 ✅；无 "Show Tips"/`toggleHints` 残留 ✅

### 已知说明
- 2018 原始 MD 只给填空题答案、无 summary 原文，summary 句（Q6/Q17/Q26/Q27/Q36/Q53/Q60/Q70）为按篇章内容合理改写重构。

## 2026-08-22：题干修复（Q6/Q17/Q36/Q53）

### 依据
`/Users/chenchengyu/Desktop/加速班【港】/网页课件/Unit 8 写作/HKDSE_2018_English_Paper1_Reading_QA .md`（更新版官方评卷参考）。

### 修复内容
1. **Q17 时间线填空（6 marks）**：原表格只有片段文字（"technological [limitations]"、"somewhat [simplistic] music"等），改为 MD 原始完整句（"At the start, technological (i) ____ resulted in the use of somewhat (ii) ____ music."等三阶段六空全文），学生可见完整语境。
2. **Q53 摘要填空（5 marks）**：原 HTML 使用改写摘要，把答案嵌入题干（如 "despite the absence of bees" 直接暴露 (ii)=disappearing/absent；"Human pollinators are better" 暴露句意）。替换为 MD 原始考试文本（"a hike in crop yields"、"the (ii) ____ bees"、"superfluous"、"fussy workers"），不再泄露答案。
3. **Q6 摘要填空（7 marks）**：原 HTML 使用改写流水文本，替换为 MD 原始结构化格式——含标题 "Paying Attention"、Conscious System / Unconscious System 分节，学生可对照原文结构定位。
4. **Q36 摘要填空（4 marks）**：补充缺失的首句 "Michael Leung has more than one job." 及空 (i) 后的 "in addition to being a product designer"，与 MD 原文一致；题干说明也改为 "with a word or phrase found in paragraph 2"；method-wrap 同步更新。

### 核对结果
- Q26（表格填空）、Q27（流程图）、Q60（摘要）、Q70（摘要）：原文与 MD 一致，无暴露答案问题，无需修改。
- 全卷 71 题答案与正确率与更新后 MD 全部一致。

### 验证
- HTML 标签平衡（div 1333/span 849/section 36/button 59/table 8/tr 50/td 136/th 24/p 148 全配对）✅
- `node --check js/main.js` ✅；128 处 hitCover 绑定与遮盖数一致 ✅
- Q17 完整句验证 ✅；Q53 原文 "superfluous" 存在且无答案泄露 ✅；Q6 "Paying Attention" 标题 ✅；Q36 完整句 ✅

## 2026-08-22（晚）：Show Data 按钮改为双向切换（toggle）

### 行为变更
- **第 1 次点击**（有未碎砖块时）：一次性击碎全部剩余遮盖，显示所有正确率；按钮变为 **🧱 Restore Covers**。
- **第 2 次点击**（全部已碎时）：恢复所有砖块至初始完整状态——移除全部 `.shattered`/`.cracked` 类，砖块以 `coverRebuild` 缩放动画重建；同时清空 `deckState.cov` 持久化记录（刷新后砖块保持完整）；按钮回到 **📊 Show Data**。
- 可无限次来回切换；快捷键 H 同步生效（同一切换逻辑）。
- 按钮提示文字更新为 "Toggle: shatter ALL brick covers to reveal rates / restore all covers (H)"（index.html 与 gen_2018.py 已同步）。

### 改动文件
- `js/main.js`：`showAllData()` 重写为双向 toggle（揭示分支 / 恢复分支）。
- `css/main.css`：新增 `.rate-cover.rebuild` + `@keyframes coverRebuild` 砖块重建动画。
- `index.html` / `gen_2018.py`：按钮 title 更新。

### 验证（headless Chrome 端到端测试）
- 128 个遮盖：第 1 次点击后 shattered=128/standing=0 ✅；第 2 次点击后 standing=128/shattered=0/cracked=0、按钮回到 "📊 Show Data"、`cov` 持久化清空 ✅；第 3 次点击再次全部击碎 ✅（VERDICT:PASS）。
- `node --check js/main.js` ✅。
