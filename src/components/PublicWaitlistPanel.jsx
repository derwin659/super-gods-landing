import { useEffect, useState } from 'react';
import InternationalPhoneField from './InternationalPhoneField';
import { parsePhoneValue } from '../utils/internationalPhone';
import { waitlistRequest } from '../api/waitlistApi';

export default function PublicWaitlistPanel(props) {
  const [open, setOpen] = useState(false);
  return <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-slate-950">
    <button type="button" aria-expanded={open} onClick={() => setOpen(v => !v)} className="min-h-12 font-black underline underline-offset-4">{open ? 'Cerrar lista de espera' : '¿No encuentras tu horario? Entrar en lista de espera'}</button>
    {open && <WaitlistForm {...props} />}
  </section>;
}
function WaitlistForm({ businessCode, branchId, serviceIds, barberId, date, country, onChoose }) {
  const [phone, setPhone] = useState('');
  const [newCustomer, setNewCustomer] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [access, setAccess] = useState(null);
  const [code, setCode] = useState('');
  const [token, setToken] = useState(''); // Memory only; never replaces the owner's web session.
  const [rows, setRows] = useState([]);
  const [from, setFrom] = useState('09:00');
  const [until, setUntil] = useState('18:00');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(v => v - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  useEffect(() => {
    if (!token) return;
    let controller;
    let disposed = false;
    const load = async () => {
      if (document.hidden) return;
      controller?.abort(); controller = new AbortController();
      const current = controller;
      try {
        const result = await waitlistRequest('/api/clients/booking/waitlist', { token, signal: current.signal });
        if (!disposed && !current.signal.aborted) { setRows(Array.isArray(result) ? result : []); setError(''); }
      } catch (e) { if (!disposed && !current.signal.aborted && e.name !== 'AbortError') setError(e.message); }
    };
    load();
    const timer = setInterval(load, 30000);
    document.addEventListener('visibilitychange', load);
    return () => { disposed = true; controller?.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', load); };
  }, [token]);
  async function perform(action) {
    setBusy(true); setError(''); setNotice('');
    try { await action(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  const sendCode = () => perform(async () => {
    if (!phone.startsWith('+') || !parsePhoneValue(phone).isValid) throw new Error('Selecciona el país e ingresa un celular válido.');
    if (newCustomer) {
      if (!firstName.trim() || !acceptedTerms) throw new Error('Completa tu nombre y acepta las condiciones para crear tu cuenta.');
      await waitlistRequest(`/api/public/booking/${encodeURIComponent(businessCode)}/waitlist/register`, { method: 'POST', body: { phone, firstName: firstName.trim(), lastName: lastName.trim(), locale: 'es', acceptedTerms } });
      setNewCustomer(false);
    }    const result = await waitlistRequest(`/api/public/booking/${encodeURIComponent(businessCode)}/waitlist/access`, { method: 'POST', body: { phone, locale: 'es' } });
    setAccess(result); setCode(''); setCooldown(60); setNotice(`Código enviado por ${result.channel || 'el canal de verificación'}.`);
  });
  const verify = () => perform(async () => {
    const result = await waitlistRequest('/api/auth/cliente/otp/verify', { method: 'POST', body: { otpId: access.otpId, code } });
    if (String(result.tenantId) !== String(access.tenantId) || result.role !== 'CLIENT' || !result.token) throw new Error('La verificación no corresponde a este negocio.');
    setToken(result.token); setNotice('Teléfono verificado. Elige tu franja y confirma la solicitud.');
  });
  const join = () => perform(async () => {
    if (!branchId || serviceIds.length !== 1 || !date || !from || !until || from >= until) throw new Error('Selecciona una sede, un solo servicio, fecha y una franja válida.');
    const result = await waitlistRequest('/api/clients/booking/waitlist', { token, method: 'POST', body: { branchId: Number(branchId), serviceId: Number(serviceIds[0]), barberId: barberId ? Number(barberId) : null, date, earliestTime: from, latestTime: until } });
    setRows(previous => [result, ...previous.filter(row => row.id !== result.id)]);
    setNotice('Solicitud guardada. Puedes revisar el estado aquí o en tu app SuperGods.');
  });
  return <div className="mt-3 space-y-4">
    <p className="text-sm">La solicitud no reserva ni cobra una cita. Revisamos espacios para un servicio a la vez. Mantén esta sección abierta para ver los avisos; si usas la app con notificaciones habilitadas, también puedes recibirlos allí. No se envían avisos por WhatsApp.</p>
    {!token ? <>
      <p className="text-sm">Verifica tu celular para guardar y revisar tus solicitudes. Si eres nuevo en este negocio, puedes crear tu cuenta aquí.</p>
      <button type="button" disabled={busy} onClick={() => { setNewCustomer(v => !v); setAccess(null); setCode(''); setError(''); }} className="min-h-12 font-bold underline">{newCustomer ? 'Ya tengo cuenta en este negocio' : 'Soy nuevo: crear mi cuenta'}</button>
      {newCustomer && <div className="space-y-3">
        <label className="block font-bold">Nombre<input value={firstName} maxLength={100} onChange={e => setFirstName(e.target.value)} autoComplete="given-name" className="mt-1 block min-h-12 w-full rounded-xl border bg-white px-3" /></label>
        <label className="block font-bold">Apellido (opcional)<input value={lastName} maxLength={100} onChange={e => setLastName(e.target.value)} autoComplete="family-name" className="mt-1 block min-h-12 w-full rounded-xl border bg-white px-3" /></label>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} className="mt-1 size-5" /><span>Quiero crear mi cuenta en este negocio y acepto los <a href="/terms" target="_blank" rel="noreferrer" className="underline">términos</a> y la <a href="/privacy" target="_blank" rel="noreferrer" className="underline">política de privacidad</a>. Después verificaré mi celular.</span></label>
      </div>}      <InternationalPhoneField value={phone} onChange={value => { setPhone(value); setAccess(null); setCode(''); }} defaultCountry={country || 'PE'} disabled={busy} />
      <button type="button" disabled={busy || cooldown > 0} onClick={sendCode} className="min-h-12 rounded-xl border border-slate-400 bg-white px-4 font-bold disabled:opacity-50">{cooldown ? `Reenviar en ${cooldown}s` : newCustomer ? 'Crear cuenta y enviar código' : 'Enviar código de verificación'}</button>
      {access && <div className="flex flex-wrap items-end gap-3"><label className="block text-sm font-bold">Código recibido<input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" autoComplete="one-time-code" className="mt-1 block min-h-12 rounded-xl border border-slate-400 bg-white px-3 text-slate-950" /></label><button type="button" disabled={busy || code.length < 4} onClick={verify} className="min-h-12 rounded-xl bg-slate-950 px-4 font-bold text-white disabled:opacity-50">Verificar teléfono</button></div>}
    </> : <>
      <button type="button" disabled={busy} onClick={() => { setToken(''); setRows([]); setAccess(null); setCode(''); setNotice(''); setError(''); }} className="min-h-12 text-sm underline">Cerrar verificación / cambiar teléfono</button>
      <p className="text-sm font-bold">Fecha solicitada: {date} · se usará la sede y el profesional seleccionados arriba.</p>
      <div className="flex flex-wrap gap-3"><label className="font-bold">Desde<input aria-label="Desde" type="time" value={from} onChange={e => setFrom(e.target.value)} className="ml-2 min-h-12 rounded-xl border bg-white px-3" /></label><label className="font-bold">Hasta<input aria-label="Hasta" type="time" value={until} onChange={e => setUntil(e.target.value)} className="ml-2 min-h-12 rounded-xl border bg-white px-3" /></label></div>
      {serviceIds.length !== 1 && <p role="status">Selecciona un solo servicio para entrar en la lista de espera.</p>}
      <button type="button" disabled={busy || !branchId || serviceIds.length !== 1 || !date || !from || !until || from >= until} onClick={join} className="min-h-12 rounded-xl bg-slate-950 px-4 font-bold text-white disabled:opacity-50">Avisarme si hay un horario</button>
      <p className="text-xs">El estado se actualiza cada 30 segundos mientras esta página esté visible.</p>
      {rows.filter(row => String(row.branchId) === String(branchId) && row.date === date && serviceIds.length === 1 && String(row.serviceId) === String(serviceIds[0]) && String(row.barberId || '') === String(barberId || '')).map(row => {
        const available = row.status === 'AVAILABLE' && new Date(row.offerExpiresAt) > new Date();
        return <article key={row.id} className="rounded-xl border bg-white p-4">
          <p className="font-bold">{row.serviceName} · {row.date}</p><p>{String(row.earliestTime).slice(0, 5)}–{String(row.latestTime).slice(0, 5)}</p>
          <p role="status">{available ? `Hay un espacio a las ${String(row.offeredTime).slice(0, 5)}. Revisa y confirma: no está apartado.` : row.status === 'WAITING' ? 'Buscando disponibilidad' : row.status === 'CANCELLED' ? 'Solicitud retirada' : 'Aviso o solicitud vencidos'}</p>
          {available && <button type="button" onClick={() => onChoose(row)} className="mt-2 min-h-12 font-bold underline">Revisar horario y reservar</button>}
          {['WAITING', 'AVAILABLE'].includes(row.status) && <button type="button" disabled={busy} className="ml-4 min-h-12 underline" onClick={() => perform(async () => { await waitlistRequest(`/api/clients/booking/waitlist/${row.id}`, { token, method: 'DELETE' }); setRows(old => old.map(r => r.id === row.id ? { ...r, status: 'CANCELLED' } : r)); })}>Retirar solicitud</button>}
        </article>;
      })}
    </>}
    {busy && <p role="status">Procesando…</p>}{notice && <p role="status" className="text-sm font-bold text-green-800">{notice}</p>}{error && <p role="alert" className="text-sm font-bold text-red-700">{error}</p>}
  </div>;
}
