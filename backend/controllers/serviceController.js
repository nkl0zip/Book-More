const Service = require('../models/Service')

// GET /api/services?providerId=  (public — list a provider's active services)
const getServicesByProvider = async (req, res) => {
  const { providerId } = req.query
  if (!providerId) {
    return res.status(400).json({ success: false, message: 'providerId query param is required' })
  }
  const services = await Service.find({ provider: providerId, isActive: true }).sort({ name: 1 })
  res.json({ success: true, count: services.length, data: services })
}

// GET /api/services/mine  (authenticated provider — own services incl. inactive)
const getMyServices = async (req, res) => {
  const services = await Service.find({ provider: req.user._id }).sort({ createdAt: -1 })
  res.json({ success: true, count: services.length, data: services })
}

// GET /api/services/:id  (public — single service)
const getServiceById = async (req, res) => {
  const service = await Service.findById(req.params.id).populate('provider', 'name specialisation')
  if (!service || !service.isActive) {
    return res.status(404).json({ success: false, message: 'Service not found' })
  }
  res.json({ success: true, data: service })
}

// POST /api/services  (authenticated provider — create)
const createService = async (req, res) => {
  const { name, description, durationMinutes, price, currency } = req.body
  const service = await Service.create({
    provider: req.user._id,
    name,
    description,
    durationMinutes,
    price,
    currency,
  })
  res.status(201).json({ success: true, data: service })
}

// PATCH /api/services/:id  (authenticated provider — update own service)
const updateService = async (req, res) => {
  const service = await Service.findById(req.params.id)
  if (!service) {
    return res.status(404).json({ success: false, message: 'Service not found' })
  }
  if (service.provider.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorised to update this service' })
  }
  const allowed = ['name', 'description', 'durationMinutes', 'price', 'currency', 'isActive']
  allowed.forEach(field => {
    if (req.body[field] !== undefined) service[field] = req.body[field]
  })
  await service.save()
  res.json({ success: true, data: service })
}

// DELETE /api/services/:id  (authenticated provider — soft delete)
const deleteService = async (req, res) => {
  const service = await Service.findById(req.params.id)
  if (!service) {
    return res.status(404).json({ success: false, message: 'Service not found' })
  }
  if (service.provider.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorised to delete this service' })
  }
  service.isActive = false
  await service.save()
  res.json({ success: true, message: 'Service deactivated successfully' })
}

module.exports = {
  getServicesByProvider,
  getMyServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
}
