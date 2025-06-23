import { useState } from 'react'
import { Settings, Loader2 } from 'lucide-react'
import BulkRegistration from './components/BulkRegistration'

function App() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                Panel de Administración
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BulkRegistration onLoadingChange={setIsLoading} />
      </main>
    </div>
  )
}

export default App
