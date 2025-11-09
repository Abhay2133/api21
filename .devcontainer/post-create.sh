#!/usr/bin/env bash
set -euo pipefail

# wait for docker daemon (simple loop)
for i in $(seq 1 30); do
  if docker info >/dev/null 2>&1; then
    echo "docker available"
    break
  fi
  echo "waiting for docker..."
  sleep 1
done

# install act (official installer)
curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# add a small helper (optional)
echo "To run act: act -l  (list), act -j <job_id> (run a job)"
