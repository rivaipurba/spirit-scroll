# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Single owner, using it daily. They follow manhua and donghua across several source sites, and open the app to log progress (+1 chapter or episode) and to see what has been released since their last visit. One password, no other accounts.

## Product Purpose

Personal progress tracker for manhua and donghua. It records where the owner is in each title and automatically scans source sites for new chapter releases, so the owner always knows how far behind they are. Success: the owner can see what is behind and log progress in a few seconds, without visiting each site.

## Positioning

Auto-scan of new releases. Unlike a general tracker (MAL, a spreadsheet), SpiritScroll checks source sites itself and shows the backlog per title.

## Operating Context

- React frontend on Vercel, Hono backend on Cloudflare Workers (cron scan), Turso/libSQL database.
- A Chrome extension (Manifest V3) auto-tracks episodes on supported sites (asuracomic.net / asurascans.com, animexin.dev/.vip).
- Daily, mostly quick sessions on desktop and phone.

## Capabilities and Constraints

- Single-user JWT auth (HS256, 24h) with one password; no multi-user.
- Dark theme only, by decision; no light theme.
- The `cover_url` column is kept but not populated; the server does not scrape covers.
- Scanning is site-specific (cheerio) in `server/src/utils/update-checker.ts`.
- Backup/import of the library lives in Settings.

## Brand Commitments

Name "SpiritScroll". The extension is part of the product. No other brand assets recorded.

## Evidence on Hand

No testimonials, public users, or metrics. The owner's own library is the only data.

## Product Principles

- The backlog (what is behind) is the primary signal, not the catalogue.
- Logging progress must stay one tap or one key.
- Single owner: no onboarding, no sharing, no account features.
- Speed over decoration: quick sessions, quiet interface.

## Accessibility & Inclusion

No product-specific requirement established; WCAG AA as the working bar (confirmed by the technical audit).
