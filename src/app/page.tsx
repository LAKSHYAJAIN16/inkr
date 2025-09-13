import Link from "next/link";
import { Suspense } from "react";
import { DocList } from "@/components/DocList";

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="flex items-center justify-between py-6">
        <h1 className="text-2xl font-semibold">School Editor</h1>
        <Link href="/new" className="px-3 py-2 bg-blue-600 text-white rounded">New Document</Link>
      </header>
      <Suspense fallback={<div>Loading…</div>}>
        {/* @ts-expect-error Server Component */}
        <DocList />
      </Suspense>
    </div>
  );
}
