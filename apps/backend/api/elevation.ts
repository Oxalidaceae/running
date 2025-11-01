import express, { Request, Response } from 'express';
import { getElevations } from '../src/services/elevation.service';

const router = express.Router();

interface ElevationRequestBody {
  locations: Array<{
    lat: number;
    lon: number;
  }>;
}

/**
 * POST /api/elevation
 * 여러 좌표의 고도 정보를 조회합니다.
 */
router.post('/elevation', async (req: Request<{}, {}, ElevationRequestBody>, res: Response) => {
  try {
    const { locations } = req.body;

    if (!locations || !Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({
        error: 'locations 배열이 필요합니다.',
      });
    }

    // 최대 512개 위치까지만 허용 (Google API 제한)
    if (locations.length > 512) {
      return res.status(400).json({
        error: '한 번에 최대 512개의 위치까지만 조회할 수 있습니다.',
      });
    }

    // 좌표 유효성 검사
    for (const location of locations) {
      if (typeof location.lat !== 'number' || typeof location.lon !== 'number') {
        return res.status(400).json({
          error: '모든 위치는 lat, lon 숫자 값을 포함해야 합니다.',
        });
      }

      if (location.lat < -90 || location.lat > 90) {
        return res.status(400).json({
          error: '위도는 -90도에서 90도 사이여야 합니다.',
        });
      }

      if (location.lon < -180 || location.lon > 180) {
        return res.status(400).json({
          error: '경도는 -180도에서 180도 사이여야 합니다.',
        });
      }
    }

    console.log(`🏔️  ${locations.length}개 위치의 고도 정보를 조회합니다.`);

    const elevations = await getElevations(
      locations.map(loc => ({ lat: loc.lat, lon: loc.lon }))
    );

    res.json({
      success: true,
      count: elevations.length,
      elevations: elevations,
    });
  } catch (error) {
    console.error('Elevation API 오류:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : '고도 정보를 가져올 수 없습니다.',
    });
  }
});

/**
 * GET /api/elevation/single
 * 단일 좌표의 고도 정보를 조회합니다.
 */
router.get('/elevation/single', async (req: Request, res: Response) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        error: 'lat, lon 쿼리 파라미터가 필요합니다.',
      });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lon as string);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        error: 'lat, lon은 유효한 숫자여야 합니다.',
      });
    }

    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        error: '위도는 -90도에서 90도 사이여야 합니다.',
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        error: '경도는 -180도에서 180도 사이여야 합니다.',
      });
    }

    console.log(`🏔️  위치 (${latitude}, ${longitude})의 고도 정보를 조회합니다.`);

    const elevations = await getElevations([{ lat: latitude, lon: longitude }]);

    res.json({
      success: true,
      elevation: elevations[0],
    });
  } catch (error) {
    console.error('Elevation API 오류:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : '고도 정보를 가져올 수 없습니다.',
    });
  }
});

export default router;