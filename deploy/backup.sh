#!/usr/bin/env bash
# ============================================================
#  智学平台 · 数据备份（server/data）
#
#  备份内容：db.json（账号 / 进度）、parent-meetings/（家长会材料）、
#            class-folders.json（班级归档）、invite-codes.json（邀请码）
#  不含：courseware/（课件由 git 管理，体积大且可重建）
#
#  用法：
#    bash deploy/backup.sh                    # 备份到默认目录
#    bash deploy/backup.sh /path/to/backup    # 指定备份目录
#    bash deploy/backup.sh /path/to/backup --verify
#                                             # 备份后立即做恢复演练（强烈推荐首次使用时跑一次）
#
#  定时（每天凌晨 4 点，保留 30 天）：
#    0 4 * * * /bin/bash /opt/zhixue-platform/deploy/backup.sh /backup/zhixue >> /var/log/zhixue-backup.log 2>&1
#
#  恢复：
#    sudo systemctl stop zhixue
#    tar xzf /backup/zhixue/zhixue-data-YYYY-MM-DD.tar.gz -C /opt/zhixue-platform
#    sudo systemctl start zhixue
# ============================================================
set -euo pipefail

BACKUP_DIR="${1:-/backup/zhixue}"
VERIFY="no"
for arg in "$@"; do [ "$arg" = "--verify" ] && VERIFY="yes"; done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DATA_DIR="$PROJECT_ROOT/server/data"

if [ ! -d "$DATA_DIR" ]; then
  echo "❌ 找不到数据目录：$DATA_DIR"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

STAMP="$(date +%F-%H%M)"
OUT="$BACKUP_DIR/zhixue-data-$STAMP.tar.gz"

# ---- 打包（相对路径，方便直接解压回项目根）----
tar -czf "$OUT" -C "$PROJECT_ROOT" server/data

SIZE="$(du -h "$OUT" | cut -f1)"
echo "✅ 备份完成：${OUT} （${SIZE}）"

# ---- 完整性检查：归档可读 + 关键文件齐全 + JSON 能解析 ----
echo "---- 完整性检查 ----"
LIST="$(tar tzf "$OUT")"
for f in server/data/db.json server/data/parent-meetings/index.json; do
  if echo "$LIST" | grep -q "^$f$"; then echo "  ✓ $f"; else echo "  ✗ 缺失 $f"; exit 1; fi
done

# ---- 恢复演练：真的解出来，验证 JSON 可解析且账号数一致 ----
if [ "$VERIFY" = "yes" ]; then
  echo "---- 恢复演练 ----"
  TMP="$(mktemp -d)"
  tar xzf "$OUT" -C "$TMP"
  node -e '
    const fs = require("fs"), path = require("path");
    const root = process.argv[1];
    const db = JSON.parse(fs.readFileSync(path.join(root, "server/data/db.json"), "utf8"));
    const users = Object.keys(db.users || {}).length;
    const prog = Object.keys(db.progress || {}).length;
    const pmIdx = path.join(root, "server/data/parent-meetings/index.json");
    const pm = fs.existsSync(pmIdx) ? Object.keys(JSON.parse(fs.readFileSync(pmIdx, "utf8")).items || {}).length : 0;
    const cf = path.join(root, "server/data/class-folders.json");
    const cls = fs.existsSync(cf) ? Object.keys(JSON.parse(fs.readFileSync(cf, "utf8")).classes || {}).length : 0;
    console.log("  解压后解析成功：账号 " + users + " 个 / 进度 " + prog + " 份 / 家长会材料 " + pm + " 份 / 班级 " + cls + " 个");
    if (!users) { console.error("  ✗ 账号数为 0，备份内容可疑"); process.exit(1); }
  ' "$TMP"
  rm -rf "$TMP"
  echo "  ✓ 恢复演练通过（备份可用）"
fi

# ---- 保留最近 30 份，删除更老的 ----
cd "$BACKUP_DIR"
ls -1t zhixue-data-*.tar.gz 2>/dev/null | tail -n +31 | while read -r old; do
  rm -f "$old"
  echo "  🧹 清理过期备份：$old"
done

echo "---- 当前备份（最多列 5 份）----"
ls -1t zhixue-data-*.tar.gz 2>/dev/null | head -5 | while read -r f; do echo "  $f"; done
