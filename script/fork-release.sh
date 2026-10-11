#!/usr/bin/env bash
# Builds the release commit of this fork: its tree is the npm package (what
# `npm pack` ships, already built), so OpenCode can load the plugin from
#   "oh-my-opencode@git+https://github.com/<owner>/oh-my-openagent.git#releases"
# (or #v<version> to pin one) without running install scripts, which OpenCode
# turns off. The `releases` branch moves to each new release, so OpenCode sees
# the plugin as outdated and offers the update.
#
# Usage: script/fork-release.sh <version> [--push]
#   <version>  X.Y.Z-fork.N; FORK_CHANGELOG.md needs a "## [<version>] - YYYY-MM-DD" section.
#   --push     push the tag and the `releases` branch to origin.
# Writes the release notes to $NOTES_OUT (default: a temporary file) and prints that path last.
# Release commits chain on the previous fork release, never on main, so each
# one's diff is the shipped change and main keeps no build output.
set -euo pipefail

version=${1:?version required}
push=${2:-}
[[ $version =~ ^[0-9]+\.[0-9]+\.[0-9]+-fork\.[0-9]+$ ]] || { echo "version must look like 5.0.1-fork.1" >&2; exit 1; }
tag="v$version"
if git rev-parse -q --verify "refs/tags/$tag" >/dev/null; then echo "$tag already exists" >&2; exit 1; fi
[[ -z $(git status --porcelain --untracked-files=no) ]] || { echo "commit or stash your changes first" >&2; exit 1; }

work=$(mktemp -d)
# The tree was clean at start, so the build's rewrites of tracked files go back too.
trap 'rm -rf "$work"; git checkout -q -- .' EXIT
source_sha=$(git rev-parse HEAD)

notes="$work/notes.md"
bun script/fork-release-notes.ts "$version" > "$notes"

# The version is bundled into dist (meta.json reports it), so it is set before the build.
npm pkg set version="$version"
rm -rf dist
bun run build
test -s dist/index.js

npm pack --ignore-scripts --pack-destination "$work" >/dev/null
mkdir "$work/tree"
tar -xzf "$work"/oh-my-opencode-*.tgz -C "$work/tree" --strip-components=1
# The tree is already built. A git dependency whose package.json has
# workspaces or any of build, prepare, prepack, preinstall, install or
# postinstall is "prepared" by npm running `npm install` in its clone, which
# fails inside OpenCode, so the release keeps no scripts and no workspaces.
# (postinstall only prints notices.)
node -e '
const fs = require("fs");
const file = process.argv[1];
const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
delete pkg.scripts;
delete pkg.workspaces;
delete pkg.devDependencies;
fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
' "$work/tree/package.json"

previous=$(git tag --list 'v*-fork.*' --sort=-v:refname | head -n 1)
parent_args=()
[[ -n $previous ]] && parent_args=(-p "$(git rev-parse "$previous^{commit}")")

export GIT_INDEX_FILE="$work/index"
git --work-tree="$work/tree" add -A -f .
tree=$(git write-tree)
unset GIT_INDEX_FILE
commit=$(git commit-tree "$tree" "${parent_args[@]}" -m "release $tag" -m "Source: $source_sha")
git tag -a "$tag" "$commit" -m "$tag"
git update-ref refs/heads/releases "$commit"

if [[ $push == --push ]]; then
  git push origin "$tag" "refs/heads/releases:refs/heads/releases"
fi
out=${NOTES_OUT:-$(mktemp)}
cp "$notes" "$out"
echo "$out"
