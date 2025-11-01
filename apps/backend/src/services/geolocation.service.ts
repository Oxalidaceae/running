import { config } from 'dotenv';
import { resolve } from 'path';

// 로컬 개발 환경에서만 .env.local 파일 로드 (Vercel에서는 환경변수 자동 제공)
if (process.env.NODE_ENV !== 'production') {
  config({ path: resolve(process.cwd(), '.env.local') });
}

export interface Position {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface GeolocationResponse {
  location: {
    lat: number;
    lng: number;
  };
  accuracy: number;
}

/**
 * Google Geolocation API를 사용하여 현재 위치를 가져옵니다.
 */
export async function getCurrentLocation(): Promise<Position> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY가 설정되지 않았습니다.');
  }

  const response = await fetch(
    `https://www.googleapis.com/geolocation/v1/geolocate?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        considerIp: true,
      }),
    }
  );

  if (!response.ok) {
    const errorData = (await response.json()) as { error?: { message?: string } };
    throw new Error(
      `Google Geolocation API 오류: ${errorData.error?.message || response.statusText}`
    );
  }

  const data = (await response.json()) as GeolocationResponse;

  return {
    latitude: data.location.lat,
    longitude: data.location.lng,
    accuracy: data.accuracy,
  };
}
