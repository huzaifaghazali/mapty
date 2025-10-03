export function sortWorkouts(workouts, field, direction) {
  if (!workouts || workouts.length === 0) return workouts;

  const sortedWorkouts = [...workouts].sort((a, b) => {
    let valueA, valueB;

    switch (field) {
      case 'date':
        valueA = new Date(a.date);
        valueB = new Date(b.date);
        break;
      case 'distance':
        valueA = a.distance;
        valueB = b.distance;
        break;
      case 'duration':
        valueA = a.duration;
        valueB = b.duration;
        break;
      case 'type':
        valueA = a.type;
        valueB = b.type;
        break;
      default:
        return 0;
    }

    if (valueA < valueB) return direction === 'asc' ? -1 : 1;
    if (valueA > valueB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  return sortedWorkouts;
}
