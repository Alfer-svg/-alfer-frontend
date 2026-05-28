import axios from 'axios'

const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://alfer-backend-production.up.railway.app/api/v1'

const apiMotorista = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

apiMotorista.interceptors.request.use((config) => {
  const token = localStorage.getItem('alfer_motorista_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiMotorista.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('alfer_motorista_token')
      localStorage.removeItem('alfer_motorista_user')
      localStorage.removeItem('alfer_motorista_caminhao')
      if (!window.location.pathname.startsWith('/m/login')) {
        window.location.href = '/m/login'
      }
    }
    return Promise.reject(err)
  }
)

export default apiMotorista
