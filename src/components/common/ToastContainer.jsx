import { Toast } from './Toast.jsx';

export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className='fixed bottom-4 right-4 z-[10000] space-y-2'>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}
