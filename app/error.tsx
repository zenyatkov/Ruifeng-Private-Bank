"use client";

import { useEffect } from "react";

export function GlobalErrorHandler({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">⚠️ Something Went Wrong</h1>
          <p className="text-slate-400 mb-4">
            An unexpected error occurred. Please try again.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
          <a
            href="/"
            className="block w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-center transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
