# 智学平台 · Mac mini 部署指南

用一台常开的 Mac mini 替代 VPS 对外提供服务。技术栈不变：**Caddy（自动 HTTPS）反代 → Node 后端（只监听 127.0.0.1:3000）**，差别只是把 systemd 换成 macOS 的 launchd。

> 与 VPS 方案对照：`deploy/DEPLOY.md` 是 Linux/VPS 版；本文是 macOS 版。数据与代码完全同构，随时可互相迁移（rsync `server/data` 即可）。

---

## 〇、适用前提（先确认这两件事）

1. **公网可达**。方法：登录路由器管理页看「WAN 口 IP」，再开 `https://api.ipify.org` 看本机出口 IP。
   - 两者一致 → 有公网 IP（香港家宽多数如此，通常是动态的，配 DDNS 即可）✅
   - 不一致（一般是 `100.64.x.x`）→ 运营商 CGNAT，没有公网 IP，本文的直连方案走不通，改用 Cloudflare Tunnel（见文末「替代方案」）。
2. **这台 Mac mini 能常开**。它是全班学生的晚自习服务器：不断电、不睡眠、不自动更新重启。`setup-macmini.sh` 会把这三件事配置好。

---

## 一、系统服务器化（一条命令）

```bash
sudo bash deploy/setup-macmini.sh
```

脚本做的事：

| 设置 | 为什么 |
|---|---|
| `pmset sleep 0 / disksleep 0` | 服务器不能睡觉，学生晚上 10 点要做题 |
| `pmset autorestart 1 / womp 1` | 停电恢复自动开机；网络唤醒 |
| 关闭 macOS 自动安装更新 | 深夜自动重启 = 全班掉线；更新改为人工择时 |
| 校验 node / caddy / 项目目录 | 缺啥装啥早发现 |
| 安装 launchd 服务（`com.zhixue.platform.plist`） | 崩溃自动拉起、开机自启；node 与项目路径自动替换为本机实际值 |

脚本会用 `/api/health` 自检，通过才算装好。

> plist 模板里有两处 `TODO`（node 路径 / 项目路径），脚本会自动填，无需手改。

---

## 二、Caddy 反代（自动 HTTPS）

```bash
brew install caddy
# Caddyfile 与 VPS 版完全相同（deploy/Caddyfile），改一下域名即可
sudo mkdir -p /opt/caddy
sudo cp deploy/Caddyfile /opt/caddy/Caddyfile
sudo sed -i '' 's/dse.yourdomain.com/你的真实域名/' /opt/caddy/Caddyfile
# 首次启动（申请证书需要 80/443 可达）
sudo brew services start caddy   # 或：sudo caddy start --config /opt/caddy/Caddyfile
```

macOS 防火墙如果开着，放行 Caddy 入站：

```bash
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add "$(command -v caddy)"
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp "$(command -v caddy)"
```

---

## 三、路由器：端口转发 + 固定局域网 IP

1. 在路由器 DHCP 页把 Mac mini 的局域网 IP 绑定保留（如 `192.168.1.20`），避免重启后变址。
2. 端口转发：外部 **TCP 80 → 192.168.1.20:80**、**TCP 443 → 192.168.1.20:443**（Let's Encrypt 申请与续期都需要这两个口）。
3. 家宽是**动态公网 IP** → 下一节的 DDNS 每五分钟自动把域名指过来。

---

## 四、DDNS（动态公网 IP 自动跟随）

前提：域名托管在 Cloudflare（免费版即可）。

```bash
# 1. Cloudflare 建 API Token（模板 Edit zone DNS，限定你的域名）
# 2. 编辑 deploy/com.zhixue.ddns.plist，填 CF_API_TOKEN / CF_ZONE_ID / CF_RECORD_NAME
sudo cp deploy/com.zhixue.ddns.plist /Library/LaunchDaemons/
sudo chown root:wheel /Library/LaunchDaemons/com.zhixue.ddns.plist
sudo launchctl bootstrap system /Library/LaunchDaemons/com.zhixue.ddns.plist

# 3. 先手动跑一次确认能通（脚本会对比现有记录，没变化就跳过）
sudo bash deploy/ddns-cloudflare.sh
cat /usr/local/var/log/zhixue-ddns.log
```

> 注意：Cloudflare 那条 A 记录的「代理小云朵」要**关掉**（`proxied=false`，脚本已强制）。Caddy 自己管 HTTPS，套 CF 代理会干扰证书申请；且免费版没有内地节点，直连反而对内地学生更快。

---

## 五、改掉演示密码（上线前必做）

launchd 版的停/启与 systemd 不同：

```bash
sudo launchctl bootout system/com.zhixue.platform        # 停服务（CLI 探测到服务在跑会拒绝改密）
node server/set-password.js teacher '强密码'
node server/set-password.js tangzihan '学生强密码'        # 演示学生同样要改
sudo launchctl bootstrap system /Library/LaunchDaemons/com.zhixue.platform.plist
```

生产模式下（plist 已设 `NODE_ENV=production`）演示密码会被直接拒绝登录。

---

## 六、数据备份

```bash
sudo bash deploy/backup.sh /backup/zhixue --verify        # 首次：手动演练一次
sudo cp deploy/com.zhixue.backup.plist /Library/LaunchDaemons/ && \
sudo chown root:wheel /Library/LaunchDaemons/com.zhixue.backup.plist && \
sudo launchctl bootstrap system /Library/LaunchDaemons/com.zhixue.backup.plist
# 之后每天 04:00 自动备份，日志在 /usr/local/var/log/zhixue-backup.log
```

建议把 `/backup/zhixue` 定期同步到 iCloud / 移动硬盘——**备份落在同一块盘上等于没备份**。

---

## 七、验证

跑 `deploy/DEPLOY.md` 第七章补的**十项检查清单**，全部通过再发域名。本地快速自检：

```bash
curl http://127.0.0.1:3000/api/health          # {"ok":true,"env":"production",...}
curl -I https://你的域名                        # HTTP/2 200（Caddy 自动跳 HTTPS）
```

---

## 八、日常运维速查

| 操作 | 命令 |
|---|---|
| 看服务状态 | `sudo launchctl print system/com.zhixue.platform \| head -20` |
| 看应用日志 | `tail -f /usr/local/var/log/zhixue.log` |
| 重启平台 | `sudo launchctl kickstart -k system/com.zhixue.platform` |
| 停 / 启 平台 | `sudo launchctl bootout system/com.zhixue.platform` / `bootstrap ...` |
| Caddy 日志 | `brew services info caddy` 后按提示看文件；或 `log show --predicate 'process == "caddy"' --last 1h` |
| 手动备份 | `sudo bash deploy/backup.sh /backup/zhixue` |
| 手动更新代码 | `cd 项目目录 && git pull && sudo launchctl kickstart -k system/com.zhixue.platform` |
| 探活监控 | `GET /api/health`（`dataWritable:false` 会返回 503，可接拨测） |

> 课件同步：Mac mini 上不需要跑 `watch_courseware.js`。课件更新 = 开发机上 `git pull`（或 rsync 同步 `courseware/`）后重启服务。

---

## 九、launchd ↔ systemd 对照（给以后看）

| systemd（VPS） | launchd（Mac mini） |
|---|---|
| `systemctl start zhixue` | `sudo launchctl bootstrap system /Library/LaunchDaemons/com.zhixue.platform.plist` |
| `systemctl stop zhixue` | `sudo launchctl bootout system/com.zhixue.platform` |
| `systemctl restart zhixue` | `sudo launchctl kickstart -k system/com.zhixue.platform` |
| `journalctl -u zhixue -f` | `tail -f /usr/local/var/log/zhixue.log` |
| `/etc/systemd/system/zhixue.service` | `/Library/LaunchDaemons/com.zhixue.platform.plist` |
| `Restart=always` | `KeepAlive=true` |

---

## 替代方案：没有公网 IP（CGNAT）怎么办

用 Cloudflare Tunnel 把入站流量「拉」进来，无需端口转发：

```bash
brew install cloudflared
cloudflared tunnel login
cloudflared tunnel create zhixue
cloudflared tunnel route dns zhixue 你的域名
cloudflared tunnel run --url http://127.0.0.1:80 --url http://127.0.0.1:443 zhixue
# 稳定后再用另一个 launchd plist 常驻
```

代价：内地学生访问 Cloudflare 边缘节点时快时慢（免费版无内地节点）。**优先确认家宽有没有公网 IP，实在没有再走这条路。**
