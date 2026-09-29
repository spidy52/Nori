import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  danger?: boolean;
  onConfirm: () => void;
}

export interface PromptOptions {
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  cancelLabel?: string;
  onConfirm: (val: string) => void;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, durationMs?: number) => void;
  showConfirm: (options: ConfirmOptions) => void;
  showPrompt: (options: PromptOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<ConfirmOptions | null>(null);
  const [promptModal, setPromptModal] = useState<PromptOptions | null>(null);
  const [promptInputValue, setPromptInputValue] = useState('');

  const showToast = (message: string, type: ToastType = 'info', durationMs = 3500) => {
    const id = String(Date.now() + Math.random());
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, durationMs);
  };

  const showConfirm = (options: ConfirmOptions) => {
    setConfirmModal(options);
  };

  const showPrompt = (options: PromptOptions) => {
    setPromptInputValue(options.defaultValue || '');
    setPromptModal(options);
  };

  return (
    <ToastContext.Provider value={{ showToast, showConfirm, showPrompt }}>
      {children}

      {/* Floating Toast Notification Stack */}
      <div className="fixed top-5 right-5 z-[300] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{ padding: '14px 18px' }}
            className={`pointer-events-auto rounded-lg shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-top-3 fade-in duration-200 border ${
              t.type === 'success'
                ? 'bg-[#0f1722] border-emerald-500/40 text-emerald-300'
                : t.type === 'error'
                ? 'bg-[#1a0f14] border-rose-500/40 text-rose-300'
                : t.type === 'warning'
                ? 'bg-[#1b150c] border-amber-500/40 text-amber-300'
                : 'bg-[#101422] border-white/[0.14] text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {t.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : t.type === 'error' || t.type === 'warning' ? (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              ) : (
                <Info className="w-5 h-5 text-cyan-400 shrink-0" />
              )}
              <span className="text-xs font-medium leading-relaxed">{t.message}</span>
            </div>

            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Modern In-App Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div
            style={{ padding: '28px' }}
            className="w-full max-w-md rounded-xl bg-[#0f131f] border border-white/[0.16] shadow-2xl space-y-5 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="font-bold text-base text-white">{confirmModal.title}</h3>
              <button
                onClick={() => setConfirmModal(null)}
                className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{confirmModal.message}</p>

            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                style={{ padding: '10px 20px' }}
                className="rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 text-xs font-semibold cursor-pointer transition-all"
              >
                {confirmModal.cancelLabel || confirmModal.cancelText || 'Cancel'}
              </button>
              <button
                onClick={() => {
                  const cb = confirmModal.onConfirm;
                  setConfirmModal(null);
                  cb();
                }}
                style={{ padding: '10px 22px' }}
                className={`rounded-md text-xs font-bold transition-all cursor-pointer shadow-lg ${
                  confirmModal.danger || confirmModal.isDestructive
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25'
                    : 'bg-gradient-to-r from-orange-500 to-rose-500 hover:brightness-110 text-white shadow-orange-500/25'
                }`}
              >
                {confirmModal.confirmLabel || confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern In-App Prompt Modal */}
      {promptModal && (
        <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div
            style={{ padding: '28px' }}
            className="w-full max-w-md rounded-xl bg-[#0f131f] border border-white/[0.16] shadow-2xl space-y-5 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="font-bold text-base text-white">{promptModal.title}</h3>
              <button
                onClick={() => setPromptModal(null)}
                className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{promptModal.message}</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!promptInputValue.trim()) return;
                const cb = promptModal.onConfirm;
                const val = promptInputValue.trim();
                setPromptModal(null);
                cb(val);
              }}
              className="space-y-4"
            >
              <input
                type="text"
                value={promptInputValue}
                onChange={(e) => setPromptInputValue(e.target.value)}
                placeholder={promptModal.placeholder || 'Enter value...'}
                autoFocus
                style={{ padding: '12px 16px' }}
                className="w-full rounded-md bg-[#161a29] border border-white/[0.12] text-sm text-white placeholder-slate-500 outline-none focus:border-orange-500/60 shadow-inner transition-all"
              />

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPromptModal(null)}
                  style={{ padding: '10px 20px' }}
                  className="rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 text-xs font-semibold cursor-pointer transition-all"
                >
                  {promptModal.cancelLabel || promptModal.cancelText || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!promptInputValue.trim()}
                  style={{ padding: '10px 22px' }}
                  className="rounded-md bg-gradient-to-r from-orange-500 to-rose-500 hover:brightness-110 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-40 shadow-lg shadow-orange-500/25"
                >
                  {promptModal.confirmLabel || promptModal.confirmText || 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
};
