#!/usr/bin/env bash

source "$(dirname "$0")/_util.sh"

ncc="$(yarn bin ncc)"
for s; do
  s="$(_cleanup_param "$s")"
  if _should_do "$s"; then
    bin_path="$(_get_bin_path "$s")"
    _pcmd "ncc build $bin_path -m -q -o dist/$s ${EXCLUDES[*]}"
    "$ncc" build "$bin_path" -m -q -o "dist/$s" ${EXCLUDES[@]}
  fi
done
