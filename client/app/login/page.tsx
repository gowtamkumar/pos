'use client';

import { FormFieldError } from '@/components/form-field-error';
import { useZodForm } from '@/hooks/use-zod-form';
import { useAuth } from '@/lib/auth-context';
import { LoginInput, loginSchema } from '@/lib/schemas';
import { showToast } from '@/lib/toast';
import { Lock, ShoppingBag, User } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-background to-background">
      <div className="max-w-md w-full p-8 rounded-2xl border border-card-border bg-card shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />

        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 text-primary font-bold text-2xl mb-2">
            <ShoppingBag className="w-8 h-8 text-indigo-500" />
            <span>Retail POS</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-100">Point of Sale Login</h2>
          <p className="text-sm text-slate-400 mt-1">Sign in with your Cashier or Admin credentials</p>
        </div>

        {/* Demo Credentials Pill */}
        <div className="mb-6 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 space-y-1">
          <p className="font-semibold text-indigo-200">Demo Accounts:</p>
          <div className="flex justify-between items-center">
            <span>Admin: <code className="text-indigo-100">admin@pos.local</code></span>
            <span>Pass: <code className="text-indigo-100">Admin@1234</code></span>
          </div>
          <div className="flex justify-between items-center">
            <span>Cashier: <code className="text-indigo-100">cashier@pos.local</code></span>
            <span>Pass: <code className="text-indigo-100">Cashier@1234</code></span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Username or Email
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="admin@pos.local"
                value={values.credential}
                onChange={(e) => setFieldValue('credential', e.target.value)}
                onBlur={() => handleBlur('credential')}
                className={`w-full bg-slate-950 border rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${
                  touched.credential && errors.credential
                    ? 'border-red-500/50 focus:border-red-500'
                    : 'border-card-border focus:border-primary'
                }`}
              />
            </div>
            <FormFieldError error={touched.credential ? errors.credential : undefined} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={values.password}
                onChange={(e) => setFieldValue('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                className={`w-full bg-slate-950 border rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${
                  touched.password && errors.password
                    ? 'border-red-500/50 focus:border-red-500'
                    : 'border-card-border focus:border-primary'
                }`}
              />
            </div>
            <FormFieldError error={touched.password ? errors.password : undefined} />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In to Terminal'}
          </button>
        </form>
      </div>
    </div>
  );
}
