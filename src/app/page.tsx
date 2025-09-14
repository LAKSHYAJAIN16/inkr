"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 text-gray-900">
      {/* Header / Hero */}
      <header className="max-w-6xl mx-auto px-6 py-20 text-center">
        <p className="text-3xl font-cursive overflow-hidden">
          fingerprint
        </p>

        <p className="text-lg md:text-xl text-blue-700 mb-8 max-w-3xl mx-auto">
          Understand the evolution of a writer’s thought process, detect AI-assisted writing, and visualize revision patterns like never before.
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition"
        >
          Get Started
        </Link>
      </header>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-blue-900">
          Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="bg-white border border-blue-100 rounded-2xl p-6 shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-3 text-blue-800">AI Detection</h3>
            <p className="text-gray-700">
              Identify potential AI-assisted text using your personal writing fingerprint, not just generic detection tools.
            </p>
          </div>
          <div className="bg-white border border-blue-100 rounded-2xl p-6 shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-3 text-blue-800">Revision Analysis</h3>
            <p className="text-gray-700">
              Track sentence evolution and iteration history to see exactly how each idea developed over time.
            </p>
          </div>
          <div className="bg-white border border-blue-100 rounded-2xl p-6 shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-3 text-blue-800">Explainable Insights</h3>
            <p className="text-gray-700">
              Get detailed, human-readable explanations on why a section of text may be suspicious or out of character.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-blue-100 py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-blue-900 mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-white rounded-2xl p-6 shadow hover:shadow-lg transition">
              <h3 className="text-xl font-semibold mb-3 text-blue-800">1. Build Your Fingerprint</h3>
              <p className="text-gray-700">
                Analyze historical writings to create a unique profile of your style, revision habits, and sentence evolution patterns.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow hover:shadow-lg transition">
              <h3 className="text-xl font-semibold mb-3 text-blue-800">2. Compare New Text</h3>
              <p className="text-gray-700">
                Incoming texts are compared against your fingerprint to detect inconsistencies, copy-paste patterns, or AI assistance.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow hover:shadow-lg transition">
              <h3 className="text-xl font-semibold mb-3 text-blue-800">3. Explainable Reports</h3>
              <p className="text-gray-700">
                Receive sentence-level insights and visualizations showing where and why the text may deviate from expected writing behavior.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-blue-900 mb-6">Ready to See Your Fingerprint?</h2>
        <p className="text-blue-700 mb-8 text-lg md:text-xl">
          Sign up and start analyzing your writing process like never before.
        </p>
        <Link
          href="/signup"
          className="inline-block bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition"
        >
          Sign Up Now
        </Link>
      </section>

      <footer className="bg-blue-50 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-600">
          © {new Date().getFullYear()} Writing Fingerprint. All rights reserved.
        </div>
      </footer>

    </div>
  );
}
