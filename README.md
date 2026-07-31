# 🔄 Barter Marketplace — Full-Stack Monorepo

A complete peer-to-peer barter marketplace web application built with **React** on the frontend and **Django REST Framework** on the backend.

---

## 🚀 Overview & Key Features

- **Authentication System**: Dual login (Email or Username), user signup with profile initialization, and integrated **Google OAuth Sign-In**.
- **Coin & Trade System**: Swap goods/services directly or use coins as currency/top-ups.
- **Smart AI Matching**: AI-powered trade recommendations using Google Gemini integration.
- **Contract & PDF Generation**: Automatic generation of official PDF trade contracts using ReportLab.
- **Dispute Resolution & Logistics**: Trade dispute management and shipping/logistics tracking updates.
- **Nearby Traders**: Location-aware discovery of local traders.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Tailwind CSS, Lucide Icons, Axios, `@react-oauth/google`
- **Backend**: Django 4.x, Django REST Framework, SimpleJWT, ReportLab, Google GenAI SDK
- **Database**: SQLite (Development)

---

## ⚡ Quick Start

### 1. Backend Setup

```bash
cd backend

# Create & activate a virtual environment (optional but recommended)
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations & seed test data
python manage.py migrate
python generate_test_data.py

# Start Django development server
python manage.py runserver
```
The backend server runs at `http://localhost:8000`.

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

Make sure your `frontend/.env` file contains:
```env
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
```

```bash
# Start React development server
npm start
```
The application opens at `http://localhost:3000`.

---

## 🔑 Google OAuth Setup (Optional)

To enable Google Sign-In:
1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials.
2. Create an **OAuth 2.0 Client ID** (Application type: *Web application*).
3. Add `http://localhost:3000` to **Authorized JavaScript origins**.
4. Copy your Client ID into `frontend/.env` under `REACT_APP_GOOGLE_CLIENT_ID`.
5. Restart `npm start`.

---

## 📁 Repository Structure

```
barter-marketplace/
├── backend/
│   ├── api/                  # Core app (models, views, serializers, urls)
│   │   ├── ai_service.py     # Gemini AI matching logic
│   │   ├── pdf_service.py    # ReportLab contract PDF generator
│   │   └── views.py          # Auth, Trades, Disputes, Wallet & Profile views
│   ├── config/               # Django settings & root URL router
│   ├── generate_test_data.py # Test data seeder script
│   ├── requirements.txt      # Python dependencies
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # AppContext (Global State & Auth)
│   │   ├── lib/              # Axios client (api.js)
│   │   ├── pages/            # Auth, Feed, Explore, Wallet, Proposals, Chat, etc.
│   ├── .env                  # Environment variables
│   └── package.json
└── README.md
```

---

## 🛠️ Git Workflow & Branches

- Primary working branch: `Khushi`
- To push updates:
  ```bash
  git add .
  git commit -m "Your descriptive commit message"
  git push -u origin Khushi
  ```
