import { getCurrentLocation } from './services/geolocation.service';
import { circle12Points, divideLinePoints, type LatLon } from './geo';
import * as fs from 'fs';

/**
 * 현재 위치를 기준으로 러닝 코스를 생성합니다.
 */
async function generateRunningCourses() {
  try {
    console.log('📍 현재 위치를 가져오는 중...\n');

    // 1. 현재 위치 가져오기
    const position = await getCurrentLocation();

    console.log('✅ 위치 정보 조회 성공!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📌 위도: ${position.latitude}`);
    console.log(`📌 경도: ${position.longitude}`);
    console.log(`📏 정확도: ${position.accuracy}m`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 2. geo.ts를 사용하여 러닝 코스 생성
    const start: LatLon = {
      lat: position.latitude,
      lon: position.longitude,
    };
    const radius = 5000; // 5km (왕복 10km 코스)

    console.log('🏃 러닝 코스 생성 중...\n');

    // 반경 12개 방향 끝점 계산
    const endpoints = circle12Points(start.lat, start.lon, radius);

    console.log('=== 반경 12개 점 (30° 간격) ===');
    endpoints.forEach((p, i) =>
      console.log(`${i + 1}번 (${i * 30}°): lat=${p.lat.toFixed(6)}, lon=${p.lon.toFixed(6)}`)
    );

    console.log('\n=== 각 점과의 3등분점 ===');
    const courses = endpoints.map((end, i) => {
      const midpoints = divideLinePoints(start, end);
      console.log(`${i + 1}번 (${i * 30}°):`);
      midpoints.forEach((mp, idx) =>
        console.log(`  ${(idx + 1) * 25}%: lat=${mp.lat.toFixed(6)}, lon=${mp.lon.toFixed(6)}`)
      );
      return {
        id: i + 1,
        angle: i * 30,
        start,
        end,
        midpoints,
      };
    });

    // 3. 결과 저장
    const result = {
      base: start,
      radius,
      courses,
    };

    fs.writeFileSync('output.json', JSON.stringify(result, null, 2), 'utf-8');
    console.log('\n✅ 결과가 output.json 파일로 저장되었습니다!');
    console.log(`🗺️  Google Maps: https://www.google.com/maps?q=${position.latitude},${position.longitude}\n`);
  } catch (error) {
    console.error('❌ 오류:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// 실행
generateRunningCourses();
