"use client";

import { Component, ReactNode } from "react";
import { motion } from "framer-motion";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onReset?: () => void;
  title?: string;
  description?: string;
}

export function ErrorFallback({ 
  error, 
  onReset, 
  title = "Something went wrong",
  description = "We encountered an unexpected error. Please try again."
}: ErrorFallbackProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-8 text-center"
      role="alert"
      aria-live="assertive"
    >
      <div className="text-6xl mb-4">😵</div>
      <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
      <p className="text-purple-300 mb-6 max-w-md">{description}</p>
      
      {error && process.env.NODE_ENV === "development" && (
        <details className="mb-6 max-w-md text-left">
          <summary className="text-purple-400 cursor-pointer hover:text-purple-300 text-sm">
            Error details (dev only)
          </summary>
          <pre className="mt-2 p-3 bg-slate-800/50 rounded-lg text-red-400 text-xs overflow-auto max-h-32">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        </details>
      )}

      <div className="flex gap-3">
        {onReset && (
          <button
            onClick={onReset}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Try Again
          </button>
        )}
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          Reload Page
        </button>
      </div>
    </motion.div>
  );
}

// API Error display component
interface ApiErrorProps {
  error: string | Error | null;
  onRetry?: () => void;
  className?: string;
}

export function ApiError({ error, onRetry, className = "" }: ApiErrorProps) {
  if (!error) return null;

  const errorMessage = typeof error === "string" ? error : error.message;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 bg-red-500/10 border border-red-500/20 rounded-xl ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-5 h-5 text-red-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-red-300 text-sm">{errorMessage}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex-shrink-0 text-red-400 hover:text-red-300 text-sm underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
            aria-label="Retry"
          >
            Retry
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Inline error message for form fields
interface FieldErrorProps {
  error?: string;
  id?: string;
}

export function FieldError({ error, id }: FieldErrorProps) {
  if (!error) return null;

  return (
    <motion.p
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-red-400 text-xs mt-1"
      id={id}
      role="alert"
    >
      {error}
    </motion.p>
  );
}
