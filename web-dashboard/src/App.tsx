import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import BusDashboard from './pages/BusDashboard'
import EmployeeManagement from './pages/EmployeeManagement'
import Uploads from './pages/Uploads'
import { Toaster } from 'react-hot-toast'
import { LayoutDashboard, Users, Bus, Menu, X, Calendar, UploadCloud } from 'lucide-react'

type PageKey = 'dashboard' | 'employees' | 'uploads'

const tabs: { id: PageKey; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'employees', label: 'Employees', icon: <Users className="w-4 h-4" /> },
  { id: 'uploads', label: 'Uploads', icon: <UploadCloud className="w-4 h-4" /> },
]

function App() {
  const [page, setPage] = useState<PageKey>('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), [])

  const renderPage = () => {
    switch (page) {
      case 'employees':
        return <EmployeeManagement />
      case 'uploads':
        return <Uploads />
      default:
        return <BusDashboard />
    }
  }

  const handleTabClick = (id: PageKey) => {
    setPage(id)
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen font-sans text-gray-900">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#1f2937',
            padding: '16px 20px',
            borderRadius: '16px',
            border: '1px solid rgba(16, 185, 129, 0.1)',
            boxShadow: '0 20px 40px -10px rgba(16, 185, 129, 0.15)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />

      {/* Natural Green Navigation */}
      <nav className="sticky top-0 z-50 glass-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex flex-col justify-center">
                <h1 className="text-lg font-bold leading-tight flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
                    <Bus className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-gradient font-extrabold">Bus Dashboard</span>
                </h1>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex md:items-center md:space-x-6">
              <div className="flex bg-emerald-50/80 rounded-2xl p-1.5 gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 flex items-center gap-2 ${page === tab.id
                      ? 'bg-white text-emerald-600 shadow-md shadow-emerald-100/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                      }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 pl-6 border-l border-emerald-200">
                <div className="p-2 rounded-lg bg-emerald-50">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Today</p>
                  <p className="text-sm font-bold text-gray-900">{today}</p>
                </div>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all active:scale-95"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
        >
          <div className="bg-white/95 backdrop-blur-xl border-t border-emerald-100">
            <div className="px-4 pt-4 pb-5 space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all active:scale-[0.98] ${page === tab.id
                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-600'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  <span className={`p-2.5 rounded-xl ${page === tab.id ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-emerald-100 flex items-center gap-3 bg-emerald-50/30">
              <div className="p-2 rounded-lg bg-emerald-100">
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500">Today</div>
                <div className="text-base font-bold text-gray-900">{today}</div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {renderPage()}
      </main>

      <footer className="bg-white/60 backdrop-blur-sm border-t border-emerald-100/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <p className="text-center text-sm text-gray-500">
            Bus Passenger Counting & Optimization System — Internal Use Only
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
