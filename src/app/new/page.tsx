"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewDocPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [loading, setLoading] = useState(false);

  async function create() {
    setLoading(true);
    const res = await fetch("/api/docs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title || "Untitled", author }),
    });
    const doc = await res.json();
    router.push(`/doc/${doc.id}`);
  }

  return (
    <div className="max-w-xl mx-auto p-6 text-black">
      <h1 className="text-xl font-semibold mb-4">New Document</h1>
      <div className="space-y-4 bg-white p-4 rounded border">
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input className="w-full border rounded px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Author</label>
          <input className="w-full border rounded px-3 py-2" value={author} onChange={(e) => setAuthor(e.target.value)} />
        </div>
        <button onClick={create} disabled={loading} className="px-3 py-2 bg-blue-600 text-white rounded">
          {loading ? "Creating…" : "Create"}
        </button>
      </div>
    </div>
  );
}


