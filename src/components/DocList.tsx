import Link from "next/link";
import { absoluteUrl } from "@/lib/absoluteUrl";

async function fetchDocs() {
  const res = await fetch(await absoluteUrl("/api/docs"), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load docs");
  return (await res.json()) as Array<{ id: string; title: string; updatedAt: string; latestAIFlag: boolean }>;
}

export async function DocList() {
  const docs = await fetchDocs();
  if (docs.length === 0) {
    return (
      <div className="text-gray-600">
        No documents yet. Create your first one with the New Document button.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-gray-200 bg-white rounded border text-black">
      {docs.map((d) => (
        <li key={d.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
          <div>
            <Link href={`/doc/${d.id}`} className="font-medium hover:underline">
              {d.title}
            </Link>
            <div className="text-xs text-gray-500">Updated {new Date(d.updatedAt).toLocaleString()}</div>
          </div>
          {d.latestAIFlag && <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">AI flagged</span>}
        </li>
      ))}
    </ul>
  );
}


