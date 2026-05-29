import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, X, Volume2, VolumeX } from 'lucide-react'
import api from '../services/api'

type InboxAlertCtx = {
  naoLidas: number
  mudo: boolean
  setMudo: (v: boolean) => void
}

const Ctx = createContext<InboxAlertCtx>({ naoLidas: 0, mudo: false, setMudo: () => {} })
export const useInboxAlert = () => useContext(Ctx)

const POLL_MS = 15000 // 15s
const TITULO_ORIGINAL = typeof document !== 'undefined' ? document.title : 'SIAGO'

// ---- Áudio: chime gerado via Web Audio API (sem precisar de arquivo) ----
let audioCtx: AudioContext | null = null
let audioDesbloqueado = false

function garantirAudioContext() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch {
      audioCtx = null
    }
  }
  return audioCtx
}

function tocarChime() {
  const ctx = garantirAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  const agora = ctx.currentTime
  // "ding-dong" de duas notas, repetido pra ficar mais perceptível
  const notas = [
    { freq: 880, t: 0.0 },   // A5
    { freq: 1175, t: 0.18 }, // D6
    { freq: 880, t: 0.42 },  // A5
    { freq: 1175, t: 0.6 },  // D6
  ]
  for (const n of notas) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = n.freq
    const inicio = agora + n.t
    gain.gain.setValueAtTime(0.0001, inicio)
    gain.gain.exponentialRampToValueAtTime(0.35, inicio + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.16)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(inicio)
    osc.stop(inicio + 0.18)
  }
}

export function InboxAlertProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const [naoLidas, setNaoLidas] = useState(0)
  const [mudo, setMudoState] = useState<boolean>(() => localStorage.getItem('inbox_alerta_mudo') === '1')
  const [toast, setToast] = useState<{ qtd: number } | null>(null)

  const baselineRef = useRef<number | null>(null)
  const naoLidasRef = useRef(0)
  const mudoRef = useRef(mudo)
  const flashTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const setMudo = useCallback((v: boolean) => {
    setMudoState(v)
    mudoRef.current = v
    localStorage.setItem('inbox_alerta_mudo', v ? '1' : '0')
  }, [])

  // Desbloqueia o áudio no primeiro gesto do usuário (política de autoplay dos navegadores)
  useEffect(() => {
    const desbloquear = () => {
      if (audioDesbloqueado) return
      const ctx = garantirAudioContext()
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {})
      audioDesbloqueado = true
    }
    window.addEventListener('pointerdown', desbloquear)
    window.addEventListener('keydown', desbloquear)
    return () => {
      window.removeEventListener('pointerdown', desbloquear)
      window.removeEventListener('keydown', desbloquear)
    }
  }, [])

  // Pede permissão de notificação do navegador (uma vez)
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [])

  // Título piscando enquanto houver não lidas
  const pararFlashTitulo = useCallback(() => {
    if (flashTimerRef.current) {
      clearInterval(flashTimerRef.current)
      flashTimerRef.current = null
    }
    document.title = TITULO_ORIGINAL
  }, [])

  const iniciarFlashTitulo = useCallback((qtd: number) => {
    if (flashTimerRef.current) clearInterval(flashTimerRef.current)
    let liga = false
    flashTimerRef.current = setInterval(() => {
      liga = !liga
      const n = naoLidasRef.current
      if (n <= 0) {
        pararFlashTitulo()
        return
      }
      document.title = liga ? `🔔 (${n}) Nova mensagem!` : TITULO_ORIGINAL
    }, 1000)
    // dispara imediato
    document.title = `🔔 (${qtd}) Nova mensagem!`
  }, [pararFlashTitulo])

  const dispararAlerta = useCallback((qtdTotal: number, delta: number) => {
    // Som
    if (!mudoRef.current) {
      tocarChime()
      // repete o chime depois de 1,2s pra ficar mais robusto
      setTimeout(() => { if (!mudoRef.current) tocarChime() }, 1200)
    }
    // Toast visual
    setToast({ qtd: qtdTotal })
    // Título piscando
    iniciarFlashTitulo(qtdTotal)
    // Notificação do navegador (funciona mesmo com a aba em segundo plano)
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const n = new Notification('📲 Nova mensagem no WhatsApp 0800', {
          body: delta > 1 ? `${delta} novas mensagens recebidas` : 'Você recebeu uma nova mensagem de um cliente',
          tag: 'inbox-whatsapp',
          renotify: true,
        } as any)
        n.onclick = () => {
          window.focus()
          navigate('/inbox-whatsapp')
          n.close()
        }
      } catch {
        // ignore
      }
    }
  }, [iniciarFlashTitulo, navigate])

  // Polling do contador de não lidas
  useEffect(() => {
    let stop = false
    const fetchCount = () => {
      api.get('/whatsapp/inbox/nao-lidas-count')
        .then((r) => {
          if (stop) return
          const novo = r.data?.count || 0
          const anterior = baselineRef.current
          setNaoLidas(novo)
          naoLidasRef.current = novo

          if (anterior === null) {
            // primeira leitura: define baseline, não alerta pelo que já existia
            baselineRef.current = novo
            if (novo > 0) iniciarFlashTitulo(novo)
            return
          }
          if (novo > anterior) {
            dispararAlerta(novo, novo - anterior)
          } else if (novo === 0) {
            pararFlashTitulo()
            setToast(null)
          }
          baselineRef.current = novo
        })
        .catch(() => {})
    }
    fetchCount()
    const tick = setInterval(fetchCount, POLL_MS)
    const onVis = () => { if (document.visibilityState === 'visible') fetchCount() }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      stop = true
      clearInterval(tick)
      document.removeEventListener('visibilitychange', onVis)
      pararFlashTitulo()
    }
  }, [dispararAlerta, iniciarFlashTitulo, pararFlashTitulo])

  const abrirInbox = () => {
    setToast(null)
    navigate('/inbox-whatsapp')
  }

  return (
    <Ctx.Provider value={{ naoLidas, mudo, setMudo }}>
      {children}

      {/* Toast de alerta — canto superior direito */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-[100] w-[330px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl overflow-hidden animate-[pulseAlerta_1.4s_ease-in-out_infinite]"
          style={{ background: '#FFFFFF', border: '2px solid #25D366' }}
          role="alert"
        >
          <div className="flex items-stretch">
            <div className="flex items-center justify-center px-4" style={{ background: '#25D366' }}>
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="font-bold text-gray-900 text-sm">
                  {toast.qtd > 1 ? `${toast.qtd} mensagens não lidas` : 'Nova mensagem recebida'}
                </div>
                <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600 -mt-0.5">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">WhatsApp 0800 · um cliente está te chamando</p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={abrirInbox}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                  style={{ background: '#25D366' }}
                >
                  Abrir inbox
                </button>
                <button
                  onClick={() => setMudo(!mudo)}
                  title={mudo ? 'Reativar som' : 'Silenciar som'}
                  className="px-2 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 flex items-center gap-1"
                >
                  {mudo ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  {mudo ? 'Mudo' : 'Som'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}
