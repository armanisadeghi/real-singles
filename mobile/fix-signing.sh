#!/bin/bash

echo "🔐 Fixing Xcode signing configuration..."

cd ios

# Backup the project file
cp TruSingle.xcodeproj/project.pbxproj TruSingle.xcodeproj/project.pbxproj.backup

# Remove the hardcoded development team
sed -i '' 's/DEVELOPMENT_TEAM = BFBLM8Z9WV;/DEVELOPMENT_TEAM = "";/g' TruSingle.xcodeproj/project.pbxproj

# Enable automatic code signing
sed -i '' 's/CODE_SIGN_STYLE = Manual;/CODE_SIGN_STYLE = Automatic;/g' TruSingle.xcodeproj/project.pbxproj

echo "✅ Signing configuration updated!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Next steps in Xcode:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Go to Signing & Capabilities tab"
echo "2. Select your Team from the dropdown"
echo "3. Ensure 'Automatically manage signing' is checked"
echo ""
echo "If you don't have a team:"
echo "• Xcode → Settings → Accounts"
echo "• Add your Apple ID (free Apple ID works for development)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
