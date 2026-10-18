'use client';

import React, { useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { showToast } from '@/lib/toast';
import { CartItem, CheckoutPayload, Sale } from '@/types/pos';
import {
  Banknote,
  DollarSign,
  User,
  Phone,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface CashPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  subtotal: number;
  discount: number;
  taxRate: number;
  total: number;
  onCheckoutComplete: (sale: Sale) => void;
}

export function CashPaymentModal({
  isOpen,
  onClose,
  cart,
  subtotal,
  discount,
  taxRate,
  total,
  onCheckoutComplete,
}: CashPaymentModalProps) {
  const [tenderedInput, setTenderedInput] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Parse cash tendered
  const tenderedAmount = useMemo(() => {
    const val = parseFloat(tenderedInput);
    return isNaN(val) ? 0 : val;
  }, [tenderedInput]);

  // Compute change or shortage
  const changeDue = useMemo(() => {
    return Number((tenderedAmount - total).toFixed(2));
  }, [tenderedAmount, total]);

  const isValidTender = tenderedAmount >= total && total > 0;

  // Smart tender shortcut options
  const quickTenders = useMemo(() => {
    const list: number[] = [total]; // Exact

    const nextTen = Math.ceil(total / 10) * 10;
    if (nextTen > total && !list.includes(nextTen)) list.push(nextTen);

    const commonDenominations = [20, 50, 100, 200, 500];
    for (const den of commonDenominations) {
      if (den > total && !list.includes(den)) {
        list.push(den);
      }
    }
    return list.slice(0, 5);
  }, [total]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidTender) {
      showToast('Cash tendered is less than total payable amount', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CheckoutPayload = {
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        amountTendered: tenderedAmount,
        discount,
        taxRate,
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      const response = await api.post('/sales/checkout', payload);
      const sale: Sale = response.data?.data || response.data;

      showToast(`Sale completed! Change due: $${changeDue.toFixed(2)}`, 'success');
      onCheckoutComplete(sale);
    } catch (err: any) {
      const msg =
        err.response?.data?.message || 'Checkout failed. Please check product stock or inputs.';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Cash Register Checkout</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Validate tender & calculate change</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {/* Total Payable Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-900/80 border border-slate-200 dark:border-slate-700/60 text-center relative overflow-hidden">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Net Total Payable
            </span>
            <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              ${total.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} items in transaction
            </p>
          </div>

          {/* Quick Cash Tender Shortcuts */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Quick Cash Tender Shortcuts
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {quickTenders.map((amount, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTenderedInput(amount.toFixed(2))}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    tenderedAmount === amount
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                      : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700/80'
                  }`}
                >
                  {amount === total ? 'Exact' : `$${amount}`}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Tendered Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Cash Amount Tendered ($)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={tenderedInput}
                onChange={(e) => setTenderedInput(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white text-lg font-bold placeholder-slate-400 dark:placeholder-slate-600 transition-all outline-none"
              />
            </div>
          </div>

          {/* Live Change Due / Shortage Banner */}
          {tenderedInput.length > 0 && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                isValidTender
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {isValidTender ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                )}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider block">
                    {isValidTender ? 'Change Due to Customer' : 'Payment Shortage'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {isValidTender
                      ? 'Hand back this cash amount'
                      : 'More cash required before checkout'}
                  </span>
                </div>
              </div>

              <div
                className={`text-2xl font-black ${
                  isValidTender ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                ${Math.abs(changeDue).toFixed(2)}
              </div>
            </div>
          )}

          {/* Optional Customer Information */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
            <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Customer Details (Optional)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Sale Notes (e.g. Counter 1 Morning Shift)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Checkout Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!isValidTender || isSubmitting}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
                isValidTender && !isSubmitting
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700/50'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing Transaction...</span>
                </>
              ) : (
                <>
                  <Banknote className="w-5 h-5" />
                  <span>
                    Complete Sale & Print Receipt ({tenderedAmount > 0 ? `$${tenderedAmount.toFixed(2)}` : '$0.00'})
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

