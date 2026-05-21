import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="flex min-h-screen" style={{ background: '#F5F0EB' }}>
      <Sidebar />
      <main className="flex-1 ml-60 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
