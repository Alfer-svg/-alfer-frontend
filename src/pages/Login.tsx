import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AlertCircle, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('admin@alferequipamentos.com.br')
  const [senha, setSenha] = useState('alfer2026')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [esqueciOpen, setEsqueciOpen] = useState(false)
  const [esqueciEmail, setEsqueciEmail] = useState('')
  const [esqueciLoading, setEsqueciLoading] = useState(false)
  const [esqueciMsg, setEsqueciMsg] = useState<string | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const enviarEsqueci = async (e: FormEvent) => {
    e.preventDefault()
    setEsqueciLoading(true)
    setEsqueciMsg(null)
    try {
      const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://alfer-backend-production.up.railway.app/api/v1'
      const r = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: esqueciEmail }),
      })
      const data = await r.json().catch(() => ({}))
      setEsqueciMsg(data.message || 'Se este e-mail tem acesso, você receberá um link em instantes.')
    } catch {
      setEsqueciMsg('Não foi possível processar o pedido. Tente novamente.')
    } finally {
      setEsqueciLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      await login(email, senha)
      navigate('/dashboard')
    } catch {
      setErro('E-mail ou senha incorretos. Verifique e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12" style={{ background: 'linear-gradient(135deg, #FAFAFA 0%, #FFFFFF 50%, #FCE9C0 100%)' }}>

      {/* Blobs decorativos amarelos (mesma vibe do site institucional) */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full blur-3xl" style={{ background: 'rgba(255, 175, 6, 0.18)' }}></div>
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl" style={{ background: 'rgba(255, 175, 6, 0.15)' }}></div>
      <div className="pointer-events-none absolute top-1/3 right-1/4 w-72 h-72 rounded-full blur-3xl" style={{ background: 'rgba(255, 175, 6, 0.08)' }}></div>

      {/* Pattern de pontos sutil */}
      <div className="pointer-events-none absolute inset-0 opacity-40" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255, 175, 6, 0.18) 1.2px, transparent 1.2px)',
        backgroundSize: '28px 28px',
      }}></div>

      {/* Bandeiras no canto superior direito */}
      <div className="absolute top-6 right-6 flex flex-col gap-1 z-10" title="Empresa brasileira · Pernambuco">
        <img src="/bandeira-br.svg" alt="Brasil" width={36} height={26} className="rounded shadow-md" style={{ border: '1px solid rgba(0,0,0,0.06)' }} />
        <img src="/bandeira-pe.svg" alt="Pernambuco" width={36} height={26} className="rounded shadow-md" style={{ border: '1px solid rgba(0,0,0,0.06)' }} />
      </div>

      <div className="relative w-full max-w-5xl grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

        {/* Lado Esquerdo — Branding */}
        <div className="text-center lg:text-left">
          <div className="inline-flex lg:flex justify-center lg:justify-start mb-8">
            <div className="bg-white rounded-3xl shadow-xl p-1.5 inline-flex items-center justify-center" style={{ width: 224, height: 224, border: '1px solid rgba(0,0,0,0.04)' }}>
              <img src="/logo-alfer-vertical.png" alt="Alfer Equipamentos" className="w-full h-full object-contain" />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 rounded-full" style={{ background: 'rgba(255, 175, 6, 0.15)' }}>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#B87800' }}>Sistema de Gestão</span>
          </div>

          <h1 className="font-display text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-3" style={{ color: '#1A1C1E' }}>
            SIAGO
          </h1>
          <p className="text-xl md:text-2xl font-semibold mb-4" style={{ color: '#FFAF06' }}>
            Sistema Integrado Alfer de Gestão Operacional
          </p>
          <p className="text-base md:text-lg leading-relaxed max-w-md mx-auto lg:mx-0" style={{ color: '#555555' }}>
            Contratos, frota, financeiro, locações e logística em um único lugar — o controle da operação Alfer na palma da mão.
          </p>
        </div>

        {/* Lado Direito — Formulário */}
        <div className="w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10" style={{ border: '1px solid rgba(0,0,0,0.04)' }}>
            <div className="mb-7">
              <h2 className="font-display text-2xl md:text-3xl font-extrabold mb-1" style={{ color: '#1A1C1E' }}>Bem-vindo de volta</h2>
              <p className="text-sm" style={{ color: '#7A7A7A' }}>Entre com suas credenciais pra acessar o sistema.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#555555' }}>E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ background: '#FAFAFA', border: '1.5px solid #E8E5E0', color: '#1A1C1E' }}
                  onFocus={(e) => { e.target.style.borderColor = '#FFAF06'; e.target.style.background = '#FFFFFF' }}
                  onBlur={(e) => { e.target.style.borderColor = '#E8E5E0'; e.target.style.background = '#FAFAFA' }}
                  placeholder="seu@email.com.br"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#555555' }}>Senha</label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    className="w-full pl-4 pr-12 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ background: '#FAFAFA', border: '1.5px solid #E8E5E0', color: '#1A1C1E' }}
                    onFocus={(e) => { e.target.style.borderColor = '#FFAF06'; e.target.style.background = '#FFFFFF' }}
                    onBlur={(e) => { e.target.style.borderColor = '#E8E5E0'; e.target.style.background = '#FAFAFA' }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha((v) => !v)}
                    aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {erro && (
                <div className="flex items-start gap-2 p-3 rounded-xl animate-fade-in" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5' }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
                  <span className="text-sm" style={{ color: '#B91C1C' }}>{erro}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                style={{ background: loading ? '#CC8C00' : '#FFAF06' }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar no sistema
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setEsqueciOpen(true)}
                  className="text-xs font-medium hover:underline"
                  style={{ color: '#666' }}
                >
                  Esqueci minha senha
                </button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between text-xs" style={{ color: '#7A7A7A' }}>
              <span>Alfer Equipamentos · Pernambuco/BR</span>
              <a href="https://alferequipamentos.com" target="_blank" rel="noopener" className="font-semibold transition-colors" style={{ color: '#FFAF06' }} onMouseEnter={(e) => e.currentTarget.style.color = '#CC8C00'} onMouseLeave={(e) => e.currentTarget.style.color = '#FFAF06'}>
                Visite o site →
              </a>
            </div>
          </div>
        </div>

      </div>

      {esqueciOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setEsqueciOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-gray-900">Esqueci minha senha</h2>
              <button onClick={() => setEsqueciOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <span className="text-gray-500 text-xl leading-none">&times;</span>
              </button>
            </div>

            {esqueciMsg ? (
              <div className="py-4">
                <div className="p-4 rounded-xl text-sm" style={{ background: '#EAF7E6', color: '#27500A', border: '1px solid #C5DDA2' }}>
                  {esqueciMsg}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Confere sua caixa de entrada (e o spam) nos próximos minutos. O link é válido por 1 hora.
                </p>
                <button
                  onClick={() => { setEsqueciOpen(false); setEsqueciMsg(null); setEsqueciEmail('') }}
                  className="w-full mt-5 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                  style={{ border: '1px solid #E0DDD8' }}
                >
                  Fechar
                </button>
              </div>
            ) : (
              <form onSubmit={enviarEsqueci}>
                <p className="text-sm text-gray-600 mb-4">
                  Digite o e-mail da sua conta. Se você for <strong>Administrador</strong> ou <strong>Gestor</strong>, vamos enviar um link de redefinição.
                </p>
                <input
                  type="email" required
                  value={esqueciEmail}
                  onChange={(e) => setEsqueciEmail(e.target.value)}
                  placeholder="seu@email.com.br"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: '#FAFAFA', border: '1.5px solid #E8E5E0' }}
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-2">
                  Demais perfis devem solicitar reset ao administrador do sistema.
                </p>
                <div className="flex gap-2 mt-5">
                  <button
                    type="button"
                    onClick={() => setEsqueciOpen(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                    style={{ border: '1px solid #E0DDD8' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={esqueciLoading || !esqueciEmail}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-900 disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: '#FFAF06' }}
                  >
                    {esqueciLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Enviar link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
