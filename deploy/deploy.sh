#!/usr/bin/env bash
# 智学平台 · 一键部署脚本
# 用途：拉取最新代码（或同步文件）并重启 systemd 服务。
# 适用：已在服务器按 DEPLOY.md 完成首次部署（Caddy + systemd 就位）。
#
# 用法：
#   bash deploy/deploy.sh            # 默认：尝试 git pull，然后重启服务
#   SYNC=1 bash deploy/deploy.sh     # 若不是 git 仓库：用 rsync 从本地同步（见下方说明）
set -euo pipefail

APP_DIR="/opt/zhixue-platform"          # 服务器上的项目目录（与 .service 中一致）
SERVICE="zhixue"                        # systemd 服务名

echo "==> 进入项目目录 $APP_DIR"
cd "$APP_DIR"

if [ "${SYNC:-0}" = "1" ]; then
  echo "==> [SYNC 模式] 从本地仓库 rsync 到 $APP_DIR（排除数据/运行时/工具目录）"
  # 在开发机上执行此分支：SYNC=1 SRC=/path/to/zhixue-platform bash deploy/deploy.sh
  SRC="${SRC:?请设置 SRC=本地项目路径}"
  rsync -az --delete \
    --exclude 'server/data/' \
    --exclude '.git/' --exclude '.workbuddy/' --exclude '.qa-screens/' \
    --exclude 'node_modules/' --exclude '*.command' \
    "$SRC/" "$APP_DIR/"
else
  if [ -d .git ]; then
    echo "==> [GIT 模式] 拉取最新提交"
    git pull --ff-only
  else
    echo "==> 未检测到 git 仓库，且非 SYNC 模式；跳过代码更新。"
  fi
fi

echo "==> 重启 systemd 服务 $SERVICE"
sudo systemctl restart "$SERVICE"
sleep 2
sudo systemctl is-active "$SERVICE" && echo "✅ 服务已启动" || { echo "❌ 服务启动失败，请查看：sudo journalctl -u $SERVICE -n 50"; exit 1; }

echo "==> 验证本地端口"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3000/ || true
echo "==> 部署完成。外部访问请通过你的域名（Caddy 已配置自动 HTTPS）。"
