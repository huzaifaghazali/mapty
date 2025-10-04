import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now().toString();
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const showError = useCallback(
    (message) => {
      return addToast(message, 'error');
    },
    [addToast]
  );

  const showSuccess = useCallback(
    (message) => {
      return addToast(message, 'success');
    },
    [addToast]
  );

  const showWarning = useCallback(
    (message) => {
      return addToast(message, 'warning');
    },
    [addToast]
  );

  const value = {
    toasts,
    addToast,
    removeToast,
    showError,
    showSuccess,
    showWarning,
  };

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}
