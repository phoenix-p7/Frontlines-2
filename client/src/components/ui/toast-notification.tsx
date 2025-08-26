import { useState, useEffect, FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface ToastNotification {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  shouldShake?: boolean;
}

interface ToastNotificationProps {
  toast: ToastNotification;
  onClose: (id: string) => void;
}

const ToastNotificationComponent: FC<ToastNotificationProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, toast.duration || 2000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const shakeAnimation = toast.shouldShake ? {
    x: [0, -4, 4, -4, 4, -2, 2, -1, 1, 0],
    transition: { duration: 0.4, ease: "easeInOut" }
  } : {};

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getColors = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        ...shakeAnimation 
      }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ 
        duration: 0.3, 
        ease: "easeOut"
      }}
      className={`relative flex items-start p-3 mb-2 rounded-lg border shadow-lg ${getColors()}`}
    >
      <div className="flex items-start space-x-3 flex-1">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          {toast.title && (
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
              {toast.title}
            </div>
          )}
          <div className="text-sm text-slate-700 dark:text-slate-300">
            {toast.message}
          </div>
        </div>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="ml-2 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
      >
        <X className="w-3 h-3 text-slate-600 dark:text-slate-400" />
      </button>
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: ToastNotification[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastNotificationComponent
            key={toast.id}
            toast={toast}
            onClose={onClose}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Hook for managing toast notifications
export const useToastNotifications = () => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [activeErrorMessage, setActiveErrorMessage] = useState<string>('');
  const [errorShakeCount, setErrorShakeCount] = useState(0);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info', duration?: number, title?: string) => {
    if (type === 'error') {
      // Check if there's already an active error toast with the same message
      const existingErrorToast = toasts.find(toast => toast.type === 'error' && toast.message === message);
      
      if (existingErrorToast) {
        // Same error message - shake the existing toast
        setErrorShakeCount(prev => prev + 1);
        
        // Update the existing toast to shake
        setToasts(prev => prev.map(toast => 
          toast.id === existingErrorToast.id 
            ? { ...toast, shouldShake: true }
            : toast
        ));
        
        // Reset shake flag after animation
        setTimeout(() => {
          setToasts(prev => prev.map(toast => 
            toast.id === existingErrorToast.id 
              ? { ...toast, shouldShake: false }
              : toast
          ));
        }, 500);
        
        return;
      } else {
        // New error message or no existing error - create new toast
        setActiveErrorMessage(message);
        setErrorShakeCount(0);
        
        // Remove any existing error toasts
        setToasts(prev => prev.filter(toast => toast.type !== 'error'));
      }
    }
    
    const id = Date.now().toString();
    const newToast: ToastNotification = {
      id,
      title,
      message,
      type,
      duration,
      shouldShake: false
    };
    
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    const toastToRemove = toasts.find(toast => toast.id === id);
    if (toastToRemove && toastToRemove.type === 'error') {
      // Clear active error message when error toast is removed
      setActiveErrorMessage('');
      setErrorShakeCount(0);
    }
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (message: string, duration?: number, title?: string) => addToast(message, 'success', duration, title);
  const showError = (message: string, duration?: number, title?: string) => addToast(message, 'error', duration, title);
  const showInfo = (message: string, duration?: number, title?: string) => addToast(message, 'info', duration, title);

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showInfo,
    activeErrorMessage,
    errorShakeCount
  };
};