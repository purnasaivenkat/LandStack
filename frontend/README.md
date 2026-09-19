# 🎨 LandStack Frontend — Member 4 Starter Kit

This is the **ready-to-run** frontend for the LandStack platform, built by **Member 2** as a handover base.

---

## 🚀 Quick Start (No build step needed!)

Just open the file in your browser:

```
frontend/index.html  ← double-click to open
```

Or serve it locally:
```bash
# Python (any machine)
python -m http.server 3000 --directory frontend

# Node.js
npx -y serve frontend -p 3000
```

Then open: **http://localhost:3000**

---

## 🔐 Demo Login Credentials

| Role    | Username       | Password     |
|---------|---------------|--------------|
| Citizen | citizen_abc   | password123  |
| Officer | officer_ravi  | password123  |
| Admin   | admin_sharma  | password123  |

> Currently running in **Mock Data mode** — no backend needed to demo.

---

## 📁 File Structure

```
frontend/
├── index.html          ← Single-page app shell (all pages inside)
├── css/
│   └── style.css       ← Complete design system (DO NOT delete)
└── js/
    ├── api.js          ← Backend API client + MOCK data
    └── app.js          ← All page logic and rendering
```

---

## 🔌 Connecting to Live Backend

In `js/app.js`, line 1:

```js
const state = {
  useMock: true,   // ← change to false when backend is running
  ...
};
```

Backend runs at: **http://localhost:8000**
Set in `js/api.js`:

```js
const BASE_URL = 'http://localhost:8000/api';
// Change to your deployed Supabase URL or production URL
```

---

## 📄 Pages Included

| Page | Route Key | Status |
|------|-----------|--------|
| Login | — | ✅ Done |
| Dashboard | `dashboard` | ✅ Done (mock stats, alerts, activity) |
| Parcel Search | `search` | ✅ Done (filter table) |
| Unified Parcel Profile | `profile` | ✅ Done (all 8 dept tabs, anomaly score) |
| GIS Map View | `gis` | 🔲 Placeholder — Member 1 integrates here |
| Anomaly Alerts | `alerts` | ✅ Done (list + anomaly explainer cards) |
| Reports | `reports` | 🔲 Placeholder — extend with charts |
| Settings | `settings` | ✅ Done (API config, team info) |

---

## 🎨 Design Tokens (CSS Variables)

All colors and spacing are in `css/style.css` under `:root {}`.

Key colors to use:
| Token | Value | Use for |
|-------|-------|---------|
| `--gold` | `#f6c90e` | Primary brand, CTAs |
| `--blue` | `#63b3ed` | Active states, info |
| `--green` | `#48bb78` | Success, paid, verified |
| `--red` | `#fc8181` | Errors, anomalies |
| `--orange` | `#f6ad55` | Warnings |
| `--purple` | `#b794f4` | Special badges |

---

## 🤖 Member 3 (AI Agent) Integration Point

The AI chat panel can be added as a floating button → slide-in drawer.
Backend endpoint for AI tools:
```
GET /api/ai-agent/tools        ← list of available tools
POST /api/ai-agent/query       ← send a natural language query
```

See: `backend/integration_clients/member3_ai_agent_sdk.py`

---

## 🗺️ Member 1 (GIS) Integration Point

The GIS map page (`#page-gis`) is ready for the map embed.
Replace the `.map-placeholder` div with your Leaflet/Mapbox map.

Backend provides parcel geometry:
```
GET /api/parcels/{ulpin}  ← returns PostGIS geometry in GeoJSON
```

See: `backend/integration_clients/member1_gis_guide.md`

---

## 🛠️ Recommended Next Steps for Member 4

1. **Convert to React/Next.js** — Each `page-*` div becomes a React component
2. **Add charts** — Use Chart.js or Recharts for the Reports page
3. **AI Chat Panel** — Floating sidebar connecting to Member 3's agent
4. **Real-time updates** — WebSocket or Supabase Realtime for live alerts
5. **Mobile responsive** — Sidebar becomes a hamburger menu on mobile
6. **Authentication** — Switch `useMock: false` and test JWT login flow

---

*Built by Member 2 · Backend + Integration + Connectivity · LandStack 2024*
