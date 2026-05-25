export const COUNTRY_PRICE_OPTIONS = [
  { code: 'PE', label: 'Peru', currency: 'PEN' },
  { code: 'US', label: 'Estados Unidos', currency: 'USD' },
  { code: 'CO', label: 'Colombia', currency: 'COP' },
  { code: 'MX', label: 'Mexico', currency: 'MXN' },
  { code: 'CL', label: 'Chile', currency: 'CLP' },
  { code: 'AR', label: 'Argentina', currency: 'ARS' },
  { code: 'BO', label: 'Bolivia', currency: 'BOB' },
  { code: 'BR', label: 'Brasil', currency: 'BRL' },
  { code: 'EU', label: 'Europa', currency: 'EUR' },
  { code: 'UY', label: 'Uruguay', currency: 'UYU' },
  { code: 'PY', label: 'Paraguay', currency: 'PYG' },
  { code: 'CR', label: 'Costa Rica', currency: 'CRC' },
  { code: 'DO', label: 'Republica Dominicana', currency: 'DOP' },
  { code: 'GT', label: 'Guatemala', currency: 'GTQ' },
];

const PRICES_BY_COUNTRY = {
  PE: { currency: 'PEN', STARTER: 39, PRO: 79, GODS_AI: 149 },
  US: { currency: 'USD', STARTER: 19, PRO: 39, GODS_AI: 79 },
  CO: { currency: 'COP', STARTER: 49000, PRO: 99000, GODS_AI: 189000 },
  MX: { currency: 'MXN', STARTER: 249, PRO: 499, GODS_AI: 949 },
  CL: { currency: 'CLP', STARTER: 11900, PRO: 24900, GODS_AI: 44900 },
  AR: { currency: 'ARS', STARTER: 12000, PRO: 25000, GODS_AI: 49000 },
  BO: { currency: 'BOB', STARTER: 59, PRO: 119, GODS_AI: 229 },
  BR: { currency: 'BRL', STARTER: 59, PRO: 119, GODS_AI: 229 },
  EU: { currency: 'EUR', STARTER: 17, PRO: 35, GODS_AI: 69 },
  UY: { currency: 'UYU', STARTER: 590, PRO: 1190, GODS_AI: 2290 },
  PY: { currency: 'PYG', STARTER: 79000, PRO: 159000, GODS_AI: 299000 },
  CR: { currency: 'CRC', STARTER: 7900, PRO: 15900, GODS_AI: 29900 },
  DO: { currency: 'DOP', STARTER: 699, PRO: 1399, GODS_AI: 2699 },
  GT: { currency: 'GTQ', STARTER: 59, PRO: 119, GODS_AI: 229 },
};

export function getPublicPlanPrice(plan, countryCode = 'PE') {
  const country = PRICES_BY_COUNTRY[String(countryCode || 'PE').toUpperCase()] || PRICES_BY_COUNTRY.PE;
  const planCode = String(plan || 'STARTER').toUpperCase();

  return {
    amount: country[planCode] || country.STARTER,
    currency: country.currency,
  };
}

export function getInitialPricingCountry() {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('country') || params.get('pais');
    const normalizedQuery = String(fromQuery || '').trim().toUpperCase();
    if (COUNTRY_PRICE_OPTIONS.some((option) => option.code === normalizedQuery)) {
      return normalizedQuery;
    }

    const timeZoneCountry = countryFromTimeZone();
    if (timeZoneCountry) return timeZoneCountry;

    const locale = String(navigator.language || '').toUpperCase();
    const localeCountry = locale.includes('-') ? locale.split('-').pop() : '';
    if (COUNTRY_PRICE_OPTIONS.some((option) => option.code === localeCountry)) {
      return localeCountry;
    }
  } catch {
    return 'PE';
  }

  return 'PE';
}

function countryFromTimeZone() {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';

  const map = {
    'America/Lima': 'PE',
    'America/Santiago': 'CL',
    'America/Bogota': 'CO',
    'America/Mexico_City': 'MX',
    'America/Monterrey': 'MX',
    'America/Tijuana': 'MX',
    'America/Cancun': 'MX',
    'America/Argentina/Buenos_Aires': 'AR',
    'America/La_Paz': 'BO',
    'America/Sao_Paulo': 'BR',
    'America/Montevideo': 'UY',
    'America/Asuncion': 'PY',
    'America/Costa_Rica': 'CR',
    'America/Santo_Domingo': 'DO',
    'America/Guatemala': 'GT',
    'America/New_York': 'US',
    'America/Chicago': 'US',
    'America/Denver': 'US',
    'America/Los_Angeles': 'US',
  };

  if (map[timeZone]) return map[timeZone];
  if (timeZone.startsWith('Europe/')) return 'EU';

  return '';
}

export function buildPriceMap(planPrices = []) {
  return Array.isArray(planPrices)
    ? planPrices.reduce((acc, item) => {
        const plan = String(item.plan || '').trim().toUpperCase();
        if (!plan) return acc;
        acc[plan] = {
          amount: Number(item.monthlyAmount || 0),
          currency: String(item.currency || 'PEN').trim().toUpperCase(),
        };
        return acc;
      }, {})
    : {};
}

export function getPlanPriceFromMap(plan, countryCode, priceMap = {}) {
  const planCode = String(plan || '').trim().toUpperCase();
  return priceMap[planCode] || getPublicPlanPrice(planCode, countryCode);
}

export function formatSubscriptionPrice({ amount, currency }) {
  try {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: currency || 'PEN',
      maximumFractionDigits: ['CLP', 'COP', 'PYG'].includes(currency) ? 0 : 2,
    }).format(Number(amount || 0));
  } catch {
    return `${currency || 'PEN'} ${Number(amount || 0).toFixed(2)}`;
  }
}
