import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useGeolocation } from './hooks/useGeolocation.js';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { useMap } from './hooks/useMap.js';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { Map } from './components/map/Map.jsx';
import {
  createWorkout,
  updateWorkout,
  rehydrateWorkouts,
} from './services/mapService.js';
import 'leaflet/dist/leaflet.css';

export default function App() {
  const [workouts, setWorkouts] = useLocalStorage('workouts', []);
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

  const mapEventRef = useRef(null);
  const { position } = useGeolocation();

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
            throw new Error('Workout not found');
          }

          const workout = workouts[workoutIndex];
          if (!workout) {
            throw new Error('Workout not found');
          }

          const updatedWorkout = updateWorkout(workout, formValues);

          // Create a new array with the updated workout
          const updatedWorkouts = [...workouts];
          updatedWorkouts[workoutIndex] = updatedWorkout;

          setWorkouts(updatedWorkouts);
        } else {
          // Create new workout
          if (!mapEventRef.current) return;
          const { lat, lng } = mapEventRef.current.latlng;
          const coords = [lat, lng];

          const workout = createWorkout(formType, coords, formValues);
          setWorkouts((prev) => [...prev, workout]);
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
        alert(error.message);
      }
    },
    [isEditing, editingWorkoutId, formType, formValues, setWorkouts, workouts]
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
        setFormValues={setFormValues}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        workouts={workouts}
        mapRef={mapRef}
        isEditing={isEditing}
        onEditWorkout={handleEditWorkout}
      />
      <Map
        mapInstance={mapInstance}
        workouts={workouts}
        mapInitialized={mapInitialized && workoutsLoaded}
      />
    </>
  );
}
