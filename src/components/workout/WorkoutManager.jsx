import { useCallback } from 'react';
import { useWorkouts } from '../../contexts/WorkoutContext';
import { useForm } from '../../contexts/FormContext';
import { useWorkoutActions } from '../../hooks/useWorkoutActions.js';
import { useMapInteraction } from '../../hooks/useMapInteraction.js';

export function WorkoutManager({ children, mapInstanceRef }) {
  const { workouts, deleteWorkout, deleteAllWorkouts } = useWorkouts();
  const { openEditForm } = useForm();
  const { mapEventRef, handleMapClick } = useMapInteraction(mapInstanceRef);
  const { handleSubmit, handleDeleteWorkout, handleDeleteAllWorkouts } =
    useWorkoutActions(mapEventRef);

  const handleEditWorkout = useCallback(
    (workout) => {
      openEditForm(workout);
    },
    [openEditForm]
  );

  const handleDeleteWorkoutWithConfirmation = useCallback(
    async (workoutId) => {
      const confirmed = await handleDeleteWorkout(workoutId);
      if (confirmed) {
        deleteWorkout(workoutId);
      }
    },
    [handleDeleteWorkout, deleteWorkout]
  );

  const handleDeleteAllWorkoutsWithConfirmation = useCallback(async () => {
    const confirmed = await handleDeleteAllWorkouts();
    if (confirmed) {
      deleteAllWorkouts();
    }
  }, [handleDeleteAllWorkouts, deleteAllWorkouts]);

  return children({
    workouts,
    handleMapClick,
    handleSubmit,
    handleEditWorkout,
    handleDeleteWorkout: handleDeleteWorkoutWithConfirmation,
    handleDeleteAllWorkouts: handleDeleteAllWorkoutsWithConfirmation,
  });
}
