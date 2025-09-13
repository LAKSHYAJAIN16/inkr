import { NextRequest, NextResponse } from "next/server";
import { readDoc } from "@/lib/storage";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const doc = await readDoc(params.id);
  return NextResponse.json(doc);
}


