import api from './api';

export const projectService = {
  create: (data) => api.post('/projects', data),
  getAll: (params) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  update: (id, data) => api.put(`/projects/${id}`, data),
  assignMentor: (id, data) => api.patch(`/projects/${id}/assign-mentor`, data),
  assignCoordinator: (id, data) => api.patch(`/projects/${id}/assign-coordinator`, data),
  unassignMentor: (id) => api.patch(`/projects/${id}/unassign-mentor`),
  unassignCoordinator: (id) => api.patch(`/projects/${id}/unassign-coordinator`),
  getUnassigned: (params) => api.get('/projects/unassigned', { params }),
};
