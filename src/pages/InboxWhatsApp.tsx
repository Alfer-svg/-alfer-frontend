import { useEffect, useState } from 'react'
import api from '../services/api'
import { useNavigate } from 'react-router-dom'
import {
  MessageCircle, Send, ArrowDownLeft, ArrowUpRight, AlertCircle, Loader2, X,
  Phone, Eye, CheckCheck, Check, Clock, RefreshCcw, UserPlus, Sparkles, Pencil, Trash2,
} from 'lucide-react'

type Rascunho = {
  id: string
  telefone: string
  personaId: string
  personaNome: string
  textoCliente: string | null
  rascunho: string
  modelo: string | null
  createdAt: string
}

type Mensagem = {
  id: string
  messageId: string
  direcao: 'INBOUND' | 'OUTBOUND'
  telefone: string
  tipo: string
  conteudo: string | null
  optOutDetectado: boolean
  templateName: string | null
  receivedAt: string
}

type Conversa = {
  telefone: string
  mensagens: Mensagem[]
  ultima: string
  inbound: number
  outbound: number
  naoLidas: number
}

type Envio = {
  id: string
  nome: string | null
  telefone: string
  status: 'PENDENTE' | 'ENVIADO' | 'ENTREGUE' | 'LIDO' | 'RESPONDEU' | 'FALHOU' | 'PULADO'
  sentAt: string | null
  deliveredAt: string | null
  readAt: string | null
  respondedAt: string | null
  erro: string | null
  campanha: { nome: string; templateName: string }
  createdAt: string
}

const STATUS_INFO: Record<string, { label: string; color: string; icon: any }> = {
  PENDENTE:  { label: 'Pendente', color: '#888', icon: Clock },
  ENVIADO:   { label: 'Enviado', color: '#1E40AF', icon: Check },
  ENTREGUE:  { label: 'Entregue', color: '#0EA5E9', icon: CheckCheck },
  LIDO:      { label: 'Lido', color: '#10B981', icon: Eye },
  RESPONDEU: { label: 'Respondeu', color: '#FFAF06', icon: MessageCircle },
  FALHOU:    { label: 'Falhou', color: '#DC2626', icon: AlertCircle },
  PULADO:    { label: 'Pulado', color: '#888', icon: X },
}

export default function InboxWhatsApp() {
  const [aba, setAba] = useState<'inbox' | 'envios'>('inbox')
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [envios, setEnvios] = useState<Envio[]>([])
  const [carregando, setCarregando] = useState(true)
  const [conversaSel, setConversaSel] = useState<Conversa | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = async () => {
    setCarregando(true)
    setErro(null)
    try {
      if (aba === 'inbox') {
        const r = await api.get('/whatsapp/inbox')
        setConversas(r.data.conversas || [])
      } else {
        const r = await api.get('/whatsapp/campanhas-envios')
        setEnvios(r.data || [])
      }
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao carregar')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [aba])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageCircle className="w-6 h-6" /> WhatsApp 0800
        </h1>
        <button
          onClick={carregar}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-white"
          style={{ border: '1px solid #E0DDD8' }}
        >
          <RefreshCcw className="w-4 h-4" /> Atualizar
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { key: 'inbox', label: 'Caixa de entrada', icon: ArrowDownLeft },
          { key: 'envios', label: 'Envios de campanhas', icon: Send },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setAba(t.key as any)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{
              background: aba === t.key ? '#1A1C1E' : 'transparent',
              color: aba === t.key ? 'white' : '#555',
            }}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {erro && (
        <div className="p-3 mb-3 rounded-lg flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {erro}
        </div>
      )}

      {carregando ? (
        <div className="text-center py-10 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Carregando...
        </div>
      ) : aba === 'inbox' ? (
        conversas.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma mensagem recebida ainda</p>
            <p className="text-xs mt-1">As mensagens enviadas e recebidas pelo WhatsApp 0800 (Cloud API) aparecem aqui</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {conversas.map((c) => (
              <div
                key={c.telefone}
                onClick={() => {
                  setConversaSel(c)
                  if ((c.naoLidas || 0) > 0) {
                    api.post(`/whatsapp/inbox/${encodeURIComponent(c.telefone)}/marcar-lidas`)
                      .then(() => {
                        setConversas((prev) => prev.map((x) => x.telefone === c.telefone ? { ...x, naoLidas: 0 } : x))
                      })
                      .catch(() => {})
                  }
                }}
                className="bg-white rounded-xl p-3 cursor-pointer hover:shadow-md transition-all"
                style={{ border: (c.naoLidas || 0) > 0 ? '1px solid #25D366' : '1px solid #F1EFE8' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#FEF3E2' }}>
                    <Phone className="w-4 h-4" style={{ color: '#FFAF06' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${(c.naoLidas || 0) > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-900'}`}>{c.telefone}</span>
                      <span className="text-[10px] text-gray-500">
                        {new Date(c.ultima).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={`text-xs truncate mt-0.5 ${(c.naoLidas || 0) > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                      {c.mensagens[0]?.conteudo || `[${c.mensagens[0]?.tipo}]`}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                    {(c.naoLidas || 0) > 0 && (
                      <span
                        className="px-1.5 min-w-[20px] h-[20px] rounded-full text-[10px] font-bold flex items-center justify-center"
                        style={{ background: '#25D366', color: '#FFFFFF' }}
                      >
                        {c.naoLidas > 99 ? '99+' : c.naoLidas}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-500">
                      ↓ {c.inbound} · ↑ {c.outbound}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : envios.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Send className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum envio de campanha ainda</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #F1EFE8' }}>
          {envios.map((e, idx) => {
            const info = STATUS_INFO[e.status] || STATUS_INFO.PENDENTE
            const Icon = info.icon
            return (
              <div
                key={e.id}
                className="p-3 flex items-center gap-3 text-sm"
                style={{ background: idx % 2 === 1 ? '#FBFAF7' : '#fff', borderBottom: '1px solid #F1EFE8' }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: info.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{e.nome || '(sem nome)'}</span>
                    <span className="text-gray-500">{e.telefone}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: info.color + '20', color: info.color }}>
                      {info.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    <strong>{e.campanha?.nome}</strong> · template <code>{e.campanha?.templateName}</code>
                    {e.sentAt && <span> · enviado {new Date(e.sentAt).toLocaleString('pt-BR')}</span>}
                    {e.respondedAt && <span> · respondeu {new Date(e.respondedAt).toLocaleString('pt-BR')}</span>}
                  </div>
                  {e.erro && <div className="text-xs text-red-600 mt-0.5">⚠ {e.erro}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {conversaSel && (
        <ConversaModal
          conversa={conversaSel}
          onClose={() => setConversaSel(null)}
          onMensagemEnviada={(novaMsg) => {
            // Atualiza a conversa local e a lista
            setConversaSel((cur) => cur ? { ...cur, mensagens: [novaMsg, ...cur.mensagens], outbound: cur.outbound + 1, ultima: novaMsg.receivedAt } : cur)
            setConversas((prev) => prev.map((x) => x.telefone === conversaSel.telefone
              ? { ...x, mensagens: [novaMsg, ...x.mensagens], outbound: x.outbound + 1, ultima: novaMsg.receivedAt }
              : x))
          }}
        />
      )}
    </div>
  )
}

function ConversaModal({
  conversa, onClose, onMensagemEnviada,
}: {
  conversa: Conversa
  onClose: () => void
  onMensagemEnviada: (m: Mensagem) => void
}) {
  // Ordena cronologicamente (mais antiga em cima)
  const ordenadas = [...conversa.mensagens].sort(
    (a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
  )

  // Janela 24h: só dá pra enviar texto livre se a última INBOUND foi há menos de 24h
  const ultimaInbound = conversa.mensagens
    .filter((m) => m.direcao === 'INBOUND')
    .reduce((latest, m) => {
      const t = new Date(m.receivedAt).getTime()
      return t > latest ? t : latest
    }, 0)
  const horasDesdeUltimaInbound = ultimaInbound > 0 ? (Date.now() - ultimaInbound) / 3600000 : Infinity
  const janelaAberta = horasDesdeUltimaInbound < 24
  const horasRestantes = janelaAberta ? Math.max(0, 24 - horasDesdeUltimaInbound) : 0

  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState('')
  const [enviandoCrm, setEnviandoCrm] = useState(false)
  const [rascunho, setRascunho] = useState<Rascunho | null>(null)
  const [aprovandoRascunho, setAprovandoRascunho] = useState(false)
  const navigate = useNavigate()

  // Busca rascunho pendente do agente de IA pra esta conversa
  useEffect(() => {
    let vivo = true
    api.get('/agente/rascunhos', { params: { telefone: conversa.telefone } })
      .then((r) => { if (vivo) setRascunho((r.data || [])[0] || null) })
      .catch(() => {})
    return () => { vivo = false }
  }, [conversa.telefone])

  // Aprova o rascunho da IA (texto possivelmente já editado no composer) e envia
  const aprovarRascunho = async () => {
    if (!rascunho || aprovandoRascunho) return
    setAprovandoRascunho(true)
    setErroEnvio('')
    try {
      const textoFinal = texto.trim() || rascunho.rascunho
      const r = await api.post(`/agente/rascunhos/${rascunho.id}/aprovar`, { texto: textoFinal })
      onMensagemEnviada({
        id: r.data.messageId, messageId: r.data.messageId, direcao: 'OUTBOUND',
        telefone: conversa.telefone, tipo: 'text', conteudo: textoFinal,
        optOutDetectado: false, templateName: null, receivedAt: new Date().toISOString(),
      })
      setRascunho(null)
      setTexto('')
    } catch (err: any) {
      setErroEnvio(err.response?.data?.message || 'Falha ao enviar rascunho')
    } finally {
      setAprovandoRascunho(false)
    }
  }

  const editarRascunho = () => {
    if (!rascunho) return
    setTexto(rascunho.rascunho)
    setRascunho(null)
  }

  const descartarRascunho = async () => {
    if (!rascunho) return
    const id = rascunho.id
    setRascunho(null)
    api.post(`/agente/rascunhos/${id}/descartar`).catch(() => {})
  }

  const enviarParaCrm = async () => {
    if (enviandoCrm) return
    setEnviandoCrm(true)
    try {
      const r = await api.post(`/whatsapp/inbox/${encodeURIComponent(conversa.telefone)}/criar-lead`, {})
      const msg = r.data.criado ? 'Lead criado no CRM!' : 'Já estava no CRM — abrindo o lead'
      const aceitouAbrir = confirm(`${msg}\n\nAbrir agora em /leads?`)
      if (aceitouAbrir) navigate('/leads')
    } catch (e: any) {
      alert(e.response?.data?.message || 'Falha ao enviar pro CRM')
    } finally {
      setEnviandoCrm(false)
    }
  }

  const enviar = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!texto.trim() || enviando) return
    setEnviando(true)
    setErroEnvio('')
    try {
      const r = await api.post(`/whatsapp/inbox/${encodeURIComponent(conversa.telefone)}/responder`, { texto: texto.trim() })
      const nova: Mensagem = {
        id: r.data.messageId,
        messageId: r.data.messageId,
        direcao: 'OUTBOUND',
        telefone: conversa.telefone,
        tipo: 'text',
        conteudo: texto.trim(),
        optOutDetectado: false,
        templateName: null,
        receivedAt: new Date().toISOString(),
      }
      onMensagemEnviada(nova)
      setTexto('')
    } catch (err: any) {
      setErroEnvio(err.response?.data?.message || 'Falha ao enviar')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#F1EFE8' }}>
          <div>
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Phone className="w-4 h-4" /> {conversa.telefone}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {conversa.mensagens.length} mensagens · ↓ {conversa.inbound} recebidas · ↑ {conversa.outbound} enviadas
              {janelaAberta && (
                <span className="ml-2 text-green-700">
                  · janela aberta ({horasRestantes < 1 ? `${Math.round(horasRestantes * 60)} min` : `${Math.round(horasRestantes)}h`} restantes)
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={enviarParaCrm}
              disabled={enviandoCrm}
              title="Adicionar este contato como Lead no CRM"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
              style={{ background: '#FFAF06', color: '#1F2937' }}
            >
              {enviandoCrm ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              Enviar pro CRM
            </button>
            <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ background: '#E5DDD5' }}>
          {ordenadas.map((m) => {
            const ehMinha = m.direcao === 'OUTBOUND'
            return (
              <div key={m.id} className={`flex ${ehMinha ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="rounded-lg p-2 max-w-[75%] shadow-sm"
                  style={{ background: ehMinha ? '#DCF8C6' : 'white' }}
                >
                  {m.templateName && (
                    <div className="text-[10px] font-semibold text-blue-600 mb-1">
                      📋 Template: {m.templateName}
                    </div>
                  )}
                  <div className="text-sm text-gray-800 whitespace-pre-wrap">
                    {m.conteudo || `[${m.tipo}]`}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1 text-right">
                    {new Date(m.receivedAt).toLocaleString('pt-BR')}
                  </div>
                  {m.optOutDetectado && (
                    <div className="text-[10px] text-red-600 font-semibold mt-1">
                      ⚠ Opt-out detectado
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Rascunho sugerido pelo agente de IA */}
        {rascunho && janelaAberta && (
          <div className="px-3 pt-3" style={{ background: '#FEF3E2' }}>
            <div className="rounded-xl p-3" style={{ border: '1px solid #FFAF06', background: '#fff' }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3.5 h-3.5" style={{ color: '#FFAF06' }} />
                <span className="text-xs font-semibold text-gray-800">
                  {rascunho.personaNome} sugere uma resposta
                </span>
                <span className="text-[10px] text-gray-400 ml-auto">rascunho · revise antes de enviar</span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">{rascunho.rascunho}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={aprovarRascunho}
                  disabled={aprovandoRascunho}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                  style={{ background: '#25D366' }}
                >
                  {aprovandoRascunho ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Aprovar e enviar
                </button>
                <button
                  onClick={editarRascunho}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700"
                  style={{ background: '#F1EFE8' }}
                >
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </button>
                <button
                  onClick={descartarRascunho}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Descartar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Composer */}
        {janelaAberta ? (
          <form onSubmit={enviar} className="p-3 border-t flex items-end gap-2" style={{ borderColor: '#F1EFE8' }}>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  enviar()
                }
              }}
              rows={1}
              placeholder="Resposta…"
              className="flex-1 px-3 py-2 rounded-xl text-sm outline-none bg-white resize-none max-h-24"
              style={{ border: '1px solid #E0DDD8' }}
              disabled={enviando}
            />
            <button
              type="submit"
              disabled={!texto.trim() || enviando}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-50"
              style={{ background: '#25D366' }}
            >
              {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar
            </button>
            {erroEnvio && (
              <div className="absolute left-4 right-4 bottom-16 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                {erroEnvio}
              </div>
            )}
          </form>
        ) : (
          <div
            className="p-3 border-t text-xs text-amber-900 flex items-start gap-2"
            style={{ borderColor: '#F1EFE8', background: '#FEF8E1' }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Janela de 24h fechada.</strong> Texto livre só funciona dentro de 24h após a última mensagem do cliente.
              Pra retomar o contato, envie um template aprovado pelas Campanhas.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
