# 预备班 Unit 3 网页课件 v2 — 构建总览

## 完成内容
基于 `预备班_Unit2_网页课件_v1` 模板（V10 多文件架构），将《读写Unit_3_课本教师版.md》与《读写Unit_3_skill_builder_教师版.md》**全部内容零出入**转为交互网页课件。

**成品**：`index.html`（94 张 slide）+ `css/main.css` + `js/main.js`（`DECK_KEY = 'xdf-yuban-u3-v2-state'`）。

## Slide 结构（94 页）
| 区块 | 页数 | 内容 |
|---|---|---|
| 封面/导入 | 3 | Unit 3 Winner takes all · Booster · 课程信息 |
| Reading skills | 7 | Skill 1 Scanning 讲解 + A1 日历完形 + A2 文章与 Q1–6；Skill 2 Paraphrasing 讲解 + B1 电竞 MCQ + B2 密室逃脱文章与 5 个 paraphrase 点 |
| Exam Part A | 18 | Text 1 Triathlete（§1–19 全文）+ Q1–18（MC/简答/找词/Tick/图片标签/TFNG/数字表格/摘要完形/短语/人物判断/原因/时间排序/ERQ/语气） |
| Exam Part B1 | 17 | Text 2 电竞学位访谈（§1–5）+ Text 3 读者来信（§1–7）+ Q19–38 |
| Skill builder · Reading | 9 | Text 1 Being a pro gamer（§1–10 + 3 评论）+ Q1–12（含图片MC/双选/表格/Signal Words） |
| Writing skills | 25 | v5 整合：Headlines（8 页）+ Leads（4 页）+ Speech（4 页）+ 修辞 Rule of Three/Repetition/练习（4 页）+ 常见错误+改错（3 页）+ 讲义 Section 1–5 |
| Exam Writing | 3 | Section 6 短文写作 + 总结·综合应用 + 出门测试 |
| Skill builder · Writing | 12 | Noun clauses + Reported speech + G Careers Fair Survey |
| 结尾 | 1 | End of Unit 3 回顾 |

## 关键决策
- **交互组件全部复用模板契约**：`pmcq-opt`+`checkMCAuto`（60 项）、`tfng-group`+`checkTFNG`（12 组 36 钮）、`cloze`+`revealCloze`（142 空）——无需改动 main.js 即可判定与计分。
- **答案即数据**：MC 用 `data-correct`、TFNG 用 `data-answer`/`data-explain`、简答/完形用 `data-answer`，判定逻辑与显示解耦。
- **侧边栏/调色板/进度条全自动**：nav 运行时读取 `data-title`/`data-part`，无需硬编码。
- **Hard-mode 安全降级**：本课件文章页为全文单栏（无 `.split-left`），hard-mode 检索到无 split 容器即 no-op，不会报错。

## 验证结果（全部通过 ✅）
- `node --check js/main.js` 语法 OK
- div 716/716、section 75/75、ul/span/p/h4/li 全平衡
- 无重复 id；`DECK_KEY` 正确
- 52 项内容覆盖标记 **全部命中**（两本 MD 关键文本零遗漏）
- TFNG 答案 12/12 与教师版一致；MC 正确项 13/13 与教师版一致

## 备注
- 图片标签题（Q9 自行车/游泳/跑步/皮划艇、Q28 游戏类型、SB Q5 座位/扶手/餐饮/大堂）以 emoji 占位，因学生版图片资源未提供；交互与答案不受影响。
- 若后续提供课文插图，可放入 `assets/` 并以 `<img>` 替换 emoji。

## 2026-07-30 更新：四大模块重排（统一顺序）
按用户要求，将本课件内部模块顺序统一调整为 **① Reading 课本 → ② Reading Skill Builder → ③ Writing 课本 → ④ Writing Skill Builder**：

- Skill builder · Reading（原 52–61）移至 Exam practice Part B1 之后（新 45–54）
- Writing skills + Exam Writing（原 45–51）顺位为 55–61
- Skill builder · Writing（Noun clauses / Reported speech / G Survey，原 62–74）保持新 62–74
- 总 slide 数 75 不变；侧边栏/页码由 JS 运行时按 DOM 顺序重建，无需改动
- 验证：标签平衡 ✅、无重复 id ✅、`node --check` ✅

Unit 1 v4 / Unit 2 v2 / Unit 4 v1 亦同步完成同样规则的重排。

## 2026-07-30 更新 3：v5 Writing 课件完整整合
按用户要求，将《预备班_Writing_Unit3__v5.html》除封面外的全部 28 张 slide 整合进本课件，替换原有 Writing 课本区域的 7 张 slide：

- **25 张 Writing skills**（教/学/练/讲义）：Headlines（引入→讲解→练习→讲义）、Leads（讲解→练习）、Speech（结构→练习→讲义）、修辞（Rule of Three/Repetition 讲解+练习+讲义）、写作常见错误、改错练习+讲义
- **3 张 Exam practice Writing**：短文写作讲义、总结·综合应用、出门测试（6 道综合检测）
- 总 slide 数 **74→94**（移除旧 7 张 Writing slides，新增 28 张 v5 slides）
- **备份**：`预备班_Unit3_网页课件_v1_backup_20260730/`

### CSS 移植
从 v5 的 inline `<style>` 块提取 147 条组件级规则（排除 v5 的布局/导航框架），映射 `--xdf-*` 颜色变量到 V10 的 `--fcc-*` / `--accent-rgb` 变量体系，追加至 `css/main.css`（总 1091→1402 行，大括号 551→713 全平衡）。

主要移植组件：`.phase-label` / `.flip-card` / `.ce-item` / `.handout-bar` / `.practice-box` / `.order-btn` / `.eq-card` / `.eq-answer` / `.cloze-blank` 等。

### JS 移植
v5 特有交互函数追加至 `js/main.js`：
- `toggleCE(id)` — 中译英答案切换
- `toggleRev(id)` — 通用揭示切换
- `toggleCloze(el)` — v5 式 cloze 挖空 toggle（改名避免与 V10 的 `revealCloze` 冲突，HTML 内 onclick 同步替换）
- `pickOrder(btn,group)` / `resetOrder(group)` — 排序练习（Rule of Three / Speech 结构）
- `v5OrderState` 全局状态

### 验证（全部通过 ✅）
- 标签平衡：div 1214/1214、section 95/95、table/tr/td/th/span/button 全平衡
- 无重复 id ✅
- CSS 大括号 713/713 ✅
- `node --check js/main.js` ✅
- 所有 onclick 函数均存在于 main.js ✅

## 2026-07-30 更新 4：v2 版本（本版本）
- **版本号**：v1 → v2（目录重命名、`<title>` 更新、`DECK_KEY` 改为 `xdf-yuban-u3-v2-state`）
- **删除**：全部 15 处 🇨🇳 符号；12 处"在讲义上写/纸质讲义/请翻到讲义"等指示性文字（改为"独立完成/独立作答"）
- **词伙增强**：15 道中译英练习的词汇提示从 2 对扩展到 3–6 对，格式从 `<span>` 标签改为管道分隔（更整洁）
- **SB Writing 排版优化**：`.ans-table` 行间距/交替背景色、表头深色点缀、`.sa-block` 卡片化圆角边框悬停效果、`.sa-q` 题干加粗
- CSS：725/725 大括号；验证：标签全平衡 ✅、无 🇨🇳/讲义残留 ✅、JS 语法 OK ✅
