#!/bin/bash

# Set PATH to include node/npm
export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"

echo "🔨 Starting production build test..."
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo ""

# Run build
npm run build

exit_code=$?

if [ $exit_code -eq 0 ]; then
  echo ""
  echo "✅ BUILD SUCCESSFUL!"
  echo "All components compiled without errors."
else
  echo ""
  echo "❌ BUILD FAILED with exit code $exit_code"
  echo "Please check the errors above."
fi

exit $exit_code
