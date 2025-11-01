import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';

// 백엔드 API 라우터들을 import
import geolocationRouter from '../apps/backend/api/geolocation';
import elevationRouter from '../apps/backend/api/elevation';
import coursesRouter from '../apps/backend/api/courses';

const app = express();

// CORS 설정 - 개발 및 프로덕션 환경 모두 지원
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
  // Vercel 자동 배포 URL도 허용
  ...(process.env.VERCEL_ENV ? ['https://running-*.vercel.app'] : []),
];

// 미들웨어
app.use(cors({
  origin: (origin, callback) => {
    // origin이 없는 경우 (same-origin 요청) 허용
    if (!origin) return callback(null, true);
    
    // 허용된 origin이거나 Vercel 도메인인 경우 허용
    if (allowedOrigins.some(allowed => {
      if (allowed === origin) return true;
      if (allowed.includes('*')) {
        const pattern = allowed.replace(/\*/g, '.*');
        return new RegExp(pattern).test(origin);
      }
      return false;
    })) {
      callback(null, true);
    } else {
      callback(null, true); // 개발 중에는 모든 origin 허용 (프로덕션에서는 제한 가능)
    }
  },
  credentials: true
}));
app.use(express.json());

// 요청 로깅 미들웨어 (디버깅용)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 라우트 - Vercel에서 /api/* 요청이 들어오므로 경로 설정
app.use('/', geolocationRouter);     // /api/geolocation, /api/reverse-geocode
app.use('/', elevationRouter);       // /api/elevation
app.use('/courses', coursesRouter);  // /api/courses/generate

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 환경 변수 디버깅 엔드포인트 (프로덕션에서는 제거 권장)
app.get('/debug/env', (req, res) => {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    KAKAO_REST_API_KEY: process.env.KAKAO_REST_API_KEY ? `${process.env.KAKAO_REST_API_KEY.substring(0, 8)}...` : 'undefined',
    GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY ? `${process.env.GOOGLE_GEMINI_API_KEY.substring(0, 8)}...` : 'undefined',
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY ? `${process.env.GOOGLE_MAPS_API_KEY.substring(0, 8)}...` : 'undefined',
    availableKeys: Object.keys(process.env).filter(k => k.includes('KAKAO') || k.includes('GOOGLE') || k.includes('GEMINI'))
  };
  res.json(envVars);
});

export default (req: VercelRequest, res: VercelResponse) => {
  return app(req, res);
};
