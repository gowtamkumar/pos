'use client';

import { Sale } from '@/types/pos';
import { CheckCircle2, Printer, ShoppingBag, X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ReceiptModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReceiptModal({ sale, isOpen, onClose }: ReceiptModalProps) {
  if (!isOpen || !sale || typeof document === 'undefined') return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(sale.createdAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  // Keep the receipt outside the POS layout so its containers cannot clip the printout.
  return createPortal(
    <div id="receipt-print-root" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Actions Header (Hidden in Print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Payment Successful</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Receipt Content (Printed view formatted for 80mm roll) */}
        <div id="thermal-receipt" className="p-6 overflow-y-auto font-mono text-xs text-slate-800 space-y-4">
          {/* Store Header */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 font-sans font-black text-lg text-slate-950 uppercase tracking-tight">
              <ShoppingBag className="w-5 h-5 text-indigo-600 inline" />
              <span>NT RETAIL POS</span>
            </div>
            <p className="text-[11px] text-slate-500">Fast Retail Checkout & AI System</p>
            <p className="text-[10px] text-slate-400">123 Commerce Avenue, Local Terminal</p>
            <p className="text-[10px] text-slate-400">Tax ID: TX-2026-88194</p>
          </div>

          <div className="border-t border-dashed border-slate-300 my-2" />

          {/* Receipt Meta */}
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice:</span>
              <span className="font-bold text-slate-900">{sale.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date:</span>
              <span>{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cashier:</span>
              <span>{sale.user?.name || 'Cashier Terminal'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span>{sale.customerName || 'Walk-in Customer'}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-300 my-2" />

          {/* Purchased Line Items */}
          <div>
            <div className="flex justify-between font-bold text-[11px] pb-1 border-b border-slate-200 mb-2">
              <span className="w-1/2">Item</span>
              <span className="w-1/6 text-center">Qty</span>
              <span className="w-1/6 text-right">Price</span>
              <span className="w-1/6 text-right">Total</span>
            </div>

            <div className="space-y-2">
              {sale.items.map((item) => (
                <div key={item.id} className="receipt-item flex justify-between text-[11px] leading-tight">
                  <div className="w-1/2 truncate pr-1">
                    <p className="font-medium text-slate-900 truncate">{item.productName}</p>
                    <p className="text-[9px] text-slate-400">{item.productSku}</p>
                  </div>
                  <span className="w-1/6 text-center">{item.quantity}</span>
                  <span className="w-1/6 text-right">${Number(item.unitPrice).toFixed(2)}</span>
                  <span className="w-1/6 text-right font-semibold">
                    ${Number(item.subtotal).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-dashed border-slate-300 my-2" />

          {/* Financial Breakdown */}
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal:</span>
              <span>${Number(sale.subtotal).toFixed(2)}</span>
            </div>
            {Number(sale.discount) > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount:</span>
                <span>-${Number(sale.discount).toFixed(2)}</span>
              </div>
            )}
            {Number(sale.tax) > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Tax ({Number(sale.taxRate)}%):</span>
                <span>${Number(sale.tax).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-sm text-slate-950 pt-2 border-t border-slate-300">
              <span>TOTAL PAYABLE:</span>
              <span>${Number(sale.total).toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-300 my-2" />

          {/* Cash Payment Details */}
          <div className="bg-slate-50 p-2.5 rounded-lg space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Method:</span>
              <span className="font-semibold text-slate-900">{sale.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cash Tendered:</span>
              <span className="font-semibold text-slate-900">
                ${Number(sale.amountTendered).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-emerald-800 text-xs pt-1 border-t border-slate-200">
              <span>CHANGE RETURNED:</span>
              <span>${Number(sale.changeDue).toFixed(2)}</span>
            </div>
          </div>

          {/* Footer Barcode Stamp */}
          <div className="text-center pt-2 space-y-1">
            <p className="text-[10px] text-slate-400">Thank you for shopping with us!</p>
            <p className="text-[9px] text-slate-400">Please retain receipt for exchange within 7 days.</p>
            <div className="font-mono text-center tracking-widest text-[10px] text-slate-600 pt-2 select-all">
              ||| | ||||| || |||||| | ||| || |||||
            </div>
          </div>
        </div>

        {/* Modal Action Buttons (Hidden in Print) */}
        <div className="no-print p-4 bg-muted border-t border-card-border flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-muted"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <span>Next Customer</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

