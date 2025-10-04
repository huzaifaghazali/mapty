import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useGeolocation } from './hooks/useGeolocation.js';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { useMap } from './hooks/useMap.js';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { Map } from './components/map/Map.jsx';
import { ToastContainer } from './components/common/ToastContainer.jsx';
import { Modal } from './components/common/Modal.jsx';
import { ToastProvider, useToast } from './contexts/ToastContext.jsx';
import { ModalProvider, useModal } from './contexts/ModalContext.jsx';
import {
  createWorkout,
  updateWorkout,
  rehydrateWorkouts,
} from './services/mapService.js';
import { sortWorkouts } from './services/sortService.js';
import 'leaflet/dist/leaflet.css';

function AppContent() {
  const [workouts, setWorkouts] = useLocalStorage('workouts', []);
  const [sortedWorkouts, setSortedWorkouts] = useState([]);
  const [formVisible, setFormVisible] = useState(false);
  const [formType, setFormType] = useState('running');
  const [formValues, setFormValues] = useState({
    distance: '',
    duration: '',
    cadence: '',
    elevation: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingWorkoutId, setEditingWorkoutId] = useState(null);
  const [workoutsLoaded, setWorkoutsLoaded] = useState(false);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  const mapEventRef = useRef(null);
  const { position } = useGeolocation();
  const { showError, showSuccess, toasts, removeToast } = useToast();
  const { confirm, modal } = useModal();

  // Use a callback to handle map clicks
  const handleMapClick = useCallback((mapE) => {
    mapEventRef.current = mapE;
    setFormVisible(true);
    setIsEditing(false);
    setEditingWorkoutId(null);
    setFormValues({
      distance: '',
      duration: '',
      cadence: '',
      elevation: '',
    });
  }, []);

  const { mapRef, mapInstance, mapInitialized } = useMap(
    position,
    handleMapClick
  );

  // Sort workouts whenever the workouts array or sort settings change
  useEffect(() => {
    const sorted = sortWorkouts(workouts, sortField, sortDirection);
    setSortedWorkouts(sorted);
  }, [workouts, sortField, sortDirection]);

  // Rehydrate localStorage
  useEffect(() => {
    if (workouts.length === 0) {
      setWorkoutsLoaded(true);
      return;
    }

    try {
      const rehydrated = rehydrateWorkouts(workouts);
      setWorkouts(rehydrated);
      setWorkoutsLoaded(true);
    } catch (err) {
      console.error('Could not parse workouts from localStorage', err);
      showError('Failed to load workouts from storage');
      setWorkoutsLoaded(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Memoize the form handlers to prevent unnecessary re-renders
  const handleTypeChange = useCallback((e) => {
    setFormType(e.target.value);
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();

      try {
        if (isEditing) {
          // Update existing workout
          const workoutIndex = workouts.findIndex(
            (w) => w.id === editingWorkoutId
          );
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

          // Create a new array with the updated workout
          const updatedWorkouts = [...workouts];
          updatedWorkouts[workoutIndex] = updatedWorkout;

          setWorkouts(updatedWorkouts);
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
          setWorkouts((prev) => [...prev, workout]);
          showSuccess('Workout added successfully');
        }

        setFormValues({
          distance: '',
          duration: '',
          cadence: '',
          elevation: '',
        });
        setFormVisible(false);
        setIsEditing(false);
        setEditingWorkoutId(null);
      } catch (error) {
        showError(error.message);
      }
    },
    [
      isEditing,
      editingWorkoutId,
      formType,
      formValues,
      setWorkouts,
      workouts,
      showError,
      showSuccess,
    ]
  );

  // Handle form cancellation
  const handleCancel = useCallback(() => {
    setFormValues({ distance: '', duration: '', cadence: '', elevation: '' });
    setFormVisible(false);
    setIsEditing(false);
    setEditingWorkoutId(null);
  }, []);

  // Handle workout editing
  const handleEditWorkout = useCallback((workout) => {
    setFormVisible(true);
    setIsEditing(true);
    setEditingWorkoutId(workout.id);
    setFormType(workout.type);

    // Populate form with workout data
    setFormValues({
      distance: workout.distance.toString(),
      duration: workout.duration.toString(),
      cadence: workout.cadence ? workout.cadence.toString() : '',
      elevation: workout.elevationGain ? workout.elevationGain.toString() : '',
    });
  }, []);

  // Handle workout deletion
  const handleDeleteWorkout = useCallback(
    async (workoutId) => {
      const result = await confirm(
        'Delete Workout',
        'Are you sure you want to delete this workout? This action cannot be undone.',
        null,
        { type: 'danger', confirmText: 'Delete', cancelText: 'Cancel' }
      );

      if (result) {
        setWorkouts((prev) =>
          prev.filter((workout) => workout.id !== workoutId)
        );
        showSuccess('Workout deleted successfully');
      }
    },
    [confirm, showSuccess, setWorkouts]
  );

  // Handle all workouts deletion
  const handleDeleteAllWorkouts = useCallback(async () => {
    if (workouts.length === 0) return;

    const result = await confirm(
      'Delete All Workouts',
      `Are you sure you want to delete all ${workouts.length} workout(s)? This action cannot be undone.`,
      null,
      { type: 'danger', confirmText: 'Delete All', cancelText: 'Cancel' }
    );

    if (result) {
      setWorkouts([]);
      showSuccess('All workouts deleted successfully');
    }
  }, [workouts.length, confirm, showSuccess, setWorkouts]);

  // Handle sorting
  const handleSortChange = useCallback((field, direction) => {
    setSortField(field);
    setSortDirection(direction);
  }, []);

  useEffect(() => {
    function onClick(e) {
      const li = e.target.closest('.workout');
      if (!li) return;
      const id = li.dataset.id;
      const w = workouts.find((x) => x.id === id);
      if (!w || !mapInstance.current) return;
      mapInstance.current.setView(w.coords, 13, {
        animate: true,
        pan: { duration: 1 },
      });
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [workouts, mapInstance]);

  return (
    <>
      <AppLayout
        formVisible={formVisible}
        formType={formType}
        onTypeChange={handleTypeChange}
        formValues={formValues}
        setValues={setFormValues}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        workouts={sortedWorkouts}
        mapRef={mapRef}
        isEditing={isEditing}
        onEditWorkout={handleEditWorkout}
        onDeleteWorkout={handleDeleteWorkout}
        onDeleteAllWorkouts={handleDeleteAllWorkouts}
        onSortChange={handleSortChange}
      />
      <Map
        mapInstance={mapInstance}
        workouts={workouts}
        mapInitialized={mapInitialized && workoutsLoaded}
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onCancel={modal.onCancel}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        type={modal.type}
      />
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <ModalProvider>
        <AppContent />
      </ModalProvider>
    </ToastProvider>
  );
}
