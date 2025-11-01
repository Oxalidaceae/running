import React from 'react';
import type { Position } from '../types';

interface ElevationAnalysis {
  averageChange: number;
  totalAscent: number;
  totalDescent: number;
}

interface Scores {
  elevation: number;
  overall: number;
}

interface Course {
  courseId: number;
  rank: number;
  summary: string;
  reason: string;
  elevationAnalysis: ElevationAnalysis;
  scores: Scores;
  // UI용 추가 필드
  name: string;
  distance: string;
  estimatedTime: string;
  waypoints: Position[];
}

interface CourseDetailProps {
  course: Course;
  userPosition: Position;
  onBack: () => void;
  onStartRunning: () => void;
}

const CourseDetail: React.FC<CourseDetailProps> = ({ 
  course, 
  userPosition, 
  onBack, 
  onStartRunning 
}) => {
  // 카카오맵 경로 링크 생성 함수
  const generateKakaoMapUrl = () => {
    // 출발점 (현재 위치)
    const start = `출발점,${userPosition.latitude},${userPosition.longitude}`;
    
    // 경유지 (1개 - end 지점)
    const waypoint = course.waypoints.length > 0 
      ? `경유지,${course.waypoints[0].latitude},${course.waypoints[0].longitude}`
      : '';
    
    // 도착점 (출발점으로 복귀 - 원형 코스)
    const end = `도착점,${userPosition.latitude},${userPosition.longitude}`;
    
    // 전체 경로 조합
    const fullPath = waypoint ? `${start}/${waypoint}/${end}` : `${start}/${end}`;
    
    return `https://map.kakao.com/link/by/walk/${fullPath}`;
  };
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-4">
          <button onClick={onBack} className="p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-gray-800">{course.name}</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Kakao Map with Route */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden h-80">
          <div className="relative h-full">
            <iframe
              src={generateKakaoMapUrl()}
              className="w-full h-full border-0"
              title="카카오맵 경로"
              allowFullScreen
            />
            {/* Route overlay indicator */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">추천 경로</span>
              </div>
            </div>
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
              <span className="text-sm font-semibold text-blue-600">{course.distance}</span>
            </div>
          </div>
        </div>

        {/* Course Info */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">코스 정보</h3>
            <span className="bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full">추천 #{course.rank}</span>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span className="text-gray-600">거리:</span>
                <span className="font-semibold text-blue-600">{course.distance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">예상 시간:</span>
                <span className="font-medium text-gray-800">{course.estimatedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">평점:</span>
                <span className="font-semibold text-blue-600">{course.scores.overall}/10</span>
              </div>
            </div>
            
            {/* 고도 분석 정보 */}
            <div className="border-t pt-3">
              <h4 className="font-medium text-gray-700 mb-2">🏔️ 고도 분석</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">평균 고도 변화:</span>
                  <span className="font-medium">{course.elevationAnalysis.averageChange}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">총 상승:</span>
                  <span className="font-medium text-red-500">{course.elevationAnalysis.totalAscent}m</span>
                </div>
                {course.elevationAnalysis.totalDescent > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">총 하강:</span>
                    <span className="font-medium text-blue-500">{course.elevationAnalysis.totalDescent}m</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-700">{course.summary}</p>
            </div>
          </div>
        </div>

        {/* AI Recommendation Reason */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 mb-2">🤖 AI 추천 이유</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                {course.reason}
              </p>
            </div>
          </div>
        </div>

        {/* Route Waypoints */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h4 className="font-semibold text-gray-800 mb-3">경로 포인트</h4>
          <div className="space-y-3">
            {/* 출발점 */}
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">S</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">출발점</p>
                <p className="text-xs text-gray-500">
                  {userPosition.latitude.toFixed(4)}, {userPosition.longitude.toFixed(4)}
                </p>
              </div>
            </div>
            
            {/* 경유지 (1개) */}
            {course.waypoints.length > 0 && (
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">경유지</p>
                  <p className="text-xs text-gray-500">
                    {course.waypoints[0].latitude.toFixed(4)}, {course.waypoints[0].longitude.toFixed(4)}
                  </p>
                </div>
              </div>
            )}
            
            {/* 도착점 (출발점 복귀) */}
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">E</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">도착점 (출발점 복귀)</p>
                <p className="text-xs text-gray-500">
                  {userPosition.latitude.toFixed(4)}, {userPosition.longitude.toFixed(4)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button 
            onClick={onStartRunning}
            className="w-full bg-blue-600 text-white font-semibold py-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h6m6-10v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
            <span>러닝 시작</span>
          </button>
          
          <button 
            onClick={() => window.open(generateKakaoMapUrl(), '_blank')}
            className="w-full bg-orange-500 text-white font-semibold py-4 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>카카오맵에서 크게 보기</span>
          </button>
          
          <button 
            onClick={onBack}
            className="w-full bg-gray-200 text-gray-700 font-semibold py-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            다른 코스 선택
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;