#!/usr/bin/env bash
# ============================================================
#  智学平台 · Mac mini 服务器化一键设置
#
#  做四件事（都可单独跳过，见各段）：
#    1) 关睡眠 + 断电自启 —— 服务器不能睡觉，停电恢复后要自己爬起来
#    2) 关闭 macOS 自动安装更新 —— 深夜自动重启 = 学生晚自习掉线
#    3) 校验 node / caddy / 项目目录
#    4) 安装 launchd 服务（com.zhixue.platform.plist）
#
#  用法：sudo bash deploy/setup-macmini.sh
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ "$(id -u)" -ne 0 ]; then
  echo "❌ 请用 sudo 运行（pmset / launchctl 系统域需要 root）"
  exit 1
fi

echo "== 1/4 电源与睡眠设置 =="
pmset -a sleep 0          # 系统永不睡眠
pmset -a disksleep 0      # 硬盘永不休眠
pmset -a womp 1           # 网络唤醒（Wake on network access）
pmset -a autorestart 1    # 断电恢复后自动开机
echo "  ✓ sleep=0 / disksleep=0 / womp=1 / autorestart=1"

echo "== 2/4 关闭 macOS 自动安装更新 =="
# 只允许下载、不允许自动安装重启；更新改为人工择时（白天没学生用的时候）
softwareupdate --schedule off >/dev/null 2>&1 || true
defaults write /Library/Preferences/com.apple.SoftwareUpdate AutomaticCheckEnabled -bool true
defaults write /Library/Preferences/com.apple.SoftwareUpdate AutomaticDownload -bool true
defaults write /Library/Preferences/com.apple.SoftwareUpdate AutomaticallyInstallMacOSUpdates -bool false
defaults write /Library/Preferences/com.apple.SoftwareUpdate CriticalUpdateInstall -bool false
echo "  ✓ 自动检查/下载保留，自动安装与关键更新自动装已关闭"

echo "== 3/4 环境校验 =="
NODE_PATH_BIN="$(command -v node || true)"
if [ -z "$NODE_PATH_BIN" ]; then
  echo "  ✗ 未找到 node。请先安装：brew install node"
  exit 1
fi
echo "  ✓ node: $NODE_PATH_BIN ($(${NODE_PATH_BIN} -v))"
if command -v caddy >/dev/null 2>&1; then
  echo "  ✓ caddy: $(command -v caddy) ($(caddy version | cut -d' ' -f1))"
else
  echo "  ⚠ 未找到 caddy（对外 HTTPS 必需）：brew install caddy"
fi
if [ ! -f "$PROJECT_ROOT/server/index.js" ]; then
  echo "  ✗ 项目目录不对：$PROJECT_ROOT 里没有 server/index.js"
  exit 1
fi
echo "  ✓ 项目目录: $PROJECT_ROOT"

echo "== 4/4 安装 launchd 服务 =="
PLIST_SRC="$SCRIPT_DIR/com.zhixue.platform.plist"
PLIST_DST="/Library/LaunchDaemons/com.zhixue.platform.plist"
if [ ! -f "$PLIST_SRC" ]; then
  echo "  ✗ 找不到 $PLIST_SRC"
  exit 1
fi
mkdir -p /usr/local/var/log
cp "$PLIST_SRC" "$PLIST_DST"
chown root:wheel "$PLIST_DST" && chmod 644 "$PLIST_DST"
# 把 plist 里的 node 路径与项目路径替换为本机实际值
sed -i '' \
  -e "s|/opt/homebrew/bin/node|${NODE_PATH_BIN}|g" \
  -e "s|/Users/zhixue/Developer/zhixue-platform|${PROJECT_ROOT}|g" \
  "$PLIST_DST"
launchctl bootout system/com.zhixue.platform >/dev/null 2>&1 || true
launchctl bootstrap system "$PLIST_DST"
sleep 2
if curl -fs http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
  echo "  ✓ 服务已启动，健康检查通过"
else
  echo "  ⚠ 服务已注册但健康检查未通过，查看日志：tail -40 /usr/local/var/log/zhixue.log"
  exit 1
fi

cat <<'NEXT'

============================================================
✅ 服务器化设置完成。接下来（见 deploy/DEPLOY-MACMINI.md）：
   1. brew install caddy && brew services start caddy   # 反代 + 自动 HTTPS
   2. 路由器端口转发 80/443 → Mac mini 的局域网 IP
   3. 配 DDNS（deploy/ddns-cloudflare.sh + com.zhixue.ddns.plist）
   4. 改掉演示密码（先停服务！）
      sudo launchctl bootout system/com.zhixue.platform
      node server/set-password.js teacher '强密码'
      sudo launchctl bootstrap system /Library/LaunchDaemons/com.zhixue.platform.plist
============================================================
NEXT
