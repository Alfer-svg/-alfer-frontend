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
import Modelos from './pages/Modelos'
import NovoModelo from './pages/NovoModelo'
import NovoCliente from './pages/NovoCliente'
import NovoContrato from './pages/NovoContrato'
import EditarContrato from './pages/EditarContrato'
import Orcamentos from './pages/Orcamentos'
import NovoOrcamento from './pages/NovoOrcamento'
import OrcamentoDetalhe from './pages/OrcamentoDetalhe'
import CondicoesOrcamento from './pages/CondicoesOrcamento'
import Logistica from './pages/Logistica'
import Pedidos from './pages/Pedidos'
import PedidoDetalhe from './pages/PedidoDetalhe'
import Mapa from './pages/Mapa'
import NovoEquipamento from './pages/NovoEquipamento'
import NovoCaminhao from './pages/NovoCaminhao'
import NovaLocacaoCacamba from './pages/NovaLocacaoCacamba'
import Locacoes from './pages/Locacoes'
import OrdensServicoMunck from './pages/OrdensServicoMunck'
import OrdemServicoMunckDetalhe from './pages/OrdemServicoMunckDetalhe'

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
        <Route path="orcamentos" element={<Orcamentos />} />
        <Route path="orcamentos/novo" element={<NovoOrcamento />} />
        <Route path="orcamentos/:id/editar" element={<NovoOrcamento />} />
        <Route path="orcamentos/:id" element={<OrcamentoDetalhe />} />
        <Route path="condicoes-orcamento" element={<CondicoesOrcamento />} />
        <Route path="logistica" element={<Logistica />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="pedidos/:id" element={<PedidoDetalhe />} />
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
        <Route path="locacoes" element={<Locacoes />} />
        <Route path="ordens-servico/munck" element={<OrdensServicoMunck />} />
        <Route path="ordens-servico/munck/nova" element={<OrdemServicoMunckDetalhe />} />
        <Route path="ordens-servico/munck/:id" element={<OrdemServicoMunckDetalhe />} />
        <Route path="motoristas" element={<Motoristas />} />
        <Route path="modelos" element={<Modelos />} />
        <Route path="modelos/novo" element={<NovoModelo />} />
        <Route path="modelos/:id/editar" element={<NovoModelo />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="mapa" element={<Mapa />} />
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
