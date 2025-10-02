import { useEffect, useRef } from 'react';
import L from 'leaflet';

export function Map({ mapInstance, workouts, mapInitialized }) {
  const markersRef = useRef([]);
  const prevWorkoutsRef = useRef([]);

  useEffect(() => {
    if (!mapInstance.current || !mapInitialized) return;

    // Clear existing markers
    markersRef.current.forEach((m) => {
      try {
        mapInstance.current.removeLayer(m);
      } catch (e) {}
    });
    markersRef.current = [];

    // Add markers for each workout
    workouts.forEach((w) => {
      const marker = L.marker(w.coords)
        .addTo(mapInstance.current)
        .bindPopup(
          L.popup({
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${w.type}-popup`,
          })
        )
        .setPopupContent(
          `${w.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${w.description}`
        );
      // Don't open popup automatically for new markers
      // .openPopup();

      markersRef.current.push(marker);
    });

    // Store the current workouts for comparison in the next render
    prevWorkoutsRef.current = workouts;
  }, [mapInstance, workouts, mapInitialized]);

  return null; // This component doesn't render anything, it just manages markers
}
