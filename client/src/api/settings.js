import api from './axios.js'

export const getAnnualBudget = () =>
  api.get('/settings/annual-budget').then(r => r.data)

export const setAnnualBudget = (value) =>
  api.put('/settings/annual-budget', { value }).then(r => r.data)
