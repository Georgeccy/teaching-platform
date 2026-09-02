# 2022DSE-Paper1_v3 — 制作记录

## 2026-09-02：以 2015DSE-Paper1_v1 为参考的全功能统一迭代

来源版本：`2022DSE-Paper1_v2/`（原版保留未动；zip 备份：`_backup_20260902/2022DSE-Paper1_v2_backup_20260902.zip`）

### 统一内容（对齐 2015_v1 功能集）
1. **Topbar 重构**：📊 Show Data / 🔒 Easy / 💡 Tips / 📝 Notes / 🗑 Clear / ↺ Reset / 🎨 Theme 收进「⋯」菜单；🎲 随机点名直达导航栏
2. **📝 Notes 笔记**：右侧滑入面板、按页 localStorage 持久化（NOTE_KEY=`xdf-dse2022-p1-note_`）、300ms 防抖自动保存
3. **🧱 砖块正确率**：48 砖块 + Q11 改错题错词解耦（cloze→q64-wrong）；Show Data 一键全碎/复原（含状态 cov 回放）
4. **响应式收纳**：<1300 隐 course-tag；<1024 计时器紧凑；<768 隐标题/连击+换行兜底；<430 隐缩放
5. **悬浮修复**：reveal-btn / q1-tap-btn 悬浮改亮紫底+深色文字（废除 brightness 连带提亮白字）
5b. **改错题解耦（Q11）**：错词从 `.cloze` 改专用 `.q64-wrong`（data-wrong/data-correct），脱离 cloze 位置索引状态回放（回放错位会把正确答案写进题干）；revealQ1Row 重绑 + Tap 自动击碎该行砖块
6. **DECK_KEY**：`xdf-dse2022-p1-state` → `xdf-dse2022-p1-v3-state`（版本隔离惯例；旧版保存的答题记录重置，笔记不受影响）
7. **移植方式**：直接修补 index.html / js / css（该课件无 gen 脚本，index.html 即源）

### 验证（headless，4 尺寸 × 全功能）
菜单开合且各项在视口内、Notes 输入→重载→持久化、Picker 开启→滚动落点、Easy⇄Hard、Show Data 全碎+Restore、改错题（初始错词/Tap→点击揭示正确词）/1280/1024/768/375 零溢出零裁剪、零页面错误。JS `node --check` 通过。

---

# 以下为来源版本历史记录 ---

# 2022 DSE Paper 1 阅读卷 · 网页课件 v2 — 构建文档

> **v2 变更（2026-08-06）**：Q1(ii) 答案由 D（over a thousand）更正为 **C（over a hundred）**——¶1 为 128 drawings 全数售出，超过一百而非超过一千；解析同步移到 C。其余内容与 v1 完全一致。

> **配色更新（2026-08-12）**：在原有 8 套主题色基础上新增 **Pink（粉色）** 主题色（dark `#db2777` / light `#f9a8d4`），设为默认主题。原 Purple 保留为第二选项。同时将 legacy 区段所有硬编码紫色 RGB 值（`rgba(90,1,167,…)` / `rgba(219,184,255,…)`）统一替换为 CSS 变量 `var(--accent-rgb)` / `var(--accent-light-rgb)`，使主题切换在 legacy 样式区段也生效。`--sidebar-active` 改为跟随 `var(--fcc-purple)` 动态变化。备份位于 `2022DSE-Paper1_v2_backup`。

## 产物
- 目录：`/Users/chenchengyu/Desktop/真题&模拟题/网页课件/2022DSE-Paper1_v2/`（由 v1 复制，v1 保留未动）
- 结构：`index.html` + `css/main.css` + `js/main.js`（css/js 复制自 2023DSE-Paper1_v2 模板）
- `DECK_KEY = 'xdf-dse2022-p1-state'`（与 2023 版隔离，互不串档）
- 范围：按用户要求**仅含 Part A（Q1–23）+ Part B2（Q43–65）**；Part B1 不含（MD 中 B1 只有答案无篇章题目）

## Slide 结构（共 50 张）
| Slides | 内容 |
|---|---|
| 1–2 | 封面、考试说明（45,029 考生 / B1 45.3% vs B2 54.7% / 等级规则） |
| 3 | Part A 篇章导入（Text 1 港漫衰落 · 结构导读） |
| 4–10 | Text 1 全文 ¶1–15（逐段 verbatim，7 张） |
| 11–25 | Part A Q1–23（Q1 三空 MC / Q2 词汇 / Q3 MC / Q4–5 / Q6–7 小传填空 / Q8 MC / Q9 / Q10 TFNG 表 / Q11 改错表 / Q12 开放题 / Q13–14 / Q15–16 / Q17 / Q18 年表填空 / Q19–21 / Q22 预测对照表 / Q23 MC） |
| 26 | Part A 官方考生表现分析 |
| 27 | Part B2 篇章导入（Text 4 AI 伦理 · 四位人物） |
| 28–33 | Text 4 全文 ¶1–12（含两个小标题，6 张） |
| 34–48 | Part B2 Q43–65（Q43 摘要填空 / Q44 隐喻 / Q45–46 / Q47 MC / Q48 指代 / Q49 / Q50 伦理担忧表 / Q51–52 / Q53 填空 / Q54–55 / Q56 利弊表 / Q57–58 / Q59 MC / Q60 Tick 表 / Q61 Furman 表 / Q62–63 / Q64 人物匹配表 / Q65 MC） |
| 49 | Part B2 官方考生表现分析 |
| 50 | 官方备考建议 4 条 + 总结 |

## 交互组件
- MC（`pmcq-opt` + `checkMCAuto`）：Q1(i–iii)、Q3、Q8、Q16、Q19、Q23、Q47、Q59、Q65 共 11 组，`data-correct` 与官方答案一致（11/11 PASS）
- 填空揭示（`cloze` + `revealCloze`）：Q4、Q7、Q14、Q18、Q22、Q43、Q45、Q49、Q50、Q53、Q54、Q56、Q58、Q61 —— 答案含全部官方可接受变体（`//` 分隔）
- 简答揭示（`reveal-btn` + `toggleRev` + `ans-reveal`）：Q2、Q5、Q6、Q9、Q12、Q13、Q15、Q17、Q20、Q21、Q44、Q46、Q48、Q51、Q52、Q55、Q57、Q62、Q63
- 逐行揭示表（`q1-hidden-row` + `revealQ1Row`）：Q10 TFNG、Q11 改错、Q64 人物匹配
- 静态答案表：Q60 Tick 表（✓/— 直标）
- 所有答案均附官方正确率；隐藏方法提示（`method-wrap`）由顶栏 💡 Show Tips 统一展开

## 校验结果
- 标签平衡：div 522/522 · section 50/50 · table 9/9 · tr 40/40 · td 103/103 · th 30/30 · span 231/231 · p 41/41 · ul 8/8 · ol 1/1 · li 32/32 · button 48/48 ✅
- 无重复 id；`node --check js/main.js` 通过
- MC 答案键 11/11 与 MD 官方答案一致
- 内容标记 30/30 全部命中（Old Master Q / toxic storm / redlining / ubiquity / Kowloon Walled City / resume-screening / human gatekeepers / educational intervention 等）
- `data-hard-group`：`pa`（Part A）、`pb2`（Part B2）；篇章页用整页 `passage-excerpt`（无 split-left），Hard 模式按钮惰性无害

## 保真说明
- 两篇篇章 ¶1–15 / ¶1–12 逐字照录，含两个 B2 小标题（What are the ethical concerns… / How much government regulation…）
- 所有题干、选项、分值、（正确率）与官方答案（含 `//` 变体与括号可选部分）与 MD 完全一致
- Q22 表格中 example 行（unappreciated）按 MD 原样标注 (example)
- Q60 按 MD 勾选 Liability from misuse + Unintended consequences
- 官方考生表现分析拆为 Part A（S26）与 Part B2（S49）两张；备考建议并入 S50 总结页；B1 相关分析未收录（与本课件范围一致）

## 2026-07-29 更新：三项交互改造

### 1. Q60（S44）多选交互
- 原为静态表格直接暴露 ✓ 答案 → 改为 data-multi="true" 多选 MC：逐项判分，选对一项提示继续、选对全部锁定、选错揭示所有应选项；官方答案转入 Show Official Answer 折叠块
- js/main.js 的 checkMCAuto 新增多选分支（data-multi）

### 2. Q64（S47）拖拽改造
- 原为逐行 Tap 揭示 → 改为完整拖拽：6 条评论 draggable 在 #q64-pool 选项池，5 个 drop-zone（A Furman/B Fuller/C Mills/D Sandel/E Not stated）
- 拖回选项池自动 sortDraggablesInPool 重排（复用模板现有函数）；q64Check/q64Reset 作用域限定本 slide

### 3. 正确率统一 rate-chip（对齐 2025DSE-Paper1_v1）
- css 移植 .rate-chip / .rate-chip.hard + 暗色覆盖（<50% 显示 ⚠️ 橙色 hard 样式）
- 47 处 chip：所有 pmcq-label 题干旁（33 处脚本 + 11 处 MC pass1 + Q10/Q22/Q64 h3 等）
- 清除散落于 data-explain / ans-reveal / cloze 行内（xx%）/[xx%] 的正确率文本；保留：方法 badge 内一句、Q64 官方答案块、S26/S49 分析页
- 校验：tags ALL OK / 50 slides / 无重复 id / node --check OK / 12 MC blocks 完整

## 2026-07-29 更新 2：Q11 改错两步揭示 + Q10 TFNG 点选

### Q11（S17）改错题 → 仿 2023 v2 两步揭示
- 去掉 <u> 下划线与 Correction 答案列（开始时无任何提示）
- Step 1：Tap to reveal → 行加 .revealed，错词变为虚线 cloze（显示原错词 gain/high/publisher/traditional）
- Step 2：再点击错词 → revealCloze 显示订正词（lose / no·zero·no cost / website / successful·popular·famous），绿色加粗
- (iv) 行 Tap 后显示 ✓ no mistake；h3 补 rate-chip ✅ 49%（改错题整体正确率）

### Q10（S16）TFNG → 点选作答
- 新增 tfngPick(btn,rowId,answer)：学生先点 T/F/NG → 锁定该行使官方答案按钮变绿，答对 picked-correct / 答错 picked-wrong + note 提示；recordAnswer 计入总分
- 新增 .tfng-btn/.picked-correct/.picked-wrong/.answer-shown/.tfng-note CSS（桌面断点，复用全局 .tfng-btn 无冲突）
- 答案：i=NG(82%) ii=T(87%) iii=F(77%)
- 校验：tags ALL OK / 50 slides / 无重复 id / JS OK / Q11 无暴露下划线
