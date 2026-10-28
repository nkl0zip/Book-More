import api from './api'

export const serviceService = {
  // Public
  getByProvider: (providerId) => api.get('/services', { params: { providerId } }),
  getById:       (id) => api.get(`/services/${id}`),

  // Authenticated provider
  getMine:   ()     => api.get('/services/mine/list'),
  create:    (data) => api.post('/services', data),
  update:    (id, data) => api.patch(`/services/${id}`, data),
  remove:    (id) => api.delete(`/services/${id}`),
}
