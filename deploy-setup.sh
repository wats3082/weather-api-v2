#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Weather API v2 - GitHub Deployment Setup${NC}\n"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}Git is not installed. Please install Git first.${NC}"
    exit 1
fi

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo -e "${BLUE}Initializing Git repository...${NC}"
    git init
    git add .
    git commit -m "Initial commit: Weather API v2 with turbulence prediction"
    echo -e "${GREEN}✓ Git repository initialized${NC}\n"
else
    echo -e "${YELLOW}Git repository already exists${NC}\n"
fi

# Instructions
echo -e "${BLUE}📋 Next Steps:${NC}\n"

echo -e "1. ${YELLOW}Create GitHub Repository:${NC}"
echo "   - Go to: https://github.com/new"
echo "   - Name: weather-api-v2"
echo "   - Choose public or private"
echo "   - Copy the HTTPS URL\n"

echo -e "2. ${YELLOW}Add Remote and Push:${NC}"
echo "   git remote add origin <YOUR_GITHUB_URL>"
echo "   git branch -M main"
echo "   git push -u origin main\n"

echo -e "3. ${YELLOW}Enable GitHub Pages:${NC}"
echo "   - Go to: Settings → Pages"
echo "   - Source: Deploy from a branch"
echo "   - Branch: gh-pages, /(root)"
echo "   - Save\n"

echo -e "4. ${YELLOW}(Optional) Set Backend API URL:${NC}"
echo "   - Settings → Secrets and variables → Actions"
echo "   - New secret: VITE_API_URL"
echo "   - Value: Your backend URL\n"

echo -e "${GREEN}Your site will be live at:${NC}"
echo "   https://YOUR_USERNAME.github.io/weather-api-v2\n"

echo -e "${BLUE}For full deployment guide, see: DEPLOYMENT.md${NC}"
