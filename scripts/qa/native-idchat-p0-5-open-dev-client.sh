#!/usr/bin/env bash
set -euo pipefail

BUNDLE_ID="${NATIVE_IDCHAT_BUNDLE_ID:-com.meta.idchat}"
METRO_URL="${NATIVE_IDCHAT_METRO_URL:-http://127.0.0.1:8081}"
EVIDENCE_DIR="${NATIVE_IDCHAT_EVIDENCE_DIR:-docs/superpowers/qa/evidence/native-idchat-p0-5-release-gate-$(date +%Y%m%d-%H%M%S)}"
UDID="${NATIVE_IDCHAT_SIMULATOR_UDID:-}"

run_with_timeout() {
  local seconds="$1"
  shift
  perl -e 'alarm shift; exec @ARGV' "$seconds" "$@"
}

if [[ -z "$UDID" ]]; then
  UDID="$(xcrun simctl list devices booted | awk -F '[()]' '/Booted/ && /iPhone/ { print $2; exit }')"
fi

if [[ -z "$UDID" ]]; then
  echo "No booted iPhone simulator found. Boot one with Xcode Simulator first." >&2
  exit 2
fi

mkdir -p "$EVIDENCE_DIR/logs"

echo "bundle_id=$BUNDLE_ID" | tee "$EVIDENCE_DIR/logs/dev-client-open-summary.txt"
echo "udid=$UDID" | tee -a "$EVIDENCE_DIR/logs/dev-client-open-summary.txt"
echo "metro_url=$METRO_URL" | tee -a "$EVIDENCE_DIR/logs/dev-client-open-summary.txt"

if curl -fsS "$METRO_URL/status" > "$EVIDENCE_DIR/logs/metro-status.txt"; then
  echo "metro_status=reachable" | tee -a "$EVIDENCE_DIR/logs/dev-client-open-summary.txt"
else
  echo "metro_status=unreachable" | tee -a "$EVIDENCE_DIR/logs/dev-client-open-summary.txt"
  echo "Metro is not reachable at $METRO_URL/status" >&2
  exit 3
fi

encoded_url="$(node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "$METRO_URL")"
dev_client_url="${BUNDLE_ID}://expo-development-client/?url=${encoded_url}"

run_with_timeout 20 xcrun simctl bootstatus "$UDID" -b > "$EVIDENCE_DIR/logs/simctl-bootstatus.log" 2>&1
run_with_timeout 20 xcrun simctl terminate "$UDID" "$BUNDLE_ID" > "$EVIDENCE_DIR/logs/simctl-terminate.log" 2>&1 || true

if run_with_timeout 45 xcrun simctl openurl "$UDID" "$dev_client_url" > "$EVIDENCE_DIR/logs/simctl-openurl.log" 2>&1; then
  echo "openurl_status=success" | tee -a "$EVIDENCE_DIR/logs/dev-client-open-summary.txt"
else
  echo "openurl_status=timeout_or_failure" | tee -a "$EVIDENCE_DIR/logs/dev-client-open-summary.txt"
fi

sleep 12
xcrun simctl io "$UDID" screenshot "$EVIDENCE_DIR/00-after-dev-client-openurl.png" > "$EVIDENCE_DIR/logs/simctl-screenshot.log" 2>&1
echo "screenshot=$EVIDENCE_DIR/00-after-dev-client-openurl.png" | tee -a "$EVIDENCE_DIR/logs/dev-client-open-summary.txt"
