import { useEffect, useState } from 'react';
import { apiRequest } from '../api/apiClient';

function Requests({ branchId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let controller;
    let disposed = false;
    const load = async () => {
      if (document.hidden) return;
      controller?.abort();
      controller = new AbortController();
      const current = controller;
      try {
        const data = await apiRequest(`/api/owner/booking-waitlist?branchId=${encodeURIComponent(branchId)}`, { signal: current.signal });
        if (!disposed && !current.signal.aborted) { setRows(Array.isArray(data) ? data : []); setError(''); }
      } catch {
        if (!disposed && !current.signal.aborted) setError('No se pudo cargar la lista. Comprueba que esté habilitada e inténtalo nuevamente.');
      } finally { if (!disposed && !current.signal.aborted) setLoading(false); }
    };
    load();
    const timer = setInterval(load, 30000);
    document.addEventListener('visibilitychange', load);
    return () => { disposed = true; controller?.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', load); };  }, [branchId, revision]);
  return <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5 text-neutral-950">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-black">Clientes buscando un espacio</h2><button type="button" disabled={loading} onClick={() => { setLoading(true); setError(''); setRevision(v => v + 1); }} className="rounded-xl border px-4 py-2 font-bold disabled:opacity-50">Actualizar solicitudes</button></div>
    <p className="mt-2 text-sm text-neutral-600">Los avisos no apartan horarios. La reserva se confirma en el flujo habitual, con disponibilidad y adelantos vigentes.</p>
    <p className="mt-2 text-xs text-neutral-500">Actualización automática cada 30 segundos mientras esta pantalla esté visible.</p>
    {loading && <p role="status" className="mt-4">Cargando solicitudes…</p>}
    {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
    {!loading && !error && rows.length === 0 && <p className="mt-4">No hay solicitudes activas en esta sede.</p>}
    {!error && rows.map(row => <article key={row.id} className="mt-3 rounded-xl bg-neutral-50 p-4">
      <p className="font-bold">{row.customerName} · {row.serviceName}</p>
      <p className="text-sm">{row.date} · {String(row.earliestTime).slice(0, 5)}–{String(row.latestTime).slice(0, 5)}</p>
      <p className="text-sm text-neutral-600">{row.status === 'AVAILABLE' ? `Aviso de disponibilidad: ${String(row.offeredTime).slice(0, 5)}` : row.status === 'EXPIRED' ? 'Aviso vencido' : 'Buscando disponibilidad'}</p>
    </article>)}
  </div>;
}
export default function OwnerWaitlistPanel({ branchId }) {
 const [open, setOpen] = useState(false);
 return <section className="my-4"><button type="button" disabled={!branchId} aria-expanded={open} onClick={() => setOpen(v => !v)} className="rounded-2xl border border-neutral-300 bg-white px-5 py-3 font-bold text-neutral-950 disabled:opacity-50">{open ? 'Ocultar lista de espera' : 'Ver lista de espera'}</button>{open && branchId && <Requests key={branchId} branchId={branchId} />}</section>;
}
