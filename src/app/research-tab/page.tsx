"use client";

import Link from "next/link";
import ResearchTabClient from '@/components/ResearchTabClient';

export default function ResearchTabPage() {
  return (
    <div className="h-screen bg-white">
      {/* Minimal header with just back button */}
      <div className="absolute bottom-4 left-4 z-10">
        <Link 
          href="/" 
          className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
        >
          ← Back
        </Link>
      </div>
      <ResearchTabClient />
    </div>
  );
}
