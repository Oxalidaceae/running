// API Base URL - 상대 경로 사용 (Vercel 배포 시 자동으로 올바른 도메인 사용)
export const API_BASE_URL = '';

export const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000,
};