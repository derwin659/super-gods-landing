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
    ownerBookingAlertEnabled: toBoolean(raw.ownerBookingAlertEnabled, false),
    ownerBookingAlertIncludeAdmins: toBoolean(raw.ownerBookingAlertIncludeAdmins, false),
    ownerBookingAlertIncludeProfessional: toBoolean(raw.ownerBookingAlertIncludeProfessional, false),
    ownerBookingAlertIncludeStaffCreated: toBoolean(raw.ownerBookingAlertIncludeStaffCreated, false),
    appDownloadUrl: String(raw.appDownloadUrl || DEFAULT_APP_URL),
    provider: String(raw.provider || 'MANUAL'),
    connectionStatus: String(raw.connectionStatus || 'NOT_CONNECTED'),
    senderPhone: String(raw.senderPhone || ''),
    senderLabel: String(raw.senderLabel || ''),
    connected: toBoolean(raw.connected, false),
    centralNotificationsEnabled: toBoolean(raw.centralNotificationsEnabled, false),
    centralProvider: String(raw.centralProvider || 'TWILIO'),
    centralSenderLabel: String(raw.centralSenderLabel || 'GODS Notificaciones'),
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
function normalizeVerification(raw = {}) {
  return {
    phone: String(raw.phone || ''),
    maskedPhone: String(raw.maskedPhone || 'Sin numero'),
    verified: toBoolean(raw.verified, false),
    verifiedAt: raw.verifiedAt || null,
    pendingPhone: String(raw.pendingPhone || ''),
    maskedPendingPhone: String(raw.maskedPendingPhone || ''),
    codeExpiresAt: raw.codeExpiresAt || null,
    canRequestAt: raw.canRequestAt || null,
    verificationPending: toBoolean(raw.verificationPending, false),
    centralNotificationsEnabled: toBoolean(raw.centralNotificationsEnabled, false),
    centralProvider: String(raw.centralProvider || 'TWILIO'),
    centralSenderLabel: String(raw.centralSenderLabel || 'GODS Notificaciones'),
  };
}

export async function getOwnerWhatsappRecipientVerification() {
  const data = await apiRequest('/api/owner/whatsapp-settings/recipient-verification');
  return normalizeVerification(data);
}

export async function requestOwnerWhatsappRecipientVerification(phone) {
  const data = await apiRequest('/api/owner/whatsapp-settings/recipient-verification/request', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
  return normalizeVerification(data);
}

export async function verifyOwnerWhatsappRecipient(code) {
  const data = await apiRequest('/api/owner/whatsapp-settings/recipient-verification/verify', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  return normalizeVerification(data);
}
