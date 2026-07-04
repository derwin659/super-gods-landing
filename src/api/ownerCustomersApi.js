import { apiRequest, getApiBaseUrl, getToken } from './apiClient';

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
  if (Array.isArray(data?.customers)) return data.customers;
  if (Array.isArray(data?.history)) return data.history;
  if (Array.isArray(data?.visits)) return data.visits;
  if (Array.isArray(data?.sales)) return data.sales;
  if (Array.isArray(data?.cashSales)) return data.cashSales;
  if (Array.isArray(data?.cuts)) return data.cuts;
  if (Array.isArray(data?.cutHistory)) return data.cutHistory;
  if (Array.isArray(data?.appointments)) return data.appointments;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.rows)) return data.rows;

  return [];
}

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;

  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function text(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function normalizeCustomer(raw = {}) {
  const name =
    raw.nombreCompleto ??
    raw.fullName ??
    raw.name ??
    raw.nombre ??
    [raw.nombres, raw.apellidos].filter(Boolean).join(' ') ??
    'Cliente';

  return {
    id: toNumber(raw.customerId ?? raw.id),
    nombres: text(raw.nombres ?? raw.nombre ?? raw.firstName ?? name, 'Cliente'),
    apellidos: text(raw.apellidos ?? raw.lastName ?? ''),
    nombreCompleto: text(name, 'Cliente').trim() || 'Cliente',
    telefono: text(raw.telefono ?? raw.phone ?? raw.phoneNumber ?? ''),
    email: text(raw.email ?? raw.correo ?? ''),
    puntosDisponibles: toNumber(
      raw.puntosDisponibles ??
        raw.pointsAvailable ??
        raw.loyaltyPoints ??
        raw.puntos ??
        raw.availablePoints
    ),
    puntosAcumulados: toNumber(
      raw.puntosAcumulados ??
        raw.pointsEarned ??
        raw.totalPoints ??
        raw.accumulatedPoints
    ),
    visitas: toNumber(raw.visitas ?? raw.visitCount ?? raw.totalVisits),
    ultimaVisita: text(raw.ultimaVisita ?? raw.lastVisitDate ?? raw.lastVisit ?? ''),
    ultimoServicio: text(raw.ultimoServicio ?? raw.lastServiceName ?? ''),
    ultimoBarbero: text(raw.ultimoBarbero ?? raw.lastBarberName ?? ''),
    imageUrl: text(
      raw.imageUrl ??
        raw.imagenUrl ??
        raw.photoUrl ??
        raw.fotoUrl ??
        raw.avatarUrl ??
        ''
    ),
    raw,
  };
}

function normalizeHistoryItemDetail(raw = {}) {
  return {
    id: toNumber(raw.id ?? raw.saleItemId ?? raw.itemId),
    nombre: text(
      raw.nombre ??
        raw.name ??
        raw.servicio ??
        raw.serviceName ??
        raw.producto ??
        raw.productName ??
        'Item'
    ),
    tipo: text(
      raw.tipo ??
        raw.type ??
        (raw.productId !== null && raw.productId !== undefined ? 'PRODUCT' : 'SERVICE'),
      'SERVICE'
    ),
    cantidad: toNumber(raw.cantidad ?? raw.quantity, 1),
    precioUnitario: toNumber(raw.precioUnitario ?? raw.unitPrice ?? raw.price),
    subtotal: toNumber(raw.subtotal ?? raw.total ?? raw.amount),
    barbero: text(raw.barbero ?? raw.barberName ?? raw.barber ?? 'Sin asignar'),
    barberPhotoUrl: text(
      raw.barberPhotoUrl ??
        raw.barberoFotoUrl ??
        raw.barberImageUrl ??
        raw.photoUrl ??
        raw.fotoUrl ??
        ''
    ),
    raw,
  };
}

function normalizeHistoryItem(raw = {}) {
  const rawItems =
    raw.items ?? raw.detalles ?? raw.servicios ?? raw.saleItems ?? raw.details ?? [];

  const items = Array.isArray(rawItems)
    ? rawItems.map((item) => normalizeHistoryItemDetail(item))
    : [];

  return {
    id: toNumber(raw.id ?? raw.historyId ?? raw.saleId ?? raw.appointmentId),
    fecha: text(raw.fecha ?? raw.date ?? raw.createdAt ?? raw.fechaCreacion ?? ''),
    servicio: text(raw.servicio ?? raw.serviceName ?? raw.service ?? raw.corte ?? 'Servicio'),
    barbero: text(raw.barbero ?? raw.barberName ?? raw.barber ?? 'Sin asignar'),
    barberPhotoUrl: text(
      raw.barberPhotoUrl ??
        raw.barberoFotoUrl ??
        raw.barberImageUrl ??
        raw.photoUrl ??
        raw.fotoUrl ??
        ''
    ),
    observacion: text(raw.observacion ?? raw.observaciones ?? raw.notes ?? raw.nota ?? ''),
    monto: toNumber(raw.monto ?? raw.total ?? raw.amount ?? raw.precio),
    puntos: toNumber(raw.puntos ?? raw.points),
    tipo: text(raw.tipo ?? raw.type ?? 'HISTORIAL'),
    imageUrl: text(raw.imageUrl ?? raw.imagenUrl ?? ''),
    items,
    raw,
  };
}

function normalizeCutHistoryItem(raw = {}) {
  const cutName = text(
    raw.cutName ??
      raw.cutType ??
      raw.serviceName ??
      raw.servicio ??
      raw.corte ??
      raw.name ??
      ''
  ).trim();

  const cutDescription = text(
    raw.cutDescription ??
      raw.cutDetail ??
      raw.description ??
      raw.descripcion ??
      raw.detail ??
      ''
  ).trim();

  return {
    id: toNumber(raw.id ?? raw.customerCutHistoryId ?? raw.historyId),
    fecha: text(raw.fechaCorte ?? raw.createdAt ?? raw.fecha ?? raw.date ?? ''),
    nombre: cutName || cutDescription || 'Corte sin detalle',
    descripcion: cutDescription,
    observacion: text(
      raw.observations ??
        raw.cutObservations ??
        raw.observacion ??
        raw.observaciones ??
        raw.notes ??
        ''
    ).trim(),
    barbero: text(
      raw.barberUserName ??
        raw.barberName ??
        raw.barbero ??
        raw.barber ??
        'Sin asignar'
    ).trim(),
    sede: text(raw.branchName ?? raw.sede ?? raw.branch ?? '').trim(),
    raw,
  };
}

async function tryRequest(path, options) {
  try {
    return await apiRequest(path, options);
  } catch (error) {
    return { __error: error };
  }
}

export async function getOwnerCustomers({ query = '', limit = 50 } = {}) {
  const q = String(query || '').trim();

  const first = await tryRequest(
    `/api/owner/customers${toQuery({
      q: q.length >= 2 ? q : '',
      limit,
    })}`
  );

  if (!first.__error) {
    return extractList(first).map(normalizeCustomer);
  }

  const second = await tryRequest(`/api/customers${toQuery({ limit })}`);

  if (!second.__error) {
    return extractList(second).map(normalizeCustomer);
  }

  return [];
}

export async function searchOwnerCustomers(query) {
  return getOwnerCustomers({ query, limit: 20 });
}

export async function createOwnerCustomer({
  nombres,
  apellidos = null,
  telefono,
  email = null,
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
      email:
        email && String(email).trim()
          ? String(email).trim()
          : null,
    }),
  });

  return normalizeCustomer(data);
}

export async function updateOwnerCustomer({
  customerId,
  nombres = null,
  apellidos = null,
  telefono = null,
  email = null,
}) {
  const payload = {
    nombres,
    apellidos,
    telefono:
      telefono !== null && telefono !== undefined
        ? String(telefono).replace(/[^0-9]/g, '')
        : null,
    email,
  };

  const first = await tryRequest(`/api/owner/customers/${customerId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  if (!first.__error) return normalizeCustomer(first);

  const second = await tryRequest(`/api/customers/${customerId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  if (!second.__error) return normalizeCustomer(second);

  throw first.__error || second.__error || new Error('No se pudo actualizar el cliente.');
}

export async function getOwnerCustomerDetail(customerId) {
  const first = await tryRequest(`/api/owner/customers/${customerId}`);

  if (!first.__error) return normalizeCustomer(first);

  const second = await tryRequest(`/api/customers/${customerId}`);

  if (!second.__error) return normalizeCustomer(second);

  return null;
}

export async function getOwnerCustomerHistory(customerId) {
  const endpoints = [
    `/api/owner/customers/${customerId}/history${toQuery({ limit: 10 })}`,
    `/api/owner/customers/${customerId}/cuts`,
    `/api/owner/customer-cut-history${toQuery({ customerId })}`,
    `/api/customer-cut-history${toQuery({ customerId })}`,
    `/api/owner/cash-sales/customer/${customerId}`,
  ];

  let emptyResult = [];

  for (const endpoint of endpoints) {
    const data = await tryRequest(endpoint);

    if (!data.__error) {
      const items = extractList(data).map(normalizeHistoryItem);
      if (items.length > 0) return items;
      emptyResult = items;
    }
  }

  return emptyResult;
}

export async function getOwnerCustomerCutHistory(customerId) {
  const endpoints = [
    `/api/owner/customers/${customerId}/cut-history${toQuery({ limit: 20 })}`,
    `/api/owner/customers/${customerId}/cuts`,
    `/api/owner/customer-cut-history${toQuery({ customerId })}`,
    `/api/customer-cut-history${toQuery({ customerId })}`,
  ];

  let emptyResult = [];

  for (const endpoint of endpoints) {
    const data = await tryRequest(endpoint);

    if (!data.__error) {
      const items = extractList(data).map(normalizeCutHistoryItem);
      if (items.length > 0) return items;
      emptyResult = items;
    }
  }

  return emptyResult;
}

export async function getOwnerCustomerLoyalty(customerId) {
  const endpoints = [
    `/api/owner/customers/${customerId}/loyalty`,
    `/api/owner/loyalty/customers/${customerId}`,
    `/api/loyalty/customers/${customerId}`,
  ];

  for (const endpoint of endpoints) {
    const data = await tryRequest(endpoint);

    if (!data.__error) {
      return {
        puntosDisponibles: toNumber(
          data.puntosDisponibles ??
            data.pointsAvailable ??
            data.availablePoints ??
            data.puntos
        ),
        puntosAcumulados: toNumber(
          data.puntosAcumulados ??
            data.pointsEarned ??
            data.totalPoints ??
            data.accumulatedPoints
        ),
        customerStatus: String(data.customerStatus ?? data.status ?? "NEW").toUpperCase(),
        completedVisits: toNumber(data.completedVisits ?? data.visits),
        noShows: toNumber(data.noShows),
        lastVisit: data.lastVisit ? String(data.lastVisit) : null,
        raw: data,
      };
    }
  }

  return null;
}

function normalizeInactiveCustomer(raw = {}) {
    return {
      id: toNumber(raw.customerId ?? raw.id),
      customerId: toNumber(raw.customerId ?? raw.id),
      nombre: text(raw.nombre ?? raw.name ?? raw.nombreCompleto ?? 'Cliente'),
      telefono: text(raw.telefono ?? raw.phone ?? raw.phoneNumber ?? ''),
      ultimaVisita: text(raw.ultimaVisita ?? raw.lastVisit ?? raw.lastVisitDate ?? ''),
      raw,
    };
  }
  
  export async function getInactiveOwnerCustomers(days = 30) {
    const data = await apiRequest(
      `/api/owner/customers/inactive${toQuery({ days })}`
    );
  
    return extractList(data).map(normalizeInactiveCustomer);
  }
  
  export function buildCustomerWhatsappUrl({
    telefono,
    nombre,
    businessName = 'tu barbería',
    message = '',
  }) {
    const cleanPhone = String(telefono || '').replace(/[^0-9]/g, '');
  
    if (!cleanPhone) return '';
  
    const phoneWithCountry = cleanPhone.startsWith('51')
      ? cleanPhone
      : `51${cleanPhone}`;
  
    const text = encodeURIComponent(
      message ||
        `Hola ${nombre || ''} 👋 somos ${businessName}.\n\n` +
          `Hace tiempo no te vemos por aquí y queríamos invitarte a volver.\n\n` +
          `Tenemos una atención especial para ti esta semana. Puedes reservar tu cita cuando gustes.`
    );
  
    return `https://wa.me/${phoneWithCountry}?text=${text}`;
  }

export async function downloadOwnerCustomersExcel() {
  const response = await fetch(`${getApiBaseUrl()}/api/owner/customers/export.xlsx`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!response.ok) {
    let message = 'No se pudo generar el Excel de clientes.';
    try { const data = await response.json(); message = data.message || data.error || message; } catch {}
    throw new Error(message);
  }
  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const match = disposition.match(/filename=\"?([^\";]+)\"?/i);
  return { blob, filename: match?.[1] || `clientes-${new Date().toISOString().slice(0, 10)}.xlsx` };
}

export async function getOwnerCustomersTotal() {
  const data = await apiRequest('/api/owner/customers/export-count');
  return Number(data?.total || 0);
}
