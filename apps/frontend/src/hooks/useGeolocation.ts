import { useState, useEffect } from 'react';

interface Position {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface UseGeolocationReturn {
  position: Position | null;
  error: string | null;
  loading: boolean;
  method: 'gps' | 'google-api' | null;
}

/**
 * 기기의 GPS를 우선 사용하고, 실패하면 백엔드 API(Google Geolocation)를 사용하는 커스텀 훅
 * - 웹: navigator.geolocation (브라우저 API)
 * - React Native: @react-native-community/geolocation (TODO: 설치 필요)
 * 
 * 1순위: 네이티브 GPS (높은 정확도)
 * 2순위: 백엔드 Google Geolocation API (IP 기반, 낮은 정확도)
 */
export const useGeolocation = (): UseGeolocationReturn => {
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<'gps' | 'google-api' | null>(null);

  useEffect(() => {
    const fetchLocation = async () => {
      // 1순위: GPS API 시도 (웹: navigator.geolocation)
      if ('geolocation' in navigator) {
        try {
          const gpsPosition = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true, // GPS 사용
                timeout: 10000, // 10초 타임아웃
                maximumAge: 0, // 캐시 사용 안 함
              });
            }
          );

          setPosition({
            latitude: gpsPosition.coords.latitude,
            longitude: gpsPosition.coords.longitude,
            accuracy: gpsPosition.coords.accuracy,
          });
          setMethod('gps');
          setLoading(false);
          return;
        } catch (gpsError) {
          console.warn('GPS 위치 가져오기 실패, Google API로 폴백:', gpsError);
        }
      }

      // 2순위: 백엔드 Google Geolocation API 폴백
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

        const response = await fetch(`${apiUrl}/api/geolocation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `API 오류: ${response.status}`);
        }

        const data = await response.json();

        setPosition({
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
        });
        setMethod('google-api');
        setLoading(false);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : '위치 정보를 가져올 수 없습니다.';
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchLocation();
  }, []);

  return { position, error, loading, method };
};

/**
 * TODO: React Native로 전환 시
 * 
 * 1. 패키지 설치:
 *    npm install @react-native-community/geolocation
 * 
 * 2. 권한 설정:
 *    - iOS: Info.plist에 NSLocationWhenInUseUsageDescription 추가
 *    - Android: AndroidManifest.xml에 ACCESS_FINE_LOCATION 추가
 * 
 * 3. 코드 수정:
 *    import Geolocation from '@react-native-community/geolocation';
 *    
 *    Geolocation.getCurrentPosition(
 *      (position) => { ... },
 *      (error) => { ... },
 *      { enableHighAccuracy: true }
 *    );
 */
