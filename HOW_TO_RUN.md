# How to Run

This project is a Next.js app. Use the steps below to run it locally or on a new laptop.

## Prerequisites

- Node.js 20+ recommended
- npm

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local environment file:

```bash
cp env.example .env.local
```

3. Fill in the Firebase values in `.env.local`.

## Run Locally

Start the development server:

```bash
npm run dev
```

Then open http://localhost:3000 in your browser.

## Useful Commands

Build for production:

```bash
npm run build
```

Run the production server:

```bash
npm run start
```

Run lint checks:

```bash
npm run lint
```

## Notes

- Keep `.env.local` out of Git. The shared template lives in `env.example`.
- If you move to a new laptop, clone the repo, install dependencies, copy `env.example` to `.env.local`, and add your Firebase values.