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


if (!mapInstance || !mapInitialized) {
  return (
    <div className="flex-1 h-full bg-gray-200 flex items-center justify-center">
      <div className="text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <p className="text-gray-500">Loading map...</p>
      </div>
    </div>
  );
}

  return null; // This component doesn't render anything, it just manages markers
}
