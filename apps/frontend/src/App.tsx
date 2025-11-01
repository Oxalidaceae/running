// export default App
import { useState } from 'react'
import './index.css'
import { useGeolocation } from './hooks/useGeolocation'

export default function App() {
  const [count, setCount] = useState(0)
  const { position, error, loading, method } = useGeolocation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            🏃‍♂️ Running App
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Geolocation Test Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            📍 위치 정보 테스트
          </h2>
          
          {loading && (
            <div className="flex items-center gap-3 text-blue-600">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>위치 정보를 가져오는 중...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-red-500 text-xl">⚠️</span>
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">오류 발생</h3>
                  <p className="text-red-600 text-sm">{error}</p>
                  <p className="text-red-500 text-xs mt-2">
                    💡 백엔드 서버가 실행 중이고 .env.local에 API 키가 설정되어 있는지 확인하세요.
                  </p>
                </div>
              </div>
            </div>
          )}

          {position && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✅</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-800 mb-1">
                    위치 정보 조회 성공! 
                    {method === 'gps' && ' (GPS 사용)'}
                    {method === 'google-api' && ' (Google API 사용)'}
                  </h3>
                  {method === 'gps' && (
                    <p className="text-green-600 text-xs mb-3">
                      🎯 기기의 GPS를 사용하여 정확한 위치를 가져왔습니다.
                    </p>
                  )}
                  {method === 'google-api' && (
                    <p className="text-green-600 text-xs mb-3">
                      📡 GPS를 사용할 수 없어 Google API로 위치를 추정했습니다. (IP 기반, 정확도 낮음)
                    </p>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 w-20">위도:</span>
                      <code className="bg-white px-3 py-1 rounded text-sm text-gray-800 border">
                        {position.latitude.toFixed(6)}
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 w-20">경도:</span>
                      <code className="bg-white px-3 py-1 rounded text-sm text-gray-800 border">
                        {position.longitude.toFixed(6)}
                      </code>
                    </div>
                    {position.accuracy && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 w-20">정확도:</span>
                        <code className="bg-white px-3 py-1 rounded text-sm text-gray-800 border">
                          {position.accuracy.toFixed(2)}m
                        </code>
                      </div>
                    )}
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${position.latitude},${position.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <span>🗺️</span>
                    Google Maps에서 보기
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hero Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Tailwind CSS가 적용되었습니다! 🎉
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            이 페이지는 Tailwind CSS의 다양한 유틸리티 클래스를 사용하여 만들어졌습니다.
          </p>
          
          {/* Counter */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCount(count + 1)}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg 
                       hover:bg-blue-700 active:bg-blue-800 transition-colors
                       shadow-md hover:shadow-lg"
            >
              클릭 횟수: {count}
            </button>
            <button
              onClick={() => setCount(0)}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg 
                       hover:bg-gray-300 active:bg-gray-400 transition-colors"
            >
              초기화
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">스타일링</h3>
            <p className="text-gray-600">
              Tailwind CSS로 빠르고 쉽게 스타일을 적용할 수 있습니다.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">빠른 개발</h3>
            <p className="text-gray-600">
              유틸리티 클래스로 개발 속도가 크게 향상됩니다.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">반응형</h3>
            <p className="text-gray-600">
              모바일, 태블릿, 데스크톱 모두 지원합니다.
            </p>
          </div>
        </div>

        {/* Color Palette Demo */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">색상 팔레트</h3>
          <div className="flex flex-wrap gap-4">
            <div className="w-20 h-20 bg-red-500 rounded-lg shadow-md"></div>
            <div className="w-20 h-20 bg-blue-500 rounded-lg shadow-md"></div>
            <div className="w-20 h-20 bg-green-500 rounded-lg shadow-md"></div>
            <div className="w-20 h-20 bg-yellow-500 rounded-lg shadow-md"></div>
            <div className="w-20 h-20 bg-purple-500 rounded-lg shadow-md"></div>
            <div className="w-20 h-20 bg-pink-500 rounded-lg shadow-md"></div>
            <div className="w-20 h-20 bg-indigo-500 rounded-lg shadow-md"></div>
          </div>
        </div>
      </main>
    </div>
  )
}
