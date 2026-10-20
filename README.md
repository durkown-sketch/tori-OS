# ToriOS — AI Meeting Intelligence Platform

> Transform conversations into searchable knowledge, clear summaries, and actionable next steps.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | Python + Django 4 + Django REST Framework |
| Database | Supabase PostgreSQL |
| Storage | Supabase Storage |
| AI (Primary) | Google Gemini 1.5 Flash |
| AI (Alt) | NVIDIA NIM |
| Speech-to-Text | OpenAI Whisper API |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |

## Getting Started

### 1. Clone and configure

```bash
git clone https://github.com/your-org/tori-os.git
cd tori-os
cp .env.example .env
# Fill in all values in .env
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### 3. Backend

```bash
cd backend
py -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
# Runs on http://localhost:8000
```

## Environment Variables

See `.env.example` for all required configuration.

## Deployment

- **Frontend**: Connect `frontend/` to Vercel, set `VITE_API_BASE_URL` to your Render backend URL.
- **Backend**: Connect `backend/` to Render, configure all env vars, run `python manage.py migrate` via Render shell.

## Architecture

See [Implementation Plan](./IMPLEMENTATION_PLAN.md) for full technical documentation.
