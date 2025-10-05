import { useCallback } from 'react';
import { useWorkouts } from '../contexts/WorkoutContext';
import { useForm } from '../contexts/FormContext';
import { useToast } from '../contexts/ToastContext';
import { useModal } from '../contexts/ModalContext';
import { createWorkout, updateWorkout } from '../services/mapService.js';

export function useWorkoutActions(mapEventRef) {
  const { workouts, addWorkout, updateWorkout: updateWorkoutInList } = useWorkouts();
  const { formType, formValues, isEditing, editingWorkoutId, closeForm } = useForm();
  const { showError, showSuccess } = useToast();
  const { confirm } = useModal();

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();

      try {
        if (isEditing) {
          // Find the workout to update
          const workoutIndex = workouts.findIndex(w => w.id === editingWorkoutId);
          if (workoutIndex === -1) {
            showError('Workout not found');
            return;
          }

          const workout = workouts[workoutIndex];
          if (!workout) {
            showError('Workout not found');
            return;
          }

          const updatedWorkout = updateWorkout(workout, formValues);
          updateWorkoutInList(editingWorkoutId, updatedWorkout);
          showSuccess('Workout updated successfully');
        } else {
          // Create new workout
          if (!mapEventRef.current) {
            showError('Please click on the map to select a location');
            return;
          }
          const { lat, lng } = mapEventRef.current.latlng;
          const coords = [lat, lng];

          const workout = createWorkout(formType, coords, formValues);
          addWorkout(workout);
          showSuccess('Workout added successfully');
        }

        closeForm();
      } catch (error) {
        showError(error.message);
      }
    },
    [
      workouts,
      isEditing,
      editingWorkoutId,
      formType,
      formValues,
      addWorkout,
      updateWorkoutInList,
      closeForm,
      showError,
      showSuccess,
      mapEventRef,
    ]
  );

  const handleDeleteWorkout = useCallback(
    async (workoutId) => {
      const result = await confirm(
        'Delete Workout',
        'Are you sure you want to delete this workout? This action cannot be undone.',
        null,
        { type: 'danger', confirmText: 'Delete', cancelText: 'Cancel' }
      );

      if (result) {
        // Delete logic will be handled by the WorkoutContext
        showSuccess('Workout deleted successfully');
        return true;
      }
      return false;
    },
    [confirm, showSuccess]
  );

  const handleDeleteAllWorkouts = useCallback(async () => {
    const result = await confirm(
      'Delete All Workouts',
      'Are you sure you want to delete all workouts? This action cannot be undone.',
      null,
      { type: 'danger', confirmText: 'Delete All', cancelText: 'Cancel' }
    );

    if (result) {
      // Delete logic will be handled by the WorkoutContext
      showSuccess('All workouts deleted successfully');
      return true;
    }
    return false;
  }, [confirm, showSuccess]);

  return {
    handleSubmit,
    handleDeleteWorkout,
    handleDeleteAllWorkouts,
  };
}