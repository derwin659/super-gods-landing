import { apiRequest } from './apiClient';

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export async function getPublicSubscriptionPrices(countryCode = 'PE') {
  const country = String(countryCode || 'PE').trim().toUpperCase();
  const data = await apiRequest(`/api/public/subscription-prices?country=${encodeURIComponent(country)}`);

  return Array.isArray(data)
    ? data.map((item) => ({
        plan: String(item.plan || '').trim().toUpperCase(),
        countryCode: String(item.countryCode || country).trim().toUpperCase(),
        currency: String(item.currency || 'PEN').trim().toUpperCase(),
        monthlyAmount: toNumber(item.monthlyAmount),
      }))
    : [];
}
