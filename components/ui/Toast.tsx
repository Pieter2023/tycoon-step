import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: ToastType;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const toastConfig: Record<ToastType, { icon: typeof CheckCircle; tile: string }> = {
  success: { icon: CheckCircle, tile: 'bg-[#30d158]' },
  error: { icon: XCircle, tile: 'bg-[#ff453a]' },
  warning: { icon: AlertTriangle, tile: 'bg-[#ff9f0a]' },
  info: { icon: Info, tile: 'bg-[#0a84ff]' },
};

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const config = toastConfig[toast.type];
  const Icon = config.icon;

  useEffect(() => {
    const duration = toast.duration || 4000;
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  // Slides in from the right edge it lives on and leaves the same way; neighbours glide into
  // the gap (layout) instead of jumping.
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 48, scale: 0.94, filter: 'blur(6px)' }}
      animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
      exit={{ opacity: 0, x: 48, scale: 0.96, filter: 'blur(4px)', transition: { type: 'spring', bounce: 0, duration: 0.3 } }}
      transition={{ type: 'spring', bounce: 0.18, duration: 0.5 }}
      className="mat-popover w-[min(380px,calc(100vw-2rem))] rounded-[20px] p-3 pr-2.5"
      role="status"
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25)] ${config.tile}`}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={2.4} />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <h4 className="text-[14px] font-semibold leading-5 tracking-[-0.01em] text-white">{toast.title}</h4>
          <p className="mt-0.5 text-[13px] leading-[1.125rem] text-slate-400">{toast.message}</p>

          {toast.actionLabel && toast.onAction && (
            <button
              onClick={() => {
                toast.onAction?.();
                onDismiss(toast.id);
              }}
              className="pressable mt-2 rounded-full bg-[rgb(118_118_128/0.24)] px-3 py-1 text-[12px] font-semibold text-white hover:bg-[rgb(118_118_128/0.36)]"
            >
              {toast.actionLabel}
            </button>
          )}
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          aria-label="Dismiss"
          className="pressable flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-white/[0.08] hover:text-white"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.6} />
        </button>
      </div>
    </motion.div>
  );
};

// Toast Container Component
interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-24 right-4 z-[100] flex flex-col items-end gap-2.5 md:right-6">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev.slice(-2), { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showSuccess = useCallback((title: string, message: string, options?: Partial<ToastMessage>) => {
    return addToast({ title, message, type: 'success', ...options });
  }, [addToast]);

  const showError = useCallback((title: string, message: string, options?: Partial<ToastMessage>) => {
    return addToast({ title, message, type: 'error', ...options });
  }, [addToast]);

  const showWarning = useCallback((title: string, message: string, options?: Partial<ToastMessage>) => {
    return addToast({ title, message, type: 'warning', ...options });
  }, [addToast]);

  const showInfo = useCallback((title: string, message: string, options?: Partial<ToastMessage>) => {
    return addToast({ title, message, type: 'info', ...options });
  }, [addToast]);

  return {
    toasts,
    removeToast,
    addToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

export default Toast;
