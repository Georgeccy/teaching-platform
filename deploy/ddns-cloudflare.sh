#!/usr/bin/env bash
# ============================================================
#  智学平台 · Cloudflare DDNS 更新器（家宽动态公网 IP 场景）
#
#  作用：每 5 分钟把域名 A 记录指到本机当前的公网 IP。
#  前提：域名托管在 Cloudflare（免费版即可）。
#
#  准备（Cloudflare 控制台）：
#    1. My Profile → API Tokens → Create Token → 模板「Edit zone DNS」
#       Zone Resources 限定到你的域名 → 生成 Token
#    2. 域名的 DNS 里先建一条 A 记录（如 dse.yourdomain.com → 随便填个 IP，
#       开代理小云朵先关掉——Caddy 自己管 HTTPS，走 Cloudflare 代理会干扰证书申请）
#    3. Zone ID 在域名概览页右侧
#
#  配置（写到 launchd 环境或直接改下方默认值）：
#    export CF_API_TOKEN=xxxx
#    export CF_ZONE_ID=xxxx
#    export CF_RECORD_NAME=dse.yourdomain.com
#
#  手动测试：  bash deploy/ddns-cloudflare.sh
#  定时运行：  见 deploy/com.zhixue.ddns.plist（每 5 分钟）
# ============================================================
set -euo pipefail

CF_API_TOKEN="${CF_API_TOKEN:-}"
CF_ZONE_ID="${CF_ZONE_ID:-}"
CF_RECORD_NAME="${CF_RECORD_NAME:-dse.yourdomain.com}"

fail() { echo "❌ $1" >&2; exit 1; }
[ -n "$CF_API_TOKEN" ] || fail "缺少 CF_API_TOKEN"
[ -n "$CF_ZONE_ID" ] || fail "缺少 CF_ZONE_ID"

api() { curl -s --max-time 15 -H "Authorization: Bearer $CF_API_TOKEN" -H "Content-Type: application/json" "$@"; }

# ---- 1) 当前公网 IP（双源取一致，防单源抖动）----
IP1="$(curl -s --max-time 10 https://api.ipify.org || true)"
IP2="$(curl -s --max-time 10 https://ifconfig.me || true)"
if [ -n "$IP1" ] && [ "$IP1" = "$IP2" ]; then
  CURRENT_IP="$IP1"
else
  CURRENT_IP="${IP1:-$IP2}"
fi
[ -n "$CURRENT_IP" ] || fail "获取公网 IP 失败（双源都不通）"
echo "[$(date '+%F %T')] 当前公网 IP: $CURRENT_IP"

# ---- 2) 读现有 A 记录 ----
RESP="$(api "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records?type=A&name=${CF_RECORD_NAME}")"
SUCCESS="$(echo "$RESP" | /usr/bin/python3 -c 'import sys,json;print(json.load(sys.stdin).get("success","False"))' 2>/dev/null || echo False)"
[ "$SUCCESS" = "True" ] || fail "Cloudflare API 调用失败（检查 Token / Zone ID）：$RESP"
RECORD_ID="$(echo "$RESP" | /usr/bin/python3 -c 'import sys,json;d=json.load(sys.stdin)["result"];print(d[0]["id"] if d else "")')"
OLD_IP="$(echo "$RESP" | /usr/bin/python3 -c 'import sys,json;d=json.load(sys.stdin)["result"];print(d[0]["content"] if d else "")' 2>/dev/null || echo "")"

# ---- 3) IP 没变就跳过（避免无谓的 API 调用）----
if [ -n "$RECORD_ID" ] && [ "$OLD_IP" = "$CURRENT_IP" ]; then
  echo "  DNS 已是最新（$CURRENT_IP），跳过"
  exit 0
fi

# ---- 4) 创建或更新 A 记录（proxied=false：Caddy 自己管 HTTPS，不要套 CF 代理）----
BODY="$(printf '{"type":"A","name":"%s","content":"%s","ttl":300,"proxied":false}' "$CF_RECORD_NAME" "$CURRENT_IP")"
if [ -n "$RECORD_ID" ]; then
  RESULT="$(api -X PUT "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records/${RECORD_ID}" -d "$BODY")"
else
  RESULT="$(api -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records" -d "$BODY")"
fi
echo "$RESULT" | /usr/bin/python3 -c 'import sys,json; d=json.load(sys.stdin); sys.exit(0 if d.get("success") else 1)' \
  || fail "DNS 更新失败：$RESULT"
echo "  ✓ 已把 ${CF_RECORD_NAME} 指向 ${CURRENT_IP}（原值：${OLD_IP:-无}）"
