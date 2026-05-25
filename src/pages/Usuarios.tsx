import { useEffect, useState, FormEvent } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Users, Plus, Edit, KeyRound, Power, X, Loader2, AlertCircle, ShieldCheck, ShieldOff, Check } from 'lucide-react'

type Usuario = {
  id: string
  nome: string
  email: string
  perfil: string
  ativo: boolean
  createdAt: string
  updatedAt: string
}

type PerfilInfo = { value: string; label: string; descricao: string }

const corPerfil = (p: string): { bg: string; text: string } => ({
  ADMIN:       { bg: '#FEE2E2', text: '#B91C1C' },
  GESTOR:      { bg: '#FEF3C7', text: '#92400E' },
  FINANCEIRO:  { bg: '#DBEAFE', text: '#1E40AF' },
  COMERCIAL:   { bg: '#FFEDD5', text: '#9A3412' },
  OPERACIONAL: { bg: '#D1FAE5', text: '#065F46' },
  VIEWER:      { bg: '#F3F4F6', text: '#374151' },
}[p] || { bg: '#F3F4F6', text: '#374151' })

export default function Usuarios() {
  const { usuario } = useAuth()
  const [lista, setLista] = useState<Usuario[]>([])
  const [perfis, setPerfis] = useState<PerfilInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [modal, setModal] = useState<{ tipo: 'novo' | 'editar' | 'senha'; alvo?: Usuario } | null>(null)

  const carregar = async () => {
    setLoading(true); setErro('')
    try {
      const [u, p] = await Promise.all([
        api.get('/usuarios'),
        api.get('/usuarios/perfis'),
      ])
      setLista(u.data); setPerfis(p.data)
    } catch (e: any) {
      setErro(e?.response?.data?.message || 'Erro ao carregar')
    } finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [])

  const podeGerenciar = usuario?.perfil === 'ADMIN'

  const toggleAtivo = async (u: Usuario) => {
    if (!podeGerenciar) return
    if (u.ativo && !confirm(`Desativar ${u.nome}? O acesso será bloqueado.`)) return
    try {
      if (u.ativo) {
        await api.delete(`/usuarios/${u.id}`)
      } else {
        await api.put(`/usuarios/${u.id}`, { ativo: true })
      }
      carregar()
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Falhou')
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6" style={{ color: '#FFAF06' }} /> Usuários
          </h1>
          <p className="text-sm text-gray-500 mt-1">Cadastre acessos e defina o nível de cada usuário do sistema.</p>
        </div>
        {podeGerenciar && (
          <button
            onClick={() => setModal({ tipo: 'novo' })}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white shadow-md hover:shadow-lg transition-all"
            style={{ background: '#FFAF06' }}
          >
            <Plus className="w-4 h-4" /> Novo usuário
          </button>
        )}
      </div>

      {erro && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-xl" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}>
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-700">{erro}</span>
        </div>
      )}

      {!podeGerenciar && (
        <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: '#FEF3C7', border: '1px solid #FCD34D', color: '#92400E' }}>
          Você tem apenas visualização. Pra criar/editar usuários, precisa ter perfil <strong>Administrador</strong>.
        </div>
      )}

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E0DDD8' }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#FFAF06' }} />
          </div>
        ) : lista.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">
            Nenhum usuário cadastrado ainda.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider" style={{ background: '#FAFAF8', color: '#7A7A7A' }}>
              <tr>
                <th className="text-left px-5 py-3 font-semibold">Nome</th>
                <th className="text-left px-5 py-3 font-semibold">E-mail</th>
                <th className="text-left px-5 py-3 font-semibold">Perfil</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
                {podeGerenciar && <th className="text-right px-5 py-3 font-semibold">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {lista.map((u) => {
                const cor = corPerfil(u.perfil)
                const isMe = u.id === usuario?.id
                return (
                  <tr key={u.id} className="border-t" style={{ borderColor: '#F1EFE8' }}>
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {u.nome}
                      {isMe && <span className="ml-2 text-xs text-gray-400">(você)</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-bold" style={{ background: cor.bg, color: cor.text }}>
                        {u.perfil}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {u.ativo ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                          <ShieldCheck className="w-3.5 h-3.5" /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
                          <ShieldOff className="w-3.5 h-3.5" /> Inativo
                        </span>
                      )}
                    </td>
                    {podeGerenciar && (
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button onClick={() => setModal({ tipo: 'editar', alvo: u })} title="Editar" className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => setModal({ tipo: 'senha', alvo: u })} title="Trocar senha" className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900">
                            <KeyRound className="w-4 h-4" />
                          </button>
                          {!isMe && (
                            <button
                              onClick={() => toggleAtivo(u)}
                              title={u.ativo ? 'Desativar' : 'Reativar'}
                              className="p-1.5 rounded hover:bg-gray-100"
                              style={{ color: u.ativo ? '#B91C1C' : '#16A34A' }}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <UsuarioModal
          tipo={modal.tipo}
          alvo={modal.alvo}
          perfis={perfis}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); carregar() }}
        />
      )}
    </div>
  )
}

function UsuarioModal({
  tipo, alvo, perfis, onClose, onSaved,
}: {
  tipo: 'novo' | 'editar' | 'senha'
  alvo?: Usuario
  perfis: PerfilInfo[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    nome: alvo?.nome || '',
    email: alvo?.email || '',
    perfil: alvo?.perfil || 'COMERCIAL',
    senha: '',
    senhaConfirma: '',
  })
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  const titulo = tipo === 'novo' ? 'Novo usuário' : tipo === 'editar' ? `Editar ${alvo?.nome}` : `Trocar senha — ${alvo?.nome}`

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')

    if (tipo === 'senha') {
      if (!form.senha || form.senha.length < 6) return setErro('A senha precisa de pelo menos 6 caracteres')
      if (form.senha !== form.senhaConfirma) return setErro('As senhas não conferem')
    } else {
      if (!form.nome.trim()) return setErro('Nome obrigatório')
      if (!/.+@.+/.test(form.email)) return setErro('E-mail inválido')
      if (tipo === 'novo') {
        if (!form.senha || form.senha.length < 6) return setErro('Senha precisa de pelo menos 6 caracteres')
        if (form.senha !== form.senhaConfirma) return setErro('As senhas não conferem')
      }
    }

    setEnviando(true)
    try {
      if (tipo === 'novo') {
        await api.post('/usuarios', { nome: form.nome, email: form.email, perfil: form.perfil, senha: form.senha })
      } else if (tipo === 'editar') {
        await api.put(`/usuarios/${alvo!.id}`, { nome: form.nome, email: form.email, perfil: form.perfil })
      } else {
        await api.put(`/usuarios/${alvo!.id}/senha`, { senha: form.senha })
      }
      onSaved()
    } catch (e: any) {
      setErro(e?.response?.data?.message || 'Erro ao salvar')
    } finally {
      setEnviando(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all'
  const inputStyle = { background: '#FAFAFA', border: '1.5px solid #E0DDD8', color: '#1A1C1E' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: 'calc(100vh - 2rem)' }} onClick={(e) => e.stopPropagation()}>
        {/* Header fixo */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <h2 className="font-display text-lg font-bold text-gray-900">{titulo}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={submit} className="flex-1 flex flex-col overflow-hidden">
          {/* Corpo scrollável */}
          <div className="flex-1 overflow-y-auto px-6 space-y-3 pb-2">
          {tipo !== 'senha' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nome completo</label>
                <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputCls} style={inputStyle} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">E-mail</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} style={inputStyle} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nível de acesso (perfil)</label>
                <div className="space-y-2">
                  {perfis.map((p) => (
                    <label
                      key={p.value}
                      className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${form.perfil === p.value ? 'ring-2' : ''}`}
                      style={{
                        background: form.perfil === p.value ? '#FFF7E5' : '#FAFAFA',
                        border: '1px solid #E0DDD8',
                        ...(form.perfil === p.value ? { ['--tw-ring-color' as any]: '#FFAF06' } : {}),
                      }}
                    >
                      <input
                        type="radio"
                        name="perfil"
                        value={p.value}
                        checked={form.perfil === p.value}
                        onChange={(e) => setForm({ ...form, perfil: e.target.value })}
                        className="mt-0.5"
                        style={{ accentColor: '#FFAF06' }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{p.label}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold" style={{ background: corPerfil(p.value).bg, color: corPerfil(p.value).text }}>{p.value}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{p.descricao}</p>
                      </div>
                      {form.perfil === p.value && <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#FFAF06' }} />}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {(tipo === 'novo' || tipo === 'senha') && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{tipo === 'senha' ? 'Nova senha' : 'Senha'}</label>
                <input type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} className={inputCls} style={inputStyle} placeholder="Mínimo 6 caracteres" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Confirmar senha</label>
                <input type="password" value={form.senhaConfirma} onChange={(e) => setForm({ ...form, senhaConfirma: e.target.value })} className={inputCls} style={inputStyle} required />
              </div>
            </>
          )}

            {erro && (
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}>
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700">{erro}</span>
              </div>
            )}
          </div>

          {/* Footer fixo com botões */}
          <div className="flex gap-2 px-6 py-4 border-t flex-shrink-0" style={{ borderColor: '#F1EFE8' }}>
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50" style={{ border: '1px solid #E0DDD8' }}>Cancelar</button>
            <button type="submit" disabled={enviando} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 shadow" style={{ background: enviando ? '#CC8C00' : '#FFAF06' }}>
              {enviando && <Loader2 className="w-4 h-4 animate-spin" />} Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
