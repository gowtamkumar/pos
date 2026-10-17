'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ShoppingBag, ArrowRight, ShieldCheck, Zap, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white">Retail POS Terminal</h1>
            <p className="text-xs text-slate-400">Cash Payment & AI Insights Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-300">
                Logged in as <strong className="text-white">{user.name}</strong> ({user.roles?.join(', ') || 'Staff'})
              </span>
              <button
                onClick={() => logout()}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors flex items-center gap-2"
            >
              Sign In <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 flex flex-col justify-center">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-4">
            <Zap className="w-3.5 h-3.5" /> High-Performance Point of Sale
          </div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl mb-4">
            Fast, Reliable Cash Checkout & AI Analytics
          </h2>
          <p className="text-slate-400 text-base leading-relaxed">
            Built for retail speed with PostgreSQL, TypeORM, instant barcode scanner integration, change due calculations, and AI-powered restock insights.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            {user ? (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-300">
                Ready for Terminal checkout. Proceeding to build POS terminal module...
              </div>
            ) : (
              <Link
                href="/login"
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2"
              >
                Open POS Login <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">Cash-Only Tender Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Quick tender buttons, real-time change due calculator, and atomic inventory stock reduction.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">AI Sales & Restock Copilot</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Google Gemini-driven insights predicting stockouts and summarizing top-velocity retail items.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">Role-Based Terminal Access</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Protected operations for Store Admins and Terminal Cashiers with TypeORM & PostgreSQL.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
