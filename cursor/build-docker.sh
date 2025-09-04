#!/bin/bash
echo "🔨 Building Solana escrow program..."
anchor build
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "Build artifacts should be available in the target/ directory"
else
    echo "❌ Build failed!"
    exit 1
fi
