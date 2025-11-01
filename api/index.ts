import { VercelRequest, VercelResponse } from '@vercel/node';
import { config } from 'dotenv';
import express from 'express';
import cors from 'cors';

// 환경 변수 로드 (Vercel에서는 자동으로 로드되지만 안전장치)
config();

// 백엔드 API 라우터들을 import
import geolocationRouter from '../apps/backend/api/geolocation';
import elevationRouter from '../apps/backend/api/elevation';
import coursesRouter from '../apps/backend/api/courses';

const app = express();

// 미들웨어
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''],
  credentials: true
}));
app.use(express.json());

// 라우트
app.use('/api', geolocationRouter);
app.use('/api', elevationRouter);
app.use('/api/courses', coursesRouter);

// 헬스 체크 (환경 변수 상태도 포함)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: {
      hasGoogleGeo: !!process.env.GOOGLE_GEOLOCATION_API_KEY,
      hasGoogleMaps: !!process.env.GOOGLE_MAPS_API_KEY,
      hasGoogleGemini: !!process.env.GOOGLE_GEMINI_API_KEY,
      hasKakaoRest: !!process.env.KAKAO_REST_API_KEY,
      nodeEnv: process.env.NODE_ENV
    }
  });
});

export default (req: VercelRequest, res: VercelResponse) => {
  return app(req, res);
};
