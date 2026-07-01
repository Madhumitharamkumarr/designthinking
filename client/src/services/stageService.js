import api from './api';

export const stageService = {
  create: (data) => api.post('/stages', data),
  getByEvent: (eventId) => api.get(`/stages/${eventId}`),
  update: (id, data) => api.put(`/stages/${id}`, data),
  delete: (id) => api.delete(`/stages/${id}`),
};
