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
