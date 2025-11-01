const EARTH_RADIUS = 6371000; // 지구 반지름 (m)
const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;
// 두 좌표 사이의 거리 (하버사인 공식)
export function haversine(lat1, lon1, lat2, lon2) {
    const lat1Rad = toRad(lat1);
    const lat2Rad = toRad(lat2);
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS * c;
}
// 시작 → 끝 방향의 방위각 (bearing) (북쪽 기준, 시계방향 0°~360°)
export function initialBearing(lat1, lon1, lat2, lon2) {
    const lat1Rad = toRad(lat1);
    const lat2Rad = toRad(lat2);
    const lon1Rad = toRad(lon1);
    const lon2Rad = toRad(lon2);
    const y = Math.sin(lon2Rad - lon1Rad) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(lon2Rad - lon1Rad);
    const angle = Math.atan2(y, x);
    return (toDeg(angle) + 360) % 360;
}
// 현재 좌표(lat, lon)에서 거리(m), 방위각(deg)만큼 이동한 지점 계산
export function destinationPoint(lat, lon, distanceM, bearingDeg) {
    const latRad = toRad(lat);
    const lonRad = toRad(lon);
    const bearingRad = toRad(bearingDeg);
    const distanceRatio = distanceM / EARTH_RADIUS;
    const newLatRad = Math.asin(Math.sin(latRad) * Math.cos(distanceRatio) +
        Math.cos(latRad) * Math.sin(distanceRatio) * Math.cos(bearingRad));
    const newLonRad = lonRad + Math.atan2(Math.sin(bearingRad) * Math.sin(distanceRatio) * Math.cos(latRad), Math.cos(distanceRatio) - Math.sin(latRad) * Math.sin(newLatRad));
    return {
        lat: toDeg(newLatRad),
        lon: ((toDeg(newLonRad) + 540) % 360) - 180, // normalize [-180,180]
    };
}
// 현재 좌표 기준, 반경 r(m)짜리 원 위 12개 점(30° 간격)
export function circle12Points(lat, lon, radiusM) {
    const bearings = Array.from({ length: 12 }, (_, i) => i * 30);
    return bearings.map((b) => destinationPoint(lat, lon, radiusM, b));
}
// 시작점 → 목표점 직선상의 등분점(25%, 50%, 75%)
export function divideLinePoints(start, end) {
    const bearing = initialBearing(start.lat, start.lon, end.lat, end.lon);
    const dist = haversine(start.lat, start.lon, end.lat, end.lon);
    return [0.25, 0.5, 0.75].map((f) => destinationPoint(start.lat, start.lon, dist * f, bearing));
}
// 테스트용 코드는 src/main.ts로 이동되었습니다.
// 실행: npx tsx src/main.ts
