import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://alfer-backend-production.up.railway.app/api/v1'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('alfer_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('alfer_token')
      localStorage.removeItem('alfer_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
