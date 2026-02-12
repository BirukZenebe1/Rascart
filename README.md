# Overview
This project focuses on building an AI-powered recommendation system for an online shopping platform. The goal is to personalize product suggestions based on user behavior and improve overall user experience.
# Key Features
User–item interaction modeling
Personalized product recommendations
Scalable and modular system design
# Technologies
Python
Machine Learning
Data preprocessing and modeling techniques

# Deployment (Render, Low Cost)
This repo is prepared for Render using Docker:
- `Dockerfile` builds the React frontend and serves it from Flask.
- `render.yaml` defines a single web service named `merkato-ai`.

## Steps
1. Push this repo to GitHub.
2. In Render, choose **New +** -> **Blueprint** and select this repo.
3. Set environment variables in Render:
   - `MONGO_URI`
   - `JWT_SECRET_KEY`
4. Deploy.

## Custom Domain
Domain labels cannot contain spaces, so use a valid domain like:
- `merkatoai.com`
- `merkato.ai`

Then in Render service settings:
1. Open **Custom Domains**.
2. Add your purchased domain.
3. Point DNS records at Render targets shown in the dashboard.

# Netlify Frontend (Free) + Render Backend
You can host the React frontend on Netlify free tier and keep Flask API on Render.

## Netlify setup
1. Connect `BirukZenebe1/GebeyaAI` in Netlify.
2. Netlify will use `netlify.toml` from repo root:
   - Base: `frontend`
   - Build: `npm run build`
   - Publish: `frontend/build`
3. Deploy.

`netlify.toml` already includes:
- SPA route fallback (`/* -> /index.html`)
- API proxy (`/api/* -> https://merkato-ai.onrender.com/api/:splat`)

# AWS Lambda Backend Deployment
This repo is prepared to deploy the backend with:
- AWS Lambda
- API Gateway (HTTP API)
- CloudWatch Logs
- IAM role (created by SAM)

Files added:
- `template.yaml`
- `samconfig.toml`
- `backend/lambda_handler.py`

## Prerequisites
1. AWS CLI configured (`aws configure`)
2. AWS SAM CLI installed
3. Docker installed (for `sam build --use-container`)

## Deploy
From repo root:

```bash
sam build --use-container
sam deploy \
  --parameter-overrides \
  MongoUri='YOUR_MONGO_URI' \
  JwtSecretKey='YOUR_JWT_SECRET_KEY' \
  OpenAIApiKey='YOUR_OPENAI_API_KEY_OR_EMPTY'
```

After deploy, SAM prints `ApiUrl` output.

## Point frontend to AWS backend
In Netlify environment variables, set:
- `REACT_APP_API_BASE_URL=https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com`

Then redeploy Netlify frontend.
