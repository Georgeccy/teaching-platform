# 开发环境迁移方案：MacBook Air → Mac mini

> 前提：两台均为 Apple Silicon、同一局域网。Air = 当前唯一开发机；mini = 目标机（先做开发环境，后做生产服务器，见 `DEPLOY-MACMINI.md`）。
> **总原则：迁移期间 Air 侧只读不写**——所有命令都是从 Air「往外复制」，不移动、不删除，随时可中断重跑。
>
> 你模板里的 `[请填写工具名称]` 未填写，本文按本项目实际工具链覆盖：**Node / git / Caddy / Python / 编辑器 / WorkBuddy**。若另有特定工具，套用第 1.3 节的版本对齐方法即可。

---

## 0. 迁移前必做：把工作收进 git（⚠️ 最大丢失风险点）

当前 Air 上有 **93 项未提交变更**——近几天的安全加固、课堂规则、字体自托管全在其中。**只靠 git 迁移会全部漏掉。**

```bash
cd ~/Developer/zhixue-platform
git status --short                 # 再确认一遍清单
git add -A
git commit -m "chore: 迁移前快照（安全加固 + 字体自托管 + 部署物料）"
git push origin main
```

- ✅ 这一步只影响 Air 的 git 记录，无风险、可撤销（`git reset --soft HEAD^`）。
- ⚠️ push 后 GitHub 就有了完整代码。仓库目前是私有的——**确认它是 Private**（GitHub → Settings → General → Danger Zone 可见），否则学生隐私相关的部署文档也一并公开了。
- 迁移期间在 Air 上执行：**停掉本机 dev server**（关掉 `启动.command` 的终端，或 `lsof -ti:3000 | xargs kill`）。两台机器同时跑 Live-Reload 没有意义且容易混乱。

---

## 1. 问题一：mini 上没装工具，有影响吗？

### 1.1 影响评估（按"什么时候必须装"排序）

| 工具 | 不装的影响 | 何时必须装 |
|---|---|---|
| **Node ≥18** | 平台完全跑不起来（后端 + 静态服务全靠它） | **立即** |
| **git** | 拉不到代码、历史断裂 | **立即** |
| **Caddy** | 上线（对外 HTTPS）做不了，但**不影响先迁移和本地跑通** | 上线前 |
| **Homebrew** | 上面的东西都难装 | **立即**（装其它工具的前置） |
| 编辑器（VS Code/Cursor 等） | 只影响你写代码的舒适度 | 随时 |
| WorkBuddy | 只影响 AI 辅助开发体验 | 随时 |
| Python 3.13 | 平台运行**不需要**（仅课件同步脚本用） | 做课件同步时 |

**结论：只有 Node、git、Homebrew 是"现在就装"，其余都可以等用到再装。**

### 1.2 安装（mini 上执行）

```bash
# Homebrew（Apple Silicon 装到 /opt/homebrew）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew install node@22 git
brew link node@22        # node@22 是 keg-only，需要 link 进 PATH
node -v                  # 应显示 v22.x
```

Caddy（上线那天再装也行）：

```bash
brew install caddy
```

### 1.3 版本与 Air 保持一致（通用方法）

版本对齐只对**运行时**（Node）有意义；git / Caddy 用新版本没有任何问题。

```bash
# Air 上查基准
node -v        # 本机当前：v22.22.2（WorkBuddy 托管安装）
git --version  # 2.51.2

# mini 上对齐
node -v        # 需要 v22.x（大版本一致即可）
```

**版本策略（二选一）：**

| 方案 | 做法 | 取舍 |
|---|---|---|
| **A. Brew 固定大版本（推荐给服务器）** | `brew install node@22`，路径稳定 `/opt/homebrew/opt/node@22/bin/node` | launchd plist 里写死这个路径最稳；小版本随 brew 升级，大版本锁死 |
| B. WorkBuddy 托管（推荐给开发） | mini 上装 WorkBuddy，它会自动提供与 Air 相同的托管 Node（当前 22.22.2），路径在 `~/.workbuddy/binaries/` | 版本逐字节一致；但路径随版本号变化，不适合写进 launchd |

> 本项目是**零 npm 依赖**：没有 `node_modules` 要装、没有 lockfile 要对齐，Node 本体一致即可运行。这是这套架构迁移特别省心的地方。

---

## 2. 问题二：迁什么、怎么迁（四层清单）

以下命令都在 **Air 上执行**，`MINI` 是 mini 的地址（先在 mini：系统设置 → 通用 → 共享 → 打开「远程登录」，然后 `MINI_USER@mini.local` 或局域网 IP）。

```bash
# Air 顶部统一变量（后面所有命令引用）
MINI="chenchengyu@mini.local"     # ← 改成 mini 的实际用户名和地址
```

### 第 1 层：代码 + Git 历史（走 git，最完整）

```bash
git push origin main            # 第 0 步已做；再 push 一次确认
```

mini 上：

```bash
git clone git@github.com:Georgeccy/teaching-platform.git ~/Developer/zhixue-platform
cd ~/Developer/zhixue-platform && git log --oneline | head -5   # 历史完整可见
```

- ⚠️ mini 要能 SSH 到 GitHub：把 Air 的私钥**复制**过去（见第 3 层），或在 GitHub 加一把 mini 自己的新 key（更规范，推荐——密钥各管各的，泄露面小）。
- ⚠️ git clone **不包含**被 .gitignore 排除的 `server/data/`（真实学生数据）——所以必须有第 2 层。

### 第 2 层：运行数据 `server/data/`（⚠️ 全项目唯一不在 git 里的关键数据）

含：`db.json`（全部账号 + 学习进度）、`parent-meetings/`（15 份家长会材料，**学生隐私**）、班级归档、课堂规则、邀请码。**丢了不可再生。**

```bash
rsync -avz --stats ~/Developer/zhixue-platform/server/data/ \
      "$MINI:~/Developer/zhixue-platform/server/data/"
```

- ✅ 走 SSH 加密；`-a` 保留权限与时间戳。
- 🚨 **PII 警示**：这里头是学生隐私。**禁止**经第三方云盘中转、禁止发微信/网盘。局域网 rsync 是安全的。
- ⚠️ 这一步是 mini 侧**覆盖写**：如果 mini 的 `server/data` 已有内容会被同名覆盖。全新 mini 无此问题；若 mini 上已经跑过并产生数据，先在 mini 上备份：`cp -r server/data server/data.bak-$(date +%F)`。
- 迁移后 mini 上跑一次恢复演练（`deploy/backup.sh` 的能力复用）：
  `cd ~/Developer/zhixue-platform && sudo bash deploy/backup.sh /tmp/mig-test --verify`

### 第 3 层：密钥与凭据

| 凭据 | 位置 | 迁移动作 | 风险标注 |
|---|---|---|---|
| GitHub SSH 私钥 | `~/.ssh/id_ed25519*`（含 `.pub`） | `rsync -avz ~/.ssh/ "$MINI:.ssh/"` 后在 mini 上 `chmod 600 ~/.ssh/id_*`；`ssh -T git@github.com` 验证 | 🚨 私钥复制 = 同一把钥匙两台机器用。更规范做法：mini 生成**新 key** 加到 GitHub，Air 的不动。二选一，都安全 |
| Cloudflare API Token | 手填进 `deploy/com.zhixue.ddns.plist` | 不走文件传输——手动填入（它在 plist TODO 里） | 泄露即可改 DNS；Token 权限已限定 Edit zone DNS，泄露面小，仍别外传 |
| 项目 `.env` | 不存在 | 无需迁移 | — |
| 平台账号密码 | `server/data/db.json`（scrypt 哈希） | 随第 2 层走 | 演示密码公开，mini 上线前必须 `set-password.js` 改掉 |

### 第 4 层：环境与工具配置（按需，非必需）

```bash
# git 身份（mini 上执行）
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"

# shell 配置（zsh 别名/函数等）
rsync -avz ~/.zshrc "$MINI:.zshrc"

# WorkBuddy（可选）：7.2GB 不要整拷！只挑小件
rsync -avz ~/.workbuddy/skills "$MINI:.workbuddy/skills"       # 技能
rsync -avz ~/.workbuddy/memory "$MINI:.workbuddy/memory"       # 项目记忆
rsync -avz ~/.workbuddy/mcp.json "$MINI:.workbuddy/mcp.json"   # 连接器配置
```

- ⚠️ `~/.workbuddy` 整目录 7.2GB（binaries/blobs/app 占绝大部分），**整拷纯浪费**；且 `binaries` 由 WorkBuddy 自管，拷了也会被覆盖。
- 编辑器：VS Code / Cursor 用自带的 **Settings Sync** 登录同账号即可（扩展列表也能同步）；不依赖它就跳过。
- 不迁：`启动.command`（gitignored 且写死 Air 的绝对路径）、`.watch_status.json`（运行时产物）。mini 上用 `deploy/setup-macmini.sh` + launchd，不走 `启动.command` 那套。

---

## 3. 问题三：传输方式怎么选

| 方式 | 优点 | 缺点 | 适用 |
|---|---|---|---|
| **git（代码 + 历史）** | 完整、可校验、以后同步靠它 | 不含 gitignore 的数据 | ✅ 代码必走 |
| **局域网 rsync over SSH** | 快（同网千兆/两 Gbps）、加密、可断点续传、可反复重跑 | 要开「远程登录」、要会一点命令行 | ✅ 数据 + 密钥必走 |
| **外置硬盘** | 不依赖网络、物理隔离最安全 | 慢、易忘拔、PCAPAP 格式兼容性坑 | ⭕ 兜底：迁移前对 **Air 整机 Time Machine** 备份一次 |
| **云盘（iCloud/百度网盘）** | 方便 | 隐私数据出域、同步慢、版本混乱 | ❌ 只放非敏感物（如编辑器配置），**密钥与学生数据禁止** |
| **手动 U 盘拖拽** | 直观 | 丢权限/丢隐藏文件、易漏 | ❌ 不推荐，rsync 全覆盖它 |

**推荐组合：git（代码） + rsync over LAN（数据/密钥） + Time Machine 兜底。**

---

## 4. 问题四：迁移后如何验证

按顺序在 **mini** 上执行，每步都是"过了才走下一步"：

```bash
# ① 工具版本
node -v && git --version                    # node v22.x 与 Air 同大版本

# ② 代码与历史完整
cd ~/Developer/zhixue-platform
git fsck --no-dangling                      # 无 error
git log --oneline | head -3                 # 与 Air 的最新提交一致
git status --short | wc -l                  # 应为 0（工作区干净）

# ③ 数据完整（关键！核对三处数字与 Air 一致）
/usr/bin/python3 - <<'PY'
import json
db = json.load(open('server/data/db.json'))
print('账号', len(db['users']), '/ 进度', len(db['progress']))
print('家长会材料', len(json.load(open('server/data/parent-meetings/index.json'))['items']))
print('班级', len(json.load(open('server/data/class-folders.json'))['classes']))
PY
# 期望：账号 8 / 进度 7 / 家长会材料 15 / 班级 1（与 Air 相同）

# ④ 项目可运行（先起开发模式看能不能活）
node server/index.js &
sleep 2 && curl -s http://127.0.0.1:3000/api/health   # {"ok":true,...}
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/index.html  # 200
# 浏览器开 http://127.0.0.1:3000/index.html：
#   看侧栏 logo「PLATFORM」像素字体是否正常（验证 assets/fonts 迁移完整）
#   用 teacher/teacher123 登录，家长会材料、邀请码面板可见

# ⑤ 杀掉临时进程，交给 launchd 常驻（按 DEPLOY-MACMINI.md）
kill %1
sudo bash deploy/setup-macmini.sh
```

有偏差时的对照表：

| 症状 | 大概率原因 |
|---|---|
| 页面能开但字体是普通黑体 | `assets/fonts/` 没迁（它是新文件，务必确认第 0 步 commit 包含它） |
| 500 / 数据为空 | `server/data/` 没迁或路径不对 |
| `ssh -T git@github.com` 失败 | SSH key 没迁/权限不对（mini 上 `chmod 600 ~/.ssh/id_*`） |
| 健康检查 `"dataWritable":false` | 目录权限（谁跑服务谁要有 `server/data` 写权限） |

---

## 5. 问题五：两台机器长期怎么同步（避免打架）

**核心决策：mini = 生产服务器，Air = 开发机。`server/data` 全世界只有 mini 一份是真的。**

```
代码流（单向）：Air 开发 → git push → GitHub → mini git pull → 重启服务
数据流（不流动）：server/data 只在 mini 上写；Air 想要真实数据用于调试 → 只拉只读副本，绝不改回传
```

mini 上拉取代码的三连（可以做成别名）：

```bash
cd ~/Developer/zhixue-platform && git pull && sudo launchctl kickstart -k system/com.zhixue.platform
```

**纪律三条（比工具更重要）：**

1. **不同时在两台机器上改同一个文件**。养成"Ai r只写代码、mini 只跑服务"的肌肉记忆后，冲突几乎不会发生。
2. **Air 每天下班前 `git push`**，mini 不做任何本地修改（mini 上的改动只允许出现在 `server/data/` 与 plist 密钥）。若在 mini 上误改了代码，`git status` 一旦变脏立即处理，不要带着脏工作区 pull。
3. **数据回传只有一条合法路径**：mini 上 `deploy/backup.sh` 出的备份包 → 需要时手动 rsync 到 Air 的**测试目录**（不是开发项目的 `server/data/`）。

这样配置后，"版本冲突"只可能发生在 git 层（push 被拒时 `git pull --rebase` 解决），数据层因单写者天然无冲突。

---

## 6. 不可逆 / 高危操作清单（做之前再看一眼）

| 操作 | 后果 | 说明 |
|---|---|---|
| 🚨 **rsync 覆盖 mini 的 `server/data`** | mini 上已有数据被覆盖 | 全新 mini 无风险；mini 已有数据则先备份 |
| 🚨 **`git push --force`** | 远端历史被改写 | 本方案**永远不需要**它，出现冲突走 `pull --rebase` |
| 🚨 **把 `server/data` 放上云盘** | 学生隐私出域 | 只走局域网 SSH |
| ⚠️ **Time Machine 首次全量备份** | 占用外置盘空间 | 无害，但做迁移前值得做一次（恢复底线） |
| ⚠️ **mini 的 `pmset`（setup 脚本）** | 改变睡眠/更新行为 | 只作用于 mini，可随时 `man pmset` 恢复；对 Air 无影响 |
| ✅ `git add/commit/push`、rsync 拉取 Air→mini | Air 零改动 | 本方案对 Air 完全只读 |

---

## 7. 迁移当天执行单（照抄即可）

```
Air：
  □ 0.1  关闭本机 dev server（lsof -ti:3000 | xargs kill）
  □ 0.2  git add -A && git commit && git push
  □ 0.3  确认 GitHub 仓库为 Private
  □ 0.4  （兜底）插外置盘跑一次 Time Machine
mini：
  □ 1.1  系统设置 → 共享 → 开「远程登录」
  □ 1.2  装 Homebrew / node@22 / git；node -v 确认 v22.x
  □ 1.3  git clone 仓库 → ~/Developer/zhixue-platform
  □ 1.4  git 身份配置（user.name / user.email）
  □ 1.5  SSH key（新建并加 GitHub，或从 Air 复制）→ ssh -T git@github.com 验证
Air：
  □ 2.1  rsync server/data → mini          （第 2 层命令）
  □ 2.2  rsync ~/.zshrc、~/.workbuddy 小件   （第 4 层，可选）
mini：
  □ 3.1  验证 ①②③④（第 4 节），全部通过
  □ 3.2  sudo bash deploy/setup-macmini.sh
  □ 3.3  改演示密码（bootout → set-password.js → bootstrap）
  □ 3.4  过 DEPLOY.md 十项清单 → 对外发域名
Air：
  □ 4.1  之后的工作流：改代码 → push → mini pull+重启
```
