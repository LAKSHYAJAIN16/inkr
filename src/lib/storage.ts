import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Doc, DocSummary, DocVersion, DocVersionMeta } from "@/types/doc";

const DATA_DIR = path.join(process.cwd(), "data");
const DOCS_DIR = path.join(DATA_DIR, "docs");

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

function docDir(docId: string): string {
  return path.join(DOCS_DIR, docId);
}

function versionsDir(docId: string): string {
  return path.join(docDir(docId), "versions");
}

function currentPath(docId: string): string {
  return path.join(docDir(docId), "current.json");
}

function metaPath(docId: string): string {
  return path.join(docDir(docId), "meta.json");
}

function versionFilePath(docId: string, versionId: string): string {
  return path.join(versionsDir(docId), `${versionId}.json`);
}

export type CreateDocInput = {
  title: string;
  author?: string;
  initialContent?: string; // JSON string of ProseMirror doc
};

export async function createDoc(input: CreateDocInput): Promise<Doc> {
  const id = randomUUID();
  const now = new Date().toISOString();
  const baseDir = docDir(id);
  await ensureDir(baseDir);
  await ensureDir(versionsDir(id));

  const initialVersion: DocVersion = {
    id: randomUUID(),
    createdAt: now,
    author: input.author,
    ai: { flagged: false, confidence: 0, reasons: [] },
    content: input.initialContent ?? JSON.stringify({ type: "doc", content: [] }),
  };

  const doc: Doc = {
    id,
    title: input.title,
    current: initialVersion,
    versions: [versionMetaFrom(initialVersion)],
  };

  await fs.writeFile(currentPath(id), JSON.stringify(initialVersion, null, 2), "utf8");
  await fs.writeFile(versionFilePath(id, initialVersion.id), JSON.stringify(initialVersion, null, 2), "utf8");
  await fs.writeFile(metaPath(id), JSON.stringify({ id, title: input.title, updatedAt: now }, null, 2), "utf8");

  return doc;
}

function versionMetaFrom(v: DocVersion): DocVersionMeta {
  const { id, createdAt, author, ai } = v;
  return { id, createdAt, author, ai };
}

export async function listDocs(): Promise<DocSummary[]> {
  await ensureDir(DOCS_DIR);
  const ids = await fs.readdir(DOCS_DIR);
  const summaries: DocSummary[] = [];
  for (const id of ids) {
    const metaP = metaPath(id);
    try {
      const raw = await fs.readFile(metaP, "utf8");
      const meta = JSON.parse(raw) as { id: string; title: string; updatedAt: string };
      const current = await readCurrent(id);
      summaries.push({ id, title: meta.title, updatedAt: meta.updatedAt, latestAIFlag: current.ai.flagged });
    } catch {
      // skip
    }
  }
  summaries.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  return summaries;
}

export async function readCurrent(docId: string): Promise<DocVersion> {
  const raw = await fs.readFile(currentPath(docId), "utf8");
  return JSON.parse(raw) as DocVersion;
}

export async function readDoc(docId: string): Promise<Doc> {
  const current = await readCurrent(docId);
  const versDir = versionsDir(docId);
  const files = await fs.readdir(versDir);
  const metas: DocVersionMeta[] = [];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    const raw = await fs.readFile(path.join(versDir, f), "utf8");
    const v = JSON.parse(raw) as DocVersion;
    metas.push(versionMetaFrom(v));
  }
  metas.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return { id: docId, title: (await readMeta(docId)).title, current, versions: metas };
}

async function readMeta(docId: string): Promise<{ id: string; title: string; updatedAt: string }> {
  const raw = await fs.readFile(metaPath(docId), "utf8");
  return JSON.parse(raw) as { id: string; title: string; updatedAt: string };
}

export type SaveVersionInput = {
  docId: string;
  content: string; // JSON string of PM doc
  author?: string;
  ai: DocVersionMeta["ai"];
};

export async function saveNewVersion(input: SaveVersionInput): Promise<DocVersion> {
  const now = new Date().toISOString();
  const version: DocVersion = {
    id: randomUUID(),
    createdAt: now,
    author: input.author,
    ai: input.ai,
    content: input.content,
  };
  await ensureDir(docDir(input.docId));
  await ensureDir(versionsDir(input.docId));
  await fs.writeFile(versionFilePath(input.docId, version.id), JSON.stringify(version, null, 2), "utf8");
  await fs.writeFile(currentPath(input.docId), JSON.stringify(version, null, 2), "utf8");
  const meta = await readMeta(input.docId).catch(() => ({ id: input.docId, title: "Untitled", updatedAt: now }));
  await fs.writeFile(metaPath(input.docId), JSON.stringify({ ...meta, updatedAt: now }, null, 2), "utf8");
  return version;
}

export async function listVersions(docId: string): Promise<DocVersionMeta[]> {
  await ensureDir(versionsDir(docId));
  const files = await fs.readdir(versionsDir(docId)).catch(() => [] as string[]);
  const metas: DocVersionMeta[] = [];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    const raw = await fs.readFile(path.join(versionsDir(docId), f), "utf8");
    const v = JSON.parse(raw) as DocVersion;
    metas.push(versionMetaFrom(v));
  }
  metas.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return metas;
}

export async function readVersion(docId: string, versionId: string): Promise<DocVersion> {
  const raw = await fs.readFile(versionFilePath(docId, versionId), "utf8");
  return JSON.parse(raw) as DocVersion;
}

export async function restoreVersion(docId: string, versionId: string): Promise<DocVersion> {
  const v = await readVersion(docId, versionId);
  const now = new Date().toISOString();
  const restoreCopy: DocVersion = { ...v, id: randomUUID(), createdAt: now };
  await fs.writeFile(versionFilePath(docId, restoreCopy.id), JSON.stringify(restoreCopy, null, 2), "utf8");
  await fs.writeFile(currentPath(docId), JSON.stringify(restoreCopy, null, 2), "utf8");
  const meta = await readMeta(docId).catch(() => ({ id: docId, title: "Untitled", updatedAt: now }));
  await fs.writeFile(metaPath(docId), JSON.stringify({ ...meta, updatedAt: now }, null, 2), "utf8");
  return restoreCopy;
}


