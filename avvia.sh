#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${1:-8124}"

echo "Avvio di SOGLIA IV su http://localhost:${PORT}"
cd "$DIR"
python3 -m http.server "$PORT" --bind 127.0.0.1
