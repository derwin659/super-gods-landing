import { apiRequest } from './apiClient';

export function getRegionalSettings() {
  return apiRequest('/api/owner/regional-settings');
}

export function updateRegionalSettings(payload) {
  return apiRequest('/api/owner/regional-settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function updatePreferredLocale(preferredLocale) {
  const role = String(localStorage.getItem('ROLE') || '').toUpperCase();
  if (role !== 'OWNER' && role !== 'ADMIN') return Promise.resolve(null);
  return updateRegionalSettings({ preferredLocale });
}
