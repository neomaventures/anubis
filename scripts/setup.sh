#!/bin/bash

# Neoma Package Template Setup Script
# This script replaces placeholders with your package details

set -e

echo "🚀 Neoma Package Template Setup"
echo "================================"
echo

# Prompt for package details
read -p "Package name (e.g., 'garmr', 'validation'): " PACKAGE_NAME
read -p "Package description: " PACKAGE_DESCRIPTION
read -p "Repository URL (e.g., https://github.com/shipdventures/neoma-garmr): " REPO_URL

echo
echo "📝 Replacing placeholders..."

# Find and replace in all relevant files
find . -type f \( -name "*.json" -o -name "*.md" -o -name "*.ts" -o -name "*.yml" \) -exec sed -i '' "s|{{PACKAGE_NAME}}|$PACKAGE_NAME|g" {} +
find . -type f \( -name "*.json" -o -name "*.md" -o -name "*.ts" -o -name "*.yml" \) -exec sed -i '' "s|{{PACKAGE_DESCRIPTION}}|$PACKAGE_DESCRIPTION|g" {} +
find . -type f \( -name "*.json" -o -name "*.md" -o -name "*.ts" -o -name "*.yml" \) -exec sed -i '' "s|{{REPO_URL}}|$REPO_URL|g" {} +
find . -type f \( -name "*.json" -o -name "*.md" -o -name "*.ts" -o -name "*.yml" \) -exec sed -i '' "s|package-template|$PACKAGE_NAME|g" {} +

echo "✅ Placeholders replaced"

# Rename directory
echo "📁 Renaming libs/package-template to libs/$PACKAGE_NAME..."
mv libs/package-template "libs/$PACKAGE_NAME"

echo "✅ Directory renamed"

# Install dependencies and generate package-lock.json
echo "📦 Installing dependencies and generating package-lock.json..."
npm install

echo "✅ Dependencies installed"

# Clean up setup script
echo "🧹 Removing setup script..."
rm -rf scripts

echo
echo "✅ Setup complete!"
echo
echo "Next steps:"
echo "  1. npm test (start building with TDD)"
echo "  2. npm run test:e2e (add E2E tests)"
echo "  3. npm run build (build the library)"
echo
echo "Happy coding! 🎉"
