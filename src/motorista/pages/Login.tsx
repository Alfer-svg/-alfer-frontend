import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthMotorista } from '../AuthMotoristaContext'
import { Truck } from 'lucide-react'
import AlferLogo from '../../components/AlferLogo'

export default function MotoristaLogin() {
  const { login } = useAuthMotorista()
  const navigate = useNavigate()
  const [matricula, setMatricula] = useState('')
  const [pin, setPin] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!matricula || !pin) {
      setErro('Informe matrícula e PIN')
      return
    }
    setLoading(true)
    try {
      await login(matricula.trim(), pin.trim())
      navigate('/m/veiculo')
    } catch (e: any) {
      setErro(e?.response?.data?.message || 'Falha no login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#FAF9F6]">
      <form onSubmit={submit} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex mb-4">
            <AlferLogo size={120} />
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
            <Truck className="w-4 h-4" />
            <span>App do Motorista</span>
          </div>
        </div>

        <label className="block text-xs font-medium text-gray-600 mb-1">Matrícula</label>
        <input
          type="text"
          inputMode="text"
          autoComplete="username"
          value={matricula}
          onChange={(e) => setMatricula(e.target.value)}
          placeholder="Ex: M001"
          className="w-full px-4 py-3 bg-white rounded-xl text-base outline-none mb-4"
          style={{ border: '1px solid #E0DDD8' }}
        />

        <label className="block text-xs font-medium text-gray-600 mb-1">PIN</label>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          placeholder="••••"
          className="w-full px-4 py-3 bg-white rounded-xl text-2xl text-center tracking-widest outline-none mb-4"
          style={{ border: '1px solid #E0DDD8' }}
        />

        {erro && (
          <div className="text-red-600 text-sm mb-4 text-center">{erro}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-semibold text-gray-900 text-base disabled:opacity-50 active:opacity-80"
          style={{ background: '#FFAF06' }}
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>

        <p className="text-xs text-gray-400 text-center mt-6">
          Se esqueceu o PIN, fale com o gestor.
        </p>
      </form>
    </div>
  )
}
