import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Contratos from './pages/Contratos'
import ContratoDetalhe from './pages/ContratoDetalhe'
import { Financeiro } from './pages/outros'
import Equipamentos from './pages/Equipamentos'
import EquipamentoDetalhe from './pages/EquipamentoDetalhe'
import Caminhoes from './pages/Caminhoes'
import CaminhaoDetalhe from './pages/CaminhaoDetalhe'
import Cacambas from './pages/Cacambas'
import Agenda from './pages/Agenda'
import Motoristas from './pages/Motoristas'
import NovoCliente from './pages/NovoCliente'
import NovoContrato from './pages/NovoContrato'
import EditarContrato from './pages/EditarContrato'
import NovoEquipamento from './pages/NovoEquipamento'
import NovoCaminhao from './pages/NovoCaminhao'
import NovaLocacaoCacamba from './pages/NovaLocacaoCacamba'

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
        <Route path="clientes/novo" element={<NovoCliente />} />
        <Route path="clientes/:id/editar" element={<NovoCliente />} />
        <Route path="contratos" element={<Contratos />} />
        <Route path="contratos/novo" element={<NovoContrato />} />
        <Route path="contratos/:id/editar" element={<EditarContrato />} />
        <Route path="contratos/:id" element={<ContratoDetalhe />} />
        <Route path="financeiro" element={<Financeiro />} />
        <Route path="equipamentos" element={<Equipamentos />} />
        <Route path="equipamentos/novo" element={<NovoEquipamento />} />
        <Route path="equipamentos/:id/editar" element={<NovoEquipamento />} />
        <Route path="equipamentos/:id" element={<EquipamentoDetalhe />} />
        <Route path="caminhoes" element={<Caminhoes />} />
        <Route path="caminhoes/novo" element={<NovoCaminhao />} />
        <Route path="caminhoes/:id/editar" element={<NovoCaminhao />} />
        <Route path="caminhoes/:id" element={<CaminhaoDetalhe />} />
        <Route path="cacambas" element={<Cacambas />} />
        <Route path="cacambas/nova" element={<NovaLocacaoCacamba />} />
        <Route path="motoristas" element={<Motoristas />} />
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
