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
    // 이미 로드되어 있으면 바로 resolve
    if (window.kakao && window.kakao.maps) {
      console.log('✅ 카카오맵 이미 로드됨');
      resolve();
      return;
    }

    const apiKey = import.meta.env.VITE_KAKAO_MAP_API_KEY;
    
    console.log('🔑 API 키 확인:', apiKey ? `${apiKey.substring(0, 8)}...` : '❌ undefined');
    console.log('🌍 환경:', import.meta.env.MODE);
    console.log('🏗️ PROD:', import.meta.env.PROD);
    
    if (!apiKey) {
      console.error('❌ 카카오맵 API 키가 없습니다!');
      console.log('사용 가능한 환경 변수:', Object.keys(import.meta.env));
      reject(new Error('카카오맵 API 키가 설정되지 않았습니다. VITE_KAKAO_MAP_API_KEY 환경 변수를 확인하세요.'));
      return;
    }

    // 기존 스크립트 완전히 제거
    const existingScripts = document.querySelectorAll('script[src*="dapi.kakao.com"]');
    if (existingScripts.length > 0) {
      console.log(`🗑️ 기존 카카오맵 스크립트 ${existingScripts.length}개 제거`);
      existingScripts.forEach(script => script.remove());
    }

    console.log('📥 카카오맵 스크립트 새로 다운로드 시작...');
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`;
    script.async = true;
    
    let timeoutId: number;
    
    script.onload = () => {
      console.log('📦 스크립트 다운로드 완료, kakao 객체 확인 중...');
      
      // kakao 객체가 로드될 때까지 polling
      let checkCount = 0;
      const checkKakao = () => {
        checkCount++;
        console.log(`kakao 객체 확인 시도 ${checkCount}/50`);
        
        if (window.kakao && window.kakao.maps) {
          console.log('✅ kakao.maps 객체 발견, 맵 로드 중...');
          clearTimeout(timeoutId);
          window.kakao.maps.load(() => {
            console.log('✅ 카카오맵 로드 완료!');
            resolve();
          });
        } else if (checkCount < 50) {
          setTimeout(checkKakao, 100);
        } else {
          console.error('❌ kakao 객체를 찾을 수 없습니다 (50회 시도 후)');
          console.log('window.kakao:', window.kakao);
          clearTimeout(timeoutId);
          reject(new Error('카카오맵 객체를 찾을 수 없습니다'));
        }
      };
      
      checkKakao();
    };
    
    script.onerror = (event) => {
      console.error('❌ 카카오맵 스크립트 로드 오류:', event);
      console.error('스크립트 URL:', script.src);
      clearTimeout(timeoutId);
      reject(new Error('카카오맵 API 로드 실패 - 네트워크 오류 또는 잘못된 API 키'));
    };
    
    // 전체 타임아웃 (15초)
    timeoutId = setTimeout(() => {
      console.error('❌ 카카오맵 전체 로드 타임아웃 (15초)');
      script.remove();
      reject(new Error('카카오맵 API 로드 타임아웃'));
    }, 15000) as unknown as number;
    
    document.head.appendChild(script);
    console.log('📌 스크립트 태그 추가됨:', script.src);
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
