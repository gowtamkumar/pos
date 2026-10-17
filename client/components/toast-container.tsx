'use client';

import React from 'react';
import { useToasts, Toast } from '../lib/toast';
import { CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react';

export function ToastContainer() {
  const toasts = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-success animate-bounce" />,
          error: <XCircle className="w-5 h-5 text-danger" />,
          warning: <AlertCircle className="w-5 h-5 text-warning" />,
          info: <Info className="w-5 h-5 text-primary" />,
        };

        const borders = {
          success: 'border-success/30 bg-success/10',
          error: 'border-danger/30 bg-danger/10',
          warning: 'border-warning/30 bg-warning/10',
          info: 'border-primary/30 bg-primary/10',
        };

        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 transform translate-y-0 animate-fade-in-up ${borders[toast.type]}`}
          >
            {icons[toast.type]}
            <p className="text-sm font-medium text-slate-100">{toast.message}</p>
          </div>
        );
      })}
    </div>
  );
}
