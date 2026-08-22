# 智学平台 · 部署指南（让所有学生注册 / 登录使用）

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

## 六、学生如何开始使用

1. 访问你的域名 → 右上角「登录 / 注册」→ 选「注册」。
2. 填昵称、用户名、密码即可创建账号（**开放注册**，无需邀请码）。
3. 注册后自动登录，做题进度实时写入后端 `server/data/db.json`。
4. 学生在「作业」看到全部单元与完成状态；在「错题本」看到薄弱维度；在「排行榜」看到班级排名。

教师账号（演示：`teacher / teacher123`）可在 `teacher.html` 查看班级总览。

---

## 七、安全与运维要点

**已内置的加固（无需额外操作）：**
- 密码经 `scrypt` 加盐哈希存储，数据库不存明文。
- 会话用 30 天有效 Token（`Authorization: Bearer`），前端自动携带。
- 静态服务**拒绝**公开访问：`server/`（后端 + `db.json`）、`deploy/`、`tools/`、所有 `.py` / `.sh` / `.command` / `.md` 与隐藏文件（`.watch_status.json` / `.workbuddy` / `.qa-screens`）。
- 后端仅监听 `127.0.0.1`，外部不可直连。
- 目录穿越防护 + SPA 回退。

**你需要自行注意：**
- **开放注册**：当前任何人都能注册。若只限自己班级，可在 `server/index.js` 的 `/api/register` 增加邀请码 / 白名单校验。
- **备份数据**：定期备份 `server/data/db.json`（学生进度全在此文件）。可加 cron：`cp server/data/db.json /backup/zhixue-$(date +%F).json`。
- **证书 / 域名**：Caddy 自动续期，无需手动干预。
- **更新课件**：教师新增课件后触发同步（网页「立即同步」按钮或 `python sync_courseware.py`）；守护进程 `watch_courseware.js` 监听到桌面文件夹变化会自动同步。

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
