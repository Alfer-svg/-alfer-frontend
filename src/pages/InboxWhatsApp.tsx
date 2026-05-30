import { useEffect, useState } from 'react'
import api from '../services/api'
import { useNavigate } from 'react-router-dom'
import {
  MessageCircle, Send, ArrowDownLeft, ArrowUpRight, AlertCircle, Loader2, X,
  Phone, Eye, CheckCheck, Check, Clock, RefreshCcw, UserPlus, Sparkles, Pencil, Trash2, Instagram, Search,
} from 'lucide-react'

// Cor/ícone do canal pra diferenciar visualmente WhatsApp x Instagram.
const CANAL_INFO: Record<string, { label: string; cor: string; bg: string; icon: any }> = {
  WHATSAPP:  { label: 'WhatsApp', cor: '#25D366', bg: '#E8F8EE', icon: Phone },
  INSTAGRAM: { label: 'Instagram', cor: '#C13584', bg: '#FCE7F3', icon: Instagram },
}
const canalInfo = (canal?: string) => CANAL_INFO[canal || 'WHATSAPP'] || CANAL_INFO.WHATSAPP

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
  canal?: 'WHATSAPP' | 'INSTAGRAM'
  nomeContato?: string | null
  mensagens: Mensagem[]
  ultima: string
  inbound: number
  outbound: number
  naoLidas: number
}

// Rótulo legível pra cada conversa: no Instagram mostra @/nome (o IGSID não diz
// nada pra um humano); no WhatsApp mostra o telefone.
function rotuloConversa(c: { canal?: string; nomeContato?: string | null; telefone: string }) {
  if (c.canal === 'INSTAGRAM') {
    const h = c.nomeContato
    return h ? (h.startsWith('@') ? h : `@${h}`) : `Instagram ${c.telefone.slice(-6)}`
  }
  return c.telefone
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
  const [autoWa, setAutoWa] = useState(false)
  const [autoIg, setAutoIg] = useState(false)
  const [salvandoAuto, setSalvandoAuto] = useState<'WHATSAPP' | 'INSTAGRAM' | null>(null)
  const [descobrindoIg, setDescobrindoIg] = useState(false)

  const descobrirInstagram = async () => {
    setDescobrindoIg(true)
    try {
      const r = await api.get('/whatsapp/instagram/descobrir')
      const d = r.data || {}
      const linhas: string[] = []
      linhas.push(d.recomendacao || 'Sem recomendação.')
      if (Array.isArray(d.contasInstagram) && d.contasInstagram.length) {
        linhas.push('')
        linhas.push('Contas Instagram encontradas:')
        d.contasInstagram.forEach((c: any) => {
          linhas.push(`• @${c.usuario} → INSTAGRAM_ACCOUNT_ID = ${c.INSTAGRAM_ACCOUNT_ID}`)
        })
      }
      if (Array.isArray(d.paginas) && d.paginas.length) {
        linhas.push('')
        linhas.push(`Páginas administradas pelo token: ${d.paginas.map((p: any) => p.pagina).join(', ')}`)
      }
      alert(linhas.join('\n'))
    } catch (e: any) {
      alert('Erro ao descobrir: ' + (e.response?.data?.message || e.message))
    } finally {
      setDescobrindoIg(false)
    }
  }

  const carregarConfig = async () => {
    try {
      const r = await api.get('/agente/config')
      setAutoWa(!!r.data?.autonomoWhatsapp)
      setAutoIg(!!r.data?.autonomoInstagram)
    } catch { /* silencioso */ }
  }

  useEffect(() => { carregarConfig() }, [])

  const toggleAuto = async (canal: 'WHATSAPP' | 'INSTAGRAM') => {
    const atual = canal === 'WHATSAPP' ? autoWa : autoIg
    const novo = !atual
    setSalvandoAuto(canal)
    // Otimista
    if (canal === 'WHATSAPP') setAutoWa(novo); else setAutoIg(novo)
    try {
      const body = canal === 'WHATSAPP' ? { autonomoWhatsapp: novo } : { autonomoInstagram: novo }
      const r = await api.post('/agente/config', body)
      setAutoWa(!!r.data?.autonomoWhatsapp)
      setAutoIg(!!r.data?.autonomoInstagram)
    } catch {
      // Reverte em caso de erro
      if (canal === 'WHATSAPP') setAutoWa(atual); else setAutoIg(atual)
      alert('Não consegui salvar o modo autônomo. Tenta de novo.')
    } finally {
      setSalvandoAuto(null)
    }
  }

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

  // Exclui a conversa inteira de um telefone (só do nosso banco).
  const excluirConversa = async (telefone: string) => {
    if (!confirm(`Excluir toda a conversa com ${telefone}?\n\nIsso remove as mensagens só daqui do sistema — não apaga no WhatsApp do cliente.`)) return
    try {
      await api.delete(`/whatsapp/inbox/${encodeURIComponent(telefone)}`)
      setConversas((prev) => prev.filter((x) => x.telefone !== telefone))
      if (conversaSel?.telefone === telefone) setConversaSel(null)
    } catch (e: any) {
      alert(e.response?.data?.message || 'Falha ao excluir conversa')
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageCircle className="w-6 h-6" /> Inbox
          <span className="inline-flex items-center gap-1 text-gray-400">
            <Phone className="w-4 h-4" style={{ color: '#25D366' }} />
            <Instagram className="w-4 h-4" style={{ color: '#C13584' }} />
          </span>
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

      {/* Modo autônomo da IA: quando ligado, o agente responde sozinho (sem aprovação humana). */}
      <div className="mb-4 p-3 rounded-xl flex flex-wrap items-center gap-x-5 gap-y-2" style={{ background: '#FEF3E2', border: '1px solid #FBE2B6' }}>
        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
          <Sparkles className="w-4 h-4" style={{ color: '#FFAF06' }} /> IA responde sozinha
        </div>
        {([
          { canal: 'WHATSAPP' as const, label: 'WhatsApp', cor: '#25D366', on: autoWa, Icon: Phone },
          { canal: 'INSTAGRAM' as const, label: 'Instagram', cor: '#C13584', on: autoIg, Icon: Instagram },
        ]).map(({ canal, label, cor, on, Icon }) => (
          <button
            key={canal}
            onClick={() => toggleAuto(canal)}
            disabled={salvandoAuto === canal}
            className="inline-flex items-center gap-2 text-sm disabled:opacity-50"
            title={on ? `IA respondendo sozinha no ${label}` : `Ligar resposta autônoma no ${label}`}
          >
            <Icon className="w-4 h-4" style={{ color: cor }} />
            <span className="text-gray-700">{label}</span>
            <span
              className="relative inline-block w-9 h-5 rounded-full transition-colors"
              style={{ background: on ? cor : '#D1CFC9' }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                style={{ transform: on ? 'translateX(16px)' : 'translateX(0)' }}
              />
            </span>
          </button>
        ))}
        <button
          onClick={descobrirInstagram}
          disabled={descobrindoIg}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white disabled:opacity-50 ml-auto"
          style={{ border: '1px solid #E0DDD8' }}
          title="Descobre a conta Instagram vinculada e o ID pra configurar"
        >
          {descobrindoIg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" style={{ color: '#C13584' }} />}
          Descobrir conta IG
        </button>
        <span className="text-xs text-gray-500 basis-full">
          Ligado: a IA envia a resposta direto pro cliente. Desligado: gera rascunho pra você aprovar.
        </span>
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
          <div className="flex flex-col gap-2">
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
                  {(() => { const ci = canalInfo(c.canal); const Icon = ci.icon; return (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: ci.bg }} title={ci.label}>
                    <Icon className="w-4 h-4" style={{ color: ci.cor }} />
                  </div>
                  ) })()}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${(c.naoLidas || 0) > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-900'}`}>{rotuloConversa(c)}</span>
                      {c.canal === 'INSTAGRAM' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: '#FCE7F3', color: '#C13584' }}>Instagram</span>
                      )}
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
                  <button
                    onClick={(e) => { e.stopPropagation(); excluirConversa(c.telefone) }}
                    title="Excluir conversa"
                    className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
          onExcluirConversa={() => excluirConversa(conversaSel.telefone)}
          onMensagemExcluida={(id) => {
            // Remove a mensagem da conversa aberta e da lista; se zerar, fecha o modal.
            setConversaSel((cur) => {
              if (!cur) return cur
              const restantes = cur.mensagens.filter((m) => m.id !== id)
              if (restantes.length === 0) return null
              return { ...cur, mensagens: restantes }
            })
            setConversas((prev) => prev
              .map((x) => x.telefone === conversaSel.telefone
                ? { ...x, mensagens: x.mensagens.filter((m) => m.id !== id) }
                : x)
              .filter((x) => x.mensagens.length > 0))
          }}
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
  conversa, onClose, onMensagemEnviada, onMensagemExcluida, onExcluirConversa,
}: {
  conversa: Conversa
  onClose: () => void
  onMensagemEnviada: (m: Mensagem) => void
  onMensagemExcluida: (id: string) => void
  onExcluirConversa: () => void
}) {
  const [excluindoId, setExcluindoId] = useState<string | null>(null)

  // Exclui UMA mensagem (só do nosso banco).
  const excluirMensagem = async (id: string) => {
    if (excluindoId) return
    if (!confirm('Excluir esta mensagem?\n\nRemove só daqui do sistema — não apaga no WhatsApp do cliente.')) return
    setExcluindoId(id)
    try {
      await api.delete(`/whatsapp/inbox/mensagem/${id}`)
      onMensagemExcluida(id)
    } catch (e: any) {
      alert(e.response?.data?.message || 'Falha ao excluir mensagem')
    } finally {
      setExcluindoId(null)
    }
  }
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
  const [rascunhoTexto, setRascunhoTexto] = useState('')
  const [aprovandoRascunho, setAprovandoRascunho] = useState(false)
  const navigate = useNavigate()

  // Busca rascunho pendente do agente de IA pra esta conversa
  useEffect(() => {
    let vivo = true
    api.get('/agente/rascunhos', { params: { telefone: conversa.telefone } })
      .then((r) => {
        if (!vivo) return
        const rasc = (r.data || [])[0] || null
        setRascunho(rasc)
        setRascunhoTexto(rasc?.rascunho || '')
      })
      .catch(() => {})
    return () => { vivo = false }
  }, [conversa.telefone])

  // Aprova o rascunho da IA (texto editável direto no card) e envia
  const aprovarRascunho = async () => {
    if (!rascunho || aprovandoRascunho) return
    const textoFinal = rascunhoTexto.trim()
    if (!textoFinal) return
    setAprovandoRascunho(true)
    setErroEnvio('')
    try {
      const r = await api.post(`/agente/rascunhos/${rascunho.id}/aprovar`, { texto: textoFinal })
      onMensagemEnviada({
        id: r.data.messageId, messageId: r.data.messageId, direcao: 'OUTBOUND',
        telefone: conversa.telefone, tipo: 'text', conteudo: textoFinal,
        optOutDetectado: false, templateName: null, receivedAt: new Date().toISOString(),
      })
      setRascunho(null)
      setRascunhoTexto('')
    } catch (err: any) {
      setErroEnvio(err.response?.data?.message || 'Falha ao enviar rascunho')
    } finally {
      setAprovandoRascunho(false)
    }
  }

  const descartarRascunho = async () => {
    if (!rascunho) return
    const id = rascunho.id
    setRascunho(null)
    setRascunhoTexto('')
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
              {(() => { const ci = canalInfo(conversa.canal); const Icon = ci.icon; return <Icon className="w-4 h-4" style={{ color: ci.cor }} /> })()}
              {rotuloConversa(conversa)}
              {conversa.canal === 'INSTAGRAM' && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: '#FCE7F3', color: '#C13584' }}>Instagram</span>
              )}
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
            <button
              onClick={onExcluirConversa}
              title="Excluir conversa inteira"
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ background: '#E5DDD5' }}>
          {ordenadas.map((m) => {
            const ehMinha = m.direcao === 'OUTBOUND'
            return (
              <div key={m.id} className={`group flex items-center gap-1.5 ${ehMinha ? 'justify-end' : 'justify-start'}`}>
                {ehMinha && (
                  <button
                    onClick={() => excluirMensagem(m.id)}
                    disabled={excluindoId === m.id}
                    title="Excluir mensagem"
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-600 transition-all disabled:opacity-50"
                  >
                    {excluindoId === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                )}
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
                {!ehMinha && (
                  <button
                    onClick={() => excluirMensagem(m.id)}
                    disabled={excluindoId === m.id}
                    title="Excluir mensagem"
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-600 transition-all disabled:opacity-50"
                  >
                    {excluindoId === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Rascunho sugerido pelo agente de IA — editável direto no card */}
        {rascunho && janelaAberta && (
          <div className="px-3 pt-3" style={{ background: '#FEF3E2' }}>
            <div className="rounded-xl p-3" style={{ border: '1px solid #FFAF06', background: '#fff' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5" style={{ color: '#FFAF06' }} />
                <span className="text-xs font-semibold text-gray-800">
                  {rascunho.personaNome} sugere — revise e edite à vontade
                </span>
                <Pencil className="w-3 h-3 text-gray-400 ml-auto" />
              </div>
              <textarea
                value={rascunhoTexto}
                onChange={(e) => setRascunhoTexto(e.target.value)}
                rows={Math.min(12, Math.max(4, rascunhoTexto.split('\n').length + 1))}
                placeholder="Resposta sugerida…"
                className="w-full px-3 py-2 rounded-lg text-sm text-gray-800 outline-none resize-y leading-relaxed"
                style={{ border: '1px solid #E0DDD8', background: '#FFFDF8', minHeight: '96px' }}
                disabled={aprovandoRascunho}
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={aprovarRascunho}
                  disabled={aprovandoRascunho || !rascunhoTexto.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: '#25D366' }}
                >
                  {aprovandoRascunho ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Enviar resposta
                </button>
                <button
                  onClick={descartarRascunho}
                  disabled={aprovandoRascunho}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100"
                >
                  <Trash2 className="w-4 h-4" /> Descartar
                </button>
                <span className="text-[11px] text-gray-400 ml-auto">{rascunhoTexto.length} caracteres</span>
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
