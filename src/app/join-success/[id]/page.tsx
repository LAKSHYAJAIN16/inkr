"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";

export default function JoinSuccessPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sp = useSearchParams();
  const classroomId = params?.id;
  const error = sp.get("error");

  if (!classroomId) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-black px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 shadow-sm rounded-lg p-6 text-center">
        {error === "not_found" ? (
          <>
            <h1 className="text-xl font-semibold mb-2">Classroom not found</h1>
            <p className="text-sm text-gray-600 mb-4">The invitation link seems invalid or the classroom was removed.</p>
          </>
        ) : error === "auth_failed" ? (
          <>
            <h1 className="text-xl font-semibold mb-2">Sign-in failed</h1>
            <p className="text-sm text-gray-600 mb-4">We couldn't complete Google sign-in. Please try again.</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold mb-2">You joined the classroom!</h1>
            <p className="text-sm text-gray-600 mb-4">Classroom ID: {classroomId}</p>
          </>
        )}
        <div className="flex justify-center">
          <button onClick={() => router.replace('/dashboard')} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Go to Dashboard</button>
        </div>
      </div>
    </div>
  );
}
