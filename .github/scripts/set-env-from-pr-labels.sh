#!/usr/bin/env bash

set -e # Exit immediately if a command exits with a non-zero status.

PR_NUMBER="${1:-}"
if [ -z "$PR_NUMBER" ]; then
  echo "No PR number provided. Skipping reading ENV vars from PR labels."
  exit 0 # exit without failing
fi

if [[ ! "$PR_NUMBER" =~ ^[0-9]+$ ]]; then
  echo "Invalid PR number."
  exit 1
fi

LABELS=$(gh pr view "$PR_NUMBER" --json labels -q '.labels[].name')

while IFS= read -r line; do
  if [[ "$line" =~ ^ENV_[A-Z0-9_]+$ ]]; then
    ENV_NAME="${line#ENV_}" # removes ENV_ prefix
    echo "$ENV_NAME=on" >> "$GITHUB_ENV"
    echo "Set env var found in PR label: $ENV_NAME=on"
  fi
done <<< "$LABELS"
