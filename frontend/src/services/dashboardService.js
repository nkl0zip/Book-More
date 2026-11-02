import api from './api'

export const dashboardService = {
  getProviderDashboard: () => api.get('/dashboard/provider'),
}
