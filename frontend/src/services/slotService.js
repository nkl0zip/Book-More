import api from './api'

export const slotService = {
  // Public
  getByProvider: (providerId, params = {}) =>
    api.get('/slots', { params: { providerId, ...params } }),
  getById: (id) => api.get(`/slots/${id}`),

  // Authenticated provider
  getMine:     (params = {}) => api.get('/slots/mine/list', { params }),
  create:      (data)        => api.post('/slots', data),
  update:      (id, data)    => api.patch(`/slots/${id}`, data),
  remove:      (id)          => api.delete(`/slots/${id}`),
  bulkRemove:  (ids)         => api.delete('/slots/bulk', { data: { ids } }),
}
