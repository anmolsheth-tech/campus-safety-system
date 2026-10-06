# 🛡️ CampusSafe — Real-Time Campus Emergency & Safe Route Navigation Engine

> An intelligent campus safety platform combining graph-based multi-criteria routing algorithms (A*, Dijkstra), real-time hazard proximity scoring, ML-powered incident severity classification, and instant SOS emergency dispatch.

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/Tests-43%2F43_Passing-brightgreen.svg)]()

---

## 🌟 Key Features

### 1. 🧭 Multi-Criteria Safe Routing Engine
- **A\* Safety Search**: Dynamic path optimization balancing physical distance against active campus hazard perimeters and lighting scores.
- **Shortest vs. Safest vs. Recommended**: Instant side-by-side metric comparison (walking time, physical meters, and cumulative danger penalty).
- **Turn-by-Turn Waypoint Guidance**: Step-by-step navigation instructions across campus pathways and buildings.

### 2. 🗺️ Live Spatial Intelligence & GIS Map
- High-fidelity interactive Leaflet campus map.
- Real-time danger zones with color-coded severity heat rings (Low, Medium, High, Critical).
- Building/landmark directory with quick-select waypoint shortcuts and live GPS tracking simulation.

### 3. 🤖 Machine Learning Severity Classification
- Built-in NLP and feature-based severity classifier (`app/ml/severity_predictor.py`) predicting incident priority in real time with heuristic fallbacks.

### 4. 🚨 Rapid SOS & Emergency Dispatch
- One-tap SOS emergency trigger broadcasting distress signals with real-time location.
- Live security responder status tracking and emergency directory with one-click direct dialing.

### 5. 📊 Admin Mission Control & Incident Triage
- Security dashboard for verifying student incident submissions, resolving hazards, and re-calculating live campus risk scores.
- Incident metrics, severity distribution, and campus safety KPI analytics.

---

## 🏗️ Architecture & Tech Stack

```
campus-safety-system/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── algorithms/       # A*, Dijkstra, Graph representations, Risk Scorer
│   │   ├── api/              # REST Endpoints (Auth, Incidents, Routes, SOS, Campus)
│   │   ├── ml/               # Scikit-learn ML severity model & feature vectorizers
│   │   ├── models/           # SQLAlchemy database entities
│   │   ├── schemas/          # Pydantic data schemas & request validation
│   │   ├── services/         # Incident, Routing, Notification, and Analytics services
│   │   ├── main.py           # FastAPI entrypoint
│   │   └── seed.py           # Campus landmarks, graph pathways, and test data
│   └── tests/                # 43/43 Passing Pytest Unit & Integration Suite
│
└── frontend/                 # React 18 + Vite + TypeScript Application
    ├── src/
    │   ├── components/map/   # Interactive Leaflet map, layers, hazard rings, routing
    │   ├── components/ui/    # Custom accessible UI library & Mission Control design system
    │   ├── pages/            # Mission Control Dashboard, Map, Routing, SOS, Incidents, Admin
    │   ├── services/         # Axios API clients & TanStack React Query mutations
    │   └── stores/           # Zustand state management (Auth, Map layers)
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & `npm`

---

### Backend Setup

```bash
cd backend

# 1. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Initialize SQLite DB & seed campus graph data
python app/seed.py

# 4. Start FastAPI server (runs on port 8000)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

*Interactive API Docs:* `http://localhost:8000/docs`

---

### Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start Vite development server (runs on port 3000)
npm run dev
```

*Open in browser:* `http://localhost:3000`

---

## 🧪 Testing

Run the full automated backend test suite:

```bash
cd backend
source venv/bin/activate
pytest -v
```

All **43 tests** cover:
- Authentication & JWT token validation
- Incident creation, RBAC triage, and lifecycle resolution
- Haversine geometry and Graph nearest-node search
- Dijkstra and A* pathfinding validation
- Dynamic risk decay algorithms and route risk comparisons

---

## 🔐 Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Security Administrator** | `admin@demo.com` | `password123` |
| **Student** | `student@demo.com` | `password123` |

---

## 📄 License
MIT License. Built for University Campus Safety & Navigation Systems.
