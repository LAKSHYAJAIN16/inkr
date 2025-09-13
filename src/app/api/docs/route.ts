import { NextRequest, NextResponse } from "next/server";
import { createDoc, listDocs } from "@/lib/storage";

export async function GET() {
  const docs = await listDocs();
  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const title = (body?.title as string) || "Untitled";
  const author = (body?.author as string | undefined) || undefined;
  const initialContent = (body?.content as string | undefined) || undefined;
  const doc = await createDoc({ title, author, initialContent });
  return NextResponse.json(doc);
}


