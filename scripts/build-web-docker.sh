#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_IMAGE="${NODE_IMAGE:-node:20-bullseye}"

docker run --rm \
  -u "$(id -u):$(id -g)" \
  -v "${ROOT_DIR}:/work" \
  -w /work \
  "${NODE_IMAGE}" \
  bash -lc '
    if [ -f package-lock.json ]; then
      npm ci
    else
      npm install
    fi
    npm run build:web
  '

