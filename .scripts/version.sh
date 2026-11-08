#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

package_version() {
  node -p "require('./package.json').version"
}

lock_versions() {
  node -p "const lock = require('./package-lock.json'); [lock.version, lock.packages[''].version, lock.packages['packages/oval-schema'].version].join(' ')"
}

schema_version() {
  node -p "require('./packages/oval-schema/package.json').version"
}

latest_edition() {
  [ -d published ] || return 0
  find published -maxdepth 1 -name 'v*' -type d | sed -n 's|^published/v\([0-9][0-9.]*\)$|\1|p' | sort -V | tail -1
}

greater() {
  node -e 'const [a, b] = process.argv.slice(1).map((v) => v.split(".").map(Number)); process.exit((a[0] - b[0] || a[1] - b[1] || a[2] - b[2]) > 0 ? 0 : 1)' "$1" "$2"
}

check() {
  local expected
  expected="$(package_version)"
  local ok=0
  if ! [[ "$expected" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "package.json version $expected is not MAJOR.MINOR.PATCH" >&2
    ok=1
  fi
  if [ "$(schema_version)" != "$expected" ]; then
    echo "packages/oval-schema/package.json is $(schema_version) but package.json is $expected" >&2
    ok=1
  fi
  for version in $(lock_versions); do
    if [ "$version" != "$expected" ]; then
      echo "package-lock.json is $version but package.json is $expected" >&2
      ok=1
    fi
  done
  local latest
  latest="$(latest_edition)"
  if [ -n "$latest" ] && [ "$latest" != "$expected" ] && ! greater "$expected" "$latest"; then
    echo "package.json is $expected but the latest edition in published/ is $latest" >&2
    ok=1
  fi
  if [ "$ok" -eq 0 ]; then
    echo "the version is $expected"
  fi
  return "$ok"
}

set_version() {
  local version="$1"
  if ! [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "$version is not MAJOR.MINOR.PATCH" >&2
    exit 1
  fi
  local latest
  latest="$(latest_edition)"
  if [ -n "$latest" ] && [ "$latest" != "$version" ] && ! greater "$version" "$latest"; then
    echo "$version is not greater than the latest edition $latest" >&2
    exit 1
  fi
  npm version "$version" --no-git-tag-version --allow-same-version --workspaces --include-workspace-root >/dev/null
  check
}

case "${1:-}" in
  check) check ;;
  set) set_version "${2:?usage: version.sh set MAJOR.MINOR.PATCH}" ;;
  *) echo "usage: version.sh check | set MAJOR.MINOR.PATCH" >&2; exit 2 ;;
esac
