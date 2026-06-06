import { useEffect, useMemo, useState } from 'react';
import {
  approveCashMovement,
  approveSalePayment,
  closeCashRegister,
  createBarberPayment,
  createCashMovement,
  createCashSale,
  deleteCashMovement,
  deleteCashSale,
  getBarberPaymentPreview,
  getCashBarbers,
  getCashHistory,
  getCashProducts,
  getCashServices,
  getCashMovements,
  getCurrentCashRegister,
  getOwnerBranches,
  getOwnerPaymentMethods,
  getPendingValidationSales,
  getSalesByCashRegister,
  getTodayCashSales,
  openCashRegister,
  rejectCashMovement,
  rejectSalePayment,
  updateCashMovement,
  updateCashSale,
} from '../../api/ownerCashApi';
import { createOwnerCustomer, getOwnerCustomers } from '../../api/ownerCustomersApi';
import { useAuth } from '../../context/AuthContext';
import { getBusinessLabels, readBusinessLabels } from '../../utils/businessLabels';
import { formatTenantMoney, getTenantCurrencySymbol } from '../../utils/tenantMoney';

function formatMoney(value) {
  return formatTenantMoney(value);
}

function formatDateTime(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizeMethod(value) {
  const code = String(value || '').trim().toUpperCase();

  if (code === 'EFECTIVO') return 'CASH';
  if (code === 'TARJETA') return 'CARD';
  if (code === 'TRANSFERENCIA') return 'TRANSFER';

  return code;
}

function methodLabel(value) {
  const code = normalizeMethod(value);

  const labels = {
    CASH: 'Efectivo',
    YAPE: 'Yape',
    PLIN: 'Plin',
    CARD: 'Tarjeta',
    TRANSFER: 'Transferencia',
    MIXED: 'Pago mixto',
    DEPOSIT_APPLIED: 'Inicial aplicado',
    FREE: 'Gratis',
    NEQUI: 'Nequi',
    DAVIPLATA: 'Daviplata',
    PAGO_MOVIL: 'Pago móvil',
    ZELLE: 'Zelle',
    QR: 'QR',
  };

  return labels[code] || code || 'Otro';
}

function ownerAsBarberOption(session) {
  const role = String(session?.role || '').trim().toUpperCase();
  const id = Number(session?.userId || 0);

  if (role !== 'OWNER' || !id) return null;

  const name = String(session?.userName || '').trim();

  return {
    id,
    name: name ? `${name} (Dueño)` : 'Dueño del negocio',
    owner: true,
  };
}

function mergeOwnerIntoBarbers(barbers, session) {
  const cleanBarbers = Array.isArray(barbers)
    ? barbers.filter((item) => Number(item?.id || 0) > 0)
    : [];
  const ownerOption = ownerAsBarberOption(session);

  if (!ownerOption) return cleanBarbers;

  const exists = cleanBarbers.some((item) => String(item.id) === String(ownerOption.id));
  if (exists) return cleanBarbers;

  return [ownerOption, ...cleanBarbers];
}

function parseMoneyInput(value) {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function roundMoney(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function createPaymentDraft(method = 'CASH', amount = 0) {
  return {
    key: `payment-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    method,
    amount: Number(amount || 0).toFixed(2),
  };
}

function salePaymentsOf(sale) {
  const raw = Array.isArray(sale?.payments)
    ? sale.payments
    : Array.isArray(sale?.salePayments)
      ? sale.salePayments
      : [];

  return raw
    .map((payment) => ({
      method: payment?.method ?? payment?.paymentMethod ?? payment?.metodoPago,
      amount: Number(payment?.amount ?? payment?.totalAmount ?? 0),
    }))
    .filter((payment) => payment.method && payment.amount > 0);
}

function salePaymentSummary(sale) {
  const payments = salePaymentsOf(sale);

  if (payments.length === 0) {
    return methodLabel(sale?.metodoPago);
  }

  return payments
    .map((payment) => `${methodLabel(payment.method)} ${formatMoney(payment.amount)}`)
    .join(' + ');
}

function customerWhatsappUrlOf(sale) {
  const provided = String(
    sale?.customerWhatsappUrl ??
      sale?.whatsappUrl ??
      sale?.customerWhatsappLink ??
      ''
  ).trim();

  if (provided) return provided;

  const phone = normalizeWhatsappPhone(
    sale?.customerPhone ??
      sale?.telefono ??
      sale?.phone ??
      sale?.customerTelefono ??
      sale?.whatsappPhone ??
      sale?.customer?.telefono ??
      sale?.customer?.phone ??
      ''
  );

  if (!phone) return '';

  const message = customerWhatsappMessageOf(sale);
  const query = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${phone}${query}`;
}

function customerWhatsappMessageOf(sale) {
  return String(
    sale?.customerWhatsappMessage ??
      sale?.whatsappMessage ??
      sale?.message ??
      ''
  ).trim();
}

function saleWithWhatsappFallback(primary, fallback) {
  const merged = { ...(fallback || {}), ...(primary || {}) };

  for (const key of [
    'customerWhatsappUrl',
    'whatsappUrl',
    'customerWhatsappLink',
    'customerWhatsappMessage',
    'whatsappMessage',
    'message',
    'customerPhone',
    'telefono',
    'phone',
    'customerTelefono',
    'whatsappPhone',
    'customerName',
  ]) {
    const value = String(primary?.[key] ?? '').trim();
    if (!value && fallback?.[key] !== undefined) {
      merged[key] = fallback[key];
    }
  }

  return merged;
}

function normalizeWhatsappPhone(value) {
  let digits = String(value || '').replace(/\D/g, '');

  if (digits.length === 9) {
    digits = `51${digits}`;
  }

  return digits;
}

function offerCustomerWhatsappFollowUp(sale) {
  const url = customerWhatsappUrlOf(sale);
  if (!url) return;

  const customer = String(
    sale?.customerName ||
      sale?.customer?.fullName ||
      sale?.customer?.nombre ||
      'cliente'
  ).trim();
  const message = customerWhatsappMessageOf(sale);
  const preview = message ? `\n\nMensaje:\n${message}` : '';
  const shouldOpen = window.confirm(
    `Venta registrada. ¿Enviar WhatsApp a ${customer}?${preview}`
  );

  if (!shouldOpen) return;

  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (!opened) {
    window.prompt('Copia este enlace para abrir WhatsApp:', url);
  }
}

const DEFAULT_PAYMENT_METHODS = [
  { code: 'CASH', label: 'Efectivo', icon: '💵', helper: 'Efectivo físico' },
  { code: 'YAPE', label: 'Yape', icon: '🟣', helper: 'Pago digital' },
  { code: 'PLIN', label: 'Plin', icon: '🔵', helper: 'Pago digital' },
  { code: 'CARD', label: 'Tarjeta', icon: '💳', helper: 'Tarjeta / POS' },
  { code: 'TRANSFER', label: 'Transferencia', icon: '🏦', helper: 'Transferencias' },
];

const BASE_PAYMENT_METHODS = [
  { code: 'CASH', label: 'Efectivo', icon: '💵', helper: 'Efectivo físico' },
  { code: 'CARD', label: 'Tarjeta', icon: '💳', helper: 'Tarjeta / POS' },
  { code: 'TRANSFER', label: 'Transferencia', icon: '🏦', helper: 'Transferencias' },
];

const METHOD_ICON_BY_CODE = {
  CASH: '💵',
  YAPE: '🟣',
  PLIN: '🔵',
  CARD: '💳',
  TRANSFER: '🏦',
  NEQUI: '🟢',
  DAVIPLATA: '🔴',
  PAGO_MOVIL: '📲',
  ZELLE: '💸',
  QR: '▣',
};

function normalizePaymentMethodOptions(methods = []) {
  const source = Array.isArray(methods) && methods.length > 0 ? methods : DEFAULT_PAYMENT_METHODS;
  const map = new Map();

  source.forEach((item) => {
    const code = normalizeMethod(item?.code ?? item?.method ?? item?.paymentMethod ?? item?.value);
    if (!code || code === 'MIXED' || code === 'FREE' || code === 'DEPOSIT_APPLIED') return;

    const label = String(item?.displayName ?? item?.label ?? item?.name ?? methodLabel(code)).trim();
    map.set(code, {
      code,
      label: label || methodLabel(code),
      icon: item?.icon || METHOD_ICON_BY_CODE[code] || '•',
      helper: item?.helper || (code === 'CASH' ? 'Efectivo físico' : 'Método configurado'),
    });
  });

  if (map.size === 0) {
    DEFAULT_PAYMENT_METHODS.forEach((method) => map.set(method.code, method));
  }

  return Array.from(map.values());
}

function paymentSelectOptions(methods = []) {
  return normalizePaymentMethodOptions(methods).map((method) => ({
    value: method.code,
    label: method.label,
  }));
}

function paymentLabelFromOptions(methods = [], code) {
  const normalized = normalizeMethod(code);
  return normalizePaymentMethodOptions(methods).find((method) => method.code === normalized)?.label || methodLabel(normalized);
}

function defaultExtraPaymentMethod(methods = []) {
  const options = normalizePaymentMethodOptions(methods);
  return options.find((method) => method.code !== 'CASH')?.code || 'CARD';
}

function summaryMethodOf(item) {
  return normalizeMethod(item?.paymentMethod ?? item?.method ?? item?.metodoPago ?? item?.code);
}

function summaryAmountOf(item) {
  return Number(item?.totalAmount ?? item?.amount ?? item?.total ?? 0);
}

function summaryCountOf(item) {
  return Number(item?.count ?? item?.quantity ?? item?.operations ?? 0);
}

function buildPaymentMethodRows(salesSummary = [], balanceSummary = [], configuredMethods = DEFAULT_PAYMENT_METHODS) {
  const codes = [];

  function addCode(code) {
    const normalized = normalizeMethod(code);
    if (!normalized || normalized === 'FREE' || normalized === 'DEPOSIT_APPLIED') return;
    if (!codes.includes(normalized)) codes.push(normalized);
  }

  const methodOptions = normalizePaymentMethodOptions(configuredMethods);
  methodOptions.forEach((method) => addCode(method.code));
  salesSummary.forEach((item) => addCode(summaryMethodOf(item)));
  balanceSummary.forEach((item) => addCode(summaryMethodOf(item)));

  return codes.map((code) => {
    const base = methodOptions.find((method) => method.code === code);
    const salesItem = salesSummary.find((item) => summaryMethodOf(item) === code);
    const balanceItem = balanceSummary.find((item) => summaryMethodOf(item) === code);

    return {
      code,
      label: base?.label || methodLabel(code),
      icon: base?.icon || '•',
      helper: base?.helper || 'Método configurado',
      salesAmount: summaryAmountOf(salesItem),
      balanceAmount: balanceItem ? summaryAmountOf(balanceItem) : summaryAmountOf(salesItem),
      count: summaryCountOf(salesItem || balanceItem),
    };
  });
}

function PaymentMethodCard({ method }) {
  const isCash = method.code === 'CASH';
  const balance = Number(method.balanceAmount || 0);
  const sales = Number(method.salesAmount || 0);

  return (
    <div className={`rounded-[26px] border p-5 shadow-[0_12px_32px_rgba(15,23,42,0.045)] ${
      isCash
        ? 'border-emerald-200 bg-emerald-50'
        : 'border-neutral-200 bg-white'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.16em] text-neutral-500">
            {method.label || methodLabel(method.code)}
          </div>
          <div className={`mt-2 text-2xl font-black ${amountClassByValue(balance)}`}>
            {formatMoney(balance)}
          </div>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
          {method.icon}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold">
        <div className="rounded-2xl bg-white/80 px-3 py-2">
          <div className="text-neutral-400">Vendido</div>
          <div className="mt-1 text-neutral-950">{formatMoney(sales)}</div>
        </div>
        <div className="rounded-2xl bg-white/80 px-3 py-2">
          <div className="text-neutral-400">Operaciones</div>
          <div className="mt-1 text-neutral-950">{method.count || 0}</div>
        </div>
      </div>

      <div className="mt-3 text-xs font-semibold text-neutral-500">
        {isCash ? 'Saldo físico esperado con apertura y movimientos.' : method.helper}
      </div>
    </div>
  );
}

function movementTypeLabel(type) {
  const labels = {
    INCOME: 'Ingreso',
    EXPENSE: 'Gasto',
    ADVANCE_BARBER: 'Adelanto barbero',
    PAYMENT_BARBER: 'Pago barbero',
    PAYMENT_METHOD_TRANSFER: 'Traslado entre métodos',
  };

  return labels[type] || type || 'Movimiento';
}

function saleValidationStatus(sale) {
  return String(
    sale?.paymentValidationStatus ??
      sale?.validationStatus ??
      sale?.estadoValidacionPago ??
      sale?.estadoPago ??
      ''
  )
    .trim()
    .toUpperCase();
}

function isPendingSaleValidation(sale) {
  const status = saleValidationStatus(sale);

  if (!status) return true;

  return (
    status === 'PENDING_VALIDATION' ||
    status === 'PENDING_APPROVAL' ||
    status === 'PENDING_REVIEW' ||
    status === 'PENDING' ||
    status === 'PENDIENTE' ||
    status === 'PENDIENTE_VALIDACION'
  );
}

function saleCreatedBy(sale) {
  return (
    sale?.createdByUserName ||
    sale?.createdByName ||
    sale?.createdBy ||
    sale?.barberName ||
    saleBarberName(sale)
  );
}

function movementStatusCode(movement) {
  return String(
    movement?.status ??
      movement?.approvalStatus ??
      movement?.estado ??
      movement?.estadoAprobacion ??
      ''
  )
    .trim()
    .toUpperCase();
}

function isPendingOwnerApproval(movement) {
  const code = movementStatusCode(movement);

  return (
    code === 'PENDING' ||
    code === 'PENDING_REVIEW' ||
    code === 'PENDING_APPROVAL' ||
    code === 'REQUESTED' ||
    code === 'SOLICITADO' ||
    code === 'PENDIENTE' ||
    code === 'PENDIENTE_APROBACION'
  );
}

function movementRequestedBy(movement) {
  return (
    movement?.requestedByUserName ||
    movement?.createdByUserName ||
    movement?.userName ||
    movement?.adminName ||
    'Usuario'
  );
}

function movementAmountClass(type) {
  if (type === 'INCOME') return 'text-emerald-700';
  if (type === 'PAYMENT_METHOD_TRANSFER') return 'text-blue-700';
  return 'text-red-700';
}

function amountClassByValue(value) {
    const number = Number(value || 0);
  
    if (number < 0) return 'text-red-700';
    if (number > 0) return 'text-neutral-950';
  
    return 'text-neutral-500';
  }
  
  function balanceTone(value) {
    const number = Number(value || 0);
  
    if (number < 0) return 'red';
    if (number > 0) return 'dark';
  
    return 'default';
  }

function StatCard({ title, value, helper, tone = 'default' }) {
  const styles = {
    default: 'border-neutral-200 bg-white',
    gold: 'border-amber-200 bg-[linear-gradient(135deg,#FFFBEB_0%,#FFFFFF_70%)]',
    dark: 'border-neutral-900 bg-neutral-950 text-white',
    green: 'border-emerald-200 bg-emerald-50',
    red: 'border-red-200 bg-red-50',
  };

  return (
    <div className={`rounded-[28px] border p-5 shadow-[0_12px_32px_rgba(15,23,42,0.045)] ${styles[tone]}`}>
      <div className={tone === 'dark' ? 'text-sm font-bold text-white/55' : 'text-sm font-bold text-neutral-500'}>
        {title}
      </div>

      <div className={tone === 'dark' ? 'mt-2 text-2xl font-black text-white' : 'mt-2 text-2xl font-black text-neutral-950'}>
        {value}
      </div>

      {helper && (
        <div className={tone === 'dark' ? 'mt-1 text-xs text-white/45' : 'mt-1 text-xs text-neutral-500'}>
          {helper}
        </div>
      )}
    </div>
  );
}


function toDateInputValue(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
}


function buildLocalSaleDateForBackend(dateValue) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const todayValue = toDateInputValue(now);
  const minValue = toDateInputValue(thirtyDaysAgo);
  let selected = String(dateValue || todayValue).trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(selected)) {
    selected = todayValue;
  }

  if (selected > todayValue) selected = todayValue;
  if (selected < minValue) selected = minValue;

  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  return `${selected}T${hh}:${min}:${ss}`;
}


function appointmentNumber(...values) {
  for (const value of values) {
    const number = Number(value ?? 0);
    if (!Number.isNaN(number) && number > 0) return number;
  }
  return 0;
}

function normalizeDepositStatus(value) {
  return String(value || '').trim().toUpperCase();
}

function isDepositApproved(value) {
  const status = normalizeDepositStatus(value);
  return (
    status === 'PAID' ||
    status === 'VALIDADO' ||
    status === 'VALIDATED' ||
    status === 'APPROVED' ||
    status === 'APROBADO'
  );
}

function saleDateInputMinValue() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return toDateInputValue(date);
}

function saleIdOf(sale) {
  return sale?.saleId ?? sale?.id ?? sale?.sale_id;
}

function saleDateOf(sale) {
  return (
    sale?.fechaCreacion ??
    sale?.saleDate ??
    sale?.createdAt ??
    sale?.created_at ??
    sale?.fecha ??
    null
  );
}

function saleBarberName(sale) {
  const labels = readBusinessLabels();
  const direct = String(
    sale?.barberName ??
      sale?.barbero ??
      sale?.barberUserName ??
      ''
  ).trim();

  if (direct) return direct;

  const items = Array.isArray(sale?.items) ? sale.items : [];

  for (const item of items) {
    const candidate = String(
      item?.barberUserName ??
        item?.barberName ??
        item?.barbero ??
        ''
    ).trim();

    if (candidate) return candidate;
  }

  return `${labels.professionalSingular[0].toUpperCase()}${labels.professionalSingular.slice(1)} no registrado`;
}

function isCourtesySale(sale) {
  return normalizeMethod(sale?.metodoPago) === 'FREE';
}

function saleReferenceValue(sale) {
  const subtotal = Number(sale?.subtotal ?? 0);
  if (subtotal > 0) return subtotal;

  const itemsTotal = saleItemsOf(sale).reduce((sum, item) => sum + saleItemTotal(item), 0);
  if (itemsTotal > 0) return itemsTotal;

  return Number(sale?.discount ?? 0);
}

function buildCourtesySummary(sales = []) {
  const byBarber = new Map();
  let count = 0;
  let referenceValue = 0;

  sales.filter(isCourtesySale).forEach((sale) => {
    const items = saleItemsOf(sale);
    const serviceItems = items.filter((item) => {
      const hasService = item?.serviceId || String(item?.serviceName ?? '').trim();
      const hasProduct = item?.productId || String(item?.productName ?? '').trim();
      return hasService || !hasProduct;
    });

    const entries = serviceItems.length > 0
      ? serviceItems.map((item) => ({
          barberName: saleItemBarberName(item) === '-' ? saleBarberName(sale) : saleItemBarberName(item),
          count: saleItemQuantity(item),
          referenceValue: saleItemTotal(item) || saleItemUnitPrice(item),
        }))
      : [{
          barberName: saleBarberName(sale),
          count: 1,
          referenceValue: saleReferenceValue(sale),
        }];

    entries.forEach((entry) => {
      const itemCount = Math.max(1, Number(entry.count || 1));
      const itemValue = Number(entry.referenceValue || 0);
      const current = byBarber.get(entry.barberName) || {
        barberName: entry.barberName,
        count: 0,
        referenceValue: 0,
      };

      current.count += itemCount;
      current.referenceValue += itemValue;
      byBarber.set(entry.barberName, current);
      count += itemCount;
      referenceValue += itemValue;
    });
  });

  return {
    count,
    referenceValue,
    byBarber: Array.from(byBarber.values()).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.referenceValue - a.referenceValue;
    }),
  };
}

function readAttendAppointmentFromStorage() {
  try {
    const raw = window.sessionStorage.getItem('ownerWebAttendAppointment');
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.appointmentId) return null;

    return parsed;
  } catch {
    return null;
  }
}

function clearAttendAppointmentFromStorage() {
  window.sessionStorage.removeItem('ownerWebAttendAppointment');
}

function servicePriceOf(service) {
  return Number(service?.price ?? service?.precio ?? 0);
}

function serviceAllowsVariablePrice(service) {
  return Boolean(
    service?.variablePrice ??
      service?.precioVariable ??
      service?.isVariablePrice ??
      service?.allowPriceOverride
  );
}

function servicePriceLabel(service) {
  const price = formatMoney(servicePriceOf(service));
  return serviceAllowsVariablePrice(service) ? `Desde ${price}` : price;
}

function itemSubtotal(item) {
  return Number(item.quantity || 1) * Number(item.unitPrice || 0);
}

function EmptyCard({ title, text, action }) {
    return (
      <div className="rounded-[30px] border border-dashed border-neutral-300 bg-white/70 p-8 text-center">
        <div className="text-xl font-black text-neutral-950">{title}</div>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-neutral-500">
          {text}
        </p>
  
        {action && <div className="mt-5">{action}</div>}
      </div>
    );
  }


function CashNegativeAlert({ expected, cashSalesTotal, expense }) {
    if (Number(expected || 0) >= 0) return null;
  
    return (
      <div className="rounded-[28px] border border-red-200 bg-red-50 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-red-600">
              Alerta de caja negativa
            </div>
  
            <h3 className="mt-2 text-xl font-black text-red-800">
              La caja física esperada está en negativo
            </h3>
  
            <p className="mt-2 max-w-3xl text-sm leading-6 text-red-700">
              Esto pasa cuando las salidas registradas superan el efectivo disponible.
              Revisa si hubo pagos a barberos, adelantos o gastos registrados con un
              método incorrecto.
            </p>
          </div>
  
          <div className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-red-700 shadow-sm">
            {formatMoney(cashSalesTotal)} - {formatMoney(expense)} = {formatMoney(expected)}
          </div>
        </div>
      </div>
  );
}

function PendingCashApprovalsSection({
  items,
  processingId,
  onApprove,
  onReject,
}) {
  if (!items.length) return null;

  return (
    <section className="rounded-[34px] border border-amber-200 bg-[linear-gradient(135deg,#FFFBEB_0%,#FFFFFF_70%)] p-6 shadow-[0_16px_45px_rgba(251,191,36,0.10)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">
            Aprobacion del dueno
          </div>
          <h3 className="mt-2 text-2xl font-black text-neutral-950">
            Movimientos pendientes de caja
          </h3>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-600">
            Revisa ingresos u otros movimientos antes de que afecten el saldo esperado de caja.
          </p>
        </div>

        <div className="rounded-2xl bg-amber-100 px-4 py-3 text-sm font-black text-amber-800">
          {items.length} pendiente{items.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {items.map((movement) => {
          const busy = processingId === movement.id;

          return (
            <article
              key={movement.id}
              className="rounded-[26px] border border-amber-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                    {movementTypeLabel(movement.type)} solicitado
                  </div>
                  <h4 className="mt-2 truncate text-lg font-black text-neutral-950">
                    {movement.concept || 'Movimiento pendiente'}
                  </h4>
                  <p className="mt-1 text-sm font-semibold text-neutral-500">
                    Solicitado por {movementRequestedBy(movement)}
                  </p>
                </div>

                <div className="text-right">
                  <div className={`text-2xl font-black ${movementAmountClass(movement.type)}`}>
                    {formatMoney(movement.amount)}
                  </div>
                  <div className="mt-1 text-xs font-bold text-neutral-400">
                    {methodLabel(movement.paymentMethod)}
                  </div>
                </div>
              </div>

              {movement.note && (
                <div className="mt-4 rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-600">
                  {movement.note}
                </div>
              )}

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onReject(movement)}
                  className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                >
                  Rechazar
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onApprove(movement)}
                  className="rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-black text-white transition hover:scale-[1.01] disabled:opacity-60"
                >
                  {busy ? 'Procesando...' : 'Aprobar movimiento'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function PendingSaleValidationsSection({
  items,
  processingId,
  labels = readBusinessLabels(),
  onView,
  onApprove,
  onReject,
}) {
  if (!items.length) return null;

  return (
    <section className="rounded-[34px] border border-blue-200 bg-[linear-gradient(135deg,#EFF6FF_0%,#FFFFFF_72%)] p-6 shadow-[0_16px_45px_rgba(37,99,235,0.08)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">
            Ventas por validar
          </div>
          <h3 className="mt-2 text-2xl font-black text-neutral-950">
            Aprobar ventas del equipo
          </h3>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-600">
            Revisa ventas registradas por {labels.professionalsPlural} antes de confirmarlas en caja y puntos.
          </p>
        </div>

        <div className="rounded-2xl bg-blue-100 px-4 py-3 text-sm font-black text-blue-800">
          {items.length} venta{items.length === 1 ? '' : 's'} pendiente{items.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {items.map((sale) => {
          const saleId = saleIdOf(sale);
          const busy = processingId === `sale-${saleId}`;
          const payments = salePaymentSummary(sale);

          return (
            <article
              key={saleId || `${saleDateOf(sale)}-${sale.total}`}
              className="rounded-[26px] border border-blue-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                    Venta #{saleId || '-'}
                  </div>
                  <h4 className="mt-2 truncate text-lg font-black text-neutral-950">
                    {sale.customerName || 'Cliente ocasional'}
                  </h4>
                  <p className="mt-1 text-sm font-semibold text-neutral-500">
                    Registrada por {saleCreatedBy(sale)}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-emerald-700">
                    {formatMoney(sale.total)}
                  </div>
                  <div className="mt-1 text-xs font-bold text-neutral-400">
                    {methodLabel(sale.metodoPago)}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3">
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-neutral-400">
                    {labels.professionalSingular}
                  </div>
                  <div className="mt-1 truncate text-sm font-black text-neutral-800">
                    {saleBarberName(sale)}
                  </div>
                </div>
                <div className="rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3">
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-neutral-400">
                    Fecha
                  </div>
                  <div className="mt-1 truncate text-sm font-black text-neutral-800">
                    {formatDateTime(saleDateOf(sale))}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-600">
                {payments}
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onView(sale)}
                  className="rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-black text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60"
                >
                  Ver detalle
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onReject(sale)}
                  className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                >
                  Rechazar
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onApprove(sale)}
                  className="rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-black text-white transition hover:scale-[1.01] disabled:opacity-60"
                >
                  {busy ? 'Procesando...' : 'Aprobar venta'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function OpenCashModal({ branch, onClose, onSaved }) {
  const [openingAmount, setOpeningAmount] = useState('0');
  const [openingNote, setOpeningNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    const amount = Number(String(openingAmount).replace(',', '.'));

    if (Number.isNaN(amount) || amount < 0) {
      setErrorMsg('Ingresa un monto válido.');
      return;
    }

    setSaving(true);

    try {
      await openCashRegister({
        branchId: branch.id,
        openingAmount: amount,
        openingNote: openingNote.trim() || null,
      });

      onSaved();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo abrir la caja.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Abrir caja" subtitle={branch?.name || 'Sede'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Monto inicial"
          value={openingAmount}
          onChange={setOpeningAmount}
          type="number"
          step="0.01"
          prefix={getTenantCurrencySymbol()}
        />

        <TextAreaField
          label="Nota de apertura"
          value={openingNote}
          onChange={setOpeningNote}
          placeholder="Ej. Apertura de turno mañana"
        />

        {errorMsg && <ErrorBox message={errorMsg} />}

        <button
          disabled={saving}
          className="w-full rounded-2xl bg-amber-400 px-5 py-4 font-black text-neutral-950 transition hover:scale-[1.01] disabled:opacity-60"
        >
          {saving ? 'Abriendo...' : 'Abrir caja'}
        </button>
      </form>
    </ModalShell>
  );
}

function CloseCashModal({ branch, cashRegister, onClose, onSaved }) {
  const expected = Number(cashRegister?.closingAmountExpected || 0);

  const [counted, setCounted] = useState(String(expected.toFixed(2)));
  const [closingNote, setClosingNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const countedNumber = Number(String(counted).replace(',', '.')) || 0;
  const difference = countedNumber - expected;

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    if (Number.isNaN(countedNumber) || countedNumber < 0) {
      setErrorMsg('Ingresa un monto contado válido.');
      return;
    }

    setSaving(true);

    try {
      await closeCashRegister({
        branchId: branch.id,
        cashRegisterId: cashRegister.id,
        closingAmountCounted: countedNumber,
        closingNote: closingNote.trim() || null,
      });

      onSaved();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo cerrar la caja.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Cerrar caja" subtitle={branch?.name || 'Sede'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard title="Esperado" value={formatMoney(expected)} helper="Según sistema" tone="gold" />
          <StatCard
            title="Diferencia"
            value={formatMoney(difference)}
            helper={difference === 0 ? 'Cuadra perfecto' : difference > 0 ? 'Sobra dinero' : 'Falta dinero'}
            tone={difference === 0 ? 'green' : 'red'}
          />
        </div>

        <InputField
          label="Monto contado"
          value={counted}
          onChange={setCounted}
          type="number"
          step="0.01"
          prefix={getTenantCurrencySymbol()}
        />

        <TextAreaField
          label="Observación de cierre"
          value={closingNote}
          onChange={setClosingNote}
          placeholder="Ej. Caja cerrada sin diferencias"
        />

        {errorMsg && <ErrorBox message={errorMsg} />}

        <button
          disabled={saving}
          className="w-full rounded-2xl bg-neutral-950 px-5 py-4 font-black text-white transition hover:scale-[1.01] disabled:opacity-60"
        >
          {saving ? 'Cerrando...' : 'Cerrar caja'}
        </button>
      </form>
    </ModalShell>
  );
}

function MovementModal({ branch, cashRegister, paymentMethods = DEFAULT_PAYMENT_METHODS, initialMovement = null, onClose, onSaved }) {
  const isEditing = Boolean(initialMovement?.id);
  const [type, setType] = useState(initialMovement?.type || 'EXPENSE');
  const [amount, setAmount] = useState(initialMovement?.amount ? String(initialMovement.amount) : '');
  const [concept, setConcept] = useState(initialMovement?.concept || 'Gasto general');
  const [note, setNote] = useState(initialMovement?.note || '');
  const [paymentMethod, setPaymentMethod] = useState(normalizeMethod(initialMovement?.paymentMethod) || 'CASH');
  const [fromPaymentMethod, setFromPaymentMethod] = useState(normalizeMethod(initialMovement?.fromPaymentMethod) || defaultExtraPaymentMethod(paymentMethods));
  const [toPaymentMethod, setToPaymentMethod] = useState(normalizeMethod(initialMovement?.toPaymentMethod) || 'CASH');

  const [barbers, setBarbers] = useState([]);
  const [selectedBarberId, setSelectedBarberId] = useState(String(initialMovement?.barberUserId ?? initialMovement?.barberId ?? ''));
  const [loadingBarbers, setLoadingBarbers] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const concepts = {
    INCOME: [
      'Ingreso adicional',
      'Abono manual',
      'Regularización de caja',
      'Pago externo',
      'Otro ingreso',
    ],
    EXPENSE: [
      'Compra de productos',
      'Limpieza',
      'Movilidad',
      'Alimentación',
      'Mantenimiento',
      'Pago de Luz',
      'Pago de Agua',
      'Pago de Alquiler',
      'Servicios',
      'Otros',
    ],
    ADVANCE_BARBER: [
      'Adelanto a barbero',
      'Préstamo del día',
      'Liquidación parcial',
    ],
    PAYMENT_BARBER: [
      'Pago a barbero manual',
      'Pago de porcentaje',
      'Pago de comisión',
    ],
    PAYMENT_METHOD_TRANSFER: [
      'Traslado entre métodos',
      'Conversión a efectivo',
      'Depósito a cuenta digital',
      'Regularización entre métodos',
    ],
  };

  const paymentOptions = paymentSelectOptions(paymentMethods);

  const needsBarber = type === 'ADVANCE_BARBER' || type === 'PAYMENT_BARBER';
  const isTransfer = type === 'PAYMENT_METHOD_TRANSFER';

  useEffect(() => {
    async function loadBarbers() {
      if (!branch?.id) return;

      setLoadingBarbers(true);

      try {
        const data = await getCashBarbers(branch.id);
        setBarbers(data.filter((item) => item.id > 0));
      } catch {
        setBarbers([]);
      } finally {
        setLoadingBarbers(false);
      }
    }

    loadBarbers();
  }, [branch?.id]);

  function handleTypeChange(nextType) {
    setType(nextType);
    setConcept(concepts[nextType]?.[0] || 'Movimiento');

    if (nextType !== 'ADVANCE_BARBER' && nextType !== 'PAYMENT_BARBER') {
      setSelectedBarberId('');
    }

    if (nextType === 'PAYMENT_METHOD_TRANSFER') {
      setFromPaymentMethod(defaultExtraPaymentMethod(paymentMethods));
      setToPaymentMethod('CASH');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    const parsedAmount = Number(String(amount).replace(',', '.'));

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Ingresa un monto mayor a cero.');
      return;
    }

    if (isTransfer && fromPaymentMethod === toPaymentMethod) {
      setErrorMsg('El método origen y destino no pueden ser iguales.');
      return;
    }

    if (needsBarber && !selectedBarberId) {
      setErrorMsg('Selecciona el barbero relacionado.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        branchId: branch.id,
        type,
        amount: parsedAmount,
        concept,
        note: note.trim() || null,
        barberUserId: needsBarber ? Number(selectedBarberId) : null,
        paymentMethod: isTransfer ? toPaymentMethod : paymentMethod,
        fromPaymentMethod: isTransfer ? fromPaymentMethod : null,
        toPaymentMethod: isTransfer ? toPaymentMethod : null,
        movementDate: initialMovement?.movementDate || null,
      };

      if (isEditing) {
        await updateCashMovement({
          ...payload,
          movementId: initialMovement.id,
        });
      } else {
        await createCashMovement({
          ...payload,
          cashRegisterId: cashRegister.id,
        });
      }

      onSaved();
    } catch (error) {
      setErrorMsg(error.message || (isEditing ? 'No se pudo actualizar el movimiento.' : 'No se pudo registrar el movimiento.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title={isEditing ? 'Editar movimiento' : 'Registrar movimiento'} subtitle={branch?.name || 'Sede'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <SelectField
          label="Tipo de movimiento"
          value={type}
          onChange={handleTypeChange}
          options={[
            { value: 'INCOME', label: 'Añadir ingreso' },
            { value: 'EXPENSE', label: 'Gasto general' },
            { value: 'ADVANCE_BARBER', label: 'Adelanto a barbero' },
            { value: 'PAYMENT_BARBER', label: 'Pago a barbero manual' },
            { value: 'PAYMENT_METHOD_TRANSFER', label: 'Trasladar dinero entre métodos' },
          ]}
        />

        <InputField
          label="Monto"
          value={amount}
          onChange={setAmount}
          type="number"
          step="0.01"
          prefix={getTenantCurrencySymbol()}
        />

        <SelectField
          label="Concepto"
          value={concept}
          onChange={setConcept}
          options={(concepts[type] || ['Movimiento']).map((item) => ({
            value: item,
            label: item,
          }))}
        />

        {needsBarber && (
          <>
            {loadingBarbers ? (
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-black text-neutral-500">
                Cargando barberos...
              </div>
            ) : barbers.length === 0 ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-bold text-red-700">
                No se encontraron barberos activos para esta sede.
              </div>
            ) : (
              <SelectField
                label="Barbero relacionado"
                value={selectedBarberId}
                onChange={setSelectedBarberId}
                options={[
                  { value: '', label: 'Selecciona un barbero' },
                  ...barbers.map((barber) => ({
                    value: String(barber.id),
                    label: barber.name,
                  })),
                ]}
              />
            )}
          </>
        )}

        {isTransfer ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              label="Desde"
              value={fromPaymentMethod}
              onChange={setFromPaymentMethod}
              options={paymentOptions}
            />

            <SelectField
              label="Hacia"
              value={toPaymentMethod}
              onChange={setToPaymentMethod}
              options={paymentOptions}
            />
          </div>
        ) : (
          <SelectField
            label={type === 'INCOME' ? 'Método de ingreso' : 'Método de salida'}
            value={paymentMethod}
            onChange={setPaymentMethod}
            options={paymentOptions}
          />
        )}

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {isTransfer
            ? 'Este traslado no crea una venta. Solo mueve saldo de un método a otro.'
            : type === 'INCOME'
              ? 'Este ingreso se sumará al esperado de caja solo si el método es efectivo.'
              : needsBarber
                ? 'Este movimiento quedará relacionado al barbero seleccionado.'
                : 'Solo los movimientos en efectivo afectarán el esperado de caja.'}
        </div>

        <TextAreaField
          label="Nota"
          value={note}
          onChange={setNote}
          placeholder={needsBarber ? 'Ej. Pago manual o adelanto solicitado.' : 'Detalle opcional'}
        />

        {errorMsg && <ErrorBox message={errorMsg} />}

        <button
          disabled={saving}
          className="w-full rounded-2xl bg-amber-400 px-5 py-4 font-black text-neutral-950 transition hover:scale-[1.01] disabled:opacity-60"
        >
          {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar movimiento'}
        </button>
      </form>
    </ModalShell>
  );
}

function BarberPaymentModal({ branch, cashRegister, paymentMethods = DEFAULT_PAYMENT_METHODS, onClose, onSaved }) {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 6);

  const [barbers, setBarbers] = useState([]);
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [periodFrom, setPeriodFrom] = useState(toDateInputValue(sevenDaysAgo));
  const [periodTo, setPeriodTo] = useState(toDateInputValue(today));
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentRows, setPaymentRows] = useState([createPaymentDraft('CASH', 0)]);
  const [note, setNote] = useState('');

  const [preview, setPreview] = useState(null);
  const [loadingBarbers, setLoadingBarbers] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const paymentOptions = paymentSelectOptions(paymentMethods);

  const amountToPay = roundMoney(parseMoneyInput(amountPaid));
  const distributedTotal = useMemo(
    () => roundMoney(paymentRows.reduce((sum, row) => sum + parseMoneyInput(row.amount), 0)),
    [paymentRows]
  );
  const remainingToDistribute = roundMoney(amountToPay - distributedTotal);

  useEffect(() => {
    async function loadBarbers() {
      setLoadingBarbers(true);
      setErrorMsg('');

      try {
        const data = await getCashBarbers(branch.id);
        setBarbers(data.filter((item) => item.id > 0));
      } catch (error) {
        setErrorMsg(error.message || 'No se pudieron cargar los barberos.');
      } finally {
        setLoadingBarbers(false);
      }
    }

    loadBarbers();
  }, [branch.id]);

  function resetPaymentRows(total, preferredMethod = 'CASH') {
    const methodExists = paymentOptions.some((option) => option.value === preferredMethod);
    const method = methodExists ? preferredMethod : paymentOptions[0]?.value || 'CASH';
    setPaymentRows([createPaymentDraft(method, Math.max(Number(total || 0), 0))]);
  }

  async function loadPreview(nextBarberId = selectedBarberId) {
    if (!nextBarberId) return;

    setLoadingPreview(true);
    setErrorMsg('');

    try {
      const data = await getBarberPaymentPreview({
        branchId: branch.id,
        barberUserId: Number(nextBarberId),
        periodFrom,
        periodTo,
      });

      setPreview(data);

      const pending = Number(data?.pendingAmount ?? 0);
      const nextAmount = pending > 0 ? pending.toFixed(2) : '0.00';
      setAmountPaid(nextAmount);
      resetPaymentRows(pending > 0 ? pending : 0);
    } catch (error) {
      setPreview(null);
      setErrorMsg(error.message || 'No se pudo calcular el pago del barbero.');
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleBarberChange(value) {
    setSelectedBarberId(value);
    setPreview(null);
    setAmountPaid('');
    resetPaymentRows(0);

    if (value) {
      await loadPreview(value);
    }
  }

  function handleDateChange(kind, value) {
    if (kind === 'from') {
      setPeriodFrom(value);
    } else {
      setPeriodTo(value);
    }

    setPreview(null);
    setAmountPaid('');
    resetPaymentRows(0);
  }

  function handleAmountChange(value) {
    setAmountPaid(value);

    const total = parseMoneyInput(value);
    if (paymentRows.length === 1) {
      setPaymentRows((current) => [
        {
          ...current[0],
          amount: total > 0 ? total.toFixed(2) : '0.00',
        },
      ]);
    }
  }

  function updatePaymentRow(key, field, value) {
    setPaymentRows((current) =>
      current.map((row) =>
        row.key === key
          ? {
              ...row,
              [field]: field === 'method' ? normalizeMethod(value) : value,
            }
          : row
      )
    );
  }

  function addPaymentRow() {
    const nextMethod = paymentOptions.find((option) => !paymentRows.some((row) => normalizeMethod(row.method) === option.value))?.value
      || paymentOptions[0]?.value
      || 'CASH';

    const amount = remainingToDistribute > 0 ? remainingToDistribute : 0;

    setPaymentRows((current) => [
      ...current,
      createPaymentDraft(nextMethod, amount),
    ]);
  }

  function removePaymentRow(key) {
    setPaymentRows((current) => {
      if (current.length <= 1) return current;
      return current.filter((row) => row.key !== key);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedBarberId) {
      setErrorMsg('Selecciona un barbero.');
      return;
    }

    const amount = roundMoney(parseMoneyInput(amountPaid));

    if (amount <= 0) {
      setErrorMsg('Ingresa un monto válido mayor a cero.');
      return;
    }

    const normalizedPayments = paymentRows
      .map((row) => ({
        method: normalizeMethod(row.method),
        amount: roundMoney(parseMoneyInput(row.amount)),
      }))
      .filter((row) => row.method && row.amount > 0);

    if (normalizedPayments.length === 0) {
      setErrorMsg('Agrega al menos un método de pago.');
      return;
    }

    const totalPayments = roundMoney(
      normalizedPayments.reduce((sum, row) => sum + row.amount, 0)
    );

    if (Math.abs(totalPayments - amount) > 0.009) {
      setErrorMsg(
        `La distribución debe sumar exactamente ${formatMoney(amount)}. Actualmente suma ${formatMoney(totalPayments)}.`
      );
      return;
    }

    setSaving(true);

    try {
      await createBarberPayment({
        branchId: branch.id,
        cashRegisterId: cashRegister.id,
        barberUserId: Number(selectedBarberId),
        periodFrom,
        periodTo,
        amountPaid: amount,
        paymentMethod: normalizedPayments.length > 1 ? 'MIXED' : normalizedPayments[0].method,
        payments: normalizedPayments,
        note: note.trim() || null,
      });

      onSaved();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo registrar el pago al barbero.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Pagar barbero" subtitle={branch?.name || 'Sede'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {loadingBarbers ? (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-black text-neutral-500">
            Cargando barberos...
          </div>
        ) : (
          <SelectField
            label="Barbero"
            value={selectedBarberId}
            onChange={handleBarberChange}
            options={[
              { value: '', label: 'Selecciona un barbero' },
              ...barbers.map((barber) => ({
                value: String(barber.id),
                label: barber.name,
              })),
            ]}
          />
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <InputField
            label="Desde"
            value={periodFrom}
            onChange={(value) => handleDateChange('from', value)}
            type="date"
          />

          <InputField
            label="Hasta"
            value={periodTo}
            onChange={(value) => handleDateChange('to', value)}
            type="date"
          />
        </div>

        <button
          type="button"
          onClick={() => loadPreview()}
          disabled={!selectedBarberId || loadingPreview}
          className="w-full rounded-2xl border border-neutral-200 bg-neutral-950 px-5 py-4 text-sm font-black text-white transition hover:scale-[1.01] disabled:opacity-60"
        >
          {loadingPreview ? 'Calculando...' : 'Calcular pendiente'}
        </button>

        {preview && (
          <div className="rounded-[26px] border border-amber-200 bg-amber-50 p-5">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">
              Resumen inteligente
            </div>

            <div className="mt-3 text-xl font-black text-neutral-950">
              {preview.barberName || 'Barbero'}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {String(preview.paymentMode || '').toUpperCase() === 'SALARY' ? (
                <MiniPreviewItem label="Sueldo del periodo" value={formatMoney(preview.salaryAmount)} />
              ) : (
                <MiniPreviewItem label="Servicios" value={formatMoney(preview.serviceCommissionAmount)} />
              )}
              <MiniPreviewItem label="Productos" value={formatMoney(preview.productCommissionAmount)} />
              <MiniPreviewItem label="Propinas" value={formatMoney(preview.tipsAmount)} />
              <MiniPreviewItem label="Adelantos" value={formatMoney(preview.advancesApplied)} />
              <MiniPreviewItem label="Pagos previos" value={formatMoney(preview.previousPaymentsApplied)} />
              <MiniPreviewItem label="Pendiente" value={formatMoney(preview.pendingAmount)} strong />
            </div>
          </div>
        )}

        <InputField
          label="Monto a pagar"
          value={amountPaid}
          onChange={handleAmountChange}
          type="number"
          step="0.01"
          prefix={getTenantCurrencySymbol()}
        />

        <div className="rounded-[26px] border border-neutral-200 bg-neutral-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-sm font-black text-neutral-950">
                Distribuir por método de pago
              </div>
              <div className="mt-1 text-xs font-bold text-neutral-500">
                Puedes pagar una parte en efectivo y otra por Yape, Plin, tarjeta u otro método configurado.
              </div>
            </div>

            <button
              type="button"
              onClick={addPaymentRow}
              className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-xs font-black text-neutral-900 shadow-sm transition hover:bg-amber-50"
            >
              + Agregar método
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {paymentRows.map((row, index) => (
              <div
                key={row.key}
                className="grid gap-3 rounded-2xl border border-neutral-200 bg-white p-3 sm:grid-cols-[1fr_1fr_auto]"
              >
                <SelectField
                  label={`Método ${index + 1}`}
                  value={normalizeMethod(row.method)}
                  onChange={(value) => updatePaymentRow(row.key, 'method', value)}
                  options={paymentOptions}
                />

                <InputField
                  label="Monto"
                  value={row.amount}
                  onChange={(value) => updatePaymentRow(row.key, 'amount', value)}
                  type="number"
                  step="0.01"
                  prefix={getTenantCurrencySymbol()}
                />

                <button
                  type="button"
                  onClick={() => removePaymentRow(row.key)}
                  disabled={paymentRows.length <= 1}
                  className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40 sm:self-end"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MiniPreviewItem label="Monto a pagar" value={formatMoney(amountToPay)} />
            <MiniPreviewItem label="Distribuido" value={formatMoney(distributedTotal)} />
            <MiniPreviewItem
              label={remainingToDistribute >= 0 ? 'Falta distribuir' : 'Excedente'}
              value={formatMoney(Math.abs(remainingToDistribute))}
              strong={Math.abs(remainingToDistribute) < 0.01}
            />
          </div>

          {Math.abs(remainingToDistribute) >= 0.01 && (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
              La suma de los métodos debe coincidir con el monto a pagar antes de confirmar.
            </div>
          )}
        </div>

        <TextAreaField
          label="Observación"
          value={note}
          onChange={setNote}
          placeholder="Ej. Pago semanal del barbero"
        />

        {errorMsg && <ErrorBox message={errorMsg} />}

        <button
          disabled={saving}
          className="w-full rounded-2xl bg-amber-400 px-5 py-4 font-black text-neutral-950 transition hover:scale-[1.01] disabled:opacity-60"
        >
          {saving ? 'Registrando pago...' : 'Confirmar pago'}
        </button>
      </form>
    </ModalShell>
  );
}

function MiniPreviewItem({ label, value, strong = false }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        strong ? 'border-emerald-200 bg-emerald-50' : 'border-neutral-200 bg-white'
      }`}
    >
      <div className="text-xs font-bold text-neutral-500">{label}</div>
      <div className={`mt-1 text-lg font-black ${strong ? 'text-emerald-700' : 'text-neutral-950'}`}>
        {value}
      </div>
    </div>
  );
}

function CourtesySummarySection({ summary, labels = readBusinessLabels() }) {
  if (!summary?.count) return null;

  return (
    <section className="rounded-[32px] border border-amber-200 bg-amber-50 p-6 shadow-[0_16px_45px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">
            {labels.courtesyPlural[0].toUpperCase() + labels.courtesyPlural.slice(1)} de hoy
          </div>
          <h3 className="mt-2 text-2xl font-black text-neutral-950">
            Servicios gratis registrados
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-amber-800/75">
            Controla cuantas {labels.courtesyPlural} se entregaron y su valor referencial por {labels.professionalSingular}.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
              Gratis
            </div>
            <div className="mt-1 text-2xl font-black text-neutral-950">
              {summary.count}
            </div>
          </div>
          <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
              Valor ref.
            </div>
            <div className="mt-1 text-2xl font-black text-neutral-950">
              {formatMoney(summary.referenceValue)}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {summary.byBarber.map((item) => (
          <div key={item.barberName} className="rounded-[24px] border border-amber-100 bg-white p-4 shadow-sm">
            <div className="text-sm font-black text-neutral-950">{item.barberName}</div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-2xl bg-amber-50 px-3 py-2">
                <div className="text-xs font-bold text-amber-700">Cantidad</div>
                <div className="mt-1 font-black text-neutral-950">{item.count}</div>
              </div>
              <div className="rounded-2xl bg-neutral-50 px-3 py-2">
                <div className="text-xs font-bold text-neutral-500">Ref.</div>
                <div className="mt-1 font-black text-neutral-950">{formatMoney(item.referenceValue)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SalesSection({ sales, canManageSales, labels = readBusinessLabels(), onView, onEdit, onDelete }) {
  return (
    <div className="rounded-[32px] border border-neutral-200 bg-white p-6 shadow-[0_16px_45px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
            Ventas
          </div>

          <h3 className="mt-2 text-2xl font-black text-neutral-950">
            Ventas de hoy
          </h3>

          <p className="mt-1 text-sm text-neutral-500">
            Ventas registradas en la sede seleccionada.
          </p>
        </div>

        <div className="rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-black text-neutral-700">
          {sales.length} venta{sales.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-[26px] border border-neutral-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-[linear-gradient(135deg,#090909_0%,#111827_100%)] text-white">
            <tr>
              <th className="px-5 py-4 font-black">Cliente</th>
              <th className="px-5 py-4 font-black">{labels.professionalSingular[0].toUpperCase() + labels.professionalSingular.slice(1)}</th>
              <th className="px-5 py-4 font-black">Método</th>
              <th className="px-5 py-4 font-black">Total</th>
              <th className="px-5 py-4 font-black">Fecha</th>
              <th className="px-5 py-4 font-black text-right">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td className="px-5 py-6 text-neutral-500" colSpan="6">
                  Aún no hay ventas registradas hoy.
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr key={saleIdOf(sale)} className="border-t border-neutral-200 transition hover:bg-amber-50/50">
                  <td className="px-5 py-5">
                    <div className="font-black text-neutral-950">
                      {sale.customerName || 'Cliente ocasional'}
                    </div>
                    <div className="mt-1 text-xs text-neutral-400">
                      ID: {saleIdOf(sale) || '-'}
                    </div>
                  </td>

                  <td className="px-5 py-5 font-bold text-neutral-700">
                    {saleBarberName(sale)}
                  </td>

                  <td className="px-5 py-5">
                    <div className="font-black text-neutral-800">
                      {methodLabel(sale.metodoPago)}
                    </div>
                    <div className="mt-1 max-w-[240px] text-xs font-bold leading-5 text-neutral-500">
                      {salePaymentSummary(sale)}
                    </div>
                  </td>

                  <td className="px-5 py-5 font-black text-emerald-700">
                    {formatMoney(sale.total)}
                  </td>

                  <td className="px-5 py-5 text-xs font-bold text-neutral-500">
                    {formatDateTime(saleDateOf(sale))}
                  </td>

                  <td className="px-5 py-5">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        onClick={() => onView(sale)}
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-100"
                      >
                        Ver detalle
                      </button>
                      {canManageSales && (
                        <>
                          <button
                            onClick={() => onEdit(sale)}
                            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-black text-neutral-700 hover:bg-neutral-50"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => onDelete(sale)}
                            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-100"
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function saleItemsOf(sale) {
  return Array.isArray(sale?.items)
    ? sale.items
    : Array.isArray(sale?.saleItems)
      ? sale.saleItems
      : [];
}

function saleItemName(item) {
  return String(
    item?.serviceName ??
      item?.serviceNombre ??
      item?.productName ??
      item?.nombreItem ??
      item?.name ??
      'Item'
  );
}

function saleItemTypeLabel(item) {
  if (item?.productId || item?.productName) return 'Producto';
  return 'Servicio';
}

function saleItemBarberName(item) {
  return String(
    item?.barberUserName ??
      item?.barberName ??
      item?.barbero ??
      '-'
  );
}

function saleItemQuantity(item) {
  return Number(item?.cantidad ?? item?.quantity ?? 1) || 1;
}

function saleItemUnitPrice(item) {
  return Number(item?.precioUnitario ?? item?.unitPrice ?? 0) || 0;
}

function saleItemTotal(item) {
  const direct = Number(item?.subtotal ?? item?.total ?? 0);
  if (direct > 0) return direct;
  return saleItemQuantity(item) * saleItemUnitPrice(item);
}

function DetailMetric({ label, value, tone = 'default', helper }) {
  const styles = {
    default: 'border-neutral-200 bg-white text-neutral-950',
    gold: 'border-amber-200 bg-amber-50 text-amber-800',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    red: 'border-red-200 bg-red-50 text-red-800',
    dark: 'border-neutral-900 bg-neutral-950 text-white',
  };

  return (
    <div className={`rounded-[22px] border p-4 ${styles[tone] || styles.default}`}>
      <div className={tone === 'dark' ? 'text-xs font-black uppercase tracking-[0.14em] text-white/45' : 'text-xs font-black uppercase tracking-[0.14em] text-neutral-500'}>
        {label}
      </div>
      <div className={tone === 'dark' ? 'mt-2 text-xl font-black text-white' : 'mt-2 text-xl font-black'}>
        {value}
      </div>
      {helper && (
        <div className={tone === 'dark' ? 'mt-1 text-xs font-bold text-white/45' : 'mt-1 text-xs font-bold text-neutral-500'}>
          {helper}
        </div>
      )}
    </div>
  );
}

function SaleDetailModal({ sale, onClose }) {
  const payments = salePaymentsOf(sale);
  const items = saleItemsOf(sale);
  const subtotal = Number(sale?.subtotal ?? 0);
  const discount = Number(sale?.discount ?? 0);
  const tipAmount = Number(sale?.tipAmount ?? 0);
  const total = Number(sale?.total ?? 0);
  const cashReceived = Number(sale?.cashReceived ?? 0);
  const changeAmount = Number(sale?.changeAmount ?? 0);
  const saleId = saleIdOf(sale);

  return (
    <ModalShell
      title={`Detalle de venta #${saleId || '-'}`}
      subtitle={sale?.customerName || 'Cliente ocasional'}
      onClose={onClose}
      maxWidth="max-w-5xl"
    >
      <div className="space-y-5">
        <div className="rounded-[28px] border border-neutral-200 bg-[linear-gradient(135deg,#F8FAFC_0%,#FFFFFF_70%)] p-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <DetailMetric label="Cliente" value={sale?.customerName || 'Cliente ocasional'} helper={sale?.customerId ? `ID cliente: ${sale.customerId}` : 'Sin cliente registrado'} />
            <DetailMetric label="Barbero" value={saleBarberName(sale)} helper="Principal o primer item" />
            <DetailMetric label="Fecha" value={formatDateTime(saleDateOf(sale))} helper="Fecha de venta" />
            <DetailMetric label="Método" value={methodLabel(sale?.metodoPago)} helper={payments.length > 1 ? 'Pago mixto' : 'Pago único'} tone={payments.length > 1 ? 'gold' : 'default'} />
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.045)]">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
                  Items vendidos
                </div>
                <div className="mt-1 text-sm font-bold text-neutral-500">
                  Servicios y productos incluidos en esta venta.
                </div>
              </div>
              <div className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-600">
                {items.length} item{items.length === 1 ? '' : 's'}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-5 text-sm font-bold text-neutral-500">
                  Esta venta no trajo detalle de items en la respuesta.
                </div>
              ) : (
                items.map((item, index) => (
                  <div key={`${saleItemName(item)}-${index}`} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="truncate text-base font-black text-neutral-950">
                          {saleItemName(item)}
                        </div>
                        <div className="mt-1 text-xs font-bold text-neutral-500">
                          {saleItemTypeLabel(item)} · Barbero: {saleItemBarberName(item)}
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <div className="text-base font-black text-neutral-950">
                          {formatMoney(saleItemTotal(item))}
                        </div>
                        <div className="mt-1 text-xs font-bold text-neutral-500">
                          {saleItemQuantity(item)} x {formatMoney(saleItemUnitPrice(item))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.045)]">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
                Métodos de pago
              </div>
              <div className="mt-4 space-y-3">
                {payments.length === 0 ? (
                  <div className="rounded-2xl bg-neutral-50 p-4 text-sm font-bold text-neutral-500">
                    {methodLabel(sale?.metodoPago)} · {formatMoney(total)}
                  </div>
                ) : (
                  payments.map((payment, index) => (
                    <div key={`${payment.method}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
                      <div>
                        <div className="font-black text-neutral-950">
                          {methodLabel(payment.method)}
                        </div>
                        <div className="text-xs font-bold text-neutral-500">
                          Método {index + 1}
                        </div>
                      </div>
                      <div className="text-lg font-black text-emerald-700">
                        {formatMoney(payment.amount)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.045)]">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
                Resumen económico
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <DetailMetric label="Subtotal" value={formatMoney(subtotal)} />
                <DetailMetric label="Descuento" value={formatMoney(discount)} tone={discount > 0 ? 'red' : 'default'} />
                <DetailMetric label="Propina" value={formatMoney(tipAmount)} tone={tipAmount > 0 ? 'green' : 'default'} helper={sale?.tipBarberUserName ? `Para ${sale.tipBarberUserName}` : null} />
                <DetailMetric label="Total" value={formatMoney(total)} tone="dark" />
                <DetailMetric label="Recibido" value={formatMoney(cashReceived)} helper="Solo efectivo recibido" />
                <DetailMetric label="Vuelto" value={formatMoney(changeAmount)} tone={changeAmount > 0 ? 'green' : 'default'} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function EditSaleModal({ branch, sale, paymentMethods = DEFAULT_PAYMENT_METHODS, onClose, onSaved }) {
  const salePayments = salePaymentsOf(sale).filter(
    (payment) => normalizeMethod(payment.method) !== 'DEPOSIT_APPLIED'
  );

  const initialPayments = salePayments.length > 0
    ? salePayments.map((payment) => createPaymentDraft(normalizeMethod(payment.method), payment.amount))
    : [createPaymentDraft(normalizeMethod(sale?.metodoPago || 'CASH'), Number(sale?.total || 0))];

  const [subtotal, setSubtotal] = useState(String(Number(sale?.subtotal ?? sale?.total ?? 0).toFixed(2)));
  const [discount, setDiscount] = useState(String(Number(sale?.discount ?? 0).toFixed(2)));
  const [total, setTotal] = useState(String(Number(sale?.total ?? 0).toFixed(2)));
  const [cashReceived, setCashReceived] = useState(String(Number(sale?.cashReceived ?? sale?.total ?? 0).toFixed(2)));
  const [payments, setPayments] = useState(initialPayments);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const paymentOptions = paymentSelectOptions(paymentMethods);

  const totalNumber = roundMoney(parseMoneyInput(total));
  const paymentPayloads = payments
    .map((payment) => ({
      method: normalizeMethod(payment.method),
      amount: roundMoney(parseMoneyInput(payment.amount)),
    }))
    .filter((payment) => payment.amount > 0);

  const paymentsTotal = roundMoney(paymentPayloads.reduce((sum, payment) => sum + payment.amount, 0));
  const remainingPayment = roundMoney(totalNumber - paymentsTotal);
  const cashPaymentAmount = roundMoney(
    paymentPayloads
      .filter((payment) => normalizeMethod(payment.method) === 'CASH')
      .reduce((sum, payment) => sum + payment.amount, 0)
  );
  const cashReceivedNumber = roundMoney(parseMoneyInput(cashReceived));
  const changeAmount = cashPaymentAmount > 0
    ? roundMoney(Math.max(0, cashReceivedNumber - cashPaymentAmount))
    : 0;

  function updatePayment(index, patch) {
    setPayments((prev) => prev.map((payment, currentIndex) => (
      currentIndex === index ? { ...payment, ...patch } : payment
    )));
  }

  function addPaymentMethod() {
    setPayments((prev) => [...prev, createPaymentDraft(defaultExtraPaymentMethod(paymentMethods), 0)]);
  }

  function removePaymentMethod(index) {
    setPayments((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    const saleId = saleIdOf(sale);
    if (!saleId) {
      setErrorMsg('No se encontró el ID de la venta.');
      return;
    }

    if (totalNumber < 0) {
      setErrorMsg('El total no puede ser negativo.');
      return;
    }

    if (totalNumber > 0 && paymentPayloads.length === 0) {
      setErrorMsg('Agrega al menos un método de pago.');
      return;
    }

    if (Math.abs(remainingPayment) > 0.009) {
      setErrorMsg(
        remainingPayment > 0
          ? `Falta cobrar ${formatMoney(remainingPayment)}.`
          : `Los pagos superan el total por ${formatMoney(Math.abs(remainingPayment))}.`
      );
      return;
    }

    if (cashPaymentAmount > 0 && cashReceivedNumber + 0.009 < cashPaymentAmount) {
      setErrorMsg('El efectivo recibido no puede ser menor al monto pagado en efectivo.');
      return;
    }

    const mainPaymentMethod = totalNumber === 0
      ? 'FREE'
      : paymentPayloads.length > 1
        ? 'MIXED'
        : paymentPayloads[0]?.method || 'CASH';

    setSaving(true);

    try {
      await updateCashSale({
        branchId: branch.id,
        saleId,
        customerId: sale.customerId ?? null,
        metodoPago: mainPaymentMethod,
        subtotal: parseMoneyInput(subtotal),
        discount: parseMoneyInput(discount),
        total: totalNumber,
        cashReceived: cashPaymentAmount > 0 ? cashReceivedNumber : totalNumber,
        changeAmount,
        payments: totalNumber === 0 ? [] : paymentPayloads,
      });

      onSaved();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo actualizar la venta.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Editar venta" subtitle={branch?.name || 'Sede'} onClose={onClose} maxWidth="max-w-5xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <InputField label="Subtotal" value={subtotal} onChange={setSubtotal} type="number" step="0.01" prefix={getTenantCurrencySymbol()} />
          <InputField label="Descuento" value={discount} onChange={setDiscount} type="number" step="0.01" prefix={getTenantCurrencySymbol()} />
          <InputField label="Total" value={total} onChange={setTotal} type="number" step="0.01" prefix={getTenantCurrencySymbol()} />
        </div>

        <div className="rounded-[28px] border border-neutral-200 bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.20em] text-amber-600">
                Métodos de pago
              </div>
              <p className="mt-1 text-sm font-semibold text-neutral-500">
                Puedes editar pagos mixtos sin afectar Flutter. La suma debe coincidir con el total.
              </p>
            </div>

            <button
              type="button"
              onClick={addPaymentMethod}
              className="rounded-2xl border border-neutral-200 bg-neutral-950 px-4 py-3 text-sm font-black text-white transition hover:scale-[1.01]"
            >
              + Agregar método
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {payments.map((payment, index) => (
              <div key={payment.key} className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-4">
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                  <SelectField
                    label={`Método ${index + 1}`}
                    value={payment.method}
                    onChange={(value) => updatePayment(index, { method: value })}
                    options={paymentOptions}
                  />

                  <InputField
                    label="Monto"
                    value={payment.amount}
                    onChange={(value) => updatePayment(index, { amount: value })}
                    type="number"
                    step="0.01"
                    prefix={getTenantCurrencySymbol()}
                  />

                  <button
                    type="button"
                    onClick={() => removePaymentMethod(index)}
                    disabled={payments.length <= 1}
                    className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {cashPaymentAmount > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InputField
                label="Efectivo recibido"
                value={cashReceived}
                onChange={setCashReceived}
                type="number"
                step="0.01"
                prefix={getTenantCurrencySymbol()}
              />
              <StatCard title="Vuelto" value={formatMoney(changeAmount)} tone={changeAmount > 0 ? 'green' : 'default'} />
            </div>
          )}

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <StatCard title="Total venta" value={formatMoney(totalNumber)} />
            <StatCard title="Pagado" value={formatMoney(paymentsTotal)} tone={Math.abs(remainingPayment) <= 0.009 ? 'green' : 'gold'} />
            <StatCard
              title={remainingPayment >= 0 ? 'Falta' : 'Sobra'}
              value={formatMoney(Math.abs(remainingPayment))}
              tone={Math.abs(remainingPayment) <= 0.009 ? 'green' : 'red'}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Este ajuste modifica la venta registrada. Si envías métodos de pago, el backend reemplazará los pagos anteriores de esta venta.
        </div>

        {errorMsg && <ErrorBox message={errorMsg} />}

        <button
          disabled={saving}
          className="w-full rounded-2xl bg-amber-400 px-5 py-4 font-black text-neutral-950 transition hover:scale-[1.01] disabled:opacity-60"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </ModalShell>
  );
}


function AppointmentSaleBanner({ appointment, isOpen, onOpenSale, onDismiss }) {
  if (!appointment) return null;

  return (
    <div className="rounded-[32px] border border-amber-200 bg-[linear-gradient(135deg,#FFFBEB_0%,#FFFFFF_75%)] p-5 shadow-[0_16px_42px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-950 text-2xl text-white">
            ✂️
          </div>

          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">
              Cita enviada desde agenda
            </div>
            <h3 className="mt-1 text-2xl font-black text-neutral-950">
              Atendiendo cita #{appointment.appointmentId}
            </h3>
            <div className="mt-2 flex flex-wrap gap-2 text-sm font-bold text-neutral-600">
              <span>Cliente: {appointment.customerName || 'Cliente'}</span>
              <span>•</span>
              <span>Servicio: {appointment.serviceName || 'Servicio'}</span>
              <span>•</span>
              <span>Barbero: {appointment.barberName || 'Barbero'}</span>
              {appointment.hora && (
                <>
                  <span>•</span>
                  <span>{appointment.hora}{appointment.horaFin ? ` - ${appointment.horaFin}` : ''}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onOpenSale}
            disabled={!isOpen}
            className="rounded-2xl bg-neutral-950 px-5 py-4 text-sm font-black text-white transition hover:scale-[1.01] disabled:bg-neutral-200 disabled:text-neutral-500"
          >
            Cobrar cita
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm font-black text-neutral-700 hover:bg-neutral-50"
          >
            Quitar aviso
          </button>
        </div>
      </div>

      {!isOpen && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-bold text-amber-700">
          Para cobrar esta cita primero debes abrir caja en la sede correspondiente.
        </div>
      )}
    </div>
  );
}

function AppointmentSaleModal({ branch, cashRegister, appointment, paymentMethods = DEFAULT_PAYMENT_METHODS, labels = readBusinessLabels(), session = null, onClose, onSaved }) {
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [customerName, setCustomerName] = useState(appointment?.customerName || '');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerResults, setCustomerResults] = useState([]);
  const [customerSearching, setCustomerSearching] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [discount, setDiscount] = useState('0');
  const [tipAmount, setTipAmount] = useState('0');
  const [tipBarberUserId, setTipBarberUserId] = useState('');
  const [cashReceived, setCashReceived] = useState('0');
  const [saleDate, setSaleDate] = useState(toDateInputValue(new Date()));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const paymentOptions = paymentSelectOptions(paymentMethods);

  const subtotal = items.reduce((sum, item) => sum + itemSubtotal(item), 0);
  const discountNumber = Number(String(discount).replace(',', '.')) || 0;

  const appointmentDiscount = appointmentNumber(
    appointment?.discountAmount,
    appointment?.promotionDiscount,
    appointment?.descuento,
    appointment?.descuentoPromocion
  );

  const depositAmount = appointmentNumber(
    appointment?.depositAmount,
    appointment?.montoPagoInicial,
    appointment?.initialPaymentAmount
  );

  const depositStatus = normalizeDepositStatus(
    appointment?.depositStatus ||
      appointment?.estadoPagoInicial ||
      appointment?.depositValidationStatus
  );

  const totalDiscount = roundMoney(discountNumber + appointmentDiscount);
  const totalBeforeDeposit = Math.max(0, roundMoney(subtotal - totalDiscount));
  const depositApplied = isDepositApproved(depositStatus)
    ? Math.min(depositAmount, totalBeforeDeposit)
    : 0;
  const amountToCollectNow = Math.max(0, roundMoney(totalBeforeDeposit - depositApplied));
  const total = totalBeforeDeposit;

  const hasHaircut = items.some((item) => {
    const name = String(item.name || '').toLowerCase();
    return item.type === 'service' && (
      name.includes('corte') ||
      name.includes('fade') ||
      name.includes('taper') ||
      name.includes('degradado') ||
      name.includes('clásico') ||
      name.includes('clasico')
    );
  });

  useEffect(() => {
    async function loadCatalogs() {
      setLoading(true);
      setErrorMsg('');

      try {
        const [serviceData, barberData, productData] = await Promise.all([
          getCashServices(),
          getCashBarbers(branch.id),
          getCashProducts(branch.id).catch(() => []),
        ]);

        const availableBarbers = mergeOwnerIntoBarbers(barberData, session);

        setServices(serviceData);
        setBarbers(availableBarbers);
        setProducts(productData);

        const initialService = serviceData.find(
          (item) => String(item.id) === String(appointment?.serviceId)
        );
        const initialBarber =
          availableBarbers.find((item) => String(item.id) === String(appointment?.barberUserId)) ||
          (String(session?.role || '').trim().toUpperCase() === 'OWNER'
            ? ownerAsBarberOption(session)
            : null);

        if (initialService && initialBarber) {
          setItems([
            {
              key: `appointment-${appointment.appointmentId}`,
              type: 'service',
              serviceId: initialService.id,
              productId: null,
              barberUserId: initialBarber.id,
              barberName: initialBarber.name,
              name: initialService.name,
              quantity: 1,
              unitPrice: servicePriceOf(initialService),
              baseUnitPrice: servicePriceOf(initialService),
              variablePrice: serviceAllowsVariablePrice(initialService),
            },
          ]);
          setSelectedServiceId(String(initialService.id));
          setSelectedBarberId(String(initialBarber.id));
          setCashReceived(String(servicePriceOf(initialService).toFixed(2)));
        }
      } catch (error) {
        setErrorMsg(error.message || 'No se pudieron cargar servicios y barberos.');
      } finally {
        setLoading(false);
      }
    }

    loadCatalogs();
  }, [branch.id, appointment?.appointmentId]);

  useEffect(() => {
    const q = customerName.trim();

    if (selectedCustomer && q === selectedCustomer.nombreCompleto) {
      setCustomerResults([]);
      setCustomerSearching(false);
      return;
    }

    if (q.length < 2) {
      setCustomerResults([]);
      setCustomerSearching(false);
      return;
    }

    let cancelled = false;
    setCustomerSearching(true);

    const timer = window.setTimeout(async () => {
      try {
        const data = await getOwnerCustomers({ query: q, limit: 8 });
        if (cancelled) return;
        setCustomerResults(data);
      } catch {
        if (cancelled) return;
        setCustomerResults([]);
      } finally {
        if (!cancelled) setCustomerSearching(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [customerName, selectedCustomer]);

  function handleCustomerSearchChange(value) {
    setCustomerName(value);

    if (selectedCustomer && value.trim() !== selectedCustomer.nombreCompleto) {
      setSelectedCustomer(null);
    }
  }

  function selectCustomer(customer) {
    setSelectedCustomer(customer);
    setCustomerName(customer.nombreCompleto || customer.nombres || 'Cliente');
    setCustomerResults([]);
    setCustomerSearching(false);
  }

  useEffect(() => {
    if (paymentMethod !== 'CASH') {
      setCashReceived(String(amountToCollectNow.toFixed(2)));
    }
  }, [paymentMethod, amountToCollectNow]);

  function addServiceItem() {
    const service = services.find((item) => String(item.id) === String(selectedServiceId));
    const barber = barbers.find((item) => String(item.id) === String(selectedBarberId));
    const qty = Math.max(1, Number(quantity || 1));

    if (!service) {
      setErrorMsg('Selecciona un servicio.');
      return;
    }

    if (!barber) {
      setErrorMsg('Selecciona el barbero que realizó el servicio.');
      return;
    }

    setErrorMsg('');
    setItems((prev) => [
      ...prev,
      {
        key: `service-${service.id}-${barber.id}-${Date.now()}`,
        type: 'service',
        serviceId: service.id,
        productId: null,
        barberUserId: barber.id,
        barberName: barber.name,
        name: service.name,
        quantity: qty,
        unitPrice: servicePriceOf(service),
        baseUnitPrice: servicePriceOf(service),
        variablePrice: serviceAllowsVariablePrice(service),
      },
    ]);
  }

  function addProductItem() {
    const product = products.find((item) => String(item.id) === String(selectedProductId));
    const qty = Math.max(1, Number(quantity || 1));

    if (!product) {
      setErrorMsg('Selecciona un producto.');
      return;
    }

    setErrorMsg('');
    setItems((prev) => [
      ...prev,
      {
        key: `product-${product.id}-${Date.now()}`,
        type: 'product',
        serviceId: null,
        productId: product.id,
        barberUserId: selectedBarberId ? Number(selectedBarberId) : null,
        barberName: barbers.find((item) => String(item.id) === String(selectedBarberId))?.name || null,
        name: product.name,
        quantity: qty,
        unitPrice: Number(product.price || 0),
      },
    ]);
  }

  function removeItem(key) {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }

  function updateItemUnitPrice(key, value) {
    const nextPrice = Number(String(value).replace(',', '.'));
    setItems((prev) =>
      prev.map((item) =>
        item.key === key
          ? { ...item, unitPrice: Number.isNaN(nextPrice) ? 0 : Math.max(0, nextPrice) }
          : item
      )
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    if (!cashRegister?.id) {
      setErrorMsg('No hay caja abierta para cobrar esta cita.');
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Agrega al menos un servicio o producto.');
      return;
    }

    const received = Number(String(cashReceived).replace(',', '.')) || 0;
    if (paymentMethod === 'CASH' && received + 0.009 < amountToCollectNow) {
      setErrorMsg('El efectivo recibido no puede ser menor al saldo pendiente.');
      return;
    }

    setSaving(true);

    try {
      const createdSale = await createCashSale({
        branchId: branch.id,
        customerId: appointment.customerId || null,
        appointmentId: appointment.appointmentId || null,
        saleDate: buildLocalSaleDateForBackend(saleDate),
        metodoPago: amountToCollectNow <= 0 ? 'FREE' : paymentMethod,
        discount: discountNumber,
        cashReceived: paymentMethod === 'CASH' ? received : amountToCollectNow,
        payments:
          amountToCollectNow <= 0
            ? []
            : [{ method: paymentMethod, amount: amountToCollectNow }],
        cutType: hasHaircut ? 'Corte registrado en agenda web' : null,
        cutDetail: hasHaircut
          ? `${appointment.serviceName || items.find((item) => item.type === 'service')?.name || 'Servicio de corte'} · ${appointment.barberName || items.find((item) => item.type === 'service')?.barberName || 'Barbero'}`
          : null,
        cutObservations: hasHaircut
          ? `Atención finalizada desde agenda web${appointment.appointmentId ? ` · Cita #${appointment.appointmentId}` : ''}`
          : null,
        items: items.map((item) => ({
          serviceId: item.serviceId,
          productId: item.productId,
          barberUserId: item.barberUserId,
          cantidad: item.quantity,
          precioUnitario: item.unitPrice,
        })),
      });

      clearAttendAppointmentFromStorage();
      offerCustomerWhatsappFollowUp(createdSale);
      onSaved();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo registrar la venta.');
    } finally {
      setSaving(false);
    }
  }

  const change = paymentMethod === 'CASH'
    ? Math.max(0, (Number(String(cashReceived).replace(',', '.')) || 0) - amountToCollectNow)
    : 0;

  return (
    <ModalShell title="Cobrar cita" subtitle={branch?.name || 'Sede'} onClose={onClose}>
      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-black text-neutral-500">
          Cargando servicios y barberos...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-[26px] border border-amber-200 bg-amber-50 p-5">
            <div className="text-xs font-black uppercase tracking-[0.20em] text-amber-700">
              Cita seleccionada
            </div>
            <div className="mt-2 text-xl font-black text-neutral-950">
              {appointment.customerName || 'Cliente'} · #{appointment.appointmentId}
            </div>
            <div className="mt-2 text-sm font-bold text-neutral-600">
              Servicio inicial: {appointment.serviceName || 'Servicio'} · Barbero: {appointment.barberName || 'Barbero'}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[26px] border border-neutral-200 bg-white p-5">
              <div className="text-xs font-black uppercase tracking-[0.20em] text-amber-600">
                Servicios adicionales
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <SelectField
                  label="Servicio"
                  value={selectedServiceId}
                  onChange={setSelectedServiceId}
                  options={[
                    { value: '', label: 'Selecciona servicio' },
                    ...services.map((service) => ({
                      value: String(service.id),
                      label: `${service.name} · ${servicePriceLabel(service)}`,
                    })),
                  ]}
                />

                <SelectField
                  label={labels.professionalSingular[0].toUpperCase() + labels.professionalSingular.slice(1)}
                  value={selectedBarberId}
                  onChange={setSelectedBarberId}
                  options={[
                    { value: '', label: `Selecciona ${labels.professionalSingular}` },
                    ...barbers.map((barber) => ({
                      value: String(barber.id),
                      label: barber.name,
                    })),
                  ]}
                />
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_160px]">
                <InputField label="Cantidad" value={quantity} onChange={setQuantity} type="number" />
                <button
                  type="button"
                  onClick={addServiceItem}
                  className="self-end rounded-2xl bg-neutral-950 px-5 py-4 text-sm font-black text-white transition hover:scale-[1.01]"
                >
                  Agregar servicio
                </button>
              </div>

              {products.length > 0 && (
                <div className="mt-5 border-t border-neutral-200 pt-5">
                  <div className="text-xs font-black uppercase tracking-[0.20em] text-amber-600">
                    Productos opcionales
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-[1fr_160px]">
                    <SelectField
                      label="Producto"
                      value={selectedProductId}
                      onChange={setSelectedProductId}
                      options={[
                        { value: '', label: 'Selecciona producto' },
                        ...products.map((product) => ({
                          value: String(product.id),
                          label: `${product.name} · ${formatMoney(product.price)} · Stock ${product.stock}`,
                        })),
                      ]}
                    />
                    <button
                      type="button"
                      onClick={addProductItem}
                      className="self-end rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm font-black text-neutral-800 transition hover:bg-amber-50"
                    >
                      Agregar producto
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-[26px] border border-neutral-200 bg-white p-5">
              <div className="text-xs font-black uppercase tracking-[0.20em] text-amber-600">
                Pago
              </div>

              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="text-sm font-black text-neutral-700">Fecha de venta</span>
                  <input
                    type="date"
                    value={saleDate}
                    min={saleDateInputMinValue()}
                    max={toDateInputValue(new Date())}
                    onChange={(event) => setSaleDate(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-bold text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-amber-400"
                  />
                  {saleDate !== toDateInputValue(new Date()) && (
                    <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
                      Esta cita se cobrará con fecha anterior para regularizar caja.
                    </div>
                  )}
                </label>

                <SelectField
                  label="Método de pago"
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  options={paymentOptions}
                />
                <InputField label="Descuento" value={discount} onChange={setDiscount} type="number" step="0.01" prefix={getTenantCurrencySymbol()} />
                <InputField label="Recibido" value={cashReceived} onChange={setCashReceived} type="number" step="0.01" prefix={getTenantCurrencySymbol()} />
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-neutral-200 bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.20em] text-amber-600">
                  Items de venta
                </div>
                <div className="mt-1 text-sm font-bold text-neutral-500">
                  Puedes agregar más servicios o productos antes de cobrar.
                </div>
              </div>
              <div className="rounded-2xl bg-neutral-950 px-4 py-3 text-xl font-black text-white">
                {formatMoney(total)}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {items.length === 0 ? (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-black text-neutral-500">
                  Aún no hay items en la venta.
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.key} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-black text-neutral-950">{item.name}</div>
                        <div className="mt-1 text-xs font-bold text-neutral-500">
                          {item.type === 'service' ? `Servicio · Barbero: ${item.barberName || '-'}` : `Producto${item.barberName ? ` · Barbero: ${item.barberName}` : ''}`}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-3">
                        {item.type === 'service' && item.variablePrice ? (
                          <label className="min-w-[220px] rounded-2xl border border-amber-200 bg-amber-50 p-3 text-left">
                            <span className="inline-flex rounded-full bg-neutral-950 px-2.5 py-1 text-[10px] font-black uppercase text-white">
                              Variable
                            </span>
                            <span className="ml-2 text-[11px] font-black text-amber-700">
                              Desde {formatMoney(item.baseUnitPrice)}
                            </span>
                            <span className="mt-2 block text-[11px] font-black uppercase tracking-[0.12em] text-neutral-500">
                              Precio final a cobrar
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(event) => updateItemUnitPrice(item.key, event.target.value)}
                              className="mt-1 h-12 w-full rounded-xl border border-amber-200 bg-white px-3 text-lg font-black text-neutral-950 outline-none focus:border-violet-500"
                            />
                            <span className="mt-1 block text-xs font-bold text-neutral-500">
                              Escribe el monto real del servicio.
                            </span>
                          </label>
                        ) : null}
                        <div className="text-right">
                          <div className="font-black text-neutral-950">{formatMoney(itemSubtotal(item))}</div>
                          <div className="text-xs font-bold text-neutral-500">
                            {item.variablePrice && item.baseUnitPrice !== item.unitPrice
                              ? `${item.quantity} x ${formatMoney(item.unitPrice)} · desde ${formatMoney(item.baseUnitPrice)}`
                              : `${item.quantity} x ${formatMoney(item.unitPrice)}`}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-100"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            <StatCard title="Subtotal" value={formatMoney(subtotal)} />
            <StatCard title="Descuento" value={formatMoney(totalDiscount)} helper={appointmentDiscount > 0 ? `Incluye promo/cita ${formatMoney(appointmentDiscount)}` : null} />
            <StatCard title="Total venta" value={formatMoney(total)} tone="gold" />
            <StatCard title="Inicial aplicado" value={formatMoney(depositApplied)} tone={depositApplied > 0 ? 'green' : 'default'} />
            <StatCard title="Saldo a cobrar" value={formatMoney(amountToCollectNow)} tone="dark" />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <StatCard title="Vuelto" value={formatMoney(change)} tone={change > 0 ? 'green' : 'default'} />
            <StatCard title="Pago final" value={amountToCollectNow <= 0 ? 'Cubierto con inicial' : paymentLabelFromOptions(paymentMethods, paymentMethod)} helper="El backend completará la venta con DEPOSIT_APPLIED si corresponde." />
          </div>

          {errorMsg && <ErrorBox message={errorMsg} />}

          <button
            disabled={saving}
            className="w-full rounded-2xl bg-amber-400 px-5 py-4 font-black text-neutral-950 transition hover:scale-[1.01] disabled:opacity-60"
          >
            {saving ? 'Guardando venta...' : 'Cobrar y finalizar atención'}
          </button>
        </form>
      )}
    </ModalShell>
  );
}


function SaleModal({ branch, cashRegister, paymentMethods = DEFAULT_PAYMENT_METHODS, labels = readBusinessLabels(), session = null, onClose, onSaved }) {
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);

  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [quantity, setQuantity] = useState('1');

  const [customerName, setCustomerName] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerResults, setCustomerResults] = useState([]);
  const [customerSearching, setCustomerSearching] = useState(false);
  const [quickCustomerPhone, setQuickCustomerPhone] = useState('');
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [isCourtesy, setIsCourtesy] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [discount, setDiscount] = useState('0');
  const [tipAmount, setTipAmount] = useState('0');
  const [tipBarberUserId, setTipBarberUserId] = useState('');
  const [cashReceived, setCashReceived] = useState('0');
  const [saleDate, setSaleDate] = useState(toDateInputValue(new Date()));
  const [payments, setPayments] = useState([createPaymentDraft('CASH', 0)]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const paymentOptions = paymentSelectOptions(paymentMethods);

  const subtotal = items.reduce((sum, item) => sum + itemSubtotal(item), 0);
  const discountNumber = Number(String(discount).replace(',', '.')) || 0;
  const tipNumber = Math.max(0, parseMoneyInput(tipAmount));
  const grossTotal = roundMoney(subtotal + tipNumber);
  const effectiveDiscount = isCourtesy ? grossTotal : discountNumber;
  const firstServiceBarberId = items.find((item) => item.type === 'service' && item.barberUserId)?.barberUserId || selectedBarberId || '';
  const effectiveTipBarberUserId = tipNumber > 0
    ? (Number(tipBarberUserId || firstServiceBarberId || 0) || null)
    : null;
  const total = Math.max(0, roundMoney(grossTotal - effectiveDiscount));
  const paymentPayloads = payments
    .map((payment) => ({
      method: normalizeMethod(payment.method),
      amount: roundMoney(parseMoneyInput(payment.amount)),
    }))
    .filter((payment) => payment.method && payment.amount > 0);
  const paymentsTotal = roundMoney(paymentPayloads.reduce((sum, payment) => sum + payment.amount, 0));
  const remainingPayment = roundMoney(total - paymentsTotal);
  const hasMixedPayment = paymentPayloads.length > 1;
  const primaryPaymentMethod = total === 0
    ? 'FREE'
    : hasMixedPayment
      ? 'MIXED'
      : paymentPayloads[0]?.method || paymentMethod || 'CASH';
  const cashPaymentTotal = roundMoney(paymentPayloads
    .filter((payment) => normalizeMethod(payment.method) === 'CASH')
    .reduce((sum, payment) => sum + payment.amount, 0));
  const received = parseMoneyInput(cashReceived);
  const change = cashPaymentTotal > 0 ? Math.max(0, roundMoney(received - cashPaymentTotal)) : 0;

  useEffect(() => {
    async function loadCatalogs() {
      setLoading(true);
      setErrorMsg('');

      try {
        const [serviceData, barberData, productData] = await Promise.all([
          getCashServices(),
          getCashBarbers(branch.id),
          getCashProducts(branch.id).catch(() => []),
        ]);

        setServices(serviceData);
        setBarbers(mergeOwnerIntoBarbers(barberData, session));
        setProducts(productData);
      } catch (error) {
        setErrorMsg(error.message || `No se pudieron cargar servicios, productos y ${labels.professionalsPlural}.`);
      } finally {
        setLoading(false);
      }
    }

    loadCatalogs();
  }, [branch.id, session]);

  useEffect(() => {
    const q = customerName.trim();

    if (selectedCustomer && q === (selectedCustomer.nombreCompleto || selectedCustomer.nombres || 'Cliente')) {
      setCustomerResults([]);
      setCustomerSearching(false);
      return;
    }

    if (q.length < 2) {
      setCustomerResults([]);
      setCustomerSearching(false);
      return;
    }

    let cancelled = false;
    setCustomerSearching(true);

    const timer = window.setTimeout(async () => {
      try {
        const data = await getOwnerCustomers({ query: q, limit: 8 });
        if (cancelled) return;
        setCustomerResults(Array.isArray(data) ? data : []);
      } catch {
        if (cancelled) return;
        setCustomerResults([]);
      } finally {
        if (!cancelled) setCustomerSearching(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [customerName, selectedCustomer]);

  function handleCustomerSearchChange(value) {
    setCustomerName(value);

    if (selectedCustomer) {
      const selectedName = selectedCustomer.nombreCompleto || selectedCustomer.nombres || 'Cliente';
      if (value.trim() !== selectedName) {
        setSelectedCustomer(null);
      }
    }

    const onlyNumbers = String(value || '').replace(/[^0-9]/g, '');
    if (onlyNumbers.length >= 6 && quickCustomerPhone.trim().length === 0) {
      setQuickCustomerPhone(onlyNumbers);
    }
  }

  function selectCustomer(customer) {
    setSelectedCustomer(customer);
    setCustomerName(customer.nombreCompleto || customer.nombres || 'Cliente');
    setQuickCustomerPhone(customer.telefono || '');
    setCustomerResults([]);
    setCustomerSearching(false);
  }

  async function createQuickCustomerFromSale() {
    setErrorMsg('');

    const name = customerName.trim();
    const phone = String(quickCustomerPhone || '').replace(/[^0-9]/g, '');

    if (!name) {
      setErrorMsg('Escribe el nombre del cliente para crearlo.');
      return;
    }

    if (phone.length < 6) {
      setErrorMsg('Ingresa un teléfono válido para crear el cliente.');
      return;
    }

    setCreatingCustomer(true);

    try {
      const created = await createOwnerCustomer({
        nombres: name,
        telefono: phone,
      });
      selectCustomer(created);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo crear el cliente.');
    } finally {
      setCreatingCustomer(false);
    }
  }

  useEffect(() => {
    setPayments((prev) => {
      if (prev.length !== 1) return prev;
      return [{ ...prev[0], amount: total.toFixed(2) }];
    });
  }, [total]);

  useEffect(() => {
    if (cashPaymentTotal > 0 && received + 0.009 < cashPaymentTotal) {
      setCashReceived(cashPaymentTotal.toFixed(2));
    }
  }, [cashPaymentTotal]);

  function updatePayment(index, field, value) {
    setPayments((prev) => prev.map((payment, i) => (
      i === index ? { ...payment, [field]: value } : payment
    )));

    if (field === 'method' && index === 0) {
      setPaymentMethod(value);
    }
  }

  function addPaymentMethod() {
    const nextAmount = remainingPayment > 0 ? remainingPayment : 0;
    setPayments((prev) => [...prev, createPaymentDraft(defaultExtraPaymentMethod(paymentMethods), nextAmount)]);
  }

  function removePaymentMethod(index) {
    setPayments((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }

  function currentBarber() {
    return barbers.find((item) => String(item.id) === String(selectedBarberId));
  }

  function addServiceItem() {
    const service = services.find((item) => String(item.id) === String(selectedServiceId));
    const barber = currentBarber();
    const qty = Math.max(1, Number(quantity || 1));

    if (!service) {
      setErrorMsg('Selecciona un servicio.');
      return;
    }

    if (!barber) {
      setErrorMsg(`Selecciona el ${labels.professionalSingular} que realizo el servicio.`);
      return;
    }

    setErrorMsg('');
    setItems((prev) => [
      ...prev,
      {
        key: `service-${service.id}-${barber.id}-${Date.now()}`,
        type: 'service',
        serviceId: service.id,
        productId: null,
        barberUserId: barber.id,
        barberName: barber.name,
        name: service.name,
        quantity: qty,
        unitPrice: servicePriceOf(service),
        baseUnitPrice: servicePriceOf(service),
        variablePrice: serviceAllowsVariablePrice(service),
      },
    ]);

    setSelectedServiceId('');
    setQuantity('1');
  }

  function addProductItem() {
    const product = products.find((item) => String(item.id) === String(selectedProductId));
    const barber = currentBarber();
    const qty = Math.max(1, Number(quantity || 1));

    if (!product) {
      setErrorMsg('Selecciona un producto.');
      return;
    }

    const stock = Number(product.stock ?? product.stockActual ?? 0);
    const allowsWithoutStock = product.permiteVentaSinStock === true || product.allowSaleWithoutStock === true;

    if (!allowsWithoutStock && stock < qty) {
      setErrorMsg(`Stock insuficiente. Disponible: ${stock}.`);
      return;
    }

    const commission = Number(product.barberCommissionAmount ?? product.productCommissionAmount ?? 0);
    if (commission > 0 && !barber) {
      setErrorMsg(`Este producto tiene comision. Selecciona el ${labels.professionalSingular} que hizo la venta.`);
      return;
    }

    setErrorMsg('');
    setItems((prev) => [
      ...prev,
      {
        key: `product-${product.id}-${Date.now()}`,
        type: 'product',
        serviceId: null,
        productId: product.id,
        barberUserId: barber?.id || null,
        barberName: barber?.name || null,
        name: product.name,
        quantity: qty,
        unitPrice: Number(product.price ?? product.precioVenta ?? 0),
      },
    ]);

    setSelectedProductId('');
    setQuantity('1');
  }

  function removeItem(key) {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }

  function updateItemUnitPrice(key, value) {
    const nextPrice = Number(String(value).replace(',', '.'));
    setItems((prev) =>
      prev.map((item) =>
        item.key === key
          ? { ...item, unitPrice: Number.isNaN(nextPrice) ? 0 : Math.max(0, nextPrice) }
          : item
      )
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    if (!cashRegister?.id) {
      setErrorMsg('No hay caja abierta para registrar la venta.');
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Agrega al menos un servicio o producto.');
      return;
    }

    if (tipNumber > 0 && !effectiveTipBarberUserId) {
      setErrorMsg(`Para registrar propina, selecciona el ${labels.professionalSingular} que la recibira o agrega un servicio con ${labels.professionalSingular}.`);
      return;
    }

    if (!isCourtesy && total > 0 && paymentPayloads.length === 0) {
      setErrorMsg('Agrega al menos un método de pago.');
      return;
    }

    if (!isCourtesy && Math.abs(remainingPayment) > 0.009) {
      const label = remainingPayment > 0 ? 'Falta' : 'Sobra';
      setErrorMsg(`${label} ${formatMoney(Math.abs(remainingPayment))} para completar el total.`);
      return;
    }

    if (!isCourtesy && cashPaymentTotal > 0 && received + 0.009 < cashPaymentTotal) {
      setErrorMsg('El efectivo recibido no puede ser menor al monto pagado en efectivo.');
      return;
    }

    const hasHaircut = items.some((item) => {
      const name = String(item.name || '').toLowerCase();
      return item.type === 'service' && (
        name.includes('corte') ||
        name.includes('fade') ||
        name.includes('taper') ||
        name.includes('degradado') ||
        name.includes('clásico') ||
        name.includes('clasico')
      );
    });

    setSaving(true);

    try {
      const createdSale = await createCashSale({
        branchId: branch.id,
        customerId: selectedCustomer?.id || null,
        appointmentId: null,
        saleDate: buildLocalSaleDateForBackend(saleDate),
        metodoPago: primaryPaymentMethod,
        discount: effectiveDiscount,
        cashReceived: isCourtesy ? 0 : cashPaymentTotal > 0 ? received : total,
        tipAmount: tipNumber,
        tipBarberUserId: effectiveTipBarberUserId,
        payments: isCourtesy || total === 0 ? [] : paymentPayloads,
        cutType: hasHaircut ? 'Corte registrado en caja web' : null,
        cutDetail: hasHaircut ? 'Venta registrada desde panel web' : null,
        cutObservations: selectedCustomer ? null : (customerName.trim() ? `Referencia: ${customerName.trim()}` : null),
        items: items.map((item) => ({
          serviceId: item.serviceId,
          productId: item.productId,
          barberUserId: item.barberUserId,
          cantidad: item.quantity,
          precioUnitario: item.unitPrice,
        })),
      });

      offerCustomerWhatsappFollowUp(createdSale);
      onSaved();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo registrar la venta.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Nueva venta" subtitle={branch?.name || 'Sede'} onClose={onClose}>
      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-black text-neutral-500">
          Cargando servicios, productos y barberos...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[26px] border border-neutral-200 bg-white p-5">
              <div className="text-xs font-black uppercase tracking-[0.20em] text-amber-600">
                Venta rápida
              </div>
              <h3 className="mt-2 text-2xl font-black text-neutral-950">
                Servicios y productos
              </h3>
              <p className="mt-1 text-sm font-semibold text-neutral-500">
                Agrega servicios o productos. El stock se descontará de la sede activa.
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="relative">
                  <label className="block">
                    <span className="text-sm font-black text-neutral-700">Cliente</span>
                    <input
                      value={customerName}
                      onChange={(event) => handleCustomerSearchChange(event.target.value)}
                      placeholder="Buscar por nombre o teléfono"
                      className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-bold text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-amber-400"
                    />
                  </label>

                  {customerSearching && (
                    <div className="mt-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-black text-neutral-500">
                      Buscando clientes...
                    </div>
                  )}

                  {selectedCustomer && (
                    <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <div>
                        <div className="text-sm font-black text-emerald-800">
                          {selectedCustomer.nombreCompleto}
                        </div>
                        <div className="mt-1 text-xs font-bold text-emerald-700/75">
                          {selectedCustomer.telefono || 'Sin teléfono'} · {selectedCustomer.puntosDisponibles || 0} pts
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(null);
                          setCustomerName('');
                          setCustomerResults([]);
                        }}
                        className="rounded-xl bg-white px-3 py-2 text-xs font-black text-emerald-700"
                      >
                        Cambiar
                      </button>
                    </div>
                  )}

                  {!selectedCustomer && customerResults.length > 0 && (
                    <div className="absolute left-0 right-0 z-20 mt-2 max-h-72 overflow-auto rounded-2xl border border-neutral-200 bg-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
                      {customerResults.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => selectCustomer(customer)}
                          className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-amber-50"
                        >
                          <div>
                            <div className="font-black text-neutral-950">
                              {customer.nombreCompleto}
                            </div>
                            <div className="mt-1 text-xs font-bold text-neutral-500">
                              {customer.telefono || 'Sin teléfono'} · {customer.puntosDisponibles || 0} pts
                            </div>
                          </div>
                          <span className="rounded-full bg-neutral-950 px-3 py-1 text-xs font-black text-white">
                            Elegir
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {!selectedCustomer && !customerSearching && customerName.trim().length >= 2 && customerResults.length === 0 && (
                    <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                        Cliente no encontrado
                      </div>
                      <p className="mt-2 text-xs font-bold leading-5 text-amber-800">
                        Puedes guardar la venta como cliente ocasional o crear el cliente ahora agregando su teléfono.
                      </p>

                      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                        <input
                          type="tel"
                          value={quickCustomerPhone}
                          onChange={(event) => setQuickCustomerPhone(event.target.value)}
                          placeholder="Número de teléfono"
                          className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-black text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-amber-500"
                        />

                        <button
                          type="button"
                          onClick={createQuickCustomerFromSale}
                          disabled={creatingCustomer}
                          className="rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white transition hover:scale-[1.01] disabled:opacity-60"
                        >
                          {creatingCustomer ? 'Creando...' : 'Crear cliente'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <SelectField
                  label="Barbero"
                  value={selectedBarberId}
                  onChange={setSelectedBarberId}
                  options={[
                    { value: '', label: 'Selecciona barbero' },
                    ...barbers.map((barber) => ({
                      value: String(barber.id),
                      label: barber.name,
                    })),
                  ]}
                />
              </div>

              <div className="mt-5 rounded-[24px] border border-neutral-200 bg-neutral-50 p-4">
                <div className="text-sm font-black text-neutral-950">Agregar servicio</div>
                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_120px_170px]">
                  <SelectField
                    label="Servicio"
                    value={selectedServiceId}
                    onChange={setSelectedServiceId}
                    options={[
                      { value: '', label: 'Selecciona servicio' },
                      ...services.map((service) => ({
                        value: String(service.id),
                        label: `${service.name} · ${servicePriceLabel(service)}`,
                      })),
                    ]}
                  />

                  <InputField label="Cantidad" value={quantity} onChange={setQuantity} type="number" />

                  <button
                    type="button"
                    onClick={addServiceItem}
                    className="self-end rounded-2xl bg-neutral-950 px-5 py-4 text-sm font-black text-white transition hover:scale-[1.01]"
                  >
                    Agregar servicio
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-[24px] border border-emerald-200 bg-emerald-50 p-4">
                <div className="text-sm font-black text-neutral-950">Agregar producto</div>
                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_120px_170px]">
                  <SelectField
                    label="Producto"
                    value={selectedProductId}
                    onChange={setSelectedProductId}
                    options={[
                      { value: '', label: 'Selecciona producto' },
                      ...products.map((product) => ({
                        value: String(product.id),
                        label: `${product.name} · ${formatMoney(product.price)} · Stock ${product.stock}`,
                      })),
                    ]}
                  />

                  <InputField label="Cantidad" value={quantity} onChange={setQuantity} type="number" />

                  <button
                    type="button"
                    onClick={addProductItem}
                    className="self-end rounded-2xl border border-emerald-200 bg-white px-5 py-4 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
                  >
                    Agregar producto
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-[26px] border border-neutral-200 bg-white p-5">
              <div className="text-xs font-black uppercase tracking-[0.20em] text-amber-600">
                Cobro
              </div>
              <h3 className="mt-2 text-2xl font-black text-neutral-950">
                {formatMoney(total)}
              </h3>
              <p className="mt-1 text-sm font-semibold text-neutral-500">
                Total a cobrar
              </p>

              <button
                type="button"
                onClick={() => setIsCourtesy((value) => !value)}
                className={`mt-4 flex w-full items-center justify-between gap-4 rounded-[22px] border px-4 py-4 text-left transition ${
                  isCourtesy
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-neutral-200 bg-neutral-50 hover:border-amber-200 hover:bg-amber-50/50'
                }`}
              >
                <span>
                  <span className="block text-sm font-black text-neutral-950">
                    Registrar como cortesia gratis
                  </span>
                  <span className="mt-1 block text-xs font-bold leading-5 text-neutral-500">
                    Guarda la venta en 0 y conserva el subtotal como referencia para reportes.
                  </span>
                </span>
                <span className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${
                  isCourtesy ? 'bg-amber-400' : 'bg-neutral-300'
                }`}>
                  <span className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${
                    isCourtesy ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </span>
              </button>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-sm font-black text-neutral-700">Fecha de venta</span>
                  <input
                    type="date"
                    value={saleDate}
                    min={saleDateInputMinValue()}
                    max={toDateInputValue(new Date())}
                    onChange={(event) => setSaleDate(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-bold text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-amber-400"
                  />
                  {saleDate !== toDateInputValue(new Date()) && (
                    <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
                      Esta venta se guardará con fecha anterior. Úsalo para regularizar ventas olvidadas.
                    </div>
                  )}
                </label>

                <InputField
                  label={isCourtesy ? 'Descuento aplicado por cortesia' : 'Descuento'}
                  value={isCourtesy ? effectiveDiscount.toFixed(2) : discount}
                  onChange={setDiscount}
                  type="number"
                  step="0.01"
                  prefix={getTenantCurrencySymbol()}
                  disabled={isCourtesy}
                />

                <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    Propina para {labels.professionalSingular}
                  </div>
                  <p className="mt-2 text-xs font-bold leading-5 text-emerald-800">
                    La propina se suma al total cobrado y aparecera en el calculo de pago al {labels.professionalSingular}.
                  </p>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <InputField
                      label="Monto de propina"
                      value={tipAmount}
                      onChange={setTipAmount}
                      type="number"
                      step="0.01"
                      prefix={getTenantCurrencySymbol()}
                    />

                    <SelectField
                      label={`${labels.professionalSingular[0].toUpperCase()}${labels.professionalSingular.slice(1)} que recibe la propina`}
                      value={tipBarberUserId || String(firstServiceBarberId || '')}
                      onChange={setTipBarberUserId}
                      options={[
                        { value: '', label: `Selecciona ${labels.professionalSingular}` },
                        ...barbers.map((barber) => ({
                          value: String(barber.id),
                          label: barber.name,
                        })),
                      ]}
                    />
                  </div>
                </div>

                {isCourtesy ? (
                  <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                      Venta gratis
                    </div>
                    <p className="mt-2 text-sm font-bold leading-6 text-amber-800">
                      No se registrara ningun cobro. La venta saldra como Gratis / Cortesia y aparecera en el resumen de {labels.courtesyPlural} por {labels.professionalSingular}.
                    </p>
                  </div>
                ) : (
                <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
                        Métodos de pago
                      </div>
                      <div className="mt-2 text-sm font-bold leading-5 text-neutral-500">
                        Divide el cobro entre los métodos configurados para este negocio.
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={addPaymentMethod}
                      className="rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-black text-white transition hover:scale-[1.01] sm:shrink-0"
                    >
                      + Agregar método
                    </button>
                  </div>

                  <div className="mt-5 space-y-3">
                    {payments.map((payment, index) => (
                      <div
                        key={payment.key}
                        className="rounded-[22px] border border-neutral-200 bg-neutral-50 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="text-xs font-black uppercase tracking-[0.16em] text-neutral-500">
                            {index === 0 ? 'Método principal' : `Método ${index + 1}`}
                          </div>

                          <button
                            type="button"
                            onClick={() => removePaymentMethod(index)}
                            disabled={payments.length <= 1}
                            className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Quitar
                          </button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
                          <SelectField
                            label="Método"
                            value={payment.method}
                            onChange={(value) => updatePayment(index, 'method', value)}
                            options={paymentOptions}
                          />

                          <InputField
                            label="Monto"
                            value={payment.amount}
                            onChange={(value) => updatePayment(index, 'amount', value)}
                            type="number"
                            step="0.01"
                            prefix={getTenantCurrencySymbol()}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={`mt-5 rounded-[22px] border px-4 py-4 text-sm font-black ${
                    Math.abs(remainingPayment) <= 0.009
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : remainingPayment > 0
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : 'border-red-200 bg-red-50 text-red-700'
                  }`}>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <span>Pagado: {formatMoney(paymentsTotal)}</span>
                      <span>{Math.abs(remainingPayment) <= 0.009 ? 'Pago completo' : remainingPayment > 0 ? `Falta ${formatMoney(remainingPayment)}` : `Sobra ${formatMoney(Math.abs(remainingPayment))}`}</span>
                    </div>
                  </div>
                </div>
                )}

                {!isCourtesy && cashPaymentTotal > 0 && (
                  <InputField
                    label={`Efectivo recibido para ${formatMoney(cashPaymentTotal)}`}
                    value={cashReceived}
                    onChange={setCashReceived}
                    type="number"
                    step="0.01"
                    prefix={getTenantCurrencySymbol()}
                  />
                )}
              </div>

              <div className="mt-5 grid gap-3">
                <StatCard title="Subtotal" value={formatMoney(subtotal)} />
                <StatCard title="Descuento" value={formatMoney(effectiveDiscount)} tone={isCourtesy ? 'gold' : 'default'} />
                <StatCard title="Propina" value={formatMoney(tipNumber)} tone={tipNumber > 0 ? 'green' : 'default'} />
                <StatCard title="Pagado" value={formatMoney(isCourtesy ? 0 : paymentsTotal)} tone={isCourtesy || Math.abs(remainingPayment) <= 0.009 ? 'green' : 'gold'} />
                <StatCard title="Vuelto" value={formatMoney(change)} tone={change > 0 ? 'green' : 'default'} />
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-neutral-200 bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.20em] text-amber-600">
                  Items de venta
                </div>
                <div className="mt-1 text-sm font-bold text-neutral-500">
                  {items.length} item(s) agregado(s)
                </div>
              </div>
              <div className="rounded-2xl bg-neutral-950 px-4 py-3 text-xl font-black text-white">
                {formatMoney(total)}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {items.length === 0 ? (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-black text-neutral-500">
                  Aún no hay items en la venta.
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.key} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-black text-neutral-950">{item.name}</div>
                        <div className="mt-1 text-xs font-bold text-neutral-500">
                          {item.type === 'service'
                            ? `Servicio · Barbero: ${item.barberName || '-'}`
                            : `Producto${item.barberName ? ` · Barbero: ${item.barberName}` : ''}`}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-3">
                        {item.type === 'service' && item.variablePrice ? (
                          <label className="min-w-[220px] rounded-2xl border border-amber-200 bg-amber-50 p-3 text-left">
                            <span className="inline-flex rounded-full bg-neutral-950 px-2.5 py-1 text-[10px] font-black uppercase text-white">
                              Variable
                            </span>
                            <span className="ml-2 text-[11px] font-black text-amber-700">
                              Desde {formatMoney(item.baseUnitPrice)}
                            </span>
                            <span className="mt-2 block text-[11px] font-black uppercase tracking-[0.12em] text-neutral-500">
                              Precio final a cobrar
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(event) => updateItemUnitPrice(item.key, event.target.value)}
                              className="mt-1 h-12 w-full rounded-xl border border-amber-200 bg-white px-3 text-lg font-black text-neutral-950 outline-none focus:border-violet-500"
                            />
                            <span className="mt-1 block text-xs font-bold text-neutral-500">
                              Escribe el monto real del servicio.
                            </span>
                          </label>
                        ) : null}
                        <div className="text-right">
                          <div className="font-black text-neutral-950">{formatMoney(itemSubtotal(item))}</div>
                          <div className="text-xs font-bold text-neutral-500">
                            {item.variablePrice && item.baseUnitPrice !== item.unitPrice
                              ? `${item.quantity} x ${formatMoney(item.unitPrice)} · desde ${formatMoney(item.baseUnitPrice)}`
                              : `${item.quantity} x ${formatMoney(item.unitPrice)}`}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-100"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {errorMsg && <ErrorBox message={errorMsg} />}

          <button
            disabled={saving}
            className="w-full rounded-2xl bg-amber-400 px-5 py-4 font-black text-neutral-950 transition hover:scale-[1.01] disabled:opacity-60"
          >
            {saving ? 'Guardando venta...' : isCourtesy ? 'Guardar cortesia gratis' : 'Guardar nueva venta'}
          </button>
        </form>
      )}
    </ModalShell>
  );
}

function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 px-4 py-8 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-auto rounded-[34px] border border-white/10 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.35)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">{subtitle}</div>
            <h2 className="mt-1 text-2xl font-black text-neutral-950">{title}</h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-black text-neutral-700 hover:bg-neutral-100"
          >
            Cerrar
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text', step, prefix, disabled = false }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-neutral-700">{label}</span>

      <div className="mt-2 flex rounded-2xl border border-neutral-200 bg-neutral-50 focus-within:border-amber-400">
        {prefix && (
          <div className="flex items-center px-4 font-black text-neutral-500">{prefix}</div>
        )}

        <input
          type={type}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-2xl bg-transparent px-4 py-4 font-bold text-neutral-950 outline-none disabled:cursor-not-allowed disabled:text-neutral-400"
        />
      </div>
    </label>
  );
}

function TextAreaField({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-neutral-700">{label}</span>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-bold text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-amber-400"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-neutral-700">{label}</span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-bold text-neutral-950 outline-none transition focus:border-amber-400"
      >
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ErrorBox({ message }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
      {message}
    </div>
  );
}


function cashStatusLabel(status) {
  const code = String(status || '').toUpperCase();

  if (code === 'OPEN') return 'Abierta';
  if (code === 'CLOSED') return 'Cerrada';
  if (code === 'AUTO_CLOSED') return 'Cierre automático';

  return status || 'Sin estado';
}

function cashStatusClass(status) {
  const code = String(status || '').toUpperCase();

  if (code === 'OPEN') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (code === 'CLOSED') return 'border-blue-200 bg-blue-50 text-blue-700';
  if (code === 'AUTO_CLOSED') return 'border-orange-200 bg-orange-50 text-orange-700';

  return 'border-neutral-200 bg-neutral-50 text-neutral-700';
}

function paymentTotalFrom(cash, key) {
  const source =
    Array.isArray(cash?.paymentMethodBalances) && cash.paymentMethodBalances.length > 0
      ? cash.paymentMethodBalances
      : cash?.paymentMethodsSummary || [];

  const normalizedKey = normalizeMethod(key);

  return source.reduce((sum, item) => {
    const code = normalizeMethod(item?.paymentMethod);
    return code === normalizedKey ? sum + Number(item?.totalAmount || 0) : sum;
  }, 0);
}

function HistorySummaryCard({ items, paymentMethods = DEFAULT_PAYMENT_METHODS }) {
  const totals = items.reduce(
    (acc, cash) => {
      acc.sales += Number(cash.salesTotal || 0);
      acc.income += Number(cash.movementsIncome || 0);
      acc.expense += Number(cash.movementsExpense || 0);
      acc.expected += Number(cash.closingAmountExpected || 0);

      const source = Array.isArray(cash?.paymentMethodBalances) && cash.paymentMethodBalances.length > 0
        ? cash.paymentMethodBalances
        : cash?.paymentMethodsSummary || [];

      source.forEach((item) => {
        const code = summaryMethodOf(item);
        if (!code || code === 'FREE' || code === 'DEPOSIT_APPLIED') return;
        const current = acc.methods.get(code) || { code, totalAmount: 0, count: 0 };
        current.totalAmount += summaryAmountOf(item);
        current.count += summaryCountOf(item);
        acc.methods.set(code, current);
      });

      return acc;
    },
    {
      sales: 0,
      income: 0,
      expense: 0,
      expected: 0,
      methods: new Map(),
    }
  );

  const net = totals.sales + totals.income - totals.expense;
  const methodRows = buildPaymentMethodRows(
    Array.from(totals.methods.values()).map((item) => ({
      paymentMethod: item.code,
      totalAmount: item.totalAmount,
      count: item.count,
    })),
    Array.from(totals.methods.values()).map((item) => ({
      paymentMethod: item.code,
      totalAmount: item.totalAmount,
      count: item.count,
    })),
    paymentMethods
  );

  return (
    <div className="rounded-[30px] border border-amber-200 bg-[linear-gradient(135deg,#FFFBEB_0%,#FFFFFF_68%)] p-5 shadow-[0_16px_38px_rgba(15,23,42,0.045)]">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">
            Resumen del rango
          </div>
          <div className="mt-1 text-sm font-semibold text-neutral-500">
            Consolidado de cajas encontradas en el rango seleccionado.
          </div>
        </div>

        <div className="rounded-full bg-white px-4 py-2 text-xs font-black text-neutral-700 shadow-sm">
          {items.length} caja{items.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <HistoryMetricCard label="Ventas" value={totals.sales} tone="green" />
        <HistoryMetricCard label="Ingresos" value={totals.income} />
        <HistoryMetricCard label="Salidas" value={totals.expense} tone="red" />
        <HistoryMetricCard label="Neto" value={net} tone={net >= 0 ? 'green' : 'red'} />
        <HistoryMetricCard label="Efectivo esperado" value={totals.expected} tone={totals.expected >= 0 ? 'green' : 'red'} />
      </div>

      <div className="mt-5 rounded-[24px] border border-neutral-200 bg-white p-4">
        <div className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
          Saldo por método
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {methodRows.map((method) => (
            <HistoryPaymentPill
              key={method.code}
              label={method.label || methodLabel(method.code)}
              value={method.balanceAmount}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function HistoryMetricCard({ label, value, tone = 'default' }) {
  const isRed = tone === 'red';
  const isGreen = tone === 'green';

  const classes = isRed
    ? 'border-red-200 bg-red-50 text-red-700'
    : isGreen
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-neutral-200 bg-white text-neutral-950';

  return (
    <div className={`min-w-0 rounded-[22px] border p-4 ${classes}`}>
      <div className="text-sm font-black text-neutral-500">{label}</div>
      <div className="mt-2 truncate text-2xl font-black">
        {formatMoney(value)}
      </div>
    </div>
  );
}

function HistoryPaymentPill({ label, value }) {
  return (
    <div className="min-w-0 rounded-2xl border border-neutral-200 bg-white px-4 py-3">
      <div className="truncate text-xs font-bold text-neutral-500">{label}</div>
      <div className={`mt-1 truncate text-base font-black ${amountClassByValue(value)}`}>
        {formatMoney(value)}
      </div>
    </div>
  );
}

function HistoryDetailModal({ branch, cash, paymentMethods: initialPaymentMethods = DEFAULT_PAYMENT_METHODS, onClose }) {
  const [sales, setSales] = useState([]);
  const [paymentMethods] = useState(initialPaymentMethods);
  const [loadingSales, setLoadingSales] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadSales() {
      setLoadingSales(true);
      setErrorMsg('');

      try {
        const data = await getSalesByCashRegister({
          branchId: branch.id,
          cashRegisterId: cash.id,
        });

        setSales(data);
      } catch (error) {
        setErrorMsg(error.message || 'No se pudieron cargar las ventas de esta caja.');
      } finally {
        setLoadingSales(false);
      }
    }

    loadSales();
  }, [branch.id, cash.id]);

  const paymentsSource =
    cash?.paymentMethodBalances?.length > 0
      ? cash.paymentMethodBalances
      : cash?.paymentMethodsSummary || [];

  const movements = Array.isArray(cash?.movements) ? cash.movements : [];

  return (
    <ModalShell title="Detalle de caja" subtitle={branch?.name || 'Sede'} onClose={onClose}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className={`rounded-full border px-4 py-2 text-xs font-black ${cashStatusClass(cash.status)}`}>
            {cashStatusLabel(cash.status)}
          </div>

          <div className="rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-black text-neutral-600">
            Caja #{cash.id}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard title="Apertura" value={formatDateTime(cash.openedAt)} helper={cash.openedByUserName || 'Usuario no registrado'} />
          <StatCard title="Cierre" value={formatDateTime(cash.closedAt)} helper={cash.closedByUserName || cash.assignedUserName || 'Pendiente'} />
          <StatCard title="Ventas total" value={formatMoney(cash.salesTotal)} helper="Total registrado" tone="gold" />
          <StatCard title="Esperado" value={formatMoney(cash.closingAmountExpected)} helper="Efectivo físico esperado" tone={balanceTone(cash.closingAmountExpected)} />
          <StatCard title="Contado" value={formatMoney(cash.closingAmountCounted)} helper="Monto contado al cierre" />
          <StatCard title="Diferencia" value={formatMoney(cash.differenceAmount)} helper="Contado - esperado" tone={Number(cash.differenceAmount || 0) === 0 ? 'green' : 'red'} />
        </div>

        <div className="rounded-[26px] border border-neutral-200 bg-white p-5">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
            Métodos de pago
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {paymentsSource.length === 0 ? (
              <div className="rounded-2xl bg-neutral-50 p-4 text-sm font-bold text-neutral-500">
                Sin métodos registrados.
              </div>
            ) : (
              paymentsSource.map((payment) => (
                <div
                  key={`${payment.paymentMethod}-${payment.totalAmount}`}
                  className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4"
                >
                  <div className="text-sm font-black text-neutral-950">
                    {paymentLabelFromOptions(paymentMethods, payment.paymentMethod)}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {payment.count || 0} operación(es)
                  </div>
                  <div className={`mt-2 text-lg font-black ${amountClassByValue(payment.totalAmount)}`}>
                    {formatMoney(payment.totalAmount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[26px] border border-neutral-200 bg-white p-5">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
            Ventas de esta caja
          </div>

          <div className="mt-4 overflow-x-auto rounded-[22px] border border-neutral-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-950 text-white">
                <tr>
                  <th className="px-4 py-3 font-black">Cliente</th>
                  <th className="px-4 py-3 font-black">Barbero</th>
                  <th className="px-4 py-3 font-black">Método</th>
                  <th className="px-4 py-3 font-black">Total</th>
                  <th className="px-4 py-3 font-black">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {loadingSales ? (
                  <tr>
                    <td className="px-4 py-5 text-neutral-500" colSpan="5">
                      Cargando ventas...
                    </td>
                  </tr>
                ) : errorMsg ? (
                  <tr>
                    <td className="px-4 py-5 text-red-600" colSpan="5">
                      {errorMsg}
                    </td>
                  </tr>
                ) : sales.length === 0 ? (
                  <tr>
                    <td className="px-4 py-5 text-neutral-500" colSpan="5">
                      No hubo ventas en esta caja.
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={saleIdOf(sale)} className="border-t border-neutral-200">
                      <td className="px-4 py-4 font-black text-neutral-950">
                        {sale.customerName || 'Cliente ocasional'}
                      </td>
                      <td className="px-4 py-4 font-bold text-neutral-700">
                        {saleBarberName(sale)}
                      </td>
                      <td className="px-4 py-4 font-bold text-neutral-700">
                        {methodLabel(sale.metodoPago)}
                      </td>
                      <td className="px-4 py-4 font-black text-emerald-700">
                        {formatMoney(sale.total)}
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-neutral-500">
                        {formatDateTime(saleDateOf(sale))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[26px] border border-neutral-200 bg-white p-5">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
            Movimientos
          </div>

          <div className="mt-4 space-y-3">
            {movements.length === 0 ? (
              <div className="rounded-2xl bg-neutral-50 p-4 text-sm font-bold text-neutral-500">
                No hubo gastos, ingresos, adelantos ni pagos.
              </div>
            ) : (
              movements.map((movement) => (
                <div key={movement.id} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-black text-neutral-950">
                        {movement.concept || movementTypeLabel(movement.type)}
                      </div>
                      <div className="mt-1 text-xs font-bold text-neutral-500">
                        {movementTypeLabel(movement.type)} · {methodLabel(movement.paymentMethod)}
                      </div>
                      {movement.barberUserName && (
                        <div className="mt-1 text-xs font-bold text-amber-700">
                          Barbero: {movement.barberUserName}
                        </div>
                      )}
                      {movement.note && (
                        <div className="mt-1 text-xs text-neutral-500">
                          {movement.note}
                        </div>
                      )}
                    </div>

                    <div className={`font-black ${movementAmountClass(movement.type)}`}>
                      {formatMoney(movement.amount)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function CashHistoryModal({ branch, paymentMethods = DEFAULT_PAYMENT_METHODS, onClose }) {
  const today = new Date();
  const fromDefault = new Date();
  fromDefault.setDate(today.getDate() - 30);

  const [from, setFrom] = useState(toDateInputValue(fromDefault));
  const [to, setTo] = useState(toDateInputValue(today));
  const [items, setItems] = useState([]);
  const [selectedCash, setSelectedCash] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  async function loadHistory() {
    setLoading(true);
    setErrorMsg('');

    try {
      const data = await getCashHistory({
        branchId: branch.id,
        from,
        to,
      });

      setItems(data);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo cargar el historial.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <>
      <ModalShell title="Historial de caja" subtitle={branch?.name || 'Sede'} onClose={onClose}>
        <div className="space-y-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_130px]">
            <InputField label="Desde" value={from} onChange={setFrom} type="date" />
            <InputField label="Hasta" value={to} onChange={setTo} type="date" />
            <button
              type="button"
              onClick={loadHistory}
              className="self-end rounded-2xl bg-neutral-950 px-5 py-4 text-sm font-black text-white transition hover:scale-[1.01]"
            >
              Buscar
            </button>
          </div>

          {!loading && !errorMsg && items.length > 0 && (
            <HistorySummaryCard items={items} paymentMethods={paymentMethods} />
          )}

          {loading ? (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm font-black text-neutral-500">
              Cargando historial...
            </div>
          ) : errorMsg ? (
            <ErrorBox message={errorMsg} />
          ) : items.length === 0 ? (
            <EmptyCard
              title="Sin cajas en este rango"
              text="No se encontraron cajas registradas para las fechas seleccionadas."
            />
          ) : (
            <div className="space-y-3">
              {items.map((cash) => (
                <button
                  key={cash.id}
                  type="button"
                  onClick={() => setSelectedCash(cash)}
                  className="w-full rounded-[26px] border border-neutral-200 bg-white p-5 text-left shadow-[0_10px_28px_rgba(15,23,42,0.045)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-xs font-black ${cashStatusClass(cash.status)}`}>
                          {cashStatusLabel(cash.status)}
                        </span>
                        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-600">
                          Caja #{cash.id}
                        </span>
                      </div>

                      <div className="mt-3 text-base font-black text-neutral-950">
                        {formatDateTime(cash.openedAt)}
                      </div>
                      <div className="mt-1 text-sm font-bold text-neutral-500">
                        Cierre: {formatDateTime(cash.closedAt)}
                      </div>
                    </div>

                    <div className="grid w-full grid-cols-2 gap-3 lg:w-auto lg:min-w-[520px] lg:grid-cols-4">
                      <HistoryPaymentPill label="Ventas" value={cash.salesTotal} />
                      <HistoryPaymentPill label="Salidas" value={cash.movementsExpense} />
                      <HistoryPaymentPill label="Esperado" value={cash.closingAmountExpected} />
                      <HistoryPaymentPill label="Diferencia" value={cash.differenceAmount} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </ModalShell>

      {selectedCash && (
        <HistoryDetailModal
          branch={branch}
          cash={selectedCash}
          paymentMethods={paymentMethods}
          onClose={() => setSelectedCash(null)}
        />
      )}
    </>
  );
}


export default function OwnerCashPage() {
  const { session } = useAuth();
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [cashRegister, setCashRegister] = useState(null);
  const [movements, setMovements] = useState([]);
  const [sales, setSales] = useState([]);
  const [pendingValidationSales, setPendingValidationSales] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState(DEFAULT_PAYMENT_METHODS);

  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingCash, setLoadingCash] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showBarberPaymentModal, setShowBarberPaymentModal] = useState(false);
  const [editingMovement, setEditingMovement] = useState(null);
  const [editingSale, setEditingSale] = useState(null);
  const [viewingSale, setViewingSale] = useState(null);
  const [pendingAppointment, setPendingAppointment] = useState(null);
  const [showAppointmentSaleModal, setShowAppointmentSaleModal] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [processingApprovalId, setProcessingApprovalId] = useState(null);

  const canManageSales = String(session?.role || '').trim().toUpperCase() === 'OWNER';
  const labels = useMemo(
    () => getBusinessLabels(session?.businessType),
    [session?.businessType]
  );

  const selectedBranch = useMemo(() => {
    return branches.find((item) => String(item.id) === String(selectedBranchId)) || null;
  }, [branches, selectedBranchId]);

  async function loadBranches() {
    setLoadingBranches(true);
    setErrorMsg('');

    try {
      const data = await getOwnerBranches();
      setBranches(data);

      if (data.length > 0) {
        setSelectedBranchId((prev) => prev || String(data[0].id));
      }
    } catch (error) {
      setErrorMsg(error.message || 'No se pudieron cargar las sedes.');
    } finally {
      setLoadingBranches(false);
    }
  }

  async function loadPaymentMethods(branchId = selectedBranchId) {
    if (!branchId) {
        setPaymentMethods(DEFAULT_PAYMENT_METHODS);
      return;
    }

    try {
      const data = await getOwnerPaymentMethods(branchId);
      setPaymentMethods(normalizePaymentMethodOptions(data));
    } catch {
        setPaymentMethods(DEFAULT_PAYMENT_METHODS);
    }
  }

  async function loadCash(branchId = selectedBranchId, { silent = false } = {}) {
    if (!branchId) return;

    if (silent) {
      setRefreshing(true);
    } else {
      setLoadingCash(true);
    }

    setErrorMsg('');

    try {
      const current = await getCurrentCashRegister(branchId);
      setCashRegister(current);

      let dataPendingSales = [];
      try {
        dataPendingSales = await getPendingValidationSales(branchId);
      } catch {
        dataPendingSales = [];
      }
      setPendingValidationSales(Array.isArray(dataPendingSales) ? dataPendingSales : []);

      if (current?.id) {
        const [dataMovements, dataSales] = await Promise.all([
          getCashMovements({
            branchId,
            cashRegisterId: current.id,
          }),
          getTodayCashSales(branchId),
        ]);

        setMovements(dataMovements);
        setSales(Array.isArray(dataSales) ? dataSales : []);
      } else {
        setMovements([]);
        setSales([]);
      }

      setLastUpdatedAt(new Date());
    } catch (error) {
      setPendingValidationSales([]);
      setErrorMsg(error.message || 'No se pudo cargar la caja.');
    } finally {
      setLoadingCash(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadBranches();

    const pending = readAttendAppointmentFromStorage();
    if (pending) {
      setPendingAppointment(pending);
      if (pending.branchId) {
        setSelectedBranchId(String(pending.branchId));
      }
    }
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      loadPaymentMethods(selectedBranchId);
      loadCash(selectedBranchId);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    if (!selectedBranchId) return undefined;

    const timer = window.setInterval(() => {
      if (
        showOpenModal ||
        showCloseModal ||
        showMovementModal ||
        showSaleModal ||
        showHistoryModal ||
        showBarberPaymentModal ||
        editingMovement ||
        editingSale ||
        viewingSale ||
        showAppointmentSaleModal ||
        processingApprovalId
      ) {
        return;
      }

      loadCash(selectedBranchId, { silent: true });
    }, 10000);

    return () => window.clearInterval(timer);
  }, [
    selectedBranchId,
    showOpenModal,
    showCloseModal,
    showMovementModal,
    showSaleModal,
    showHistoryModal,
    showBarberPaymentModal,
    editingMovement,
    editingSale,
    viewingSale,
    showAppointmentSaleModal,
    processingApprovalId,
  ]);

  
  function dismissPendingAppointment() {
    clearAttendAppointmentFromStorage();
    setPendingAppointment(null);
    setShowAppointmentSaleModal(false);
  }

  async function handleDeleteSale(sale) {
    if (!canManageSales) return;

    const saleId = saleIdOf(sale);
    if (!selectedBranch || !saleId) return;

    const ok = window.confirm('¿Seguro que deseas eliminar esta venta? Esta acción no se puede deshacer.');
    if (!ok) return;

    setErrorMsg('');

    try {
      await deleteCashSale({
        branchId: selectedBranch.id,
        saleId,
      });

      await loadCash(selectedBranchId);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo eliminar la venta.');
    }
  }

  async function handleDeleteMovement(movement) {
    if (!selectedBranch || !movement?.id) return;

    const ok = window.confirm('¿Seguro que deseas eliminar este movimiento? Esta acción no se puede deshacer.');
    if (!ok) return;

    setErrorMsg('');

    try {
      await deleteCashMovement({
        branchId: selectedBranch.id,
        movementId: movement.id,
      });

      await loadCash(selectedBranchId);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo eliminar el movimiento.');
    }
  }

  async function handleApproveMovement(movement) {
    if (!selectedBranch || !movement?.id) return;

    const ok = window.confirm(
      `¿Aprobar el movimiento "${movement.concept || 'Movimiento'}" por ${formatMoney(movement.amount)}?`
    );
    if (!ok) return;

    setErrorMsg('');
    setProcessingApprovalId(movement.id);

    try {
      await approveCashMovement({
        branchId: selectedBranch.id,
        movementId: movement.id,
        note: 'Ingreso aprobado desde caja web',
      });

      await loadCash(selectedBranchId);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo aprobar el movimiento pendiente.');
    } finally {
      setProcessingApprovalId(null);
    }
  }

  async function handleRejectMovement(movement) {
    if (!selectedBranch || !movement?.id) return;

    const ok = window.confirm(
      `¿Rechazar el movimiento "${movement.concept || 'Movimiento'}" por ${formatMoney(movement.amount)}?`
    );
    if (!ok) return;

    setErrorMsg('');
    setProcessingApprovalId(movement.id);

    try {
      await rejectCashMovement({
        branchId: selectedBranch.id,
        movementId: movement.id,
        note: 'Ingreso rechazado desde caja web',
      });

      await loadCash(selectedBranchId);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo rechazar el movimiento pendiente.');
    } finally {
      setProcessingApprovalId(null);
    }
  }

  async function handleApproveSalePayment(sale) {
    if (!selectedBranch) return;

    const saleId = saleIdOf(sale);
    if (!saleId) return;

    const ok = window.confirm(
      `Aprobar la venta #${saleId} por ${formatMoney(sale.total)}?`
    );
    if (!ok) return;

    setErrorMsg('');
    setProcessingApprovalId(`sale-${saleId}`);

    try {
      const approvedSale = await approveSalePayment({
        branchId: selectedBranch.id,
        saleId,
      });

      offerCustomerWhatsappFollowUp(saleWithWhatsappFallback(approvedSale, sale));
      await loadCash(selectedBranchId);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo aprobar la venta pendiente.');
    } finally {
      setProcessingApprovalId(null);
    }
  }

  async function handleRejectSalePayment(sale) {
    if (!selectedBranch) return;

    const saleId = saleIdOf(sale);
    if (!saleId) return;

    const reason = window.prompt(
      `Motivo para rechazar la venta #${saleId}:`,
      'Pago no validado'
    );
    if (reason === null) return;

    const cleanReason = reason.trim() || 'Pago rechazado desde caja web';

    setErrorMsg('');
    setProcessingApprovalId(`sale-${saleId}`);

    try {
      await rejectSalePayment({
        branchId: selectedBranch.id,
        saleId,
        reason: cleanReason,
      });

      await loadCash(selectedBranchId);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo rechazar la venta pendiente.');
    } finally {
      setProcessingApprovalId(null);
    }
  }

  const isOpen = String(cashRegister?.status || '').toUpperCase() === 'OPEN';

  const paymentSalesSource = Array.isArray(cashRegister?.paymentMethodsSummary)
    ? cashRegister.paymentMethodsSummary
    : [];

  const paymentBalanceSource = Array.isArray(cashRegister?.paymentMethodBalances)
    ? cashRegister.paymentMethodBalances
    : [];

  const paymentRows = buildPaymentMethodRows(paymentSalesSource, paymentBalanceSource, paymentMethods);
  const cashRow = paymentRows.find((item) => item.code === 'CASH');
  const digitalBalance = paymentRows
    .filter((item) => item.code !== 'CASH')
    .reduce((sum, item) => sum + Number(item.balanceAmount || 0), 0);
  const digitalSales = paymentRows
    .filter((item) => item.code !== 'CASH')
    .reduce((sum, item) => sum + Number(item.salesAmount || 0), 0);

  const expected = Number(cashRegister?.closingAmountExpected || 0);
  const openingAmount = Number(cashRegister?.openingAmount || 0);
  const salesTotal = Number(cashRegister?.salesTotal || 0);
  const cashSalesTotal = Number(cashRow?.salesAmount ?? cashRegister?.cashSalesTotal ?? 0);
  const cashBalance = Number(cashRow?.balanceAmount ?? expected);
  const income = Number(cashRegister?.movementsIncome || 0);
  const derivedCashExpense = movements
    .filter((movement) =>
      ['EXPENSE', 'ADVANCE_BARBER', 'PAYMENT_BARBER'].includes(String(movement?.type || '').toUpperCase())
    )
    .filter((movement) => normalizeMethod(movement?.paymentMethod) === 'CASH')
    .reduce((sum, movement) => sum + Number(movement?.amount || 0), 0);
  const cashExpense = Number(cashRegister?.cashMovementsExpense ?? derivedCashExpense);
  const courtesySummary = buildCourtesySummary(sales);
  const pendingSales = pendingValidationSales.filter(isPendingSaleValidation);
  const pendingApprovalMovements = movements.filter(isPendingOwnerApproval);
  const visibleMovements = movements.filter((movement) => !isPendingOwnerApproval(movement));

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[34px] border border-amber-400/15 bg-[linear-gradient(135deg,#090909_0%,#15110A_42%,#101827_100%)] p-6 text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(251,191,36,0.20),transparent_30%),radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.16),transparent_32%)]" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
              Caja Web
            </div>

            <h2 className="mt-5 text-4xl font-black tracking-tight">
              Control de caja
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">
              Revisa caja abierta, métodos de pago, ingresos, gastos y movimientos
              operativos por sede.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/35">
                  Sede
                </div>

                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="mt-1 bg-transparent text-sm font-black text-white outline-none"
                  disabled={loadingBranches}
                >
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id} className="text-neutral-950">
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={`rounded-2xl border px-4 py-3 ${
                isOpen
                  ? 'border-emerald-400/20 bg-emerald-400/10'
                  : 'border-red-400/20 bg-red-400/10'
              }`}>
                <div className={`text-[11px] font-black uppercase tracking-[0.18em] ${
                  isOpen ? 'text-emerald-300/70' : 'text-red-300/80'
                }`}>
                  Estado
                </div>

                <div className={`mt-1 text-sm font-black ${
                  isOpen ? 'text-emerald-300' : 'text-red-200'
                }`}>
                  {isOpen ? 'Caja abierta' : 'Caja cerrada'}
                </div>
              </div>

              {cashRegister?.openedAt && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3">
                  <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/35">
                    Apertura
                  </div>
                  <div className="mt-1 text-sm font-black">
                    {formatDateTime(cashRegister.openedAt)}
                  </div>
                </div>
              )}

              {lastUpdatedAt && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3">
                  <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/35">
                    Actualizado
                  </div>
                  <div className="mt-1 text-sm font-black">
                    {lastUpdatedAt.toLocaleTimeString('es-PE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => loadCash(selectedBranchId, { silent: true })}
              disabled={refreshing}
              className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-sm font-black text-white transition hover:bg-white/15 disabled:opacity-60"
            >
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>

            <button
              onClick={() => setShowHistoryModal(true)}
              disabled={!selectedBranch}
              className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-sm font-black text-white transition hover:bg-white/15 disabled:opacity-60"
            >
              Historial
            </button>

            {isOpen ? (
              <>
                <button
                  onClick={() => setShowSaleModal(true)}
                  disabled={!canManageSales}
                  className="rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-black text-neutral-950 shadow-[0_16px_35px_rgba(16,185,129,0.18)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Nueva venta
                </button>

                <button
                  onClick={() => setShowMovementModal(true)}
                  className="rounded-2xl bg-amber-400 px-5 py-4 text-sm font-black text-neutral-950 shadow-[0_16px_35px_rgba(251,191,36,0.22)] transition hover:scale-[1.02]"
                >
                  Movimiento
                </button>

                <button
                  onClick={() => setShowBarberPaymentModal(true)}
                  className="rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-black text-neutral-950 shadow-[0_16px_35px_rgba(16,185,129,0.18)] transition hover:scale-[1.02]"
                >
                  Pagar barbero
                </button>

                <button
                  onClick={() => setShowCloseModal(true)}
                  className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-neutral-950 transition hover:scale-[1.02]"
                >
                  Cerrar caja
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowOpenModal(true)}
                disabled={!selectedBranch}
                className="rounded-2xl bg-amber-400 px-5 py-4 text-sm font-black text-neutral-950 shadow-[0_16px_35px_rgba(251,191,36,0.22)] transition hover:scale-[1.02] disabled:opacity-60"
              >
                Abrir caja
              </button>
            )}
          </div>
        </div>
      </section>

      {errorMsg && <ErrorBox message={errorMsg} />}

      {pendingAppointment && (
        <AppointmentSaleBanner
          appointment={pendingAppointment}
          isOpen={isOpen}
          onOpenSale={() => setShowAppointmentSaleModal(true)}
          onDismiss={dismissPendingAppointment}
        />
      )}

      {loadingBranches || loadingCash ? (
        <div className="rounded-[28px] border border-neutral-200 bg-white p-6 font-bold text-neutral-700 shadow-sm">
          Cargando caja...
        </div>
      ) : !selectedBranch ? (
        <EmptyCard
          title="No hay sedes disponibles"
          text="No se encontraron sedes conectadas al usuario actual."
        />
      ) : !cashRegister ? (
        <>
          <PendingSaleValidationsSection
            items={pendingSales}
            processingId={processingApprovalId}
            labels={labels}
            onView={(sale) => setViewingSale(sale)}
            onApprove={handleApproveSalePayment}
            onReject={handleRejectSalePayment}
          />

          <EmptyCard
        title="No hay caja abierta"
        text="Abre una caja para empezar a registrar ventas, ingresos, gastos y movimientos del día."
        action={
          <button
            onClick={() => setShowOpenModal(true)}
            disabled={!selectedBranch}
            className="rounded-2xl bg-amber-400 px-6 py-4 text-sm font-black text-neutral-950 shadow-[0_16px_35px_rgba(251,191,36,0.22)] transition hover:scale-[1.02] disabled:opacity-60"
          >
            Abrir caja ahora
          </button>
        }
          />
        </>
      ) : (
        <>
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            <StatCard title="Apertura" value={formatMoney(openingAmount)} helper="Fondo inicial de efectivo" />
            <StatCard title="Ventas total" value={formatMoney(salesTotal)} helper="Todos los métodos" tone="gold" />
            <StatCard title="Efectivo físico" value={formatMoney(cashBalance)} helper="Saldo esperado en caja" tone={balanceTone(cashBalance)} />
            <StatCard title="Digital disponible" value={formatMoney(digitalBalance)} helper="Métodos digitales configurados" />
            <StatCard
              title="Esperado"
              value={formatMoney(expected)}
              helper={expected < 0 ? 'Caja física en negativo' : 'Caja física esperada'}
              tone={balanceTone(expected)}
            />
          </section>

          <CourtesySummarySection summary={courtesySummary} labels={labels} />

          <PendingSaleValidationsSection
            items={pendingSales}
            processingId={processingApprovalId}
            labels={labels}
            onView={(sale) => setViewingSale(sale)}
            onApprove={handleApproveSalePayment}
            onReject={handleRejectSalePayment}
          />

          <PendingCashApprovalsSection
            items={pendingApprovalMovements}
            processingId={processingApprovalId}
            onApprove={handleApproveMovement}
            onReject={handleRejectMovement}
          />

          <section className="rounded-[34px] border border-neutral-200 bg-white p-6 shadow-[0_16px_45px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
                  Conciliación por método
                </div>
                <h3 className="mt-2 text-2xl font-black text-neutral-950">
                  Dinero esperado por método de pago
                </h3>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-500">
                  El efectivo incluye apertura, ventas en efectivo, ingresos, gastos, pagos a barberos y traslados.
                  Los métodos digitales muestran el saldo disponible después de movimientos.
                </p>
              </div>

              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <div className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Efectivo vendido</div>
                  <div className="mt-1 text-lg font-black text-emerald-800">{formatMoney(cashSalesTotal)}</div>
                </div>
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
                  <div className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Digital vendido</div>
                  <div className="mt-1 text-lg font-black text-blue-800">{formatMoney(digitalSales)}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {paymentRows.map((method) => (
                <PaymentMethodCard key={method.code} method={method} />
              ))}
            </div>
          </section>

<CashNegativeAlert
  expected={expected}
  cashSalesTotal={cashSalesTotal}
  expense={cashExpense}
/>

<section className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
            <div className="rounded-[32px] border border-neutral-200 bg-white p-6 shadow-[0_16px_45px_rgba(15,23,42,0.05)]">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
                Caja física
              </div>

              <h3 className="mt-2 text-2xl font-black text-neutral-950">
                Fórmula del efectivo esperado
              </h3>

              <p className="mt-1 text-sm leading-6 text-neutral-500">
                Este cálculo te dice cuánto dinero físico deberías tener en la caja.
              </p>

              <div className="mt-5 space-y-3">
                <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    Entrada de efectivo
                  </div>
                  <div className="mt-2 text-sm font-black text-neutral-950">
                    Apertura {formatMoney(openingAmount)} + ventas efectivo {formatMoney(cashSalesTotal)} + ingresos {formatMoney(income)}
                  </div>
                </div>

                <div className="rounded-[24px] border border-red-100 bg-red-50 p-4">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
                    Salidas de efectivo
                  </div>
                  <div className="mt-2 text-2xl font-black text-red-700">
                    {formatMoney(cashExpense)}
                  </div>
                  <div className="mt-1 text-xs text-red-500">
                    Gastos, adelantos, pagos de barbero y salidas registradas.
                  </div>
                </div>

                <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                    Resultado esperado
                  </div>
                  <div className="mt-2 text-xl font-black text-neutral-950">
                    {formatMoney(expected)}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    Si el monto físico contado no coincide, revisa movimientos o pagos registrados con método incorrecto.
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-neutral-200 bg-white p-6 shadow-[0_16px_45px_rgba(15,23,42,0.05)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
                    Movimientos
                  </div>

                  <h3 className="mt-2 text-2xl font-black text-neutral-950">
                    Actividad de caja
                  </h3>

                  <p className="mt-1 text-sm text-neutral-500">
                    Ingresos, gastos y traslados registrados en la caja abierta.
                  </p>
                </div>

                <div className="rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-black text-neutral-700">
                  {visibleMovements.length} movimiento{visibleMovements.length === 1 ? '' : 's'}
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-[26px] border border-neutral-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[linear-gradient(135deg,#090909_0%,#111827_100%)] text-white">
                    <tr>
                      <th className="px-5 py-4 font-black">Tipo</th>
                      <th className="px-5 py-4 font-black">Concepto</th>
                      <th className="px-5 py-4 font-black">Método</th>
                      <th className="px-5 py-4 font-black">Monto</th>
                      <th className="px-5 py-4 font-black">Fecha</th>
                      <th className="px-5 py-4 font-black text-right">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleMovements.length === 0 ? (
                      <tr>
                        <td className="px-5 py-6 text-neutral-500" colSpan="6">
                          No hay movimientos registrados.
                        </td>
                      </tr>
                    ) : (
                      visibleMovements.map((movement) => (
                        <tr key={movement.id} className="border-t border-neutral-200 transition hover:bg-amber-50/50">
                          <td className="px-5 py-5 font-black text-neutral-950">
                            {movementTypeLabel(movement.type)}
                          </td>

                          <td className="px-5 py-5">
                            <div className="font-bold text-neutral-800">
                              {movement.concept || 'Movimiento'}
                            </div>
                            {movement.note && (
                              <div className="mt-1 text-xs text-neutral-400">
                                {movement.note}
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-5 font-bold text-neutral-700">
                            {movement.type === 'PAYMENT_METHOD_TRANSFER'
                              ? `${methodLabel(movement.fromPaymentMethod)} → ${methodLabel(movement.toPaymentMethod)}`
                              : methodLabel(movement.paymentMethod)}
                          </td>

                          <td className={`px-5 py-5 font-black ${movementAmountClass(movement.type)}`}>
                            {formatMoney(movement.amount)}
                          </td>

                          <td className="px-5 py-5 text-xs font-bold text-neutral-500">
                            {formatDateTime(movement.movementDate)}
                          </td>

                          <td className="px-5 py-5">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingMovement(movement)}
                                className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-black text-neutral-700 hover:bg-neutral-50"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMovement(movement)}
                                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-100"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <SalesSection
            sales={sales}
            canManageSales={canManageSales}
            labels={labels}
            onView={(sale) => setViewingSale(sale)}
            onEdit={(sale) => setEditingSale(sale)}
            onDelete={handleDeleteSale}
          />
        </>
      )}

      {showOpenModal && selectedBranch && (
        <OpenCashModal
          branch={selectedBranch}
          onClose={() => setShowOpenModal(false)}
          onSaved={() => {
            setShowOpenModal(false);
            loadCash(selectedBranchId);
          }}
        />
      )}

      {showCloseModal && selectedBranch && cashRegister && (
        <CloseCashModal
          branch={selectedBranch}
          cashRegister={cashRegister}
          onClose={() => setShowCloseModal(false)}
          onSaved={() => {
            setShowCloseModal(false);
            loadCash(selectedBranchId);
          }}
        />
      )}

      {showHistoryModal && selectedBranch && (
        <CashHistoryModal
          branch={selectedBranch}
          paymentMethods={paymentMethods}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {showSaleModal && selectedBranch && cashRegister && (
        <SaleModal
          branch={selectedBranch}
          cashRegister={cashRegister}
          paymentMethods={paymentMethods}
          labels={labels}
          session={session}
          onClose={() => setShowSaleModal(false)}
          onSaved={async () => {
            setShowSaleModal(false);
            await loadCash(selectedBranchId);
          }}
        />
      )}

      {showMovementModal && selectedBranch && cashRegister && (
        <MovementModal
          branch={selectedBranch}
          cashRegister={cashRegister}
          paymentMethods={paymentMethods}
          onClose={() => setShowMovementModal(false)}
          onSaved={() => {
            setShowMovementModal(false);
            loadCash(selectedBranchId);
          }}
        />
      )}

      {editingMovement && selectedBranch && cashRegister && (
        <MovementModal
          branch={selectedBranch}
          cashRegister={cashRegister}
          paymentMethods={paymentMethods}
          initialMovement={editingMovement}
          onClose={() => setEditingMovement(null)}
          onSaved={() => {
            setEditingMovement(null);
            loadCash(selectedBranchId);
          }}
        />
      )}

      {showBarberPaymentModal && selectedBranch && cashRegister && (
        <BarberPaymentModal
          branch={selectedBranch}
          cashRegister={cashRegister}
          paymentMethods={paymentMethods}
          onClose={() => setShowBarberPaymentModal(false)}
          onSaved={() => {
            setShowBarberPaymentModal(false);
            loadCash(selectedBranchId);
          }}
        />
      )}

      {showAppointmentSaleModal && selectedBranch && cashRegister && pendingAppointment && (
        <AppointmentSaleModal
          branch={selectedBranch}
          cashRegister={cashRegister}
          appointment={pendingAppointment}
          paymentMethods={paymentMethods}
          labels={labels}
          session={session}
          onClose={() => setShowAppointmentSaleModal(false)}
          onSaved={() => {
            setShowAppointmentSaleModal(false);
            setPendingAppointment(null);
            loadCash(selectedBranchId);
          }}
        />
      )}


      {viewingSale && (
        <SaleDetailModal
          sale={viewingSale}
          onClose={() => setViewingSale(null)}
        />
      )}

      {editingSale && selectedBranch && (
        <EditSaleModal
          branch={selectedBranch}
          sale={editingSale}
          paymentMethods={paymentMethods}
          onClose={() => setEditingSale(null)}
          onSaved={() => {
            setEditingSale(null);
            loadCash(selectedBranchId);
          }}
        />
      )}
    </div>
  );
}

