"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";

type UserDoc = {
  name?: string;
  email?: string;
  photoURL?: string;
  school?: string;
  classrooms?: any[]; // DocumentReference[]
};

type Classroom = { id: string; name: string };

type Assignment = {
  id: string;
  name: string;
  dueAt?: string; // ISO
  classroomId: string;
};

type StudentDoc = { id: string; assignmentId?: string };

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<UserDoc | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [studentDocs, setStudentDocs] = useState<Record<string, StudentDoc>>({}); // assignmentId -> doc
  const [showClassModal, setShowClassModal] = useState(false);
  const [classModalLoading, setClassModalLoading] = useState(false);
  const [classModalData, setClassModalData] = useState<{
    id: string;
    name?: string;
    teacherName?: string;
    studentCount?: number;
    assignmentCount?: number;
    joinLink?: string;
  } | null>(null);

  // load auth from localStorage and fetch dashboard data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cached = typeof window !== 'undefined' ? localStorage.getItem("userAuth") : null;
        if (!cached) {
          const last = typeof window !== 'undefined' ? localStorage.getItem("lastClassroomId") : null;
          router.replace(last ? `/join/${last}` : "/");
          return;
        }
        const auth = JSON.parse(cached) as { userId?: string; email?: string };
        if (!auth?.userId) {
          const last = typeof window !== 'undefined' ? localStorage.getItem("lastClassroomId") : null;
          router.replace(last ? `/join/${last}` : "/");
          return;
        }
        setUserId(auth.userId);

        // load user document
        const userRef = doc(db, "users", auth.userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          setError("User not found");
          setLoading(false);
          return;
        }
        const userData = userSnap.data() as UserDoc;
        if (cancelled) return;
        setUser(userData);

        // fetch classrooms
        const classroomRefs = (userData.classrooms || []) as any[];
        const classList: Classroom[] = [];
        for (const ref of classroomRefs) {
          try {
            const snap = await getDoc(ref);
            if (snap.exists()) classList.push({ id: snap.id, name: (snap.data() as any)?.name || "Untitled" });
          } catch {}
        }
        if (cancelled) return;
        setClassrooms(classList);

        // fetch assignments per classroom
        const assignList: Assignment[] = [];
        for (const c of classList) {
          const qA = query(collection(db, "assignments"), where("classroomId", "==", c.id));
          const aSnap = await getDocs(qA);
          aSnap.forEach(d => {
            const data = d.data() as any;
            assignList.push({ id: d.id, name: data.name || "Untitled", dueAt: data.dueAt, classroomId: data.classroomId });
          });
        }
        if (cancelled) return;
        // sort by due date ascending
        assignList.sort((a, b) => (new Date(a.dueAt || 0).getTime() - new Date(b.dueAt || 0).getTime()));
        setAssignments(assignList);

        // fetch user's docs to map assignments -> docId
        const docsCol = collection(db, "docs");
        // Preferred: by top-level userId
        const dSnapUser = await getDocs(query(docsCol, where("userId", "==", auth.userId)));
        const map: Record<string, StudentDoc> = {};
        dSnapUser.forEach(d => {
          const data = d.data() as any;
          if (data.assignmentId) map[data.assignmentId] = { id: d.id, assignmentId: data.assignmentId };
        });
        // Back-compat: also include older docs keyed by student.id
        const dSnapLegacy = await getDocs(query(docsCol, where("student.id", "==", auth.userId)));
        dSnapLegacy.forEach(d => {
          const data = d.data() as any;
          if (data.assignmentId && !map[data.assignmentId]) map[data.assignmentId] = { id: d.id, assignmentId: data.assignmentId };
        });
        if (cancelled) return;
        setStudentDocs(map);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return assignments.filter(a => a.dueAt && new Date(a.dueAt).getTime() >= now);
  }, [assignments]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center text-slate-600">
        <svg className="animate-spin h-16 w-16 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
        <span className="mt-3 text-sm">Loading dashboard…</span>
      </div>
    </div>
  );
  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white border border-red-200 text-red-700 px-4 py-3 rounded shadow-sm">{error}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-black">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.name || user.email || 'User'} className="w-10 h-10 rounded-full border border-slate-200 object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold border border-indigo-200">
                {(user?.name || user?.email || '?').slice(0,2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="text-lg font-semibold text-slate-900">Welcome{user?.name ? `, ${user.name}` : ''}</div>
              {user?.school && <div className="text-xs text-slate-500">{user.school}</div>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming assignments (left, wider) */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-5">
            <h2 className="text-lg font-medium text-slate-900 mb-3">Upcoming Assignments</h2>
            {upcoming.length === 0 ? (
              <div className="text-sm text-slate-500">No upcoming deadlines.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {upcoming.map(a => {
                  const docForA = studentDocs[a.id];
                  const cls = classrooms.find(c => c.id === a.classroomId);
                  return (
                    <li key={a.id} className="flex items-center justify-between py-2">
                      <div>
                        <div className="text-sm font-medium text-slate-900">{a.name}</div>
                        <div className="text-xs text-slate-500">{cls?.name || 'Unknown class'}</div>
                        <div className="text-xs text-slate-400">Due {a.dueAt ? new Date(a.dueAt).toLocaleString() : '—'}</div>
                      </div>
                      {docForA ? (
                        <button onClick={() => router.push(`/doc/${docForA.id}`)} className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700">Open</button>
                      ) : (
                        <span className="text-xs text-slate-400">No document yet</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Classrooms (right) */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
            <h2 className="text-lg font-medium text-slate-900 mb-3">Your Classrooms</h2>
            {classrooms.length === 0 ? (
              <div className="text-sm text-slate-500">No classrooms yet. Join from an invite link.</div>
            ) : (
              <ul className="space-y-2">
                {classrooms.map(c => (
                  <li key={c.id} className="flex items-center justify-between text-sm border rounded px-3 py-2">
                    <div className="font-medium text-slate-900">{c.name}</div>
                    <button
                      onClick={async () => {
                        setClassModalLoading(true);
                        setShowClassModal(true);
                        try {
                          const origin = typeof window !== 'undefined' ? window.location.origin : '';
                          const classRef = doc(db, 'classrooms', c.id);
                          const snap = await getDoc(classRef);
                          const data = snap.data() as any;
                          // Counts
                          const qAss = query(collection(db, 'assignments'), where('classroomId', '==', c.id));
                          const aSnap = await getDocs(qAss);
                          const qStu = query(collection(db, 'users'), where('classrooms', 'array-contains', classRef));
                          const sSnap = await getDocs(qStu);
                          setClassModalData({
                            id: c.id,
                            name: data?.name || c.name,
                            teacherName: data?.teacher?.name,
                            assignmentCount: aSnap.size,
                            studentCount: sSnap.size,
                            joinLink: origin ? `${origin}/join/${c.id}` : `/join/${c.id}`,
                          });
                        } finally {
                          setClassModalLoading(false);
                        }
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      Open
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      {showClassModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-900">Classroom</h3>
              <button onClick={() => setShowClassModal(false)} className="text-slate-500 hover:text-slate-700">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {classModalLoading ? (
              <div className="flex flex-col items-center text-slate-600 py-6">
                <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                <span className="mt-3 text-sm">Loading…</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-sm text-slate-500">Name</div>
                <div className="text-base font-medium text-slate-900">{classModalData?.name}</div>
                {classModalData?.teacherName && (
                  <>
                    <div className="text-sm text-slate-500 pt-2">Teacher</div>
                    <div className="text-sm text-slate-700">{classModalData?.teacherName}</div>
                  </>
                )}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-sm text-slate-500">Students</div>
                  <div className="text-sm font-medium text-slate-900">{classModalData?.studentCount ?? 0}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-500">Assignments</div>
                  <div className="text-sm font-medium text-slate-900">{classModalData?.assignmentCount ?? 0}</div>
                </div>
                <div className="pt-3">
                  <div className="text-sm text-slate-500">Join link</div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-mono truncate max-w-[70%]">{classModalData?.joinLink}</div>
                    <button
                      onClick={() => {
                        if (classModalData?.joinLink) navigator.clipboard.writeText(classModalData.joinLink);
                      }}
                      className="px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-4">
                  <button onClick={() => setShowClassModal(false)} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">Close</button>
                  <button onClick={() => { setShowClassModal(false); router.push(`/classroom/${classModalData?.id}`); }} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Go to classroom</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
