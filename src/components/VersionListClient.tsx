"use client";
import { useEffect, useState } from "react";

export function VersionListClient({ docId }: { docId: string }) {
  const [versions, setVersions] = useState<Array<{ id: string; createdAt: string; ai: { flagged: boolean; confidence: number } }>>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/docs/${docId}/versions`, { cache: "no-store" });
    const v = await res.json();
    setVersions(v);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [docId]);

  async function restore(versionId: string) {
    await fetch(`/api/docs/${docId}/versions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId }),
    });
    await load();
  }

  if (loading) return <div>Loading…</div>;
  return (
    <ul className="space-y-2">
      {versions.map((v) => (
        <li key={v.id} className="text-sm flex items-center justify-between">
          <div>
            <div>{new Date(v.createdAt).toLocaleString()}</div>
            {v.ai.flagged && (
              <div className="text-[10px] text-yellow-800">AI flagged ({Math.round(v.ai.confidence * 100)}%)</div>
            )}
          </div>
          <button className="text-blue-600 hover:underline" onClick={() => restore(v.id)}>
            Restore
          </button>
        </li>
      ))}
    </ul>
  );
}


