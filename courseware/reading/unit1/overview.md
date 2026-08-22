# 香港加速班 Reading Unit 1 网页课件 v8 — Overview

## What was done

将 v7 单文件 HTML（2251 行）重构为与 2023DSE-Paper1 课件一致的文件夹结构，并叠加排版优化层。内容与功能与 v7 完全一致（含 v7 的 Q3 TFNG 第 2、3 问互换）。

### 1. 结构重组（仿照 2023DSE-Paper1 课件）
```
香港加速班_Reading_Unit1_网页课件_v8/
├── index.html    (977 行 — 33 页 slides，外链 css/js)
├── css/main.css  (570+ 行 — V7 绿色主题样式系统 + v8 优化层)
├── js/main.js    (742 行 — 全部交互逻辑，内容不变)
└── overview.md
```

### 2. 排版布局优化（css/main.css 末尾新增优化层）
- **答案揭示动画** — `.ans-reveal.show` 展开时淡入下滑（0.35s），不再生硬闪现
- **分栏滚动条** — `.split-left/.split-right` 细滚动条（8px），半透明绿色，hover 加深
- **拖拽项浮起** — `.draggable:hover` 上移 1px + 投影，抓握感更强
- **拖放框反馈** — `.drop-zone:hover` 边框加深
- **表格行过渡** — `.tb-wrap` 行/单元格 hover 背景平滑过渡
- **练习卡片抬升** — `.card.accent:hover` 上移 2px
- **段落卡片反馈** — `.passage-excerpt:hover` 左边条 4px→6px

### 3. 内容继承
- v7 的 Q3 TFNG 换序（ii↔iii）完整保留
- 33 页 slides、所有交互（TFNG / MCQ / 拖拽 / 翻牌 / 高亮 / 计时器 / 计分）原样保留
- v7 单文件原封不动保留在同目录

## Validation results（无头 Chrome 实测）
- 页面加载：33 slides ✅，CSS/JS 外链生效 ✅，无 JS 报错 ✅
- p15 Q3：ii) "accepts some blame" = T、iii) "bankrupt" = NG（换序正确）✅
- TFNG 点击判分 ✅，Show Answer 展开 ✅
- 拖拽池 q20-pool + 15 个 drop-zone 就位 ✅
- v8 优化层动画（ansRevealIn）已生效 ✅
