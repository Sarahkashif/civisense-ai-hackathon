# CiviSense AI

A professional civic intelligence platform that helps citizens report public issues and gives authorities the tools to prioritize and act on complaints.

## Features

- **Multi-Input Reporting**: Text (Unicode/Urdu supported), browser voice input, photo upload, location
- **Intelligent Categorization**: Automatic category suggestion using keyword-based heuristic analysis
- **Priority Scoring**: Transparent weighted scoring (0-100) based on severity, urgency keywords, repeated reports, and community support
- **Duplicate Detection**: Identifies similar existing reports so citizens can support them or submit separately
- **Complaint Tracking**: Unique complaint IDs with full status timeline
- **Authority Dashboard**: Metrics, search, filters, detail view, status management, and hotspot insights
- **Local Persistence**: All data stored in browser localStorage — no server or API required

## Tech Stack

- React 18 + TypeScript
- Vite 6
- Tailwind CSS 3
- React Router 6

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)

### Install and Run

```bash
cd civisense-ai
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

## Demo Journey

1. **Home** (`/`) — Landing page with hero, how-it-works, and capabilities
2. **Report Issue** (`/report`) — Submit a complaint with text, voice, image, and location
3. **Analysis** — See category suggestion, priority score, and duplicate check
4. **Confirmation** (`/confirmation/:id`) — Get your unique complaint ID
5. **Track Complaint** (`/track`) — Search by ID to see status and timeline
6. **Authority Portal** (`/authority`) — Manage all complaints, update statuses, view hotspots

## Project Structure

```
src/
  types/            # TypeScript types and constants
  services/         # Business logic (analysis, storage, complaint)
  data/             # Seed data
  hooks/            # Custom React hooks
  components/
    common/         # Reusable UI components
    layout/         # Navbar, Footer, Layout wrapper
  pages/            # Route pages
  App.tsx           # Router configuration
  main.tsx          # Entry point
  index.css         # Tailwind + custom styles
```

## Analysis Layer

The analysis service (`src/services/analysisService.ts`) uses deterministic, transparent heuristics:
- **Category suggestion**: Keyword matching and scoring per category
- **Priority scoring**: Weighted factors (base severity, urgency keywords, duplicates, support count)
- **Duplicate detection**: Category match + location similarity + keyword overlap

No external AI models or APIs are used. The architecture is designed to replace each function with a real AI adapter in production.

## Seed Data

On first run, the application seeds localStorage with 7 realistic demo complaints across different categories, priorities, and statuses — including a multilingual (Urdu) entry.

## License

Built as a hackathon MVP for civic good.
