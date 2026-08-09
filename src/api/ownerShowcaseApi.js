import { apiRequest } from './apiClient';
export async function getOwnerShowcase(status = '') { const q = status ? `?status=${encodeURIComponent(status)}` : ''; const data = await apiRequest(`/api/owner/showcase${q}`); return Array.isArray(data) ? data : []; }
export async function moderateOwnerShowcase(id, status, reason = null) { return apiRequest(`/api/owner/showcase/${id}/moderate`, { method: 'POST', body: JSON.stringify({ status, reason }) }); }
export async function archiveOwnerShowcase(id) { return apiRequest(`/api/owner/showcase/${id}/archive`, { method: 'POST' }); }
export async function publishOwnerShowcase(id) { return apiRequest(`/api/owner/showcase/${id}/publish`, { method: 'POST' }); }
export async function deleteOwnerShowcase(id) { return apiRequest(`/api/owner/showcase/${id}`, { method: 'DELETE' }); }