#!/bin/sh
# Runs deploy.sh in a temp folder against a fake sudo. Touches nothing real.
set -eu
here=$(cd "$(dirname "$0")" && pwd)
t=$(mktemp -d)
trap 'rm -rf "$t"' EXIT

cp "$here/deploy.sh" "$t/"
echo 'SITE_TAG=1.0.1' >"$t/.env"
touch "$t/compose.yml"
mkdir "$t/bin"
cat >"$t/bin/sudo" <<'FAKE'
#!/bin/sh
case "$*" in *"up -d --wait"*)
	if [ -e "$FAIL_NEXT_UP" ]; then rm "$FAIL_NEXT_UP"; exit 1; fi ;;
esac
FAKE
chmod +x "$t/bin/sudo"
PATH="$t/bin:$PATH"
FAIL_NEXT_UP="$t/fail"
export PATH FAIL_NEXT_UP

check() { [ "$2" = "$3" ] || { echo "FAIL: $1: expected '$3', got '$2'" >&2; exit 1; }; }
tag() { cat "$t/.env"; }
lines() { if [ -e "$t/deployments.log" ]; then wc -l <"$t/deployments.log" | tr -d ' '; else echo 0; fi; }

"$t/deploy.sh" 1.0.2 >/dev/null
check "deploy sets the version" "$(tag)" "SITE_TAG=1.0.2"
check "deploy is logged" "$(lines)" 1
grep -q '  1.0.2  (was 1.0.1)$' "$t/deployments.log" || { echo "FAIL: log line format" >&2; exit 1; }

"$t/deploy.sh" 1.0.2 >/dev/null
check "same version is not logged twice" "$(lines)" 1

"$t/deploy.sh" v1.0.3 >/dev/null
check "a leading v is accepted" "$(tag)" "SITE_TAG=1.0.3"
check "rollforward is logged" "$(lines)" 2

if "$t/deploy.sh" 'bad;version' 2>/dev/null; then echo "FAIL: bad version accepted" >&2; exit 1; fi
check "bad version changes nothing" "$(tag)" "SITE_TAG=1.0.3"

touch "$t/fail"
if "$t/deploy.sh" 1.0.4 2>/dev/null; then echo "FAIL: failed deploy reported success" >&2; exit 1; fi
check "failed deploy restores the version" "$(tag)" "SITE_TAG=1.0.3"
check "failed deploy is not logged" "$(lines)" 2

echo "ok"
