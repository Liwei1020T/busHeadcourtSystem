import { useMemo, useState } from 'react'
import BusDashboard from './pages/BusDashboard'
import EmployeeManagement from './pages/EmployeeManagement'
import BusManagement from './pages/BusManagement'
import VanManagement from './pages/VanManagement'

type PageKey = 'dashboard' | 'employees' | 'buses' | 'vans'

const tabs: { id: PageKey; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'employees', label: 'Employees' },
  { id: 'buses', label: 'Buses' },
  { id: 'vans', label: 'Vans' },
]

function App() {
  const [page, setPage] = useState<PageKey>('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  const renderPage = () => {
    switch (page) {
      case 'employees':
        return <EmployeeManagement />
      case 'buses':
        return <BusManagement />
      case 'vans':
        return <VanManagement />
      default:
        return <BusDashboard />
    }
  }

  const handleTabClick = (id: PageKey) => {
    setPage(id)
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex flex-col justify-center">
                <h1 className="text-lg font-bold text-gray-900 leading-tight">Bus Dashboard</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Factory Bus Optimization System</p>
              </div>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      page === tab.id
                        ? 'bg-white shadow text-primary-700'
                        : 'text-gray-600 hover:text-primary-700 hover:bg-gray-200/50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="text-right pl-4 border-l border-gray-200">
                <p className="text-xs text-gray-500">Today</p>
                <p className="text-sm font-semibold text-gray-900">{today}</p>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                    page === tab.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="pt-4 pb-4 border-t border-gray-200">
              <div className="px-4 flex items-center">
                <div>
                  <div className="text-base font-medium text-gray-800">Today</div>
                  <div className="text-sm font-medium text-gray-500">{today}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderPage()}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Bus Passenger Counting & Optimization System - Internal Use Only
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
