import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { Check, AlertCircle, Loader2 } from 'lucide-react'
import AlferLogo from '../components/AlferLogo'

const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://alfer-backend-production.up.railway.app/api/v1'

type Resultado = {
  jaConfirmado: boolean
  confirmadoEm: string
  cliente: string
  numero: string
  valor: string
  venc: string
}

export default function ConfirmarRecebimento() {
  const [params] = useSearchParams()
  const token = params.get('t') || ''
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  useEffect(() => {
    if (!token) {
      setErro('Link inválido — token ausente.')
      setLoading(false)
      return
    }
    axios.get(`${API_URL}/public/email/confirmar/${token}`)
      .then((r) => setResultado(r.data))
      .catch((e) => setErro(e?.response?.data?.message || 'Não foi possível confirmar o recebimento. Verifique o link ou entre em contato.'))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #FFF8E6 0%, #F5F0EB 100%)' }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border" style={{ borderColor: '#F1EFE8' }}>
        <div className="flex justify-center mb-6">
          <AlferLogo size={80} />
        </div>

        {loading && (
          <div className="text-center py-6">
            <Loader2 className="w-10 h-10 mx-auto animate-spin" style={{ color: '#FFAF06' }} />
            <p className="mt-4 text-gray-600 text-sm">Confirmando seu recebimento…</p>
          </div>
        )}

        {!loading && erro && (
          <div className="text-center py-4">
            <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: '#FEE2E2' }}>
              <AlertCircle className="w-7 h-7" style={{ color: '#DC2626' }} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Não foi possível confirmar</h1>
            <p className="text-gray-600 text-sm">{erro}</p>
            <p className="text-gray-500 text-xs mt-6">
              Em caso de dúvida, entre em contato:<br />
              <a href="mailto:financeiro@alferequipamentos.com.br" className="text-gray-700 font-medium">financeiro@alferequipamentos.com.br</a>
            </p>
          </div>
        )}

        {!loading && resultado && (
          <div className="text-center py-2">
            <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: '#DCFCE7' }}>
              <Check className="w-8 h-8" style={{ color: '#16A34A' }} strokeWidth={3} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {resultado.jaConfirmado ? 'Recebimento já confirmado' : 'Recebimento confirmado!'}
            </h1>
            <p className="text-gray-600 text-sm mb-6">
              {resultado.jaConfirmado
                ? `Confirmado em ${new Date(resultado.confirmadoEm).toLocaleString('pt-BR')}.`
                : 'Obrigado pela confirmação. A Alfer já registrou seu recebimento.'}
            </p>

            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Cliente</span>
                <span className="text-gray-900 font-medium">{resultado.cliente}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fatura</span>
                <span className="text-gray-900 font-medium">#{resultado.numero}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Valor</span>
                <span className="text-gray-900 font-medium">{resultado.valor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Vencimento</span>
                <span className="text-gray-900 font-medium">{resultado.venc}</span>
              </div>
            </div>

            <p className="text-gray-500 text-xs mt-6">
              Alfer Equipamentos<br />
              <a href="mailto:financeiro@alferequipamentos.com.br" className="text-gray-700">financeiro@alferequipamentos.com.br</a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
