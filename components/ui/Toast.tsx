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

const toastConfig: Record<ToastType, { icon: typeof CheckCircle; color: string; bgColor: string }> = {
  success: {
    icon: CheckCircle,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
  },
  error: {
    icon: XCircle,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/20',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
  },
  info: {
    icon: Info,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
  },
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

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="min-w-[320px] max-w-[400px] glass-card p-4 shadow-2xl border-l-4"
      style={{
        borderLeftColor: toast.type === 'success' ? '#10b981' : 
                        toast.type === 'error' ? '#f43f5e' :
                        toast.type === 'warning' ? '#f59e0b' : '#06b6d4'
      }}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${config.bgColor} flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white text-sm">{toast.title}</h4>
          <p className="text-slate-400 text-xs mt-0.5">{toast.message}</p>
          
          {toast.actionLabel && toast.onAction && (
            <button
              onClick={() => {
                toast.onAction?.();
                onDismiss(toast.id);
              }}
              className="mt-2 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              {toast.actionLabel}
            </button>
          )}
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="text-slate-500 hover:text-slate-300 transition-colors p-1 hover:bg-white/10 rounded"
        >
          <X className="w-4 h-4" />
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
    <div className="fixed top-24 right-6 z-[100] flex flex-col gap-3">
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
