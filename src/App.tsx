import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Contratos from './pages/Contratos'
import { Financeiro, Equipamentos, Caminhoes, Cacambas, Agenda } from './pages/outros'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { usuario, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!usuario) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { usuario } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={usuario ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="contratos" element={<Contratos />} />
        <Route path="financeiro" element={<Financeiro />} />
        <Route path="equipamentos" element={<Equipamentos />} />
        <Route path="caminhoes" element={<Caminhoes />} />
        <Route path="cacambas" element={<Cacambas />} />
        <Route path="agenda" element={<Agenda />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
