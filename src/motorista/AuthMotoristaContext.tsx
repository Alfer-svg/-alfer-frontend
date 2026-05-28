import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import apiMotorista from './api'

interface Motorista {
  id: string
  nome: string
  matricula: string
}

interface Caminhao {
  id: string
  codigo: string
  placa?: string | null
  tipo: string
  modelo: string
}

interface CtxValue {
  motorista: Motorista | null
  caminhao: Caminhao | null
  token: string | null
  login: (matricula: string, pin: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const Ctx = createContext<CtxValue>({} as CtxValue)

export function AuthMotoristaProvider({ children }: { children: ReactNode }) {
  const [motorista, setMotorista] = useState<Motorista | null>(null)
  const [caminhao, setCaminhao] = useState<Caminhao | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('alfer_motorista_token')
    const m = localStorage.getItem('alfer_motorista_user')
    const c = localStorage.getItem('alfer_motorista_caminhao')
    if (t && m) {
      setToken(t)
      setMotorista(JSON.parse(m))
      if (c) setCaminhao(JSON.parse(c))
    }
    setLoading(false)
  }, [])

  const login = async (matricula: string, pin: string) => {
    const { data } = await apiMotorista.post('/auth/motorista/login', { matricula, pin })
    localStorage.setItem('alfer_motorista_token', data.token)
    localStorage.setItem('alfer_motorista_user', JSON.stringify(data.motorista))
    if (data.caminhao) localStorage.setItem('alfer_motorista_caminhao', JSON.stringify(data.caminhao))
    setToken(data.token)
    setMotorista(data.motorista)
    setCaminhao(data.caminhao || null)
  }

  const logout = () => {
    localStorage.removeItem('alfer_motorista_token')
    localStorage.removeItem('alfer_motorista_user')
    localStorage.removeItem('alfer_motorista_caminhao')
    setToken(null)
    setMotorista(null)
    setCaminhao(null)
  }

  return (
    <Ctx.Provider value={{ motorista, caminhao, token, login, logout, loading }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuthMotorista = () => useContext(Ctx)
