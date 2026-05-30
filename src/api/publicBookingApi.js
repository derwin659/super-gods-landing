const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://gods-saas-backend-production.up.railway.app';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      data?.detail ||
      `Error ${response.status}`;
    throw new Error(message);
  }

  return data;
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.set(key, String(value));
    }
  });

  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export function getPublicBookingBootstrap(codigoNegocio, params = {}) {
  return request(
    `/api/public/booking/${encodeURIComponent(codigoNegocio)}/bootstrap${buildQuery(params)}`
  );
}

export function getPublicBookingLinkInfo(codigoNegocio, params = {}) {
  return request(
    `/api/public/booking/${encodeURIComponent(codigoNegocio)}/link-info${buildQuery(params)}`
  );
}

export function getPublicBookingAvailability(codigoNegocio, params = {}) {
  return request(
    `/api/public/booking/${encodeURIComponent(codigoNegocio)}/availability${buildQuery(params)}`
  );
}

export function createPublicBookingAppointment(codigoNegocio, payload) {
  return request(
    `/api/public/booking/${encodeURIComponent(codigoNegocio)}/appointments`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}
