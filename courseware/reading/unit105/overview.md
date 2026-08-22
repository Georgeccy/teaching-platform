# 2024 DSE Paper 1 网页课件 v4 — 更新记录

## 2026-08-19：题干全面增加正确率标签 + 全卷答案核对

### 依据
`/Users/chenchengyu/Desktop/真题&模拟题/真題/2024/2024-DSE英语阅读卷_答案.md`（官方评卷参考，含各小题正确率）。

### 1. 题干正确率标签（47 个 rate-chip）
- 所有 Part A（Q1–Q23）与 Part B2（Q43–Q62）题干的 `pmcq-label` 均插入正确率 chip，多小题题以 `(i) xx% / (ii) xx% …` 形式展示；Q13 父题干另加汇总 chip（子题 Q13(i)–(iii) 各自单独标注）。
- 三档配色（新增 `.rate-chip` CSS，写入 css/main.css）：
  - ✅ 绿色（≥70%）
  - ⚠️ 琥珀色（40–69%）
  - 🔥 红色（<40%）；多小题 chip 取最低小题档位。
- `text-transform:none` 抵消 pmcq-label 的大写样式，保证 % 数字与 (i)(ii) 正常显示。

### 2. 答案核对结果
全卷答案与官方答案**全部一致，无错漏**（MC：Q1i D、Q1ii B、Q6 A、Q13 B/A/B、Q52 B、Q58 C；TFNG：Q5 T/F/NG、Q18 F/NG/F；Matching：Q23 D-F-G-E-C-B(NU)、Q61 C-F-D-B-E-G(NU)；各简答题/填空题均匹配）。

### 3. 修正约 31 处错误/估算正确率（答案揭示、notes、TFNG 提示、Recap 难题榜）
重大修正举例：
- Q7：83% → 28%；Q9：~30% → 22%；Q10(ii) imposing：→ 19%
- Q12(iv) grow：69% → 5%；Q17：→ 15%；Q22：→ 32%
- Q47：~30% → 5%；Q49：~30% → 4%；Q60：→ 4%；Q62：→ 6%
- Q48 最难小题更正为 (ii) medicine（15%），原误标 (iv) ultimate（实际 45%）
- Part A Recap 难题榜更新为：Q12(iv) grow (5%) · Q17 (15%) · Q10(ii) imposing (19%) · Q9 (22%) · Q22 (32%)
- B2 Recap 最难更新为：Q49/Q60 (4%) · Q62 (6%) · Q57 (11%) · Q53 (16%) · Q55 (14–39%) · Q44 (38%)

### 验证
- HTML 标签平衡（div/section/span/table/tr/td/th/button/p/ul/li/label）✅
- 无重复 id ✅；`node --check js/main.js` ✅（无内联 script）
- rate-chip 共 47 个，全部 46 个 pmcq-label 均含 chip（Q13 父干含汇总 chip）✅
- 预览服务器：localhost:8772 ✅

---

## 2026-08-19：Q43 由选择题改为填空题

### 问题
第 Q43「Book Profile」表格题原先为点击选项式（qz-opt 三选一），与真题题型不符——Q43 应为填空题（Complete the table）。

### 修改（index.html · Q43 slide）
1. 副标题改为「先自己填，再逐空点击揭示核对」。
2. 四个 MC 选项块（qz-set q43a–q43d）替换为带题号 **(i)–(iv)** 的 `cloze` 点击填空（`revealCloze`，与 Q48/Q51 交互一致）。
   - (i) the general reader(s) / the public
   - (ii) flaws that lead to widespread misconceptions
   - (iii) techniques used to make bodacious claims (little veracious evidence)
   - (iv) readers become critical of what they read
3. 原「Show All Answers」按钮（qzRevealAll）替换为「🔑 Show 定位句 & Tips」揭示块（toggleRev, id=q43-note），保留原干扰项解析要点（veracious evidence 是缺乏的东西、audience 不是 experts 等）。
4. 各空正确率提示（61%–84%）与方法徽章（先看左列分类标签再定位）保留。

### 验证
- qzPick/qzRevealAll/qz-opt 在全文件已无引用（Q43 是唯一使用处）✅
- HTML 标签平衡、无重复 id ✅
- js/main.js 未改动 ✅

---

## 2026-07-26：Q23 拖拽自动滚动优化（Chrome 修复）【v3】

### 问题
第 8 页「Q23 · Matching」拖拽题在 Chrome 中，拖动选项靠近容器底部/顶部边缘时，滚动条不会持续自动滑动。根因：原有的 `autoScrollToVisible` 只挂在 `.drop-zone` 与 `.word-pool` 的 `dragover` 事件上，而 Chrome 的 `dragover` 仅在指针直接位于这些元素上方时触发——当指针悬停在表格单元格间隙、内边距或其他 slide 内容上时，rAF 边缘滚动循环失去坐标供给而停滞。

### 修改（js/main.js）
在文件末尾 `dragend/drop` 监听之后新增 **document 级拖拽追踪与 dragover 兜底**：

1. `__activeDragEl`：capture 阶段监听 `dragstart`，记录当前被拖拽的 `.draggable` 元素；`dragend`/`drop` 时清空。
2. document 级 `dragover`：拖拽进行中，以被拖拽元素为参照解析滚动容器（`findScrollableAncestor(__activeDragEl)`）；若元素已脱离文档或无滚动祖先，则退回使用指针下的 `e.target`，再调用既有的 `autoScrollToVisible(e, ref)`。

效果：无论指针悬停在页面何处，边缘 55px 内的自动滚动（速度 2–9 px/帧，越近边缘越快）都持续生效；顶部边缘向上滚动同样受益。zone/pool 原有 handler 与 `dragend`/`drop` 停止逻辑保持不变，互不冲突。

### 验证
- `node --check js/main.js` ✅
- HTML 标签平衡（div 1046/1046、table 8/8、tr 46/46、td 92/92、th 11/11、span 282/282、section 26/26）✅
- 无重复 id，26 slides ✅
