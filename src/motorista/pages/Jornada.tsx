import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiMotorista from '../api'
import { Clock, Play, Square, MapPin, ChevronLeft, Loader2 } from 'lucide-react'

interface Jornada {
  id: string
  dtInicio: string
  inicioEndereco: string | null
  dtFim: string | null
  fimEndereco: string | null
}

const fmtHora = (s: string) =>
  new Date(s).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
const fmtData = (s: string) =>
  new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

// Diferença em "Xh Ymin" entre dois instantes.
function duracao(ini: string, fim: string) {
  const ms = new Date(fim).getTime() - new Date(ini).getTime()
  const min = Math.max(0, Math.round(ms / 60000))
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}

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
  const [aberta, setAberta] = useState<Jornada | null>(null)
  const [recentes, setRecentes] = useState<Jornada[]>([])
  const [loading, setLoading] = useState(true)
  const [acao, setAcao] = useState(false)
  const [erro, setErro] = useState('')
  const [agora, setAgora] = useState(Date.now())

  const carregar = async () => {
    try {
      const [ab, hist] = await Promise.all([
        apiMotorista.get('/motorista-app/me/jornada-aberta'),
        apiMotorista.get('/motorista-app/me/jornadas'),
      ])
      setAberta(ab.data || null)
      setRecentes(hist.data || [])
    } catch {
      /* silencioso */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  // Tick pra atualizar o cronômetro da jornada em andamento.
  useEffect(() => {
    if (!aberta) return
    const t = setInterval(() => setAgora(Date.now()), 30000)
    return () => clearInterval(t)
  }, [aberta])

  const marcar = async (tipo: 'iniciar' | 'encerrar') => {
    setAcao(true)
    setErro('')
    try {
      const geo = await pegarGeo()
      await apiMotorista.post(`/motorista-app/jornada/${tipo}`, geo)
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
    <div className="space-y-5">
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

      {/* Status atual */}
      {aberta ? (
        <div className="rounded-2xl border p-5" style={{ background: '#E8F5E9', borderColor: '#C8E6C9' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-600" />
            </span>
            <span className="font-semibold text-green-900 text-sm">Jornada em andamento</span>
          </div>
          <div className="text-sm text-green-800">
            Iniciada às <strong>{fmtHora(aberta.dtInicio)}</strong> · há {duracao(aberta.dtInicio, new Date(agora).toISOString())}
          </div>
          {aberta.inicioEndereco && (
            <div className="flex items-start gap-1.5 text-xs text-green-700 mt-2">
              <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{aberta.inicioEndereco}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border p-5 text-center" style={{ borderColor: '#E0DDD8', background: '#fff' }}>
          <div className="text-sm text-gray-500">Você não tem jornada aberta. Bata o ponto pra começar.</div>
        </div>
      )}

      {erro && <div className="text-red-600 text-sm text-center">{erro}</div>}

      {/* Botão de ponto */}
      {aberta ? (
        <button
          onClick={() => marcar('encerrar')}
          disabled={acao}
          className="w-full py-5 rounded-2xl font-bold text-white text-lg flex items-center justify-center gap-2 disabled:opacity-60 active:opacity-80"
          style={{ background: '#C62828' }}
        >
          {acao ? <Loader2 className="w-6 h-6 animate-spin" /> : <Square className="w-6 h-6" />}
          {acao ? 'Registrando…' : 'Encerrar jornada'}
        </button>
      ) : (
        <button
          onClick={() => marcar('iniciar')}
          disabled={acao}
          className="w-full py-5 rounded-2xl font-bold text-gray-900 text-lg flex items-center justify-center gap-2 disabled:opacity-60 active:opacity-80"
          style={{ background: '#FFAF06' }}
        >
          {acao ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6" />}
          {acao ? 'Registrando…' : 'Iniciar jornada'}
        </button>
      )}
      <p className="text-xs text-gray-400 text-center -mt-2">
        Registramos a hora e o local da marcação.
      </p>

      {/* Histórico */}
      {recentes.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
            Últimas jornadas
          </div>
          {recentes.map((j) => (
            <div key={j.id} className="bg-white rounded-xl border p-3.5" style={{ borderColor: '#E0DDD8' }}>
              <div className="flex items-center justify-between">
                <div className="font-semibold text-gray-900 text-sm">{fmtData(j.dtInicio)}</div>
                <div className="text-xs text-gray-500">
                  {fmtHora(j.dtInicio)} {j.dtFim ? `– ${fmtHora(j.dtFim)}` : '· em aberto'}
                </div>
              </div>
              {j.dtFim && (
                <div className="text-xs text-gray-400 mt-0.5">
                  Total: {duracao(j.dtInicio, j.dtFim)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
