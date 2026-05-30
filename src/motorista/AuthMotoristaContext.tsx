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

// Lê o exp (segundos) do JWT sem validar assinatura — só pra saber se já venceu.
// O backend expira o token do motorista todo dia, forçando login diário.
function tokenExpirado(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (!payload?.exp) return false
    return payload.exp * 1000 <= Date.now()
  } catch {
    return true // token malformado = tratar como inválido
  }
}

export function AuthMotoristaProvider({ children }: { children: ReactNode }) {
  const [motorista, setMotorista] = useState<Motorista | null>(null)
  const [caminhao, setCaminhao] = useState<Caminhao | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('alfer_motorista_token')
    const m = localStorage.getItem('alfer_motorista_user')
    const c = localStorage.getItem('alfer_motorista_caminhao')
    if (t && m && !tokenExpirado(t)) {
      setToken(t)
      setMotorista(JSON.parse(m))
      if (c) setCaminhao(JSON.parse(c))
    } else if (t) {
      // Token vencido (novo dia) — limpa pra cair na tela de login.
      localStorage.removeItem('alfer_motorista_token')
      localStorage.removeItem('alfer_motorista_user')
      localStorage.removeItem('alfer_motorista_caminhao')
    }
    setLoading(false)
  }, [])

  const login = async (matricula: string, pin: string) => {
    const { data } = await apiMotorista.post('/auth/motorista/login', { matricula, pin })
    localStorage.setItem('alfer_motorista_token', data.token)
    localStorage.setItem('alfer_motorista_user', JSON.stringify(data.motorista))
    if (data.caminhao) localStorage.setItem('alfer_motorista_caminhao', JSON.stringify(data.caminhao))
    // Sinaliza pro Layout exibir a dica de segurança logo após o login.
    sessionStorage.setItem('alfer_motorista_dica', '1')
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
