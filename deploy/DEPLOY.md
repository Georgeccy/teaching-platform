# 智学平台 · 部署指南（让所有学生注册 / 登录使用）

> **两种部署路线：**
> - **VPS（Linux + systemd）** → 本文档
> - **Mac mini（macOS + launchd）** → [`deploy/DEPLOY-MACMINI.md`](DEPLOY-MACMINI.md)（家庭宽带直连 + DDNS，代码与数据完全同构，随时可互相迁移）

本指南帮助你把 **智学平台** 部署到一台公网服务器，使任意学生通过域名访问、自助注册账号并保存学习进度。

平台是 **零依赖 Node 后端 + 静态前端**（`.html` / `.css` / `.js` / 课件），无需数据库、无需 npm install。

---

## 一、准备

| 项目 | 说明 |
|------|------|
| 服务器 | 任意 VPS（1 vCPU / 1GB 内存即可），公网 IP |
| 系统 | Ubuntu 22.04 / Debian 12（含 systemd） |
| 域名 | 一条 A 记录指向服务器 IP，例如 `dse.yourdomain.com` |
| Node | 18+（`node -v` 验证） |
| 反向代理 | **Caddy**（自动申请 / 续期 HTTPS 证书，强烈推荐） |

> 为什么需要反向代理？后端已改为**只监听 `127.0.0.1:3000`**，外部流量统一由 Caddy 转发，证书与 TLS 交给 Caddy 处理，无需改动应用代码。

---

## 二、把代码放到服务器

在服务器上创建专用用户与目录（避免用 root 跑服务）：

```bash
sudo useradd -r -s /usr/sbin/nologin zhixue
sudo mkdir -p /opt/zhixue-platform
sudo chown -R zhixue:zhixue /opt/zhixue-platform
```

把项目复制过去（任选一种）：

- **方式 A（git）**：在服务器 `git clone` 你的仓库到 `/opt/zhixue-platform`。
- **方式 B（rsync）**：在开发机执行
  ```bash
  SYNC=1 SRC=/path/to/zhixue-platform bash deploy/deploy.sh
  ```
  脚本会自动排除 `server/data/`（生产数据）、`.workbuddy/`、`.qa-screens/` 等。

---

## 三、配置 Caddy（自动 HTTPS）

编辑 `deploy/Caddyfile`，把 `dse.yourdomain.com` 换成你的域名，然后安装并启用：

```bash
# 安装 Caddy（Ubuntu/Debian）
sudo apt update && sudo apt install -y debian-keyring debian-archive-keyring curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable.gpg
echo "deb [signed-by=/usr/share/keyrings/caddy-stable.gpg] https://dl.cloudsmith.io/public/caddy/stable/deb/debian any-version main" | sudo tee /etc/apt/sources.list.d/caddy.list
sudo apt update && sudo apt install -y caddy

# 启用本项目的 Caddy 配置
sudo cp deploy/Caddyfile /etc/caddy/conf.d/zhixue.Caddyfile   # 或合并进 /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy 会在首次访问时自动向 Let's Encrypt 申请证书，并自动续期。确保服务器 **80 / 443 端口对外开放**。

---

## 四、配置 systemd 守护进程

```bash
sudo cp deploy/zhixue.service /etc/systemd/system/
# 按实际路径修改 WorkingDirectory / ExecStart 中的 /opt/zhixue-platform
sudo systemctl daemon-reload
sudo systemctl enable --now zhixue
sudo systemctl status zhixue      # 应为 active (running)
```

服务已设置 `Restart=always`，进程崩溃会自动拉起；`LIVERELOAD=0` 关闭开发态的 Live Reload。

---

## 五、验证

```bash
# 本机回环（应 200）
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/

# 通过域名（应 200，且为 HTTPS）
curl -sI https://dse.yourdomain.com/ | head -1
```

打开浏览器访问 `https://dse.yourdomain.com/`：
- 首页可正常加载、主题切换正常；
- 点右上角「登录 / 注册」可注册新账号；
- 进入「阅读单元 / 写作单元」做题后，进度会出现在「我的看板 / 错题本 / 排行榜」。

---

## 六、学生如何开始使用（邀请码注册）

1. 教师先在 `teacher.html` 的「🎟 邀请码管理」生成一批邀请码（可设数量、有效期、备注），复制发给学生。
2. 学生访问你的域名 → 右上角「登录 / 注册」→ 选「注册」。
3. 填写姓名、用户名、密码 + **邀请码**（一码一用，用后即焚）。
4. 注册后自动登录，做题进度实时写入后端 `server/data/db.json`。
5. 学生在「作业」看到全部单元与完成状态；在「错题本」看到薄弱维度；在「排行榜」看到班级排名。

> 邀请码格式 `DSE-XXXXXX`（已剔除 0/O、1/I/L 等易混淆字符，方便手抄）。
> 教师可在面板里看到每码的状态：可用 / 已使用 / 已过期 / 已吊销，并可随时吊销未使用的码。

---

## 七、安全与运维要点

**已内置的加固（无需额外操作）：**
- 密码经 `scrypt` 加盐哈希存储，数据库不存明文。
- **注册必须持有效邀请码**，且角色由服务端强制写死为 `student`——即使请求里塞 `role: "teacher"` 也会被忽略。
- **家长会材料按隐私边界鉴权**：教师可见全部，学生仅可见本人名下；未登录一律 401。（此前该接口未鉴权，等于全网可读学生谈话记录。）
- **限流**：登录（同一 IP + 用户名 10 分钟 8 次）、注册（同一 IP 每小时 20 次）、改密（每小时 10 次），超限返回 429。阈值按「全班在同一校园网下一起注册也不会被误伤」校准。
- **真登出**：`POST /api/logout` 会删除服务端会话，退出后 token 立即失效（此前仅清前端 localStorage，30 天内仍可用）。
- **原子写入**：所有数据文件先写 `.tmp` 再 `rename`，避免写入途中进程被杀留下半截 JSON。
- 静态服务**拒绝**公开访问：`server/`（后端 + `db.json`）、`deploy/`、`tools/`、所有 `.py` / `.sh` / `.command` / `.md` 与隐藏文件。
- 后端仅监听 `127.0.0.1`，外部不可直连；目录穿越防护 + SPA 回退。

**你需要自行注意：**
- **上线前必须改掉演示密码**（`teacher123` / `student123` 是公开的）：
  ```bash
  sudo systemctl stop zhixue                     # 先停服务，避免内存缓存覆盖文件
  cd /opt/zhixue-platform
  sudo -u zhixue node server/set-password.js teacher '你的强密码'
  sudo systemctl start zhixue
  ```
  设置 `NODE_ENV=production` 后，演示密码会被**直接拒绝登录**并提示改密。服务启动时也会自检并打印仍在用演示密码的账号。
- **生产模式开关**：在 systemd 单元里加 `Environment=NODE_ENV=production`（同时建议 `Environment=LIVERELOAD=0`）。
- **备份数据**：项目自带备份脚本（含完整性检查与**恢复演练**），替换手写 tar：
  ```bash
  # 手动备份 + 恢复演练（首次务必加 --verify 跑一次）
  sudo -u zhixue bash deploy/backup.sh /backup/zhixue --verify

  # 定时：每天凌晨 4 点，保留最近 30 份
  0 4 * * * /bin/bash /opt/zhixue-platform/deploy/backup.sh /backup/zhixue >> /var/log/zhixue-backup.log 2>&1

  # 灾难恢复（三步）：
  sudo systemctl stop zhixue
  tar xzf /backup/zhixue/zhixue-data-<日期>.tar.gz -C /opt/zhixue-platform
  sudo systemctl start zhixue
  ```
- **健康检查**：`GET /api/health` 无需登录，返回 `{ok, uptime, env, dataWritable}`；
  教师登录后额外返回账号 / 进度 / 材料数量统计。`dataWritable: false` 时返回 503
  （磁盘满或权限错会立刻暴露，而不是等学生丢数据才发现）。可用于外部拨测监控。
- **请求体上限**：服务端硬性限制 40MB（超限返回 413），Caddy 层再兜一道 50MB。
- **证书 / 域名**：Caddy 自动续期，无需手动干预。
- **更新课件**：教师新增课件后触发同步（网页「立即同步」按钮或 `python sync_courseware.py`）；守护进程 `watch_courseware.js` 监听到桌面文件夹变化会自动同步。

---

## 七·补、上线前检查清单

按顺序过一遍，全部打勾再对外发域名：

- [ ] 已改掉所有演示密码（`node server/set-password.js`，注意**先停服务**——服务运行时该命令会自动拒绝执行），启动日志不再出现「仍在使用演示密码」警告
- [ ] systemd 已设置 `Environment=NODE_ENV=production`（`deploy/zhixue.service` 已内置，直接复制即可）
- [ ] `curl http://127.0.0.1:3000/api/health` 返回 `"env":"production"` 且 `"ok":true`
- [ ] HTTPS 正常，域名可访问，HTTP 自动跳转 HTTPS
- [ ] 用浏览器实测：注册（无邀请码应被拒）→ 用邀请码注册成功 → 退出后 token 失效
- [ ] 用学生账号登录后，家长会页面只能看到自己的材料
- [ ] 连续输错密码 9 次，应出现「操作过于频繁」提示
- [ ] `curl https://你的域名/server/data/db.json` 应返回 403
- [ ] `bash deploy/backup.sh /backup/zhixue --verify` 输出「恢复演练通过」
- [ ] 备份 cron 已配置，并在演练中**真的从备份恢复过一次**（没验证过的备份不算备份）

---

## 八、后续更新

代码更新后，在服务器执行：

```bash
bash deploy/deploy.sh          # git 模式：拉取并重启
# 或开发机：SYNC=1 SRC=/path/to/zhixue-platform bash deploy/deploy.sh
```

脚本会拉取最新代码（或 rsync 同步）、重启服务并自检端口。

---

### 本地开发 vs 生产

| | 本地开发 | 生产部署 |
|---|---|---|
| 启动 | 双击 `启动.command` | `systemctl start zhixue` |
| 访问 | `http://127.0.0.1:3000` | `https://你的域名` |
| Live Reload | 开（监听桌面文件夹自动同步） | 关（`LIVERELOAD=0`） |
| 后端监听 | `127.0.0.1:3000` | `127.0.0.1:3000`（同） |
| HTTPS | 无 | Caddy 自动 |
