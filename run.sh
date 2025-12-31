#!/bin/bash

MIN_RUN_TIME=10
RESTART_EXIT_CODE=50

run_cmd() {
  local cmd="$1"
  local description="$2"
  
  echo ">>> $description"
  $cmd
  local exit_code=$?
  
  if [ $exit_code -ne 0 ]; then
    echo "ERROR: '$cmd' failed with exit code $exit_code"
    return $exit_code
  fi
  
  return 0
}

should_restart() {
  local exit_code=$1
  local run_time=$2

  if [ $exit_code -eq $RESTART_EXIT_CODE ]; then
    echo "Restart requested (exit code $RESTART_EXIT_CODE)"
    return 0
  fi

  if [ $exit_code -ne 0 ]; then
    echo "Exiting: exit code was $exit_code (not $RESTART_EXIT_CODE)"
    return 1
  fi

  if [ $run_time -lt $MIN_RUN_TIME ]; then
    echo "Exiting: restarted too early (ran for ${run_time}s, minimum is ${MIN_RUN_TIME}s)"
    return 1
  fi

  return 1
}

main_loop() {
  while true; do
    start_at=$(date +%s)

    run_cmd "git pull" "Updating code from git..." || break

    run_cmd "npm install" "Installing dependencies..." || break
    run_cmd "npm run db:migrate" "Running database migrations..." || break
    
    echo ">>> Starting server..."
    npm run start
    exit_code=$?

    end_at=$(date +%s)
    run_time=$((end_at - start_at))

    should_restart $exit_code $run_time || break
    
    echo "Restarting Server..."
    echo ""
  done
}

main_loop