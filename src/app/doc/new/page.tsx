"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function NewDocPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ref = await addDoc(collection(db, "docs"), {
          title: "Untitled Document",
          author: null,
          content: { type: "doc", content: [] },
          plainText: "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        if (!cancelled) router.replace(`/doc/${ref.id}`);
      } catch (e) {
        // Fallback: if creation fails, still route to a random doc path so EditorClient can seed
        if (!cancelled) router.replace(`/doc/${crypto.randomUUID()}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
