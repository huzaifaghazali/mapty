import { useEffect } from 'react';

export function Modal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'default',
}) {
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return (
          <div className='mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-900 bg-opacity-20 mb-4'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-8 w-8 text-red-400'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
              />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className='mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-900 bg-opacity-20 mb-4'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-8 w-8 text-yellow-400'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
              />
            </svg>
          </div>
        );
      case 'success':
        return (
          <div className='mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-900 bg-opacity-20 mb-4'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-8 w-8 text-green-400'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className='mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-900 bg-opacity-20 mb-4'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-8 w-8 text-blue-400'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
        );
    }
  };

  const getButtonStyles = () => {
    switch (type) {
      case 'danger':
        return {
          confirm:
            'bg-red-600 hover:bg-red-700 focus:ring-red-500 shadow-lg shadow-red-600/30',
          cancel:
            'bg-gray-700 hover:bg-gray-600 focus:ring-gray-500 text-gray-200',
        };
      case 'warning':
        return {
          confirm:
            'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 shadow-lg shadow-yellow-600/30',
          cancel:
            'bg-gray-700 hover:bg-gray-600 focus:ring-gray-500 text-gray-200',
        };
      case 'success':
        return {
          confirm:
            'bg-green-600 hover:bg-green-700 focus:ring-green-500 shadow-lg shadow-green-600/30',
          cancel:
            'bg-gray-700 hover:bg-gray-600 focus:ring-gray-500 text-gray-200',
        };
      default:
        return {
          confirm:
            'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-lg shadow-blue-600/30',
          cancel:
            'bg-gray-700 hover:bg-gray-600 focus:ring-gray-500 text-gray-200',
        };
    }
  };

  const buttonStyles = getButtonStyles();

  return (
    <div className='fixed inset-0 z-[9999] overflow-y-auto'>
      <div className='flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0'>
        <div className='fixed inset-0 transition-opacity' aria-hidden='true'>
          <div className='absolute inset-0 bg-gray-900 opacity-75'></div>
        </div>

        <span
          className='hidden sm:inline-block sm:align-middle sm:h-screen'
          aria-hidden='true'
        >
          &#8203;
        </span>

        <div className='inline-block align-bottom bg-gray-800 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-700'>
          <div className='bg-gray-800 px-6 pt-6 pb-4 sm:p-6 sm:pb-4'>
            <div className='sm:flex sm:items-start'>
              <div className='w-full'>
                {getIcon()}
                <div className='mt-3 text-center sm:mt-0 sm:text-left'>
                  <h3
                    className='text-xl leading-6 font-semibold text-white'
                    id='modal-title'
                  >
                    {title}
                  </h3>
                  <div className='mt-3'>
                    <p className='text-base text-gray-300'>{message}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className='bg-gray-750 px-6 py-4 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-700'>
            <button
              type='button'
              className={`w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-6 py-3 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 sm:ml-3 sm:w-auto sm:text-base transition-all duration-200 ${buttonStyles.confirm}`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
            <button
              type='button'
              className={`mt-3 w-full inline-flex justify-center rounded-lg border border-gray-600 shadow-sm px-6 py-3 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 sm:mt-0 sm:ml-3 sm:w-auto sm:text-base transition-all duration-200 ${buttonStyles.cancel}`}
              onClick={onCancel}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
