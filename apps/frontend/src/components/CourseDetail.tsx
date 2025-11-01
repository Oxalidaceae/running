import React, { useState, useEffect } from 'react';
import type { Position } from '../types';
import { saveCourse, removeSavedCourse, removeSavedCourseByHash, getSavedCourses } from '../utils/courseStorage';

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
  isFromSavedCourse?: boolean; // 저장된 코스에서 온 것인지 구분
}

const CourseDetail: React.FC<CourseDetailProps> = ({
  course,
  userPosition,
  onBack,
  isFromSavedCourse = false
}) => {
  // 저장 관련 상태
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [customCourseName, setCustomCourseName] = useState('');
  
  // 주소 관련 상태
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [addresses, setAddresses] = useState({
    start: `${userPosition.latitude.toFixed(4)}, ${userPosition.longitude.toFixed(4)}`,
    waypoint: course.waypoints.length > 0 
      ? `${course.waypoints[0].latitude.toFixed(4)}, ${course.waypoints[0].longitude.toFixed(4)}`
      : '',
    end: `${userPosition.latitude.toFixed(4)}, ${userPosition.longitude.toFixed(4)}`
  });

  // 컴포넌트 마운트 시 주소 조회
  useEffect(() => {
    const fetchAddresses = async () => {
      setIsLoadingAddresses(true);
      try {
        // 출발지 주소 조회
        const startResponse = await fetch(
          `/api/reverse-geocode?lat=${userPosition.latitude}&lng=${userPosition.longitude}`
        );
        
        let startAddress = `${userPosition.latitude.toFixed(4)}, ${userPosition.longitude.toFixed(4)}`;
        if (startResponse.ok) {
          const startData = await startResponse.json();
          if (startData.success && startData.address) {
            startAddress = startData.address.road_address?.address_name || startData.address.address_name;
          }
        }

        // 경유지 주소 조회
        let waypointAddress = '';
        if (course.waypoints.length > 0) {
          const waypointResponse = await fetch(
            `/api/reverse-geocode?lat=${course.waypoints[0].latitude}&lng=${course.waypoints[0].longitude}`
          );
          
          waypointAddress = `${course.waypoints[0].latitude.toFixed(4)}, ${course.waypoints[0].longitude.toFixed(4)}`;
          if (waypointResponse.ok) {
            const waypointData = await waypointResponse.json();
            if (waypointData.success && waypointData.address) {
              waypointAddress = waypointData.address.road_address?.address_name || waypointData.address.address_name;
            }
          }
        }

        setAddresses({
          start: startAddress,
          waypoint: waypointAddress,
          end: startAddress // 도착점은 출발점과 동일
        });
      } catch (error) {
        console.error('주소 조회 오류:', error);
      } finally {
        setIsLoadingAddresses(false);
      }
    };

    fetchAddresses();
  }, [userPosition, course.waypoints]);

  // Tmap HTML URL 생성
  const getTmapUrl = () => {
    if (course.waypoints.length === 0) return '';
    
    const params = new URLSearchParams({
      origin: `${userPosition.latitude},${userPosition.longitude}`,
      waypoint: `${course.waypoints[0].latitude},${course.waypoints[0].longitude}`,
    });
    
    return `/tmap.html?${params.toString()}`;
  };

  // 카카오맵 경로 링크 생성 함수
  const generateKakaoMapUrl = () => {
    // 출발점 (현재 위치) - 주소에서 간단한 이름 추출
    const startName = addresses.start || '출발점';
    const start = `${encodeURIComponent(startName)},${userPosition.latitude},${userPosition.longitude}`;

    // 경유지 (1개)
    let waypoint = '';
    if (course.waypoints.length > 0) {
      const waypointName = addresses.waypoint || '경유지';
      waypoint = `${encodeURIComponent(waypointName)},${course.waypoints[0].latitude},${course.waypoints[0].longitude}`;
    }

    // 도착점 (출발점으로 복귀 - 원형 코스)
    const endName = addresses.end || '도착점';
    const end = `${encodeURIComponent(endName)},${userPosition.latitude},${userPosition.longitude}`;

    // 전체 경로 조합
    const fullPath = waypoint ? `${start}/${waypoint}/${end}` : `${start}/${end}`;

    return `https://map.kakao.com/link/by/walk/${fullPath}`;
  };

  // 저장 모달 열기
  const handleSaveCourse = async () => {
    if (isSaved || isSaving) return;
    
    // 기본 이름을 현재 코스 이름 + 날짜로 설정
    const defaultName = `${course.name} (${new Date().toLocaleDateString()})`;
    setCustomCourseName(defaultName);
    setShowSaveModal(true);
  };

  // 실제 코스 저장 함수
  const handleConfirmSave = async () => {
    const finalName = customCourseName.trim() || course.name;
    
    setIsSaving(true);
    setShowSaveModal(false);
    
    try {
      const courseToSave = {
        ...course,
        userPosition
      };
      await saveCourse(courseToSave, userPosition, finalName);
      setIsSaved(true);
      alert('코스가 저장되었습니다!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '코스 저장에 실패했습니다.';
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // 저장된 코스 삭제 함수
  const handleDeleteSavedCourse = async () => {
    if (confirm(`"${course.name}" 코스를 삭제하시겠습니까?`)) {
      try {
        // 저장된 코스들 중에서 현재 코스와 일치하는 것을 찾아 해시로 삭제
        const savedCourses = getSavedCourses();
        const savedCourse = savedCourses.find(saved => 
          saved.courseId === course.courseId && 
          saved.userPosition.latitude === userPosition.latitude &&
          saved.userPosition.longitude === userPosition.longitude
        );
        
        if (savedCourse && savedCourse.courseHash) {
          removeSavedCourseByHash(savedCourse.courseHash);
        } else {
          // fallback으로 courseId 사용
          removeSavedCourse(course.courseId);
        }
        
        setIsSaved(false);
        alert('코스가 삭제되었습니다.');
        onBack(); // 메인으로 돌아가기
      } catch (error) {
        console.error('코스 삭제 오류:', error);
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
          <h1 className="text-xl font-semibold text-gray-800">코스 상세</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Tmap with Route */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden h-80">
          <div className="relative h-full">
            {course.waypoints.length > 0 ? (
              <iframe
                src={getTmapUrl()}
                className="w-full h-full border-0"
                title="Tmap 경로"
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50">
                <p className="text-gray-500">경유지 정보가 없습니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* Course Info */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-700 mb-2">🚩 코스 정보</h4>
            <span className="bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full">{course.name}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">거리:</span>
              <span className="font-semibold text-blue-600">{course.distance}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">예상 시간:</span>
              <span className="font-semibold text-gray-800">{course.estimatedTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">평점:</span>
              <span className="font-semibold text-blue-600">{course.scores.overall}/10</span>
            </div>
          </div>

          {/* 고도 분석 정보 */}
          <div className="border-t pt-3 mt-3">
            <h4 className="font-medium text-gray-700 mb-2">🏔️ 고도 분석</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">총 상승:</span>
                <span className="font-semibold text-red-500">{course.elevationAnalysis.totalAscent.toFixed(2)}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">총 하강:</span>
                <span className="font-semibold text-blue-500">{course.elevationAnalysis.totalDescent.toFixed(2)}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">평균 고도 변화:</span>
                <span className="font-semibold text-gray-800">{course.elevationAnalysis.averageChange.toFixed(2)}m</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg mt-3">
            <p className="text-sm text-gray-700">{course.summary}</p>
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
              <span>저장 삭제</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
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
                  <span>저장 완료</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </>
              ) : (
                <>
                  <span>코스 저장하기</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
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

      {/* 코스 이름 입력 모달 */}
      {showSaveModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center" 
          style={{ 
            backgroundColor: 'transparent',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            touchAction: 'none'
          }}
          onClick={() => {
            setShowSaveModal(false);
            setCustomCourseName('');
          }}
        >
          <div 
            className="bg-white rounded-lg p-6 w-80 mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">코스 이름 설정</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                코스 이름
              </label>
              <input
                type="text"
                value={customCourseName}
                onChange={(e) => setCustomCourseName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="코스 이름을 입력해주세요"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">
                최대 50자까지 입력 가능합니다.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setCustomCourseName('');
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={!customCourseName.trim()}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  customCourseName.trim()
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
