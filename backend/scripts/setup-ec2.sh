#!/bin/bash
# ==============================================================================
# AWS EC2 Quick-Start Setup Script for Tweetie Backend (Ubuntu 22.04 / 24.04 LTS)
# ==============================================================================
# Run this on your EC2 instance:
#   chmod +x setup-ec2.sh
#   ./setup-ec2.sh
# ==============================================================================

set -e

echo "🚀 [1/4] Updating Ubuntu package manager..."
sudo apt update -y && sudo apt upgrade -y

echo "📦 [2/4] Installing Node.js 20 LTS, npm, and git..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git

echo "⚡ [3/4] Installing PM2 process manager globally..."
sudo npm install -g pm2

echo "🔧 [4/4] Setting up Tweetie backend..."
cd "$(dirname "$0")/.."
npm install --production

echo "✅ Setup complete!"
echo "------------------------------------------------------------------------"
echo "Next steps:"
echo "1. Create your .env file with your MongoDB, JWT, and AWS credentials:"
echo "   nano .env"
echo "2. Start your backend with PM2:"
echo "   pm2 start ecosystem.config.cjs --env production"
echo "3. Save PM2 state to restart automatically on server reboot:"
echo "   pm2 save && pm2 startup"
echo "------------------------------------------------------------------------"
