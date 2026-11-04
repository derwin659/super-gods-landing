import { useEffect, useRef, useState } from 'react';
import { claimWhatsappOnboarding, completeWhatsappOnboarding, statusWhatsappOnboarding } from '../../api/whatsappOnboardingApi';
import { loadMetaSignupSdk, parseSignupEvent } from '../../utils/whatsappEmbeddedSignup';

export default function WhatsappConnectPage() {
  const ticket = useRef(new URLSearchParams(window.location.hash.slice(1)).get('ticket') || '');
  const claim = useRef(null);
  const authorization = useRef({});
  const pending = useRef(false);
  const loginCallback = useRef(() => {});
  const activeLogin = useRef(false);
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    if (!/^[A-Za-z0-9_-]{43}$/.test(ticket.current)) { setError('Abre esta conexión desde la configuración de WhatsApp de SuperGods.'); return undefined; }
    if (!claim.current) claim.current = claimWhatsappOnboarding(ticket.current);
    claim.current.then(async (data) => {
      if (!active) return;
      setSession(data);
      await loadMetaSignupSdk(data.appId, data.graphVersion);
      if (active) setReady(true);
      const state = await statusWhatsappOnboarding(data.sessionToken);
      if (active && !['RESERVED', 'NOT_STARTED', 'ERROR'].includes(state.state)) setResult(state);
    }).catch((failure) => { if (active) setError(failure.message); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!session) return undefined;
    let mounted = true;
    async function completeIfReady() {
      const data = authorization.current;
      if (pending.current || !data.code || !data.wabaId || !data.phoneNumberId) return;
      pending.current = true; setBusy(true); setError('');
      try { const state = await completeWhatsappOnboarding(session.sessionToken, { code: data.code, wabaId: data.wabaId, phoneNumberId: data.phoneNumberId }); if (mounted) setResult(state); }
      catch (failure) { if (mounted) setError(failure.message); }
      finally { authorization.current = {}; activeLogin.current = false; pending.current = false; if (mounted) setBusy(false); }
    }
    const listener = (event) => {
      if (!activeLogin.current) return;
      const data = parseSignupEvent(event);
      if (!data) return;
      if (data.event === 'FINISH') { authorization.current = { ...authorization.current, ...data }; completeIfReady(); }
      else { activeLogin.current = false; authorization.current = {}; setBusy(false); setError(data.event === 'CANCEL' ? 'Cancelaste la autorización. Puedes volver a intentarlo.' : 'Meta no completó la autorización. Revisa los datos de tu negocio en su ventana oficial.'); }
    };
    window.addEventListener('message', listener);
    const timer = window.setInterval(() => { if (activeLogin.current && Date.now() - (authorization.current.startedAt || 0) > 300000) { activeLogin.current = false; authorization.current = {}; setBusy(false); setError('La autorización tardó demasiado. Abre de nuevo la ventana de Meta.'); } }, 5000);
    loginCallback.current = (response) => {
      if (!mounted || !activeLogin.current) return;
      const code = response?.authResponse?.code;
      if (code) { authorization.current = { ...authorization.current, code }; completeIfReady(); }
      else { activeLogin.current = false; authorization.current = {}; setBusy(false); setError('Meta no devolvió la autorización. Puedes volver a conectar tu WhatsApp.'); }
    };
    return () => { mounted = false; window.removeEventListener('message', listener); window.clearInterval(timer); loginCallback.current = () => {}; };
  }, [session]);
  useEffect(() => {
    if (!session || !result || result.connected || !['PENDING', 'PROVISIONING', 'REGISTERING', 'OFFLINE'].includes(result.state)) return undefined;
    let active = true; let inFlight = false;
    const timer = window.setInterval(async () => {
      if (inFlight) return;
      inFlight = true;
      try { const state = await statusWhatsappOnboarding(session.sessionToken); if (active) setResult(state); }
      catch (failure) { if (active) { setError(failure.message); setResult((current) => ({ ...current, state: 'EXPIRED' })); } }
      finally { inFlight = false; }
    }, 6000);
    return () => { active = false; window.clearInterval(timer); };
  }, [session, result?.state, result?.connected]);
  function connect() {
    if (!ready || busy || !session) return;
    authorization.current = { startedAt: Date.now() }; activeLogin.current = true; setBusy(true); setError('');
    try {
      // Keep FB.login synchronous in the user's click so browsers can open the official popup.
      window.FB.login((response) => loginCallback.current(response), {
        config_id: session.configId, auth_type: 'rerequest', response_type: 'code', override_default_response_type: true,
        extras: { setup: { solutionID: session.solutionId } },
      });
    } catch { activeLogin.current = false; setBusy(false); setError('No se pudo abrir Meta. Permite las ventanas emergentes y vuelve a intentarlo.'); }
  }
  const canConnect = !result || ['ERROR', 'RESERVED', 'NOT_STARTED'].includes(result.state);
  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-12 text-white">
      <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-neutral-900 p-6 shadow-xl">
        <p className="text-sm font-bold text-emerald-300">SuperGods · WhatsApp del negocio</p>
        <h1 className="mt-3 text-3xl font-black">Conecta tu WhatsApp</h1>
        <p className="mt-4 leading-7 text-neutral-300">Autoriza la conexión en la ventana oficial de Meta. Tu contraseña y el código de verificación se ingresan allí; SuperGods no te los pedirá.</p>
        {session && <p className="mt-4 rounded-xl bg-white/5 p-3 font-bold">Número a conectar: {session.phone}</p>}
        <p className="mt-4 text-sm leading-6 text-neutral-400">Si ya usas este número en WhatsApp Business, revisa las condiciones que muestre Meta antes de aceptar una migración o desconexión.</p>
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-950 p-4 text-red-100">{error}</p>}
        {result && <p role="status" className="mt-4 rounded-xl bg-emerald-950 p-4 text-emerald-100">{result.message}</p>}
        {canConnect && <button type="button" onClick={connect} disabled={!ready || busy} className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-4 font-bold disabled:opacity-50">{busy ? 'Completando conexión…' : ready ? 'Continuar con Facebook' : error ? 'Conexión no disponible' : 'Preparando conexión…'}</button>}
        {result?.connected && <p className="mt-5 text-sm text-neutral-300">Ya puedes cerrar esta pestaña y volver a SuperGods. Actualiza la configuración para ver tu enlace de reservas.</p>}
        <p className="mt-5 text-xs text-neutral-500">Este enlace es temporal y solo sirve para conectar el WhatsApp de tu negocio.</p>
      </section>
    </main>
  );
}
