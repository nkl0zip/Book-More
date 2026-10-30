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

  // Shared
  getById: (id)              => api.get(`/appointments/${id}`),
}
