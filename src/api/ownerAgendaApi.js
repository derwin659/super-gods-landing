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
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.results)) return data.results;

  return [];
}

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;

  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function toBool(value) {
  if (value === true) return true;
  if (value === false) return false;

  const text = String(value ?? '').trim().toLowerCase();
  return text === 'true' || text === '1' || text === 'yes' || text === 'si';
}

export function normalizeAgendaItem(raw = {}) {
  const depositStatus =
    raw.depositStatus ??
    raw.estadoPagoInicial ??
    raw.estadoDeposito ??
    'NOT_REQUIRED';

  const depositRequired =
    raw.depositRequired ??
    raw.requierePagoInicial ??
    raw.requiresDeposit ??
    false;

  return {
    appointmentId: toNumber(raw.appointmentId ?? raw.id),

    customerId:
      raw.customerId !== null && raw.customerId !== undefined
        ? toNumber(raw.customerId)
        : null,

    serviceId:
      raw.serviceId !== null && raw.serviceId !== undefined
        ? toNumber(raw.serviceId)
        : null,

    barberUserId:
      raw.barberUserId !== null && raw.barberUserId !== undefined
        ? toNumber(raw.barberUserId)
        : raw.barberId !== null && raw.barberId !== undefined
          ? toNumber(raw.barberId)
          : null,

    branchId:
      raw.branchId !== null && raw.branchId !== undefined
        ? toNumber(raw.branchId)
        : null,

    fecha: String(raw.fecha ?? ''),
    hora: String(raw.hora ?? raw.horaInicio ?? raw.time ?? ''),
    horaFin: String(raw.horaFin ?? ''),

    cliente: String(raw.cliente ?? raw.customerName ?? 'Cliente'),
    servicio: String(raw.servicio ?? raw.serviceName ?? 'Servicio'),
    barbero: String(raw.barbero ?? raw.barberName ?? 'Sin asignar'),
    estado: String(raw.estado ?? 'RESERVADO'),

    telefono:
      raw.telefono !== null && raw.telefono !== undefined
        ? String(raw.telefono)
        : '',

    depositRequired: toBool(depositRequired),

    depositAmount: toNumber(
      raw.depositAmount ??
        raw.montoPagoInicial ??
        raw.initialPaymentAmount
    ),

    remainingAmount: toNumber(
      raw.remainingAmount ??
        raw.saldoPendiente ??
        raw.pendingAmount
    ),

    depositStatus: String(depositStatus),

    depositMethodCode:
      raw.depositMethodCode ??
      raw.metodoPagoInicialCodigo ??
      raw.paymentMethodCode ??
      '',

    depositMethodName:
      raw.depositMethodName ??
      raw.metodoPagoInicial ??
      raw.paymentMethodName ??
      '',

    depositOperationCode:
      raw.depositOperationCode ??
      raw.numeroOperacionPagoInicial ??
      raw.operationCode ??
      '',

    depositEvidenceUrl:
      raw.depositEvidenceUrl ??
      raw.comprobantePagoInicialUrl ??
      raw.evidenceUrl ??
      '',

    depositNote:
      raw.depositNote ??
      raw.notaPagoInicial ??
      raw.note ??
      '',

    paymentInitialValidated:
      toBool(raw.pagoInicialValidado ?? raw.paymentInitialValidated),

    priceService: toNumber(
      raw.precioServicio ??
        raw.servicePrice ??
        raw.priceService ??
        raw.originalAmount ??
        raw.totalAmount
    ),

    promotionTitle:
      raw.promotionTitle ??
      raw.tituloPromocion ??
      raw.promoTitle ??
      '',

    originalAmount: toNumber(
      raw.originalAmount ??
        raw.montoOriginal ??
        raw.precioOriginal ??
        raw.precioServicio
    ),

    discountAmount: toNumber(
      raw.discountAmount ??
        raw.montoDescuento ??
        raw.descuentoPromocion ??
        raw.promotionDiscount
    ),

    totalAmount: toNumber(
      raw.totalAmount ??
        raw.montoTotal ??
        raw.precioFinal ??
        raw.precioServicio
    ),
  };
}

export async function getOwnerBranchesForAgenda() {
  const data = await apiRequest('/api/owner/home/dashboard');
  const raw = Array.isArray(data?.branches) ? data.branches : [];

  return raw.map((item) => ({
    id: Number(item.branchId ?? item.id ?? 0),
    name: String(item.branchName ?? item.name ?? item.nombre ?? 'Sede'),
  }));
}

export async function getOwnerAgenda({ fecha, branchId }) {
  const data = await apiRequest(
    `/api/owner/agenda${toQuery({
      fecha,
      branchId,
    })}`
  );

  return extractList(data).map((item) => normalizeAgendaItem(item));
}

export async function validateAppointmentDeposit({
  appointmentId,
  approved,
  note,
  branchId = null,
}) {
  return apiRequest(
    `/api/owner/agenda/appointments/${appointmentId}/deposit/validate${toQuery({
      branchId,
    })}`,
    {
      method: 'POST',
      body: JSON.stringify({
        approved: Boolean(approved),
        note:
          note ||
          (approved
            ? 'Pago validado correctamente desde agenda web'
            : 'Pago rechazado desde agenda web'),
      }),
    }
  );
}

export async function getAgendaBarbers(branchId) {
  const data = await apiRequest(
    `/api/owner/catalog/barbers${toQuery({ branchId })}`
  );

  return extractList(data)
    .map((item) => ({
      id: toNumber(item.id ?? item.userId ?? item.barberUserId),
      name: String(
        item.nombre ??
          item.name ??
          item.fullName ??
          item.nombreCompleto ??
          item.displayName ??
          'Barbero'
      ),
      imageUrl: String(
        item.photoUrl ??
          item.fotoUrl ??
          item.imageUrl ??
          item.imagenUrl ??
          item.avatarUrl ??
          ''
      ),
    }))
    .filter((item) => item.id > 0);
}

export async function getAgendaServices() {
  const data = await apiRequest('/api/owner/catalog/services');

  return extractList(data)
    .map((item) => ({
      id: toNumber(item.id ?? item.serviceId),
      name: String(item.nombre ?? item.name ?? item.serviceName ?? 'Servicio'),
      price: toNumber(item.precio ?? item.price ?? item.amount),
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
}

export async function searchAgendaCustomers(query) {
  const q = String(query || '').trim();

  if (q.length < 2) return [];

  const data = await apiRequest(
    `/api/owner/catalog/customers/search${toQuery({ q })}`
  );

  return extractList(data)
    .map((item) => ({
      id: toNumber(item.id ?? item.customerId),
      name: String(
        item.nombres ??
          item.nombre ??
          item.name ??
          item.nombreCompleto ??
          item.fullName ??
          'Cliente'
      ),
      phone:
        item.telefono !== null && item.telefono !== undefined
          ? String(item.telefono)
          : item.phone !== null && item.phone !== undefined
            ? String(item.phone)
            : '',
      imageUrl: String(
        item.imageUrl ??
          item.imagenUrl ??
          item.photoUrl ??
          item.fotoUrl ??
          ''
      ),
    }))
    .filter((item) => item.id > 0);
}

export async function createQuickAgendaCustomer({
  nombres,
  apellidos = null,
  telefono,
}) {
  const data = await apiRequest('/api/customers/quick', {
    method: 'POST',
    body: JSON.stringify({
      nombres: String(nombres || '').trim(),
      apellidos:
        apellidos && String(apellidos).trim()
          ? String(apellidos).trim()
          : null,
      telefono: String(telefono || '').replace(/[^0-9]/g, ''),
    }),
  });

  return {
    id: toNumber(data.id ?? data.customerId),
    name: String(
      data.nombres ??
        data.nombre ??
        data.name ??
        data.nombreCompleto ??
        data.fullName ??
        nombres
    ),
    phone:
      data.telefono !== null && data.telefono !== undefined
        ? String(data.telefono)
        : String(telefono || ''),
    imageUrl: String(
      data.imageUrl ??
        data.imagenUrl ??
        data.photoUrl ??
        data.fotoUrl ??
        ''
    ),
  };
}

export async function getAppointmentAvailability({
  branchId,
  barberUserId,
  serviceId,
  fecha,
  appointmentId = null,
}) {
  const data = await apiRequest(
    `/api/owner/agenda/availability${toQuery({
      branchId,
      barberUserId,
      serviceId,
      fecha,
      appointmentId,
    })}`
  );

  const rawSlots = Array.isArray(data?.slots) ? data.slots : [];

  return {
    fecha: String(data?.fecha ?? fecha ?? ''),
    branchId: toNumber(data?.branchId ?? branchId),
    barberUserId: toNumber(data?.barberUserId ?? barberUserId),
    serviceId: toNumber(data?.serviceId ?? serviceId),
    serviceDurationMinutes: toNumber(data?.serviceDurationMinutes, 30),
    slots: rawSlots.map((slot) => ({
      hora: String(slot.hora ?? ''),
      horaFin: String(slot.horaFin ?? ''),
      available: slot.available === true,
      reason: slot.reason ? String(slot.reason) : null,
      appointmentId:
        slot.appointmentId !== null && slot.appointmentId !== undefined
          ? toNumber(slot.appointmentId)
          : null,
    })),
  };
}

function appointmentPayload({
  customerId,
  serviceId,
  barberUserId,
  branchId,
  fecha,
  horaInicio,
  horaFin = null,
  estado = null,
  notas = null,
  depositRequired = false,
  depositAmount = 0,
  depositMethodCode = null,
  depositMethodName = null,
  depositOperationCode = null,
  depositEvidenceUrl = null,
  depositNote = null,
}) {
  return {
    customerId,
    serviceId,
    barberUserId,
    branchId,
    fecha,
    horaInicio,
    horaFin,
    estado,
    notas,
    depositRequired: Boolean(depositRequired),
    depositAmount: Number(depositAmount || 0),
    depositMethodCode,
    depositMethodName,
    depositOperationCode,
    depositEvidenceUrl,
    depositNote,
  };
}

export async function createOwnerAppointment(payload) {
  const data = await apiRequest(
    `/api/owner/agenda/appointments${toQuery({
      branchId: payload.branchId,
    })}`,
    {
      method: 'POST',
      body: JSON.stringify(appointmentPayload(payload)),
    }
  );

  return normalizeAgendaItem(data);
}

export async function updateOwnerAppointment(payload) {
  const data = await apiRequest(
    `/api/owner/agenda/appointments/${payload.appointmentId}${toQuery({
      branchId: payload.branchId,
    })}`,
    {
      method: 'PUT',
      body: JSON.stringify(appointmentPayload(payload)),
    }
  );

  return normalizeAgendaItem(data);
}

export async function cancelOwnerAppointment({ appointmentId, branchId }) {
  const data = await apiRequest(
    `/api/owner/agenda/appointments/${appointmentId}${toQuery({
      branchId,
    })}`,
    {
      method: 'DELETE',
    }
  );

  return normalizeAgendaItem(data);
}