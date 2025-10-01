import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useGeolocation } from './hooks/useGeolocation.js';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { useMap } from './hooks/useMap.js';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { Map } from './components/map/Map.jsx';
import { createWorkout, rehydrateWorkouts } from './services/mapService.js';
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

  const mapEventRef = useRef(null);
  const { position } = useGeolocation();
  const {
    mapRef,
    mapInstance,
    mapInitialized,
    mapEventRef: mapEventFromHook,
  } = useMap(position);

  // Listen for map click events
  useEffect(() => {
    const handleMapClick = (e) => {
      mapEventRef.current = e.detail;
      setFormVisible(true);
    };

    window.addEventListener('mapClick', handleMapClick);
    return () => window.removeEventListener('mapClick', handleMapClick);
  }, []);

  // Rehydrate localStorage
  useEffect(() => {
    if (workouts.length === 0) return;
    try {
      const rehydrated = rehydrateWorkouts(workouts);
      setWorkouts(rehydrated);
    } catch (err) {
      console.error('Could not parse workouts from localStorage', err);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Memoize the form handlers to prevent unnecessary re-renders
  const handleTypeChange = useCallback((e) => {
    setFormType(e.target.value);
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();

      if (!mapEventRef.current) return;
      const { lat, lng } = mapEventRef.current.latlng;
      const coords = [lat, lng];

      try {
        const workout = createWorkout(formType, coords, formValues);

        setWorkouts((prev) => [...prev, workout]);

        setFormValues({
          distance: '',
          duration: '',
          cadence: '',
          elevation: '',
        });
        setFormVisible(false);
      } catch (error) {
        alert(error.message);
      }
    },
    [formType, formValues, setWorkouts]
  );

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
        workouts={workouts}
        mapRef={mapRef}
      />
      <Map mapInstance={mapInstance} workouts={workouts} />
    </>
  );
}
