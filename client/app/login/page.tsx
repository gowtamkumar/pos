'use client';

import { FormFieldError } from '@/components/form-field-error';
import { useZodForm } from '@/hooks/use-zod-form';
import { useAuth } from '@/lib/auth-context';
import { LoginInput, loginSchema } from '@/lib/schemas';
import { showToast } from '@/lib/toast';
import { Lock, ShoppingBag, User } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LoginPage() {
  const { login } = useAuth();

  const {
    values,
    setFieldValue,
    errors,
    touched,
    handleBlur,
    handleSubmit,
    isSubmitting,
  } = useZodForm<LoginInput>({
    schema: loginSchema,
    defaultValues: {
      credential: '',
      password: '',
    },
    onSubmit: async (validData) => {
      try {
        await login(validData);
        showToast('Welcome back!', 'success');
      } catch (error: any) {
        showToast(
          error.response?.data?.message || 'Login failed. Please check your credentials.',
          'error'
        );
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-100 dark:bg-slate-950 transition-colors relative">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl dark:shadow-2xl relative overflow-hidden transition-colors">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

        <div className="flex flex-col items-center mb-6">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 mb-3">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Retail POS Login</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sign in with Cashier or Admin credentials</p>
        </div>

        {/* Demo Credentials Pill */}
        <div className="mb-6 p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-xs text-indigo-900 dark:text-indigo-300 space-y-1.5">
          <p className="font-bold text-indigo-700 dark:text-indigo-200">Demo Accounts:</p>
          <div className="flex justify-between items-center text-[11px]">
            <span>Admin: <code className="font-mono bg-white/70 dark:bg-slate-800 px-1 rounded text-indigo-700 dark:text-indigo-200">admin@pos.local</code></span>
            <span>Pass: <code className="font-mono bg-white/70 dark:bg-slate-800 px-1 rounded text-indigo-700 dark:text-indigo-200">Admin@1234</code></span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span>Cashier: <code className="font-mono bg-white/70 dark:bg-slate-800 px-1 rounded text-indigo-700 dark:text-indigo-200">cashier@pos.local</code></span>
            <span>Pass: <code className="font-mono bg-white/70 dark:bg-slate-800 px-1 rounded text-indigo-700 dark:text-indigo-200">Cashier@1234</code></span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Username or Email
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="admin@pos.local"
                value={values.credential}
                onChange={(e) => setFieldValue('credential', e.target.value)}
                onBlur={() => handleBlur('credential')}
                className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-colors ${
                  touched.credential && errors.credential
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
                }`}
              />
            </div>
            <FormFieldError error={touched.credential ? errors.credential : undefined} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={values.password}
                onChange={(e) => setFieldValue('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-colors ${
                  touched.password && errors.password
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
                }`}
              />
            </div>
            <FormFieldError error={touched.password ? errors.password : undefined} />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold text-xs transition-colors shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In to Terminal'}
          </button>
        </form>
      </div>
    </div>
  );
}
