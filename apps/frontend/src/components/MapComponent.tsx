import React from 'react';
import type { Position } from '../types';
import { useKakaoMap } from '../hooks/useKakaoMap';

interface MapComponentProps {
  position: Position;
  className?: string;
}

const MapComponent: React.FC<MapComponentProps> = ({ position, className = '' }) => {
  const { mapRef, isLoaded, error } = useKakaoMap({
    center: position,
    level: 3
  });

  if (error) {
    return (
      <div className={`w-full h-full min-h-[300px] flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center text-gray-500">
          <p className="text-red-500 mb-2">⚠️ 지도 로드 오류</p>
          <p className="text-sm">{error}</p>
          <p className="text-xs mt-2 text-gray-400">카카오맵 API 키를 확인해주세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full min-h-[300px] ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-gray-600 text-sm">카카오맵 로딩 중...</p>
          </div>
        </div>
      )}
      <div 
        ref={mapRef} 
        className="w-full h-full"
        style={{ background: '#f8f9fa' }}
      />
    </div>
  );
};

export default MapComponent;