import { getElevations } from './services/elevation.service';
import * as fs from 'fs';
import * as path from 'path';
/**
 * output.json 파일의 모든 midpoints에 고도 정보를 추가합니다.
 */
async function addElevationToMidpoints() {
    try {
        console.log('📍 output.json 파일을 읽는 중...');
        // output.json 파일 읽기
        const outputPath = path.resolve(process.cwd(), 'output.json');
        if (!fs.existsSync(outputPath)) {
            throw new Error('output.json 파일을 찾을 수 없습니다. 먼저 러닝 코스를 생성해주세요.');
        }
        const rawData = fs.readFileSync(outputPath, 'utf-8');
        const data = JSON.parse(rawData);
        console.log(`✅ ${data.courses.length}개의 코스를 발견했습니다.`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        // 모든 midpoints 좌표를 수집
        const allMidpoints = [];
        data.courses.forEach(course => {
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
        // Google Maps Elevation API 호출
        const locations = allMidpoints.map(point => ({ lat: point.lat, lon: point.lon }));
        const elevations = await getElevations(locations);
        console.log('✅ 고도 정보 조회 완료!\n');
        // 결과를 원본 데이터에 적용
        elevations.forEach((elevation, index) => {
            const midpointInfo = allMidpoints[index];
            const course = data.courses.find(c => c.id === midpointInfo.courseId);
            if (course) {
                course.midpoints[midpointInfo.pointIndex].elevation = Math.round(elevation.elevation * 100) / 100; // 소수점 2자리로 반올림
            }
        });
        // 결과 출력
        console.log('=== 고도 정보가 추가된 코스 목록 ===');
        data.courses.forEach(course => {
            console.log(`\n${course.id}번 코스 (${course.angle}°):`);
            course.midpoints.forEach((midpoint, index) => {
                console.log(`  ${(index + 1) * 25}%: lat=${midpoint.lat.toFixed(6)}, lon=${midpoint.lon.toFixed(6)}, elevation=${midpoint.elevation}m`);
            });
        });
        // 수정된 데이터를 파일에 저장
        const outputWithElevation = path.resolve(process.cwd(), 'output-with-elevation.json');
        fs.writeFileSync(outputWithElevation, JSON.stringify(data, null, 2), 'utf-8');
        console.log('\n✅ 고도 정보가 추가된 결과가 output-with-elevation.json 파일로 저장되었습니다!');
        console.log(`📊 총 ${allMidpoints.length}개 지점의 고도 정보가 추가되었습니다.\n`);
    }
    catch (error) {
        console.error('❌ 오류:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
// 실행
addElevationToMidpoints();
export { addElevationToMidpoints };
