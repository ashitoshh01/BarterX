# 🔄 Barter — Frontend

A React-based marketplace for bartering goods and services.

---

## ⚡ Quick Start (for team members)

### Prerequisites
Make sure you have these installed:
- **Node.js** ≥ 20 (v24 recommended) — [nodejs.org](https://nodejs.org)
- **npm** — comes with Node.js (no extra install needed)

### 1. Clone & install
```bash
git clone <repo-url>
cd uiui/frontend
npm install
```

> ✅ An `.npmrc` is already included that handles peer dependency conflicts automatically — no extra flags needed.

### 2. Configure environment
```bash
# Copy the example env file
cp .env.example .env
```

Open `.env` and set `REACT_APP_BACKEND_URL` to your backend's address:
```env
REACT_APP_BACKEND_URL=http://localhost:8001   # local backend
# or
REACT_APP_BACKEND_URL=https://api.your-team-server.com  # shared/deployed backend
```

### 3. Run the frontend
```bash
npm start
```

Opens at → **http://localhost:3000**

---

## 🌐 Share with teammates on the same network

If your teammates are on the **same Wi-Fi or LAN**, they can open the app directly from your machine — no deployment needed.

**Windows** (PowerShell or CMD):
```bash
npm run start:network
# or manually:
set HOST=0.0.0.0 && npx craco start
```

**Mac / Linux**:
```bash
HOST=0.0.0.0 npm start
```

Then find your local IP and share with teammates:
- **Windows**: run `ipconfig` → look for "IPv4 Address"
- **Mac/Linux**: run `ifconfig | grep inet`

```
http://<YOUR_IP>:3000
```
e.g. `http://192.168.1.42:3000`

> **Note**: Both machines must be on the same Wi-Fi/network. Make sure Windows Firewall allows port 3000 (or temporarily disable it for the Local Network profile).

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── App.js            # Router & page layout
│   ├── lib/
│   │   └── api.js        # ← Axios client (use this for all backend calls)
│   ├── context/
│   │   └── AppContext.jsx # Global state
│   ├── pages/            # One file per route
│   ├── components/       # Shared UI components
│   ├── mock/             # Mock data (used while backend is not connected)
│   └── constants/        # Test IDs, enums
├── .env                  # Your local config (git-ignored)
├── .env.example          # Template to copy ↑
└── package.json
```

---

## 🔌 Connecting to the Backend

All API calls should go through the centralized client:

```js
import api from "@/lib/api";

// GET  /api/status
const { data } = await api.get("/status");

// POST /api/status
const { data } = await api.post("/status", { client_name: "web" });
```

The client automatically:
- Points to `REACT_APP_BACKEND_URL` from your `.env`
- Attaches the auth token (`barter_token` from localStorage) to every request
- Redirects to `/auth` on 401 Unauthorized

---

## 🛠️ Available Scripts

| Command | What it does |
|---|---|
| `npm start` | Dev server on `localhost:3000` |
| `npm run start:network` | Dev server visible on local network |
| `npm run build` | Production build in `build/` |
| `npm test` | Run tests |

---

## 🗺️ Routes

| Path | Page |
|---|---|
| `/` | Landing |
| `/auth` | Login / Register |
| `/onboarding` | New user onboarding |
| `/app/feed` | Main feed |
| `/app/explore` | Explore listings |
| `/app/create` | Create a listing |
| `/app/matches` | AI-matched trades |
| `/app/proposals` | Trade proposals |
| `/app/chat` | Conversations |
| `/app/wallet` | Wallet & history |
| `/app/profile` | User profile |
