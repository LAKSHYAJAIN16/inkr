# School Editor (aka Writing Fingerprint)

> Not "does this look AI-written" but "did this writing evolve the way a real person's writing evolves."

A classroom writing tool: students write in a rich-text editor, every saved version is kept, and each version gets scored for signs of AI assistance — so a teacher can see the whole history of a doc, not just the final PDF.

## Features

- Rich-text editor built on Tiptap — headings, alignment, color/highlight, links, resizable images, syntax-highlighted code blocks.
- Version history + AI detection — each save runs through `src/lib/ai.ts`, which calls OpenAI to classify the text, or falls back to a local heuristic (sentence-length variance, lexical diversity, long-word ratio) with no API key set.
- Classrooms — teachers create one, students join via invite link.
- Dashboard to list, create, and open documents.
- Export to PDF or DOCX.
- Research tab — a sandboxed, monitored Google-search environment for students that logs searches, clicks, navigation, and focus/blur events to session files under `data/research/`, so a teacher can see what sources a student actually looked at. Details in `src/app/research-tab/README.md`.
- Firebase backend — Firestore for documents/classrooms, Google sign-in for auth.

## Stack

Next.js 15 (App Router), React 19, TypeScript, Tiptap 3, Tailwind CSS 4, Firebase, OpenAI API (optional, `zod`-validated) on top of the local heuristic detector, `date-fns`, `uuid`, `jsdiff` for version diffing.

## Setup

```bash
npm install
```

Firebase config is checked into `src/lib/firebase.ts` (project `inkr-c289c`, see naming note below). For the OpenAI-backed detector instead of the local heuristic:

```bash
OPENAI_API_KEY=your-key
OPENAI_MODEL=gpt-4o-mini   # optional, default anyway
```

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- `/dashboard` — your documents
- `/doc/new`, `/doc/[id]` — create/edit
- `/classroom/[id]` — classroom view
- `/teacher-signup` — teacher onboarding
- `/join/[id]` — student joins via invite
- `/research-tab` — monitored research session

Other scripts: `npm run build`, `npm run start`, `npm run lint`.

## Layout

```
school-editor/
├── src/
│   ├── app/
│   │   ├── api/docs/route.ts              # document API route
│   │   ├── dashboard/                      # document list
│   │   ├── doc/[id], doc/new/              # editor pages
│   │   ├── classroom/[id]/                 # classroom view
│   │   ├── join/[id], join-success/[id]/   # invite flow
│   │   ├── teacher-signup/
│   │   └── research-tab/                   # monitored research tool
│   ├── components/    # editor, toolbar, doc list, version history UI
│   ├── lib/           # firebase.ts, ai.ts (the AI detector), storage.ts
│   └── types/         # doc, version, research types
└── data/              # local research session logs
```

Naming note: this started as "inkr," got renamed to `school-editor`, and is rebranded on the landing page as "Writing Fingerprint" — but the Firebase project and some internals still say inkr.
