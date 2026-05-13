# CampusCare — Mobile App + REST Backend

A complete, demo-ready React Native (Expo) + Node/Express + Prisma + PostgreSQL implementation of the CampusCare Smart Facility Management System.

## Architecture
```
campuscare-mobile/
├── backend/    Node.js + Express + TypeScript + Prisma + PostgreSQL
├── frontend/   React Native + Expo + TypeScript
└── docs/       ERD, API spec (OpenAPI/Swagger), user stories
```

## Quick Start

### 1. Backend
```bash
cd backend
cp .env.example .env       # fill in DATABASE_URL & JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run seed               # creates demo users
npm run dev                # http://localhost:4000
```
Open Swagger docs: http://localhost:4000/api/docs

### 2. Frontend
```bash
cd frontend
cp .env.example .env       # set EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:4000
npm install
npx expo start
```
Scan QR with Expo Go on your device, or press `a`/`i` for Android/iOS.

## Demo Accounts (after seeding)
| Role     | Email                 | Password    |
|----------|-----------------------|-------------|
| Admin    | admin@campuscare.dev  | Password1!  |
| Manager  | manager@campuscare.dev| Password1!  |
| Worker   | worker@campuscare.dev | Password1!  |
| Member   | member@campuscare.dev | Password1!  |

## Tech Stack
- **Frontend:** React Native, Expo, TypeScript, React Navigation, Zustand, Axios, Zod
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, JWT auth, bcrypt, Zod, Swagger
- **Database:** PostgreSQL (use Supabase, Neon, or local)
- **Storage:** Supabase Storage (or local uploads dir for dev)

See `docs/` for ERD, API spec, and user stories.
