import { useState } from 'react'
import { Users, Settings, Loader2 } from 'lucide-react'
import BulkRegistration from './components/BulkRegistration'

function App() {
  const [activeTab, setActiveTab] = useState<'bulk'>('bulk')
  const [isLoading, setIsLoading] = useState(false)

  const tabs = [
    { id: 'bulk' as const, label: 'Registro Masivo', icon: Users },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                Panel de Administración - Préstamos
              </h1>
            </div>
            {isLoading && (
              <div className="flex items-center text-blue-600">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-sm">Procesando...</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'bulk' && (
          <BulkRegistration onLoadingChange={setIsLoading} />
        )}
      </main>
    </div>
  )
}

export default App
