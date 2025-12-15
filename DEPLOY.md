# Zero Cost Deployment Guide

This guide explains how to deploy **SpiritScroll** for $0/month using **Turso** (Database), **Vercel** (Frontend), and **Cloudflare Workers** or **Vercel** (Backend).

## Prerequisites
- [GitHub Account](https://github.com/)
- [Turso Account](https://turso.tech/)
- [Vercel Account](https://vercel.com/) (or Cloudflare)

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

4.  **Push Schema to Turso**:
    In your local `server` directory, run:
    ```bash
    # Set vars temporarily or use a .env file
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

### Option B: Vercel
1.  Create `vercel.json` in `server/`:
    ```json
    {
      "builds": [{ "src": "src/index.ts", "use": "@vercel/node" }],
      "routes": [{ "src": "/(.*)", "dest": "src/index.ts" }]
    }
    ```
2.  Deploy using Vercel CLI or Git integration.
    - Set Environment Variables (`DATABASE_URL`, `DATABASE_AUTH_TOKEN`) in Vercel Project Settings.

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

## Summary
- **Database**: Turso (Free Tier: 9B reads/mo)
- **Backend**: Cloudflare Workers (Free Tier: 100k req/day)
- **Frontend**: Vercel (Free Tier: Generous bandwidth)

**Total Cost: $0.**
