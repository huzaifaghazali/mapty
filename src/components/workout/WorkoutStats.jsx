export function WorkoutStats({ workout }) {
  if (workout.type === 'running') {
    return (
      <>
        <div className='flex items-baseline'>
          <span className='text-[1.8rem] mr-[0.2rem]'>⚡️</span>
          <span className='text-[1.5rem] mr-[0.5rem]'>
            {workout.pace ? workout.pace.toFixed(1) : '-'}
          </span>
          <span className='text-[1.1rem] text-light1 uppercase font-extrabold'>
            min/km
          </span>
        </div>
        <div className='flex items-baseline'>
          <span className='text-[1.8rem] mx-[0.5rem]'>🦶🏼</span>
          <span className='text-[1.5rem] mr-[0.5rem]'>{workout.cadence}</span>
          <span className='text-[1.1rem] text-light1 uppercase font-extrabold'>
            spm
          </span>
        </div>
      </>
    );
  } else {
    return (
      <>
        <div className='flex items-baseline'>
          <span className='text-[1.8rem] mr-[0.2rem]'>⚡️</span>
          <span className='text-[1.5rem] mr-[0.5rem]'>
            {workout.speed ? workout.speed.toFixed(1) : '-'}
          </span>
          <span className='text-[1.1rem] text-light1 uppercase font-extrabold'>
            km/h
          </span>
        </div>
        <div className='flex items-baseline'>
          <span className='text-[1.8rem] mx-[0.5rem]'>⛰</span>
          <span className='text-[1.5rem] mr-[0.5rem]'>
            {workout.elevationGain}
          </span>
          <span className='text-[1.1rem] text-light1 uppercase font-extrabold'>
            m
          </span>
        </div>
      </>
    );
  }
}
