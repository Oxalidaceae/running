import { useState, useEffect } from 'react'
import './index.css'
import { useGeolocation } from './hooks/useGeolocation'
import MapComponent from './components/MapComponent'
import CourseRecommendation from './components/CourseRecommendation'
import CourseDetail from './components/CourseDetail'
import SavedCoursesMenu from './components/SavedCoursesMenu'
import type { SavedCourse } from './utils/courseStorage'

type AppScreen = 'main' | 'course-recommendation' | 'course-detail';

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
  waypoints: { latitude: number; longitude: number }[];
}

export default function App() {
  const [distance, setDistance] = useState<string>('')
  const { position, error, loading } = useGeolocation()
  const [isGeneratingCourse, setIsGeneratingCourse] = useState(false)
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('main')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedCourseUserPosition, setSelectedCourseUserPosition] = useState<{ latitude: number; longitude: number } | null>(null)
  const [isFromSavedCourse, setIsFromSavedCourse] = useState<boolean>(false)
  const [courses, setCourses] = useState<Course[]>([]) // 코스 데이터를 App에서 관리
  const [address, setAddress] = useState<string>('')
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)
  const [isSavedCoursesMenuOpen, setIsSavedCoursesMenuOpen] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [timeoutCount, setTimeoutCount] = useState(0)
  const [locationRetryCount, setLocationRetryCount] = useState(0)

  // 위치를 주소로 변환하는 함수
  const fetchAddress = async (lat: number, lng: number) => {
    try {
      setIsLoadingAddress(true);
      const response = await fetch(`http://localhost:3000/api/reverse-geocode?lat=${lat}&lng=${lng}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.address) {
          // 도로명 주소가 있으면 우선 사용, 없으면 지번 주소 사용
          const displayAddress = data.address.road_address?.address_name || data.address.address_name;
          setAddress(displayAddress);
        } else {
          setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
      } else {
        // API 호출 실패시 좌표 표시
        setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    } catch (error) {
      console.error('주소 변환 오류:', error);
      // 오류 발생시 좌표 표시
      setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // 위치가 변경되면 주소 조회
  useEffect(() => {
    if (position && currentScreen === 'main') {
      fetchAddress(position.latitude, position.longitude);
      // 위치 획득 성공 시 재시도 카운터 초기화
      setLocationRetryCount(0);
    }
  }, [position, currentScreen]);

  // 위치 정보 오류 시 자동 재시도
  useEffect(() => {
    if (error && !loading && locationRetryCount < 5) {
      const timer = setTimeout(() => {
        console.log(`🔄 위치 정보 자동 재시도 ${locationRetryCount + 1}/5`);
        setLocationRetryCount(prev => prev + 1);
        window.location.reload();
      }, 5000); // 5초 후 재시도

      return () => clearTimeout(timer);
    }
  }, [error, loading, locationRetryCount]);

  const handleCourseGeneration = async () => {
    if (!position || !distance) return

    setIsGeneratingCourse(true)

    try {
      console.log('🏃 코스 생성 요청 중...');

      // AbortController를 사용하여 타임아웃 구현
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 9900); // 9초 타임아웃

      const response = await fetch('http://localhost:3000/api/courses/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: position.latitude,
          longitude: position.longitude,
          distance: parseFloat(distance),
        }),
        signal: controller.signal, // AbortController 신호 연결
      });

      clearTimeout(timeoutId); // 성공 시 타임아웃 제거

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCourses(data.courses);
          console.log('✅ 코스 생성 완료:', data.courses.length + '개');
          setCurrentScreen('course-recommendation');
          // 성공 시 카운터 초기화
          setRetryCount(0);
          setTimeoutCount(0);
        } else {
          alert(data.message || '코스 데이터를 가져올 수 없습니다.');
        }
      } else {
        // 서버에서 상세한 에러 메시지 제공 시 활용
        try {
          const errorData = await response.json();
          alert(errorData.message || '서버에서 코스 데이터를 가져오는데 실패했습니다.');
        } catch {
          alert('서버에서 코스 데이터를 가져오는데 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('코스 데이터 로딩 오류:', error);
      
      // 타임아웃으로 인한 요청 취소인지 확인
      if (error instanceof Error && error.name === 'AbortError') {
        const newTimeoutCount = timeoutCount + 1;
        setTimeoutCount(newTimeoutCount);
        
        const retry = confirm(
          `코스 생성 시간이 초과했습니다.\n` +
          '서버가 많은 요청을 처리중일 수 있습니다.\n\n' +
          '다시 시도하시겠습니까?'
        );
        
        if (retry) {
          const newRetryCount = retryCount + 1;
          setRetryCount(newRetryCount);
          
          // 항상 일정한 대기시간 (1초) 유지
          setTimeout(() => {
            handleCourseGeneration();
          }, 1000);
        } else {
          // 사용자가 재시도를 원하지 않으면 카운터 초기화
          setRetryCount(0);
          setTimeoutCount(0);
        }
      } else {
        alert('네트워크 오류가 발생했습니다.');
        setRetryCount(0);
        setTimeoutCount(0);
      }
    } finally {
      setIsGeneratingCourse(false);
    }
  }

  const handleBackToMain = () => {
    setCurrentScreen('main')
    setCourses([]) // 메인으로 돌아갈 때 코스 데이터 초기화
  }

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course)
    setSelectedCourseUserPosition(position) // 현재 위치 사용
    setIsFromSavedCourse(false) // 새로 생성된 코스
    setCurrentScreen('course-detail')
  }

  const handleBackToCourseList = () => {
    if (isFromSavedCourse) {
      // 저장된 코스에서 온 경우 메인으로 돌아가기
      setCurrentScreen('main')
      setCourses([]) // 코스 데이터 초기화
    } else {
      // 새로 생성된 코스에서 온 경우 코스 목록으로 돌아가기
      setCurrentScreen('course-recommendation')
    }
  }

  const handleSavedCourseSelect = (savedCourse: SavedCourse) => {
    // SavedCourse를 Course 타입으로 변환
    const course: Course = {
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

    setSelectedCourse(course);
    setSelectedCourseUserPosition(savedCourse.userPosition); // 저장된 사용자 위치 사용
    setIsFromSavedCourse(true); // 저장된 코스에서 온 것임을 표시
    setCurrentScreen('course-detail');
  }



  // 코스 상세 화면 렌더링
  if (currentScreen === 'course-detail' && selectedCourse && selectedCourseUserPosition) {
    return (
      <CourseDetail
        course={selectedCourse}
        userPosition={selectedCourseUserPosition}
        onBack={handleBackToCourseList}
        isFromSavedCourse={isFromSavedCourse}
      />
    );
  }

  // 코스 추천 화면 렌더링
  if (currentScreen === 'course-recommendation' && position) {
    return (
      <CourseRecommendation
        distance={distance}
        position={position}
        courses={courses} // 미리 가져온 코스 데이터 전달
        onBack={handleBackToMain}
        onCourseSelect={handleCourseSelect}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-4">
          {/* 햄버거 메뉴 버튼 */}
          <button
            onClick={() => setIsSavedCoursesMenuOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* 앱 제목 */}
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-semibold text-gray-800">오어달</h1>
            <span className="text-2xl">🏃‍♂️</span>
          </div>

          {/* 빈 공간 (레이아웃 균형용) */}
          <div className="w-10"></div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Map Area */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden h-80">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className="text-gray-600">지도 로딩 중...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p className="text-red-500 mb-2">⚠️ 지도를 불러올 수 없습니다</p>
                <p className="text-sm mb-4">{error}</p>
                {locationRetryCount < 5 ? (
                  <p className="text-xs text-blue-500 mb-2">
                    5초 후 자동으로 다시 시도합니다... ({locationRetryCount + 1}/5)
                  </p>
                ) : null}
                <button
                  onClick={() => {
                    console.log('🔄 위치 정보 재시도 요청');
                    setLocationRetryCount(0);
                    window.location.reload();
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  다시 시도
                </button>
              </div>
            </div>
          ) : position ? (
            <MapComponent position={position} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p className="mb-2">� 위치 정보를 가져오는 중...</p>
                <p className="text-sm">잠시만 기다려주세요</p>
              </div>
            </div>
          )}
        </div>

        {/* Current Location */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-medium text-gray-800">현재 위치</span>
            </div>
            {error && (
              <button
                onClick={() => {
                  console.log('🔄 위치 정보 재시도 요청');
                  window.location.reload();
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
              >
                재시도
              </button>
            )}
          </div>
          <p className="text-blue-600 text-sm">
            {loading ? (
              <span className="text-gray-500">위치 정보를 가져오는 중...</span>
            ) : error ? (
              <span className="text-red-500">{error}</span>
            ) : position ? (
              isLoadingAddress ? (
                <span className="text-gray-500">주소 조회 중...</span>
              ) : (
                address || `${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)}`
              )
            ) : (
              <span className="text-gray-500">위치 정보 없음</span>
            )}
          </p>
        </div>

        {/* Distance Input */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center space-x-3">
            <input
              type="number"
              placeholder="거리를 입력하세요"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              min="0.1"
              max="50"
              step="0.1"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-gray-500 font-medium">km</span>
          </div>
        </div>

        {/* Generate Course Button */}
        <button
          onClick={handleCourseGeneration}
          disabled={!position || !distance || parseFloat(distance) <= 0 || isGeneratingCourse}
          className="w-full bg-blue-600 text-white font-semibold py-4 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
        >
          {isGeneratingCourse ? (
            <div className="flex flex-col items-center justify-center space-y-1">
              <div className="flex items-center space-x-2">
                <span>코스 생성 중</span>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              </div>
              {retryCount > 0 && (
                <span className="text-xs opacity-80">
                  재시도 중
                </span>
              )}
            </div>
          ) : (
            '코스 추천'
          )}
        </button>
      </div>

      {/* 저장된 코스 사이드바 메뉴 */}
      <SavedCoursesMenu
        isOpen={isSavedCoursesMenuOpen}
        onClose={() => setIsSavedCoursesMenuOpen(false)}
        onCourseSelect={handleSavedCourseSelect}
      />
    </div>
  )
}
