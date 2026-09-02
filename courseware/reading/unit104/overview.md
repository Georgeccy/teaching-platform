# 2021DSE-Paper1_v7 — 制作记录

## 2026-09-02：以 2015DSE-Paper1_v1 为参考的全功能统一迭代

来源版本：`2021DSE-Paper1_v6/`（原版保留未动；zip 备份：`_backup_20260902/2021DSE-Paper1_v6_backup_20260902.zip`）

### 统一内容（对齐 2015_v1 功能集）
1. **Topbar 重构**：📊 Show Data / 🔒 Easy / 💡 Tips / 📝 Notes / 🗑 Clear / ↺ Reset / 🎨 Theme 收进「⋯」菜单；🎲 随机点名直达导航栏
2. **📝 Notes 笔记**：右侧滑入面板、按页 localStorage 持久化（NOTE_KEY=`xdf-dse2021-p1-note_`）、300ms 防抖自动保存
3. **🧱 砖块正确率**：55 个裸 rate-chip 全部包砖块（移植中曾双重包裹已修复）；Show Data 一键全碎/复原（含状态 cov 回放）
4. **响应式收纳**：<1300 隐 course-tag；<1024 计时器紧凑；<768 隐标题/连击+换行兜底；<430 隐缩放
5. **悬浮修复**：reveal-btn / q1-tap-btn 悬浮改亮紫底+深色文字（废除 brightness 连带提亮白字）
6. **DECK_KEY**：`xdf-dse2021-p1-state` → `xdf-dse2021-p1-v7-state`（版本隔离惯例；旧版保存的答题记录重置，笔记不受影响）
7. **移植方式**：直接修补 index.html / js / css（该课件无 gen 脚本，index.html 即源）

### 验证（headless，4 尺寸 × 全功能）
菜单开合且各项在视口内、Notes 输入→重载→持久化、Picker 开启→滚动落点、Easy⇄Hard、Show Data 全碎+Restore、1280/1024/768/375 零溢出零裁剪、零页面错误。JS `node --check` 通过。
