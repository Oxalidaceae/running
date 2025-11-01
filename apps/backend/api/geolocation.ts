import express, { Request, Response } from 'express';

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

export default router;
