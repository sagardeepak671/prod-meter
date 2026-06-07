# How to Run

This project is a Next.js app. Use the steps below to run it locally or on a new laptop.

## Prerequisites

- Node.js 20+ recommended
- npm, which is installed with Node.js

If `node` or `npm` is missing on your machine, install Node.js first. On macOS, the simplest options are:

```bash
# Option 1: Homebrew
brew install node

# Option 2: Download the macOS installer from https://nodejs.org/
```

Verify the install before continuing:

```bash
node --version
npm --version
```

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

	Use the exact values from Firebase Console > Project settings > Your apps > Web app:

	- `apiKey` -> `NEXT_PUBLIC_FIREBASE_API_KEY`
	- `authDomain` -> `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
	- `projectId` -> `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
	- `storageBucket` -> `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
	- `messagingSenderId` -> `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
	- `appId` -> `NEXT_PUBLIC_FIREBASE_APP_ID`

	Do not leave placeholder text like `your_api_key_here` in `.env.local`.

## Run Locally

Start the development server:

```bash
npm run dev
```

Then open http://localhost:3000 in your browser.

If you edit `.env.local`, stop and restart `npm run dev` so Next.js reloads the environment.

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


lsof -ti tcp:3000 | xargs kill -9 2>/dev/null; lsof -ti tcp:3001 | xargs kill -9 2>/dev/null; cd /Users/deepaksagar/Desktop/te/prod_meter && npm run dev


kill

lsof -ti tcp:3000 | xargs kill -9 2>/dev/null; lsof -ti tcp:3001 | xargs kill -9 2>/dev/null; cd /Users/deepaksagar/Desktop/te/prod_meter 