import { NextRequest, NextResponse } from "next/server";
import { listVersions, readVersion, restoreVersion, saveNewVersion } from "@/lib/storage";
import { openAiDetectAI } from "@/lib/ai";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const versions = await listVersions(params.id);
  return NextResponse.json(versions);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const content = (body?.content as string) || "";
  const author = (body?.author as string | undefined) || undefined;
  const plainText = (body?.plainText as string | undefined) || "";
  const ai = await openAiDetectAI(plainText || content);
  const version = await saveNewVersion({ docId: params.id, content, author, ai });
  return NextResponse.json(version);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const versionId = (body?.versionId as string) || "";
  if (!versionId) return NextResponse.json({ error: "versionId required" }, { status: 400 });
  const restored = await restoreVersion(params.id, versionId);
  return NextResponse.json(restored);
}

export async function HEAD(_req: NextRequest, { params }: { params: { id: string } }) {
  // optionally retrieve latest version id
  const versions = await listVersions(params.id);
  const latest = versions[0]?.id || null;
  return new Response(null, { status: 200, headers: { "x-latest-version": latest ?? "" } });
}


