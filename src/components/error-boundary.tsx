"use client";

import React, { type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 px-4">
          <div className="max-w-md w-full space-y-6">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-2">⚠️ Error</h1>
              <p className="text-slate-400 mb-4">
                Something went wrong. Please try refreshing the page.
              </p>
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="bg-red-900/20 border border-red-500/50 rounded p-4 text-left mb-4">
                  <p className="text-xs font-mono text-red-300 break-words">
                    {this.state.error.message}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Refresh Page
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

    return this.props.children;
  }
}
