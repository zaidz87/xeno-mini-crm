/**
 * Toast Notification Context
 * Exposes a context provider and hook (useToast) to trigger beautiful
 * custom styled success/error toast alerts anywhere in the application.
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const success = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast]);
  const error = useCallback((msg, duration) => addToast(msg, 'error', duration), [addToast]);
  const info = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}
      {/* Toast HUD */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none max-w-md w-full">
        {toasts.map((toast) => {
          let borderTheme = 'border-[#2A2D3A]';
          let bgTheme = 'bg-[#1A1D27]';
          let icon = <Info className="w-5 h-5 text-indigo-400 shrink-0" />;

          if (toast.type === 'success') {
            borderTheme = 'border-emerald-500/20';
            bgTheme = 'bg-[#102A24]';
            icon = <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />;
          } else if (toast.type === 'error') {
            borderTheme = 'border-rose-500/20';
            bgTheme = 'bg-[#2A151C]';
            icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`flex items-start justify-between gap-3 p-4 rounded-xl border shadow-2xl pointer-events-auto transition-all duration-300 animate-fade-in ${bgTheme} ${borderTheme}`}
            >
              <div className="flex items-start gap-3">
                {icon}
                <p className="text-sm font-medium text-slate-100">{toast.message}</p>
              </div>
              <button
                onClick={() => remove(toast.id)}
                className="text-slate-400 hover:text-slate-200 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
