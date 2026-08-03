# Makeng Salon Booking System

A modern online booking platform for Makeng Salon built with React, TypeScript, Vite, Tailwind CSS v4, and Firebase.

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Database | Firebase Firestore |
| Linting | Oxlint |

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later
- A Firebase project

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   copy .env.example .env
   ```
   Fill in your Firebase project credentials in `.env`.

3. **Start the development server**
   ```bash
   npm run dev
   ```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run Oxlint |

## Environment Variables

All required variables are documented in `.env.example`. Copy it to `.env` and provide your Firebase project values. The `.env` file is git-ignored and must never be committed.

## Project Structure

```
src/
├── components/
│   ├── layout/     # Navbar, Footer, Layout wrapper
│   └── ui/         # Reusable UI components
├── pages/          # Route-level page components
├── lib/            # Firebase initialisation
├── hooks/          # Custom React hooks
├── utils/          # Helper/utility functions
└── types/          # Shared TypeScript type definitions
```
