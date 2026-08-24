#!/usr/bin/env bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PATH="$DIR/.node-runtime/bin:$PATH"
cd "$DIR"
exec npm run dev -- --host
