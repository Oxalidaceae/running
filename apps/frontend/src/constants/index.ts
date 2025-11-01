// 환경에 따라 API URL 설정
export const API_BASE_URL = import.meta.env.PROD 
  ? '' // 프로덕션에서는 상대 경로 사용 (same origin)
  : 'http://localhost:3000'; // 개발 환경에서는 로컬 백엔드 서버 사용

export const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000,
};
