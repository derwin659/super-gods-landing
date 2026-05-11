import { apiRequest } from './apiClient';

export async function getOwnerReservationSettings() {
  return apiRequest('/api/owner/booking-payment-settings');
}

export async function updateOwnerReservationSettings(payload) {
  return apiRequest('/api/owner/booking-payment-settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}