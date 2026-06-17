import { apiRequest } from './apiClient';

function toQuery(params = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      search.append(key, String(value));
    }
  });

  const query = search.toString();
  return query ? `?${query}` : '';
}

function extractList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.sales)) return data.sales;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.rows)) return data.rows;

  return [];
}

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function normalizeBranch(item = {}) {
  return {
    id: Number(item.branchId ?? item.id ?? 0),
    name: String(item.branchName ?? item.name ?? item.nombre ?? 'Sede'),
    todaySales: Number(item.todaySales ?? item.salesToday ?? 0),
    todayAppointments: Number(item.todayAppointments ?? item.appointmentsToday ?? 0),
    averageTicket: Number(item.averageTicket ?? 0),
  };
}

function mergeBranches(...groups) {
  const map = new Map();

  groups.flat().forEach((item) => {
    const branch = normalizeBranch(item);
    if (!branch.id) return;

    map.set(String(branch.id), {
      ...(map.get(String(branch.id)) || {}),
      ...branch,
    });
  });

  return Array.from(map.values());
}

export async function getOwnerBranches() {
  const [dashboard, activeBranches] = await Promise.all([
    apiRequest('/api/owner/home/dashboard').catch(() => null),
    apiRequest('/api/owner/branches/active').catch(() => null),
  ]);

  const dashboardBranches = Array.isArray(dashboard?.branches)
    ? dashboard.branches
    : [];

  return mergeBranches(dashboardBranches, extractList(activeBranches));
}

export async function getCurrentCashRegister(branchId) {
  try {
    return await apiRequest(
      `/api/owner/cash-registers/current${toQuery({ branchId })}`
    );
  } catch (error) {
    const message = String(error?.message || '').toLowerCase();

    if (
      message.includes('404') ||
      message.includes('no hay una caja abierta') ||
      message.includes('caja abierta')
    ) {
      return null;
    }

    throw error;
  }
}

export async function openCashRegister({
  branchId,
  assignedUserId = null,
  openingAmount = 0,
  openingNote = null,
}) {
  return apiRequest(
    `/api/owner/cash-registers/open${toQuery({ branchId })}`,
    {
      method: 'POST',
      body: JSON.stringify({
        assignedUserId,
        openingAmount: Number(openingAmount || 0),
        openingNote,
      }),
    }
  );
}

export async function closeCashRegister({
  branchId,
  cashRegisterId,
  closingAmountCounted = 0,
  closingNote = null,
}) {
  return apiRequest(
    `/api/owner/cash-registers/${cashRegisterId}/close${toQuery({
      branchId,
    })}`,
    {
      method: 'POST',
      body: JSON.stringify({
        closingAmountCounted: Number(closingAmountCounted || 0),
        closingNote,
      }),
    }
  );
}

export async function getCashMovements({ branchId, cashRegisterId }) {
  const data = await apiRequest(
    `/api/owner/cash-registers/${cashRegisterId}/movements${toQuery({
      branchId,
    })}`
  );

  return extractList(data);
}

export async function createCashMovement({
  branchId,
  cashRegisterId,
  type,
  amount = 0,
  concept = null,
  note = null,
  barberUserId = null,
  paymentMethod = 'CASH',
  fromPaymentMethod = null,
  toPaymentMethod = null,
}) {
  return apiRequest(
    `/api/owner/cash-registers/${cashRegisterId}/movements${toQuery({
      branchId,
    })}`,
    {
      method: 'POST',
      body: JSON.stringify({
        type,
        amount: Number(amount || 0),
        concept,
        note,
        barberUserId,
        paymentMethod,
        fromPaymentMethod,
        toPaymentMethod,
      }),
    }
  );
}

export async function updateCashMovement({
  branchId,
  movementId,
  type,
  amount = 0,
  concept = null,
  note = null,
  barberUserId = null,
  paymentMethod = 'CASH',
  fromPaymentMethod = null,
  toPaymentMethod = null,
  movementDate = null,
}) {
  const payload = {
    type,
    amount: Number(amount || 0),
    concept,
    note,
    barberUserId,
    paymentMethod,
    fromPaymentMethod,
    toPaymentMethod,
  };

  if (movementDate) {
    payload.movementDate = movementDate;
  }

  return apiRequest(
    `/api/owner/cash-registers/movements/${movementId}${toQuery({
      branchId,
    })}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteCashMovement({ branchId, movementId }) {
  return apiRequest(
    `/api/owner/cash-registers/movements/${movementId}${toQuery({
      branchId,
    })}`,
    {
      method: 'DELETE',
    }
  );
}

export async function approveCashMovement({ branchId, movementId, note = null }) {
  return apiRequest(
    `/api/owner/cash-registers/movements/${movementId}/approve${toQuery({
      branchId,
    })}`,
    {
      method: 'POST',
      body: JSON.stringify({
        note,
      }),
    }
  );
}

export async function rejectCashMovement({ branchId, movementId, note = null }) {
  return apiRequest(
    `/api/owner/cash-registers/movements/${movementId}/reject${toQuery({
      branchId,
    })}`,
    {
      method: 'POST',
      body: JSON.stringify({
        note,
      }),
    }
  );
}

export async function getCashBarbers(branchId) {
  try {
    const data = await apiRequest(
      `/api/owner/sale-catalog/barbers${toQuery({ branchId })}`
    );

    return extractList(data).map((item) => ({
      id: Number(item.id ?? item.userId ?? item.barberUserId ?? 0),
      name: String(
        item.nombre ??
          item.name ??
          item.fullName ??
          item.nombreCompleto ??
          'Barbero'
      ),
    }));
  } catch (firstError) {
    try {
      const data = await apiRequest(
        `/api/owner/catalog/barbers${toQuery({ branchId })}`
      );

      return extractList(data).map((item) => ({
        id: Number(item.id ?? item.userId ?? item.barberUserId ?? 0),
        name: String(
          item.nombre ??
            item.name ??
            item.fullName ??
            item.nombreCompleto ??
            'Barbero'
        ),
      }));
    } catch {
      throw firstError;
    }
  }
}

export async function getBarberPaymentPreview({
  branchId,
  barberUserId,
  periodFrom,
  periodTo,
}) {
  return apiRequest(
    `/api/owner/barber-payments/preview${toQuery({
      branchId,
      barberUserId,
      periodFrom,
      periodTo,
    })}`
  );
}

export async function createBarberPayment({
  branchId,
  cashRegisterId,
  barberUserId,
  periodFrom,
  periodTo,
  amountPaid,
  paymentMethod,
  payments = null,
  note = null,
}) {
  const normalizedPayments = Array.isArray(payments)
    ? payments
        .map((item) => ({
          method: String(item.method || item.paymentMethod || '').trim(),
          amount: Number(item.amount || 0),
        }))
        .filter((item) => item.method && item.amount > 0)
    : [];

  const payload = {
    barberUserId,
    periodFrom,
    periodTo,
    note,
  };

  if (normalizedPayments.length > 0) {
    payload.payments = normalizedPayments;
    payload.amountPaid = normalizedPayments.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    payload.paymentMethod =
      normalizedPayments.length > 1 ? 'MIXED' : normalizedPayments[0].method;
  } else {
    payload.amountPaid = Number(amountPaid || 0);
    payload.paymentMethod = paymentMethod;
  }

  return apiRequest(
    `/api/owner/cash-registers/${cashRegisterId}/barber-payments${toQuery({
      branchId,
    })}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export async function getTodayCashSales(branchId) {
  const data = await apiRequest(
    `/api/owner/cash-sales/today${toQuery({ branchId })}`
  );

  return extractList(data);
}

export async function getPendingValidationSales(branchId) {
  const data = await apiRequest(
    `/api/owner/cash-sales/pending-validation${toQuery({ branchId })}`
  );

  return extractList(data);
}

export async function approveSalePayment({ branchId, saleId }) {
  return apiRequest(
    `/api/owner/cash-sales/${saleId}/approve-payment${toQuery({ branchId })}`,
    {
      method: 'POST',
    }
  );
}

export async function rejectSalePayment({ branchId, saleId, reason = null }) {
  return apiRequest(
    `/api/owner/cash-sales/${saleId}/reject-payment${toQuery({ branchId })}`,
    {
      method: 'POST',
      body: JSON.stringify({
        reason,
      }),
    }
  );
}

export async function getSalesByCashRegister({ branchId, cashRegisterId }) {
  const data = await apiRequest(
    `/api/owner/cash-sales/by-cash-register/${cashRegisterId}${toQuery({
      branchId,
    })}`
  );

  return extractList(data);
}

export async function updateCashSale({
  branchId,
  saleId,
  customerId = null,
  metodoPago,
  subtotal = 0,
  discount = 0,
  total = 0,
  cashReceived = 0,
  changeAmount = 0,
  payments,
}) {
  const payload = {
    customerId,
    metodoPago,
    subtotal: Number(subtotal || 0),
    discount: Number(discount || 0),
    total: Number(total || 0),
    cashReceived: Number(cashReceived || 0),
    changeAmount: Number(changeAmount || 0),
  };

  if (Array.isArray(payments)) {
    payload.payments = payments.map((payment) => ({
      method: payment.method,
      amount: Number(payment.amount || 0),
    }));
  }

  return apiRequest(
    `/api/owner/cash-sales/${saleId}${toQuery({ branchId })}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteCashSale({ branchId, saleId }) {
  return apiRequest(
    `/api/owner/cash-sales/${saleId}${toQuery({ branchId })}`,
    {
      method: 'DELETE',
    }
  );
}

export async function getCashHistory({ branchId, from, to }) {
  const data = await apiRequest(
    `/api/owner/cash-registers/history${toQuery({
      branchId,
      from,
      to,
    })}`
  );

  return extractList(data);
}

export async function createCashSale({
  branchId,
  customerId = null,
  appointmentId = null,
  saleDate = null,
  metodoPago = 'CASH',
  discount = 0,
  cashReceived = 0,
  tipAmount = 0,
  tipBarberUserId = null,
  payments = [],
  items = [],
  cutType = null,
  cutDetail = null,
  cutObservations = null,
  createdByRole = null,
}) {
  const sessionRole = String(createdByRole || localStorage.getItem('ROLE') || '')
    .trim()
    .toUpperCase();

  return apiRequest(`/api/owner/cash-sales${toQuery({ branchId })}`, {
    method: 'POST',
    body: JSON.stringify({
      customerId,
      appointmentId,
      saleDate,
      metodoPago,
      discount: Number(discount || 0),
      cashReceived: Number(cashReceived || 0),
      tipAmount: Number(tipAmount || 0),
      tipBarberUserId,
      payments: Array.isArray(payments) ? payments : [],
      cutType,
      cutDetail,
      cutObservations,
      ...(sessionRole ? { createdByRole: sessionRole } : {}),
      items: Array.isArray(items) ? items : [],
    }),
  });
}

export async function getCashServices() {
  try {
    const data = await apiRequest('/api/owner/sale-catalog/services');

    return extractList(data)
      .map((item) => ({
        id: toNumber(item.id ?? item.serviceId),
        name: String(item.nombre ?? item.name ?? item.serviceName ?? 'Servicio'),
        price: toNumber(item.precio ?? item.price ?? item.amount),
        variablePrice: Boolean(
          item.variablePrice ??
            item.precioVariable ??
            item.isVariablePrice ??
            item.allowPriceOverride
        ),
        durationMinutes: toNumber(
          item.duracionMinutos ??
            item.durationMinutes ??
            item.duration ??
            item.minutos,
          30
        ),
        imageUrl: String(
          item.imageUrl ??
            item.imagenUrl ??
            item.photoUrl ??
            item.fotoUrl ??
            ''
        ),
      }))
      .filter((item) => item.id > 0);
  } catch (firstError) {
    try {
      const data = await apiRequest('/api/owner/catalog/services');

      return extractList(data)
        .map((item) => ({
          id: toNumber(item.id ?? item.serviceId),
          name: String(
            item.nombre ?? item.name ?? item.serviceName ?? 'Servicio'
          ),
          price: toNumber(item.precio ?? item.price ?? item.amount),
          variablePrice: Boolean(
            item.variablePrice ??
              item.precioVariable ??
              item.isVariablePrice ??
              item.allowPriceOverride
          ),
          durationMinutes: toNumber(
            item.duracionMinutos ??
              item.durationMinutes ??
              item.duration ??
              item.minutos,
            30
          ),
          imageUrl: String(
            item.imageUrl ??
              item.imagenUrl ??
              item.photoUrl ??
              item.fotoUrl ??
              ''
          ),
        }))
        .filter((item) => item.id > 0);
    } catch {
      throw firstError;
    }
  }
}

export async function getCashProducts(branchId) {
  const data = await apiRequest(`/api/owner/products${toQuery({ branchId })}`);

  return extractList(data)
    .map((item) => ({
      id: toNumber(item.id ?? item.productId),
      name: String(item.nombre ?? item.name ?? item.productName ?? 'Producto'),
      price: toNumber(
        item.precioVenta ?? item.salePrice ?? item.price ?? item.precio
      ),
      stock: toNumber(item.stockActual ?? item.stock ?? item.currentStock),
      imageUrl: String(
        item.imageUrl ?? item.imagenUrl ?? item.photoUrl ?? item.fotoUrl ?? ''
      ),
      active: item.activo !== false && item.active !== false,
    }))
    .filter((item) => item.id > 0 && item.active);
}

export async function getOwnerPaymentMethods(branchId) {
  const data = await apiRequest(
    `/api/owner/payment-methods${toQuery({ branchId })}`
  );

  const methods = extractList(data);

  return methods
    .map((item) => ({
      id: Number(item.id ?? item.paymentMethodId ?? 0),
      code: String(item.code ?? item.method ?? '').trim().toUpperCase(),
      label: String(
        item.displayName ?? item.name ?? item.label ?? item.code ?? 'Método'
      ),
      displayName: String(
        item.displayName ?? item.name ?? item.label ?? item.code ?? 'Método'
      ),
      countryCode: String(item.countryCode ?? ''),
      active: item.active !== false,
      sortOrder: Number(item.sortOrder ?? 0),
    }))
    .filter((item) => item.code && item.active);
}
