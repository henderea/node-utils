#!/usr/bin/env bash

source "$(dirname "$0")/_util.sh"

for s; do
  s="$(_cleanup_param "$s")"
  if _should_do "$s"; then
    _run "./scripts/ncc-clean.sh '$s' && ./scripts/ncc-build-debug-build.sh '$s' && ./scripts/ncc-post_clean.sh '$s'"
  fi
done
