#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  ./scripts/git_commit_push.sh "mensaje del commit"

What it does:
  - Adds tracked changes and new files in the repository root
  - Creates a commit with the provided message
  - Pushes the current branch to origin

Notes:
  - The script ignores scripts/__pycache__ by default.
  - If there is nothing to commit, it exits without pushing.
EOF
}

if [[ ${1:-} == "-h" || ${1:-} == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -lt 1 ]]; then
  usage >&2
  exit 1
fi

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

commit_message="$*"

git add -A -- .

if git diff --cached --quiet; then
  echo "No hay cambios para commit."
  exit 0
fi

git commit -m "$commit_message"

current_branch="$(git branch --show-current)"
if [[ -z "$current_branch" ]]; then
  echo "No se pudo detectar la rama actual."
  exit 1
fi

git push origin "$current_branch"
