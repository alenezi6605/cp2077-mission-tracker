# CP2077 Mission Tracker

A Cyberpunk 2077 themed mission tracker. Log your main jobs, side jobs, and gigs. Track priorities, update statuses, and never lose a contract in Night City again.

**Live:** [http://13.232.3.198:3000](http://13.232.3.198:3000)

---

## Screenshot

![CP2077 Mission Tracker](screenshot.png)

> Replace `screenshot.png` with an actual screenshot of the app.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22 |
| Framework | Express 4 |
| Database | SQLite (better-sqlite3) |
| Frontend | Vanilla HTML / CSS / JavaScript |
| Container | Docker (node:22-alpine) |
| CI/CD | GitHub Actions |
| Hosting | AWS EC2 |

---

## Features

- Add missions with a name, category, and priority level
- Categories: Main Jobs, Side Jobs, Gigs
- Priority levels: Very High, High, Moderate, Low, Very Low
- Statuses: Active, Tracked, Completed, Failed
- Filter missions by status and category
- Cyberpunk 2077 themed UI with glitch effects
- Persistent SQLite storage via Docker volume
- Fully containerized — runs identically in dev and production

---

## Local Setup

### Prerequisites

- [Node.js 22+](https://nodejs.org/) or [Docker](https://www.docker.com/)

### Option A — Run with Node.js directly

```bash
git clone https://github.com/alenezi6605/cp2077-mission-tracker.git
cd cp2077-mission-tracker

cp .env.example .env
# Edit .env if needed

npm install
npm start
```

App will be available at [http://localhost:3000](http://localhost:3000).

### Option B — Run with Docker

```bash
git clone https://github.com/alenezi6605/cp2077-mission-tracker.git
cd cp2077-mission-tracker

docker build -t cp2077-mission-tracker .
docker run -d \
  --name cp2077-mission-tracker \
  --restart unless-stopped \
  -p 3000:3000 \
  -v cp2077-data:/app/data \
  cp2077-mission-tracker
```

App will be available at [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the server listens on |
| `NODE_ENV` | `development` | Node environment (`development` or `production`) |

Copy `.env.example` to `.env` to configure locally. Never commit `.env`.

---

## Project Structure

```
cp2077-mission-tracker/
├── .github/workflows/ci.yml   # CI/CD pipeline (build + EC2 deploy)
├── public/
│   ├── index.html             # App shell
│   ├── css/style.css          # Cyberpunk theme styles
│   └── js/app.js              # Frontend logic
├── src/
│   ├── server.js              # Express app entry point
│   ├── db.js                  # SQLite database setup
│   └── routes/missions.js     # REST API routes
├── .env.example               # Environment variable template
├── Dockerfile                 # Container build definition
└── package.json
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/missions` | List missions (supports `?filter=` and `?category=`) |
| POST | `/api/missions` | Create a new mission |
| PATCH | `/api/missions/:id/status` | Update mission status |
| DELETE | `/api/missions/:id` | Delete a mission |

---

## Deployment

Deployments are automated via GitHub Actions on every push to `main`. The workflow:

1. Installs dependencies and runs a smoke test
2. Builds a Docker image
3. SSHs into the EC2 instance and rebuilds the container

Required GitHub repository secrets:

| Secret | Description |
|---|---|
| `EC2_HOST` | EC2 instance IP or hostname |
| `EC2_USER` | SSH username (e.g., `ubuntu`) |
| `EC2_SSH_KEY` | Private SSH key for EC2 access |
