# AI Knowledge Worker

An **autonomous AI-powered knowledge worker platform** built with **FastAPI**, **PostgreSQL**, and **Next.js**. It acts as an AI assistant that provides insights from AI-related news, analyzes documents, and delivers real-time analytics via an interactive dashboard.

---

## 🚀 Features

* **User Authentication**

  * Secure **Register & Login** system with JWT.
* **Interactive AI Dashboard**

  * 📊 Weekly AI news trends displayed as charts.
  * 📰 AI-generated insights (e.g., Gemini/OpenAI summaries).
  * 📂 Document Upload → Auto-analyzed using AI models.
* **Backend (FastAPI)**

  * Authentication, APIs, document parsing, and AI workflows.
* **Database (PostgreSQL)**

  * Stores users, uploaded documents, and AI insights.
* **Frontend (Next.js)**

  * Modern UI with TailwindCSS, charts, and responsive design.

---

## 🛠️ Tech Stack

**Frontend:** Next.js, React, TailwindCSS
**Backend:** FastAPI (Python)
**Database:** PostgreSQL + Alembic migrations
**Authentication:** JWT-based
**AI Models:** Gemini / OpenAI API (plug-and-play)
**Deployment:** Docker + Render / AWS / GCP

---

## 📂 Project Structure

```
ai-knowledge-worker/
│── backend/
│   ├── app/
│   │   ├── agent/                # AI agent logic
│   │   ├── connectors/           # API/data connectors
│   │   ├── tests/                # Unit tests
│   │   ├── utils/                # Helper functions
│   │   ├── auth.py               # Authentication routes
│   │   ├── config.py             # Config management
│   │   ├── db.py                 # Database session
│   │   ├── main.py               # FastAPI entrypoint
│   │   ├── models.py             # SQLAlchemy models
│   │   ├── schemas.py            # Pydantic schemas
│   │   ├── security.py           # JWT & password hashing
│   │   └── worker.py             # Background AI worker
│   ├── migrations/               # Alembic migrations
│   ├── requirements.txt
│   └── alembic.ini
│
│── dashboard/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   ├── dashboard/page.tsx    # Dashboard UI
│   │   ├── layout.tsx            # App layout
│   │   └── globals.css           # Global styles
│   ├── components/               # Reusable components
│   ├── store/                    # State management
│   ├── api.ts                    # API calls to backend
│   ├── package.json
│   └── tailwind.config.js
│
│── docker/
│   ├── Dockerfile                # Backend/Frontend build
│
│── docs/
│   └── architecture.png          # System architecture diagram
│
│── render.yaml                   # Render deployment config
│── README.md                     # Documentation
```

---

## ⚡ Installation

### 1️⃣ Clone repo

```bash
git clone https://github.com/your-username/ai-knowledge-worker.git
cd ai-knowledge-worker
```

### 2️⃣ Backend Setup (FastAPI + PostgreSQL)

```bash
cd backend
python -m venv venv
source venv/bin/activate    # (Windows: venv\Scripts\activate)
pip install -r requirements.txt
```

Set up PostgreSQL and update `.env` with credentials. Run migrations:

```bash
alembic upgrade head
```

Start FastAPI backend:

```bash
uvicorn app.main:app --reload
```

Backend runs at 👉 `http://localhost:8000`

### 3️⃣ Frontend Setup (Next.js)

```bash
cd dashboard
npm install
npm run dev
```

Frontend runs at 👉 `http://localhost:3000`

---

## ▶️ Usage

1. Register a new account (or login).
2. Access the **Dashboard** to see AI insights.
3. Upload PDFs/reports → AI extracts key insights.
4. Explore **weekly AI news trends & summaries**.

---

## 📜 License

MIT License.
