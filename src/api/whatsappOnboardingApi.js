import { apiRequest, getApiBaseUrl } from './apiClient';
export function getWhatsappOnboarding() { return apiRequest('/api/owner/whatsapp-settings/onboarding'); }
export function startWhatsappOnboarding(phone) { return apiRequest('/api/owner/whatsapp-settings/onboarding/start', { method: 'POST', body: JSON.stringify({ phone }) }); }
export function refreshWhatsappOnboarding() { return apiRequest('/api/owner/whatsapp-settings/onboarding/refresh', { method: 'POST' }); }
async function scoped(path, token, data) {
  const response = await fetch(getApiBaseUrl() + '/api/public/whatsapp/onboarding/' + path, {
    method: data === undefined ? 'GET' : 'POST', cache: 'no-store', referrerPolicy: 'no-referrer',
    headers: { 'Content-Type': 'application/json', ...(token ? { 'X-Whatsapp-Onboarding-Token': token } : {}) },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || 'No se pudo completar la conexión. Abre una nueva conexión desde SuperGods.');
  return body;
}
export function claimWhatsappOnboarding(ticket) { return scoped('claim', null, { ticket }); }
export function completeWhatsappOnboarding(token, data) { return scoped('complete', token, data); }
export function statusWhatsappOnboarding(token) { return scoped('status', token); }
