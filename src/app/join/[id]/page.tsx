"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { collection, doc, getDoc, query, where, getDocs, setDoc, updateDoc, arrayUnion } from "firebase/firestore";

export default function JoinClassroomPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const classroomId = params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classroomExists, setClassroomExists] = useState(false);

  // Verify classroom and handle cached auth on mount
  useEffect(() => {
    if (!classroomId) return;
    let cancelled = false;
    (async () => {
      try {
        // Ensure classroom exists
        const classroomRef = doc(db, "classrooms", classroomId);
        const snap = await getDoc(classroomRef);
        if (!snap.exists()) {
          router.replace(`/join-success/${classroomId}?error=not_found`);
          return;
        }
        // If already authed locally, add membership then redirect
        const cached = localStorage.getItem("userAuth");
        if (cached) {
          try {
            const authObj = JSON.parse(cached) as { userId?: string; email?: string; name?: string };
            if (authObj?.userId) {
              const userRef = doc(db, 'users', authObj.userId);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                await updateDoc(userRef, {
                  classrooms: arrayUnion(classroomRef),
                  updatedAt: new Date().toISOString(),
                });
              } else if (authObj.email) {
                // fallback by email
                const usersCol = collection(db, 'users');
                const q = query(usersCol, where('email', '==', authObj.email));
                const qSnap = await getDocs(q);
                if (!qSnap.empty) {
                  await updateDoc(qSnap.docs[0].ref, {
                    classrooms: arrayUnion(classroomRef),
                    updatedAt: new Date().toISOString(),
                  });
                }
              }
            }
          } finally {
            if (!cancelled) {
              localStorage.setItem('lastClassroomId', classroomId);
              router.replace(`/join-success/${classroomId}`);
            }
          }
          return;
        }
        if (!cancelled) setClassroomExists(true);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to open join page");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [classroomId, router]);

  const handleGoogleSignIn = useCallback(async () => {
    if (!classroomId) return;
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const email = user.email || "";
      const displayName = user.displayName || "";

      const classroomRef = doc(db, "classrooms", classroomId);
      const classroomSnap = await getDoc(classroomRef);
      if (!classroomSnap.exists()) {
        router.replace(`/join-success/${classroomId}?error=not_found`);
        return;
      }

      // Upsert user in `users` collection by email
      const usersCol = collection(db, "users");
      const q = query(usersCol, where("email", "==", email));
      const qSnap = await getDocs(q);

      let userId: string;
      if (qSnap.empty) {
        const userDocRef = doc(usersCol);
        await setDoc(userDocRef, {
          email,
          name: displayName,
          photoURL: user.photoURL || "",
          school: classroomSnap.data()?.teacher?.school || "",
          classrooms: [classroomRef],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        userId = userDocRef.id;
      } else {
        const existing = qSnap.docs[0];
        userId = existing.id;
        await updateDoc(existing.ref, {
          classrooms: arrayUnion(classroomRef),
          // backfill name/photo if empty
          ...(displayName ? { name: displayName } : {}),
          ...(user.photoURL ? { photoURL: user.photoURL } : {}),
          updatedAt: new Date().toISOString(),
        });
      }

      localStorage.setItem("userAuth", JSON.stringify({ uid: user.uid, email, name: displayName, photoURL: user.photoURL || "", userId }));
      localStorage.setItem("lastClassroomId", classroomId);
      router.replace(`/join-success/${classroomId}`);
    } catch (e: any) {
      router.replace(`/join-success/${classroomId}?error=auth_failed`);
    } finally {
      setLoading(false);
    }
  }, [classroomId, router]);

  if (!classroomId) return null;
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading…</div>;
  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white border border-red-200 text-red-700 px-4 py-3 rounded shadow-sm">{error}</div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-black px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 shadow-sm rounded-lg p-6 text-center">
        <h1 className="text-xl font-semibold mb-2">Join Classroom</h1>
        <p className="text-sm text-gray-600 mb-6">Classroom ID: {classroomId}</p>
        {classroomExists ? (
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 rounded py-2"
          >
            <img src="/google.svg" alt="Google" className="w-4 h-4" />
            <span>Sign in with Google</span>
          </button>
        ) : (
          <div className="text-sm text-gray-600">Checking classroom…</div>
        )}
      </div>
    </div>
  );
}
