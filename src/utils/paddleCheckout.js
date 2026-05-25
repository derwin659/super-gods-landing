const PADDLE_SCRIPT_URL = 'https://cdn.paddle.com/paddle/v2/paddle.js';

let scriptPromise = null;
let initialized = false;

function loadPaddleScript() {
  if (window.Paddle) return Promise.resolve(window.Paddle);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = PADDLE_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(window.Paddle);
    script.onerror = () => reject(new Error('No se pudo cargar Paddle.js.'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export async function openPaddleCheckout({
  priceId,
  tenantId,
  plan,
  billingCycle,
  currency,
}) {
  const token = import.meta.env.VITE_PADDLE_CLIENT_TOKEN || '';
  const environment = String(import.meta.env.VITE_PADDLE_ENV || 'sandbox').toLowerCase();

  if (!token.trim()) {
    throw new Error('Falta configurar VITE_PADDLE_CLIENT_TOKEN en la web.');
  }

  const Paddle = await loadPaddleScript();
  if (!Paddle) throw new Error('Paddle.js no está disponible.');

  if (!initialized) {
    if (environment === 'sandbox' && Paddle.Environment?.set) {
      Paddle.Environment.set('sandbox');
    }

    Paddle.Initialize({
      token,
    });

    initialized = true;
  }

  Paddle.Checkout.open({
    settings: {
      displayMode: 'overlay',
      theme: 'light',
      variant: 'one-page',
    },
    items: [
      {
        priceId,
        quantity: 1,
      },
    ],
    customData: {
      tenantId: String(tenantId || ''),
      plan: String(plan || ''),
      billingCycle: String(billingCycle || ''),
      currency: String(currency || ''),
    },
  });
}
