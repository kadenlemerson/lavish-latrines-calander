# Lavish Latrines Business Platform

A full-stack web application for managing a luxury portable restroom trailer rental business in Vancouver, WA.

## Features

- **Public Booking Flow** — customers select a date, fill out details, pay a 50% deposit via Square, and digitally sign the rental contract
- **Availability Calendar** — auto-blocks dates when both trailers are booked; shows 1-remaining indicator
- **Invoice Generation** — PDF invoices emailed to customers after booking
- **Admin Dashboard** — overview, bookings, customers, calendar, quotes, revenue charts, staff management
- **Staff View** — read-only access to bookings and calendar
- **Revenue Analytics** — monthly charts, deposit tracking, balance outstanding
- **Quote Requests** — separate form for multi-day/complex events, admin review flow
- **Email System** — booking confirmations with invoice attachment, quote acknowledgments
- **Square Payments** — secure card processing for deposits

## Quick Start

### 1. Install Dependencies

```bash
npm run install:all
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Start Development Servers

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### Default Login Credentials

| Role  | Email                        | Password  |
|-------|------------------------------|-----------|
| Admin | admin@lavishlatrines.com     | admin123  |
| Staff | staff@lavishlatrines.com     | staff123  |

> **⚠ Change these passwords immediately in production!**

## Configuration

### Square Payments

1. Create a free account at [developer.squareup.com](https://developer.squareup.com)
2. Create a new application
3. Go to **Credentials** tab → copy your **Sandbox** credentials
4. Add to `.env`:
   ```
   SQUARE_ENVIRONMENT=sandbox
   SQUARE_ACCESS_TOKEN=sandbox-...
   SQUARE_LOCATION_ID=...
   SQUARE_APP_ID=sandbox-sq0idb-...
   ```
5. For production, use **Production** credentials and set `SQUARE_ENVIRONMENT=production`
6. Update `client/index.html` to use the production Square SDK:
   ```html
   <!-- Change this line: -->
   <script src="https://sandbox.web.squarecdn.com/v1/square.js"></script>
   <!-- To: -->
   <script src="https://web.squarecdn.com/v1/square.js"></script>
   ```

### Email (Gmail)

1. Enable 2-Factor Authentication on your Gmail account
2. Go to **Google Account → Security → App Passwords**
3. Create an App Password for "Mail"
4. Add to `.env`:
   ```
   EMAIL_USER=yourgmail@gmail.com
   EMAIL_PASS=xxxx-xxxx-xxxx-xxxx  # 16-char app password
   EMAIL_FROM="Lavish Latrines <yourgmail@gmail.com>"
   ```

## Tech Stack

| Layer    | Technology                         |
|----------|------------------------------------|
| Frontend | React 18 + Vite + Tailwind CSS     |
| Backend  | Node.js + Express                  |
| Database | SQLite (better-sqlite3)            |
| Auth     | JWT (jsonwebtoken)                 |
| Payments | Square Web Payments SDK            |
| Email    | Nodemailer                         |
| PDF      | PDFKit                             |
| Charts   | Recharts                           |
| Signing  | signature_pad (HTML5 Canvas)       |

## Production Deployment

1. Build the frontend:
   ```bash
   npm run build
   ```
2. Set `NODE_ENV=production` in your `.env`
3. The Express server will serve the built frontend automatically
4. Run: `cd server && npm start`

The database file (`server/lavish_latrines.db`) is created automatically on first run.

## Business Rules

- **2 trailers** owned — each day can have max 2 bookings
- **Base price** — $1,100 per trailer per day
- **Deposit** — 50% ($550) collected at booking
- **Balance** — $550 due at delivery
- Dates auto-block when both trailers are booked

## User Roles

| Role     | Capabilities                                          |
|----------|-------------------------------------------------------|
| Admin    | Full access — view, edit, delete, revenue, staff mgmt |
| Employee | Read-only — bookings, calendar, customer info         |
| Customer | Public booking, quote requests (no login required)    |
