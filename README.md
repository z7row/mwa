<div align="center">

<img src="public/logo.png" alt="MWA logo" width="120" />

# MWA — My Works API

**A private dashboard to manage your projects, with a public read-only API that feeds your portfolio.**

![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![Auth](https://img.shields.io/badge/Auth-Password%20%2B%20TOTP%202FA-D99FF5)
![Deploy](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)

</div>

---

## Overview

MWA is a single-owner content manager. You log in to a protected dashboard, add your projects (image, name, description, date, link), and your portfolio websites read them through one public endpoint. Add or edit a project once, and every portfolio that uses the API updates by itself.

- **Private side:** dashboard protected by password + optional 2FA.
- **Public side:** one read-only endpoint that returns **only your own projects** (`type = created`). Projects you marked as *received* are never exposed.

## Screenshots

| Login | 2FA code |
|---|---|
| ![Login](docs/screenshots/01-login.png) | ![2FA code](docs/screenshots/02-2fa-code.png) |

![My Works](docs/screenshots/03-my-works.png)

| Create / Update | Enable 2FA |
|---|---|
| ![Create](docs/screenshots/04-create.png) | ![Security](docs/screenshots/05-security-2fa.png) |

> Screenshots use demo data.

## Features

- Password login (bcrypt hash kept in an environment variable, never in the database)
- Two-factor authentication (TOTP, works with Google Authenticator / Authy), enabled with a QR code
- Create, update and delete projects: image, name, description, date, link
- Two project types: **Created** (yours) and **Received** (websites you delivered), with a filter
- Images are resized in the browser before upload (max 640px wide, JPEG)
- Public read-only API for your portfolio, with CORS limited to your own sites
- Short sessions: 5 minutes of inactivity, 1 hour maximum
- Design based on the *Bold Editorial Motion* system: condensed display type, pill buttons, flat surfaces, one colour theme per section

## Tech stack

| Layer | Tool |
|---|---|
| Framework | Next.js 14 (App Router, Route Handlers) |
| Database | MongoDB (Atlas recommended) |
| Auth | `bcryptjs`, `jose` (JWT in an httpOnly cookie), `otplib` (TOTP), `qrcode` |
| Styling | Plain CSS, Bebas Neue + Inter |

## How it works

```mermaid
flowchart LR
  Owner([You]) -->|password + 2FA| Dash[Dashboard /works]
  Dash -->|create / update / delete| API[Next.js API routes]
  API --> DB[(MongoDB)]
  Site1([Portfolio site 1]) -->|GET /api/public/works| Pub[Public endpoint]
  Site2([Portfolio site 2]) -->|GET /api/public/works| Pub
  Pub -->|only type = created| DB
```

**Login flow**

```mermaid
sequenceDiagram
  participant U as You
  participant S as MWA server
  U->>S: POST /api/auth/login (password)
  alt 2FA is off
    S-->>U: session cookie (5 min, sliding)
  else 2FA is on
    S-->>U: temporary cookie (5 min, 2FA step only)
    U->>S: POST /api/auth/verify (6-digit code)
    S-->>U: session cookie (5 min, sliding)
  end
```

## Getting started

### Requirements

- Node.js 18+
- A MongoDB database (local, or a free Atlas cluster)

### 1. Install

```bash
npm install
```

### 2. Create your password hash

```bash
npm run hash -- "your-long-password-at-least-12-chars"
```

Copy the long text it prints. That is your `ADMIN_HASH`.

### 3. Environment variables

Create a file named `.env.local` in the project root (see `.env.example`):

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string (32+ chars). **Must be different from your password.** Anyone who knows it can forge a session |
| `ADMIN_HASH` | Output of `npm run hash` |
| `PORTFOLIO_ORIGIN` | Sites allowed to call the public API from the browser, comma separated, no trailing slash. Empty or `*` allows any site |

```dotenv
MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net
JWT_SECRET=put-a-long-random-string-here
ADMIN_HASH=paste-the-output-of-npm-run-hash
PORTFOLIO_ORIGIN=https://site-one.com,https://site-two.com
```

### 4. Run

```bash
npm run dev
```

Open `http://localhost:3000`, log in, then go to **Security / 2FA** and enable two-factor authentication.

## Using the API in your portfolio

Request this URL from your portfolio (no login, no headers):

```
GET https://mwa-psi.vercel.app/api/public/works
```

Example (Next.js Server Component):

```jsx
export default async function Projects() {
  const res = await fetch('https://mwa-psi.vercel.app/api/public/works', { next: { revalidate: 60 } });
  const works = await res.json();
  return works.map(w => (
    <a key={w.id} href={w.link} target="_blank">
      {w.image && <img src={w.image} alt={w.name} />}
      <h3>{w.name}</h3>
      <p>{w.description}</p>
    </a>
  ));
}
```

Response:

```json
[
  {
    "id": "66f...",
    "name": "Restaurant Landing Page",
    "description": "One-page site for a local restaurant.",
    "date": "2026-09-12",
    "link": "https://example.com",
    "image": "https://mwa-psi.vercel.app/api/public/works/66f.../image"
  }
]
```

Changes show up on your portfolio within about a minute (cache).

## API reference

### Public (no login)

| Method | Route | Description |
|---|---|---|
| GET | `/api/public/works` | Your projects (`type = created`), newest first |
| GET | `/api/public/works/:id/image` | The project image (cached for a day) |

### Auth

| Method | Route | Body | Description |
|---|---|---|---|
| GET | `/api/auth/status` | | Session state |
| POST | `/api/auth/login` | `{ password }` | Step 1 |
| POST | `/api/auth/verify` | `{ code }` | Step 2, only when 2FA is on |
| POST | `/api/auth/logout` | | Clears the session |
| POST | `/api/auth/2fa-setup` | | Returns a QR code and secret (login required) |
| POST | `/api/auth/2fa-enable` | `{ code }` | Confirms and turns on 2FA |
| POST | `/api/auth/2fa-disable` | `{ password }` | Turns off 2FA |

### Works (login required)

| Method | Route | Description |
|---|---|---|
| GET | `/api/works` | All projects |
| POST | `/api/works` | Create a project |
| PUT | `/api/works/:id` | Update a project |
| DELETE | `/api/works/:id` | Delete a project |

**Project fields**

| Field | Rules |
|---|---|
| `name` | required, max 100 characters |
| `description` | max 2000 characters |
| `date` | `YYYY-MM-DD` |
| `link` | must start with `http://` or `https://` |
| `type` | `created` or `received` |
| `img` | data URL (jpeg, png, webp, gif), about 900 KB max |

## Where the data lives

Everything is stored in MongoDB, including images (as base64 text inside each project document). Nothing is written to the server's disk, which is why it works on Vercel.

## Deploying to Vercel

1. Push the project to GitHub and import it in Vercel.
2. Add the four environment variables in **Settings → Environment Variables**. `.env.local` is not uploaded.
3. Use **MongoDB Atlas**. In Atlas **Network Access**, allow `0.0.0.0/0` (Vercel IPs change), and use a strong database username and password.
4. Deploy, then log in and enable 2FA.

## Security

What is in place:

- Every create, update and delete route checks the session on the server, and the dashboard pages are guarded by middleware
- The password is stored only as a bcrypt hash, in an environment variable
- Session cookie is `httpOnly`, `SameSite=Strict` and `Secure` in production
- Sessions expire after 5 minutes without activity, with a 1 hour hard limit
- Login and 2FA attempts are rate limited (10 per 15 minutes per IP)
- Inputs are validated on the server (links, image type and size, ids)
- The public endpoint is read-only and never returns *received* projects

Known limitations:

- The rate limiter lives in server memory. On Vercel (multiple instances) it is only a speed bump. Use Redis (for example Upstash) for a real limit
- The 2FA secret is stored unencrypted in the database, a used code can be replayed inside its 30 second window, and there are no backup codes. If you lose your phone, delete the `totp` field from the document `_id: "auth"` in the `settings` collection
- CORS only restricts browsers. The public data can still be fetched by anyone, which is fine because it is the same data your portfolio shows
- No Content-Security-Policy headers yet

## Project structure

```
app/
  page.js                      login + 2FA screen
  works/page.js                dashboard (works, create, security)
  api/
    auth/[action]/route.js     login, verify, logout, 2FA
    works/route.js             list + create
    works/[id]/route.js        update + delete
    public/works/              public read-only API + images
lib/                           db, session, rate limit, validation, CORS, image resize
scripts/hash.js                password hash generator
middleware.js                  route protection + sliding session
```

---

<div align="center">Built by Zeyad</div>
