import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '../services/api'

interface Usuario {
  id: string
  nome: string
  email: string
  perfil: string
}

interface AuthContextType {
  usuario: Usuario | null
  token: string | null
  login: (email: string, senha: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('alfer_token')
    const savedUser = localStorage.getItem('alfer_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUsuario(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email: string, senha: string) => {
    const { data } = await api.post('/auth/login', { email, senha })
    localStorage.setItem('alfer_token', data.token)
    localStorage.setItem('alfer_user', JSON.stringify(data.usuario))
    setToken(data.token)
    setUsuario(data.usuario)
  }

  const logout = () => {
    localStorage.removeItem('alfer_token')
    localStorage.removeItem('alfer_user')
    setToken(null)
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
