import React, { useState, useEffect } from 'react';
import type { Position } from '../types';
import { saveCourse, isCourseAlreadySaved, removeSavedCourse, type SavedCourse } from '../utils/courseStorage';
import SavedCoursesMenu from './SavedCoursesMenu';

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
  onSavedCourseSelect?: (course: Course, userPosition: Position) => void;
  isFromSavedCourse?: boolean; // 저장된 코스에서 온 것인지 구분
}

const CourseDetail: React.FC<CourseDetailProps> = ({
  course,
  userPosition,
  onBack,
  onSavedCourseSelect,
  isFromSavedCourse = false
}) => {
  const [addresses, setAddresses] = useState<{
    start: string;
    waypoint: string;
    end: string;
  }>({
    start: '',
    waypoint: '',
    end: ''
  });
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavedCoursesMenuOpen, setIsSavedCoursesMenuOpen] = useState(false);

  // 주소를 가져오는 함수
  const fetchAddress = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(`http://localhost:3000/api/reverse-geocode?lat=${lat}&lng=${lng}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.address) {
          return data.address.road_address?.address_name || data.address.address_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
      }
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error('주소 변환 오류:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  // 코스 저장 상태 확인
  useEffect(() => {
    setIsSaved(isCourseAlreadySaved(course.courseId));
  }, [course.courseId]);

  // 모든 지점의 주소를 가져오기
  useEffect(() => {
    const fetchAllAddresses = async () => {
      setIsLoadingAddresses(true);

      try {
        // 출발점 주소
        const startAddress = await fetchAddress(userPosition.latitude, userPosition.longitude);

        // 반환점 주소 (waypoints[0]이 실제로는 end 지점)
        let waypointAddress = '';
        if (course.waypoints.length > 0) {
          waypointAddress = await fetchAddress(
            course.waypoints[0].latitude,
            course.waypoints[0].longitude
          );
        }

        // 도착점 주소 (출발점과 동일)
        const endAddress = startAddress;

        setAddresses({
          start: startAddress,
          waypoint: waypointAddress,
          end: endAddress
        });
      } catch (error) {
        console.error('주소 조회 오류:', error);
      } finally {
        setIsLoadingAddresses(false);
      }
    };

    fetchAllAddresses();
  }, [course.waypoints, userPosition]);

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

  // 코스 저장 함수
  const handleSaveCourse = async () => {
    if (isSaved || isSaving) return;
    
    setIsSaving(true);
    try {
      const courseToSave = {
        ...course,
        userPosition
      };
      await saveCourse(courseToSave, userPosition);
      setIsSaved(true);
      alert('코스가 저장되었습니다!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '코스 저장에 실패했습니다.';
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // 저장된 코스 선택 핸들러
  const handleSavedCourseSelect = (savedCourse: SavedCourse) => {
    if (onSavedCourseSelect) {
      // SavedCourse를 Course 타입으로 변환
      const newCourse: Course = {
        courseId: savedCourse.courseId,
        rank: savedCourse.rank,
        summary: savedCourse.summary,
        reason: savedCourse.reason,
        elevationAnalysis: savedCourse.elevationAnalysis,
        scores: savedCourse.scores,
        name: savedCourse.name,
        distance: savedCourse.distance,
        estimatedTime: savedCourse.estimatedTime,
        waypoints: savedCourse.waypoints
      };
      
      onSavedCourseSelect(newCourse, savedCourse.userPosition);
    }
  };

  // 저장된 코스 삭제 함수
  const handleDeleteSavedCourse = async () => {
    if (confirm('이 저장된 코스를 삭제하시겠습니까?')) {
      try {
        removeSavedCourse(course.courseId);
        setIsSaved(false);
        alert('코스가 삭제되었습니다.');
        onBack(); // 메인으로 돌아가기
      } catch (error) {
        alert('코스 삭제에 실패했습니다.');
      }
    }
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
          <button
            onClick={() => setIsSavedCoursesMenuOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
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
          </div>
        </div>

        {/* Course Info */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">코스 정보</h3>
            <span className="bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full">코스 {course.rank}</span>
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
                  <span className="text-gray-600">총 상승:</span>
                  <span className="font-medium text-red-500">{course.elevationAnalysis.totalAscent.toFixed(2)}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">총 하강:</span>
                  <span className="font-medium text-blue-500">{course.elevationAnalysis.totalDescent.toFixed(2)}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">평균 고도 변화:</span>
                  <span className="font-medium">{course.elevationAnalysis.averageChange.toFixed(2)}m</span>
                </div>
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
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">출발점</p>
                <p className="text-xs text-gray-500">
                  {isLoadingAddresses ? (
                    <span className="text-gray-400">주소 조회 중...</span>
                  ) : (
                    addresses.start
                  )}
                </p>
              </div>
            </div>

            {/* 반환점 */}
            {course.waypoints.length > 0 && (
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">T</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">반환점</p>
                  <p className="text-xs text-gray-500">
                    {isLoadingAddresses ? (
                      <span className="text-gray-400">주소 조회 중...</span>
                    ) : (
                      addresses.waypoint
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* 도착점 (출발점 복귀) */}
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">E</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">도착점 (출발점 복귀)</p>
                <p className="text-xs text-gray-500">
                  {isLoadingAddresses ? (
                    <span className="text-gray-400">주소 조회 중...</span>
                  ) : (
                    addresses.end
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => window.open(generateKakaoMapUrl(), '_blank')}
            className="w-full bg-blue-500 text-white font-semibold py-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
          >
            <span>카카오맵에서 크게 보기</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>

          {/* 저장된 코스에서 온 경우와 새로 생성된 코스에서 온 경우를 구분 */}
          {isFromSavedCourse ? (
            // 저장된 코스에서 온 경우: 저장 삭제 버튼
            <button
              onClick={handleDeleteSavedCourse}
              className="w-full bg-red-500 text-white font-semibold py-4 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>저장 삭제</span>
            </button>
          ) : (
            // 새로 생성된 코스에서 온 경우: 저장하기 버튼
            <button
              onClick={handleSaveCourse}
              disabled={isSaved || isSaving}
              className={`w-full font-semibold py-4 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                isSaved 
                  ? 'bg-green-500 text-white cursor-default' 
                  : isSaving 
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-purple-500 text-white hover:bg-purple-600'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>저장 중...</span>
                </>
              ) : isSaved ? (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>저장 완료</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>코스 저장하기</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onBack}
            className="w-full bg-gray-200 text-gray-700 font-semibold py-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            {isFromSavedCourse ? '메인으로 돌아가기' : '다른 코스 선택'}
          </button>
        </div>
      </div>

      {/* 저장된 코스 사이드바 메뉴 */}
      <SavedCoursesMenu
        isOpen={isSavedCoursesMenuOpen}
        onClose={() => setIsSavedCoursesMenuOpen(false)}
        onCourseSelect={handleSavedCourseSelect}
      />
    </div>
  );
};

export default CourseDetail;
