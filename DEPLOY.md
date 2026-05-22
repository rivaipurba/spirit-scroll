# SpiritScroll Deployment Guide

This guide explains how to deploy **SpiritScroll** using **Turso** for the database, **Cloudflare Workers** or **Vercel** for the backend, and **Vercel** for the frontend.

## Prerequisites
- [GitHub Account](https://github.com/)
- [Turso Account](https://turso.tech/)
- [Vercel Account](https://vercel.com/) (or Cloudflare)
- [Bun](https://bun.sh/) installed locally

---

## 1. Database Setup (Turso)

1.  **Install Turso CLI** (or use the web dashboard at [turso.tech](https://turso.tech)):
    ```bash
    # Windows (PowerShell)
    iwr https://get.tur.so | iex
    turso auth signup # or login
    ```

2.  **Create a Database**:
    ```bash
    turso db create spirit-scroll
    ```

3.  **Get Credentials**:
    ```bash
    turso db show spirit-scroll --url
    # Copy the libSQL URL (e.g., libsql://spirit-scroll-username.turso.io)
    
    turso db tokens create spirit-scroll
    # Copy the Auth Token
    ```

4.  **Configure local environment**:
    Create `server/.dev.vars` for local development. Do not commit this file.
    ```env
    DATABASE_URL=libsql://your-database.turso.io
    DATABASE_AUTH_TOKEN=your_turso_token
    JWT_SECRET=replace_with_a_long_random_secret
    AUTH_PASSWORD_HASH=replace_with_the_sha256_password_hash
    ```

    Generate the current password hash with Bun:
    ```bash
    bun -e "const p='your-password'; const b=await crypto.subtle.digest('SHA-256', new TextEncoder().encode(p)); console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''))"
    ```

5.  **Push Schema to Turso**:
    In your local `server` directory, run:
    ```bash
    # Windows PowerShell
    cd server
    set DATABASE_URL=libsql://...
    set DATABASE_AUTH_TOKEN=...
    
    bun run db:push
    ```

---

## 2. Backend Deployment

You can deploy the Hono server to **Cloudflare Workers** (Recommended for speed) or **Vercel** (Easier integration).

### Option A: Cloudflare Workers (Recommended)
1.  **Login to Cloudflare**:
    ```bash
    bunx wrangler login
    ```
2.  **Deploy**:
    ```bash
    cd server
    bunx wrangler deploy --name spirit-scroll-api src/index.ts
    ```
3.  **Set Secrets**:
    Go to Cloudflare Dashboard > Workers > spirit-scroll-api > Settings > Variables.
    Add:
    - `DATABASE_URL`: Your Turso URL
    - `DATABASE_AUTH_TOKEN`: Your Turso Token
    - `JWT_SECRET`: A long random string used to sign auth tokens
    - `AUTH_PASSWORD_HASH`: The SHA-256 hash of your login password

### Option B: Vercel
1.  Create `vercel.json` in `server/`:
    ```json
    {
      "builds": [{ "src": "src/index.ts", "use": "@vercel/node" }],
      "routes": [{ "src": "/(.*)", "dest": "src/index.ts" }]
    }
    ```
2.  Deploy using Vercel CLI or Git integration.
    - Set Environment Variables in Vercel Project Settings:
      - `DATABASE_URL`
      - `DATABASE_AUTH_TOKEN`
      - `JWT_SECRET`
      - `AUTH_PASSWORD_HASH`

---

## 3. Frontend Deployment (Vercel)

1.  Push your code to GitHub.
2.  Import the repository in Vercel.
3.  **Configure Project**:
    - **Root Directory**: `client`
    - **Framework Preset**: Vite
4.  **Environment Variables**:
    - `VITE_API_URL`: The URL of your deployed Backend (e.g., `https://spirit-scroll-api.username.workers.dev/` or your Vercel backend URL).
5.  **Deploy**.

---

## 4. Production Smoke Check

After deployment, verify the backend from the project root:

```bash
SPIRIT_SCROLL_API_URL=https://your-api.example.com bun scripts/check-prod.js
```

On Windows PowerShell:

```powershell
$env:SPIRIT_SCROLL_API_URL="https://your-api.example.com"
bun scripts/check-prod.js
```

---

## Summary
- **Database**: Turso (Free Tier: 9B reads/mo)
- **Backend**: Cloudflare Workers (Free Tier: 100k req/day)
- **Frontend**: Vercel (Free Tier: Generous bandwidth)

Avoid committing local secrets (`.dev.vars`, `.env*`) or local databases (`*.sqlite`).
