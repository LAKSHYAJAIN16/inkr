# School Editor (aka Writing Fingerprint)

This is a classroom writing tool I built around a question I don't think final-draft plagiarism checkers actually answer well: not "does this text look AI-written," but "did this piece of writing evolve the way a real person's writing evolves." Students write in a rich-text editor, every saved version gets kept, and each version gets scored for signs of AI assistance — so a teacher can look at the whole history of a doc, not just the final PDF.

## What it does

- **The editor itself** is built on Tiptap — headings, alignment, color/highlight, links, resizable images, code blocks with syntax highlighting, all the normal rich-text stuff (`src/components/EditorClient.tsx`, `Toolbar.tsx`).
- **Version history + AI detection** — every saved version runs through `src/lib/ai.ts`, which either calls OpenAI to classify the text or, if there's no API key set, falls back to a local heuristic (sentence-length variance, lexical diversity, long-word ratio) to flag likely AI-generated sections.
- **Classrooms** — teachers create a classroom, students join via invite link (`src/app/classroom/[id]`, `src/app/join/[id]`, `src/app/join-success/[id]`, `src/app/teacher-signup`).
- **A dashboard** to list, create, and open documents (`src/app/dashboard`, `src/app/doc/[id]`, `src/app/doc/new`).
- **Export to PDF or DOCX** via `html2pdf.js` and `html-docx-js`.
- **A research tab** — this one's a bit unusual: it's a sandboxed, monitored Google-search environment for students (`src/app/research-tab`) that logs searches, clicks, navigation, and focus/blur events to session files under `data/research/`, so a teacher can actually see what sources a student looked at while researching. There's a more detailed writeup of the session/activity API in `src/app/research-tab/README.md`.
- Everything's backed by Firebase — Firestore for documents/classrooms, Google sign-in for auth.

## Stack

Next.js 15 (App Router), React 19, TypeScript, Tiptap 3 for the editor, Tailwind CSS 4 for styling, Firebase for auth/data, OpenAI API as an optional layer on top of the local heuristic detector (validated with `zod`), plus `date-fns`, `uuid`, and `jsdiff` for diffing between versions.

## Setup

```bash
npm install
```

Firebase config is currently just checked into `src/lib/firebase.ts` (project `inkr-c289c` — more on that name below). If you want the OpenAI-backed detector instead of the local heuristic, set:

```bash
OPENAI_API_KEY=your-key
OPENAI_MODEL=gpt-4o-mini   # optional, this is the default anyway
```

## Running it

```bash
npm run dev
```

Then go to [http://localhost:3000](http://localhost:3000). Worth knowing where things live:

- `/` — landing page
- `/dashboard` — your documents
- `/doc/new`, `/doc/[id]` — create/edit
- `/classroom/[id]` — classroom view
- `/teacher-signup` — teacher onboarding
- `/join/[id]` — student joins via invite
- `/research-tab` — the monitored research session

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
└── data/              # local research session logs (research-tab)
```

One naming note in case it's confusing digging through the code: this started life as "inkr," got renamed to `school-editor` and rebranded on the landing page as "Writing Fingerprint," but I never did a full rename pass — so the Firebase project and some internals still say inkr.
