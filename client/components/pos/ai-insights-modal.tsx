'use client';

import { api } from '@/lib/api';
import { showToast } from '@/lib/toast';
import { AiSalesInsightResponse } from '@/types/pos';
import {
    AlertTriangle,
    Boxes,
    CheckCircle2,
    Cpu,
    DollarSign,
    RefreshCw,
    ShoppingCart,
    Sparkles,
    TrendingUp,
    X
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface AiInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiInsightsModal({ isOpen, onClose }: AiInsightsModalProps) {
  const [data, setData] = useState<AiSalesInsightResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchInsights = async () => {
    try {
      setIsLoading(true);
      const res = await api.post('/ai/sales-insights');
      const payload: AiSalesInsightResponse = res.data?.data || res.data;
      setData(payload);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to generate AI insights';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !data) {
      fetchInsights();
    }
  }, [isOpen]);

  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  AI Sales Copilot & Restock Insights
                </h3>
                {data && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 flex items-center gap-1">
                    <Cpu className="w-3 h-3" />
                    <span>{data.engine}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automated predictive analysis powered by Google Gemini & Store Ledger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchInsights}
              disabled={isLoading}
              title="Re-analyze Store Data"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-4">
              <div className="p-4 rounded-3xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 animate-bounce">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Generating AI Retail Insights...
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Aggregating today's sales velocity, inventory thresholds, and cash ledger data
                </p>
              </div>
            </div>
          ) : !data ? (
            <div className="py-12 text-center text-slate-500">
              <p className="text-sm">No insights available.</p>
              <button
                onClick={fetchInsights}
                className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
              >
                Generate Insights
              </button>
            </div>
          ) : (
            <>
              {/* Executive Summary Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 border border-indigo-100 dark:border-indigo-500/30 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                    Executive Shift Summary
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {data.executiveSummary}
                </p>
              </div>

              {/* Key Shift KPI Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] mb-1 font-semibold">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Total Revenue</span>
                  </div>
                  <p className="text-base font-black text-slate-900 dark:text-white">
                    ${data.totalRevenue.toFixed(2)}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] mb-1 font-semibold">
                    <ShoppingCart className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Transactions</span>
                  </div>
                  <p className="text-base font-black text-slate-900 dark:text-white">
                    {data.totalTransactions}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] mb-1 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Avg Order Ticket</span>
                  </div>
                  <p className="text-base font-black text-slate-900 dark:text-white">
                    ${data.averageOrderValue.toFixed(2)}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] mb-1 font-semibold">
                    <Boxes className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Stock Health</span>
                  </div>
                  <p className="text-base font-black text-slate-900 dark:text-white">
                    {data.inventoryHealthScore}%
                  </p>
                </div>
              </div>

              {/* Urgent Restock Recommendations */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                      Urgent Restock Forecast ({data.urgentRestock.length})
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Target stock calculation based on low-stock thresholds
                  </span>
                </div>

                {data.urgentRestock.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>All inventory levels are safely above low-stock thresholds!</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {data.urgentRestock.map((item, idx) => {
                      const isCritical = item.urgency === 'CRITICAL';
                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                {item.productName}
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                  isCritical
                                    ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                                    : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                                }`}
                              >
                                {item.urgency}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              SKU: {item.sku}
                            </p>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                              {item.reasoning}
                            </p>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">
                              Current Stock: <strong className="text-slate-900 dark:text-white">{item.currentStock}</strong> (Min: {item.threshold})
                            </span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              +Order {item.recommendedOrderQty} units
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Top Velocity Movers */}
              {data.topPerformers.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                      Shift Sales Velocity Leaders
                    </h4>
                  </div>

                  <div className="space-y-2">
                    {data.topPerformers.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex-1 truncate">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {item.productName}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {item.quantitySold} units sold • ${item.revenue.toFixed(2)} generated ({item.contributionPercent}% of revenue)
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            ${item.revenue.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between gap-3">
         
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
          >
            Close Copilot
          </button>
        </div>
      </div>
    </div>
  );
}

