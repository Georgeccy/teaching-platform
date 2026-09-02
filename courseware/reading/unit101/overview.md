# 2015 DSE Paper 1 题干显示缺陷修复 + 全卷排查（2026-08-31）

## 2026-08-31：Q64 改错行整行隐藏修复（题干残缺问题）

### 问题（用户报告：Q64 题干残缺，仅显示 example 部分，无法正常作答）
headless 实测确认：Q64 表格的 **(i)–(iv) 四行全部 `display:none`（行高 0）**，页面上只有 e.g. 行可见。

### 根因
2015 css 中存在模板遗留规则 **`tr.q1-hidden-row{display:none}` / `tr.q1-hidden-row.revealed{display:table-row}`**（2023 v4 的 css 无此规则）——该规则是「整行默认隐藏、Tap 后整行出现」的旧模式，与 2023 v4 的实际设计（**行始终可见**，隐藏的只是正确词 cloze 与 ✓ no-mistake，Tap 后揭示）冲突。叠加 Q64 题干使用了 2023 式缩写说明（丢失 md 原文完整指令），造成「题干残缺 + 正文被藏」的观感。

### 修复
1. **css**：末尾追加 `tr.q1-hidden-row{display:table-row}` / `span.q1-hidden-row{display:inline}` 覆盖隐藏规则（css 有重复块，追加式覆盖最稳）
2. **gen_2015.py**：Q64 题干还原为 md 完整原文——"Below is a summary of paragraph 8. In three of the lines, there is ONE mistake. If you find a mistake, underline the mistake and replace the word with one that expresses the correct idea. Write the word in the space on the right. If there is no mistake, put a tick (✓) in the space. The first has been done for you. (4 marks)"

### 验证
- (i)–(iv) 四行全部 `display:table-row`、行高正常、可见 ✅
- 题干完整（md 四要素：replace the word / space on the right / tick ✓ / first done + 4 marks）✅
- 交互链路不变：初始显示错误词（答案隐藏）→ Tap to reveal → 点击错误词显示正确词（exuberance→excellence）✅；(iii) 揭示后 ✓ 可见 ✅
- 解析（Show Explanations）默认隐藏、点击后才展示 ✅
- 全卷排查：54 个 ans-reveal 默认全部隐藏（仅点击后的 q64-all-ans 处于 show 态，符合预期）；52 个 practice-mcq 均有题干，无字段错位 ✅；零页面错误 ✅

## 2026-08-31（晚）：Q77 合并为完整独立题（两个得分点一体呈现）

### 用户反馈
Q77 应视为一个完整的独立问题：形式和结构上保持整体，不拆分成两部分；作答直接给出完整回答，同时在内容中清晰突出两个得分点（① 明确的 Yes/No 判断 ② 支持判断的理由），整体回答连贯不割裂。

### 修复
- 删除 `q77i/q77ii` 两个 sub_sa 拆分块，改为单个 `sa()` 完整题（q77-box 单题单按钮单答案区）
- 题干一句话完整呈现：「Does Laura agree with Michael Roth? Give a reason for your answer. (2 marks)」
- 答案区**连贯一体**：首行直接给出完整回答「**Yes** — (she thinks) it is easier to take apart (the structure of) an argument / ideas than it is to build one // criticise an argument than it is to make one」
- 两个得分点以绿色/紫色左边框小卡片突出：✔ 得分点 1 · 判断（1 分，Yes 直接明确，正确率 43%）/ ✔ 得分点 2 · 理由（1 分，拆解论点比构建容易，正确率仅 4%）
- ✗ 不得分提示：时间反了（build 才 takes months or years）/ structure 指论点结构非课程楼房
- 📝 答题模板：判断 + because + 理由一句话连写 —— "Yes, because it is easier to take apart an argument than to build one."
- label 砖块改为分段正确率 chip：Yes 43% / Reason 4%

### 验证（headless）
- 单题结构：singleQuestion=true、noSubBlocks=true、单一 Show Answer 按钮 ✅
- 答案区：Yes 开头连贯完整回答 + 得分点 1/2 卡片 + ✗ 提示 + 答题模板 全部在位 ✅
- 零页面错误 ✅；截图确认呈现为一张完整答题卡 ✅

## 2026-08-31：Q64 改错题 DOM 结构完全对齐 2023 v4 第 7 页

### 用户反馈
Q64 应仿照 2023DSE-Paper1_v4 第 7 页（Q6 · Proofreading）的做法。headless 行为对比发现：交互流程（Tap to reveal → 点击错误词 → 显示正确词）上一轮已一致，但 **DOM 结构仍有三处差异**：
1. 2015 的 Q64 套在 `.practice-mcq` 答题卡外壳里（pmcq-label 标题条 + 边框卡片）；2023 的 Q6 **无外壳**，card accent 说明卡 + 表格直排
2. 错误词标记：2015 用 `<del>` 删除线；2023 用 `<u>` 下划线
3. 无错行 (iii) 的 `q1-no-mistake` 缺 2023 的行内 style；表头第三列 2023 为空而 2015 写了 "Correction"

### 修复
q64 重写为 2023 Q6 逐项同构 DOM：移除 practice-mcq 外壳（q64-box）；card accent 说明卡直排；`<table>`（无 class，同 2023）；错误词 `<u>`；`(iii)` 行 `q1-no-mistake` 加行内 style；表头第三列留空；Tap to reveal + acc-badge + Show Explanations 结构不变。

### 验证（headless 结构签名对比 + 交互链路）
- 结构签名 6 项与 2023 Q6 完全一致：hasShell=false / tableClass=(none) / egUnderline=true / accentCard=true / thTexts=["#","Summary",""] / noMistakeInline=true ✅
- 交互：初始显示错误词 exuberance（答案隐藏）→ Tap → revealed → 点击 → 显示 excellence ✅；(iii) 揭示后 ✓ 可见 ✅；Show Explanations 打开 ✅
- 1024 双课件截图对比确认视觉一致 ✅；零页面错误 ✅
- 附带：Q64 移出 quiz manifest 后 practice-mcq 计数 53→52

## 2026-08-29：Q61 词池题批改核对逻辑修复

### 问题（用户报告：Q61 批改核对有误）
Q61（word-pool 8 选 3：unproductive / intelligent / cynical）拖放正确也判 0/3。

### 根因
`checkMatch` 用 **`placed.dataset.cat === z.dataset.accept`** 比对，但 Q61 的 8 个 draggable 只写了 `data-word`、**漏写 `data-cat` 属性** → `dataset.cat` 为 undefined → 永远不匹配 → 全判错。Q59 的 draggable 有 data-cat 所以正常。

### 修复
gen_2015.py：8 个 draggable 补上 `data-cat="q61-<word>"`（与 data-word 一致，与 drop-zone 的 data-accept 对应）。

### 顺带修复：QUIZ_MANIFEST 初始化顺序 bug
`refreshQuestionProgress()` 在 `QUIZ_MANIFEST` 尚未初始化时读取 `.length` → ReferenceError（首次 goTo 触发）。修复：读取处加 `typeof QUIZ_MANIFEST==="undefined"` 防御 + `scanQuizItems` 内改 `window.QUIZ_MANIFEST = []` 显式全局。

### 验证（headless）
- 正确拖放（unproductive→i / intelligent→ii / cynical→iii）→ **3/3 correct 🎉**，全部 correct-placed ✅
- 错误拖放（错位排列）→ **0/3 correct**，全部 wrong-placed ✅
- 零页面错误 ✅

## 2026-08-28（深夜）：Q64 改错题对齐 2023 v4 形式 + Topbar 全功能复刻

### ① Q64 摘要改错 → 2023 v4「Q6 · Proofreading」形式
参照 2023DSE-Paper1_v4 第 7 页（Q6 · Proofreading Table）重做：
- **card accent 说明卡**：题意说明（紫色左边框强调卡）
- **表格行**：`e.g.` 行错误词 `<del>` + 绿色正确答案直接显示（已给）；i/ii/iv 行用 `q1-hidden-row` + **cloze 显示原错误词**（data-answer=正确词）；iii 行（无错）`q1-no-mistake`（揭示前隐藏）
- **Tap to reveal**：每行「Tap to reveal」按钮 → `revealQ1Row()` 整行揭示（cloze 变虚线可点击显示正确词 / ✓ 显示 / 按钮变 Revealed ✓ disabled）
- **acc-badge 正确率徽章**：📊 45% / 50% / 58% / 58%（acc-low/acc-mid 配色，替代 rate-chip 砖块——与 2023 形式一致）
- **Show Explanations**：每行「错误词 → 正确词」逐行解释 + Proofreading 四步法 method-badge
- 答案不变（md）：exuberance→excellence / less→more·greater / iii ✓ / competitor→spectator·beholder

### ② Topbar 全功能复刻 2017 v2（原 4 按钮 → 17 项功能全覆盖）
新增常驻控件：**score-badge**（答题实时更新）· **streak-badge** · **zoom −/100%/+** · **timer**（▶/Reset + 右键 cycleDuration 1/2/3/5/10 min）· 保留 ☰目录 / 📝笔记
「⋯」收纳菜单（tb-extra，与 2017 v2 同款交互）：**📊 Show Data / 🔒 Easy / 🗑 Clear / ↺ Reset / 🎨 Theme / 🎲 Picker**
新增 DOM：Random picker overlay（randMax 默认 24 = 班级人数可改）

### 响应式收纳（2015 topbar 控件比 2017 多，溢出风险更高）
- `<1300`：隐藏 course-tag
- `<1024`：timer 隐藏 Reset、时间输入框缩窄
- `<768`：隐藏 slide-title/streak、**修复模板 bug**——原 768 断点换行规则写成 `.topbar   .topbar`（永不匹配）→ 显式 `flex-wrap:wrap; height:auto`
- `<430`：隐藏 zoom、压缩 gap/padding、目录按钮紧凑化
- 目录/笔记/⋯ 按钮 `flex-shrink:0`（防文字压缩消失）

### 验证（headless，1024 交互 + 6 尺寸布局）
- 17 个关键函数全部存在；zoom 100→110→90→100 ✅；timer ▶ 运行 tick 59 ✅；答题后 score-badge 1/1 ✅
- ⋯菜单：打开视口内 ✅；Show Data→Restore Covers+自动关 ✅；Easy→Hard+自动关 ✅；Theme→面板视口内 8 色板换色+自动关 ✅；Picker→面板开+自动关 ✅；Reset(confirm)/Clear ✅
- ☰目录 / 📝笔记（持久化）继续正常 ✅
- Q64：4 行初始未揭示 → Tap row i → revealed+Revealed ✓+cloze 显示 excellence ✅；badges 45/50/58/58 ✅；iii 揭示后 ✓ 可见 ✅；Show Explanations ✅
- 布局 6 尺寸 overflow 全 false、可见按钮零裁剪 ✅；零页面错误 ✅

## 2026-08-28（晚）：顶部导航栏四按钮全面修复

### 问题（headless 审计确认）
topbar 右侧 4 个按钮中 **3 个完全失效 + 1 个半失效**（共享的 2017 main.js 与 2015 按钮不匹配）：
| 按钮 | onclick | 状态 | 根因 |
|---|---|---|---|
| ☰ 目录 | `openTOC()` | ❌ ReferenceError | main.js 无 openTOC/closeTOC/buildTOC（2017 课件用侧边栏导航，V7 TOC 代码未随文件复制） |
| 📝 笔记 | `openNotes()` | ❌ ReferenceError | main.js 无 openNotes/closeNotes/loadNote/NOTE_KEY |
| 🎨 | `togglePalette()` | ❌ ReferenceError | main.js 只有 `togglePalettePanel(e)`（且依赖按钮 id="paletteBtn"，2015 按钮无 id） |
| 🔒 Easy | `toggleHardMode()` | ⚠️ 半失效 | 函数操作 `hardmodeBtn`，按钮 id 是 `hardBtn` → hardmode 变量切换但按钮文字永不变 |

另：CSS 里 `.toc-drawer`/`.toc-item`/`.notes-panel` 等样式**完全缺失**（css 只含 palette-panel/hardmode-btn）。

### 修复
1. **gen_2015.py**：🎨 按钮 → `id="paletteBtn"` + `onclick="togglePalettePanel(event)"`（复用 2017 已验证实现）；🔒 按钮 → `id="hardmodeBtn"` + `class="hardmode-btn"`（获得 active 红底反馈样式）
2. **js/main.js**（末尾追加）：`buildTOC`（24 项目录：页码徽章 + slide 标题 + 当前页高亮）、`openTOC/closeTOC`、`loadNote/openNotes/closeNotes`（按页 localStorage 存储，`NOTE_KEY='xdf-dse2015-p1-note_'` 专属防串台）、笔记 300ms 防抖自动保存、`togglePalette` 适配函数（转发 togglePalettePanel）、Esc 关闭全部浮层、goTo 后刷新目录高亮
3. **css/main.css**（末尾追加）：`.toc-overlay/.toc-drawer/.toc-header/.toc-item/.toc-pn` 与 `.notes-overlay/.notes-panel/.notes-header/.notes-ta` 完整样式（右侧滑入、毛玻璃、fCC 主题变量、dark 模式适配、min(320px,88vw) 移动端适配）

### 修复后验证（headless，7 尺寸 + 全功能交互）
- **布局**：1440/1200/1024/900/768/414/375 全部无溢出、无裁剪按钮 ✅
- **☰ 目录**：打开（视口内）→ 24 项 + 当前页高亮 → 点击第 5 项跳转 + 自动关闭 ✅
- **📝 笔记**：打开 → 页标签「第 5 页 · Q11–Q14 · Text 1 ¶6–7」→ 输入 → 防抖保存 → 关闭重开**内容持久化** ✅
- **🎨 主题**：面板视口内 + 8 色板 → 换色生效 + 面板关闭 ✅
- **🔒 Easy**：Easy ⇄ Hard 切换 + active 红底反馈 ✅
- **点 overlay 关闭 / Esc 关闭** ✅；NOTE_KEY 专属 ✅；零页面错误（修复前 3 个 ReferenceError 全部消除）✅
- 回归：暗黑/侧边栏/页码编辑正常 ✅；1024 目录/笔记 + 375 目录截图确认视觉统一

## 2026-08-28：初版生成（基于 2017DSE-Paper1_v2 模板）

### 依据
`/Users/chenchengyu/Desktop/真题&模拟题/真題/2015/2015_DSE_English_Paper1_完整整理.md`（2015 DSE Paper 1 全部答案+正确率、Text 1/2/5 原文、题目册、考生表现报告）。
模板：`2017DSE-Paper1_v2`（整目录复制，gen_2017.py 改名 gen_2015.py，全部 slides 重写）。

### 范围（用户要求：不涉及 Part B1）
- **Part A（Q1–Q31，31 题）**：Text 1 采访（In from the cold among warm-hearted Koreans，¶1–10，Q1–24）+ Text 2 书评（Tudor's Book Covers Implausible, Impossible Korea，¶1–4，Q25–31）
- **Part B2（Q56–Q77，22 题）**：Text 5 议论文（Young Minds in Critical Condition，¶1–13）+ 两条读者评论（Tom / Laura）
- Part B1（Q32–Q55）不涉及（课件内多处已标注「跳过 / 本课件不涉及」）

### 课件结构（24 slides）
1. 封面（Phase 时间线 4 段，B1 标注跳过）
2. Part A Entry Test（词汇 flip×10：expatriate / correspondent / byline / in the pipeline / off the radar / superficial / flashy / raucous / stoicism / cynical）
3. Q1–Q5 · Text 1 ¶1–3（Q1 SA 采访者 / Q2 SA several 9% / Q3 排序 cloze×3 / Q4 指代 they 41% / Q5 MC D 75%）
4. Q6–Q10 · ¶3–5（Q6 China / Q7 invisible hug / Q8 nonsense 25% / Q9 funerals 22% / Q10 sub_sa 差异+相似）
5. Q11–Q14 · ¶6–7（Q11 superficial 53% / Q12 3rd Line Butterfly 82% / Q13 Gangnam 11% / Q14 TFNG NG·F·T）
6. Q15–Q17 · ¶8（Q15 soaps / Q16 marry 62% / Q17 summary cloze×5 90/91/88/78/44）
7. Q18–Q21 · ¶9–10（scary mothers / materially 21% / status 74% / better friend 60%）
8. Q22–Q24 · ¶10+标题（jeong 47% / cold Britain 58% / Geek=Daniel 19%）
9. Q25–Q28 · Text 2 ¶1–3（irony 28% / Michael Breen 63% / canon 4% 全卷最难 / North Korea 7%）
10. Q29–Q31 · Text 2 ¶4（new territory 31% / Q30 sub_sa 矛盾 2 小问 / Q31 sub_sa 成就 2 小问）
11. Part A Close Reading（信号词 11 段，含 in the pipeline / off the radar / canon / tunnel-like view）
12. Part B2 divider
13. Part B2 Entry Test（weary / undermine / depraved / debunker / fetishize / absorption / receptive capacities…）
14. Q56–Q59 · ¶1–2（Q56 MC D 52% / Q57 sub_sa Rousseau 拆台 12%+triumphant 33% / Q58 contradictions 39% / Q59 word-pool 匹配 Roth→C·Emerson→B·A 未用）
15. Q60–Q63 · ¶3–7（Q60 It=being critical 73% / Q61 word-pool 8 选 3 unproductive·intelligent·cynical / Q62 TFNG F·T·NG / Q63 MC C 63%）
16. Q64–Q67 · ¶8–9（Q64 摘要改错表格 excellence·more/greater·✓·spectator/beholder / Q65 MC A 54% / Q66 sub_sa fetishizing+receptive / Q67 explosions·sex·gag lines 45%）
17. Q68–Q72 · ¶10–12（Q68 sub_sa multitask+forget / Q69 MC C NOT-mentioned 45% / Q70 blindness 32% / Q71 sub_sa risk+hard-nosed / Q72 crave 52%）
18. Q73–Q77 · ¶13+Comments（Q73 tick 2/4 i·iii 78% / Q74 sub_sa critical 双关 32%+10% / Q75 MC A 44% / Q76 Tom 立场 4 要点 62% / Q77 sub_sa Yes+理由 43%+4%）
19. Part B2 Close Reading（信号词 11 段）
20. Part B2 Exit Test（短语 flip×10）
21. Part B2 Recap（双关 critical 题眼 + 难点提醒 + B2 均分 45.8%）
22. 全卷数据榜（最难 10：Q27 4% / Q77ii 4% / Q2 9% / Q74ii 10% / Q13 11% / Q57i 12% / Q9 22% / Q31ii 22% / Q71i 25% / Q8 25%；最易 10）
23. 考生表现分析（官方 Table 1：A 49.42% / B1 50.85% / B2 45.80% + 5 条备考建议）
24. Well Done（confetti + Easy/Hard Mode 提示）

### 组件统计
24 slides · 92 rate-chips（像素砖块遮盖 2 次击碎）· 12 cloze · 53 practice-mcq（含 sub_sa）· 6 tfng-group · 2 word-pool 拖放匹配（Q59 3 选 2 / Q61 8 选 3）· 1 tick 多选（Q73，复用 toggleTick/checkTicks/resetTicks）· 信号词 Close Reading ×2 · 词汇/短语 flip ×4

### 答案忠实度
全部答案逐字取自 md 参考答案（含 // 并列可接受答案与 ✗ 不得分提示）。吸取 2017 v2 的教训：进入 esc() 的子串一律写原始字符（¶、"、'、<em>），无双重点实体转义；子题号统一走 _subtag() 归一化，无双重括号。

### 生成方式
两段式 Python 生成器：
- `gen_part1.py`：helpers（chip/mcq/sa/sub_sa/_subtag/tfng_slide/cloze/para/flip/sig/slide/split/P）+ 篇章（T1×10 / T2×4 / T5×13 / COMMENTS）+ Part A slides 1–11
- `gen_2015.py`：`from gen_part1 import ...` → Part B2 slides 12–24 + HEAD/TAIL 外壳（侧边栏 "</> DSE 2015"、course-tag "2015 DSE · Paper 1"）+ 输出 index.html

### 验证
- 24 slides / 92 chips / 128,713 bytes；`node --check js/main.js` ✅
- HTML 标签平衡：section 24 / div 916 / span 516 / table 5 / button 67 / p 168 全配对 ✅
- 无 2017 残留引用 ✅；DECK_KEY = `xdf-dse2015-p1-state`（与 2017 课件状态隔离）✅
- 双重括号 0、双重实体转义 0（生成首版曾在 tfng expl / cloze 里手写 `&#182;`/`&quot;`/`&#39;`/`&#10003;` 共 11 处，已按 2017 v2 的修复原则全部回归原始字符）✅
- headless Chrome：侧边栏 logo / course-tag / DECK_KEY 正确；Q5 MC D 判定、Q14 TFNG 3 组、Q17 cloze 5 空揭示、Q59/Q61 word-pool drop-zone、Q73 tick（i+iii 判定、其余不动）、Q10 sub_sa 全部功能正常；零页面错误 ✅

### 已知说明
- 正确率为 md 标注的「得分考生百分比」（官方考生表现报告），非全卷平均。
- Part A 官方 Mean Score 49.42%（Table 1），Part B2 45.80%，已在「考生表现分析」slide 引用。
