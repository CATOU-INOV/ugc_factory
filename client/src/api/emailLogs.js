import api from './axios.js'

export const getEmailLogs = (params) =>
  api.get('/email-logs', { params }).then(r => r.data)
