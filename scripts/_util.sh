_cleanup_param() {
  local s="$1"
  s="$(basename "$s")"
  s="${s%*.js}"
  s="${s%*.mjs}"
  s="${s%*.ts}"
  echo "$s"
}

_get_bin_path() {
  local s="$1"
  if [[ -f "src/$s.ts" ]]; then
    echo "src/$s.ts"
  elif [[ -f "src/$s.mjs" ]]; then
    echo "src/$s.mjs"
  else
    echo "src/$s.js"
  fi
}

_pcmd() {
  printf '\e[2m$ %s\e[0m\n' "$1"
}

_run() {
    _pcmd "$1"
    eval "$1"
}

_should_do() {
  local s="$1"
  if [[ "${s%*.raw}" = "$s" ]]; then
    return 0
  else
    return 1
  fi
}

export EXCLUDES=('-e' 'detect-character-encoding' '-e' 'chokidar')
