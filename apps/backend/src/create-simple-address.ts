import { getAddressesFromCoordinates } from './services/kakao-address.service';
import * as fs from 'fs';
import * as path from 'path';

interface SimpleCoordinateWithAddress {
  lat: number;
  lon: number;
  address_name?: string;
}

interface SimpleCourse {
  id: number;
  angle: number;
  start: SimpleCoordinateWithAddress;
  end: SimpleCoordinateWithAddress;
  midpoints: Array<{
    lat: number;
    lon: number;
    elevation?: number;
  }>;
}

interface SimpleOutputData {
  base: {
    lat: number;
    lon: number;
  };
  radiusKm: number;
  radiusM: number;
  courses: SimpleCourse[];
}

/**
 * output.json에서 직접 카카오 API를 호출하여 간단한 주소 정보만 추가합니다.
 * (output-with-address.json에 의존하지 않음)
 */
async function createSimpleAddressFile() {
  try {
    console.log('📍 output.json 파일을 읽는 중...');
    
    const outputPath = path.resolve(process.cwd(), 'output.json');
    
    if (!fs.existsSync(outputPath)) {
      throw new Error('output.json 파일을 찾을 수 없습니다. 먼저 러닝 코스를 생성해주세요.');
    }

    const rawData = fs.readFileSync(outputPath, 'utf-8');
    const data = JSON.parse(rawData);

    console.log(`✅ ${data.courses.length}개의 코스를 발견했습니다.`);
    console.log('🌐 카카오 API를 호출하여 간단한 주소 정보를 가져옵니다...\n');

    // 모든 start, end 좌표를 수집 (중복 제거)
    const coordinateSet = new Set<string>();
    const coordinates: Array<{ lat: number; lon: number; type: 'start' | 'end'; courseId: number }> = [];
    
    // base 좌표 추가
    const baseKey = `${data.base.lat},${data.base.lon}`;
    if (!coordinateSet.has(baseKey)) {
      coordinateSet.add(baseKey);
      coordinates.push({
        lat: data.base.lat,
        lon: data.base.lon,
        type: 'start',
        courseId: 0, // base는 모든 코스의 시작점
      });
    }

    // 각 코스의 end 좌표 추가
    data.courses.forEach((course: any) => {
      const endKey = `${course.end.lat},${course.end.lon}`;
      if (!coordinateSet.has(endKey)) {
        coordinateSet.add(endKey);
        coordinates.push({
          lat: course.end.lat,
          lon: course.end.lon,
          type: 'end',
          courseId: course.id,
        });
      }
    });

    console.log(`🏠 총 ${coordinates.length}개의 고유한 좌표의 주소를 조회합니다.`);

    // 카카오맵 API 호출
    const coordinatesWithAddress = await getAddressesFromCoordinates(
      coordinates.map(coord => ({ lat: coord.lat, lon: coord.lon })),
      100 // 0.1초 딜레이
    );

    console.log('\n✅ 주소 정보 조회 완료!\n');

    // 주소 정보를 맵으로 변환 (빠른 검색을 위해)
    const addressMap = new Map<string, string>();
    coordinatesWithAddress.forEach(coord => {
      if (coord.address) {
        const key = `${coord.lat},${coord.lon}`;
        addressMap.set(key, coord.address.address_name);
      }
    });

    // 간단한 형태로 변환
    const simpleData: SimpleOutputData = {
      base: data.base,
      radiusKm: data.radiusKm,
      radiusM: data.radiusM,
      courses: data.courses.map((course: any) => {
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

    // 결과 출력
    console.log('=== 간단한 주소 정보 ===');
    simpleData.courses.forEach(course => {
      console.log(`\n${course.id}번 코스 (${course.angle}°):`);
      console.log(`  시작: ${course.start.address_name || '주소 없음'}`);
      console.log(`  종료: ${course.end.address_name || '주소 없음'}`);
    });

    // 간단한 버전 파일 저장
    const simplePath = path.resolve(process.cwd(), 'output-simple-address.json');
    fs.writeFileSync(simplePath, JSON.stringify(simpleData, null, 2), 'utf-8');

    console.log('\n✅ address_name만 포함된 간단한 버전이 output-simple-address.json 파일로 저장되었습니다!');
    console.log('🌐 카카오 API를 직접 호출하여 효율적으로 생성되었습니다.\n');

  } catch (error) {
    console.error('❌ 오류:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// 실행
createSimpleAddressFile();

export { createSimpleAddressFile };