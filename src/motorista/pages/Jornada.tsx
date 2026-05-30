import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiMotorista from '../api'
import { useAuthMotorista } from '../AuthMotoristaContext'
import { Clock, Play, Square, ChevronLeft, Loader2, CheckCircle2 } from 'lucide-react'

// Mensagens de gratidão/motivacionais exibidas ao encerrar a jornada.
const MENSAGENS_MISSAO: { emoji: string; titulo: string; texto: string }[] = [
  { emoji: '🎯', titulo: 'Missão cumprida!', texto: 'Mais um dia de trabalho bem feito. Obrigado pela sua dedicação e cuidado — é gente como você que move a Alfer.' },
  { emoji: '💪', titulo: 'Dever cumprido!', texto: 'Seu esforço de hoje faz diferença. Descanse, recarregue as energias e volte amanhã com tudo. Valeu demais!' },
  { emoji: '🙏', titulo: 'Gratidão!', texto: 'Obrigado por mais um dia de compromisso e responsabilidade. O time Alfer é mais forte com você por perto.' },
  { emoji: '🏆', titulo: 'Jornada vencida!', texto: 'Você encarou o dia e cumpriu sua parte com excelência. Orgulho de ter você no time. Bom descanso!' },
  { emoji: '⭐', titulo: 'Show de bola!', texto: 'Trabalho honesto e bem feito constrói grandes coisas. Obrigado pela sua entrega de hoje. Até amanhã!' },
  { emoji: '🚀', titulo: 'Missão concluída!', texto: 'Cada jornada sua leva a Alfer mais longe. Obrigado pela parceria e pelo profissionalismo. Descanse merecido!' },
]
function mensagemAleatoria() {
  return MENSAGENS_MISSAO[Math.floor(Math.random() * MENSAGENS_MISSAO.length)]
}
function primeiroNome(nome?: string | null) {
  return (nome || '').trim().split(' ')[0] || ''
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
  const { modo, motorista } = useAuthMotorista()
  const [aberta, setAberta] = useState(false)
  const [loading, setLoading] = useState(true)
  const [acao, setAcao] = useState(false)
  const [erro, setErro] = useState('')
  const [feito, setFeito] = useState('')
  const [missao, setMissao] = useState<typeof MENSAGENS_MISSAO[number] | null>(null)

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
      if (tipo === 'encerrar') {
        setMissao(mensagemAleatoria())
      } else {
        setFeito('Jornada iniciada!')
      }
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

  // Tela de celebração "Missão cumprida" ao encerrar a jornada.
  if (missao) {
    const nome = primeiroNome(motorista?.nome)
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-2">
        <div className="text-7xl mb-5 animate-bounce">{missao.emoji}</div>
        <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#2D7D32' }}>
          Jornada encerrada
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{missao.titulo}</h1>
        {nome && <div className="text-base font-semibold mb-3" style={{ color: '#9a7b1a' }}>Valeu, {nome}!</div>}
        <div
          className="rounded-3xl px-6 py-6 mb-7 max-w-sm"
          style={{ background: '#EAF3DE', border: '1px solid #C8E6C9' }}
        >
          <p className="text-gray-700 text-base leading-relaxed">{missao.texto}</p>
        </div>
        <button
          onClick={() => navigate(modo === 'patio' ? '/m/tarefas' : '/m/veiculo')}
          className="w-full max-w-sm py-3.5 rounded-xl font-semibold text-gray-900 text-base active:opacity-80"
          style={{ background: '#FFAF06' }}
        >
          Até a próxima 👋
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(modo === 'patio' ? '/m/tarefas' : '/m/veiculo')}
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
