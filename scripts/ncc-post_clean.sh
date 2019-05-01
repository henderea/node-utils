#!/bin/sh

_run() {
    printf '\e[2m$ %s\e[0m\n' "$1"
    eval "$1"
}

for s; do
    _run "rm -rf dist/$s/*.hbs && rm -rf dist/$s/locales"
done