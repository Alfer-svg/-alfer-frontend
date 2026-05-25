import { useEffect, useState, FormEvent } from 'react'
import api from '../services/api'
import { Modal } from '../components/Modal'
import { Building2, Plus, Pencil, Trash2, AlertCircle, Loader2, Star, Power, X } from 'lucide-react'

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

  const salvar = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!modal) return
    try {
      if (modal.id) {
        await api.put(`/emissores/${modal.id}`, modal)
      } else {
        await api.post('/emissores', modal)
      }
      setModal(null)
      load()
    } catch (err: any) {
      setErro(err?.response?.data?.message || 'Erro ao salvar')
    }
  }

  const excluir = async (em: Emissor) => {
    if (!confirm(`Excluir o emissor "${em.razaoSocial}"?`)) return
    try {
      await api.delete(`/emissores/${em.id}`)
      load()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erro ao excluir')
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-orange-500" />
            Emissores (CNPJs)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Empresas que emitem contratos, faturas e boletos. O orçamento sempre sai como o emissor padrão;
            na aprovação você escolhe em nome de qual emissor o contrato será gerado.
          </p>
        </div>
        <button
          onClick={() => setModal({ ...EMPTY })}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow-sm"
        >
          <Plus className="w-4 h-4" /> Novo emissor
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : (
        <div className="grid gap-3">
          {itens.map((em) => (
            <div
              key={em.id}
              className={`bg-white rounded-lg border ${em.padrao ? 'border-orange-300' : 'border-gray-200'} p-4 flex items-start justify-between`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">{em.razaoSocial}</span>
                  {em.padrao && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" /> Padrão
                    </span>
                  )}
                  {!em.ativo && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Power className="w-3 h-3" /> Inativo
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  <div>CNPJ: <span className="font-mono">{em.cnpj}</span> {em.ie ? `· IE ${em.ie}` : ''}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {em.logradouro}, {em.numero}{em.complemento ? ` · ${em.complemento}` : ''} · {em.bairro}, {em.cidade}/{em.uf} · CEP {em.cep}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {em.telefone} · {em.email} · Fatura inicia em <b>{em.faturaInicio}</b>
                    {em.interClientId ? ' · Inter: ✓ configurado' : ' · Inter: pendente'}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 ml-3">
                <button
                  onClick={() => setModal({ ...em })}
                  className="text-gray-500 hover:text-orange-500 p-1.5"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                {!em.padrao && (
                  <button
                    onClick={() => excluir(em)}
                    className="text-gray-500 hover:text-red-500 p-1.5"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal onClose={() => setModal(null)} maxWidth="max-w-3xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-gray-900">
              {modal.id ? 'Editar emissor' : 'Novo emissor'}
            </h2>
            <button type="button" onClick={() => setModal(null)}>
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <form onSubmit={salvar} className="space-y-4">
            {erro && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-3 py-2 rounded">
                <AlertCircle className="w-4 h-4" /> {erro}
              </div>
            )}

            <fieldset className="border rounded-lg p-3 space-y-2">
              <legend className="text-xs font-semibold text-gray-600 px-1">Dados cadastrais</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Razão social" required>
                  <input className="input" value={modal.razaoSocial || ''}
                    onChange={(e) => setModal({ ...modal, razaoSocial: e.target.value })} required />
                </Field>
                <Field label="Nome fantasia">
                  <input className="input" value={modal.nomeFantasia || ''}
                    onChange={(e) => setModal({ ...modal, nomeFantasia: e.target.value })} />
                </Field>
                <Field label="CNPJ" required>
                  <input className="input" value={modal.cnpj || ''}
                    onChange={(e) => setModal({ ...modal, cnpj: e.target.value })} required />
                </Field>
                <Field label="Inscrição estadual">
                  <input className="input" placeholder="ISENTO se for ME" value={modal.ie || ''}
                    onChange={(e) => setModal({ ...modal, ie: e.target.value })} />
                </Field>
              </div>
            </fieldset>

            <fieldset className="border rounded-lg p-3 space-y-2">
              <legend className="text-xs font-semibold text-gray-600 px-1">Endereço</legend>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <Field label="Logradouro">
                    <input className="input" value={modal.logradouro || ''}
                      onChange={(e) => setModal({ ...modal, logradouro: e.target.value })} />
                  </Field>
                </div>
                <Field label="Número">
                  <input className="input" value={modal.numero || ''}
                    onChange={(e) => setModal({ ...modal, numero: e.target.value })} />
                </Field>
                <Field label="Complemento">
                  <input className="input" value={modal.complemento || ''}
                    onChange={(e) => setModal({ ...modal, complemento: e.target.value })} />
                </Field>
                <Field label="Bairro">
                  <input className="input" value={modal.bairro || ''}
                    onChange={(e) => setModal({ ...modal, bairro: e.target.value })} />
                </Field>
                <Field label="Cidade">
                  <input className="input" value={modal.cidade || ''}
                    onChange={(e) => setModal({ ...modal, cidade: e.target.value })} />
                </Field>
                <Field label="UF">
                  <input className="input" maxLength={2} value={modal.uf || ''}
                    onChange={(e) => setModal({ ...modal, uf: e.target.value.toUpperCase() })} />
                </Field>
                <Field label="CEP">
                  <input className="input" value={modal.cep || ''}
                    onChange={(e) => setModal({ ...modal, cep: e.target.value })} />
                </Field>
              </div>
            </fieldset>

            <fieldset className="border rounded-lg p-3 space-y-2">
              <legend className="text-xs font-semibold text-gray-600 px-1">Contato e PDF</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Telefone">
                  <input className="input" value={modal.telefone || ''}
                    onChange={(e) => setModal({ ...modal, telefone: e.target.value })} />
                </Field>
                <Field label="E-mail">
                  <input className="input" type="email" value={modal.email || ''}
                    onChange={(e) => setModal({ ...modal, email: e.target.value })} />
                </Field>
                <Field label="Logo (path ou URL)">
                  <input className="input" placeholder="logos/empresa.png" value={modal.logoUrl || ''}
                    onChange={(e) => setModal({ ...modal, logoUrl: e.target.value })} />
                </Field>
                <Field label="Fatura inicia em">
                  <input className="input" type="number" value={modal.faturaInicio ?? 1}
                    onChange={(e) => setModal({ ...modal, faturaInicio: Number(e.target.value) })} />
                </Field>
              </div>
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!modal.padrao}
                    onChange={(e) => setModal({ ...modal, padrao: e.target.checked })} />
                  Emissor padrão (usado quando nada é escolhido)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={modal.ativo !== false}
                    onChange={(e) => setModal({ ...modal, ativo: e.target.checked })} />
                  Ativo
                </label>
              </div>
            </fieldset>

            <fieldset className="border rounded-lg p-3 space-y-2">
              <legend className="text-xs font-semibold text-gray-600 px-1">
                Credenciais Banco Inter (boleto/Pix) — opcional
              </legend>
              <p className="text-xs text-gray-500 mb-2">
                Cada emissor precisa da própria conta no Inter PJ — o beneficiário do boleto é sempre o titular da conta.
                Pode deixar em branco e plugar depois.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Client ID">
                  <input className="input" value={modal.interClientId || ''}
                    onChange={(e) => setModal({ ...modal, interClientId: e.target.value })} />
                </Field>
                <Field label="Client Secret">
                  <input className="input" type="password" value={modal.interClientSecret || ''}
                    onChange={(e) => setModal({ ...modal, interClientSecret: e.target.value })} />
                </Field>
                <Field label="Cert (.crt) — path no servidor">
                  <input className="input" value={modal.interCertPath || ''}
                    onChange={(e) => setModal({ ...modal, interCertPath: e.target.value })} />
                </Field>
                <Field label="Chave (.key) — path no servidor">
                  <input className="input" value={modal.interKeyPath || ''}
                    onChange={(e) => setModal({ ...modal, interKeyPath: e.target.value })} />
                </Field>
                <Field label="Conta corrente">
                  <input className="input" value={modal.interContaCorrente || ''}
                    onChange={(e) => setModal({ ...modal, interContaCorrente: e.target.value })} />
                </Field>
              </div>
            </fieldset>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-gray-700 rounded hover:bg-gray-100">
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">
                Salvar
              </button>
            </div>
          </form>
        </Modal>
      )}

      <style>{`
        .input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.875rem; }
        .input:focus { outline: none; border-color: #f97316; box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15); }
      `}</style>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-700 mb-1 block">
        {label}{required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  )
}
