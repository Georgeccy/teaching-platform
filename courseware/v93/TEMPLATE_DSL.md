# 课件模板 DSL（Markdown 主控布局）

> 设计原则：**上传的 Markdown 文档本身就是模板**。它控制课件的「结构 / 布局 / 组件」，
> 生成器只负责把这套指令渲染成交互网页课件（沿用 Ardot 设计语言 + 现有计分/导航引擎）。
> 没有 `:::slide` 的「阅读 skill 文档」会自动识别为标准阅读课件（向下兼容）。

---

## 1. 文档头（可选 · frontmatter）

文档最前面用 `---` 包裹的 YAML 设置全局主题令牌：

```markdown
---
title: 加速班 Unit 3 · 阅读精读
accent: emerald        # emerald | blue | rose | amber
font: satoshi          # satoshi | geist | outfit
lang: zh               # zh | en
---
```

- `title`：封面与浏览器标题。
- `accent`：唯一强调色（Ardot 规则：最多 1 个、饱和度 < 80%，禁用 AI 紫）。
- `font`：无衬线字体族（Satoshi / Geist / Outfit，禁用 Inter）。
- 不写则用默认值（emerald + satoshi + zh）。

---

## 2. 幻灯片分隔：`:::slide`

每页课件用 `:::slide` 围栏包裹。属性：

```markdown
:::slide type=cover title="封面" section="开始" part="A"
# 主标题
## 副标题
:::
```

| 属性 | 说明 | 默认 |
|------|------|------|
| `type` | `cover` / `vocab` / `exam` / `close` / `synonym` / `writing` / `fulltext` / `generic`（默认） | `generic` |
| `title` | 侧边栏 + 顶栏显示的文字 | 空 |
| `section` | 侧边栏分组标签 | `""` |
| `part` | 如 `A` / `B2` 小标 | 空 |

- 未写 `:::slide` 时，按「阅读 skill 文档」标题自动切分（见 §6）。
- 多个 `:::slide` 连续书写即可，顺序即课件顺序。

---

## 3. 布局指令（在 `:::slide` 内部）

### 3.1 网格 `:::grid`
```markdown
:::grid cols=2 gap=6
左侧内容…
右侧内容…
:::
```
- `cols`：列数（1–4）。窄屏自动塌成单列。
- `gap`：间距档位（2/4/6/8，对应 8/16/24/32px）。

### 3.2 玻璃卡片 `:::card`
```markdown
:::card
任意 Markdown（标题/列表/表格）…
:::
```
液体玻璃质感（1px 内描边 + 着色阴影，无霓虹外发光）。

### 3.3 分屏 `:::split`
```markdown
:::split
:::split-left
原文段落…
:::
:::split-right
注释 / 翻译…
:::
:::
```
左侧原文、右侧批注的经典精读布局。

### 3.4 提示框 `:::callout`
```markdown
:::callout type=tip
技巧说明…
:::
```
`type`：`tip`（提示）/ `warn`（易错）/ `note`（笔记）/ `method`（方法）。

---

## 4. 交互组件指令

### 4.1 选择题 `:::mcq`
```markdown
:::mcq answer=B
题干文字…
- A. 选项一
- B. 选项二 ✅
- C. 选项三
:::
```
- `answer=` 正确项字母（A–D）。
- 选项用列表，`✅` 可标正确项（生成器以 `answer=` 为准）。
- 点击后计分引擎自动判分并更新 `.score-badge`。

### 4.2 判断题 `:::tfng`
```markdown
:::tfng answer=TRUE
题干…
- TRUE  正确
- FALSE 错误
- NOT GIVEN 未提及
:::
```
- `answer=`：`TRUE` / `FALSE` / `NOT GIVEN`。
- 三按钮点击即判分。

### 4.3 翻转卡 `:::flip`
```markdown
:::flip front="abandon" back="v. 放弃；抛弃"
例句：He abandoned his car in the snow.
:::
```
3D 翻转：正面英文，背面中文释义。可多张连续书写。

---

## 5. 行内约定

- `**[N]**`：段落序号标记（如 `**[1]** 原文第一句…`）。
- `> 中文翻译：`：翻译块引用（紧接原文后）。
- GFM 表格：直接写 `| 列1 | 列2 |` 表格，自动美化。
- 粗体 `**x**` / 斜体 `*x*` / 行内码 `` `x` `` / 链接 `[t](url)` 均支持。
- 代码块 ```` ``` ```` 渲染为等宽面板。

---

## 6. 向下兼容：阅读 skill 文档（无 `:::slide` 时）

若文档不含 `:::slide`，生成器按下列标题自动识别并生成标准阅读课件：

| 标题 | 映射 |
|------|------|
| `## 入门测` / `## 出门测` | 词汇表题（10 行表格） |
| `## 第X部分｜原文逐段精读` | 逐段精读（含 `**[N]**` 与 `> 中文翻译：`） |
| `## 第X部分｜核心词汇表` → `### 🔑 名词/动词/形容词/短语` | 词汇四类（按 `###` 子标题切分） |
| `## 第X部分｜考点解析`（`Q{N}` + ✅❌ / T/F/NG 三列表） | 选择题 / 判断题 |
| `## 同义替换积累` | 同义替换表 |
| `## 词语卡片` | 翻转卡 |
| `## 写作迁移表达` | 写作迁移 |
| `## 第X部分｜原文全文` | 全文 |

---

## 7. 设计语言（Ardot 默认值）

- 底色：中性 Zinc/Slate，**禁用纯黑 `#000`**、禁用 AI 紫。
- 强调色：单一、降饱和（emerald / electric blue / deep rose / amber）。
- 字体：Satoshi / Geist / Outfit（禁用 Inter）；数字/代码用等宽（Geist Mono / JetBrains Mono）。
- 表面：液体玻璃（1px 内描边 + 着色内阴影），卡片仅在需要层级时使用。
- 布局：CSS Grid 优先，最大宽度容器（~1400px），窄屏单列。
- 禁用：3 等分等宽卡片、霓虹外发光、过大 H1（用字重+颜色做层级）。
