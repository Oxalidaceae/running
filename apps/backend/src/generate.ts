import { circle12Points, divideLinePoints, type LatLon } from './geo';
import * as fs from 'fs';

/**
 * 수동으로 입력한 위치를 기준으로 러닝 코스를 생성합니다.
 * @param latitude 위도
 * @param longitude 경도
 * @param radiusKm 반경 (km)
 */
function generateRunningCourses(latitude: number, longitude: number, radiusKm: number = 5) {
  const start: LatLon = {
    lat: latitude,
    lon: longitude,
  };
  const radiusM = radiusKm * 1000;

  console.log('🏃 러닝 코스 생성 중...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📌 기준 위치: lat=${start.lat}, lon=${start.lon}`);
  console.log(`📏 반경: ${radiusKm}km (왕복 ${radiusKm * 2}km)\n`);

  // 반경 12개 방향 끝점 계산
  const endpoints = circle12Points(start.lat, start.lon, radiusM);

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

  // 결과 저장
  const result = {
    base: start,
    radiusKm,
    radiusM,
    courses,
  };

  fs.writeFileSync('output.json', JSON.stringify(result, null, 2), 'utf-8');
  console.log('\n✅ 결과가 output.json 파일로 저장되었습니다!');
  console.log(`🗺️  Google Maps: https://www.google.com/maps?q=${latitude},${longitude}\n`);
}

// 명령줄 인자로 위도/경도 받기
const args = process.argv.slice(2);

if (args.length >= 2) {
  const lat = parseFloat(args[0]);
  const lon = parseFloat(args[1]);
  const radius = args[2] ? parseFloat(args[2]) : 5;

  if (isNaN(lat) || isNaN(lon) || isNaN(radius)) {
    console.error('❌ 올바른 숫자를 입력하세요.');
    console.log('사용법: npm run generate-courses -- <위도> <경도> [반경km]');
    console.log('예시: npm run generate-courses -- 37.5665 126.9780 5');
    process.exit(1);
  }

  generateRunningCourses(lat, lon, radius);
} else {
  console.log('📍 위치를 입력하세요:');
  console.log('');
  console.log('사용법:');
  console.log('  npm run generate-courses -- <위도> <경도> [반경km]');
  console.log('');
  console.log('예시:');
  console.log('  npm run generate-courses -- 37.5665 126.9780 5');
  console.log('');
  console.log('💡 팁: Google Maps에서 우클릭 → 첫 번째 숫자가 위도, 두 번째가 경도입니다.');
  process.exit(1);
}
