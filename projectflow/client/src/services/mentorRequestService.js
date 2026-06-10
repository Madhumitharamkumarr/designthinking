import api from './api';

export const mentorRequestService = {
  create: (data) => api.post('/mentor-requests', data),
  getAll: (params) => api.get('/mentor-requests', { params }),
  getByProject: (projectId) => api.get(`/mentor-requests/project/${projectId}`),
  review: (id, data) => api.patch(`/mentor-requests/${id}/review`, data),
};
