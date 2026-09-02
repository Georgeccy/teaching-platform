# 家长会呈现界面（parent-meeting） · 实现说明

## 目标
为教学平台新增「家长会」功能页：教师在左侧名册点击学生姓名，右侧以「仿 PDF 报告」样式
呈现该学生的家长会材料；支持上传 `.md` 文档（拖拽 / 点击），后端解析后入库、立即出现在名册中。

## 关键交付

### 新增文件
- `parent-meeting.html` — 页面骨架（名册 + 文档区 + 上传弹窗）
- `assets/parent-meeting.css` — 视觉（pixel retro 侧栏 + PDF 风格文档卡片）
- `assets/parent-meeting.js` — 自包含 Markdown 解析器 + UI 逻辑
- `server/parent-meetings.js` — 零依赖 CRUD 存储层
- `server/data/parent-meetings/_seed_zhangchunan.md` — 从 PDF 还原的种子材料

### 修改文件
- `server/index.js` — 新增 4 个 API 路由 + 启动时植入种子
- `teacher.html` — 侧栏新增「家长会」导航

## 文档视觉（与 PDF 对齐）
| 元素 | PDF 样式 | 实现 |
| --- | --- | --- |
| 章节头（一、二、…） | 蓝色左竖条 | `.doc-h2::before` 5px 宽 #1E5BB8 |
| 子标题（阅读/写作） | 加粗无竖条 | `.doc-h3` |
| 表格 | 浅灰表头 + 细灰边框 | `.doc-table` |
| 「综合结论」行 | 加粗（PDF 是同底色加粗） | 检测全行加粗 → `.hl` 类 + 浅蓝底 |
| 提示框（试卷 meta） | 浅灰底 | `.doc-quote`（blockquote） |
| 分隔线 | 细灰横线 | `.doc-hr` |
| Emoji（📎 📊 ✅） | 原样 | Unicode 直通 |

## Markdown 解析器（零依赖）
- 块级：标题 h1-h4、GFM 表格、有序/无序列表、引用块、代码块、分隔线、段落
- 行内：`**bold**` `*italic*` `` `code` `` `[link](url)` `![img](url)`
- 扩展：表格中「每格整段加粗」自动标 `.hl`；引用块每行渲染为独立段落

## API
| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | `/api/parent-meetings` | 登录 | 列表（不含正文） |
| GET | `/api/parent-meetings/:id` | 登录 | 单条 + 完整 markdown |
| POST | `/api/parent-meetings` | 教师 | 上传 / 覆盖 |
| DELETE | `/api/parent-meetings/:id` | 教师 | 删除 |

- id 策略：`pm_<sha1(studentName|date)前12位>`（稳定，URL/文件系统安全，ASCII）
- 同名学生同日重复上传 → 覆盖（同 id）
- markdown `.md` 静态目录被 DENY 保护 → 必须经 API 读取（与 `.watch_status.json` 同思路）
- 学生角色 POST → 403「无权限（仅教师可上传）」

## 验证
- 解析器单测：7 h2 / 4 table / 4 blockquote / 2 ol / 1 hl / 0 {{ 泄漏
- 浏览器端到端（puppeteer-core）：
  1. 教师登录 → 名册显示张淳安
  2. 文档渲染 7 章节 / 4 表格 / 1 高亮行 / 4 提示框
  3. 上传新 .md → 立即出现在名册 + 自动选中
  4. 删除 → 回到只剩原条目
  5. teacher.html 导航含「家长会」
  6. API 404 / 403 守卫均正确
- 截图：`.workbuddy/screenshots/pm_0[1-4]_*.png`

## 演示路径
- 教师登录（`teacher/teacher123`）→ 侧栏「家长会」→ 默认选中「张淳安」材料
- 点击「＋ 上传家长会材料」→ 拖入 / 选 `.md` → 上传
- 学生登录（`tangzihan/student123`）也可查看材料，但上传 / 删除按钮自动隐藏
