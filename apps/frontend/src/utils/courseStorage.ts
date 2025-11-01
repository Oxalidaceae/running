// 코스 저장 및 관리를 위한 유틸리티 함수들

// 간단한 해시 함수 (문자열을 숫자 해시로 변환)
const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit 정수로 변환
  }
  return Math.abs(hash);
};

// 코스의 고유 해시 생성 (사용자 위치, 거리, 첫 경유지를 조합)
const generateCourseHash = (
  userPosition: { latitude: number; longitude: number },
  distance: string,
  waypoints: { latitude: number; longitude: number }[]
): string => {
  // 사용자 위치를 소수점 3자리로 반올림 (약 100m 정확도)
  const userLat = Math.round(userPosition.latitude * 1000) / 1000;
  const userLng = Math.round(userPosition.longitude * 1000) / 1000;
  
  // 첫 번째 경유지 (있는 경우)
  let waypointStr = '';
  if (waypoints.length > 0) {
    const wpLat = Math.round(waypoints[0].latitude * 1000) / 1000;
    const wpLng = Math.round(waypoints[0].longitude * 1000) / 1000;
    waypointStr = `${wpLat},${wpLng}`;
  }
  
  // 해시 생성을 위한 문자열 조합
  const hashString = `${userLat},${userLng}|${distance}|${waypointStr}`;
  return simpleHash(hashString).toString();
};

export interface SavedCourse {
  courseId: number;
  rank: number;
  summary: string;
  reason: string;
  elevationAnalysis: {
    averageChange: number;
    totalAscent: number;
    totalDescent: number;
  };
  scores: {
    elevation: number;
    overall: number;
  };
  name: string;
  distance: string;
  estimatedTime: string;
  waypoints: { latitude: number; longitude: number }[];
  savedAt: string; // 저장된 시간
  userPosition: { latitude: number; longitude: number }; // 사용자 위치도 함께 저장
  courseHash: string; // 코스 고유 해시
}

const STORAGE_KEY = 'saved-courses';

// 코스 저장하기
export const saveCourse = (
  course: Omit<SavedCourse, 'savedAt' | 'courseHash'>, 
  userPosition: { latitude: number; longitude: number },
  customName?: string
): void => {
  try {
    const savedCourses = getSavedCourses();
    
    // 코스 해시 생성
    const courseHash = generateCourseHash(userPosition, course.distance, course.waypoints);
    
    // 이미 저장된 코스인지 확인 (해시로 중복 체크)
    const isDuplicate = savedCourses.some(saved => saved.courseHash === courseHash);
    
    if (isDuplicate) {
      throw new Error('이미 저장된 코스입니다.');
    }
    
    const newSavedCourse: SavedCourse = {
      ...course,
      name: customName || course.name, // 사용자 정의 이름이 있으면 사용, 없으면 기본 이름
      userPosition,
      courseHash,
      savedAt: new Date().toISOString(),
    };
    
    savedCourses.push(newSavedCourse);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedCourses));
  } catch (error) {
    console.error('코스 저장 오류:', error);
    throw error;
  }
};

// 저장된 코스 목록 가져오기 (기존 코스들의 해시를 자동 생성)
export const getSavedCourses = (): SavedCourse[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    
    const courses = JSON.parse(saved);
    let needsUpdate = false;
    
    // 기존 코스들에 courseHash가 없으면 자동 생성
    const updatedCourses = courses.map((course: any) => {
      if (!course.courseHash) {
        course.courseHash = generateCourseHash(
          course.userPosition, 
          course.distance, 
          course.waypoints
        );
        needsUpdate = true;
      }
      return course;
    });
    
    // 업데이트가 필요하면 localStorage에 저장
    if (needsUpdate) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCourses));
    }
    
    return updatedCourses;
  } catch (error) {
    console.error('저장된 코스 조회 오류:', error);
    return [];
  }
};

// 특정 코스 삭제하기 (courseId 기반)
export const removeSavedCourse = (courseId: number): void => {
  try {
    const savedCourses = getSavedCourses();
    const filteredCourses = savedCourses.filter(course => course.courseId !== courseId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredCourses));
  } catch (error) {
    console.error('코스 삭제 오류:', error);
    throw error;
  }
};

// 특정 코스 삭제하기 (해시 기반)
export const removeSavedCourseByHash = (courseHash: string): void => {
  try {
    const savedCourses = getSavedCourses();
    const filteredCourses = savedCourses.filter(course => course.courseHash !== courseHash);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredCourses));
  } catch (error) {
    console.error('코스 삭제 오류:', error);
    throw error;
  }
};

// 모든 저장된 코스 삭제하기
export const clearAllSavedCourses = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('저장된 코스 전체 삭제 오류:', error);
    throw error;
  }
};

// 코스가 이미 저장되어 있는지 확인 (해시 기반)
export const isCourseAlreadySaved = (
  userPosition: { latitude: number; longitude: number },
  distance: string,
  waypoints: { latitude: number; longitude: number }[]
): boolean => {
  try {
    const savedCourses = getSavedCourses();
    const courseHash = generateCourseHash(userPosition, distance, waypoints);
    return savedCourses.some(course => course.courseHash === courseHash);
  } catch (error) {
    console.error('저장된 코스 확인 오류:', error);
    return false;
  }
};

// 기존 함수와의 호환성을 위한 courseId 기반 확인 (deprecated)
export const isCourseAlreadySavedById = (courseId: number): boolean => {
  try {
    const savedCourses = getSavedCourses();
    return savedCourses.some(course => course.courseId === courseId);
  } catch (error) {
    console.error('저장된 코스 확인 오류:', error);
    return false;
  }
};
