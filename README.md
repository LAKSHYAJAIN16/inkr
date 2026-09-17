# School Editor (Writing Fingerprint)

A classroom document editor and academic-integrity tool. Students write in a rich-text editor (built on Tiptap), and every version of a document is saved to a revision history that is scored for signs of AI-assisted writing — giving teachers a "writing fingerprint" view of how a piece of work actually evolved, rather than just a final-draft plagiarism check.

## Key Features

- **Rich text editor** — Tiptap-based editor (`src/components/EditorClient.tsx`, `Toolbar.tsx`) with headings, text alignment/color/highlight, links, images (incl. resizable images), code blocks with syntax highlighting, and underline/font-family formatting.
- **Version history with AI detection** — every saved version (`src/types/doc.ts: DocVersion`) is analyzed by `src/lib/ai.ts`, which flags likely AI-generated text using either an OpenAI classification call (if `OPENAI_API_KEY` is set) or a local heuristic fallback (sentence-length variance, lexical diversity, long-word ratio).
- **Classrooms** — teachers can create classrooms and invite/join flows (`src/app/classroom/[id]`, `src/app/join/[id]`, `src/app/join-success/[id]`, `src/app/teacher-signup`).
- **Document dashboard** — list, create, and open documents (`src/app/dashboard`, `src/app/doc/[id]`, `src/app/doc/new`, `src/components/DocList.tsx`).
- **Export** — documents can be exported to PDF (`html2pdf.js`) and DOCX (`html-docx-js`).
- **Research Tab** — a monitored, sandboxed Google-search environment for students (`src/app/research-tab`) that logs searches, clicks, navigation, and focus/blur events to session files under `data/research/` via API routes, so teachers can review what sources a student consulted. See `src/app/research-tab/README.md` for the full activity/session API.
- **Firebase-backed persistence** — documents, auth (Google sign-in), and classroom data are stored in Firestore (`src/lib/firebase.ts`, `src/lib/storage.ts`).

## Tech Stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **Editor:** Tiptap 3 (`@tiptap/react`, `starter-kit`, and extensions for images, links, color, highlight, code blocks, etc.)
- **Styling:** Tailwind CSS 4
- **Backend/Data:** Firebase (Firestore + Auth), Next.js API routes (`src/app/api/docs`, research-tab session/activity endpoints)
- **AI detection:** OpenAI API (optional) with a local statistical heuristic fallback, validated with `zod`
- **Export:** `html2pdf.js`, `html-docx-js`
- **Other:** `date-fns`, `uuid`, `jsdiff` (diffing between versions)

## Setup

```bash
npm install
```

Firebase config is currently checked into `src/lib/firebase.ts` (project `inkr-c289c`). To use the optional OpenAI-backed AI detector instead of the local heuristic, set:

```bash
OPENAI_API_KEY=your-key
OPENAI_MODEL=gpt-4o-mini   # optional, this is the default
```

## Running locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Key routes:

- `/` — marketing landing page
- `/dashboard` — document list
- `/doc/new`, `/doc/[id]` — create/edit a document
- `/classroom/[id]` — classroom view
- `/teacher-signup` — teacher onboarding
- `/join/[id]` — student joins a classroom by invite
- `/research-tab` — monitored research/search session

Other scripts:

```bash
npm run build   # production build
npm run start   # run the production build
npm run lint    # eslint
```

## Project Structure

```
school-editor/
├── src/
│   ├── app/
│   │   ├── api/docs/route.ts       # Document API route
│   │   ├── dashboard/              # Document list
│   │   ├── doc/[id], doc/new/      # Editor pages
│   │   ├── classroom/[id]/         # Classroom view
│   │   ├── join/[id], join-success/[id]/  # Classroom invite flow
│   │   ├── teacher-signup/         # Teacher onboarding
│   │   └── research-tab/           # Monitored research/search tool
│   ├── components/                 # Editor, toolbar, doc list, version history UI
│   ├── lib/                        # firebase.ts, ai.ts (AI detection), storage.ts
│   └── types/                      # Doc, version, and research types
└── data/                           # Local research session data (research-tab)
```

Note: this project's Firebase project and some internal naming still reference "inkr" — it was renamed to `school-editor` and rebranded on the landing page as "Writing Fingerprint" without a full rename pass.
