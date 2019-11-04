#!/bin/sh

ncc="$(yarn bin ncc)"
for s; do
    printf '\e[2m$ %s\e[0m\n' "ncc build bin/$s.js -m -q -o dist/$s -e detect-character-encoding"
    "$ncc" build "bin/$s.js" -m -q -o "dist/$s" -e detect-character-encoding
done