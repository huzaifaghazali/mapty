import { WorkoutItem } from './WorkoutItem.jsx';

export function WorkoutsList({ workouts }) {
  return (
    <ul
      className='list-none h-[77vh] overflow-y-scroll overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:w-0'
      aria-label='List of workouts'
    >
      {workouts.map((workout) => (
        <WorkoutItem key={workout.id} workout={workout} />
      ))}
    </ul>
  );
}
