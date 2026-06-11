#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCOPE="${GRAPHIFY_SCOPE_DIR:-/private/tmp/qr-pixel-graphify-scope}"
MODE="${1:-ast}"

cd "$ROOT"

rm -rf "$SCOPE"
mkdir -p "$SCOPE"

copy_if_exists() {
  local source="$1"
  local target="$SCOPE/$source"
  if [[ -e "$source" ]]; then
    mkdir -p "$(dirname "$target")"
    cp -R "$source" "$target"
  fi
}

copy_if_exists src
copy_if_exists tests
copy_if_exists package.json
copy_if_exists package-lock.json
copy_if_exists next.config.ts
copy_if_exists tsconfig.json
copy_if_exists playwright.config.ts
copy_if_exists vitest.config.ts
copy_if_exists Dockerfile
copy_if_exists docker-compose.yml
copy_if_exists README.md

run_graphify() {
  if command -v rtk >/dev/null 2>&1; then
    rtk graphify "$@"
  else
    graphify "$@"
  fi
}

case "$MODE" in
  ast)
    run_graphify update "$SCOPE" --force
    ;;
  label)
    run_graphify update "$SCOPE" --force
    run_graphify cluster-only "$SCOPE"
    ;;
  *)
    echo "Usage: $0 [ast|label]" >&2
    exit 2
    ;;
esac

mkdir -p graphify-out
cp "$SCOPE/graphify-out/graph.json" graphify-out/graph.json
cp "$SCOPE/graphify-out/graph.html" graphify-out/graph.html
cp "$SCOPE/graphify-out/GRAPH_REPORT.md" graphify-out/GRAPH_REPORT.md

python3 - <<'PY'
import hashlib
import json
from pathlib import Path

root = Path.cwd()
graph = json.loads(Path("graphify-out/graph.json").read_text())
files = sorted({
    node.get("source_file")
    for node in graph.get("nodes", [])
    if node.get("source_file")
})
manifest = {}
for rel in files:
    src = root / rel
    if not src.exists():
        continue
    data = src.read_bytes()
    digest = hashlib.md5(data).hexdigest()
    manifest[str(src)] = {
        "mtime": src.stat().st_mtime,
        "ast_hash": digest,
        "semantic_hash": digest,
    }
Path("graphify-out/manifest.json").write_text(
    json.dumps(manifest, indent=2, sort_keys=True),
    encoding="utf-8",
)
print(f"[graphify] manifest indexed {len(manifest)} source files")
print(
    f"[graphify] graph indexed {len(graph.get('nodes', []))} nodes, "
    f"{len(graph.get('links', []))} edges"
)
PY
