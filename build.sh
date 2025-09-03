#!/bin/bash

# Build script for Solana escrow program using Docker
# This script uses the solanafoundation/anchor:v0.31.1 Docker image

set -e

echo "Building Solana escrow program with Docker..."

# Run the build command using the Anchor Docker image
docker run --rm \
  -v "$(pwd)":/workspace \
  -w /workspace \
  solanafoundation/anchor:v0.31.1 \
  anchor build

echo "Build completed successfully!"
echo "Build artifacts should be available in the target/ directory"
