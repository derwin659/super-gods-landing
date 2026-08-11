import { apiRequest } from './apiClient';

function reportRequest(path) {
  const separator = path.includes('?') ? '&' : '?';
  return apiRequest(path + separator + '_ts=' + Date.now(), {
    cache: 'no-store',
  });
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.append(key, value);
    }
  });

  const text = query.toString();
  return text ? `?${text}` : '';
}

export async function getProfitabilityReport({ branchId, from, to }) {
  return reportRequest(`/api/owner/reports/profitability${buildQuery({ branchId, from, to })}`);
}

export async function getSalesReport({ branchId, from, to }) {
  return reportRequest(`/api/owner/reports/sales${buildQuery({ branchId, from, to })}`);
}

export async function getBarberSummary({ branchId, from, to }) {
  return reportRequest(`/api/owner/reports/barbers/summary${buildQuery({ branchId, from, to })}`);
}

export async function getBarberDetail({ barberId, branchId, from, to }) {
  return reportRequest(`/api/owner/reports/barbers/${barberId}/detail${buildQuery({ branchId, from, to })}`);
}

export async function getDailySales({ branchId, from, to }) {
  return reportRequest(`/api/owner/reports/sales/daily${buildQuery({ branchId, from, to })}`);
}

export async function getTopServices({ branchId, from, to }) {
  return reportRequest(`/api/owner/reports/services/top${buildQuery({ branchId, from, to })}`);
}

export async function getPeriodComparison({ branchId, from, to }) {
  return reportRequest(`/api/owner/reports/period-comparison${buildQuery({ branchId, from, to })}`);
}
export async function getProfessionalPaymentReport({ branchId, barberUserId, status, from, to }) {
  return reportRequest(`/api/owner/reports/professional-payments${buildQuery({ branchId, barberUserId, status, from, to })}`);
}
export async function getProductReport({ branchId, from, to }) {
  return reportRequest(`/api/owner/reports/products${buildQuery({ branchId, from, to })}`);
}

export async function getExpenseReport({ branchId, from, to, type, paymentMethod }) {
  return reportRequest(`/api/owner/reports/expenses${buildQuery({ branchId, from, to, type, paymentMethod })}`);
}

export async function getPaymentSummary({ branchId, from, to }) {
  return reportRequest(`/api/owner/reports/payments/summary${buildQuery({ branchId, from, to })}`);
}

export async function getFundMovementReport({ branchId, from, to }) {
  return reportRequest(`/api/owner/reports/fund-movements${buildQuery({ branchId, from, to })}`);
}

export async function getBranchSummary({ from, to }) {
  return reportRequest(`/api/owner/reports/branches/summary${buildQuery({ from, to })}`);
}

export async function getBranchDetail({ branchId, from, to }) {
  return reportRequest(`/api/owner/reports/branches/${branchId}/detail${buildQuery({ from, to })}`);
}

export async function getBranchBarbersReport({ branchId, from, to }) {
  return reportRequest(`/api/owner/reports/branches/${branchId}/barbers${buildQuery({ from, to })}`);
}