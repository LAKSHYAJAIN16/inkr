"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, onSnapshot, addDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";

type ClassroomDoc = {
  name: string;
  teacher?: { id: string; name?: string; school?: string; subject?: string };
  teacherRef?: any;
  createdAt?: any;
  updatedAt?: any;
};

export default function ClassroomPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const classroomId = params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ClassroomDoc | null>(null);
  const [students, setStudents] = useState<Array<{ id: string; name?: string; email?: string; school?: string; photoURL?: string }>>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignName, setAssignName] = useState("");
  const [assignDue, setAssignDue] = useState(""); // ISO from datetime-local
  const [assignStyle, setAssignStyle] = useState<"MLA"|"Chicago"|"APA">("MLA");
  const [allowSpellcheck, setAllowSpellcheck] = useState(true);
  const [allowCitationTools, setAllowCitationTools] = useState(true);
  const [savingAssign, setSavingAssign] = useState(false);
  const [saveError, setSaveError] = useState<string|null>(null);

  useEffect(() => {
    if (!classroomId) return;
    setLoading(true);
    setError(null);

    const classroomRef = doc(db, "classrooms", classroomId);
    // Subscribe to classroom doc
    const unsubClass = onSnapshot(classroomRef, (snap) => {
      if (!snap.exists()) {
        setError("Classroom not found");
        setLoading(false);
        return;
      }
      setData(snap.data() as ClassroomDoc);
      setLoading(false);
    }, (err) => {
      setError(err?.message || "Failed to load classroom");
      setLoading(false);
    });

    // Subscribe to users in classroom
    const usersQ = query(collection(db, "users"), where("classrooms", "array-contains", classroomRef));
    const unsubUsers = onSnapshot(usersQ, (qSnap) => {
      const list = qSnap.docs.map((u) => ({ id: u.id, ...(u.data() as any) }));
      setStudents(list);
    }, (err) => {
      setError(err?.message || "Failed to load students");
    });

    return () => {
      unsubClass();
      unsubUsers();
    };
  }, [classroomId]);

  if (!classroomId) return null;
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center text-slate-600">
        <svg className="animate-spin h-16 w-16 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
        <span className="mt-3 text-sm">Loading classroom…</span>
      </div>
    </div>
  );
  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white border border-red-200 text-red-700 px-4 py-3 rounded shadow-sm">{error}</div>
    </div>
  );
  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-black">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{data.name}</h1>
              <div className="text-sm text-slate-600 mt-1">Classroom ID: <span className="font-mono">{classroomId}</span></div>
              <div className="text-sm text-slate-600 mt-1">
                Link for students: {" "}
                <a href={`http://localhost:3000/join/${classroomId}`} className="text-blue-600 hover:underline">{`http://localhost:3000/join/${classroomId}`}</a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAssignModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">assignment_add</span>
                Create Assignment
              </button>
              <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs border border-blue-100">Active</span>
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Teacher card */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
            <h2 className="text-lg font-medium text-slate-900 mb-3">Teacher</h2>
            {data.teacher ? (
              <div className="text-sm text-slate-700 space-y-1">
                <div><span className="text-slate-500">Name:</span> {data.teacher.name || "—"}</div>
                <div><span className="text-slate-500">School:</span> {data.teacher.school || "—"}</div>
                <div><span className="text-slate-500">Subject:</span> {data.teacher.subject || "—"}</div>
                <div className="text-slate-500 mt-2">Teacher ID: <span className="font-mono">{data.teacher.id}</span></div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">No teacher info stored.</div>
            )}
          </div>

          {/* Students card */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium text-slate-900">Students</h2>
              <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">{students.length} total</span>
            </div>
            {students.length === 0 ? (
              <div className="text-sm text-slate-500">No students have joined yet.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {students.map((s) => {
                  const initials = (s.name || s.email || '?')
                    .split(' ')
                    .map(part => part[0])
                    .slice(0,2)
                    .join('')
                    .toUpperCase();
                  return (
                    <li key={s.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        {s.photoURL ? (
                          <img src={s.photoURL} alt={s.name || s.email || 'Student'} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold border border-indigo-200">
                            {initials}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-slate-900">{s.name || s.email || 'Unnamed student'}</div>
                          <div className="text-xs text-slate-500">{s.email || ''}</div>
                        </div>
                      </div>
                      {s.school && <div className="text-sm text-slate-600">{s.school}</div>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Create Assignment</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-500 hover:text-slate-700">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {saveError && (
              <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{saveError}</div>
            )}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSaveError(null);
                setSavingAssign(true);
                try {
                  if (!assignName.trim()) throw new Error('Please enter an assignment name');
                  if (!assignDue) throw new Error('Please pick a due date/time');
                  const classroomRef = doc(db, 'classrooms', classroomId!);

                  // Create assignment
                  const assignmentDoc = await addDoc(collection(db, 'assignments'), {
                    name: assignName.trim(),
                    dueAt: new Date(assignDue).toISOString(),
                    citationStyle: assignStyle,
                    options: { allowSpellcheck, allowCitationTools },
                    classroomRef,
                    classroomId,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                  });

                  // Add to classroom.assignments array (no serverTimestamp inside arrayUnion)
                  await updateDoc(classroomRef, {
                    assignments: arrayUnion({
                      id: assignmentDoc.id,
                      name: assignName.trim(),
                      dueAt: new Date(assignDue).toISOString(),
                      citationStyle: assignStyle,
                      options: { allowSpellcheck, allowCitationTools },
                    })
                  });

                  // Create per-student documents in 'docs'
                  const studentsSnapshot = students; // already live in state
                  for (const s of studentsSnapshot) {
                    const title = `${s.name || s.email || 'Student'} : ${assignName.trim()}`;
                    await addDoc(collection(db, 'docs'), {
                      title,
                      content: { type: 'doc', content: [] },
                      plainText: '',
                      classroomId,
                      assignmentId: assignmentDoc.id,
                      userId: s.id,
                      student: { id: s.id, name: s.name || '', email: s.email || '', school: s.school || '', photoURL: s.photoURL || '' },
                      createdAt: serverTimestamp(),
                      updatedAt: serverTimestamp(),
                    });
                  }

                  // Reset and close
                  setAssignName('');
                  setAssignDue('');
                  setAssignStyle('MLA');
                  setAllowSpellcheck(true);
                  setAllowCitationTools(true);
                  setShowAssignModal(false);
                } catch (err: any) {
                  setSaveError(err?.message || 'Failed to create assignment');
                } finally {
                  setSavingAssign(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assignment Name</label>
                <input
                  type="text"
                  value={assignName}
                  onChange={(e) => setAssignName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Research Paper #1"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date & Time</label>
                  <input
                    type="datetime-local"
                    value={assignDue}
                    onChange={(e) => setAssignDue(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Citation Style</label>
                  <select
                    value={assignStyle}
                    onChange={(e) => setAssignStyle(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MLA">MLA</option>
                    <option value="Chicago">Chicago</option>
                    <option value="APA">APA</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={allowSpellcheck} onChange={(e) => setAllowSpellcheck(e.target.checked)} />
                  Allow Spellcheck
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={allowCitationTools} onChange={(e) => setAllowCitationTools(e.target.checked)} />
                  Allow Built-in Citation Tools
                </label>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={savingAssign} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                  {savingAssign ? 'Creating…' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
