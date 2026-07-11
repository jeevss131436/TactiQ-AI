# TactiQ-AI

TactiQ AI is an analyst-grade soccer analytics platform that transforms event-level match data into tactical insights using AI. By combining advanced feature engineering, interactive visualizations, and structured LLM reasoning, it explains how matches unfolded through heatmaps, passing networks, player analytics, and AI-powered tactical reports.

Data comes from [StatsBomb Open Data](https://github.com/statsbomb/open-data) (free, no API key needed). AI tactical analysis is powered by Claude.

## What you need installed

- **Node.js** 18+ ([nodejs.org](https://nodejs.org))
- **Python** 3.11+ ([python.org](https://python.org))

That's it — no database, no Docker.

## 1. Get the code running

Two terminals, one for each half of the app.

### Terminal 1 — backend (API + AI analysis)

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment (this step differs by OS/shell):

```bash
# Windows PowerShell
.venv\Scripts\Activate.ps1

# Windows Git Bash
source .venv/Scripts/activate

# macOS / Linux
source .venv/bin/activate
```

Then install and run:

```bash
pip install -r requirements.txt
cp .env.example .env
```

Open `.env` and paste in an Anthropic API key (get one at [console.anthropic.com](https://console.anthropic.com)):

```
ANTHROPIC_API_KEY=sk-ant-...
```

Start the server:

```bash
uvicorn app.main:app --reload --port 8000
```

Leave this running. You should see `Uvicorn running on http://127.0.0.1:8000`. Visit `http://localhost:8000/docs` to poke at the API directly if you want.

> **Note:** Match data is fetched automatically from StatsBomb's GitHub repo the first time you ask for it — you don't need to download anything separately. (If `backend/app/data/open-data` already exists as a local clone of that repo, it's used instead and is faster, but it's optional — several GB, only clone it if you want.)

### Terminal 2 — frontend (the actual app)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**.

## 2. Using it

- The landing page and most of the dashboard (match selector, AI tactical summary, key moments, player list) work immediately — that part uses sample data so the UI has something to show without extra setup.
- The **heatmaps** (Visualizations tab, and the bottom of the AI Tactical Analysis tab) use real match data from the backend — this is where you need Terminal 1 running. If the backend isn't up, you'll see a friendly "could not load real match data" message instead of an error.
- If you regenerate an AI tactical report and get a `502` error, check your Anthropic account has credit at [console.anthropic.com](https://console.anthropic.com) — that's the most common cause.

## Project layout

```
frontend/   Next.js app (the UI)
backend/    FastAPI app (StatsBomb data + Claude tactical analysis)
```

Each has its own dependencies — install them separately as above. See `backend/.env.example` for the one environment variable the backend needs.
