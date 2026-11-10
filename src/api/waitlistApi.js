const BASE = import.meta.env?.VITE_API_BASE_URL || 'https://gods-saas-backend-production.up.railway.app';
export async function waitlistRequest(path, { token, body, method = 'GET', signal } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method, signal, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.reason || data?.detail || data?.message;
    throw new Error(response.status === 503 ? 'La lista de espera aún no está habilitada.' :
      typeof message === 'string' && message.length < 240 && !/JDBC|SQL|exception/i.test(message) ? message :
      'No se pudo completar la solicitud. Comprueba tu conexión e inténtalo otra vez.');
  }
  return data;
}
