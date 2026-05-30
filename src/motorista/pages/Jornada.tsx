import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiMotorista from '../api'
import { Clock, Play, Square, ChevronLeft, Loader2, CheckCircle2 } from 'lucide-react'

// Pega a posição atual (best-effort, não trava se o motorista negar GPS).
function pegarGeo(): Promise<{ lat?: number; lng?: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({})
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({}),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  })
}

export default function MotoristaJornada() {
  const navigate = useNavigate()
  const [aberta, setAberta] = useState(false)
  const [loading, setLoading] = useState(true)
  const [acao, setAcao] = useState(false)
  const [erro, setErro] = useState('')
  const [feito, setFeito] = useState('')

  const carregar = async () => {
    try {
      const r = await apiMotorista.get('/motorista-app/me/jornada-aberta')
      setAberta(!!r.data)
    } catch {
      /* silencioso */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const marcar = async (tipo: 'iniciar' | 'encerrar') => {
    setAcao(true)
    setErro('')
    setFeito('')
    try {
      const geo = await pegarGeo()
      await apiMotorista.post(`/motorista-app/jornada/${tipo}`, geo)
      setFeito(tipo === 'iniciar' ? 'Jornada iniciada!' : 'Jornada encerrada!')
      await carregar()
    } catch (e: any) {
      setErro(e?.response?.data?.message || 'Falha ao registrar o ponto')
    } finally {
      setAcao(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/m/veiculo')}
        className="flex items-center gap-1 text-sm text-gray-500 -ml-1 active:opacity-70"
      >
        <ChevronLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="flex items-center gap-2">
        <Clock className="w-6 h-6" style={{ color: '#FFAF06' }} />
        <h1 className="text-xl font-bold text-gray-900">Jornada de trabalho</h1>
      </div>

      {feito && (
        <div
          className="rounded-xl border p-3 flex items-center justify-center gap-2 text-sm font-medium text-green-800"
          style={{ background: '#E8F5E9', borderColor: '#C8E6C9' }}
        >
          <CheckCircle2 className="w-4 h-4" /> {feito}
        </div>
      )}
      {erro && <div className="text-red-600 text-sm text-center">{erro}</div>}

      <div className="pt-6">
        {aberta ? (
          <button
            onClick={() => marcar('encerrar')}
            disabled={acao}
            className="w-full py-8 rounded-3xl font-bold text-white text-xl flex flex-col items-center justify-center gap-3 disabled:opacity-60 active:opacity-80"
            style={{ background: '#C62828' }}
          >
            {acao ? <Loader2 className="w-10 h-10 animate-spin" /> : <Square className="w-10 h-10" />}
            {acao ? 'Registrando…' : 'Encerrar jornada'}
          </button>
        ) : (
          <button
            onClick={() => marcar('iniciar')}
            disabled={acao}
            className="w-full py-8 rounded-3xl font-bold text-gray-900 text-xl flex flex-col items-center justify-center gap-3 disabled:opacity-60 active:opacity-80"
            style={{ background: '#FFAF06' }}
          >
            {acao ? <Loader2 className="w-10 h-10 animate-spin" /> : <Play className="w-10 h-10" />}
            {acao ? 'Registrando…' : 'Iniciar jornada'}
          </button>
        )}
      </div>
    </div>
  )
}
