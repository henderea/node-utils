#!/bin/sh

_run() {
    printf '\e[2m$ %s\e[0m\n' "$1"
    eval "$1"
}

for s; do
    _run "./scripts/ncc-clean.sh '$s' && ./scripts/ncc-build-debug-build.sh '$s' && ./scripts/ncc-post_clean.sh '$s'"
done