#!/bin/sh
# Put a released version live and record when. The same command rolls back.
#   ./deploy.sh 1.0.13
# History is in deployments.log, next to this file.
set -eu
cd "$(dirname "$0")"

version=${1:-}
version=${version#v}
case $version in
	'' | *[!0-9.]*)
		echo "usage: deploy.sh VERSION (for example 1.0.13)" >&2
		exit 2
		;;
esac

previous=$(sed -n 's/^SITE_TAG=//p' .env)
if [ "$version" = "$previous" ]; then
	echo "$version is already live"
	exit 0
fi

# Rewritten in place, so .env keeps its owner and permissions.
set_tag() {
	sed "s/^SITE_TAG=.*/SITE_TAG=$1/" .env >.env.tmp
	cat .env.tmp >.env
	rm .env.tmp
}

sudo docker pull "ghcr.io/js-home-server/site:$version"
set_tag "$version"

# --wait returns only once the container's health check passes.
if ! sudo docker compose -f compose.yml up -d --wait; then
	echo "$version failed its health check, going back to $previous" >&2
	set_tag "$previous"
	sudo docker compose -f compose.yml up -d --wait
	exit 1
fi

printf '%s  %s  (was %s)\n' "$(date -u '+%Y-%m-%d %H:%M UTC')" "$version" "$previous" >>deployments.log
echo "$version is live"
