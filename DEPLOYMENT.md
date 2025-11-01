# Environment Variables for Vercel Deployment

## Required Environment Variables

### Google APIs
- `GOOGLE_GEOLOCATION_API_KEY`: Google Geolocation API key
- `GOOGLE_MAPS_API_KEY`: Google Maps API key  
- `GOOGLE_GEMINI_API_KEY`: Google Gemini AI API key

### Kakao APIs
- `VITE_KAKAO_MAP_API_KEY`: Kakao Map API key (for frontend)

## How to set up in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add each variable with their respective values
4. Make sure to set them for all environments (Production, Preview, Development)

## Local Development:

Create `.env.local` files in both `/apps/frontend/` and `/apps/backend/` directories:

### apps/backend/.env.local
```
GOOGLE_GEOLOCATION_API_KEY=your_geolocation_api_key
GOOGLE_MAPS_API_KEY=your_maps_api_key  
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
```

### apps/frontend/.env.local
```
VITE_KAKAO_MAP_API_KEY=your_kakao_map_api_key
```
