#!/usr/bin/env bash
# Mata procesos "next dev" / "next-server" / "next start" cuyo cwd esté
# dentro de este proyecto (incluye builds en .next, .next-test o
# .next/standalone, y servidores en cualquier puerto: 3000, 3001, 3002...).
# No toca procesos de otros proyectos ni de otros usuarios.
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KILLED=0

for pid in $(pgrep -f "next (dev|start)|next-server" 2>/dev/null || true); do
  cwd_link="/proc/$pid/cwd"
  [ -L "$cwd_link" ] || continue

  cwd_real="$(readlink -f "$cwd_link" 2>/dev/null || true)"
  [ -n "$cwd_real" ] || continue

  case "$cwd_real" in
    "$PROJECT_ROOT"*)
      cmd="$(ps -p "$pid" -o cmd= 2>/dev/null || true)"
      echo "Matando PID $pid ($cmd) — cwd: $cwd_real"
      kill "$pid" 2>/dev/null || true
      KILLED=$((KILLED + 1))
      ;;
  esac
done

if [ "$KILLED" -eq 0 ]; then
  echo "No había procesos next dev/start/server de este proyecto en ejecución."
else
  echo "Procesos detenidos: $KILLED"
fi
