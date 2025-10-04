import { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useModal() {
  return useContext(ModalContext);
}

export function ModalProvider({ children }) {
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'default',
  });

  const openModal = useCallback((options) => {
    setModal({
      isOpen: true,
      title: options.title || '',
      message: options.message || '',
      onConfirm: options.onConfirm || null,
      onCancel: options.onCancel || null,
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      type: options.type || 'default',
    });
  }, []);

  const closeModal = useCallback(() => {
    setModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  const confirm = useCallback((title, message, onConfirm, options = {}) => {
    return new Promise((resolve) => {
      openModal({
        title,
        message,
        onConfirm: () => {
          if (onConfirm) onConfirm();
          closeModal();
          resolve(true);
        },
        onCancel: () => {
          closeModal();
          resolve(false);
        },
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        type: options.type || 'default',
      });
    });
  }, [openModal, closeModal]);

  const value = {
    modal,
    openModal,
    closeModal,
    confirm,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
}