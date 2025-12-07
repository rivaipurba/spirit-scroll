# SpiritScroll

SpiritScroll is a personal media tracking application designed for managing reading progress of Manhua and Donghua. It features a modern, premium dark-themed UI and a robust full-stack architecture with automated update checking capabilities.

![SpiritScroll Dashboard](client/public/dashboard-preview.png)

## Key Features

### 📚 Media Tracking
- **Smart Dashboard**: Automatically sorts series by priority—updates first, then by largest unread gap.
- **Reading & Watching**: Dedicated support for **Manhua** (Comics) and **Donghua** (Animation).
- **Progress Management**: Quick "+" and "-" buttons to update chapters directly from the card.
- **Visual Badges**:
  - **"NEW" Badge**: Pulsing red badge for series with new chapters.
  - **Type Badge**: Distinct indicators for MANHUA (Orange) vs DONGHUA (Blue).

### 🔍 Automated Update Checker
- **Smart Scraping**: Automatically checks source URLs for the latest released chapters.
  - Supports **Asura Scans**, **Animexin**, and generic WordPress/Manga sites.
  - Uses browser impersonation headers to bypass basic anti-bot protections.
  - **Retry Logic**: Built-in retries for network stability.
- **Scan All**: dedicated tool in Settings to check all "Reading" series sequentially.
- **Visual Feedback**: Shows "Ch. X / Y (New!)" to clearly indicate how far behind you are.

### 🖼️ Library & UI
- **Library View**: Grid view of your entire collection with advanced filtering (Status, Type, Search).
- **Auto-Cover Scraping**: Automatically fetches cover images from source URLs upon entry creation.
- **Glassmorphism Design**: sleek, dark-themed UI built with **Tailwind CSS v4** and backdrop blurs.
- **Mobile-First**: Optimized for touch inputs and small screens.

### ⚙️ Data & Settings
- **Statistics**: Track your total series and total chapters consumed.
- **Import / Export**: Full JSON backup and restore functionality.
- **Maintenance Tools**: One-click tool to re-scrape missing cover images.

## Tech Stack

### Frontend (`/client`)
- **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State/Query**: [TanStack Query](https://tanstack.com/query/latest)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Runtime**: [Bun](https://bun.sh/)

### Backend (`/server`)
- **Framework**: [Hono](https://hono.dev/)
- **Database**: SQLite
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Scraping**: [Cheerio](https://cheerio.js.org/)
- **Runtime**: [Bun](https://bun.sh/)

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) installed (v1.0+)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository_url>
   cd SpiritScroll
   ```

2. **Install Dependencies**
   ```bash
   # Install server dependencies
   cd server
   bun install

   # Install client dependencies
   cd ../client
   bun install
   ```

3. **Database Setup**
   Initialize the SQLite database schema.
   ```bash
   cd server
   bun run db:push
   ```

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd server
   bun run dev
   ```
   Server runs on: `http://localhost:3000`

2. **Start the Frontend Client**
   Open a new terminal.
   ```bash
   cd client
   bun run dev
   ```
   Client runs on: `http://localhost:5173`

## Project Structure

- **`client/`**
  - `src/components`: UI components (Dashboard, MediaCard, Settings).
  - `src/hooks`: Custom React Query hooks (`useMedia`, `useScanAll`).
  - `src/lib`: RPC API client.
- **`server/`**
  - `src/db`: Drizzle schema configuration.
  - `src/utils`: Scraper logic (`scraper.ts`, `update-checker.ts`).
  - `src/index.ts`: Main Hono application and API routes.

## License

MIT
