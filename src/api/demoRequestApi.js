import { apiRequest } from './apiClient';

export const demoRequestApi = {
  createPublicRequest(payload) {
    return apiRequest('/api/public/demo-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  activatePublicTrial(payload) {
    return apiRequest('/api/public/demo-requests/activate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getAll() {
    return apiRequest('/api/super-admin/demo-requests');
  },

  getPending() {
    return apiRequest('/api/super-admin/demo-requests/pending');
  },

  getById(id) {
    return apiRequest(`/api/super-admin/demo-requests/${id}`);
  },

  approve(id, notes = '') {
    return apiRequest(`/api/super-admin/demo-requests/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  reject(id, notes = '') {
    return apiRequest(`/api/super-admin/demo-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  markSuspicious(id, notes = '') {
    return apiRequest(`/api/super-admin/demo-requests/${id}/suspicious`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },
};
