import { apiRequest } from './apiClient';

const DEFAULT_APP_URL = 'https://play.google.com/store/apps/details?id=com.gods.barberia';

function toBoolean(value, fallback = false) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
  return fallback;
}

function normalizeSettings(raw = {}) {
  return {
    postSaleMessageEnabled: toBoolean(raw.postSaleMessageEnabled, true),
    includeAppDownloadLink: toBoolean(raw.includeAppDownloadLink, true),
    includeBookingLink: toBoolean(raw.includeBookingLink, true),
    appointmentReminder60Enabled: toBoolean(raw.appointmentReminder60Enabled, true),
    appointmentReminder24hEnabled: toBoolean(raw.appointmentReminder24hEnabled, false),
    inactiveCustomerFollowUpEnabled: toBoolean(raw.inactiveCustomerFollowUpEnabled, false),
    appDownloadUrl: String(raw.appDownloadUrl || DEFAULT_APP_URL),
    provider: String(raw.provider || 'MANUAL'),
    connectionStatus: String(raw.connectionStatus || 'NOT_CONNECTED'),
    senderPhone: String(raw.senderPhone || ''),
    senderLabel: String(raw.senderLabel || ''),
    connected: toBoolean(raw.connected, false),
  };
}

export async function getOwnerWhatsappSettings() {
  const data = await apiRequest('/api/owner/whatsapp-settings');
  return normalizeSettings(data);
}

export async function updateOwnerWhatsappSettings(settings) {
  const data = await apiRequest('/api/owner/whatsapp-settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });

  return normalizeSettings(data);
}
