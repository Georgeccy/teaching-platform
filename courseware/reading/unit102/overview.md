# 2017DSE-Paper1_v3 — 制作记录

## 2026-09-02：以 2015DSE-Paper1_v1 为参考的全功能统一迭代

来源版本：`2017DSE-Paper1_v2/`（原版保留未动；zip 备份：`_backup_20260902/2017DSE-Paper1_v2_backup_20260902.zip`）

### 统一内容（对齐 2015_v1 功能集）
1. **Topbar 重构**：📊 Show Data / 🔒 Easy / 📝 Notes / 🗑 Clear / ↺ Reset / 🎨 Theme 收进「⋯」菜单；🎲 随机点名直达导航栏
2. **📝 Notes 笔记**：右侧滑入面板、按页 localStorage 持久化（NOTE_KEY=`xdf-dse2017-p1-note_`）、300ms 防抖自动保存
3. **🧱 砖块正确率**：原有 164 砖块保留；Show Data 一键全碎/复原（含状态 cov 回放）
4. **响应式收纳**：<1300 隐 course-tag；<1024 计时器紧凑；<768 隐标题/连击+换行兜底；<430 隐缩放
5. **悬浮修复**：reveal-btn / q1-tap-btn 悬浮改亮紫底+深色文字（废除 brightness 连带提亮白字）
6. **DECK_KEY**：`xdf-dse2017-p1-v2-state` → `xdf-dse2017-p1-v3-state`（版本隔离惯例；旧版保存的答题记录重置，笔记不受影响）
7. **移植方式**：直接修补 index.html / js / css（gen_2017.py HEAD 同步修补，未来 regen 不回退）

### 验证（headless，4 尺寸 × 全功能）
菜单开合且各项在视口内、Notes 输入→重载→持久化、Picker 开启→滚动落点、Easy⇄Hard、Show Data 全碎+Restore、1280/1024/768/375 零溢出零裁剪、零页面错误。JS `node --check` 通过 + gen ast.parse 通过。

---

# 以下为来源版本历史记录 ---

# 2017 DSE Paper 1 阅读卷 网页课件 v2 — 制作记录

## 2026-08-28：顶部导航栏（Topbar）功能全面修复 — 响应式「⋯」收纳菜单

### 问题（用户报告：右上角功能大多未实现/无法使用）
逐项 headless 审计结论：**全部 11 类功能的 JS 均已实现且逻辑正常**（计时器并非被注释——注释的只是旧副本，活跃实现存在且 tick 正常）。真正的缺陷是 **topbar 布局溢出**：
- topbar 内容总宽 **1072px 固定**，而可用宽度只有 920px（1440 屏）/ 680px（1200 屏）
- `.topbar{overflow:visible}` + flex 不换行 → 右侧 6 个按钮（📊 Show Data / 🔒 Easy / 🗑 Clear / ↺ Reset / 🎨 Theme / 🎲 Picker）被推出视口外（1440 屏下 x=1426~1556 > 1440）
- 结果：视口内看不到也点不到 → 用户感知为「功能不存在/坏了」

### 修复方案：收纳式「⋯」更多菜单
1. **gen_2017.py HEAD**：6 个次要按钮包进 `<span class="tb-extra" id="tbExtra">`，前置「⋯」按钮（`#tbMoreBtn`，onclick=toggleTBMore）
2. **css/main.css**（末尾追加）：`.tb-extra{display:none}`；`.tb-extra.open` 为 fixed 下拉面板（top: calc(var(--topbar-h)+6px)、right:10px、圆角 14、阴影、毛玻璃、z-index 420、min-width 196px）；菜单内按钮全宽化；dark 模式阴影适配
3. **js/main.js**（末尾追加）：
   - `toggleTBMore(e)`：开合菜单 + 按钮高亮
   - `closeTBMore()`；document click（点外部关闭）+ Esc 关闭
   - 菜单内工具点击后**自动收起菜单**（capture 阶段监听， immune to palette 的 stopPropagation）；🎨 例外处理：先关菜单再让面板按按钮新位置定位
   - Reset 的 confirm 弹窗在菜单关闭前完成交互

### 修复后验证（headless Chrome，7 尺寸 × 全功能交互）
- **布局**：1440/1200/1024/900/768/414/375 全部 `overflow:false`、所有可见按钮在视口内、⋯ 按钮在视口内 ✅
- **菜单**：打开后 6 项齐全（Show Data/Easy/Clear/Reset/Theme/Picker）且在视口内 ✅
- **逐项交互**（1024 尺寸）：Show Data → 砖块碎+按钮变 Restore Covers+菜单自动关 ✅；Easy→🔓 Hard 切换+自动关 ✅；🎨 → 菜单关+调色板面板视口内+8 色板换色生效 ✅；🎲 → 随机点名面板开+菜单关 ✅；Reset → confirm+菜单关 ✅；Clear → 无错误 ✅
- **菜单关闭**：点外部 ✅ / Esc ✅ / 点工具后自动 ✅
- **常驻功能回归**：zoom 110%、计时器、页码编辑、暗黑模式、侧边栏 全部正常 ✅；零页面错误 ✅
- **视觉**：菜单卡片风格与全 deck 一致（fCC 风格圆角+阴影+主题变量），1024/375 截图确认

### 同类课件检查
2015DSE-Paper1_v1 topbar 仅 4 按钮（目录/笔记/主题/Easy），4 尺寸实测无溢出，无需修改。

## 2026-08-25：全卷 60 题答案与 md 逐字对齐（19 处差异已修复）

### 背景
用户要求检查课件其余题目答案，确保与 `真題/2017/2017_DSE_英语阅读卷_题目答案与正确率.md` 完全一致，否则以 md 为准修正。

### 流程
1. 用 Python 解析 md 文档，提取 60 题的权威答案（可接受答案 + 不得分答案 + 正确率）
2. 用 headless Chrome 从生成的 index.html 中提取所有 60 个 q-box 的交互组件答案（cloze data-answer / pmcq data-correct / tfng data-answer / ans-reveal strong / flip-ans）
3. 逐题对比，找出课件答案缺项/简化/与 md 不一致的差异
4. 以 md 为准修改生成器，重新生成，headless 验证

### 修复的 19 处差异（按 md 补全）
| # | 题号 | 课件（修改前） | md（修改后） |
|---|---|---|---|
| 1 | Q13(iii) | `(>) 50%` | `(> / ≥) 50%` |
| 2 | Q15(ii) | `... relatively little environmental impact` | `... relatively little environmental impact and can generate electricity` |
| 3 | Q17 | 2 个并列项 | 3 个并列项（补 `recycling may affect jobs/income/unemployment`） |
| 4 | Q22 | `move into their (prime spending years)` | `move into their / millennials' prime (spending years)` |
| 5 | Q23 | `to make a big difference` | `to help / make a (big) difference` |
| 6 | Q25 | `(as they get older, they...)` | `(as they get older, millennials / they...)` |
| 7 | Q29(i) | `get product information` | `get / access product information` |
| 8 | Q30(iv) | `app(s)` | `app(lications) // technology // data // internet // information` |
| 9 | Q30(v) | `sick / ill` | `sick // ill // unhealthy` |
| 10 | Q33(ii) | `(live in) more liberal societies` | `live in more liberal / free / tolerant societies (than their predecessors could barely have imagined)` |
| 11 | Q35(i) | `(not enough) employment opportunities / unemployment` | `(not enough) employment opportunities // unemployment // difficulty finding a job` |
| 12 | Q35(iii) | `the cost of education / expensive education (heavy student debts)` | `the cost of education // education has become (so) expensive (that many students rack up heavy debts)` |
| 13 | Q36(i) | `low(er) / small(er) / worse` | `low(er) // less(er) // small(er) // (more) difficult // harder // worse // 50%` |
| 14 | Q39 | `(mega / global) cities` | `(mega / global / better / international) cities` |
| 15 | Q51(ii) | `take part in family discussions and decisions` | `take part / participate / join / be involved in family discussions and decisions` |
| 16 | Q51(iii) | `peers / equals` | `peers // their peer // equals // friends` |
| 17 | Q52(iii) | `(the) workplace` | `workplace // career // employment // paying dues // working up the corporate ladder // working with others` |
| 18 | Q52(iv) | `expect their views to be valued / rapid advancement` | `expect their views to be valued (from the beginning) // expect advancement to be rapid` |
| 19 | Q52(v) | `(the) education` | `education // expressing one's opinions / perspective / mind // growing up // asserting one's autonomy` |
| + | Q53(i) | `(digital) natives` | `(digital) native(s) (in a society that is dominated by modern technology)` |
| + | Q56 | 缺 md 额外并列项 | 补 `// want to succeed but also be prepared for failure / provide themselves with safety nets for failure` |

### 已核对一致（无需修改）
Q1, Q2, Q3(i)(ii), Q4, Q5, Q6, Q7, Q8, Q9, Q10, Q11(i), Q12, Q14(i)(ii)(iii), Q16, Q18, Q19, Q20, Q21, Q24, Q26(i), Q27, Q28, Q29(ii), Q31, Q32, Q33(i)(iii), Q34, Q37, Q38, Q40, Q41, Q42, Q43(i)(ii), Q44, Q45, Q46, Q47, Q48, Q49（已修）, Q50, Q54, Q55, Q57, Q58, Q59, Q60。

### 验证
- 重新生成：34 slides / 164 rate-chips / 201,673 bytes
- 全部 21 处修复题用 headless Chrome 重新提取并与 md 对照，**全部一致** ✅
- 无回归：69 q-boxes / 38 cloze / 84 mcq / 11 tfng / 164 chips、双重括号 0、双重转义 0、零页面错误 ✅

## 2026-08-25：修复子题号双重括号 `((i))`

### 现象
TFNG 判断题的子题号被渲染成 `((i))`、`((ii))`、`((iii))`、`((iv))`（多一层括号），涉及 Q4 / Q28 / Q45 三组共 11 处。

### 根因
`gen_part1.py` 的 `tfng_item()` 模板用 `<strong>({sub})</strong>` 包裹题号，**假定传入的 `sub` 是不带括号的裸标签**（如 `i`）；但 3 处调用（Q4/Q28/Q45）传入的是**已含括号的** `"(i)"`、`"(ii)"` 等（沿用 Markdown 原资料的写法），于是被模板再包一层 → `((i))`。这是「模板职责与调用方契约不一致」导致的重复包裹。

### 修复
新增归一化函数 `_subtag(sub)`（`gen_part1.py`），把任何形态的子题号统一为**恰好一对括号**，彻底杜绝重复包裹，同时兼容裸标签与各种括号形态：
```python
def _subtag(sub):
    s = str(sub).strip()
    while s.startswith('('):
        s = s[1:]
    while s.endswith(')') and s:
        s = s[:-1]
    return '(' + s + ')'
```
- `tfng_item` 模板改为 `<strong>{_subtag(sub)}</strong>`
- `sub_sa`（gen_2017.py）的题号也改用 `_subtag`（防御性统一；调用方传裸 `i`，渲染结果不变）
- `gen_2017.py` 的 import 列表加入 `_subtag`

单元测试（8 例全过）：`i`→`(i)`、`(i)`→`(i)`、`((i))`→`(i)`、`(i))`→`(i)`、`(i`→`(i)`、`ii`→`(ii)`、`(iv)`→`(iv)`、` v `→`(v)`。注：首版 while 用「配对剥离」（`startswith('(') and endswith(')')`）在 `(i))` 这类括号不平衡输入上只剥一层、残留右括号——已改为**分别剥所有前导 `(` 与所有尾随 `)`**，更健壮。

### 验证
- 重新生成：34 slides / 164 rate-chips / 200,717 bytes
- `index.html` 中 `((i` 等双重括号残留：**0** ✅
- Q4 `(i)(ii)(iii)(iv)`、Q28 `(i)(ii)(iii)`、Q45 `(i)(ii)(iii)(iv)` ✅；Q48/Q59 sub_sa 渲染不变 ✅
- headless Chrome：全文档双重括号 0、零页面错误 ✅

### 可复用坑
1. 模板函数如果自带包裹逻辑（如 `({sub})`），必须明确契约：调用方传**裸标签**；若调用方传带括号的标签，模板必须归一化（`_subtag` 思路）而不是无脑再包。
2. 括号归一化要处理**不平衡括号**（`(i))`、`(i`），用「剥全部前导 `(` + 剥全部尾随 `)`」比「配对剥离」更稳。
3. 修改生成器后除重新生成外，务必做 `grep -c '((i' index.html` 与浏览器端断言（`document.body.innerHTML` 中无 `((i))` 等模式）。

## 2026-08-25：修复双重 HTML 实体转义（`'` 被错误转义为 `&#39;`）

### 根因
两道独立 bug 叠加造成 `data-answer` / `data-explain` 等 HTML 属性中出现 `&amp;#39;` 等双重转义、浏览器渲染后显示字面 `&#39;`（而非 `'`）：

1. **`gen_part1.py` 的 `esc()` 误用 `html.escape(quote=True)`**：该函数会把 `'` 转义为 `&#x27;`、把 `"` 转义为 `&quot;`、把 `& < >` 转义。然而 esc() 的全部 4 个调用点都把字符串放进**双引号包裹的属性值**（`data-answer="{esc(s)}"`、`data-explain="{esc(s)}"`、`data-pair="{esc(s)}"`）—— 在双引号属性里单引号完全合法、根本不需要转义。这是**不必要的转义**。
2. **生成器源码中手写了 HTML 实体**：Q49 的 cloze 答案（`others&#39; opinions`、`society&#39;s conventions`）以及若干 TFNG / MCQ 的 expl（含 `&#182;` ¶符号、`&quot;` 引号、`&#39;` 单引号、`&lt;em&gt;` 斜体标签）以 HTML 实体形式直接传入 esc()，被 esc() 二次转义（`&` → `&amp;`）形成 `&amp;#39;`、`&amp;#182;`、`&amp;quot;`、`&amp;lt;em&amp;gt;`。属性解码后浏览器显示字面 `&#39;`、`&#182;`、`&quot;`、`<em>`（斜体也丢失）。

### 修复
- **`gen_part1.py` esc() 重写**：只转义双引号属性值真正必须转义的 4 个字符，保留单引号原样。
  ```python
  def esc(s):
      """Escape for double-quoted HTML attribute values.
      & < > and " must be escaped; the single quote ' is legal inside
      double-quoted attributes and is kept verbatim."""
      return s.replace('&', '&amp;').replace('<', '&lt;').replace('>','').replace('"', '&quot;')
  ```
- **生成器源码全面回归原始字符**：所有 `cloze(...)`、`tfng_item(...)` 的 expl 参数、`mcq(...)` 选项的 expl 参数中，手写的 `&#182;` → `¶`、`&quot;` → `"`（Python 字符串内 `\"` 转义）、`&#39;` → `'`、`&lt;em&gt;` → `<em>`（保留以让 esc 转义为单层 `&lt;em&gt;`，属性解码后 JS innerHTML 渲染为斜体）。
- 受影响的源码位置（共 14 处）：
  - gen_part1.py: q1 mcq 选项 expl 5 处 + q4 tfng expl 3 处
  - gen_2017.py: q28 tfng expl 1 处 + q45 tfng expl 4 处（含 q45(i) 一条此前漏掉、补上）

### 验证
- 重新生成：34 slides / 164 rate-chips / 200,739 bytes；`node --check js/main.js` ✅
- `index.html` 中 `&amp;#39;` / `&amp;#182;` / `&amp;quot;` 双重转义残留：**0 处** ✅
- 单层正确转义（`&quot;`、`&lt;em&gt;`）保留：3+1 处，浏览器属性解码后显示 `"` 与 `<em>` 斜体 ✅
- headless Chrome 验证：
  - Q49 cloze 点击揭示：`"others' opinions"`、`"society's conventions"` ✅
  - Q49 表头/行标签：`Howe and Strauss' interpretation`、`Twenge's interpretation`、`Millennials' belief that they are unique…` ✅
  - Q45(i) TFNG 答错揭示解释框：`¶1 "widely credited with <em>coining</em> the term" — coin = 首创。`（¶ 符号 + 引号 + 斜体全部正确渲染）✅
  - Q28 / Q4 / Q1 的 data-explain 同样正确 ✅
  - 全部 166 个 `[data-answer|data-explain|data-pair]` 属性无任何残留实体编码 ✅
  - 零页面错误 ✅

### 可复用坑
1. **属性值转义不要用 `html.escape(quote=True)`** —— 它会把 `'` 转成 `&#x27;`，而双引号属性值中单引号合法。`quote=False` 即可；如果要转义属性值（双引号），自己加 `s.replace('"', '&quot;')`。
2. **Python 生成器源码中写 HTML 字符串时，避免对将要进 esc() 的子串手写 HTML 实体**（`&#182;`、`&quot;`、`&lt;em&gt;` 等）。一旦 esc() 转义 `&` → `&amp;` 就会双重转义。要么写原始字符（esc 处理转义），要么就别让它过 esc。
3. **QA 检查表**：生成后 `grep -c "&amp;#[0-9x]*;" index.html` 必须为 0；任何非零都意味着属性值存在双重转义。
4. 课件 `js/main.js` 用 `getAttribute('data-explain')` + `innerHTML` 渲染解释框 —— 属性解码（`&lt;` → `<`、`&quot;` → `"`）与 innerHTML 解析（`<em>` → 斜体）一并生效，可放心保留单层转义。

## 2026-08-25：v2 启动 + Q49 题干/答案严格按 md 补全

### 升级方式（folder-versioning）
- 完整复制 `2017DSE-Paper1_v1/` → `2017DSE-Paper1_v2/`，删除 `__pycache__`。v1 保留不动。
- `js/main.js` 的 `DECK_KEY` 由 `xdf-dse2017-p1-state` 改为 `xdf-dse2017-p1-v2-state`，避免与 v1 答题状态串台（沿用 folder-versioning + localStorage DECK_KEY 策略）。
- `gen_part1.py` 的 `split()` 新增可选参数 `cls=''`（不传则与原版完全一致，不影响其他 slide）。

### Q49 严格按 md 补全
md 原文（`真題/2017/2017_DSE_英语阅读卷_题目答案与正确率.md` L701–L719）：
> **49. Complete the table below by identifying how the researchers differ in their understanding of Millennials using information given in paragraphs 6-9. *(6 marks)***

| | Howe and Strauss' interpretation | Twenge's interpretation |
|---|---|---|
| Millennials' belief that they are unique… | has produced a generation which is (i) | has produced a generation which is (ii) |
| Millennials' reaction to rules is to… | (iii) | (iv) |
| The pressure on Millennials to succeed… | will lead them to (v) | will lead them to (vi) |

- **题干补全**：原 v1 题干写成 "paragraphs 6&ndash;9. Click each blank to check." 缺少 "(6 marks)"，且 "(6 marks)" 之前的题干文字未变但前后省略了 mark 数。已改为 md 原文 + (6 marks) 完整版。
- **表头/行标签/单元格前缀逐字还原**：
  - 表头 `Howe and Strauss' interpretation` / `Twenge's interpretation`（v1 简化为 "Howe &amp; Strauss" / "Twenge"）
  - 第一行单元格前缀 `has produced a generation which is (i)` / `has produced a generation which is (ii)`（v1 完全缺失）
  - 第二行 `(iii)` / `(iv)`（v1 一致）
  - 第三行 `The pressure on Millennials to succeed…` 前缀补回 + `will lead them to (v)` / `will lead them to (vi)`（v1 行标签漏了 "on Millennials"，单元格前缀缺失）
- **答案（cloze data-answer）严格按 md 6 项可接受答案 + // 并列展开**：
  - (i) community-minded // (interested in / able to) serving / contributing to the community / society (and its structures)
  - (ii) individualistic / self-oriented / narcissistic / less likely to care about others' opinions
  - (iii) (to) follow / believe / support / obey (the rules / society's conventions)
  - (iv) (less likely to care about others' opinions and to) flaunt / break / not follow / ignore / reject / oppose / challenge (the rules / society's conventions)
  - (v) believe that they will be (both financially and socially) successful // (have) confident expectations // be more confident // may (indeed) live up to their confident expectations
  - (vi) unrealistic(ally high) expectations of themselves // (high levels of) depression / anxiety / loneliness / mental illness // be depressed / anxious / lonely
  - v1 写法过于简略（如 "(ii) individualistic / self-oriented" 缺两项、"(v) believe they will be successful" 缺主语限定）—— 已全部按 md 补全。
- **✗ 不得分答案**（md 中的评分细则细节）作为方法提示补充到 method-wrap：ii) do not care // selfish // generation me；v) be both financially and socially successful // indeed live up to their confident expectations；vi) leave exuberant confidence behind (and suffer depression, anxiety and loneliness)。

### 配套布局调整（让长答案 fits 右栏）
- 6 项答案 + 单元格前缀使 Q49 表格最小内容宽度从 ~190px 升至 ~430px，超过默认 split-right 339px 宽。
- 新增 `.split-view.split-q49`（Q47–Q49 slide 专属）：左文 0.8 / 右题 1.4（默认 1.1 / 1.0），右栏由 339px 加宽至 ~453px。
- 新增 `#q49-box` 表格布局规则：`table-layout:fixed` + 三列固定 24%/38%/38%；cloze `max-width:100% + word-break:break-all + overflow-wrap:anywhere`（未揭示下划线串也能断行）；rate-cover-wrap `display:block` 独占一行，不挤占 cloze 空间。
- 结果：表格 401px 完整 fits 右栏（之前溢出 141px → 0），揭示前后 td 均无溢出，slide 无面板溢出，零页面错误。

### 验证（2026-08-25）
- 重新生成：34 slides / 164 rate-chips / 200,970 bytes；`node --check js/main.js` ✅
- md 逐字对照：6 个 cloze `data-answer` 经 `html.unescape` 后与 md 原文 100% 一致（实体 `&#39;` / `&amp;` 等浏览器渲染后即为原文字符）
- headless Chrome 验证：
  - 题干 `Complete the table below ... paragraphs 6-9. (6 marks)` ✅
  - 表头/行标签/单元格前缀全部逐字匹配 md ✅
  - 表格 fits：`wrapSW == wrapCW == 401`，`overflow: 0` ✅
  - 揭示前/后 td 均无溢出 ✅
  - `DECK_KEY = xdf-dse2017-p1-v2-state`（不与 v1 串台）✅
  - 零页面错误 ✅

## 2026-08-25（v1）：四项修正（Q58 反馈逻辑 / 表格溢出 / 子题正确率位置 / 亮黄高亮规则）

### 修正内容（题目内容与答案均未改动）
- **Q58 答对反馈逻辑修复（checkTicks 两遍式重构）**：原先全对时 5 个候选项全部点亮为绿。现改为两遍式判定 — Pass 1 仅统计（picked / needed / rightItems，不改动 DOM）先算出 `allRight`；Pass 2 按 `allRight` 条件应用样式：
  - **全对**：仅用户实际勾选的 2 项（i + iv）点亮绿（`.tick-right` + ✓），未勾选的其余 3 项保持原有状态（不加任何 class、不加 mark，直接 return）
  - **未全对**：保持原有逐项判定行为不变（✓ 正确勾选 / ✗ 错误勾选 / ✗漏选 橙虚线），未作答时仍弹「请先作答」警告且不锁定
  - 该修复仅作用于 Q58 勾选题的判定路径，其他题型（MCQ/TFNG/SA）反馈不受影响
- **表格排版加固（Q52 溢出修复 + 全界面表格硬化）**：根因是 `.tb-wrap` 原本无任何 CSS 规则，且表格内长下划线填空串（`______`）是不可断行 token，把表格 min-content 宽度撑破 `.split-right{overflow-y:auto}` 容器。修复（css/main.css 末尾新增块）：
  - `.tb-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;max-width:100%}`（兜底横向滚动）
  - `.quiz-table,.match-grid{width:100%;max-width:100%}`；td/th `overflow-wrap:anywhere;word-break:break-word`
  - 表格内 `.cloze` `min-width:48px;word-break:break-all`；表格内 rate-cover-wrap `white-space:nowrap`
  - 受益题：Q19 / Q31 / Q33 / Q49 / Q52 / Q60 全部 6 个 `.tb-wrap` 表格，全部完整落在可视区内
- **子题正确率下移至各子题旁**：多子题的大题不再在题干顶部集中显示合并正确率，改为每小问的 rate-chip 就近显示（无子题的题目保持不变）：
  - Part A（gen_part1.py）：Q8（总结卡各空后）、Q13（表格行标签单元格内）、Q15（单元格内）、Q19（人物行标签单元格内）
  - B1/B2（gen_2017.py）：Q30/Q36（各空后）、Q31/Q33/Q49/Q52（表格单元格内）、Q51（流程图各空后）、Q60（提纲各行内）
  - `sub_sa(qid_sub, sub, stem, ans_html, pct=None)` 新增 `pct` 参数 — 每小问题干行尾直接挂 rate-chip：Q48（i 26% / ii 6% / iii 47% / iv 56%）、Q59（i 57% / ii 65%）
  - Q35/Q40/Q46 顶部合并 chip 移除，小问 chip 保留在答案揭示内；Q58 保留单一 chip(57)（整题正确率，选项无单独正确率）
  - rate-chip 总数 129 → **164**
- **亮黄色唯一高亮规则（最高优先级常设规则）**：所有文本高亮场景唯一允许 `#FFE600` 亮黄 + `#111` 深色文字（含 dark 模式，保证可读性），禁止红/绿/蓝/橙/紫/灰及任何偏暗偏浅偏色黄变体，多个不同元素也不得引入其他颜色区分：
  - `.cloze.revealed`（填空揭示）、`.sigword.revealed-pos` / `.revealed-neg`（原正/负两色信号词统一为亮黄）、`.user-highlight`（含 body.dark 与 .passage-excerpt 变体）、`::selection` 全部改为 `background:#FFE600;color:#111`
  - 交互判定反馈色（`.tick-right` 绿 / `.tick-wrong` 红 / `.tick-missed` 橙虚线、MCQ/TFNG 对错色、rate-chip 分档色）**不属于文本高亮**，保持不变（Q58 修复本身即要求绿色判定反馈）

### 验证（2026-08-25）
- 重新生成：34 slides / **164 rate-chips** / 199,891 bytes；`node --check js/main.js` ✅；HTML 标签平衡 ✅
- headless Chrome（puppeteer-core + Chrome for Testing 151，`--no-sandbox`，`domcontentloaded`）功能测试全部通过：
  - Q58 全对场景：仅勾选的 opt0/opt3 变绿，opt1/opt2/opt4 完全未被触碰（`opt1_untouched:true` 等）✅
  - Q58 错答场景：逐项 ✓/✗/漏选 判定与修复前一致 ✅；空提交：警告且不锁定 ✅
  - 6 个 `.tb-wrap`（q19/q31/q33/q49/q52/q60）`tableFitsWrapper:true`，无横向滚动、无面板溢出 ✅
  - sigword pos/neg 与 user-highlight 实测 `rgb(255,230,0)` + `rgb(17,17,17)` 文字色（注意 `.cloze{transition:all .2s}` — 须等 400ms 过渡结束再读 computed style）✅
  - 34 slides、零页面错误 ✅

## 2026-08-24：Q48/Q58/Q59/Q60 呈现与交互修正

### 修正内容（题目内容与答案均未改动，仅调整呈现位置与交互方式）
- **Q48（短答 4 小问）**：新增 `sub_sa(qid_sub, sub, stem, ans_html)` helper — 各小问题干（i–iv）完整上移至题干区，紫色左边框卡片独立展示；每小问配独立 Show Answer 按钮（`q48i-ans`…`q48iv-ans`），答案解析分别独立揭示。
- **Q58（多选勾选题）**：由 SA 揭示版改为**交互式点选题** — 新交互三件套 `toggleTick(el)` / `checkTicks(gid)` / `resetTicks(gid)`（js/main.js）：
  - 全部 5 个候选项（i–v）以 `.pmcq-opt` 卡片呈现，点选切换 `.picked` 状态（紫色高亮）
  - 提交后逐项判定：正确勾选 ✓ 绿（`.tick-right`）、错误勾选 ✗ 红（`.tick-wrong`）、漏选 ✗漏选 橙虚线（`.tick-missed`）；未勾选的正确项也判 ✓
  - 判定后锁定点选（`.judged`），结果横幅写入 `#q58-result`（全部正确/部分正确/未作答警告），分数经 `recordAnswer` 一次性记录；Reset 清空全部状态可重做
  - 答案不变：☑ i（surname 姓氏）+ ☑ iv（year 出生年份），`data-accept`/answer key 未动
- **Q59（短答 2 小问）**：复用 `sub_sa` — i（Which entrepreneur…）与 ii（her view on…）题干完整上移至题干区，答案解析（Howe & Strauss / Twenge）分别独立揭示（`q59i-ans` / `q59ii-ans`）。
- **Q60（提纲匹配）**：**删除题干中全部提示性内容** — 拖放区各行删除主题括注（出生年代 1980–2000 / unique & special / belief in ability / relationships with elders / digital natives），仅保留 `（¶2–3）` 等段落定位；左侧结构面板改为「纯段落范围提纲」（I ¶1 与 VII ¶15 已给出，II–VI 节标题隐去），与真实试卷格式一致。A–F 候选标题组为题目选项保留；标题映射仅存于隐藏答案解析。

### 验证（2026-08-24）
- 重新生成：34 slides / 129 rate-chips / 38 cloze / 69 practice-mcq / 11 tfng-group，index.html 194,890 bytes ✅
- CSS tick 样式修复（`.pmcq-opt.picked/.tick-right/.tick-wrong/.tick-missed` + `body.dark` 变体）✅
- HTML 标签平衡 + 新增 id（q48i–iv-ans、q59i/ii-ans、q58-opts/result/ans）全在位 ✅
- Q60 拖放区无任何提示残留（heading 映射仅在隐藏 answer key 中）✅
- headless Chrome（puppeteer-core + Chrome for Testing 151，`--no-sandbox`）功能测试：无页面错误；Q58 三场景（全对 5✓ + All Correct 横幅、错勾 ii/漏选 iv → tick-wrong/tick-missed 逐项判定、空提交警告）；Q48/Q59 六个子揭示全部可切换 ✅

## 2026-08-17：初版生成（基于 2018DSE-Paper1_v1 模板）

### 依据
`/Users/chenchengyu/Desktop/真题&模拟题/真題/2017/2017_DSE_英语阅读卷_题目答案与正确率.md`（2017 DSE Paper 1 全 60 题答案、正确率与全卷篇章+译文）。
模板：`2018DSE-Paper1_v1`（整目录复制，删除旧生成器，改 `DECK_KEY` 为 `xdf-dse2017-p1-state` 避免与 2018 课件状态冲突）。

### 试卷结构（34 张幻灯片，全 60 题）
- **Part A（Q1–Q21，41 分）**：Text 1 The Myth of Recycling（回收神话，17 段）
  - slides：封面 / Entry Test / Q1–Q5 / Q6–Q10 / Q11–Q14 / Q15–Q18 / Q19 观点匹配（6 引语→4 人物，C/E 不用）/ Q20–Q21 / Close Reading / Exit Test / Recap
- **Part B1（Q22–Q44，43 分）**：Text 2 千禧一代信息图（6 slides）+ Text 3 数据卡 + Text 4 Do Millennials Have It Better or Worse?（9 段）
  - slides：divider / Entry Test / Q22–Q26（S1–3+T3）/ Q27–Q31（S4–6，Q31 小标题匹配 word-pool）/ Q32–Q35 / Q36–Q40 / Q41–Q44 / Close Reading / Exit Test / Recap
- **Part B2（Q45–Q60，43 分）**：Text 5 Millennials – Themes In The Literature（学术文献综述，15 段，7 节）
  - slides：divider / Entry Test / Q45–Q46 / Q47–Q49（H&S vs Twenge 对比表）/ Q50–Q52（流程图+表格）/ Q53–Q56（隐喻三连）/ Q57–Q60（Q60 提纲匹配 word-pool）/ Close Reading / Exit Test / Recap
- 收尾：全卷数据榜（最难/最易 Top-10）+ 考生表现分析 + Well Done

### 题型组件统计
- rate-chip ×129（全部覆盖像素砖块遮盖，2 次点击击碎）、cloze 填空 ×38、practice-mcq ×69、tfng-group ×11（Q4×4 / Q28×3 / Q45×4）、word-pool 拖放匹配 ×3（Q19 / Q31 / Q60，均含未用干扰项）
- 2017 特殊题型处理：Q1 六选一勾选→MC；Q14 三组 All/Some/None→3 个 MC；Q38/Q58 勾选题→SA 揭示版；Q33 观点-例子匹配→表格 cloze；Q51 流程图→竖排卡片 cloze

### Show Data 双向切换（继承 2018 版功能）
- 第 1 次点击：击碎全部砖块显示正确率，按钮变 🧱 Restore Covers；第 2 次点击：全部砖块以 rebuild 动画复原并清空持久化，按钮回 📊 Show Data；快捷键 H 同步。

### 生成方式
两段式 Python 生成器：
- `gen_part1.py`：helpers（`chip`/`mcq`/`sa`/`tfng_slide`/`cloze`/`para`/`flip_grid`/`sig`/`slide`/`split`/`P`）+ 全部篇章文本（T1×17 / T2 s1–s6 / T3 / T4×9 / T5×15）+ Part A slides 1–11
- `gen_2017.py`：`from gen_part1 import ...` → B1/B2 slides 12–34 + HEAD/TAIL 外壳（侧边栏 "</> DSE 2017"、course-tag "2017 DSE · Paper 1"）+ 输出 index.html（191,594 bytes）

### 验证
- 60 题全覆盖（69 个 q-box id，含子题）✅
- HTML 标签平衡：section 34 / div 1301 / span 818 / table 11 / button 59 / p 162 全配对 ✅
- `node --check js/main.js` ✅；DECK_KEY=`xdf-dse2017-p1-state` ✅
- headless Chrome 渲染：34 slides（1 is-active + 33）、侧边栏导航构建、无崩溃 ✅

### 已知说明
- 2017 原始 MD 无官方考生统计（无应考人数/官方得分率），「考生表现分析」页的 Part 平均正确率（A≈53% / B1≈46% / B2≈52%）按题目 facility index 计算，页面已注明「非官方得分率统计」。
- 2017 B1（46%）反而略低于 B2（52%）——已在表现分析页作为备考提示点出。
