import { useEffect, useRef, useState } from 'react';
import type { Position } from '../types';

interface KakaoMapOptions {
  center: Position;
  level?: number;
}

declare global {
  interface Window {
    kakao: any;
  }
}

// 카카오맵 API 로드 함수
const loadKakaoMapScript = () => {
  return new Promise<void>((resolve, reject) => {
    if (window.kakao && window.kakao.maps) {
      resolve();
      return;
    }

    // 이미 스크립트가 로드 중인지 확인
    const existingScript = document.querySelector('script[src*="dapi.kakao.com"]');
    if (existingScript) {
      // 이미 로드 중이면 잠시 후 다시 확인
      const checkInterval = setInterval(() => {
        if (window.kakao && window.kakao.maps) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      // 10초 후 타임아웃
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('카카오맵 API 로드 타임아웃'));
      }, 10000);
      return;
    }

    const script = document.createElement('script');
    const apiKey = import.meta.env.VITE_KAKAO_MAP_API_KEY;
    
    if (!apiKey) {
      reject(new Error('카카오맵 API 키가 설정되지 않았습니다'));
      return;
    }

    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`;
    script.async = true;
    
    script.onload = () => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          resolve();
        });
      } else {
        reject(new Error('카카오맵 객체를 찾을 수 없습니다'));
      }
    };
    
    script.onerror = (event) => {
      console.error('카카오맵 스크립트 로드 오류:', event);
      reject(new Error('카카오맵 API 로드 실패 - 네트워크 오류 또는 잘못된 API 키'));
    };
    
    document.head.appendChild(script);
  });
};

export const useKakaoMap = (options: KakaoMapOptions) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5;

  useEffect(() => {
    if (!options.center) return;

    const initializeMap = async () => {
      try {
        console.log('카카오맵 API 키:', import.meta.env.VITE_KAKAO_MAP_API_KEY?.substring(0, 8) + '...');
        console.log('카카오맵 로드 시작...');
        
        await loadKakaoMapScript();
        console.log('카카오맵 로드 완료');
        setIsLoaded(true);
        
        if (!mapRef.current) return;

        const { kakao } = window;
        
        // 지도 생성
        const mapOption = {
          center: new kakao.maps.LatLng(options.center.latitude, options.center.longitude),
          level: options.level || 3
        };

        const map = new kakao.maps.Map(mapRef.current, mapOption);
        mapInstanceRef.current = map;

        // 현재 위치 마커 추가
        const markerPosition = new kakao.maps.LatLng(options.center.latitude, options.center.longitude);
        const marker = new kakao.maps.Marker({
          position: markerPosition,
          map: map
        });
        markerRef.current = marker;

        // 현재 위치 정보창 추가
        const infoWindow = new kakao.maps.InfoWindow({
          content: '<div style="padding:5px;font-size:12px;">현재 위치</div>',
          removable: true
        });
        
        // 마커 클릭 이벤트
        kakao.maps.event.addListener(marker, 'click', () => {
          infoWindow.open(map, marker);
        });

        // 성공 시 재시도 카운터 초기화
        setRetryCount(0);

      } catch (err) {
        console.error('카카오맵 초기화 오류:', err);
        const errorMessage = err instanceof Error ? err.message : '지도 로드 중 오류가 발생했습니다';
        
        // 자동 재시도 로직
        if (retryCount < maxRetries) {
          const nextRetryCount = retryCount + 1;
          console.log(`카카오맵 자동 재시도 ${nextRetryCount}/${maxRetries}...`);
          setRetryCount(nextRetryCount);
          
          // 2초 후 재시도
          setTimeout(() => {
            initializeMap();
          }, 2000);
        } else {
          // 최대 재시도 횟수 초과 시 에러 표시
          console.log('카카오맵 로드 최대 재시도 횟수 초과, 페이지 새로고침 시도...');
          setError(errorMessage);
          
          // 3초 후 자동 새로고침
          setTimeout(() => {
            console.log('🔄 카카오맵 로드 실패로 인한 자동 새로고침');
            window.location.reload();
          }, 3000);
        }
      }
    };

    initializeMap();
  }, [options.center.latitude, options.center.longitude, options.level, retryCount]);

  // 지도 중심 이동 함수
  const moveToLocation = (position: Position) => {
    if (mapInstanceRef.current && window.kakao) {
      const { kakao } = window;
      const moveLatLng = new kakao.maps.LatLng(position.latitude, position.longitude);
      mapInstanceRef.current.setCenter(moveLatLng);

      // 마커 위치도 이동
      if (markerRef.current) {
        markerRef.current.setPosition(moveLatLng);
      }
    }
  };

  return {
    mapRef,
    mapInstance: mapInstanceRef.current,
    moveToLocation,
    isLoaded,
    error,
    retryCount
  };
};
