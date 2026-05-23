import { useEffect, useState, FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import SignaturePad from '../components/SignaturePad'
import {
  ChevronLeft, ClipboardList, Save, CheckCircle2, Trash2, Loader2, AlertCircle,
  Building2, MapPin, ArrowRightLeft, Package, Truck, ListChecks, Clock, MessageSquare, FileText, Scale,
} from 'lucide-react'

const MOVIMENTOS = [
  { value: 'ENTREGA_VAZIA', label: 'Entrega vazia' },
  { value: 'COLETA_CHEIA', label: 'Coleta cheia' },
  { value: 'TROCA', label: 'Troca (entrega + coleta)' },
  { value: 'TRANSPORTE_DESTINO', label: 'Transporte → destino' },
]

const CLASSES_RESIDUO = [
  { value: '', label: 'Selecione' },
  { value: 'CLASSE_IIA', label: 'Classe II A — Não perigosos, não inertes (RSU, orgânicos)' },
  { value: 'CLASSE_IIB', label: 'Classe II B — Não perigosos, inertes (entulho, terra)' },
  { value: 'CLASSE_I', label: 'Classe I — Perigosos' },
  { value: 'CONSTRUCAO_CIVIL', label: 'Construção civil (RCC)' },
  { value: 'RECICLAVEIS', label: 'Recicláveis (papel/plástico/metal/vidro)' },
  { value: 'PODA_VERDE', label: 'Poda verde (galhos, folhas)' },
  { value: 'MISTO', label: 'Misto' },
  { value: 'OUTRO', label: 'Outro' },
]

const CHECKLIST_ITEMS = [
  { key: 'chkAcessoLiberado', label: 'Acesso liberado pro caminhão' },
  { key: 'chkEspacoManobra', label: 'Espaço pra manobra OK' },
  { key: 'chkSinalizacaoOk', label: 'Sinalização viária colocada' },
  { key: 'chkCacambaTravada', label: 'Caçamba travada no chassi' },
  { key: 'chkLonaColocada', label: 'Lona/cobertura colocada' },
  { key: 'chkAreaIsolada', label: 'Área isolada' },
  { key: 'chkClientePresente', label: 'Cliente presente' },
]

const fmtDateTime = (d?: string) => (d ? new Date(d).toLocaleString('pt-BR') : '—')

export default function OrdemServicoPoliDetalhe() {
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
    Promise.all([api.get('/clientes'), api.get('/caminhoes'), api.get('/motoristas')])
      .then(([c, k, m]) => { setClientes(c.data); setCaminhoes(k.data); setMotoristas(m.data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (isNova) {
      const payload: any = { tipoMovimento: 'ENTREGA_VAZIA' }
      if (contratoIdParam) payload.contratoId = contratoIdParam
      api
        .post('/ordens-servico/poli', payload)
        .then((r) => {
          setOs(r.data)
          navigate(`/ordens-servico/poli/${r.data.id}`, { replace: true })
        })
        .catch((e) => setErro(e.response?.data?.message || 'Erro ao criar OS'))
        .finally(() => setLoading(false))
      return
    }
    api
      .get(`/ordens-servico/poli/${id}`)
      .then((r) => setOs(r.data))
      .catch((e) => setErro(e.response?.data?.message || 'Erro ao carregar OS'))
      .finally(() => setLoading(false))
  }, [id])

  const setCampo = (campo: string, valor: any) => setOs((o: any) => ({ ...o, [campo]: valor }))

  // Recalcula peso líquido automaticamente quando entra/saída mudam
  const setPeso = (campo: 'pesoEntradaKg' | 'pesoSaidaKg', v: any) => {
    setOs((o: any) => {
      const novo = { ...o, [campo]: v }
      const e = Number(novo.pesoEntradaKg)
      const s = Number(novo.pesoSaidaKg)
      if (Number.isFinite(e) && Number.isFinite(s) && novo.pesoEntradaKg !== '' && novo.pesoSaidaKg !== '') {
        novo.pesoLiquidoKg = +(e - s).toFixed(2)
      }
      return novo
    })
  }

  const salvar = async (e?: FormEvent, status?: string) => {
    e?.preventDefault()
    if (!os) return
    setSalvando(true); setErro('')
    try {
      const payload = { ...os, ...(status ? { status } : {}) }
      const r = await api.put(`/ordens-servico/poli/${os.id}`, payload)
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
      await api.delete(`/ordens-servico/poli/${os.id}`)
      navigate('/ordens-servico/poli')
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
  const mov = os.tipoMovimento
  const mostraDestino = mov === 'TRANSPORTE_DESTINO' || mov === 'COLETA_CHEIA' || mov === 'TROCA'
  const mostraCacambaEntregue = mov === 'TROCA' || mov === 'ENTREGA_VAZIA'
  const mostraMTR = mov === 'COLETA_CHEIA' || mov === 'TROCA' || mov === 'TRANSPORTE_DESTINO'

  return (
    <div className="p-4 md:p-8 animate-fade-in pb-32 max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/ordens-servico/poli')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4"
      >
        <ChevronLeft className="w-4 h-4" /> Voltar pras OS
      </button>

      <div className="bg-white rounded-2xl p-5 mb-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E0DDD8' }}>
              <img src="/icones/poliguindaste.png" alt="Poliguindaste" className="w-10 h-10 object-contain"
                   onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
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

        {/* 2. TIPO DE MOVIMENTO */}
        <Secao titulo="2. Tipo de movimento" icon={ArrowRightLeft}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {MOVIMENTOS.map((m) => {
              const ativo = os.tipoMovimento === m.value
              return (
                <button
                  key={m.value}
                  type="button"
                  disabled={concluida}
                  onClick={() => setCampo('tipoMovimento', m.value)}
                  className="px-3 py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                  style={{
                    background: ativo ? '#FFAF06' : '#fff',
                    color: ativo ? '#111' : '#555',
                    border: `1px solid ${ativo ? '#FFAF06' : '#E0DDD8'}`,
                  }}
                >
                  {ativo ? '✓ ' : ''}{m.label}
                </button>
              )
            })}
          </div>
        </Secao>

        {/* 3. ORIGEM */}
        <Secao titulo="3. Origem (onde retira ou entrega)" icon={MapPin}>
          <Campo label="Endereço">
            <Input value={os.enderecoOrigem} onChange={(v) => setCampo('enderecoOrigem', v)} disabled={concluida} />
          </Campo>
          <Grid2>
            <Campo label="Responsável">
              <Input value={os.responsavelOrigem} onChange={(v) => setCampo('responsavelOrigem', v)} disabled={concluida} />
            </Campo>
            <Campo label="Telefone">
              <Input value={os.telResponsavelOrig} onChange={(v) => setCampo('telResponsavelOrig', v)} disabled={concluida} />
            </Campo>
          </Grid2>
        </Secao>

        {/* 4. DESTINO — só pra movimentos que envolvem destino */}
        {mostraDestino && (
          <Secao titulo="4. Destino (aterro / ATT / transbordo)" icon={MapPin}>
            <Campo label="Endereço">
              <Input value={os.enderecoDestino} onChange={(v) => setCampo('enderecoDestino', v)} disabled={concluida} />
            </Campo>
            <Grid2>
              <Campo label="Responsável">
                <Input value={os.responsavelDestino} onChange={(v) => setCampo('responsavelDestino', v)} disabled={concluida} />
              </Campo>
              <Campo label="Telefone">
                <Input value={os.telResponsavelDest} onChange={(v) => setCampo('telResponsavelDest', v)} disabled={concluida} />
              </Campo>
            </Grid2>
          </Secao>
        )}

        {/* 5. CAÇAMBA */}
        <Secao titulo="5. Caçamba" icon={Package}>
          <Grid2>
            <Campo label={mostraCacambaEntregue && mov === 'TROCA' ? 'Caçamba COLETADA (cheia) — código' : 'Código da caçamba'}>
              <Input value={os.cacambaCodigo} onChange={(v) => setCampo('cacambaCodigo', v)} disabled={concluida} />
            </Campo>
            <Campo label="Tamanho">
              <Input value={os.cacambaTamanho} onChange={(v) => setCampo('cacambaTamanho', v)} disabled={concluida} />
            </Campo>
          </Grid2>
          {mostraCacambaEntregue && (
            <>
              <p className="text-xs text-gray-500 mt-3 mb-1">
                {mov === 'TROCA' ? 'Caçamba VAZIA deixada no lugar:' : 'Detalhes da caçamba entregue (se diferente):'}
              </p>
              <Grid2>
                <Campo label="Código (vazia entregue)">
                  <Input value={os.cacambaEntregueCodigo} onChange={(v) => setCampo('cacambaEntregueCodigo', v)} disabled={concluida} />
                </Campo>
                <Campo label="Tamanho">
                  <Input value={os.cacambaEntregueTamanho} onChange={(v) => setCampo('cacambaEntregueTamanho', v)} disabled={concluida} />
                </Campo>
              </Grid2>
            </>
          )}
        </Secao>

        {/* 6. CARGA / RESÍDUO */}
        <Secao titulo="6. Carga / Resíduo" icon={Package}>
          <Campo label="Classe do resíduo">
            <select
              value={os.classeResiduo || ''}
              onChange={(e) => setCampo('classeResiduo', e.target.value)}
              disabled={concluida}
              className="w-full px-3 py-3 bg-white rounded-lg text-sm outline-none"
              style={{ border: '1px solid #E0DDD8' }}
            >
              {CLASSES_RESIDUO.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Campo>
          <Grid2>
            <Campo label="Descrição da carga">
              <Input value={os.descricaoCarga} onChange={(v) => setCampo('descricaoCarga', v)} disabled={concluida} />
            </Campo>
            <Campo label="Volume (m³)">
              <Input type="number" step="0.01" value={os.volumeM3 ?? ''} onChange={(v) => setCampo('volumeM3', v)} disabled={concluida} />
            </Campo>
          </Grid2>
        </Secao>

        {/* 7. MTR — só pra movimentos com transporte de resíduo */}
        {mostraMTR && (
          <Secao titulo="7. MTR — Manifesto de Transporte de Resíduos" icon={FileText}>
            <Campo label="Nº do MTR">
              <Input value={os.mtrNumero} onChange={(v) => setCampo('mtrNumero', v)} disabled={concluida} />
            </Campo>
            <Grid3>
              <Campo label="Gerador">
                <Input value={os.mtrGerador} onChange={(v) => setCampo('mtrGerador', v)} disabled={concluida} />
              </Campo>
              <Campo label="Transportador">
                <Input value={os.mtrTransportador} onChange={(v) => setCampo('mtrTransportador', v)} disabled={concluida} />
              </Campo>
              <Campo label="Destinador">
                <Input value={os.mtrDestinador} onChange={(v) => setCampo('mtrDestinador', v)} disabled={concluida} />
              </Campo>
            </Grid3>
            <div className="mt-3">
              <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><Scale className="w-3 h-3" /> Pesagem (balança)</h3>
              <Grid3>
                <Campo label="Entrada (kg)">
                  <Input type="number" step="0.01" value={os.pesoEntradaKg ?? ''} onChange={(v) => setPeso('pesoEntradaKg', v)} disabled={concluida} />
                </Campo>
                <Campo label="Saída / tara (kg)">
                  <Input type="number" step="0.01" value={os.pesoSaidaKg ?? ''} onChange={(v) => setPeso('pesoSaidaKg', v)} disabled={concluida} />
                </Campo>
                <Campo label="Líquido (kg)">
                  <Input type="number" step="0.01" value={os.pesoLiquidoKg ?? ''} onChange={(v) => setCampo('pesoLiquidoKg', v)} disabled={concluida} />
                </Campo>
              </Grid3>
              <p className="text-xs text-gray-400 mt-1">Líquido calcula automaticamente: entrada − saída</p>
            </div>
          </Secao>
        )}

        {/* 8. EQUIPAMENTO */}
        <Secao titulo={`${mostraMTR ? '8' : '7'}. Equipamento`} icon={Truck}>
          <Grid2>
            <Campo label="Caminhão">
              <select
                value={os.caminhaoId || ''}
                onChange={(e) => {
                  const k = caminhoes.find((x) => x.id === e.target.value)
                  setCampo('caminhaoId', e.target.value)
                  if (k) {
                    setCampo('placa', k.placa)
                    setCampo('modeloCaminhao', k.modelo)
                  }
                }}
                disabled={concluida}
                className="w-full px-3 py-3 bg-white rounded-lg text-sm outline-none"
                style={{ border: '1px solid #E0DDD8' }}
              >
                <option value="">Selecione</option>
                {caminhoes
                  .filter((k) => k.tipo === 'POLIGUINDASTE' || !k.tipo)
                  .map((k) => (
                    <option key={k.id} value={k.id}>{k.codigo} — {k.modelo} ({k.placa})</option>
                  ))}
              </select>
            </Campo>
            <Campo label="Modelo">
              <Input value={os.modeloCaminhao} onChange={(v) => setCampo('modeloCaminhao', v)} disabled={concluida} />
            </Campo>
          </Grid2>
          <Grid2>
            <Campo label="Placa">
              <Input value={os.placa} onChange={(v) => setCampo('placa', v)} disabled={concluida} />
            </Campo>
            <Campo label="Motorista">
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
          </Grid2>
        </Secao>

        {/* 9. CHECKLIST */}
        <Secao titulo={`${mostraMTR ? '9' : '8'}. Checklist operacional`} icon={ListChecks}>
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

        {/* 10. HORÁRIOS */}
        <Secao titulo={`${mostraMTR ? '10' : '9'}. Horários`} icon={Clock}>
          <Grid4>
            <Campo label="Chegada"><Input type="time" value={os.hChegada} onChange={(v) => setCampo('hChegada', v)} disabled={concluida} /></Campo>
            <Campo label="Início"><Input type="time" value={os.hInicio} onChange={(v) => setCampo('hInicio', v)} disabled={concluida} /></Campo>
            <Campo label="Término"><Input type="time" value={os.hTermino} onChange={(v) => setCampo('hTermino', v)} disabled={concluida} /></Campo>
            <Campo label="Saída"><Input type="time" value={os.hSaida} onChange={(v) => setCampo('hSaida', v)} disabled={concluida} /></Campo>
          </Grid4>
        </Secao>

        {/* 11. OCORRÊNCIAS */}
        <Secao titulo={`${mostraMTR ? '11' : '10'}. Ocorrências / Observações`} icon={MessageSquare}>
          <Textarea value={os.ocorrencias} onChange={(v) => setCampo('ocorrencias', v)} disabled={concluida} rows={4} />
        </Secao>

        {/* 12. ASSINATURAS */}
        <Secao titulo={`${mostraMTR ? '12' : '11'}. Assinaturas`} icon={CheckCircle2}>
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
              label="Assinatura do motorista Alfer"
              value={os.assinaturaOperador}
              onChange={(v) => setCampo('assinaturaOperador', v)}
              nome={os.assinaturaOperadorNome}
              onNomeChange={(v) => setCampo('assinaturaOperadorNome', v)}
              nomeLabel="Nome do motorista Alfer"
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
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
          style={{ background: '#FFF8E6', color: '#FFAF06', border: '1px solid #FFAF06' }}
        >
          {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar rascunho
        </button>
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

// ─── Subcomponentes auxiliares ─────────────────────────────────────────────

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
