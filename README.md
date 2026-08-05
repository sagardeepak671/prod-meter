# Productivity Meter

A weekly productivity tracker that scores what you actually did against what you planned to do — and
counts wasted time as a first-class category rather than quietly ignoring it.

Plan a week of tasks, tick them off daily, and get points, streaks, a consistency score, and a
category breakdown that tells you when more than 15% of your week went to waste. Data lives in
`localStorage` for instant loads and syncs to Firestore when you sign in, so it survives across
devices.

**Live: [prodmeter.vercel.app](https://prodmeter.vercel.app)**

Built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, Firebase and Recharts.

---

## Table of Contents

- [Features](#features)
- [Screens](#screens)
- [Environment Setup](#environment-setup)
- [Firebase Setup](#firebase-setup)
- [Running Locally](#running-locally)
- [Available Scripts](#available-scripts)
- [How Scoring Works](#how-scoring-works)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Features

- **Weekly planner** — build a schedule day by day; copy a day's tasks to any other days
- **Reusable templates** — save a week as a template, mark one as default, load it into a new week
- **Daily tracking** — count-based completion, so "read 3 chapters" tracks partial progress
- **Four categories** — Study 📚 · Health 🏃 · Skill 💻 · Waste ❌
- **Waste as a metric** — the dashboard warns you when waste exceeds 15% of the week
- **Points, streaks, consistency** — current and longest streaks; a consistency score independent of
  raw volume
- **Analytics** — line, bar and pie charts over weekly history (Recharts)
- **Rewards** — set a point threshold, claim the reward when you hit it
- **Offline-first** — `localStorage` with an automatic backup slot; Firestore sync layered on top
- **Guest mode** — try everything without an account; sign in with Google to sync
- **Export / import** — download your entire dataset as JSON

---

## Screens

| Route | Purpose |
|---|---|
| `/` | Dashboard — points, streak, consistency, category breakdown, waste warning |
| `/planner` | Build the week's schedule; copy days; apply templates |
| `/daily` | Today's tasks, increment/decrement counts |
| `/analytics` | Weekly points, consistency and category charts |
| `/rewards` | Define and claim rewards |
| `/settings` | Templates, export/import, account |

---

## Environment Setup

| Requirement | Version |
|---|---|
| Node.js | **20+** |
| npm | Ships with Node |

<details open>
<summary><b>Install Node.js</b></summary>

```bash
# macOS
brew install node

# Debian / Ubuntu (via nvm — recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20 && nvm use 20

# Windows
winget install OpenJS.NodeJS
```

Or download the installer from [nodejs.org](https://nodejs.org/).
</details>

Verify:

```bash
node --version    # v20 or higher
npm --version
```

---

## Firebase Setup

Firebase provides Google sign-in and cross-device sync. **Guest mode works without it**, but the app
expects the environment variables to exist.

1. Create a project at the [Firebase Console](https://console.firebase.google.com).
2. Add a **Web app** to the project.
3. Enable **Authentication → Sign-in method → Google** *and* **Anonymous** (anonymous backs guest
   mode).
4. Create a **Cloud Firestore** database.
5. Copy the config values from **Project settings → Your apps → Web app** into `.env.local`.

| Firebase config key | Environment variable |
|---|---|
| `apiKey` | `NEXT_PUBLIC_FIREBASE_API_KEY` |
| `authDomain` | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` |
| `storageBucket` | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `NEXT_PUBLIC_FIREBASE_APP_ID` |

Suggested Firestore rules — each user reads and writes only their own document:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

> `NEXT_PUBLIC_*` variables are exposed to the browser. That is expected for Firebase web config —
> security comes from the Firestore rules, not from hiding these keys.

---

## Running Locally

```bash
git clone https://github.com/<your-username>/prod_meter.git
cd prod_meter

npm install
cp env.example .env.local     # then fill in your Firebase values
npm run dev
```

Open **http://localhost:3000**.

> After editing `.env.local`, restart the dev server — Next.js reads environment variables at
> startup.

---

## Available Scripts

| Command | Effect |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

Free a stuck port:

```bash
lsof -ti tcp:3000 | xargs kill -9 2>/dev/null
```

---

## How Scoring Works

Each task carries a `pointsPerCount` and a `targetCount`, so a task worth 5 points with a target of
3 contributes up to 15 points.

| Metric | Definition |
|---|---|
| **Weekly points** | Σ `pointsPerCount × doneCount` over every task in the week |
| **Max possible** | Σ `pointsPerCount × targetCount` over the same tasks |
| **Completion %** | earned ÷ max |
| **Consistency score** | How evenly effort was spread across active days — a week of five steady days beats one heroic day plus six blanks |
| **Streak** | Consecutive weeks meeting the threshold; current and longest are both tracked |
| **Category breakdown** | Points and percentage per category, computed across the week |
| **Waste warning** | Fires when the Waste category exceeds **15%** of the week |

A week is finalised via `finalizeWeek`, which computes a `WeekSummary` and appends it to
`weeklyHistory` — the series the analytics charts read from.

---

## Architecture

```
  AuthProvider  ── Firebase Auth (Google, anonymous)
       │
  DataProvider  ── single source of truth for AppData
       │
       ├── localStorage   read immediately on mount → instant first paint
       │                  write-through with a backup slot
       │
       └── Firestore      onSnapshot subscription → live cross-device sync
                          debounced writes, guarded against echo loops
```

Two details worth calling out:

**Offline-first ordering.** `DataProvider` reads `localStorage` synchronously before Firestore
responds, so the UI renders real data on first paint rather than a spinner. Firestore updates arrive
afterwards and reconcile.

**Auth never blocks the UI.** `AuthContext` sets a hard 1.5-second timeout that clears the loading
state regardless of what Firebase is doing. A slow or failed auth request degrades to guest mode
instead of a blank screen.

**Write-through with a backup.** `saveData` copies the current value to a backup key before
overwriting. If `JSON.parse` fails on the primary key — corrupted write, quota error — `loadData`
transparently restores from the backup.

### Data model

```ts
AppData {
  schedules:     Record<weekId, WeekSchedule>    // planned tasks per day
  dailyProgress: Record<date,   DailyProgress>   // taskId -> doneCount
  templates:     WeeklyTemplate[]
  rewards:       Reward[]
  weeklyHistory: WeekSummary[]                   // finalised weeks
}
```

Weeks are keyed by an ISO-style `weekId`, so schedules, progress and history join cleanly without a
relational store.

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx        # Root layout, providers, sidebar
│   ├── page.tsx          # Dashboard
│   ├── planner/          # Week builder
│   ├── daily/            # Today's tasks
│   ├── analytics/        # Recharts visualisations
│   ├── rewards/          # Reward definitions and claims
│   ├── settings/         # Templates, export/import, account
│   └── globals.css       # Tailwind 4 entry
├── components/
│   ├── Sidebar.tsx
│   └── Avatar.tsx
├── context/
│   ├── AuthContext.tsx   # Firebase auth + guest mode
│   └── DataContext.tsx   # AppData store, localStorage + Firestore sync
└── lib/
    ├── types.ts          # Domain model, categories, defaults
    ├── storage.ts        # localStorage load/save/backup, export/import
    ├── utils.ts          # Week IDs, points, consistency, streaks, summaries
    └── firebase.ts       # SDK initialisation
```

---

## Deployment

**Vercel** (current):

```bash
npm i -g vercel && vercel
```

Add the six `NEXT_PUBLIC_FIREBASE_*` variables under Project Settings → Environment Variables.

**Netlify:** `netlify.toml` is included and configured with `@netlify/plugin-nextjs`. Connect the
repository and set the same environment variables.

Remember to add your production domain to **Firebase Console → Authentication → Settings → Authorized
domains**, or Google sign-in will fail in production while working locally.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Firebase: Error (auth/invalid-api-key)` | `.env.local` is missing or has placeholder values |
| Environment changes have no effect | Restart `npm run dev` |
| Google sign-in fails in production | Add the domain under Firebase → Authentication → Authorized domains |
| Data does not sync between devices | Confirm you are signed in (not guest) and that Firestore rules allow the user's document |
| Port 3000 already in use | `lsof -ti tcp:3000 \| xargs kill -9` |
| Stuck on the loading screen | Should be impossible — auth force-clears after 1.5 s. Check the browser console for `[Auth]` logs |
| Data disappeared | Settings → import a previous export; `loadData` also falls back to the backup key automatically |

---

## Contributing

Contributions are welcome. Good first issues:

- Add tests for `lib/utils.ts` — points, consistency and streak logic is pure and easy to test
- Make the 15% waste threshold user-configurable
- Add monthly and yearly rollups alongside the weekly view
- Add a PWA manifest and service worker for true offline use
- Add keyboard shortcuts for incrementing tasks on `/daily`
- Improve accessibility: focus management, ARIA labels, contrast audit

```bash
git checkout -b feat/your-change
npm run lint && npm run build
git commit -m "feat: describe your change"
```

Please keep TypeScript strict — no `any` in new code — and prefer Tailwind utilities over custom CSS.

---

## License

Released for personal and educational use.
