#!/usr/bin/env bash
set -euo pipefail

REPO_NAME="${1:-toetredingsformulier-vzw-meulestede}"
REMOTE_URL="${2:-}"

if [[ -z "$REMOTE_URL" ]]; then
  echo "Gebruik: ./scripts/init-git-and-push.sh <repo-naam> <remote-url>"
  echo "Voorbeeld: ./scripts/init-git-and-push.sh toetredingsformulier-vzw-meulestede git@github.com:USER/toetredingsformulier-vzw-meulestede.git"
  exit 1
fi

git init
git add .
git commit -m "Init online toetredingsformulier"
git branch -M main
git remote add origin "$REMOTE_URL"
git push -u origin main
