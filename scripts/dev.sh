#!/bin/bash

# Development script for API21

echo "🔧 Starting API21 in development mode..."

# Check if air is installed
if ! command -v air &> /dev/null; then
    echo "📦 Installing air for hot reload..."
    go install github.com/cosmtrek/air@latest
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "📋 Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your configuration"
fi

# Start with hot reload
echo "🚀 Starting server with hot reload..."
air
