#!/bin/bash
# Deploy to Railway - Step by step

echo "========================================="
echo "🚀 Friend Chat - Railway Deployment"
echo "========================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git not initialized. Run: git init"
    exit 1
fi

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📥 Installing Railway CLI..."
    npm install -g @railway/cli
fi

echo ""
echo "✓ Railway CLI installed"
echo ""
echo "Next steps:"
echo "1. Go to: https://railway.app"
echo "2. Sign up/Login with GitHub"
echo "3. Create new project"
echo "4. Connect your GitHub repository"
echo "5. Railway auto-deploys on push"
echo ""
echo "After deployment:"
echo "1. Get your Railway URL from the dashboard"
echo "2. Update SERVER_URL in public/index.html"
echo "3. Redeploy frontend to Vercel"
echo ""
echo "========================================="
