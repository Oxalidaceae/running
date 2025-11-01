import express, { Request, Response } from 'express';
import { getCurrentLocation } from '../src/services/geolocation.service.js';
import { circle12Points, divideLinePoints, type LatLon } from '../src/geo.js';
import { getElevations } from '../src/services/elevation.service.js';
import { getAddressesFromCoordinates } from '../src/services/kakao-address.service.js';
import { recommendCourse } from '../src/llm.js';
import * as fs from 'fs';
import * as path from 'path';

const router = express.Router();

interface CourseGenerationRequest {
  latitude: number;
  longitude: number;
  distance: number; // km
}

/**
 * POST /api/courses/generate
 * 사용자 위치와 거리를 받아서 동적으로 코스를 생성하고 추천 결과를 반환
 */
router.post('/generate', async (req: Request<{}, {}, CourseGenerationRequest>, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { latitude, longitude, distance } = req.body;

    if (!latitude || !longitude || !distance) {
      return res.status(400).json({
        success: false,
        message: '위도, 경도, 거리 정보가 필요합니다.',
      });
    }

    console.log(`🏃 코스 생성 시작: 위치(${latitude}, ${longitude}), 거리: ${distance}km`);

    // 전체 프로세스에 대한 타임아웃 설정 (8초)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('코스 생성 요청이 시간을 초과했습니다. 잠시 후 다시 시도해주세요.'));
      }, 8000);
    });

    const processPromise = (async () => {

    // 1. 러닝 코스 생성
    const start: LatLon = { lat: latitude, lon: longitude };
    const radiusM = (distance / 2) * 1000; // 왕복이므로 반으로 나누고 미터로 변환

    // 반경 12개 방향 끝점 계산
    const endpoints = circle12Points(start.lat, start.lon, radiusM);

    // 각 점과의 3등분점 계산
    const courses = endpoints.map((end, i) => {
      const midpoints = divideLinePoints(start, end);
      return {
        id: i + 1,
        angle: i * 30,
        start,
        end,
        midpoints: midpoints.map(mp => ({ ...mp, elevation: 0 })), // elevation 필드 추가
      };
    });

    console.log(`✅ ${courses.length}개 코스 생성 완료`);

    // 2. 고도 정보 추가
    console.log('🏔️ 고도 정보 조회 중...');
    const allMidpoints: Array<{ lat: number; lon: number; courseId: number; pointIndex: number }> = [];
    
    courses.forEach(course => {
      course.midpoints.forEach((midpoint, index) => {
        allMidpoints.push({
          lat: midpoint.lat,
          lon: midpoint.lon,
          courseId: course.id,
          pointIndex: index,
        });
      });
    });

    const locations = allMidpoints.map(point => ({ lat: point.lat, lon: point.lon }));
    const elevations = await getElevations(locations);

    // 고도 정보를 코스에 적용
    elevations.forEach((elevation, index) => {
      const midpointInfo = allMidpoints[index];
      const course = courses.find(c => c.id === midpointInfo.courseId);
      
      if (course) {
        course.midpoints[midpointInfo.pointIndex].elevation = Math.round(elevation.elevation * 100) / 100;
      }
    });

    console.log('✅ 고도 정보 추가 완료');

    // 3. 주소 정보 추가
    console.log('🏠 주소 정보 조회 중...');
    const coordinateSet = new Set<string>();
    const coordinates: Array<{ lat: number; lon: number }> = [];
    
    // base 좌표 추가
    const baseKey = `${start.lat},${start.lon}`;
    if (!coordinateSet.has(baseKey)) {
      coordinateSet.add(baseKey);
      coordinates.push({ lat: start.lat, lon: start.lon });
    }

    // 각 코스의 end 좌표 추가
    courses.forEach(course => {
      const endKey = `${course.end.lat},${course.end.lon}`;
      if (!coordinateSet.has(endKey)) {
        coordinateSet.add(endKey);
        coordinates.push({ lat: course.end.lat, lon: course.end.lon });
      }
    });

    const coordinatesWithAddress = await getAddressesFromCoordinates(coordinates, 100);

    // 주소 정보를 맵으로 변환
    const addressMap = new Map<string, string>();
    coordinatesWithAddress.forEach(coord => {
      if (coord.address) {
        const key = `${coord.lat},${coord.lon}`;
        addressMap.set(key, coord.address.address_name);
      }
    });

    console.log('✅ 주소 정보 추가 완료');

    // 4. 최종 데이터 구성
    const completeData = {
      base: start,
      radiusKm: distance / 2,
      radiusM: radiusM,
      courses: courses.map(course => {
        const startKey = `${course.start.lat},${course.start.lon}`;
        const endKey = `${course.end.lat},${course.end.lon}`;
        
        return {
          id: course.id,
          angle: course.angle,
          start: {
            lat: course.start.lat,
            lon: course.start.lon,
            address_name: addressMap.get(startKey),
          },
          end: {
            lat: course.end.lat,
            lon: course.end.lon,
            address_name: addressMap.get(endKey),
          },
          midpoints: course.midpoints,
        };
      }),
    };

    // 5. AI 추천 생성
    console.log('🤖 AI 코스 추천 중...');
    const recommendations = await recommendCourse(completeData.courses);

    console.log('✅ AI 추천 완료');

    // 6. 파일 저장 (로컬 환경에서만 - Vercel은 읽기 전용 파일 시스템)
    if (process.env.NODE_ENV !== 'production') {
      try {
        const outputDir = path.resolve(process.cwd());
        fs.writeFileSync(
          path.join(outputDir, 'output-complete.json'), 
          JSON.stringify(completeData, null, 2), 
          'utf-8'
        );
        fs.writeFileSync(
          path.join(outputDir, 'course-recommendations.json'), 
          JSON.stringify(recommendations, null, 2), 
          'utf-8'
        );
        console.log('📁 디버깅 파일 저장 완료');
      } catch (error) {
        console.warn('⚠️ 파일 저장 실패 (무시됨):', error);
      }
    }

    // 7. 프론트엔드용 데이터 형식으로 변환
    const coursesForFrontend = recommendations.recommendations.map((rec: any) => {
      const courseData = completeData.courses.find(course => course.id === rec.courseId);
      
      return {
        courseId: rec.courseId,
        rank: rec.rank,
        name: `코스 ${rec.rank}`,
        distance: `${distance}km`,
        estimatedTime: `${Math.round(distance * 5 + rec.rank)}분`,
        summary: rec.summary,
        reason: rec.reason,
        elevationAnalysis: rec.elevationAnalysis,
        scores: rec.scores,
        // end 지점을 경유지로 사용 (1개)
        waypoints: courseData ? [{
          latitude: courseData.end.lat,
          longitude: courseData.end.lon
        }] : []
      };
    });

    console.log('🎉 코스 생성 및 추천 완료!');

      res.json({
        success: true,
        courses: coursesForFrontend,
        basePosition: {
          latitude,
          longitude
        },
        metadata: {
          totalCourses: completeData.courses.length,
          radiusKm: distance / 2,
          generatedAt: new Date().toISOString()
        }
      });
    })();

    // Promise.race로 타임아웃 또는 정상 처리 중 먼저 완료되는 것 실행
    await Promise.race([processPromise, timeoutPromise]);

  } catch (error) {
    const elapsedTime = Date.now() - startTime;
    console.error(`코스 생성 오류 (${elapsedTime}ms):`, error);
    
    let errorMessage = '서버 오류가 발생했습니다.';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('시간을 초과')) {
        errorMessage = '코스 생성 요청이 시간을 초과했습니다. 잠시 후 다시 시도해주세요.';
        statusCode = 408; // Request Timeout
      } else if (error.message.includes('LLM 호출')) {
        errorMessage = 'AI 분석 서비스가 일시적으로 지연되고 있습니다. 잠시 후 다시 시도해주세요.';
        statusCode = 503; // Service Unavailable
      } else {
        errorMessage = error.message;
      }
    }
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      elapsedTime: elapsedTime,
    });
  }
});

export default router;
