import { useState, useEffect } from 'react'
import './index.css'
import { useGeolocation } from './hooks/useGeolocation'
import MapComponent from './components/MapComponent'
import CourseRecommendation from './components/CourseRecommendation'
import CourseDetail from './components/CourseDetail'

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
  const [courses, setCourses] = useState<Course[]>([]) // 코스 데이터를 App에서 관리
  const [address, setAddress] = useState<string>('')
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)
  const [locationRetryKey, setLocationRetryKey] = useState(0) // 위치 재시도를 위한 키

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
    }
  }, [position, currentScreen]);

  const handleCourseGeneration = async () => {
    if (!position || !distance) return
    
    setIsGeneratingCourse(true)
    
    try {
      console.log('🏃 코스 생성 요청 중...');
      
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
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCourses(data.courses);
          console.log('✅ 코스 생성 완료:', data.courses.length + '개');
          setCurrentScreen('course-recommendation');
        } else {
          alert(data.message || '코스 데이터를 가져올 수 없습니다.');
        }
      } else {
        alert('서버에서 코스 데이터를 가져오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('코스 데이터 로딩 오류:', error);
      alert('네트워크 오류가 발생했습니다.');
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
    setCurrentScreen('course-detail')
  }

  const handleBackToCourseList = () => {
    setCurrentScreen('course-recommendation')
  }

  // 코스 상세 화면 렌더링
  if (currentScreen === 'course-detail' && position && selectedCourse) {
    return (
      <CourseDetail
        course={selectedCourse}
        userPosition={position}
        onBack={handleBackToCourseList}
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
        <div className="flex items-center justify-center px-4 py-4">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-semibold text-gray-800">오어달</h1>
            <span className="text-2xl">🏃‍♂️</span>
          </div>
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
                <button
                  onClick={() => {
                    console.log('🔄 위치 정보 재시도 요청');
                    setLocationRetryKey(prev => prev + 1);
                    window.location.reload(); // 간단한 재시도 방법
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
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>코스 생성 중...</span>
            </div>
          ) : (
            '코스 추천'
          )}
        </button>
      </div>
    </div>
  )
}
