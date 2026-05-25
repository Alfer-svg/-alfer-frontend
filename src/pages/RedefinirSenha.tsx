import { FormEvent, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Loader2, Eye, EyeOff, Check, AlertCircle } from 'lucide-react'
import AlferLogo from '../components/AlferLogo'

const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://alfer-backend-production.up.railway.app/api/v1'

export default function RedefinirSenha() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('t') || ''
  const [senha, setSenha] = useState('')
  const [senha2, setSenha2] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    if (senha.length < 6) { setErro('A senha deve ter ao menos 6 caracteres.'); return }
    if (senha !== senha2) { setErro('As duas senhas precisam ser iguais.'); return }
    setLoading(true)
    try {
      await axios.post(`${API_URL}/auth/reset-password`, { token, novaSenha: senha })
      setSucesso(true)
    } catch (err: any) {
      setErro(err?.response?.data?.message || 'Não foi possível redefinir a senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #FFF8E6 0%, #F5F0EB 100%)' }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border" style={{ borderColor: '#F1EFE8' }}>
        <div className="flex justify-center mb-6">
          <AlferLogo size={80} />
        </div>

        {sucesso ? (
          <div className="text-center py-2">
            <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: '#DCFCE7' }}>
              <Check className="w-8 h-8" style={{ color: '#16A34A' }} strokeWidth={3} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Senha redefinida!</h1>
            <p className="text-gray-600 text-sm mb-6">Sua nova senha já está ativa. Use-a pra entrar no SIAGO.</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 rounded-xl text-sm font-bold text-gray-900"
              style={{ background: '#FFAF06' }}
            >
              Ir pro login →
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Redefinir senha</h1>
            <p className="text-sm text-gray-600 mb-5">Crie uma nova senha pra sua conta no SIAGO.</p>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Nova senha</label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required minLength={6}
                    className="w-full pl-4 pr-12 py-3 rounded-xl text-sm outline-none"
                    style={{ background: '#FAFAFA', border: '1.5px solid #E8E5E0' }}
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  >
                    {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Confirmar nova senha</label>
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha2}
                  onChange={(e) => setSenha2(e.target.value)}
                  required minLength={6}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: '#FAFAFA', border: '1.5px solid #E8E5E0' }}
                  placeholder="Digite de novo"
                />
              </div>

              {erro && (
                <div className="p-3 rounded-xl flex items-start gap-2 text-sm" style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FCA5A5' }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{erro}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full py-3 rounded-xl text-sm font-bold text-gray-900 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: '#FFAF06' }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Salvando…' : 'Redefinir senha'}
              </button>

              {!token && (
                <p className="text-xs text-center text-red-600">Link inválido — token ausente.</p>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  )
}
