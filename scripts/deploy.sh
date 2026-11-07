#!/usr/bin/env bash
# ==============================================================================
# Production Build & Deployment Script to gh-pages branch
# ==============================================================================

# Exit immediately if any command exits with a non-zero status
set -e

echo "==> Step 1: Installing dependencies..."
if npm install; then
  echo "✓ Dependencies installed successfully."
else
  echo "Error: npm install failed." >&2
  exit 1
fi

echo "==> Step 2: Running production build..."
if npm run build; then
  echo "✓ Build completed successfully."
else
  echo "Error: npm run build failed." >&2
  exit 1
fi

echo "==> Step 3: Deploying dist folder to gh-pages branch..."
if npx gh-pages -d dist; then
  echo "✓ Successfully deployed to gh-pages branch!"
else
  echo "Error: Deployment via gh-pages failed." >&2
  exit 1
fi
