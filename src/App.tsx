// export default App
import { useState } from 'react'
import './index.css'

export default function App() {
  const [count, setCount] = useState(0)

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
