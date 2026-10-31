import api from './api'

export const appointmentService = {
  // Patient
  book: (data)               => api.post('/appointments', data),
  getMine: (params = {})     => api.get('/appointments/mine', { params }),
  reschedule: (id, data)     => api.patch(`/appointments/${id}/reschedule`, data),
  cancel: (id, data = {})    => api.patch(`/appointments/${id}/cancel`, data),

  // Provider
  getProviderList: (params = {}) => api.get('/appointments/provider', { params }),
  complete: (id)             => api.patch(`/appointments/${id}/complete`, {}),
  providerReschedule: (id, data) => api.patch(`/appointments/${id}/provider-reschedule`, data),

  // Shared
  getById: (id)              => api.get(`/appointments/${id}`),
  getHistory: (id)           => api.get(`/appointments/${id}/history`),
  getCancelPolicy: (id)      => api.get(`/appointments/${id}/cancel-policy`),
  getStats: ()               => api.get('/appointments/stats'),
}
