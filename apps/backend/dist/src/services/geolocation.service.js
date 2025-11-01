import { config } from 'dotenv';
import { resolve } from 'path';
// 백엔드 루트의 .env.local 파일 로드
config({ path: resolve(process.cwd(), '.env.local') });
/**
 * Google Geolocation API를 사용하여 현재 위치를 가져옵니다.
 */
export async function getCurrentLocation() {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        throw new Error('GOOGLE_MAPS_API_KEY가 설정되지 않았습니다.');
    }
    const response = await fetch(`https://www.googleapis.com/geolocation/v1/geolocate?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            considerIp: true,
        }),
    });
    if (!response.ok) {
        const errorData = (await response.json());
        throw new Error(`Google Geolocation API 오류: ${errorData.error?.message || response.statusText}`);
    }
    const data = (await response.json());
    return {
        latitude: data.location.lat,
        longitude: data.location.lng,
        accuracy: data.accuracy,
    };
}
