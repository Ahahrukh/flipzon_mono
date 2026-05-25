# VDelivery Mono

Quick-commerce monorepo with a React frontend and Node.js/Mongoose backend.

## Apps

- `apps/frontend`: React, Redux Toolkit, Framer Motion, responsive quick-commerce UI.
- `apps/backend`: Express, Mongoose, JWT auth, OTP verification, Razorpay order flow, seller/admin/user/delivery APIs, notifications.

## Setup

```bash
npm install
npm run dev
```

Backend runs on `http://localhost:5001` and frontend runs on `http://localhost:5173`.

Copy `.env.example` values into `.env` and replace Razorpay, Google Maps, MongoDB, and JWT values before production use.
