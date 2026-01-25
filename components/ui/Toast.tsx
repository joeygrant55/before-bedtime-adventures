"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  success: (message: string, options?: Partial<Omit<Toast, "id" | "message" | "type">>) => string;
  error: (message: string, options?: Partial<Omit<Toast, "id" | "message" | "type">>) => string;
  info: (message: string, options?: Partial<Omit<Toast, "id" | "message" | "type">>) => string;
  warning: (message: string, options?: Partial<Omit<Toast, "id" | "message" | "type">>) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TOAST_CONFIG: Record<ToastType, { icon: string; bgClass: string; borderClass: string; textClass: string }> = {
  success: {
    icon: "✓",
    bgClass: "bg-green-500/10",
    borderClass: "border-green-500/30",
    textClass: "text-green-400",
  },
  error: {
    icon: "✕",
    bgClass: "bg-red-500/10",
    borderClass: "border-red-500/30",
    textClass: "text-red-400",
  },
  info: {
    icon: "ℹ",
    bgClass: "bg-blue-500/10",
    borderClass: "border-blue-500/30",
    textClass: "text-blue-400",
  },
  warning: {
    icon: "⚠",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/30",
    textClass: "text-amber-400",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const duration = toast.duration ?? 5000;

    setToasts((prev) => [...prev, { ...toast, id }]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }

    return id;
  }, [removeToast]);

  const success = useCallback(
    (message: string, options?: Partial<Omit<Toast, "id" | "message" | "type">>) =>
      addToast({ message, type: "success", ...options }),
    [addToast]
  );

  const error = useCallback(
    (message: string, options?: Partial<Omit<Toast, "id" | "message" | "type">>) =>
      addToast({ message, type: "error", duration: 8000, ...options }),
    [addToast]
  );

  const info = useCallback(
    (message: string, options?: Partial<Omit<Toast, "id" | "message" | "type">>) =>
      addToast({ message, type: "info", ...options }),
    [addToast]
  );

  const warning = useCallback(
    (message: string, options?: Partial<Omit<Toast, "id" | "message" | "type">>) =>
      addToast({ message, type: "warning", duration: 6000, ...options }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info, warning }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const config = TOAST_CONFIG[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`pointer-events-auto ${config.bgClass} ${config.borderClass} border backdrop-blur-xl rounded-xl p-4 shadow-lg flex items-start gap-3`}
      role="alert"
      aria-atomic="true"
    >
      {/* Icon */}
      <div className={`flex-shrink-0 w-6 h-6 rounded-full ${config.bgClass} flex items-center justify-center ${config.textClass} text-sm font-bold`}>
        {config.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${config.textClass}`}>{toast.message}</p>
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick();
              onRemove(toast.id);
            }}
            className={`mt-2 text-sm font-medium ${config.textClass} underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 rounded`}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={() => onRemove(toast.id)}
        className={`flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors ${config.textClass}`}
        aria-label="Dismiss notification"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
