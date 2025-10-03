import { useState } from 'react';

export function SortControls({ onSortChange }) {
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  const toggleSortDirection = () => {
    const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newDirection);
    onSortChange(sortField, newDirection);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        className='h-4 w-4 inline-block ml-1 transition-transform duration-300'
        viewBox='0 0 20 20'
        fill='currentColor'
      >
        <path
          fillRule='evenodd'
          d='M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z'
          clipRule='evenodd'
        />
      </svg>
    ) : (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        className='h-4 w-4 inline-block ml-1 transition-transform duration-300'
        viewBox='0 0 20 20'
        fill='currentColor'
      >
        <path
          fillRule='evenodd'
          d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
          clipRule='evenodd'
        />
      </svg>
    );
  };

  return (
    <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-dark2 rounded-xl p-4 shadow-lg border border-dark3'>
      <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto'>
        <span className='text-[1.4rem] font-semibold text-light1 whitespace-nowrap'>
          Sort by:
        </span>
        <div className='flex flex-wrap gap-2 w-full sm:w-auto'>
          <button
            className={`px-4 py-2 text-[1.3rem] font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark2 ${
              sortField === 'date'
                ? 'bg-gradient-to-r from-brand2 to-brand3 text-white shadow-md transform scale-105'
                : 'bg-dark3 text-light2 hover:bg-dark4 hover:text-white hover:shadow-md'
            }`}
            onClick={() => {
              if (sortField === 'date') {
                toggleSortDirection();
              } else {
                setSortField('date');
                onSortChange('date', sortDirection);
              }
            }}
          >
            <span className='flex items-center'>
              Date {getSortIcon('date')}
            </span>
          </button>
          <button
            className={`px-4 py-2 text-[1.3rem] font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark2 ${
              sortField === 'distance'
                ? 'bg-gradient-to-r from-brand2 to-brand3 text-white shadow-md transform scale-105'
                : 'bg-dark3 text-light2 hover:bg-dark4 hover:text-white hover:shadow-md'
            }`}
            onClick={() => {
              if (sortField === 'distance') {
                toggleSortDirection();
              } else {
                setSortField('distance');
                onSortChange('distance', sortDirection);
              }
            }}
          >
            <span className='flex items-center'>
              Distance {getSortIcon('distance')}
            </span>
          </button>
          <button
            className={`px-4 py-2 text-[1.3rem] font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark2 ${
              sortField === 'duration'
                ? 'bg-gradient-to-r from-brand2 to-brand3 text-white shadow-md transform scale-105'
                : 'bg-dark3 text-light2 hover:bg-dark4 hover:text-white hover:shadow-md'
            }`}
            onClick={() => {
              if (sortField === 'duration') {
                toggleSortDirection();
              } else {
                setSortField('duration');
                onSortChange('duration', sortDirection);
              }
            }}
          >
            <span className='flex items-center'>
              Duration {getSortIcon('duration')}
            </span>
          </button>
          <button
            className={`px-4 py-2 text-[1.3rem] font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark2 ${
              sortField === 'type'
                ? 'bg-gradient-to-r from-brand2 to-brand3 text-white shadow-md transform scale-105'
                : 'bg-dark3 text-light2 hover:bg-dark4 hover:text-white hover:shadow-md'
            }`}
            onClick={() => {
              if (sortField === 'type') {
                toggleSortDirection();
              } else {
                setSortField('type');
                onSortChange('type', sortDirection);
              }
            }}
          >
            <span className='flex items-center'>
              Type {getSortIcon('type')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
