import { config } from 'dotenv';
import { resolve } from 'path';

// 백엔드 루트의 .env.local 파일 로드
config({ path: resolve(process.cwd(), '.env.local') });
// 백엔드 루트의 .env.local 파일 로드
// config({ path: resolve(__dirname, '../../.env.local') });

export interface ElevationPoint {
  latitude: number;
  longitude: number;
  elevation: number;
}

interface GoogleElevationResponse {
  results: Array<{
    elevation: number;
    location: {
      lat: number;
      lng: number;
    };
    resolution: number;
  }>;
  status: string;
}

/**
 * Google Maps Elevation API를 사용하여 여러 좌표의 고도를 한 번에 가져옵니다.
 * @param locations 위도, 경도 좌표 배열
 * @returns 고도 정보가 포함된 좌표 배열
 */
export async function getElevations(
  locations: Array<{ lat: number; lon: number }>
): Promise<ElevationPoint[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY가 설정되지 않았습니다.');
  }

  // 좌표들을 파라미터 형태로 변환 (lat,lng|lat,lng|...)
  const locationsParam = locations
    .map(loc => `${loc.lat},${loc.lon}`)
    .join('|');

  const url = `https://maps.googleapis.com/maps/api/elevation/json?locations=${locationsParam}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as GoogleElevationResponse;

    if (data.status !== 'OK') {
      throw new Error(`Google Elevation API error: ${data.status}`);
    }

    return data.results.map(result => ({
      latitude: result.location.lat,
      longitude: result.location.lng,
      elevation: result.elevation,
    }));
  } catch (error) {
    console.error('Elevation API 오류:', error);
    throw new Error(`고도 정보를 가져올 수 없습니다: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * 단일 좌표의 고도를 가져옵니다.
 * @param latitude 위도
 * @param longitude 경도
 * @returns 고도 정보가 포함된 좌표
 */
export async function getElevation(
  latitude: number,
  longitude: number
): Promise<ElevationPoint> {
  const elevations = await getElevations([{ lat: latitude, lon: longitude }]);
  return elevations[0];
}