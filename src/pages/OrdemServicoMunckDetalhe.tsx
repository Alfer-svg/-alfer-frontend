import { useEffect, useState, FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import SignaturePad from '../components/SignaturePad'
import {
  ChevronLeft, ClipboardList, Save, CheckCircle2, Trash2, Loader2, AlertCircle,
  Building2, MapPin, Wrench, Package, Truck, ListChecks, Clock, MessageSquare, FileDown,
} from 'lucide-react'

const SERVICOS = [
  { value: 'ICAMENTO', label: 'Içamento' },
  { value: 'CARGA_DESCARGA', label: 'Carga / Descarga' },
  { value: 'TRANSPORTE', label: 'Transporte' },
  { value: 'MOVIMENTACAO', label: 'Movimentação' },
  { value: 'INSTALACAO', label: 'Instalação' },
  { value: 'OUTROS', label: 'Outros' },
]

const CHECKLIST_ITEMS = [
  { key: 'chkSoloAdequado', label: 'Solo adequado' },
  { key: 'chkAreaIsolada', label: 'Área isolada' },
  { key: 'chkAcessoLiberado', label: 'Acesso liberado' },
  { key: 'chkRedeEletrica', label: 'Rede elétrica verificada' },
  { key: 'chkPatolamentoSeguro', label: 'Patolamento seguro' },
  { key: 'chkClientePresente', label: 'Cliente presente' },
]

const fmtDateTime = (d?: string) => (d ? new Date(d).toLocaleString('pt-BR') : '—')

export default function OrdemServicoMunckDetalhe() {
  const { id } = useParams<{ id: string }>()
  const isNova = id === 'nova'
  const navigate = useNavigate()
  const [search] = useSearchParams()
  const contratoIdParam = search.get('contratoId')

  const [os, setOs] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [clientes, setClientes] = useState<any[]>([])
  const [caminhoes, setCaminhoes] = useState<any[]>([])
  const [motoristas, setMotoristas] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      api.get('/clientes'),
      api.get('/caminhoes'),
      api.get('/motoristas'),
    ])
      .then(([c, k, m]) => {
        setClientes(c.data)
        setCaminhoes(k.data)
        setMotoristas(m.data)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (isNova) {
      // criar uma OS imediatamente (pré-preenchida se houver contratoId)
      const payload: any = {}
      if (contratoIdParam) payload.contratoId = contratoIdParam
      api
        .post('/ordens-servico/munck', payload)
        .then((r) => {
          setOs(r.data)
          navigate(`/ordens-servico/munck/${r.data.id}`, { replace: true })
        })
        .catch((e) => setErro(e.response?.data?.message || 'Erro ao criar OS'))
        .finally(() => setLoading(false))
      return
    }
    api
      .get(`/ordens-servico/munck/${id}`)
      .then((r) => setOs(r.data))
      .catch((e) => setErro(e.response?.data?.message || 'Erro ao carregar OS'))
      .finally(() => setLoading(false))
  }, [id])

  const setCampo = (campo: string, valor: any) => setOs((o: any) => ({ ...o, [campo]: valor }))

  const toggleServico = (s: string) => {
    setOs((o: any) => {
      const atuais: string[] = o.servicoTipos || []
      const novo = atuais.includes(s) ? atuais.filter((x) => x !== s) : [...atuais, s]
      return { ...o, servicoTipos: novo }
    })
  }

  const salvar = async (e?: FormEvent, status?: string) => {
    e?.preventDefault()
    if (!os) return
    setSalvando(true)
    setErro('')
    try {
      const payload = { ...os, ...(status ? { status } : {}) }
      const r = await api.put(`/ordens-servico/munck/${os.id}`, payload)
      setOs(r.data)
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao salvar OS')
    } finally {
      setSalvando(false)
    }
  }

  const concluir = async () => {
    if (!confirm('Concluir esta OS? Cliente e operador devem ter assinado.')) return
    await salvar(undefined, 'CONCLUIDA')
  }

  const excluir = async () => {
    if (!confirm('Excluir esta OS? Não dá pra desfazer.')) return
    try {
      await api.delete(`/ordens-servico/munck/${os.id}`)
      navigate('/ordens-servico/munck')
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao excluir')
    }
  }

  if (loading || !os) {
    return (
      <div className="flex items-center justify-center h-screen">
        {erro ? (
          <div className="p-3 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE' }}>
            <AlertCircle className="w-4 h-4" /> {erro}
          </div>
        ) : (
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>
    )
  }

  const stColor: Record<string, { bg: string; text: string; label: string }> = {
    RASCUNHO: { bg: '#F1EFE8', text: '#888', label: 'Rascunho' },
    EM_ANDAMENTO: { bg: '#FFF3D6', text: '#A77400', label: 'Em andamento' },
    CONCLUIDA: { bg: '#EAF3DE', text: '#27500A', label: 'Concluída' },
    CANCELADA: { bg: '#FDEEEE', text: '#8B0000', label: 'Cancelada' },
  }
  const st = stColor[os.status] || stColor.RASCUNHO
  const concluida = os.status === 'CONCLUIDA'

  return (
    <div className="p-4 md:p-8 animate-fade-in pb-32 max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/ordens-servico/munck')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4"
      >
        <ChevronLeft className="w-4 h-4" /> Voltar pras OS
      </button>

      <div className="bg-white rounded-2xl p-5 mb-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#FEF3E2' }}>
              <ClipboardList className="w-6 h-6" style={{ color: '#FFAF06' }} />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-gray-900">{os.numero}</h1>
              <p className="text-xs text-gray-500">{fmtDateTime(os.dtHora)}</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: st.bg, color: st.text }}>
            {st.label}
          </span>
        </div>
      </div>

      {erro && (
        <div className="p-3 mb-4 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {erro}
        </div>
      )}

      <form onSubmit={(e) => salvar(e)} className="space-y-4">
        {/* 1. CLIENTE */}
        <Secao titulo="1. Cliente" icon={Building2}>
          <Campo label="Razão social" obrigatorio>
            <select
              value={os.clienteId || ''}
              onChange={(e) => setCampo('clienteId', e.target.value)}
              required
              disabled={concluida}
              className="w-full px-3 py-3 bg-white rounded-lg text-sm outline-none"
              style={{ border: '1px solid #E0DDD8' }}
            >
              <option value="">Selecione um cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.razaoSocial} — {c.cnpj}</option>
              ))}
            </select>
          </Campo>
          <Grid2>
            <Campo label="Contato no cliente">
              <Input value={os.contatoNome} onChange={(v) => setCampo('contatoNome', v)} disabled={concluida} />
            </Campo>
            <Campo label="Telefone">
              <Input value={os.contatoTelefone} onChange={(v) => setCampo('contatoTelefone', v)} disabled={concluida} />
            </Campo>
          </Grid2>
        </Secao>

        {/* 2. LOCAL DA OPERAÇÃO */}
        <Secao titulo="2. Local da operação" icon={MapPin}>
          <Campo label="Endereço completo">
            <Input value={os.endereco} onChange={(v) => setCampo('endereco', v)} disabled={concluida} />
          </Campo>
          <Grid2>
            <Campo label="Responsável no local">
              <Input value={os.responsavelLocal} onChange={(v) => setCampo('responsavelLocal', v)} disabled={concluida} />
            </Campo>
            <Campo label="Telefone do responsável">
              <Input value={os.telResponsavel} onChange={(v) => setCampo('telResponsavel', v)} disabled={concluida} />
            </Campo>
          </Grid2>
        </Secao>

        {/* 3. SERVIÇO */}
        <Secao titulo="3. Serviço" icon={Wrench}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
            {SERVICOS.map((s) => {
              const ativo = (os.servicoTipos || []).includes(s.value)
              return (
                <button
                  key={s.value}
                  type="button"
                  disabled={concluida}
                  onClick={() => toggleServico(s.value)}
                  className="px-3 py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                  style={{
                    background: ativo ? '#FFAF06' : '#fff',
                    color: ativo ? '#111' : '#555',
                    border: `1px solid ${ativo ? '#FFAF06' : '#E0DDD8'}`,
                  }}
                >
                  {ativo ? '✓ ' : ''}{s.label}
                </button>
              )
            })}
          </div>
          <Campo label="Descrição operacional">
            <Textarea value={os.descricaoOperacional} onChange={(v) => setCampo('descricaoOperacional', v)} disabled={concluida} />
          </Campo>
        </Secao>

        {/* 4. CARGA */}
        <Secao titulo="4. Carga" icon={Package}>
          <Campo label="Descrição da carga">
            <Input value={os.cargaDescricao} onChange={(v) => setCampo('cargaDescricao', v)} disabled={concluida} />
          </Campo>
          <Grid3>
            <Campo label="Peso estimado (kg)">
              <Input
                type="number"
                step="0.01"
                value={os.cargaPesoKg ?? ''}
                onChange={(v) => setCampo('cargaPesoKg', v)}
                disabled={concluida}
              />
            </Campo>
            <Campo label="Quantidade">
              <Input
                type="number"
                value={os.cargaQuantidade ?? ''}
                onChange={(v) => setCampo('cargaQuantidade', v)}
                disabled={concluida}
              />
            </Campo>
            <Campo label="Dimensões (CxLxA)">
              <Input value={os.cargaDimensoes} onChange={(v) => setCampo('cargaDimensoes', v)} disabled={concluida} />
            </Campo>
          </Grid3>
        </Secao>

        {/* 5. EQUIPAMENTO */}
        <Secao titulo="5. Equipamento" icon={Truck}>
          <Grid2>
            <Campo label="Caminhão">
              <select
                value={os.caminhaoId || ''}
                onChange={(e) => {
                  const k = caminhoes.find((x) => x.id === e.target.value)
                  setCampo('caminhaoId', e.target.value)
                  if (k) {
                    setCampo('placa', k.placa)
                    setCampo('modeloMunck', k.modelo)
                  }
                }}
                disabled={concluida}
                className="w-full px-3 py-3 bg-white rounded-lg text-sm outline-none"
                style={{ border: '1px solid #E0DDD8' }}
              >
                <option value="">Selecione</option>
                {caminhoes
                  .filter((k) => k.tipo === 'MUNCK' || !k.tipo)
                  .map((k) => (
                    <option key={k.id} value={k.id}>{k.codigo} — {k.modelo} ({k.placa})</option>
                  ))}
              </select>
            </Campo>
            <Campo label="Modelo Munck">
              <Input value={os.modeloMunck} onChange={(v) => setCampo('modeloMunck', v)} disabled={concluida} />
            </Campo>
          </Grid2>
          <Grid3>
            <Campo label="Placa">
              <Input value={os.placa} onChange={(v) => setCampo('placa', v)} disabled={concluida} />
            </Campo>
            <Campo label="Operador">
              <select
                value={os.operadorId || ''}
                onChange={(e) => setCampo('operadorId', e.target.value)}
                disabled={concluida}
                className="w-full px-3 py-3 bg-white rounded-lg text-sm outline-none"
                style={{ border: '1px solid #E0DDD8' }}
              >
                <option value="">Selecione</option>
                {motoristas.map((m) => (
                  <option key={m.id} value={m.id}>{m.nome} ({m.matricula})</option>
                ))}
              </select>
            </Campo>
            <Campo label="Auxiliar / Rigger">
              <Input value={os.auxiliarRigger} onChange={(v) => setCampo('auxiliarRigger', v)} disabled={concluida} />
            </Campo>
          </Grid3>
        </Secao>

        {/* 6. CHECKLIST */}
        <Secao titulo="6. Checklist operacional" icon={ListChecks}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {CHECKLIST_ITEMS.map((c) => (
              <label
                key={c.key}
                className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer hover:bg-gray-50"
                style={{ border: '1px solid #E0DDD8' }}
              >
                <input
                  type="checkbox"
                  checked={!!os[c.key]}
                  onChange={(e) => setCampo(c.key, e.target.checked)}
                  disabled={concluida}
                  className="w-5 h-5"
                  style={{ accentColor: '#FFAF06' }}
                />
                <span className="text-sm text-gray-700">{c.label}</span>
              </label>
            ))}
          </div>
        </Secao>

        {/* 7. HORÁRIOS */}
        <Secao titulo="7. Horários" icon={Clock}>
          <Grid4>
            <Campo label="Chegada"><Input type="time" value={os.hChegada} onChange={(v) => setCampo('hChegada', v)} disabled={concluida} /></Campo>
            <Campo label="Início"><Input type="time" value={os.hInicio} onChange={(v) => setCampo('hInicio', v)} disabled={concluida} /></Campo>
            <Campo label="Término"><Input type="time" value={os.hTermino} onChange={(v) => setCampo('hTermino', v)} disabled={concluida} /></Campo>
            <Campo label="Saída"><Input type="time" value={os.hSaida} onChange={(v) => setCampo('hSaida', v)} disabled={concluida} /></Campo>
          </Grid4>
        </Secao>

        {/* 8. OCORRÊNCIAS */}
        <Secao titulo="8. Ocorrências / Observações" icon={MessageSquare}>
          <Textarea value={os.ocorrencias} onChange={(v) => setCampo('ocorrencias', v)} disabled={concluida} rows={4} />
        </Secao>

        {/* 9. ASSINATURAS */}
        <Secao titulo="9. Assinaturas" icon={CheckCircle2}>
          <Grid2>
            <SignaturePad
              label="Assinatura do cliente"
              value={os.assinaturaCliente}
              onChange={(v) => setCampo('assinaturaCliente', v)}
              nome={os.assinaturaClienteNome}
              onNomeChange={(v) => setCampo('assinaturaClienteNome', v)}
              nomeLabel="Nome do cliente / preposto"
            />
            <SignaturePad
              label="Assinatura do operador Alfer"
              value={os.assinaturaOperador}
              onChange={(v) => setCampo('assinaturaOperador', v)}
              nome={os.assinaturaOperadorNome}
              onNomeChange={(v) => setCampo('assinaturaOperadorNome', v)}
              nomeLabel="Nome do operador Alfer"
            />
          </Grid2>
        </Secao>
      </form>

      {/* Barra fixa inferior */}
      <div className="fixed bottom-0 left-0 right-0 md:left-60 bg-white border-t p-3 flex gap-2 z-30" style={{ borderColor: '#E0DDD8' }}>
        <button
          onClick={excluir}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50"
          style={{ border: '1px solid #FACACA' }}
        >
          <Trash2 className="w-4 h-4" /> Excluir
        </button>
        <button
          onClick={(e) => salvar(e)}
          disabled={salvando || concluida}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-900 disabled:opacity-50"
          style={{ background: '#FFF8E6', color: '#FFAF06', border: '1px solid #FFAF06' }}
        >
          {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar rascunho
        </button>
        <a
          href={os?.id ? `${(import.meta as any).env?.VITE_API_URL || 'https://alfer-backend-production.up.railway.app/api/v1'}/ordens-servico/munck/${os.id}/pdf?token=${localStorage.getItem('alfer_token')}` : '#'}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => {
            // Browser não envia Authorization em <a target=_blank>; chama via fetch + blob
            e.preventDefault()
            api.get(`/ordens-servico/munck/${os.id}/pdf`, { responseType: 'blob' })
              .then((r) => {
                const url = URL.createObjectURL(r.data)
                window.open(url, '_blank')
              })
              .catch(() => alert('Falha ao gerar PDF'))
          }}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium text-white"
          style={{ background: '#2D80D1' }}
        >
          <FileDown className="w-4 h-4" /> PDF
        </a>
        {!concluida && (
          <button
            onClick={concluir}
            disabled={salvando}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50"
            style={{ background: '#27AE60' }}
          >
            {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Concluir OS
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Subcomponentes auxiliares ────────────────────────────────────────────────

function Secao({ titulo, icon: Icon, children }: any) {
  return (
    <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
        {Icon && <Icon className="w-4 h-4" style={{ color: '#FFAF06' }} />}
        {titulo}
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Campo({ label, children, obrigatorio }: any) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-700 mb-1 block">
        {label} {obrigatorio && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

function Input({ value, onChange, disabled, type = 'text', step }: any) {
  return (
    <input
      type={type}
      step={step}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-3 py-3 bg-white rounded-lg text-sm outline-none disabled:bg-gray-50 disabled:text-gray-500"
      style={{ border: '1px solid #E0DDD8' }}
    />
  )
}

function Textarea({ value, onChange, disabled, rows = 3 }: any) {
  return (
    <textarea
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      rows={rows}
      className="w-full px-3 py-3 bg-white rounded-lg text-sm outline-none resize-none disabled:bg-gray-50 disabled:text-gray-500"
      style={{ border: '1px solid #E0DDD8' }}
    />
  )
}

function Grid2({ children }: any) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
}
function Grid3({ children }: any) {
  return <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{children}</div>
}
function Grid4({ children }: any) {
  return <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{children}</div>
}
