import { useCallback, useRef, useEffect } from 'react';
import { useForm } from '../contexts/FormContext';
import { useWorkouts } from '../contexts/WorkoutContext';

export function useMapInteraction(mapInstanceRef) {
  const mapEventRef = useRef(null);
  const { openForm } = useForm();
  const { workouts } = useWorkouts();

  const handleMapClick = useCallback(
    (mapE) => {
      mapEventRef.current = mapE;
      openForm();
    },
    [openForm]
  );

  useEffect(() => {
    function onClick(e) {
      const li = e.target.closest('.workout');
      if (!li) return;
      const id = li.dataset.id;
      const w = workouts.find((x) => x.id === id);
      if (!w || !mapInstanceRef.current || !mapInstanceRef.current.current) return;

      // Pan to the workout location
      mapInstanceRef.current.current.setView(w.coords, 13, {
        animate: true,
        pan: { duration: 1 },
      });
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [workouts, mapInstanceRef]);

  return {
    mapEventRef,
    handleMapClick,
  };
}