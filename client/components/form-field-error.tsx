'use client';

import { AlertCircle } from 'lucide-react';

interface FormFieldErrorProps {
  error?: string | null;
  className?: string;
}

export function FormFieldError({ error, className = '' }: FormFieldErrorProps) {
  if (!error) return null;

  return (
    <p
      className={`flex items-center gap-1.5 text-xs text-rose-500 font-medium mt-1.5 animate-fadeIn ${className}`}
      role="alert"
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      <span>{error}</span>
    </p>
  );
}

