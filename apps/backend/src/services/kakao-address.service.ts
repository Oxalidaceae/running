import { config } from 'dotenv';
import { resolve } from 'path';

// 로컬 개발 환경에서만 .env.local 파일 로드
// Vercel에서는 환경 변수가 자동으로 process.env에 주입됨
if (process.env.NODE_ENV !== 'production') {
  config({ path: resolve(process.cwd(), '.env.local') });
}

export interface AddressInfo {
  address_name: string;
  region_1depth_name: string; // 시/도
  region_2depth_name: string; // 구/군
  region_3depth_name: string; // 동/면
  road_address?: {
    address_name: string;
    region_1depth_name: string;
    region_2depth_name: string;
    region_3depth_name: string;
    road_name: string;
    building_name: string;
  };
}

export interface CoordinateWithAddress {
  lat: number;
  lon: number;
  address?: AddressInfo;
}

interface KakaoReverseGeocodingResponse {
  documents: Array<{
    address: {
      address_name: string;
      region_1depth_name: string;
      region_2depth_name: string;
      region_3depth_name: string;
    };
    road_address?: {
      address_name: string;
      region_1depth_name: string;
      region_2depth_name: string;
      region_3depth_name: string;
      road_name: string;
      building_name: string;
    };
  }>;
  meta: {
    total_count: number;
  };
}

/**
 * 카카오맵 REST API를 사용하여 좌표를 주소로 변환합니다.
 * @param latitude 위도
 * @param longitude 경도
 * @returns 주소 정보
 */
export async function getAddressFromCoordinate(
  latitude: number,
  longitude: number
): Promise<AddressInfo | null> {
  const apiKey = process.env.KAKAO_REST_API_KEY;

  console.log('🔍 API 키 디버깅:', {
    hasKey: !!apiKey,
    keyLength: apiKey?.length || 0,
    keyStart: apiKey?.substring(0, 8) || 'undefined',
  });

  if (!apiKey) {
    throw new Error('KAKAO_REST_API_KEY가 설정되지 않았습니다.');
  }

  const url = `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${longitude}&y=${latitude}`;

  console.log('🌐 요청 URL:', url);
  console.log('🔑 Authorization 헤더:', `KakaoAK ${apiKey.substring(0, 8)}...`);

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `KakaoAK ${apiKey}`,
      },
    });

    console.log('📡 응답 상태:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ 응답 내용:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json() as KakaoReverseGeocodingResponse;

    if (data.documents.length === 0) {
      console.warn(`주소를 찾을 수 없습니다: (${latitude}, ${longitude})`);
      return null;
    }

    const document = data.documents[0];
    
    return {
      address_name: document.address.address_name,
      region_1depth_name: document.address.region_1depth_name,
      region_2depth_name: document.address.region_2depth_name,
      region_3depth_name: document.address.region_3depth_name,
      road_address: document.road_address ? {
        address_name: document.road_address.address_name,
        region_1depth_name: document.road_address.region_1depth_name,
        region_2depth_name: document.road_address.region_2depth_name,
        region_3depth_name: document.road_address.region_3depth_name,
        road_name: document.road_address.road_name,
        building_name: document.road_address.building_name,
      } : undefined,
    };
  } catch (error) {
    console.error(`주소 조회 오류 (${latitude}, ${longitude}):`, error);
    throw new Error(`주소 정보를 가져올 수 없습니다: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * 여러 좌표의 주소를 배치로 조회합니다.
 * 카카오 API 호출 제한을 고려하여 딜레이를 포함합니다.
 * @param coordinates 좌표 배열
 * @param delayMs 각 API 호출 간 딜레이 (밀리초)
 * @returns 주소 정보가 포함된 좌표 배열
 */
export async function getAddressesFromCoordinates(
  coordinates: Array<{ lat: number; lon: number }>,
  delayMs: number = 100
): Promise<CoordinateWithAddress[]> {
  const results: CoordinateWithAddress[] = [];

  for (let i = 0; i < coordinates.length; i++) {
    const coord = coordinates[i];
    
    try {
      console.log(`📍 주소 조회 중... (${i + 1}/${coordinates.length}): (${coord.lat.toFixed(6)}, ${coord.lon.toFixed(6)})`);
      
      const address = await getAddressFromCoordinate(coord.lat, coord.lon);
      
      results.push({
        lat: coord.lat,
        lon: coord.lon,
        address: address || undefined,
      });

      // API 호출 제한을 고려한 딜레이
      if (i < coordinates.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`좌표 (${coord.lat}, ${coord.lon}) 주소 조회 실패:`, error);
      
      // 오류가 발생해도 좌표는 유지
      results.push({
        lat: coord.lat,
        lon: coord.lon,
        address: undefined,
      });
    }
  }

  return results;
}