#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_ARGS=(--env-file "$ROOT_DIR/packages/db/.env")
SERVICES=(db redis)

wait_for_service() {
  local service="$1"
  local container_id

  container_id="$(cd "$ROOT_DIR" && docker compose "${COMPOSE_ARGS[@]}" ps -q "$service")"

  if [[ -z "$container_id" ]]; then
    echo "Service '$service' is not running."
    exit 1
  fi

  until [[ "$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id")" == "healthy" ]]; do
    sleep 1
  done
}

for service in "${SERVICES[@]}"; do
  wait_for_service "$service"
done
