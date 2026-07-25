# Deployment Guide

This guide explains how to deploy Weather API v2 to GitHub Pages (frontend) and AWS Lambda (backend).

## Part 1: GitHub Pages Deployment (Frontend)

### Step 1: Create a GitHub Repository

1. Go to https://github.com/new
2. Create repository named: `weather-api-v2`
3. Copy the repository URL (HTTPS or SSH)

### Step 2: Push Code to GitHub

```bash
cd weather-api-v2

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: Weather API v2 with turbulence prediction"

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/weather-api-v2.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Configure GitHub Pages

1. Go to your repository on GitHub
2. Settings → Pages
3. Under "Source" select:
   - Branch: `gh-pages`
   - Folder: `/ (root)`
4. Save

The site will be available at: `https://YOUR_USERNAME.github.io/weather-api-v2`

### Step 4: Set Backend API URL (Optional)

If deploying backend to AWS or another service, add a GitHub Secret:

1. Go to Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `VITE_API_URL`
4. Value: Your backend API URL (e.g., `https://abc123.execute-api.us-east-1.amazonaws.com`)

The GitHub Actions workflow will use this when building.

---

## Part 2: AWS Lambda Deployment (Backend)

### Prerequisites

- AWS account
- AWS CLI configured locally
- Serverless Framework installed: `npm install -g serverless`

### Step 1: Configure AWS Credentials

```bash
# Configure AWS CLI
aws configure

# Enter:
# AWS Access Key ID: [your-key]
# AWS Secret Access Key: [your-secret]
# Default region: us-east-1
# Default output format: json
```

### Step 2: Set Environment Variables

```bash
# Linux/Mac
export OPENWEATHER_API_KEY=your_api_key_here

# Windows (PowerShell)
$env:OPENWEATHER_API_KEY='your_api_key_here'
```

### Step 3: Deploy to AWS

```bash
cd backend
npm install
npm run deploy
```

This will:
- Create Lambda functions
- Create API Gateway endpoints
- Output your API URL (e.g., `https://abc123.execute-api.us-east-1.amazonaws.com/api/...`)

### Step 4: Update GitHub Secret

Add the API URL from step 3 to GitHub as `VITE_API_URL` secret (see Part 1, Step 4)

### Step 5: Redeploy Frontend

Push to GitHub to trigger automatic rebuild with the new backend URL:

```bash
git add .
git commit -m "Update backend API URL"
git push
```

---

## Part 3: Alternative Backend Hosting

If you prefer not to use AWS Lambda, you can deploy the backend to:

### Render (Free tier available)
```bash
# Create account at https://render.com
# Deploy from GitHub
# Set environment variable: OPENWEATHER_API_KEY
```

### Railway.app
```bash
# Create account at https://railway.app
# Deploy from GitHub
# Set environment variable: OPENWEATHER_API_KEY
```

### Heroku (Legacy - being sunset)
```bash
heroku login
heroku create
git push heroku main
```

---

## Part 4: Monitoring & Maintenance

### Check GitHub Actions Status
1. Go to your repository
2. Click "Actions" tab
3. View deployment logs

### AWS Monitoring
```bash
# View Lambda logs
aws logs tail /aws/lambda/weather-api-v2-turbulencePredict --follow

# Monitor API Gateway usage
# AWS Console → API Gateway → Your API → CloudWatch
```

### Update Secrets
To update your OpenWeather API key:

**For GitHub Actions:**
1. Settings → Secrets and variables → Actions
2. Update `VITE_API_URL` if backend URL changes

**For AWS:**
```bash
# Update environment variable
serverless deploy function -f turbulencePredict
```

---

## Troubleshooting

### GitHub Pages shows 404
- Verify base path is correct in `frontend/vite.config.ts`
- Check "gh-pages" branch exists
- Wait 1-2 minutes for GitHub Pages to rebuild

### API calls return 404
- Verify `VITE_API_URL` is set correctly
- Check backend is deployed and running
- Test backend directly: `curl https://your-api-url/api/weather/Chicago`

### CORS errors
- Ensure backend CORS headers are set (they are by default)
- Check browser console for exact error message

### Frontend builds fail
- Check GitHub Actions logs
- Verify `VITE_API_URL` secret is set (can be empty for development)
- Ensure all dependencies are in package.json

---

## CI/CD Pipeline

The GitHub Actions workflow automatically:

1. **On every push to main branch:**
   - Installs dependencies
   - Builds React frontend
   - Builds TypeScript backend
   - Deploys frontend to GitHub Pages
   - Reports backend build status

2. **On pull requests:**
   - Runs the same build checks
   - Prevents merging if build fails

---

## Final Checklist

- [ ] Created GitHub repository
- [ ] Pushed code to GitHub
- [ ] GitHub Pages enabled and building
- [ ] GitHub Actions workflow running successfully
- [ ] Frontend accessible at `YOUR_USERNAME.github.io/weather-api-v2`
- [ ] (Optional) Backend deployed to AWS/Render/Railway
- [ ] (Optional) `VITE_API_URL` secret set in GitHub
- [ ] (Optional) Backend API URL working

---

## Support

For issues:
1. Check GitHub Actions logs
2. Check AWS CloudWatch logs
3. Verify environment variables
4. Test API endpoints manually with curl/Postman
