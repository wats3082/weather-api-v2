# Deployment Guide

Weather API v2 deploys to **AWS Lambda via CDK** (backend) and **GitHub Pages** (frontend). This is the only supported production path.

## Architecture

```
GitHub Pages (frontend)
  ↓ (built from main branch)
  ↓ VITE_API_URL secret points to →
  ↓
API Gateway + Lambda (backend)
  ↓
DynamoDB (cache + saved locations)
  ↓
Cognito (user auth)
```

## Prerequisites

- Node.js 20+
- AWS account with CLI configured: `aws configure`
- GitHub repository (fork/clone of weather-api-v2)

## Part 1: Deploy Backend to AWS Lambda

### Step 1: Set up AWS credentials

```bash
# Ensure AWS CLI is configured with your account
aws configure
# Enter:
#   AWS Access Key ID: [your-access-key]
#   AWS Secret Access Key: [your-secret-key]
#   Default region: us-east-1
#   Default output format: json
```

### Step 2: Bootstrap CDK (first deploy only)

```bash
cd infra/cdk
npm install
npm run bootstrap
```

### Step 3: Deploy the stack

```bash
npm run deploy
```

The stack will create:
- **API Gateway** (`WeatherApi`)
- **Lambda functions** (weather, forecast, turbulence, locations CRUD)
- **DynamoDB table** (`weather-api-v2-data`) for caching and saved locations with TTL
- **Cognito User Pool** for authentication

Example output:
```
Outputs:
  ApiUrl = https://abc123.execute-api.us-east-1.amazonaws.com/prod/
  TableName = weather-api-v2-data
  UserPoolId = us-east-1_abc123xyz
  UserPoolClientId = 1a2b3c4d5e6f7g8h9i0j
```

**Save these values**—you'll need them for frontend configuration and testing.

### Step 4: Test the backend

```bash
# Test weather endpoint
curl "https://YOUR_API_URL/api/weather/Chicago"

# Test turbulence (requires auth token for saved locations)
curl -X POST "https://YOUR_API_URL/api/turbulence/predict" \
  -H "Content-Type: application/json" \
  -d '{"from":"Los Angeles","to":"New York","altitude":35000}'
```

---

## Part 2: Deploy Frontend to GitHub Pages

### Step 1: Configure GitHub repository

1. Go to your forked repository on GitHub
2. Settings → Pages
3. Under "Build and deployment":
   - Source: Deploy from a branch
   - Branch: `gh-pages` / `/ (root)`
4. Save

### Step 2: Add the API URL secret (optional, but recommended)

1. Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `VITE_API_URL`
4. Value: Your API Gateway URL from Step 1 (e.g., `https://abc123.execute-api.us-east-1.amazonaws.com/prod`)
5. Click "Add secret"

**If you don't add this secret, the frontend will not know your API base URL and requests will fail visibly.**

### Step 3: Push to main

```bash
git add .
git commit -m "Deploy weather-api-v2"
git push origin main
```

This triggers GitHub Actions, which will:
1. Run backend tests
2. Run CDK synth validation
3. Build the frontend
4. Deploy to GitHub Pages

Your site is now live at: `https://{username}.github.io/weather-api-v2`

### Step 4: Verify live API integration

1. Navigate to your GitHub Pages URL
2. Go to "Local Weather"
3. Search for a city
4. If the API URL secret is set correctly, you'll see **live data**
5. If the secret is missing, requests fail instead of falling back to mock data

---

## Part 3: Cognito User Authentication (Optional)

To enable saved locations and user authentication:

1. Go to AWS Cognito Console
2. Find your User Pool (name: `weather-api-v2-users`)
3. Create a user or enable self-service signup
4. Frontend sign-in can be added via AWS Amplify Auth (see `frontend/src/App.tsx` for integration points)

### Example: Create a test user

```bash
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_abc123xyz \
  --username testuser@example.com \
  --message-action SUPPRESS \
  --temporary-password TempPass123!
```

Then reset the permanent password via the Cognito console or CLI.

---

## Monitoring & Troubleshooting

### Check Lambda logs

```bash
# View recent turbulence prediction logs
aws logs tail /aws/lambda/WeatherApiV2Stack-TurbulencePredictFn --follow

# View weather endpoint logs
aws logs tail /aws/lambda/WeatherApiV2Stack-WeatherCurrentFn --follow
```

### Check DynamoDB cache hit rate

```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=weather-api-v2-data \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

### Frontend shows "Demo mode" with static data

- **Cause**: `VITE_API_URL` secret is not set OR backend is unreachable
- **Fix**: Add `VITE_API_URL` GitHub secret with your API Gateway URL, then re-push to trigger rebuild

### "Unauthorized" errors when calling `/api/locations`

- **Cause**: Missing Cognito auth token or invalid token
- **Fix**: Implement Cognito sign-in flow in frontend (currently locations endpoints require Cognito auth but frontend auth UI is not yet implemented)

### API calls time out or return 502

- **Cause**: Lambda cold start or upstream Open-Meteo outage/rate limiting
- **Fix**: CDK Lambda functions have 15-second timeout; verify upstream availability and cache behavior

---

## Updating the Deployment

### To update backend code

1. Make changes in `backend/src/`
2. Test locally: `npm run dev --prefix backend`
3. Push to main (triggers CI tests)
4. If tests pass, re-run: `npm run deploy --prefix infra/cdk`

### To update frontend code

1. Make changes in `frontend/src/`
2. Test locally: `npm run dev --prefix frontend`
3. Push to main (triggers frontend rebuild + deploy to GitHub Pages)

### To update infrastructure

1. Edit `infra/cdk/lib/weather-api-v2-stack.ts`
2. Run: `npm run synth --prefix infra/cdk` (validates the template)
3. Push to main (CI will synth and test)
4. Deploy: `npm run deploy --prefix infra/cdk`

---

## Architecture Decisions

### Why CDK over Serverless Framework?

- **Unified IaC**: Single source of truth for all AWS resources (API Gateway, Lambda, DynamoDB, Cognito)
- **Type-safe**: Full TypeScript support with IDE autocomplete
- **No duplication**: One stack definition (not split across `serverless.yml` and separate CDK)
- **Testable**: Easy to write unit tests for infrastructure logic
- **Maintainable**: Clear resource dependencies and outputs

### Why GitHub Pages frontend?

- **Free hosting** with built-in GitHub Pages (no separate hosting cost)
- **CI/CD included** (GitHub Actions automatically builds and deploys on push)
- **CORS friendly** (can call cross-origin API Gateway URLs)

### Why DynamoDB with TTL?

- **Distributed cache**: In-memory fallback for local dev; DynamoDB for production
- **Cost-effective**: Pay-per-request billing (no provisioned capacity)
- **TTL cleanup**: Automatic expiration of old weather data (10-minute cache for weather, 30-minute for forecast, 24-hour for geocoding)

---

## Troubleshooting Checklist

- [ ] AWS CLI configured: `aws sts get-caller-identity`
- [ ] CDK bootstrap run: `npm run bootstrap --prefix infra/cdk`
- [ ] Backend tests passing: `npm run test --prefix backend`
- [ ] CDK synth validates: `npm run synth --prefix infra/cdk`
- [ ] Stack deployed: `aws cloudformation describe-stacks --stack-name WeatherApiV2Stack`
- [ ] Frontend `VITE_API_URL` secret set
- [ ] GitHub Pages enabled in repository settings
- [ ] Backend logs clean: `aws logs tail /aws/lambda/WeatherApiV2Stack --follow`

---

## Support

For issues:

1. Check GitHub Actions logs (repository → Actions tab)
2. Check AWS CloudWatch logs (see "Monitoring & Troubleshooting" above)
3. Verify environment variables and secrets are set correctly
4. Test API endpoints manually with `curl` or Postman
5. Check that Open-Meteo is reachable and returning forecast/geocoding data
