const META_ORIGINS = new Set(['https://www.facebook.com', 'https://web.facebook.com', 'https://business.facebook.com']);
export function parseSignupEvent(event) {
  if (!META_ORIGINS.has(event.origin)) return null;
  let message;
  try { message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data; } catch { return null; }
  if (!message || message.type !== 'WA_EMBEDDED_SIGNUP') return null;
  if (message.event === 'CANCEL' || message.event === 'ERROR') return { event: message.event };
  if (message.event !== 'FINISH') return null;
  const wabaId = String(message.data?.waba_id || '');
  const phoneNumberId = String(message.data?.phone_number_id || '');
  if (!/^[0-9]{5,30}$/.test(wabaId) || !/^[0-9]{5,30}$/.test(phoneNumberId)) return null;
  return { event: 'FINISH', wabaId, phoneNumberId };
}
let sdkPromise;
export function loadMetaSignupSdk(appId, graphVersion) {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    function initialize() {
      if (!window.FB) { reject(new Error('No se pudo abrir Meta. Comprueba tu conexión y vuelve a intentarlo.')); return; }
      window.FB.init({ appId, version: graphVersion, xfbml: false, cookie: true });
      resolve(window.FB);
    }
    if (window.FB) { initialize(); return; }
    const script = document.createElement('script');
    script.id = 'supergods-meta-signup-sdk'; script.src = 'https://connect.facebook.net/es_LA/sdk.js';
    script.async = true; script.defer = true; script.crossOrigin = 'anonymous'; script.onload = initialize;
    script.onerror = () => { sdkPromise = undefined; reject(new Error('No se pudo cargar Meta. Revisa los bloqueadores del navegador.')); };
    document.head.appendChild(script);
  });
  return sdkPromise;
}
