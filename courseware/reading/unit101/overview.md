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
