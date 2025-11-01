import React from 'react';
import { getSavedCourses, removeSavedCourse, type SavedCourse } from '../utils/courseStorage';

interface SavedCoursesMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onCourseSelect: (course: SavedCourse) => void;
}

const SavedCoursesMenu: React.FC<SavedCoursesMenuProps> = ({
  isOpen,
  onClose,
  onCourseSelect
}) => {
  const [savedCourses, setSavedCourses] = React.useState<SavedCourse[]>([]);

  // 컴포넌트가 열릴 때마다 저장된 코스 목록을 새로 가져오기
  React.useEffect(() => {
    if (isOpen) {
      setSavedCourses(getSavedCourses());
    }
  }, [isOpen]);

  const handleDeleteCourse = (courseId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // 코스 선택 이벤트 방지
    
    if (confirm('이 코스를 삭제하시겠습니까?')) {
      try {
        removeSavedCourse(courseId);
        setSavedCourses(getSavedCourses()); // 목록 새로고침
      } catch (error) {
        alert('코스 삭제에 실패했습니다.');
      }
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* 투명한 클릭 영역 (사이드바 외부 클릭 시 닫기용) - 사이드바가 열렸을 때만 표시 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out border-r border-gray-200 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">저장된 코스</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {savedCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <p className="text-center">저장된 코스가 없습니다</p>
              <p className="text-sm text-center mt-1">코스를 저장해보세요!</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {savedCourses.map((course) => (
                <div
                  key={course.courseId}
                  className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200"
                  onClick={() => {
                    onCourseSelect(course);
                    onClose();
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-800">{course.name}</h3>
                        <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          코스 {course.rank}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mb-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">거리:</span>
                          <span className="font-medium text-blue-600">{course.distance}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">평점:</span>
                          <span className="font-medium text-blue-600">{course.scores.overall}/10</span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                        {course.summary}
                      </p>
                      
                      <p className="text-xs text-gray-400">
                        저장일: {formatDate(course.savedAt)}
                      </p>
                    </div>
                    
                    <button
                      onClick={(e) => handleDeleteCourse(course.courseId, e)}
                      className="ml-2 p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      title="코스 삭제"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SavedCoursesMenu;
