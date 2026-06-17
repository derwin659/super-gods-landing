import { apiRequest } from './apiClient';

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function toBool(value, fallback = false) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const clean = value.trim().toLowerCase();
    if (clean === 'true') return true;
    if (clean === 'false') return false;
  }
  return fallback;
}

function text(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

export function normalizePlanCode(plan, fallback = 'STARTER') {
  const value = text(plan, fallback).trim().toUpperCase().replace(/\s+/g, '_');

  switch (value) {
    case 'NORMAL':
    case 'STANDARD':
      return 'STARTER';
    case 'SOLO':
    case 'INDEPENDENT':
      return 'BASIC';
    case 'STARTER_LEGACY':
    case 'PRO_LEGACY':
    case 'FREE':
    case 'BASIC':
    case 'STARTER':
    case 'GROWTH':
    case 'PRO':
    case 'ENTERPRISE':
    case 'GODS_AI':
      return value;
    default:
      return fallback;
  }
}

export function publicPlanCode(plan) {
  const value = normalizePlanCode(plan);
  switch (value) {
    case 'STARTER_LEGACY':
      return 'STARTER';
    case 'PRO_LEGACY':
      return 'PRO';
    case 'GODS_AI':
      return 'GROWTH';
    default:
      return value;
  }
}

export function normalizeSubscription(raw = {}) {
  const plan = normalizePlanCode(raw.plan);
  const publicPlan = normalizePlanCode(raw.publicPlan || publicPlanCode(plan));

  return {
    subId: raw.subId === null || raw.subId === undefined ? null : toNumber(raw.subId),
    tenantId: raw.tenantId === null || raw.tenantId === undefined ? null : toNumber(raw.tenantId),
    plan,
    publicPlan,
    estado: text(raw.estado, 'TRIAL').toUpperCase(),
    trial: toBool(raw.trial),
    precioMensual: toNumber(raw.precioMensual),
    billingCycle: text(raw.billingCycle, 'MONTHLY').toUpperCase(),
    currency: text(raw.currency, 'PEN'),
    billingChannel: text(raw.billingChannel, 'WEB').toUpperCase(),
    fechaInicio: text(raw.fechaInicio),
    fechaRenovacion: text(raw.fechaRenovacion),
    fechaFin: text(raw.fechaFin),
    diasGracia: toNumber(raw.diasGracia),
    observaciones: text(raw.observaciones),
    maxBranches: toNumber(raw.maxBranches),
    usedBranches: toNumber(raw.usedBranches),
    maxBarbers: toNumber(raw.maxBarbers),
    usedBarbers: toNumber(raw.usedBarbers),
    maxAdmins: toNumber(raw.maxAdmins),
    usedAdmins: toNumber(raw.usedAdmins),
    aiEnabled: toBool(raw.aiEnabled),
    aiLevel: text(raw.aiLevel, raw.aiEnabled ? 'PRO' : 'BASIC').toUpperCase(),
    aiVisualCreditsBalance: toNumber(raw.aiVisualCreditsBalance),
    loyaltyEnabled: toBool(raw.loyaltyEnabled),
    promotionsEnabled: toBool(raw.promotionsEnabled),
    maxMonthlyBookings: raw.maxMonthlyBookings === null || raw.maxMonthlyBookings === undefined ? null : toNumber(raw.maxMonthlyBookings),
    usedMonthlyBookings: toNumber(raw.usedMonthlyBookings),
    planPrices: Array.isArray(raw.planPrices)
      ? raw.planPrices.map((item) => ({
          plan: normalizePlanCode(item.plan, ''),
          countryCode: text(item.countryCode, 'PE').toUpperCase(),
          currency: text(item.currency, raw.currency || 'PEN').toUpperCase(),
          monthlyAmount: toNumber(item.monthlyAmount),
        }))
      : [],
    canOperate: toBool(raw.canOperate, true),
    expired: toBool(raw.expired),
    raw,
  };
}

export function planLabel(plan) {
  switch (normalizePlanCode(plan, '')) {
    case 'FREE':
      return 'Gratis';
    case 'BASIC':
      return 'Basic';
    case 'STARTER':
      return 'Starter';
    case 'GROWTH':
      return 'Growth';
    case 'PRO':
      return 'Pro';
    case 'ENTERPRISE':
      return 'Enterprise';
    case 'STARTER_LEGACY':
      return 'Starter Legacy';
    case 'PRO_LEGACY':
      return 'Pro Legacy';
    case 'GODS_AI':
      return 'Gods AI';
    default:
      return plan || 'Plan';
  }
}

export function statusLabel(status) {
  switch (String(status || '').toUpperCase()) {
    case 'TRIAL':
      return 'Trial';
    case 'ACTIVE':
    case 'ACTIVO':
    case 'ACTIVA':
      return 'Activo';
    case 'EXPIRED':
    case 'VENCIDO':
    case 'EXPIRADO':
      return 'Vencido';
    case 'PAST_DUE':
    case 'PENDING_REVIEW':
      return 'Pago pendiente';
    case 'CANCELLED':
    case 'CANCELADO':
      return 'Cancelado';
    default:
      return status || 'Sin estado';
  }
}

export function billingLabel(billing) {
  switch (String(billing || '').toUpperCase()) {
    case 'MONTHLY':
      return 'Mensual';
    case 'SEMIANNUAL':
      return 'Semestral';
    case 'ANNUAL':
      return 'Anual';
    default:
      return billing || 'Mensual';
  }
}

export function monthlyPrice(plan, planPrices = []) {
  const planCode = publicPlanCode(plan);
  const configured = planPrices.find((item) => item.plan === planCode);
  if (configured && configured.monthlyAmount >= 0) return configured.monthlyAmount;

  switch (planCode) {
    case 'FREE':
      return 0;
    case 'BASIC':
      return 39.90;
    case 'STARTER':
      return 79.90;
    case 'GROWTH':
      return 139.90;
    case 'PRO':
      return 229.90;
    case 'ENTERPRISE':
      return 399.90;
    case 'GODS_AI':
      return 139.90;
    default:
      return 79.90;
  }
}

export function discountPercent(billing) {
  switch (String(billing || '').toUpperCase()) {
    case 'SEMIANNUAL':
      return 0.10;
    case 'ANNUAL':
      return 0.20;
    case 'MONTHLY':
    default:
      return 0;
  }
}

export function basePrice(plan, billing, planPrices = []) {
  const monthly = monthlyPrice(plan, planPrices);

  switch (String(billing || '').toUpperCase()) {
    case 'SEMIANNUAL':
      return monthly * 6;
    case 'ANNUAL':
      return monthly * 12;
    case 'MONTHLY':
    default:
      return monthly;
  }
}

export function finalPrice(plan, billing, planPrices = []) {
  const base = basePrice(plan, billing, planPrices);
  return base * (1 - discountPercent(billing));
}

export function isSubscriptionActive(subscription) {
  if (!subscription) return false;

  const estado = String(subscription.estado || '').toUpperCase();

  const activeLike =
    estado === 'ACTIVE' ||
    estado === 'ACTIVO' ||
    estado === 'ACTIVA' ||
    estado === 'TRIAL';

  const expired =
    subscription.expired ||
    estado === 'EXPIRED' ||
    estado === 'VENCIDO' ||
    estado === 'EXPIRADO' ||
    estado === 'CANCELLED' ||
    estado === 'CANCELADO' ||
    estado === 'PAST_DUE';

  return subscription.canOperate && activeLike && !expired;
}

export async function getCurrentSubscription() {
  const data = await apiRequest('/api/subscription/current');
  return normalizeSubscription(data);
}

export async function getSubscriptionPlanPrices() {
  const data = await apiRequest('/api/subscription/plan-prices');
  return Array.isArray(data)
    ? data.map((item) => ({
        plan: normalizePlanCode(item.plan, ''),
        countryCode: text(item.countryCode, 'PE').toUpperCase(),
        currency: text(item.currency, 'PEN').toUpperCase(),
        monthlyAmount: toNumber(item.monthlyAmount),
      }))
    : [];
}

export async function reportSubscriptionPayment({
  plan,
  billingCycle,
  paymentMethod = 'YAPE',
  operationNumber,
  amount,
  payerName = '',
  payerPhone = '',
  notes = '',
}) {
  return apiRequest('/api/subscription/report-payment', {
    method: 'POST',
    body: JSON.stringify({
      plan: String(plan || '').trim().toUpperCase(),
      billingCycle: String(billingCycle || '').trim().toUpperCase(),
      paymentMethod: String(paymentMethod || 'YAPE').trim().toUpperCase(),
      operationNumber: String(operationNumber || '').trim(),
      amount: Number(amount),
      payerName: String(payerName || '').trim(),
      payerPhone: String(payerPhone || '').trim(),
      notes: String(notes || '').trim(),
    }),
  });
}

export async function createSubscriptionCheckout({
  plan,
  billingCycle,
}) {
  const data = await apiRequest('/api/subscription/checkout', {
    method: 'POST',
    body: JSON.stringify({
      plan: String(plan || '').trim().toUpperCase(),
      billingCycle: String(billingCycle || '').trim().toUpperCase(),
    }),
  });

  return {
    provider: text(data?.provider, 'PADDLE'),
    checkoutUrl: text(data?.checkoutUrl),
    priceId: text(data?.priceId),
    currency: text(data?.currency, 'USD'),
    amount: toNumber(data?.amount),
  };
}
