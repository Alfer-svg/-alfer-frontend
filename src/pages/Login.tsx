import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AlertCircle, Loader2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('admin@alferequipamentos.com.br')
  const [senha, setSenha] = useState('alfer2026')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

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
    <div className="min-h-screen flex" style={{ background: '#1A1C1E' }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16" style={{ background: '#FFAF06' }}>
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#FFAF06">
                <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.5L20 8.5v7l-8 4-8-4v-7L12 4.5z"/>
              </svg>
            </div>
            <span className="font-display text-white text-xl font-bold">Alfer Equipamentos</span>
          </div>
          <h1 className="font-display text-white text-5xl font-bold leading-tight mb-6">
            Sistema de<br />Gestão<br />Operacional
          </h1>
          <p className="text-orange-100 text-lg leading-relaxed max-w-sm">
            Controle total da sua operação — contratos, frota, financeiro e logística em um único lugar.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Módulos', value: '9' },
            { label: 'Endpoints', value: '40+' },
            { label: 'Pernambuco', value: 'Brasil' },
          ].map((item) => (
            <div key={item.label} className="bg-orange-600/40 rounded-xl p-4">
              <div className="font-display text-white text-2xl font-bold">{item.value}</div>
              <div className="text-orange-100 text-sm">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#FFAF06' }}>
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white">
                <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.5L20 8.5v7l-8 4-8-4v-7L12 4.5z"/>
              </svg>
            </div>
            <span className="font-display text-white text-xl font-bold">Alfer Equipamentos</span>
          </div>

          <div className="mb-10">
            <h2 className="font-display text-white text-3xl font-bold mb-2">Bem-vindo</h2>
            <p className="text-gray-400">Entre com suas credenciais para acessar o sistema.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                style={{ background: '#2A2C2E', border: '1px solid #3A3C3E' }}
                onFocus={(e) => e.target.style.borderColor = '#FFAF06'}
                onBlur={(e) => e.target.style.borderColor = '#3A3C3E'}
                placeholder="seu@email.com.br"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                style={{ background: '#2A2C2E', border: '1px solid #3A3C3E' }}
                onFocus={(e) => e.target.style.borderColor = '#FFAF06'}
                onBlur={(e) => e.target.style.borderColor = '#3A3C3E'}
                placeholder="••••••••"
              />
            </div>

            {erro && (
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#3A1A1A', border: '1px solid #8B2020' }}>
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-red-300 text-sm">{erro}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2"
              style={{ background: loading ? '#B85008' : '#FFAF06' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Entrando...
                </>
              ) : 'Entrar no sistema'}
            </button>
          </form>

          <p className="text-center text-gray-600 text-xs mt-8">
            Alfer Equipamentos · Pernambuco, Brasil
          </p>
        </div>
      </div>
    </div>
  )
}
