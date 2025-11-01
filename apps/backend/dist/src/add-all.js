import { getElevations } from './services/elevation.service';
import { getAddressesFromCoordinates } from './services/kakao-address.service';
import * as fs from 'fs';
import * as path from 'path';
/**
 * 러닝 코스에 고도와 주소 정보를 모두 추가하는 통합 스크립트
 * 중간 파일을 생성하지 않고 바로 output-complete.json만 생성합니다.
 */
async function addAllInformation() {
    try {
        console.log('🚀 러닝 코스에 고도 및 주소 정보를 추가합니다...\n');
        // output.json 파일 존재 확인
        const outputPath = path.resolve(process.cwd(), 'output.json');
        if (!fs.existsSync(outputPath)) {
            throw new Error('output.json 파일을 찾을 수 없습니다. 먼저 러닝 코스를 생성해주세요.');
        }
        const rawData = fs.readFileSync(outputPath, 'utf-8');
        const data = JSON.parse(rawData);
        console.log(`✅ ${data.courses.length}개의 코스를 발견했습니다.`);
        // 1단계: 고도 정보 추가
        console.log('\n1️⃣ 고도 정보 추가 중...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        const allMidpoints = [];
        data.courses.forEach((course) => {
            course.midpoints.forEach((midpoint, index) => {
                allMidpoints.push({
                    lat: midpoint.lat,
                    lon: midpoint.lon,
                    courseId: course.id,
                    pointIndex: index,
                });
            });
        });
        console.log(`🏔️  총 ${allMidpoints.length}개의 midpoint 고도를 조회하는 중...`);
        const locations = allMidpoints.map(point => ({ lat: point.lat, lon: point.lon }));
        const elevations = await getElevations(locations);
        elevations.forEach((elevation, index) => {
            const midpointInfo = allMidpoints[index];
            const course = data.courses.find((c) => c.id === midpointInfo.courseId);
            if (course) {
                course.midpoints[midpointInfo.pointIndex].elevation = Math.round(elevation.elevation * 100) / 100;
            }
        });
        console.log('✅ 고도 정보 조회 완료!');
        // 2단계: 주소 정보 추가
        console.log('\n2️⃣ 간단한 주소 정보 추가 중...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        const coordinateSet = new Set();
        const coordinates = [];
        // base 좌표 추가
        const baseKey = `${data.base.lat},${data.base.lon}`;
        if (!coordinateSet.has(baseKey)) {
            coordinateSet.add(baseKey);
            coordinates.push({ lat: data.base.lat, lon: data.base.lon });
        }
        // 각 코스의 end 좌표 추가
        data.courses.forEach((course) => {
            const endKey = `${course.end.lat},${course.end.lon}`;
            if (!coordinateSet.has(endKey)) {
                coordinateSet.add(endKey);
                coordinates.push({ lat: course.end.lat, lon: course.end.lon });
            }
        });
        console.log(`🏠 총 ${coordinates.length}개의 고유한 좌표의 주소를 조회합니다.`);
        const coordinatesWithAddress = await getAddressesFromCoordinates(coordinates, 100);
        // 주소 정보를 맵으로 변환
        const addressMap = new Map();
        coordinatesWithAddress.forEach(coord => {
            if (coord.address) {
                const key = `${coord.lat},${coord.lon}`;
                addressMap.set(key, coord.address.address_name);
            }
        });
        console.log('✅ 주소 정보 조회 완료!');
        // 3단계: 최종 데이터 구성
        console.log('\n3️⃣ 최종 통합 데이터 생성 중...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        const finalData = {
            base: data.base,
            radiusKm: data.radiusKm,
            radiusM: data.radiusM,
            courses: data.courses.map((course) => {
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
        // 최종 파일 저장
        const finalPath = path.resolve(process.cwd(), 'output-complete.json');
        fs.writeFileSync(finalPath, JSON.stringify(finalData, null, 2), 'utf-8');
        console.log('✅ 모든 정보가 추가된 최종 파일이 output-complete.json으로 저장되었습니다!');
        console.log('\n📊 완성된 데이터에는 다음이 포함됩니다:');
        console.log('   • 12개 방향의 러닝 코스');
        console.log('   • 각 코스의 3개 midpoint 고도 정보');
        console.log('   • 시작점과 종료점의 간단한 주소 (address_name만)');
        console.log('\n🗂️  생성된 파일:');
        console.log('   • output-complete.json (고도 + 간단한 주소 통합) ⭐️');
        console.log('   📝 중간 파일 없이 바로 최종 결과만 생성됩니다!');
    }
    catch (error) {
        console.error('❌ 오류:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
// 실행
addAllInformation();
export { addAllInformation };
