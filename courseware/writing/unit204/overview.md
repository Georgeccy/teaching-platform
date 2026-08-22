# 预备班 Unit 4 网页课件 v1 · 构建文档

**Deck**: `预备班_Unit4_网页课件_v1/`（index.html + css/main.css + js/main.js）
**DECK_KEY**: `xdf-yubei-u4-state`（独立于 Unit 3 的 localStorage）
**来源**: `读写Unit_4_课本教师版.md`（542 行）+ `读写Unit_4_skill_builder_教师版.md`（432 行），内容零出入照录。

## 结构（63 slides）

| # | 部分 | Slides |
|---|------|--------|
| 1–2 | 封面 + 导入 Booster | 课程封面、两大技能导入 |
| 3–6 | Skill 1 · Identifying the main idea | 讲解、A1（binge-watch/影院 2 段+主旨分析）、A2（film genres 4 段·主题句下划线）、A3（4 空完句） |
| 7–11 | Skill 2 · Paraphrasing & summarizing | 讲解、B1 anime 文章 + Heading 配对表（B/A/C）、B2 论坛帖（Kiki + AnimeFan1134 §1–4）+ Paraphrase/Summarize 答案 |
| 12–23 | Exam Part A | 导入、Text 1 Avatar §1–6、Comments ×3（Heidi/Reggie/Edward）、Text 2 Cameron §1–6、Q1–20 |
| 24–33 | Exam Part B1 | 导入、Text 3 Superhero §1–6、Text 4 WW/Conan §1–6、Q21–40 |
| 34–37 | Writing | Supporting opinions（含 Wonder Woman 例段）、Write like a pro（Rhetorical Q + Parallelism 全部例句）、Exam Writing A（forum post + tips + plan）、Part B（Q2 blog review + Q3 Jennifer Lawrence letter） |
| 38–44 | SB Reading | 导入（featured skill/formats）、文章 §1–6、§7–11、Q1–12（MC cloze、word cloze、subheading 配对 ×4、改错 ×2、flow chart） |
| 45–49 | 语法·关系从句讲解 | 导入、Defining（people 表 + 3 notes）、Defining（things + where/when/why + 不定式/分词）、Non-defining（who/whom/which 表 + whose/where/when 表 + 整句 which + 2 notes）、介词+which/whom（notes + writing focus） |
| 50–55 | 语法练习 A–D | Practice A ×12、Practice B ×10、Practice C ×7、D KOL 选项库 A–N + 文章 (1)–(14)（F/B/I/J/L/A/G/D/E/M/H/C/K/N） |
| 56–60 | 语法练习 E–G | E Typhoons ×10、F Letter to Kate ×17（两页）、G Jan & Pam Version 2（两页） |
| 61–62 | Passive voice | 讲解（用法表 6 行 + writing focus + 3 cautions）、Practice A ×5 |
| 63 | 总结 | 四象限回顾 + 下节预告 |

## 校验结果（全部通过）

- 标签平衡：div 741/741、section 63/63、table 21/21、tr 103/103、td 255/255、span 466/466、p/ul/li 平衡
- 无重复 id；`node --check js/main.js` 通过
- **MC 答案键 13/13 与教师版一致**：Q5=B Q6=D Q7=D Q9=A Q10=A Q17=B Q20=D；Q24=A Q25=D Q28=C Q32=A Q36=D Q38=A
- **80/80 内容标记全覆盖**（人名/作品名/地名/术语抽查）
- 改错表答案照录：Q2（floating/insects/✓/✓）、Q13（Wars/screenplays/directing/✓）、Q29（younger/varied/drama/✓）、Q34（gambler/wins/✓/✓）、SB Q8（gambling/✓/lost）、SB Q12（audiences/stronger）
- 配对题答案照录：Q4 E/B/A/C、Q12 3/1/X/2、Q30 A/E/C/D（1=F、6=B 例）、Q39 C/B/A/D、SB Q3 3/X/1/2、Q6 5/4/X/6、Q9 7/X/9/8、Q11 X/10/11

## 关键决策

1. **模板复用**：css/js 复制自预备班 Unit 3 v1（V10 架构），仅换 DECK_KEY；并补入起跑班 Unit 3 新增的 `table.ans-table` 组件 CSS（9 条规则），本套 21 张表格全部使用真 `<table>` 标记。
2. **A2 主题句**：教师版红字标出的 4 句主题句用 `<u><strong>` 呈现（等同课本 underline 要求）。
3. **配对/完形题**统一用 cloze 挖空（点击出答案）+ `.method-wrap` 隐藏解析（💡 Show Tips 展开）。
4. **D KOL 文章**拆两页（1–7 / 8–14），选项库独立一页；每空 data-answer 内含字母+完整短语，学生点击即见完整答案。
5. **G Jan & Pam** 教师版编号缺 (4)(6)，按原文照录并加提示 badge 说明。
6. 课本 Writing Part B 教师版仅含 Q2、Q3 两题题干，如实呈现（Q4/Q5 未给）。
7. 旧文件 `预备班_Writing_Unit4_LightsCameraAction_v3.html` 未改动。

## 2026-07-30 更新：四大模块重排（统一顺序）
按用户要求统一为 **① Reading 课本 → ② Reading Skill Builder → ③ Writing 课本 → ④ Writing Skill Builder**：

- Skill Builder · Reading（原 38–44）移至 Exam practice Part B1 之后（新 34–40）
- 课本 · Writing（原 34–37）顺位为新 41–44
- Skill Builder · Writing（语法，原 45–62）保持新 45–62
- 总 slide 数 63 不变；侧边栏/页码由 JS 运行时按 DOM 顺序重建
- 验证：标签平衡 ✅、无重复 id ✅、`node --check` ✅

## 2026-07-30 更新：改错题两步揭示转换（模板 11）
全部 6 张改错表（课本 Q2/Q13/Q29/Q34 + SB Q8/Q12）从直接展示模式转换为两步揭示：

- **Step 1**：点击「Tap to reveal」→ 错词显虚线，✓ 行同时显示
- **Step 2**：点击虚线词 → `revealCloze` 显示正确答案
- 改动仅限 HTML 标记（`q1-hidden-row` + `q1-tap-btn` + `q1-no-mistake`），CSS/JS 已内置
- 例如行 `<u>` 标签保留不动（示范用）
- 验证：标签平衡 ✅（button 36/36 新增）、无重复 id ✅、`node --check` ✅、onclick 函数均存在于 main.js ✅

## 2026-08-01 更新：布局排版优化

### 1. 补全 16 个缺失 CSS 类（css/main.css +148 行）
审计发现 HTML 中使用了 16 个 CSS 类但样式表中完全没有对应规则，导致 `card-grid-2`、`info-card`、`styled-list`、`sa-block`、`tl-item` 等关键布局元素无样式：

| 新增 CSS 类 | 用途 | 样式要点 |
|---|---|---|
| `.card-grid-2` | 双栏卡片网格 | `grid-template-columns:1fr 1fr`；768px 以下变单栏 |
| `.info-card` | 信息卡片（导入/总结/技能概览） | 左侧紫色边框 + 圆角 + hover 阴影 |
| `.ic-title` | 信息卡片标题 | 紫色加粗 |
| `.h1-en` | H1 英文副标题 | 半透明小号 |
| `.mb-key` | method-badge 标签 | 圆角小标签 |
| `.styled-list` | 语法/写作讲解列表 | 紫色圆点 + hover |
| `.sa-block` | 简答题练习块 | 卡片化 + hover 边框 |
| `.sa-q` / `.sa-line` | 简答题问题/答案行 | 加粗/常规 |
| `.tl-item` / `.tl-num` / `.tl-text` / `.tl-arrow` | 封面流程时间线 | 圆形数字 + 箭头 |
| `.para-sub` | 段落副标题（论坛帖标题） | 紫色加粗 |
| `.page-counter-top` / `.streak-count` | 顶部页码/连击数 | 小号等宽 |

### 2. method-badge 样式重构
- 旧：黄色圆角小标签，`inline-flex`，`font-size:20px`，`font-family:'Hack'`
- 新：浅紫色背景卡片，`display:flex`，`font-size:16px`，`font-family:inherit`，`line-height:1.7`
- 支持 `.mb-key` 标签 + 长文本内容的多行换行

### 3. ans-table 增强
- 新增 `:nth-child(even)` 交替行背景色
- 新增 `:hover` 行高亮效果
- 暗色模式适配

### 4. grammar-table CSS 新增
- 紫色表头 + 交替行 + hover + 暗色适配（与 U3 v2 一致）

### 5. 语法讲解全部添加中文对照
- **Slide 45** Relative clauses 导入：定义说明中英对照
- **Slide 46** Defining · people：表头双语、每行例句加中文翻译、Notes 中英对照
- **Slide 47** Defining · things + where/when/why：表头双语、例句翻译、不定式/分词讲解中文
- **Slide 48** Non-defining：说明中英对照、表头双语、所有例句翻译、Notes 中文
- **Slide 49** Prepositions + which/whom：说明中英对照、Notes 中文、Writing focus 中文
- **Slide 61** Passive voice：定义中英对照、用法表双语表头 + 全部例句翻译、Writing focus/Caution 中文

### 6. Reading skills 讲解添加中文
- **Slide 3** Skill 1 · Main idea：讲解段落中英对照、技巧步骤中文
- **Slide 8** Skill 2 · Paraphrasing：讲解段落中英对照、步骤中文

### 7. Writing 讲解添加中文
- **Slide 41** Supporting opinions：主段落中英对照、列表项中文
- **Slide 42** Write like a pro：Rhetorical question + Parallelism 全部讲解中英对照、例句中文翻译

### 校验结果（全部通过）
- 标签平衡：14 个标签全部平衡 ✅
- 无重复 id ✅
- 63 slides（不变）✅
- 19 个 onclick 函数均存在于 main.js ✅
- `node --check` ✅
- CSS 大括号 605/605 ✅
- CSS 1236 行、HTML 1646 行、JS 1308 行

## 2026-08-01 更新：六道题题干/题型/答案修正

以 `读写Unit_4_课本教师版.md` 为依据，修正 6 道题的行序、题型格式与答案对应关系：

### Q2 · Text 1 ¶3 改错（4 marks）
- **问题**：e.g. 行误用为 Sully→Cameron（应为 i）；"thoughts" 被标为 ✓（应改为 e.g. thoughts→emotions）；✓ 行多了一个
- **修正**：行序改为 i) Sully→Cameron、ii) sunken→floating、iii) birds→insects、e.g. thoughts→emotions、iv) ✓
- 摘要文本改为连续分行（与源文件一致）

### Q11 · Comment 3 句子完形（3 marks）
- **问题**：题型格式有误——仅用内联 cloze，未显示 A–D 选项
- **修正**：改为表格形式呈现题目 + 选项 A/B/C/D + 答案空格，与源文件格式一致

### Q13 · Text 2 ¶2 改错（4 marks）
- **问题**：行序错乱——e.g. 与 i) 互换、ii)/iii)/iv) 位置全错、iv) 空白标 ✓（源文件 ii) 才是 ✓）
- **修正**：行序改为 i) Australia→Canada、ii) ✓（Star Wars 段）、e.g. Trek→Wars、iii) books→screenplays、iv) editing→directing
- 摘要文本改为连续分行

### Q29 · Text 3 ¶6 改错（4 marks）
- **问题**：行序错乱——ii) 应为 ✓ 但标成了 correction、iii)/iv) 位置互换、iv) 空白标 ✓（源文件 ii) 才是 ✓）
- **修正**：行序改为 e.g. comics→films、i) older→younger、ii) ✓（westerns 段）、iii) alike→varied、iv) action→drama
- 摘要文本改为连续分行

### Q33 · Text 4 ¶2 句子完形（3 marks）
- **问题**：题型格式有误——仅用内联 cloze，未显示 A–D 选项
- **修正**：改为表格形式呈现题目 + 选项 A/B/C/D + 答案空格，与源文件格式一致

### Q34 · Text 4 ¶3 改错（4 marks）
- **问题**：行序错乱——i)/e.g. 位置正确但 ii)/iii)/iv) 错位、iv) 空白标 ✓（源文件 iv) 有文本且标 ✓）、缺少 ii) "forces them to work→fight" 行
- **修正**：行序改为 i) warrior→gambler、e.g. kind→cruel、ii) work→fight、iii) loses→wins、iv) ✓
- 摘要文本改为连续分行

### 校验结果（全部通过）
- 标签平衡：14 个标签全部平衡 ✅
- 无重复 id ✅
- 63 slides（不变）✅
- 19 个 onclick 函数均存在于 main.js ✅
- `node --check` ✅
- CSS 大括号 605/605 ✅
- Q2/Q13/Q29/Q34 共 16 个 row-id 全部唯一 ✅
