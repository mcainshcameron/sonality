import { NavLink, Outlet } from 'react-router-dom'

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-900'
}

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
        <h1 className="text-lg font-bold text-gray-900">Sonality</h1>
        <nav className="flex gap-4 text-sm" aria-label="Main navigation">
          <NavLink to="/" end className={navClass}>
            People
          </NavLink>
          <NavLink to="/settings" className={navClass}>
            Settings
          </NavLink>
        </nav>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}
