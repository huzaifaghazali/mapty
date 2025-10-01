import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Fix marker icon paths for bundlers (Vite/webpack)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

export function useMap(position) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const mapEventRef = useRef(null);

  // Memoize the map click handler to prevent re-renders
  const handleMapClick = useCallback((mapE) => {
    mapEventRef.current = mapE;
    // Dispatch a custom event to notify the parent component
    window.dispatchEvent(new CustomEvent('mapClick', { detail: mapE }));
  }, []);

  useEffect(() => {
    if (!position || !mapRef.current) return;

    const { latitude, longitude } = position;
    const coords = [latitude, longitude];

    if (mapInstance.current) {
      mapInstance.current.setView(coords, 13);
      return;
    }

    mapInstance.current = L.map(mapRef.current).setView(coords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapInstance.current);

    const doInvalidate = () => {
      if (mapInstance.current) mapInstance.current.invalidateSize();
    };
    doInvalidate();
    setTimeout(doInvalidate, 100);
    setTimeout(doInvalidate, 500);

    mapInstance.current.on('click', handleMapClick);

    setMapInitialized(true);

    return () => {
      if (mapInstance.current) {
        try {
          mapInstance.current.remove();
        } catch (e) {}
        mapInstance.current = null;
      }
    };
  }, [position, handleMapClick]);

  return { mapRef, mapInstance, mapInitialized, mapEventRef };
}
