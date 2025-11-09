#!/bin/bash

# Smart startup script that handles binary redeployment
# Exit codes:
#   0 - success
#   1 - error
#   42 - restart requested (binary updated, need to restart)

set -e

PORT=${PORT:-5000}
ADDR=${ADDR:-0.0.0.0}
GO_ENV=${GO_ENV:-production}
BUILDVERSION_FILE=".buildversion"
BIN_DIR="bin"
BINARY_NAME="api21"

# Function to run migrations
run_migrations() {
    echo "Running database migrations..."
    buffalo pop migrate up
    if [ $? -ne 0 ]; then
        echo "Migration failed"
        exit 1
    fi
}

# Function to get binary path from version
get_binary_path() {
    local version=$1
    echo "${BIN_DIR}/${BINARY_NAME}-v${version}"
}

# Function to check if binary exists and is executable
check_binary() {
    local binary_path=$1
    if [ -f "$binary_path" ] && [ -x "$binary_path" ]; then
        return 0
    fi
    return 1
}

# Function to build binary
build_binary() {
    local binary_path=$1
    echo "Building binary to: $binary_path"
    mkdir -p "$BIN_DIR"
    buffalo build -o "$binary_path"
    if [ $? -ne 0 ]; then
        echo "Build failed"
        exit 1
    fi
}

# Function to start the server
start_server() {
    local binary_path=$1
    echo "Starting server from: $binary_path"
    export ADDR
    export PORT
    export GO_ENV
    exec "$binary_path"
}

# Main startup logic
main() {
    # Run migrations first
    run_migrations

    # Check if .buildversion file exists and has content
    if [ -f "$BUILDVERSION_FILE" ]; then
        VERSION=$(cat "$BUILDVERSION_FILE" | tr -d ' \n')
        if [ -n "$VERSION" ]; then
            BINARY_PATH=$(get_binary_path "$VERSION")
            
            if check_binary "$BINARY_PATH"; then
                echo "Found existing binary for version $VERSION"
                start_server "$BINARY_PATH"
            else
                echo "Binary for version $VERSION not found at $BINARY_PATH, rebuilding..."
                build_binary "$BINARY_PATH"
                start_server "$BINARY_PATH"
            fi
        fi
    fi

    # No version file found, build with version 0
    echo "No build version found, building initial binary..."
    BINARY_PATH=$(get_binary_path 0)
    build_binary "$BINARY_PATH"
    
    # Write version to file for next startup
    echo "0" > "$BUILDVERSION_FILE"
    
    start_server "$BINARY_PATH"
}

main
