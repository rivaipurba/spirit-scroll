# SpiritScroll

SpiritScroll is a personal media tracking application designed for managing reading progress of Manhua and Donghua. It features a modern, premium dark-themed UI and a robust full-stack architecture.

![SpiritScroll Dashboard](client/public/screenshot-placeholder.png)

## Features

- **Media Tracking**: Keep track of your current chapter and status for various series.
- **Manhua & Donghua Support**: Dedicated types with visual indicators (Orange for Manhua, Blue for Donghua).
- **Quick Progress Updates**: Increment chapters directly from the dashboard card.
- **Premium Dark UI**: A sleek, responsiveness interface built with Tailwind CSS v4 and glassmorphism design principles.
- **Mobile-First Design**: Optimized for mobile viewing with a bottom navigation bar.

## Tech Stack

### Frontend (`/client`)
- **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Data Fetching**: [TanStack Query](https://tanstack.com/query/latest)
- **Runtime**: [Bun](https://bun.sh/) (Optional, but recommended)

### Backend (`/server`)
- **Framework**: [Hono](https://hono.dev/)
- **Database**: SQLite
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Validation**: [Zod](https://zod.dev/)
- **Runtime**: [Bun](https://bun.sh/)

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) installed (or Node.js/npm)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository_url>
   cd SpiritScroll
   ```

2. **Install Dependencies**
   It is recommended to use `bun` for faster installation.
   ```bash
   # Install server dependencies
   cd server
   bun install

   # Install client dependencies
   cd ../client
   bun install
   ```

3. **Database Setup**
   Initialize the SQLite database using Drizzle.
   ```bash
   cd server
   bun run db:push
   ```

### Running the Application

1. **Start the Server**
   ```bash
   cd server
   bun run dev
   ```
   Server will run on `http://localhost:3000`.

2. **Start the Client**
   Open a new terminal.
   ```bash
   cd client
   bun run dev
   ```
   Client will run on `http://localhost:5173`.

## Project Structure

- **`client/`**: React frontend application.
  - `src/components`: UI components (Dashboard, MediaCard, etc.).
  - `src/hooks`: Custom React Query hooks.
  - `src/lib`: API client configuration.
- **`server/`**: Hono backend API.
  - `src/db`: Database schema and connection.
  - `src/routes`: API route handlers.

## License

MIT
