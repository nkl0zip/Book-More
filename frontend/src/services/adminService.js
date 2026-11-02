import api from './api'

export const adminService = {
  // Bootstrap
  createAdmin: (data) => api.post('/admin/create', data),

  // Stats
  getStats: () => api.get('/admin/stats'),

  // Users
  getUsers: (params = {}) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),

  // Appointments
  getAppointments: (params = {}) => api.get('/admin/appointments', { params }),
  deleteAppointment: (id) => api.delete(`/admin/appointments/${id}`),

  // Slots
  getSlots: (params = {}) => api.get('/admin/slots', { params }),
  deleteSlot: (id) => api.delete(`/admin/slots/${id}`),

  // Services
  getServices: (params = {}) => api.get('/admin/services', { params }),
  updateService: (id, data) => api.patch(`/admin/services/${id}`, data),
  deleteService: (id) => api.delete(`/admin/services/${id}`),
}
