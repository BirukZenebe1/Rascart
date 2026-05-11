# Rascart

Rascart is an AI-powered ecommerce experience that personalizes product discovery through a style profiling workflow.
This project demonstrates full-stack product thinking: onboarding, recommendation logic, catalog exploration, cart, and checkout flow.

## What This Project Demonstrates

- AI-assisted personalization for shopping recommendations
- End-to-end user journey with authentication and protected routes
- Product catalog filtering, sorting, and pagination
- Modular React frontend + Flask backend architecture

## Tech Stack

- Frontend: React, React Router, Tailwind CSS, Axios
- Backend: Flask, Python
- Auth: Token-based authentication
- Data Layer: Product and user profile models

## Repository Structure

- `/frontend` React web application
- `/backend` Flask API, models, auth, and recommendation-related logic

## Local Setup

### 1. Clone

```bash
git clone https://github.com/BirukZenebe1/GebeyaAI.git
cd GebeyaAI
```

### 2. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

Backend runs on `http://localhost:5001`.

Required backend environment variables:

- `MONGO_URI`
- `JWT_SECRET_KEY`
- `OPENAI_API_KEY`
- `CONTENT_MODERATION_REQUIRED=true`

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs on `http://localhost:3000`.

## Core User Flow

1. Register or login.
2. Complete the style questionnaire.
3. Receive AI-driven style analysis.
4. Browse personalized products.
5. Add to cart and complete checkout.

## Portfolio Notes

This project is suitable as a portfolio piece for:

- Full-stack development roles
- AI product engineering roles
- Ecommerce personalization and recommendation-focused roles
