#!/bin/bash
set -e

echo "=================================================="
echo "🚀 ZIZO Frontend Production Deployment"
echo "=================================================="
echo ""

# Step 1: Build the frontend
echo "📦 Step 1/4: Building frontend production bundle..."
echo ""
npm run build
echo ""
echo "✅ Build complete"
echo ""

# Step 2: Verify the build output
echo "🔍 Step 2/4: Verifying build output..."
echo ""
node scripts/verify-dist-shell.ts
if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Build verification failed. Deployment aborted."
  exit 1
fi
echo ""

# Step 3: Verify canister configuration
echo "🔍 Step 3/4: Verifying frontend canister configuration..."
echo ""
node scripts/verify-frontend-canister-assets-config.ts
if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Canister configuration verification failed. Deployment aborted."
  echo "   Please fix dfx.json configuration before deploying."
  exit 1
fi
echo ""

# Step 4: Deploy to Internet Computer
echo "🌐 Step 4/4: Deploying to Internet Computer..."
echo ""
echo "Running: dfx deploy frontend"
echo ""

cd ..
dfx deploy frontend

if [ $? -eq 0 ]; then
  echo ""
  echo "=================================================="
  echo "✅ DEPLOYMENT SUCCESSFUL"
  echo "=================================================="
  echo ""
  
  # Extract and display the frontend canister ID
  FRONTEND_CANISTER_ID=$(dfx canister id frontend 2>/dev/null || echo "")
  
  if [ -n "$FRONTEND_CANISTER_ID" ]; then
    echo "🌐 Your app is now live at:"
    echo ""
    echo "   https://${FRONTEND_CANISTER_ID}.icp0.io"
    echo ""
    echo "=================================================="
    echo ""
  fi
  
  echo "✅ Verification checklist:"
  echo "1. Open the URL above in an incognito/private window"
  echo "2. Verify the page loads without errors"
  echo "3. Open browser DevTools → Network tab"
  echo "4. Confirm requests to /assets/index-*.js return HTTP 200"
  echo "5. Confirm NO requests to /src/main.tsx"
  echo ""
  echo "📱 To convert to APK:"
  echo "   Use the URL above with PWABuilder (https://www.pwabuilder.com/)"
  echo "   or Bubblewrap to generate an Android APK."
  echo ""
else
  echo ""
  echo "❌ DEPLOYMENT FAILED"
  echo "   Check the error messages above."
  exit 1
fi
