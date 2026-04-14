import api from './axios.js'

export const getSubmissions = (campaignId) =>
  api.get(`/submissions/campaign/${campaignId}`).then(r => r.data)
  // r.data = { submissions, total, limit, offset }

export const createSubmission = (campaignId, formData, config = {}) =>
  api.post(`/submissions/campaign/${campaignId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...config,
  }).then(r => r.data)

export const updateSubmissionStatus = (id, status) =>
  api.put(`/submissions/${id}/status`, { status }).then(r => r.data)

export const getVideoUrl = (id) => `/api/submissions/${id}/video`
export const getVideoDownloadUrl = (id) => `/api/submissions/${id}/video?download=true`
