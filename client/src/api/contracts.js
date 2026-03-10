import api from './axios.js'

export const getContracts = (params) =>
  api.get('/contracts', { params }).then(r => r.data)

export const getContractByToken = (token) =>
  api.get(`/contracts/sign/${token}`).then(r => r.data)

export const signContract = (token) =>
  api.post(`/contracts/sign/${token}`).then(r => r.data)

export const getContractPdfUrl = (id) => `/api/contracts/${id}/pdf`
