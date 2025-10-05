import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { sortWorkouts } from '../services/sortService.js';
import { rehydrateWorkouts } from '../services/mapService.js';
import L from 'leaflet';

const WorkoutContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useWorkouts() {
  return useContext(WorkoutContext);
}

export function WorkoutProvider({ children }) {
  const [workouts, setWorkouts] = useState([]);
  const [sortedWorkouts, setSortedWorkouts] = useState([]);
  const [workoutsLoaded, setWorkoutsLoaded] = useState(false);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  // Load workouts from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('workouts');
      if (stored) {
        const data = JSON.parse(stored);
        if (data && data.length > 0) {
          const rehydrated = rehydrateWorkouts(data);
          setWorkouts(rehydrated);
        }
      }
      setWorkoutsLoaded(true);
    } catch (err) {
      console.error('Could not parse workouts from localStorage', err);
      setWorkoutsLoaded(true);
    }
  }, []);

  // Save workouts to localStorage whenever they change
  useEffect(() => {
    if (workoutsLoaded) {
      localStorage.setItem('workouts', JSON.stringify(workouts));
    }
  }, [workouts, workoutsLoaded]);

  // Sort workouts whenever the workouts array or sort settings change
  useEffect(() => {
    const sorted = sortWorkouts(workouts, sortField, sortDirection);
    setSortedWorkouts(sorted);
  }, [workouts, sortField, sortDirection]);

  const addWorkout = useCallback((workout) => {
    setWorkouts((prev) => [...prev, workout]);
  }, []);

  const updateWorkout = useCallback((workoutId, updatedWorkout) => {
    setWorkouts((prev) => {
      const workoutIndex = prev.findIndex((w) => w.id === workoutId);
      if (workoutIndex === -1) return prev;
      
      const newWorkouts = [...prev];
      newWorkouts[workoutIndex] = updatedWorkout;
      return newWorkouts;
    });
  }, []);

  const deleteWorkout = useCallback((workoutId) => {
    setWorkouts((prev) => prev.filter((workout) => workout.id !== workoutId));
  }, []);

  const deleteAllWorkouts = useCallback(() => {
    setWorkouts([]);
  }, []);

  const handleSortChange = useCallback((field, direction) => {
    setSortField(field);
    setSortDirection(direction);
  }, []);

const fitAllWorkouts = useCallback((mapInstance) => {
  if (!mapInstance || workouts.length === 0) return;

  const group = L.featureGroup();
  workouts.forEach(workout => {
    group.addLayer(L.marker(workout.coords));
  });
  mapInstance.fitBounds(group.getBounds(), {
    padding: [50, 50],
    maxZoom: 13,
  });
}, [workouts]);

  const value = {
    workouts,
    sortedWorkouts,
    workoutsLoaded,
    sortField,
    sortDirection,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    deleteAllWorkouts,
    handleSortChange,
    fitAllWorkouts
  };

  return (
    <WorkoutContext.Provider value={value}>
      {children}
    </WorkoutContext.Provider>
  );
}