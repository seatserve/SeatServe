# SeatServe

SeatServe has a React frontend in `frontend/` and a FastAPI backend in `backend/`.

## Local Setup

Backend:

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

Frontend:

```bash
cd frontend
npm install
cp .env.example .env
npm start
```

## Deployment

Recommended MVP deployment:

| Part | Platform |
| --- | --- |
| React frontend | Vercel |
| FastAPI backend | Render |
| Database | MongoDB Atlas now, PostgreSQL/Supabase later if needed |

## Render Backend

Create a new Render Web Service from this repo.

- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`

Required environment variables:

```env
MONGO_URL=mongodb+srv://USER:PASSWORD@HOST/seatserve
DB_NAME=seatserve
JWT_SECRET=change-this-to-a-long-random-secret
CORS_ORIGINS=https://your-frontend.vercel.app
SUPER_ADMIN_EMAIL=owner@seatserve.in
SUPER_ADMIN_PASSWORD=change-this-password
```

You can also use the root `render.yaml` as a Render Blueprint.

## Vercel Frontend

Import this repo into Vercel and set the project root to `frontend`.

- Build command: `npm run build`
- Output directory: `build`

Set this frontend environment variable after the backend is deployed:

```env
REACT_APP_BACKEND_URL=https://your-backend.onrender.com
```

Redeploy the frontend after changing environment variables.

## Do Not Commit

Keep generated dependencies, local secrets, and cache folders out of Git:

- `backend/venv/`
- `frontend/node_modules/`
- `frontend/build/`
- `.env`
- `.pytest_cache/`
- `__pycache__/`
- `memory/`
- `test_reports/`
