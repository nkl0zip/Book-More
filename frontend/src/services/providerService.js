import api from './api'

export const providerService = {
  // Public
  getAll: (params = {}) => api.get('/providers', { params }),
  getById: (id) => api.get(`/providers/${id}`),

  // Authenticated provider only
  getMyProfile: () => api.get('/providers/me/profile'),
  updateMyProfile: (data) => api.patch('/providers/me/profile', data),
  deactivateAccount: () => api.patch('/providers/me/deactivate'),
}
