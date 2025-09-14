"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function TeacherSignupPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [idCode, setIdCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [teacher, setTeacher] = useState<{ id: string; name: string; school: string; subject: string } | null>(null);
  const [classroomName, setClassroomName] = useState("");
  const [createdClassroomId, setCreatedClassroomId] = useState<string | null>(null);

  const verifyTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const ref = doc(db, "teachers", idCode.trim());
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setError("No teacher found with that ID. Please check your code and try again.");
        return;
      }
      const data = snap.data() as any;
      const t = {
        id: snap.id,
        name: data.name ?? "",
        school: data.school ?? "",
        subject: data.subject ?? "",
      };
      setTeacher(t);
      setStep(2);
    } catch (err: any) {
      setError(err?.message || "Failed to verify teacher.");
    } finally {
      setLoading(false);
    }
  };

  const createClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;
    setError(null);
    setLoading(true);
    try {
      const teacherRef = doc(db, "teachers", teacher.id);
      const result = await addDoc(collection(db, "classrooms"), {
        name: classroomName.trim(),
        teacherRef,
        teacher: { id: teacher.id, name: teacher.name, school: teacher.school, subject: teacher.subject },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setCreatedClassroomId(result.id);
      // Optionally route somewhere, for now stay and show confirmation
      // router.replace(`/classroom/${result.id}`);
    } catch (err: any) {
      setError(err?.message || "Failed to create classroom.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-black min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white shadow-sm border border-gray-200 rounded-lg p-6">
        <h1 className="text-xl font-semibold mb-4">Teacher Signup</h1>
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>
        )}

        {step === 1 && (
          <form onSubmit={verifyTeacher} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teacher ID Code</label>
              <input
                type="text"
                value={idCode}
                onChange={(e) => setIdCode(e.target.value)}
                placeholder="Enter your teacher ID"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !idCode.trim()}
              className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  <span>Verifying…</span>
                </>
              ) : (
                <span>Verify</span>
              )}
            </button>
          </form>
        )}

        {step === 2 && teacher && (
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm">
              <div className="font-medium mb-1">Verified Teacher</div>
              <div><span className="text-gray-500">Name:</span> {teacher.name || "—"}</div>
              <div><span className="text-gray-500">School:</span> {teacher.school || "—"}</div>
              <div><span className="text-gray-500">Subject:</span> {teacher.subject || "—"}</div>
            </div>

            {!createdClassroomId ? (
              <form onSubmit={createClassroom} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Classroom Name</label>
                  <input
                    type="text"
                    value={classroomName}
                    onChange={(e) => setClassroomName(e.target.value)}
                    placeholder="e.g., Algebra I - Period 2"
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !classroomName.trim()}
                  className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                      <span>Creating…</span>
                    </>
                  ) : (
                    <span>Create Classroom</span>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="text-green-700 bg-green-50 border border-green-200 rounded p-2 text-sm">
                  Classroom created successfully.
                </div>
                <button
                  onClick={() => router.replace(`/classroom/${createdClassroomId}`)}
                  className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700"
                >
                  Go to Classroom
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
