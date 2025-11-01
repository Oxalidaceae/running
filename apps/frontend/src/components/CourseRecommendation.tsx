import React, { useEffect, useState } from 'react';
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
  onBack: () => void;
  onCourseSelect: (course: Course) => void;
}

const CourseRecommendation: React.FC<CourseRecommendationProps> = ({ 
  distance, 
  position, 
  onBack,
  onCourseSelect 
}) => {
  const [address, setAddress] = useState<string>('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);

  // 위치를 주소로 변환하는 함수
  const fetchAddress = async () => {
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
  };

  useEffect(() => {
    fetchAddress();
  }, [position.latitude, position.longitude]);
  // 백엔드 추천 데이터 기반 코스 데이터
  const courses: Course[] = [
    {
      courseId: 12,
      rank: 1,
      name: '코스1',
      distance: `${distance} km`,
      estimatedTime: `${Math.round(parseFloat(distance) * 5)}분`,
      summary: "가장 완만하고 안정적인 상승 구간으로 이루어진 초보자에게 최적화된 코스입니다.",
      reason: "midpoints 간 평균 고도 변화량이 1.21로 12개 코스 중 가장 낮으며, 총 누적 상승고도도 2.41로 매우 적습니다. 고도 변화의 방향 전환 없이 꾸준히 완만하게 상승하는 패턴을 보여 초보자가 편안하게 완주할 수 있는 가장 안정적인 코스입니다.",
      elevationAnalysis: {
        averageChange: 1.21,
        totalAscent: 2.41,
        totalDescent: 0
      },
      scores: {
        elevation: 10,
        overall: 9.8
      },
      waypoints: [
        { latitude: position.latitude + 0.002, longitude: position.longitude + 0.003 },
        { latitude: position.latitude + 0.004, longitude: position.longitude + 0.001 },
        { latitude: position.latitude + 0.003, longitude: position.longitude - 0.002 }
      ]
    },
    {
      courseId: 7,
      rank: 2,
      name: '코스2',
      distance: `${distance} km`,
      estimatedTime: `${Math.round(parseFloat(distance) * 5.5)}분`,
      summary: "고도 변화량은 매우 낮지만, 완만한 내리막과 오르막이 반복되는 평이한 코스입니다.",
      reason: "midpoints 간 평균 고도 변화량이 3.21로 두 번째로 낮으며, 총 누적 상승/하강 고도 또한 3.21로 매우 적습니다. 고도 변화의 방향이 한번 전환(하강 후 상승)되지만, 각각 3.21m의 미미한 변화여서 급격한 경사 없이 완만한 러닝이 가능합니다.",
      elevationAnalysis: {
        averageChange: 3.21,
        totalAscent: 3.21,
        totalDescent: 3.21
      },
      scores: {
        elevation: 9.5,
        overall: 9.3
      },
      waypoints: [
        { latitude: position.latitude - 0.001, longitude: position.longitude + 0.004 },
        { latitude: position.latitude + 0.003, longitude: position.longitude + 0.002 },
        { latitude: position.latitude + 0.002, longitude: position.longitude - 0.003 }
      ]
    },
    {
      courseId: 1,
      rank: 3,
      name: '코스3',
      distance: `${distance} km`,
      estimatedTime: `${Math.round(parseFloat(distance) * 6)}분`,
      summary: "꾸준히 완만하게 상승하는 패턴을 가진 초보자에게 적합한 코스입니다.",
      reason: "midpoints 간 평균 고도 변화량이 4.03으로 낮고, 총 누적 상승고도도 8.05로 적은 편입니다. 고도 변화의 방향 전환 없이 꾸준히 완만하게 상승하는 패턴을 보여주며, midpoints의 고도 변화가 안정적이어서 초보자가 안정적으로 달릴 수 있는 좋은 코스입니다.",
      elevationAnalysis: {
        averageChange: 4.03,
        totalAscent: 8.05,
        totalDescent: 0
      },
      scores: {
        elevation: 9,
        overall: 9
      },
      waypoints: [
        { latitude: position.latitude + 0.001, longitude: position.longitude - 0.004 },
        { latitude: position.latitude - 0.002, longitude: position.longitude - 0.002 },
        { latitude: position.latitude - 0.003, longitude: position.longitude + 0.001 }
      ]
    }
  ];
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
              <span className="text-gray-600">출발 위치:</span>
              <span className="text-sm text-gray-800 max-w-48 text-right">
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
          <div className="space-y-3">
            {courses.map((course) => (
              <button
                key={course.courseId}
                onClick={() => onCourseSelect(course)}
                className="w-full border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">#{course.rank}</span>
                    <span className="font-medium text-gray-700">{course.name}</span>
                  </div>
                  <span className="text-sm text-blue-600">{course.distance}</span>
                </div>
                <p className="text-sm text-gray-600 mb-1">예상 시간: {course.estimatedTime}</p>
                <p className="text-xs text-gray-500 mb-2">{course.summary}</p>
                
                {/* 고도 분석 정보 */}
                <div className="flex space-x-4 text-xs text-gray-500 mb-2">
                  <span>평균 고도 변화: {course.elevationAnalysis.averageChange}m</span>
                  <span>상승: {course.elevationAnalysis.totalAscent}m</span>
                  {course.elevationAnalysis.totalDescent > 0 && (
                    <span>하강: {course.elevationAnalysis.totalDescent}m</span>
                  )}
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
        </div>
      </div>
    </div>
  );
};

export default CourseRecommendation;