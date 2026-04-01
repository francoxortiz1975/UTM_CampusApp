# Frontend — Campus Dashboard

The public-facing **Next.js** application for the campus dashboard. It uses the **App Router**, **TypeScript**, and **Tailwind CSS** to present food, gym, parking, events, map, and lost-and-found experiences behind one consistent layout and navigation.

## Stack

- [Next.js](https://nextjs.org/) 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- [Recharts](https://recharts.org/) for charts
- [Lucide React](https://lucide.dev/) for icons

## Prerequisites

- Node.js 20 or newer recommended
- The **Flask backend** running (default `http://localhost:5000`) so data-fetching routes work end-to-end

## Setup

From this directory:

```bash
npm install
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app hot-reloads when you edit files under `src/`.

## Other scripts

| Command | Purpose |
|---------|---------|
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Project structure (overview)

- `src/app/` — Routes and pages (e.g. food, gym, parking, events, map, lost-and-found)
- `src/components/` — Shared UI (header, cards, charts, etc.)
- `src/styles/` — Global styles
- `src/types/` — Shared TypeScript types and auth helpers

## API integration

Pages call the backend on **port 5000**. In the browser, the code typically uses `http://localhost:5000` or `http://127.0.0.1:5000` depending on hostname detection. For team testing from another device on your network, you may need to align the API base URL in the relevant page or extract a single env-driven constant so every route points at the same host.

Session-sensitive flows (for example lost-and-found) use `credentials: "include"` where appropriate so cookies reach the Flask API.

## Learn more

- [Next.js documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
