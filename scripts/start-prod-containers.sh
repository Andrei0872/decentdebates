#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

GIT_SHA="$(git -C "$ROOT_DIR" rev-parse --short HEAD)"
export GIT_SHA

cd "$ROOT_DIR"
exec docker compose --profile app --profile o11y up --build "$@"
