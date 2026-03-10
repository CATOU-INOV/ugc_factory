import api from './axios.js'

export const getCampaigns = () => api.get('/campaigns').then(r => r.data)
export const getCampaignById = (id) => api.get(`/campaigns/${id}`).then(r => r.data)
export const getCampaignPublic = (slug) => api.get(`/campaigns/public/${slug}`).then(r => r.data)
export const createCampaign = (data) => api.post('/campaigns', data).then(r => r.data)
export const updateCampaign = (id, data) => api.put(`/campaigns/${id}`, data).then(r => r.data)
export const closeCampaign = (id) => api.put(`/campaigns/${id}/close`).then(r => r.data)
export const deleteCampaign = (id) => api.delete(`/campaigns/${id}`).then(r => r.data)

// Photos de brief
export const uploadCampaignPhotos = (campaignId, files) => {
  const form = new FormData()
  for (const file of files) form.append('photos', file)
  return api.post(`/campaigns/${campaignId}/photos`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
}
export const deleteCampaignPhoto = (campaignId, photoId) =>
  api.delete(`/campaigns/${campaignId}/photos/${photoId}`).then(r => r.data)
// URL publique — pas d'auth requise, utilisable directement dans <img src>
export const getCampaignPhotoUrl = (campaignId, photoId) =>
  `/api/campaigns/${campaignId}/photos/${photoId}`
