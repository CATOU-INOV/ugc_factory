// Instance Axios configurée pour l'API UGC Factory
// Intercepteur automatique : ajoute le token JWT à chaque requête

import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Intercepteur de requête : injecte le token JWT
api.interceptors.request.use(config => {
  const token = localStorage.getItem('ugcfactory_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Intercepteur de réponse : redirige vers /login si token expiré
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ugcfactory_token')
      localStorage.removeItem('ugcfactory_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
