import { apiRequest } from './apiClient';

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function normalizeSettings(raw = {}) {
  return {
    pointsPerCurrencyUnit: toNumber(
      raw.pointsPerCurrencyUnit ?? raw.puntosPorUnidadMonetaria,
      5
    ),
    currency: String(raw.currency ?? raw.moneda ?? 'PEN'),
    currencySymbol: String(raw.currencySymbol ?? raw.simboloMoneda ?? 'S/'),
  };
}

export async function getOwnerLoyaltySettings() {
  const data = await apiRequest('/api/owner/loyalty-settings');
  return normalizeSettings(data);
}

export async function updateOwnerLoyaltySettings({ pointsPerCurrencyUnit, currency }) {
  const data = await apiRequest('/api/owner/loyalty-settings', {
    method: 'PUT',
    body: JSON.stringify({
      pointsPerCurrencyUnit: Number(pointsPerCurrencyUnit),
      currency,
    }),
  });

  return normalizeSettings(data);
}
