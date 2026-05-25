const CURRENCY_KEY = 'TENANT_CURRENCY';
const CURRENCY_SYMBOL_KEY = 'TENANT_CURRENCY_SYMBOL';

const FALLBACK_CURRENCY = 'PEN';
const FALLBACK_SYMBOL = 'S/';

export function saveTenantMoneySettings(settings = {}) {
  const currency = String(settings.currency || FALLBACK_CURRENCY).trim().toUpperCase();
  const symbol = String(settings.currencySymbol || FALLBACK_SYMBOL).trim();

  localStorage.setItem(CURRENCY_KEY, currency || FALLBACK_CURRENCY);
  localStorage.setItem(CURRENCY_SYMBOL_KEY, symbol || FALLBACK_SYMBOL);
}

export function getTenantCurrency() {
  return String(localStorage.getItem(CURRENCY_KEY) || FALLBACK_CURRENCY)
    .trim()
    .toUpperCase();
}

export function getTenantCurrencySymbol() {
  return String(localStorage.getItem(CURRENCY_SYMBOL_KEY) || FALLBACK_SYMBOL).trim();
}

export function formatTenantMoney(value, currencyOverride = '') {
  const amount = Number(value || 0);
  const currency = String(currencyOverride || getTenantCurrency()).trim().toUpperCase();

  try {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isNaN(amount) ? 0 : amount);
  } catch {
    return `${getTenantCurrencySymbol()} ${(Number.isNaN(amount) ? 0 : amount).toFixed(2)}`;
  }
}
