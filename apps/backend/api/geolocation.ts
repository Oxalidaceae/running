import express, { Request, Response } from 'express';
import { getAddressFromCoordinate } from '../src/services/kakao-address.service.js';

const router = express.Router();

interface GeolocationResponse {
  location: {
    lat: number;
    lng: number;
  };
  accuracy: number;
}

interface GeolocationRequestBody {
  wifiAccessPoints?: Array<{
    macAddress: string;
    signalStrength: number;
  }>;
  cellTowers?: Array<{
    cellId: number;
    locationAreaCode: number;
    mobileCountryCode: number;
    mobileNetworkCode: number;
  }>;
}

/**
 * POST /api/geolocation
 * Google Geolocation API를 사용하여 위치 정보 조회
 */
router.post('/geolocation', async (req: Request<{}, {}, GeolocationRequestBody>, res: Response) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: 'Google Maps API 키가 설정되지 않았습니다.',
      });
    }

    // 클라이언트로부터 추가 정보를 받을 수 있음 (선택사항)
    const { wifiAccessPoints, cellTowers } = req.body;

    const requestBody: any = {
      considerIp: true,
    };

    // WiFi 액세스 포인트 정보가 있으면 추가
    if (wifiAccessPoints && wifiAccessPoints.length > 0) {
      requestBody.wifiAccessPoints = wifiAccessPoints;
    }

    // 셀 타워 정보가 있으면 추가
    if (cellTowers && cellTowers.length > 0) {
      requestBody.cellTowers = cellTowers;
    }

    const response = await fetch(
      `https://www.googleapis.com/geolocation/v1/geolocate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json() as { error?: { message?: string } };
      return res.status(response.status).json({
        error: errorData.error?.message || 'Google API 오류',
      });
    }

    const data = await response.json() as GeolocationResponse;

    res.json({
      latitude: data.location.lat,
      longitude: data.location.lng,
      accuracy: data.accuracy,
    });
  } catch (error) {
    console.error('Geolocation API 오류:', error);
    res.status(500).json({
      error: '위치 정보를 가져올 수 없습니다.',
    });
  }
});

/**
 * GET /api/reverse-geocode
 * 카카오맵 API를 사용하여 좌표를 주소로 변환
 */
router.get('/reverse-geocode', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: '위도(lat)와 경도(lng) 파라미터가 필요합니다.',
      });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        error: '유효한 위도와 경도 값을 입력해주세요.',
      });
    }

    const address = await getAddressFromCoordinate(latitude, longitude);

    if (address) {
      res.json({
        success: true,
        address: address,
        coordinates: {
          latitude,
          longitude,
        },
      });
    } else {
      res.json({
        success: false,
        error: '주소를 찾을 수 없습니다.',
        coordinates: {
          latitude,
          longitude,
        },
      });
    }
  } catch (error) {
    console.error('Reverse geocoding 오류:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '주소 변환 중 오류가 발생했습니다.',
    });
  }
});

export default router;
