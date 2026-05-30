import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthMotorista } from '../AuthMotoristaContext'
import apiMotorista from '../api'
import { HardHat, ChevronDown } from 'lucide-react'
import AlferLogo from '../../components/AlferLogo'

interface MotoristaItem {
  id: string
  nome: string
  matricula: string
}

export default function MotoristaLogin() {
  const { login } = useAuthMotorista()
  const navigate = useNavigate()
  const [motoristas, setMotoristas] = useState<MotoristaItem[]>([])
  const [matriculaSel, setMatriculaSel] = useState('')
  const [pin, setPin] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [carregandoLista, setCarregandoLista] = useState(true)

  useEffect(() => {
    apiMotorista.get('/auth/motorista/lista')
      .then((r) => setMotoristas(r.data || []))
      .catch(() => setErro('Falha ao carregar lista de motoristas'))
      .finally(() => setCarregandoLista(false))
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!matriculaSel || !pin) {
      setErro('Selecione um motorista e informe o PIN')
      return
    }
    setLoading(true)
    try {
      await login(matriculaSel, pin.trim())
      // Index do /m redireciona pro home certo conforme o modo (campo→veículo, pátio→tarefas).
      navigate('/m')
    } catch (e: any) {
      setErro(e?.response?.data?.message || 'Falha no login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#FAF9F6]">
      <form onSubmit={submit} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex mb-4">
            <AlferLogo size={120} />
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
            <HardHat className="w-4 h-4" />
            <span>App do Colaborador</span>
          </div>
        </div>

        <label className="block text-xs font-medium text-gray-600 mb-1">Funcionário</label>
        <div className="relative mb-4">
          <select
            value={matriculaSel}
            onChange={(e) => setMatriculaSel(e.target.value)}
            disabled={carregandoLista}
            className="w-full px-4 py-3 pr-10 bg-white rounded-xl text-base outline-none appearance-none disabled:opacity-60"
            style={{ border: '1px solid #E0DDD8' }}
          >
            <option value="">
              {carregandoLista ? 'Carregando…' : 'Selecione seu nome'}
            </option>
            {motoristas.map((m) => (
              <option key={m.id} value={m.matricula}>
                {m.nome}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        <label className="block text-xs font-medium text-gray-600 mb-1">PIN</label>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          placeholder="••••"
          className="w-full px-4 py-3 bg-white rounded-xl text-2xl text-center tracking-widest outline-none mb-4"
          style={{ border: '1px solid #E0DDD8' }}
        />

        {erro && (
          <div className="text-red-600 text-sm mb-4 text-center">{erro}</div>
        )}

        <button
          type="submit"
          disabled={loading || !matriculaSel}
          className="w-full py-3.5 rounded-xl font-semibold text-gray-900 text-base disabled:opacity-50 active:opacity-80"
          style={{ background: '#FFAF06' }}
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>

        <p className="text-xs text-gray-400 text-center mt-6">
          Se esqueceu o PIN, fale com o gestor.
        </p>
      </form>
    </div>
  )
}
