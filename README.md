# TriLens_AI — Smart Campus Parking Management System

>  Edge AI + QR + PWA + MongoDB Atlas

---
Live URL=https://trilens-ai.netlify.app
## Overview

TriLens_AI is a full-stack, mobile-first Progressive Web Application that replaces traditional manual campus parking management with a sensorless, AI-assisted digital system.

**Core Capabilities:**
- **Dynamic Parking Management:** Multi-building, multi-floor space tracking and block administration.
- **Role-Based Access Control (RBAC):** Distinct interfaces for Students, Block Admins, and Super Admins.
- **Edge AI Vehicle Retrieval:** TensorFlow.js (COCO-SSD) on-device landmark detection for visual context hints.
- **QR-Code Spot Identification:** Static physical QR codes to prevent check-in spoofing.
- **Concurrency Control:** Atomic MongoDB transactions to prevent double-booking.
- **Offline-capable PWA:** Includes LocalStorage AI caching and a seamless web app installation experience.
- **Analytics & Reporting:** Live visual dashboards for system health, global occupancy, and block-level logs.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React.js + Vite |
| **Styling** | Tailwind CSS v3 |
| **Routing** | React Router DOM v6 |
| **HTTP Client** | Axios |
| **QR Engine** | html5-qrcode & qrcode |
| **Edge AI** | TensorFlow.js + COCO-SSD |
| **PWA Support** | vite-plugin-pwa + Workbox |
| **Backend** | Node.js + Express.js |
| **Authentication**| JWT + bcryptjs |
| **Database** | MongoDB Atlas + Mongoose |

---

## Project Structure

```
TriLens_AI/
├── backend/
│   ├── config/db.js
│   ├── controllers/ (auth, admin, parking, user, block)
│   ├── middleware/auth.js
│   ├── models/ (User, Building, Block, Space, ParkingLog)
│   ├── routes/ (auth, admin, parking, user, block)
│   ├── server.js
│
│
└── frontend/
    ├── public/ (PWA icons and manifest)
    ├── src/
    │   ├── components/ (Header, Footer, InteractiveMap, etc.)
    │   ├── context/AuthContext.jsx
    │   ├── pages/ (Login, Dashboard, BlockAdmin, UsersPage, Reports, etc.)
    │   ├── utils/ (api.js, aiVision.js)
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── tailwind.config.js
    └── vite.config.js
```

---

## Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)
- npm v9+

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

Edit `backend/.env`:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/database_name?retryWrites=true&w=majority
JWT_SECRET=trilens_super_secret_key_2024
PORT=5000
```
### 3. Run Development Servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:5000

---

## Architecture Flow

### 1. User Flows
- **Students:** Sign up/login, scan QR or pick spot on Interactive Map, activate camera for AI landmark extraction, confirm parking.
- **Block Admins:** Monitor assigned block occupancy, manage active vehicles, search by vehicle number, forced checkout.
- **Super Admins:** Full system control, manage Users, assign Roles, generate QR codes, view System Health & Global Reports.

### 2. Concurrency Control
Check-in uses MongoDB session transactions:
1. `findOneAndUpdate` with `status: "available"` atomically claims the space.
2. If space is already occupied → `409 Space Already Taken`.
3. Full rollback on any intermediate failure.

### 3. Edge AI Context Storage
1. On parking, TensorFlow.js COCO-SSD detects surroundings (e.g., "Near the Fire Extinguisher").
2. Hint is stored in MongoDB; captured frame is stored locally in IndexedDB/LocalStorage.
3. No user images are sent to the backend to ensure privacy.

*TriLens_AI — Smart Parking with Edge AI*
