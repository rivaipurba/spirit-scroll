# MyAnimeList API Integration Setup

## Overview
SpiritScroll now supports MyAnimeList (MAL) integration to fetch ratings, rankings, and additional metadata for DONGHUA (anime) content.

## Features Added
- **Rating Display**: Shows MAL score (★ 8.5) on DONGHUA cards
- **Ranking Display**: Shows MAL rank (#42) on DONGHUA cards  
- **Automatic Data Fetching**: MAL data is fetched when creating new DONGHUA entries
- **Manual Refresh**: Star button to manually refresh MAL data
- **Database Storage**: MAL data is cached locally to reduce API calls
- **OAuth2 Integration**: Proper authentication flow with token management

## Quick Setup Guide

### 1. Set Environment Variables
Add these to your server environment (Cloudflare Workers secrets or `.env`):

```bash
# Required: Your MAL API credentials
MAL_CLIENT_ID=your_client_id_here
MAL_CLIENT_SECRET=your_client_secret_here

# Optional: Custom redirect URI (defaults to localhost:3000)
MAL_REDIRECT_URI=https://your-domain.com/api/mal/callback
```

### 2. Complete OAuth2 Authentication
1. Go to **Settings** in your SpiritScroll app
2. Find the **MyAnimeList Integration** section
3. Click **"Check MAL Status"** to verify your Client ID is configured
4. Click **"Generate Auth URL"** to get the authentication link
5. Click the authentication link to authorize with MyAnimeList
6. You'll receive access and refresh tokens
7. Set these as additional environment variables:

```bash
MAL_ACCESS_TOKEN=your_access_token_here
MAL_REFRESH_TOKEN=your_refresh_token_here
```

### 3. Database Migration
Run the database migration to add MAL fields:

```bash
cd server
bun run db:push
```

## Detailed Setup Instructions

### Getting MAL API Credentials
1. Go to [MyAnimeList API](https://myanimelist.net/apiconfig)
2. Click **"Create ID"**
3. Fill out the application form:
   - **App Name**: SpiritScroll (or your preferred name)
   - **App Type**: Web
   - **App Description**: Personal media tracking application
   - **App URL**: Your domain or localhost:3000
   - **App Redirect URL**: `https://your-domain.com/api/mal/callback`
4. Submit and wait for approval (usually instant)
5. Copy your **Client ID** and **Client Secret**

### Environment Variables Setup

#### For Local Development (.env file):
```bash
# Database
DATABASE_URL=file:spirit_scroll.sqlite
DATABASE_AUTH_TOKEN=

# MAL API
MAL_CLIENT_ID=your_client_id_here
MAL_CLIENT_SECRET=your_client_secret_here
MAL_REDIRECT_URI=http://localhost:3000/api/mal/callback

# After OAuth2 flow:
MAL_ACCESS_TOKEN=your_access_token_here
MAL_REFRESH_TOKEN=your_refresh_token_here
```

#### For Cloudflare Workers:
Set these as secrets in your Cloudflare dashboard:
```bash
wrangler secret put MAL_CLIENT_ID
wrangler secret put MAL_CLIENT_SECRET
wrangler secret put MAL_ACCESS_TOKEN
wrangler secret put MAL_REFRESH_TOKEN
```

## API Endpoints Added

### `GET /api/mal/status`
Check MAL integration status.

### `GET /api/mal/auth-url`
Generate OAuth2 authorization URL.

### `GET /api/mal/callback`
OAuth2 callback endpoint (handles the redirect from MAL).

### `POST /api/media/:id/refresh-mal`
Manually refresh MAL data for a specific DONGHUA entry.

## Usage

### Automatic Integration
- When adding new DONGHUA entries, MAL data is fetched automatically
- Ratings and rankings appear on the media cards
- Data is cached for 7 days to reduce API calls

### Manual Refresh
- Click the star (★) button on DONGHUA cards to refresh MAL data
- Use the Settings page to check integration status

### Token Management
- Access tokens are automatically refreshed when they expire
- Refresh tokens are used to maintain long-term authentication
- No manual token management required after initial setup

## Troubleshooting

### "MAL Client ID not configured"
- Ensure `MAL_CLIENT_ID` and `MAL_CLIENT_SECRET` are set in your environment
- Restart your server after setting environment variables

### "Authentication failed"
- Check that your redirect URI matches exactly what you set in MAL API settings
- Ensure your Client ID and Secret are correct
- Try generating a new auth URL

### "No MAL data showing"
- Verify authentication is complete (check Settings page)
- Ensure the content type is DONGHUA (not MANHUA)
- Check server logs for API errors
- Try manually refreshing MAL data with the star button

### Token Expired
- The system automatically refreshes tokens
- If refresh fails, you may need to re-authenticate through the Settings page

## Rate Limits
- MAL API allows 300 requests per minute
- Data is cached for 7 days to minimize requests
- Automatic retry logic handles temporary failures

## Security Notes
- Tokens are stored as environment variables (secure)
- OAuth2 state parameter prevents CSRF attacks
- HTTPS required for production deployments
- Tokens are automatically refreshed to maintain security