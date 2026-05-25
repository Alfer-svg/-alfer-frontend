import { useEffect, useState, FormEvent } from 'react'
import api from '../services/api'
import { Modal } from '../components/Modal'
import {
  Building2, Plus, Pencil, Trash2, AlertCircle, Star, X,
} from 'lucide-react'

type Emissor = {
  id: string
  razaoSocial: string
  nomeFantasia?: string | null
  cnpj: string
  ie?: string | null
  logradouro: string
  numero: string
  complemento?: string | null
  bairro: string
  cidade: string
  uf: string
  cep: string
  telefone: string
  email: string
  logoUrl?: string | null
  faturaInicio: number
  padrao: boolean
  ativo: boolean
  interClientId?: string | null
  interClientSecret?: string | null
  interCertPath?: string | null
  interKeyPath?: string | null
  interContaCorrente?: string | null
}

const EMPTY: Partial<Emissor> = {
  razaoSocial: '',
  nomeFantasia: '',
  cnpj: '',
  ie: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  cep: '',
  telefone: '',
  email: '',
  logoUrl: '',
  faturaInicio: 1,
  padrao: false,
  ativo: true,
  interClientId: '',
  interClientSecret: '',
  interCertPath: '',
  interKeyPath: '',
  interContaCorrente: '',
}

export default function Emissores() {
  const [itens, setItens] = useState<Emissor[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Partial<Emissor> | null>(null)
  const [erro, setErro] = useState('')

  const load = () => {
    setLoading(true)
    api.get('/emissores')
      .then((r) => setItens(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const excluir = async (em: Emissor) => {
    if (!confirm(`Excluir o emissor "${em.razaoSocial}"?`)) return
    try {
      await api.delete(`/emissores/${em.id}`)
      load()
    } catch (err: any) {
      setErro(err?.response?.data?.message || 'Erro ao excluir')
    }
  }

  const inativar = async (em: Emissor) => {
    try {
      await api.put(`/emissores/${em.id}`, { ativo: !em.ativo })
      load()
    } catch (err: any) {
      setErro(err?.response?.data?.message || 'Erro ao alterar')
    }
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Emissores</h1>
          <p className="text-gray-500 text-sm mt-1">
            CNPJs que podem emitir contratos, faturas e boletos
          </p>
        </div>
        <button
          onClick={() => setModal({ ...EMPTY })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-900 hover:opacity-90"
          style={{ background: '#FFAF06' }}
        >
          <Plus className="w-4 h-4" /> Novo emissor
        </button>
      </div>

      <p className="text-xs text-gray-400 mb-6 max-w-3xl">
        O orçamento sempre sai como o emissor padrão. Na aprovação, você escolhe em
        nome de qual CNPJ o contrato será emitido — fatura e boleto seguem o mesmo.
      </p>

      {erro && (
        <div className="p-3 mb-4 rounded-xl text-red-700 text-sm flex items-center gap-2"
             style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {erro}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
               style={{ borderColor: '#FFAF06', borderTopColor: 'transparent' }} />
        </div>
      ) : itens.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum emissor cadastrado</p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {itens.map((em) => (
            <div key={em.id}
                 className="bg-white rounded-2xl p-5 flex items-center gap-4 animate-fade-in"
                 style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ background: '#FEF3E2' }}>
                <Building2 className="w-5 h-5" style={{ color: '#FFAF06' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">{em.razaoSocial}</span>
                  {em.padrao && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1"
                          style={{ background: '#FEF3E2', color: '#633806' }}>
                      <Star className="w-3 h-3 fill-current" /> Padrão
                    </span>
                  )}
                  {!em.ativo && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: '#F1EFE8', color: '#888' }}>
                      Inativo
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                  <span>CNPJ: {em.cnpj}</span>
                  {em.ie && <span>IE: {em.ie}</span>}
                  <span>{em.cidade}/{em.uf}</span>
                  <span>Fatura {em.faturaInicio}+</span>
                  <span>{em.interClientId ? 'Inter: configurado' : 'Inter: pendente'}</span>
                </div>
              </div>
              {!em.padrao && (
                <button
                  onClick={() => inativar(em)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
                  style={{ border: '1px solid #E0DDD8' }}
                >
                  {em.ativo ? 'Inativar' : 'Reativar'}
                </button>
              )}
              <button
                onClick={() => setModal({ ...em })}
                title="Editar"
                className="p-2 rounded-lg text-gray-700 hover:bg-gray-50"
                style={{ border: '1px solid #E0DDD8' }}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              {!em.padrao && (
                <button
                  onClick={() => excluir(em)}
                  title="Excluir"
                  className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                  style={{ border: '1px solid #FACACA' }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <EmissorModal
          emissor={modal.id ? (modal as Emissor) : null}
          initial={modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}

function EmissorModal({
  emissor, initial, onClose, onSaved,
}: {
  emissor: Emissor | null
  initial: Partial<Emissor>
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!emissor?.id
  const [form, setForm] = useState<Partial<Emissor>>(initial)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const set = (k: keyof Emissor, v: any) => setForm((f) => ({ ...f, [k]: v }))

  const salvar = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      if (isEdit) {
        await api.put(`/emissores/${emissor!.id}`, form)
      } else {
        await api.post('/emissores', form)
      }
      onSaved()
    } catch (err: any) {
      setErro(err?.response?.data?.message || 'Erro ao salvar')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-lg font-bold text-gray-900">
          {isEdit ? 'Editar emissor' : 'Novo emissor'}
        </h2>
        <button type="button" onClick={onClose}>
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <form onSubmit={salvar} className="space-y-5">
        {/* Dados cadastrais */}
        <Section title="Dados cadastrais">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Razão social" required>
              <Input value={form.razaoSocial || ''} onChange={(v) => set('razaoSocial', v)} required />
            </Field>
            <Field label="Nome fantasia">
              <Input value={form.nomeFantasia || ''} onChange={(v) => set('nomeFantasia', v)} />
            </Field>
            <Field label="CNPJ" required>
              <Input value={form.cnpj || ''} onChange={(v) => set('cnpj', v)} required />
            </Field>
            <Field label="Inscrição estadual">
              <Input placeholder="ISENTO" value={form.ie || ''} onChange={(v) => set('ie', v)} />
            </Field>
          </div>
        </Section>

        {/* Endereço */}
        <Section title="Endereço">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-3">
              <Field label="Logradouro"><Input value={form.logradouro || ''} onChange={(v) => set('logradouro', v)} /></Field>
            </div>
            <div className="md:col-span-1">
              <Field label="Número"><Input value={form.numero || ''} onChange={(v) => set('numero', v)} /></Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Complemento"><Input value={form.complemento || ''} onChange={(v) => set('complemento', v)} /></Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Bairro"><Input value={form.bairro || ''} onChange={(v) => set('bairro', v)} /></Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Cidade"><Input value={form.cidade || ''} onChange={(v) => set('cidade', v)} /></Field>
            </div>
            <div className="md:col-span-1">
              <Field label="UF"><Input maxLength={2} value={form.uf || ''} onChange={(v) => set('uf', v.toUpperCase())} /></Field>
            </div>
            <div className="md:col-span-1">
              <Field label="CEP"><Input value={form.cep || ''} onChange={(v) => set('cep', v)} /></Field>
            </div>
          </div>
        </Section>

        {/* Contato + PDF */}
        <Section title="Contato e PDF">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Telefone"><Input value={form.telefone || ''} onChange={(v) => set('telefone', v)} /></Field>
            <Field label="E-mail"><Input type="email" value={form.email || ''} onChange={(v) => set('email', v)} /></Field>
            <Field label="Logo (path / URL)">
              <Input placeholder="logos/empresa.png" value={form.logoUrl || ''} onChange={(v) => set('logoUrl', v)} />
            </Field>
            <Field label="Fatura inicia em">
              <Input type="number" value={String(form.faturaInicio ?? 1)} onChange={(v) => set('faturaInicio', Number(v))} />
            </Field>
          </div>
          <div className="flex gap-5 pt-3 text-sm text-gray-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!form.padrao}
                     onChange={(e) => set('padrao', e.target.checked)}
                     style={{ accentColor: '#FFAF06' }} />
              Emissor padrão
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.ativo !== false}
                     onChange={(e) => set('ativo', e.target.checked)}
                     style={{ accentColor: '#FFAF06' }} />
              Ativo
            </label>
          </div>
        </Section>

        {/* Inter — colapsável visualmente, mas sem precisar abrir */}
        <Section title="Banco Inter (boleto/Pix)" hint="Opcional — pode plugar depois">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Client ID"><Input value={form.interClientId || ''} onChange={(v) => set('interClientId', v)} /></Field>
            <Field label="Client Secret"><Input type="password" value={form.interClientSecret || ''} onChange={(v) => set('interClientSecret', v)} /></Field>
            <Field label="Cert (.crt) path"><Input value={form.interCertPath || ''} onChange={(v) => set('interCertPath', v)} /></Field>
            <Field label="Chave (.key) path"><Input value={form.interKeyPath || ''} onChange={(v) => set('interKeyPath', v)} /></Field>
            <Field label="Conta corrente"><Input value={form.interContaCorrente || ''} onChange={(v) => set('interContaCorrente', v)} /></Field>
          </div>
        </Section>

        {erro && (
          <div className="p-3 rounded-xl text-red-700 text-sm flex items-center gap-2"
               style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {erro}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                  style={{ border: '1px solid #E0DDD8' }}>
            Cancelar
          </button>
          <button type="submit" disabled={enviando}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-900 flex items-center justify-center gap-2"
                  style={{ background: enviando ? '#CC8C00' : '#FFAF06' }}>
            {enviando ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-600 mb-1 block">
        {label}{required && <span style={{ color: '#FFAF06' }}> *</span>}
      </span>
      {children}
    </label>
  )
}

function Input({ value, onChange, type = 'text', placeholder, required, maxLength }: {
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  required?: boolean
  maxLength?: number
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      required={required}
      maxLength={maxLength}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 bg-white rounded-lg text-sm outline-none focus:ring-2"
      style={{ border: '1px solid #E0DDD8', ['--tw-ring-color' as any]: '#FFD580' }}
    />
  )
}
