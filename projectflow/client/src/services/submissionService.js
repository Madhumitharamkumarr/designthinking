import api from './api';

export const submissionService = {
  create: (data) => api.post('/submissions', data),
  getAll: (params) => api.get('/submissions', { params }),
  getById: (id) => api.get(`/submissions/${id}`),
  review: (id, data) => api.patch(`/submissions/${id}/review`, data),
};
