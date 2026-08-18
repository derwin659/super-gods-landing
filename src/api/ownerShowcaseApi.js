import { apiRequest, getApiBaseUrl, getToken } from './apiClient';

export async function getOwnerShowcaseMetrics() {
  const data = await apiRequest('/api/owner/showcase/metrics');
  return Array.isArray(data) ? data : [];
}

export async function getOwnerShowcase(status = '') {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const data = await apiRequest(`/api/owner/showcase${query}`);
  return Array.isArray(data) ? data : [];
}

export async function createOwnerCatalog(formData) {
  const token = getToken();
  const response = await fetch(`${getApiBaseUrl()}/api/owner/showcase/catalog`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) throw new Error(data?.message || data?.error || data?.details || `Error HTTP ${response.status}`);
  return data;
}

export async function moderateOwnerShowcase(id, status, reason = null) {
  return apiRequest(`/api/owner/showcase/${id}/moderate`, { method: 'POST', body: JSON.stringify({ status, reason }) });
}
export async function setOwnerShowcaseFeatured(id, featured) { return apiRequest(`/api/owner/showcase/${id}/featured`, { method: 'PATCH', body: JSON.stringify({ featured }) }); }
export async function moveOwnerShowcaseFeatured(id, direction) { return apiRequest(`/api/owner/showcase/${id}/featured/move`, { method: 'POST', body: JSON.stringify({ direction }) }); }
export async function archiveOwnerShowcase(id) { return apiRequest(`/api/owner/showcase/${id}/archive`, { method: 'POST' }); }
export async function publishOwnerShowcase(id) { return apiRequest(`/api/owner/showcase/${id}/publish`, { method: 'POST' }); }
export async function deleteOwnerShowcase(id) { return apiRequest(`/api/owner/showcase/${id}`, { method: 'DELETE' }); }

export async function getOwnerShowcaseReports(showcaseId = '') {
  const query = showcaseId ? '?showcaseId=' + encodeURIComponent(showcaseId) : '';
  const data = await apiRequest('/api/owner/showcase/reports' + query);
  return Array.isArray(data) ? data : [];
}

export async function resolveOwnerShowcaseReport(reportId, decision, note = '') {
  return apiRequest('/api/owner/showcase/reports/' + reportId + '/resolve', {
    method: 'POST',
    body: JSON.stringify({ decision, note }),
  });
}