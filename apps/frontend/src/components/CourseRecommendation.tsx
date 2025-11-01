import React, { useEffect, useState, useCallback } from 'react';
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

interface CourseRecommendationProps {
  distance: string;
  position: Position;
  courses: Course[]; // 미리 가져온 코스 데이터
  onBack: () => void;
  onCourseSelect: (course: Course) => void;
}

const CourseRecommendation: React.FC<CourseRecommendationProps> = ({
  distance,
  position,
  courses, // props로 받은 코스 데이터 사용
  onBack,
  onCourseSelect
}) => {
  const [address, setAddress] = useState<string>('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);

  // 위치를 주소로 변환하는 함수
  const fetchAddress = useCallback(async () => {
    try {
      setIsLoadingAddress(true);
      const response = await fetch(`http://localhost:3000/api/reverse-geocode?lat=${position.latitude}&lng=${position.longitude}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.address) {
          // 도로명 주소가 있으면 우선 사용, 없으면 지번 주소 사용
          const displayAddress = data.address.road_address?.address_name || data.address.address_name;
          setAddress(displayAddress);
        } else {
          setAddress(`${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)}`);
        }
      } else {
        // API 호출 실패시 좌표 표시
        setAddress(`${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)}`);
      }
    } catch (error) {
      console.error('주소 변환 오류:', error);
      // 오류 발생시 좌표 표시
      setAddress(`${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)}`);
    } finally {
      setIsLoadingAddress(false);
    }
  }, [position.latitude, position.longitude]);

  useEffect(() => {
    fetchAddress();
  }, [fetchAddress]);

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
          <h1 className="text-xl font-semibold text-gray-800">코스 추천</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Course Info */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">요청한 코스 정보</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">거리:</span>
              <span className="font-semibold text-blue-600">{distance} km</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 flex-shrink-0">출발 위치:</span>
              <span className="text-sm text-gray-800 text-right ml-2 flex-1">
                {isLoadingAddress ? (
                  <span className="text-gray-500">주소 조회 중...</span>
                ) : (
                  address
                )}
              </span>
            </div>
          </div>
        </div>



        {/* Course List */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">추천 코스</h3>

          {courses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              추천할 수 있는 코스가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => (
                <button
                  key={course.courseId}
                  onClick={() => onCourseSelect(course)}
                  className="w-full border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">코스 {course.rank}</span>
                    </div>
                    <span className="text-sm text-blue-600">{course.distance}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">예상 시간: {course.estimatedTime} (평균페이스 5분 기준) </p>
                  <p className="text-xs text-gray-500 mb-2">{course.summary}</p>

                  {/* 고도 분석 정보 */}
                  <div className="flex space-x-4 text-xs text-gray-500 mb-2">
                    <span>상승: {course.elevationAnalysis.totalAscent}m</span>
                    <span>하강: {course.elevationAnalysis.totalDescent}m</span>
                    <span>평균 고도 변화: {course.elevationAnalysis.averageChange}m</span>

                  </div>

                  <div className="flex items-center justify-end mt-2">
                    <div className="text-right">
                      <div className="text-xs text-gray-500">평점</div>
                      <div className="text-sm font-semibold text-blue-600">{course.scores.overall}/10</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {/* Back to Main Button */}
          <div className="mt-6">
            <button 
              onClick={onBack}
              className="w-full bg-gray-200 text-gray-700 font-semibold py-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              메인으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseRecommendation;
