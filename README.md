# EasyEvent (Bengaluru Crew Hub) 🎪

> Premium event crew staffing and operations management platform tailored for Bengaluru's exhibitions, expos, conferences, and cultural galas.

[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?logo=vite)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.1-61DAFB?logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

---

## ✨ Key Features

1. **📱 Responsive SaaS UI with Premium Typography**
   - Styled with Google Fonts (`Outfit` for crisp headers + `Plus Jakarta Sans` for body text).
   - Pixel-perfect layout adaptation for desktop screens, tablets, and mobile devices.

2. **🌐 Comprehensive Multi-Language Support (11 Indian Languages)**
   - Complete contextual translations in native scripts without script contamination:
     - English, Hindi (`हिन्दी`), Kannada (`ಕನ್ನಡ`), Tamil (`தமிழ்`), Telugu (`తెలుగు`), Malayalam (`മലയാളം`), Gujarati (`ગુજરાતી`), Marathi (`मराठी`), Bengali (`বাংলা`), Punjabi (`ਪੰਜਾਬੀ`), Odia (`ଓଡ଼ିଆ`).

3. **🔐 Smart Auth Justification Flow**
   - Clean, segmented interface switching between **🔑 Log In** and **✍️ Sign Up**.
   - Context-aware UX: new visitors default to account registration (**Sign Up**), while returning users default to authentication (**Log In**).
   - Dedicated quick 1-click test drives for **Worker**, **Organizer**, and **Admin**.

4. **💼 Isolated Role Dashboards**
   - **Crew / Worker Dashboard**:
     - Live shift roster with one-click status transitions (`Reporting`, `Completed`).
     - Dynamic **Daily Earnings Calculation** in Indian Rupees (`₹`), based on hourly duties and attended shift duration.
     - Access to confidential supervisor briefings, secret gate entrance codes, and coordinator contacts for assigned events.
   - **Organizer Studio**:
     - Publish new staffing requests and manage shift vacancies.
     - Upload **1 or 2 Venue Entrance Photos** to guide arriving crew.
     - Broadcast confidential briefings visible exclusively to attending crew.
   - **Admin Console**:
     - System oversight, staffing request approval pipeline, and user role management.

5. **⚡ Supabase PostgreSQL Database Integration**
   - Live integration with Supabase using modern publishable anon and secret service role keys.
   - Fully resilient architecture with seamless automatic fallback to in-memory store if tables are being seeded.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)

### 1. Clone & Configure

```bash
git clone https://github.com/bott4707-cloud/EasyEvent.git
cd EasyEvent
```

Copy the environment file:
```bash
cp .env.example backend/.env
```

Set your Supabase credentials in `backend/.env`:
```env
SUPABASE_PROJECT_ID=zjjeeysydlpmzzgbpzrz
SUPABASE_URL=https://zjjeeysydlpmzzgbpzrz.supabase.co
SUPABASE_ANON_KEY=your_publishable_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Run Database Migrations (Supabase)
1. Open the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql).
2. Copy and execute [backend/supabase-schema.sql](backend/supabase-schema.sql).
3. All tables (`users`, `events`, `staffing_requests`, `shifts`, `sessions`) and seed data will be created with Row Level Security (RLS) enabled.

### 3. Start Backend Server
```bash
cd backend
npm install
npm run dev
```
Backend API will listen at: `http://127.0.0.1:8000`

### 4. Start Frontend Client
```bash
cd frontend
npm install
npm run dev
```
Frontend application will be live at: `http://localhost:5173`

---

## 📁 Repository Structure

```
EasyEvent/
├── backend/
│   ├── src/
│   │   ├── db.js             # Database queries with Supabase & resilient fallback
│   │   ├── server.js         # Express REST API & session management
│   │   └── supabase.js       # Supabase client initialization
│   ├── supabase-schema.sql   # Complete PostgreSQL schema & seed migration
│   ├── .env.example          # Backend environment example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components (Navbar, Modals, StatCards)
│   │   ├── context/          # LanguageContext (11 Indian languages) & AuthContext
│   │   ├── pages/            # HomePage, AuthPage, Role Dashboards
│   │   └── services/         # API client & backend connection
│   ├── .env.example          # Frontend environment example
│   ├── vite.config.ts        # Vite build configuration with proxy
│   └── package.json
├── .env.example              # Project root environment example
├── .gitignore                # Git ignore configuration
└── README.md                 # Project documentation
```

---

## 🔒 Security & Privacy
- Passwords hashed with cryptographic salt.
- Strictly isolated role authorization middleware.
- Environment variables containing secrets (`.env`) are permanently excluded from git version control.
