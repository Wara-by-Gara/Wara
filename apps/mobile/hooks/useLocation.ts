import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';

export type Coords = { lat: number; lng: number; accuracy: number };
export type LocationPermission = 'checking' | 'granted' | 'denied';

export function useLocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [permission, setPermission] = useState<LocationPermission>('checking');
  const subRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    async function start() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermission('denied');
        return;
      }
      setPermission('granted');
      subRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 5,
        },
        (loc) => {
          const accuracy = loc.coords.accuracy ?? Infinity;
          // 정확도가 50m 초과이면 노이즈로 간주하고 무시
          if (accuracy > 50) return;
          setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude, accuracy });
        },
      );
    }
    start();
    return () => {
      subRef.current?.remove();
    };
  }, []);

  return { coords, permission };
}
