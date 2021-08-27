#!/usr/bin/env bash

source "$(dirname "$0")/_util.sh"

for s; do
  s="$(_cleanup_param "$s")"
  if _should_do "$s"; then
    _run "rm -rf dist/$s/*.hbs && rm -rf dist/$s/locales"
  fi
done
