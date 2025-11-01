import { config } from 'dotenv';

// .env 파일 로드
config({ path: '.env' });
// .env.local 파일도 로드 (우선순위: .env.local > .env)
config({ path: '.env.local' });

import express from 'express';
import cors from 'cors';
import geolocationRouter from './api/geolocation';
import elevationRouter from './api/elevation';
import coursesRouter from './api/courses';

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(express.json());

console.log('API KEY:', process.env.GOOGLE_GEOLOCATION_API_KEY);
console.log('MAPS API KEY:', process.env.GOOGLE_MAPS_API_KEY);

// 라우트
app.use('/api', geolocationRouter);
app.use('/api', elevationRouter);
app.use('/api/courses', coursesRouter);

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
});
