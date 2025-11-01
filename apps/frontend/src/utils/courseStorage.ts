// 코스 저장 및 관리를 위한 유틸리티 함수들

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
}

const STORAGE_KEY = 'saved-courses';

// 코스 저장하기
export const saveCourse = (course: Omit<SavedCourse, 'savedAt'>, userPosition: { latitude: number; longitude: number }): void => {
  try {
    const savedCourses = getSavedCourses();
    
    // 이미 저장된 코스인지 확인 (courseId로 중복 체크)
    const isDuplicate = savedCourses.some(saved => saved.courseId === course.courseId);
    
    if (isDuplicate) {
      throw new Error('이미 저장된 코스입니다.');
    }
    
    const newSavedCourse: SavedCourse = {
      ...course,
      userPosition,
      savedAt: new Date().toISOString(),
    };
    
    savedCourses.push(newSavedCourse);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedCourses));
  } catch (error) {
    console.error('코스 저장 오류:', error);
    throw error;
  }
};

// 저장된 코스 목록 가져오기
export const getSavedCourses = (): SavedCourse[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('저장된 코스 조회 오류:', error);
    return [];
  }
};

// 특정 코스 삭제하기
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

// 모든 저장된 코스 삭제하기
export const clearAllSavedCourses = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('저장된 코스 전체 삭제 오류:', error);
    throw error;
  }
};

// 코스가 이미 저장되어 있는지 확인
export const isCourseAlreadySaved = (courseId: number): boolean => {
  try {
    const savedCourses = getSavedCourses();
    return savedCourses.some(course => course.courseId === courseId);
  } catch (error) {
    console.error('저장된 코스 확인 오류:', error);
    return false;
  }
};
