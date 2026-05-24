import { useEffect, useState, FormEvent } from 'react'
import api from '../services/api'
import { Modal } from '../components/Modal'
import { Building2, Plus, Search, Pencil, Trash2, AlertCircle, Loader2, X, Mail, Phone, MapPin } from 'lucide-react'

const CATEGORIAS: { v: string; l: string }[] = [
  { v: '',                   l: '—' },
  { v: 'MANUTENCAO',         l: 'Manutenção' },
  { v: 'COMBUSTIVEL',        l: 'Combustível' },
  { v: 'SEGURO',             l: 'Seguro' },
  { v: 'OPERACIONAL',        l: 'Operacional' },
  { v: 'PESSOAL',            l: 'Pessoal' },
  { v: 'ADMINISTRATIVO',     l: 'Administrativo' },
  { v: 'ALUGUEL',            l: 'Aluguel' },
  { v: 'IMPOSTOS',           l: 'Impostos / Taxas' },
  { v: 'FRETE',              l: 'Frete' },
  { v: 'DOCUMENTACAO',       l: 'Documentação' },
  { v: 'ENERGIA_AGUA',       l: 'Energia / Água' },
  { v: 'TELEFONIA_INTERNET', l: 'Telefonia / Internet' },
  { v: 'MARKETING',          l: 'Marketing' },
  { v: 'EQUIPAMENTO',        l: 'Equipamento' },
  { v: 'SOFTWARE',           l: 'Software' },
  { v: 'FINANCEIRO',         l: 'Financeiro' },
  { v: 'OUTROS',             l: 'Outros' },
]

export default function Fornecedores() {
  const [itens, setItens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroAtivo, setFiltroAtivo] = useState('true')
  const [modal, setModal] = useState<any | null>(null)
  const [erro, setErro] = useState('')

  const load = () => {
    setLoading(true)
    const params: any = {}
    if (busca) params.busca = busca
    if (filtroAtivo) params.ativo = filtroAtivo
    api.get('/fornecedores', { params })
      .then((r) => setItens(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const t = setTimeout(load, busca ? 300 : 0)
    return () => clearTimeout(t)
  }, [busca, filtroAtivo])

  const excluir = async (f: any) => {
    if (!confirm(`Excluir o fornecedor "${f.nome}"?`)) return
    try {
      await api.delete(`/fornecedores/${f.id}`)
      load()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao excluir')
    }
  }

  const inativar = async (f: any) => {
    try {
      await api.put(`/fornecedores/${f.id}`, { ativo: !f.ativo })
      load()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao alterar')
    }
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Fornecedores</h1>
          <p className="text-gray-500 text-sm mt-1">{itens.length} fornecedor(es) cadastrado(s)</p>
        </div>
        <button
          onClick={() => setModal({})}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-900 hover:opacity-90"
          style={{ background: '#FFAF06' }}
        >
          <Plus className="w-4 h-4" /> Novo fornecedor
        </button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, fantasia ou CNPJ..."
            className="w-full pl-11 pr-4 py-3 bg-white rounded-xl text-sm outline-none"
            style={{ border: '1px solid #E0DDD8' }}
          />
        </div>
        <select
          value={filtroAtivo}
          onChange={(e) => setFiltroAtivo(e.target.value)}
          className="px-4 py-3 bg-white rounded-xl text-sm outline-none"
          style={{ border: '1px solid #E0DDD8' }}
        >
          <option value="">Todos</option>
          <option value="true">Só ativos</option>
          <option value="false">Só inativos</option>
        </select>
      </div>

      {erro && (
        <div className="p-3 mb-4 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {erro}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : itens.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum fornecedor cadastrado</p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {itens.map((f) => {
            const cat = CATEGORIAS.find((c) => c.v === f.categoriaPadrao)
            return (
              <div key={f.id} className="bg-white rounded-2xl p-5 flex items-center gap-4 animate-fade-in" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#FEF3E2' }}>
                  <Building2 className="w-5 h-5" style={{ color: '#FFAF06' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{f.nome}</span>
                    {f.nomeFantasia && f.nomeFantasia !== f.nome && (
                      <span className="text-xs text-gray-500">({f.nomeFantasia})</span>
                    )}
                    {!f.ativo && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#F1EFE8', color: '#888' }}>Inativo</span>
                    )}
                    {cat && cat.v && (
                      <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: '#FEF3E2', color: '#633806' }}>{cat.l}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                    {f.cnpj && <span>CNPJ: {f.cnpj}</span>}
                    {f.telefone && (<span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {f.telefone}</span>)}
                    {f.email && (<span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {f.email}</span>)}
                    {f.cidade && (<span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {f.cidade}/{f.estado}</span>)}
                  </div>
                </div>
                <button
                  onClick={() => inativar(f)}
                  title={f.ativo ? 'Inativar' : 'Reativar'}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
                  style={{ border: '1px solid #E0DDD8' }}
                >
                  {f.ativo ? 'Inativar' : 'Reativar'}
                </button>
                <button
                  onClick={() => setModal(f)}
                  title="Editar"
                  className="p-2 rounded-lg text-gray-700 hover:bg-gray-50"
                  style={{ border: '1px solid #E0DDD8' }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => excluir(f)}
                  title="Excluir"
                  className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                  style={{ border: '1px solid #FACACA' }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <FornecedorModal
          fornecedor={modal.id ? modal : null}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}

export function FornecedorModal({ fornecedor, onClose, onSaved }: { fornecedor: any | null; onClose: () => void; onSaved: (novo?: any) => void }) {
  const isEdit = !!fornecedor?.id
  const [form, setForm] = useState({
    nome: fornecedor?.nome || '',
    nomeFantasia: fornecedor?.nomeFantasia || '',
    cnpj: fornecedor?.cnpj || '',
    inscEstadual: fornecedor?.inscEstadual || '',
    email: fornecedor?.email || '',
    telefone: fornecedor?.telefone || '',
    cep: fornecedor?.cep || '',
    endereco: fornecedor?.endereco || '',
    bairro: fornecedor?.bairro || '',
    cidade: fornecedor?.cidade || '',
    estado: fornecedor?.estado || '',
    categoriaPadrao: fornecedor?.categoriaPadrao || '',
    contatoNome: fornecedor?.contatoNome || '',
    contatoCargo: fornecedor?.contatoCargo || '',
    observacoes: fornecedor?.observacoes || '',
  })
  const [loading, setLoading] = useState(false)
  const [buscandoCnpj, setBuscandoCnpj] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [erro, setErro] = useState('')

  const buscarCnpj = async () => {
    const cnpjLimpo = form.cnpj.replace(/\D/g, '')
    if (cnpjLimpo.length !== 14) return setErro('CNPJ precisa ter 14 dígitos')
    setBuscandoCnpj(true); setErro('')
    try {
      const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`)
      if (!r.ok) throw new Error('CNPJ não encontrado')
      const d = await r.json()
      setForm((f) => ({
        ...f,
        nome: f.nome || d.razao_social || '',
        nomeFantasia: f.nomeFantasia || d.nome_fantasia || '',
        email: f.email || d.email || '',
        telefone: f.telefone || (d.ddd_telefone_1 ? `(${d.ddd_telefone_1.slice(0, 2)}) ${d.ddd_telefone_1.slice(2)}` : ''),
        cep: f.cep || (d.cep ? d.cep.replace(/(\d{5})(\d{3})/, '$1-$2') : ''),
        endereco: f.endereco || [d.descricao_tipo_de_logradouro, d.logradouro, d.numero, d.complemento].filter(Boolean).join(' '),
        bairro: f.bairro || d.bairro || '',
        cidade: f.cidade || d.municipio || '',
        estado: f.estado || d.uf || '',
      }))
    } catch (e: any) {
      setErro(e.message || 'Erro ao buscar CNPJ')
    } finally {
      setBuscandoCnpj(false)
    }
  }

  const buscarCep = async () => {
    const cepLimpo = form.cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) return setErro('CEP precisa ter 8 dígitos')
    setBuscandoCep(true); setErro('')
    try {
      const r = await fetch(`https://brasilapi.com.br/api/cep/v2/${cepLimpo}`)
      if (!r.ok) throw new Error('CEP não encontrado')
      const d = await r.json()
      setForm((f) => ({
        ...f,
        endereco: f.endereco || d.street || '',
        bairro: f.bairro || d.neighborhood || '',
        cidade: f.cidade || d.city || '',
        estado: f.estado || d.state || '',
      }))
    } catch (e: any) {
      setErro(e.message || 'Erro ao buscar CEP')
    } finally {
      setBuscandoCep(false)
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.nome) return setErro('Nome é obrigatório.')
    setLoading(true); setErro('')
    try {
      const payload = { ...form, categoriaPadrao: form.categoriaPadrao || null }
      const r = isEdit
        ? await api.put(`/fornecedores/${fornecedor.id}`, payload)
        : await api.post('/fornecedores', payload)
      onSaved(r.data)
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white'
  const inputStyle = { border: '1px solid #E0DDD8' }

  return (
    <Modal onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-gray-900">{isEdit ? 'Editar' : 'Novo'} fornecedor</h2>
        <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
      </div>
      <form onSubmit={submit} className="space-y-3">
        {/* CNPJ + busca */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">CNPJ</label>
            <div className="flex gap-2">
              <input
                value={form.cnpj}
                onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
                className={inputCls}
                style={inputStyle}
              />
              <button
                type="button"
                onClick={buscarCnpj}
                disabled={buscandoCnpj || !form.cnpj}
                className="px-3 py-2.5 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
                style={{ border: '1px solid #E0DDD8' }}
              >
                {buscandoCnpj ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Buscar'}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Inscr. Estadual</label>
            <input value={form.inscEstadual} onChange={(e) => setForm({ ...form, inscEstadual: e.target.value })} className={inputCls} style={inputStyle} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Razão social *</label>
            <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nome fantasia</label>
            <input value={form.nomeFantasia} onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })} className={inputCls} style={inputStyle} />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Categoria padrão (sugestão pra despesas)</label>
          <select value={form.categoriaPadrao} onChange={(e) => setForm({ ...form, categoriaPadrao: e.target.value })} className={inputCls} style={inputStyle}>
            {CATEGORIAS.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
          </select>
        </div>

        {/* Contato */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">E-mail</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Telefone</label>
            <input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(81) 9 9999-9999" className={inputCls} style={inputStyle} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Contato (pessoa)</label>
            <input value={form.contatoNome} onChange={(e) => setForm({ ...form, contatoNome: e.target.value })} placeholder="Ex: João Silva" className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Cargo</label>
            <input value={form.contatoCargo} onChange={(e) => setForm({ ...form, contatoCargo: e.target.value })} placeholder="Ex: Comercial" className={inputCls} style={inputStyle} />
          </div>
        </div>

        {/* Endereço */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">CEP</label>
            <div className="flex gap-2">
              <input value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} placeholder="00000-000" className={inputCls} style={inputStyle} />
              <button
                type="button"
                onClick={buscarCep}
                disabled={buscandoCep || !form.cep}
                className="px-3 py-2.5 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
                style={{ border: '1px solid #E0DDD8' }}
              >
                {buscandoCep ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Buscar'}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Endereço</label>
            <input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} placeholder="Rua, número" className={inputCls} style={inputStyle} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Bairro</label>
            <input value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Cidade</label>
            <input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">UF</label>
            <input value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} maxLength={2} className={inputCls} style={inputStyle} />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Observações</label>
          <textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none" style={inputStyle} />
        </div>

        {erro && <div className="text-xs text-red-700 flex items-center gap-2"><AlertCircle className="w-3 h-3" /> {erro}</div>}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700" style={{ border: '1px solid #E0DDD8' }}>Cancelar</button>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-900 flex items-center justify-center gap-2" style={{ background: loading ? '#CC8C00' : '#FFAF06' }}>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEdit ? 'Salvar' : 'Cadastrar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
