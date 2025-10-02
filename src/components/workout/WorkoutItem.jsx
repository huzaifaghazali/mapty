import { WorkoutStats } from './WorkoutStats.jsx';

export function WorkoutItem({ workout, onEdit }) {
  return (
    <li
      key={workout.id}
      data-id={workout.id}
      className={`workout bg-dark2 rounded-[5px] px-[2.25rem] py-[1.5rem] mb-[1.75rem] cursor-pointer grid grid-cols-4 gap-x-[1.5rem] gap-y-[0.75rem] transition-all duration-200 hover:bg-opacity-80 ${
        workout.type === 'running'
          ? 'border-l-[5px] border-l-brand2'
          : 'border-l-[5px] border-l-brand1'
      }`}
      tabIndex={0}
      role='button'
    >
      <h2 className='text-[1.7rem] font-semibold col-span-4 flex justify-between items-center'>
        <span>{workout.description}</span>
        <button
          title='Edit'
          onClick={(e) => {
            e.stopPropagation();
            onEdit(workout);
          }}
          className='px-[1rem] py-[0.3rem] bg-teal-600 text-white text-[1.2rem] font-medium rounded-[5px] transition-all duration-200 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500'
        >
          ✏️
        </button>
      </h2>
      <div className='flex items-baseline'>
        <span className='text-[1.8rem] mr-[0.2rem]'>
          {workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}
        </span>
        <span className='text-[1.5rem] mr-[0.5rem]'>{workout.distance}</span>
        <span className='text-[1.1rem] text-light1 uppercase font-extrabold'>
          km
        </span>
      </div>
      <div className='flex items-baseline'>
        <span className='text-[1.8rem] mr-[0.2rem]'>⏱</span>
        <span className='text-[1.5rem] mr-[0.5rem]'>{workout.duration}</span>
        <span className='text-[1.1rem] text-light1 uppercase font-extrabold'>
          min
        </span>
      </div>
      <WorkoutStats workout={workout} />
    </li>
  );
}
