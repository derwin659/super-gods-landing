import { useEffect, useState } from 'react';
import { apiRequest } from '../api/apiClient';

function Requests({ branchId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    apiRequest(`/api/owner/booking-waitlist?branchId=${encodeURIComponent(branchId)}`, { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setRows(Array.isArray(data) ? data : []); })
      .catch(() => { if (!controller.signal.aborted) setError('No se pudo cargar la lista. Comprueba que esté habilitada e inténtalo nuevamente.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [branchId, revision]);
  return <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5 text-neutral-950">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-black">Clientes buscando un espacio</h2><button type="button" disabled={loading} onClick={() => { setLoading(true); setError(''); setRevision(v => v + 1); }} className="rounded-xl border px-4 py-2 font-bold disabled:opacity-50">Actualizar solicitudes</button></div>
    <p className="mt-2 text-sm text-neutral-600">Los avisos no apartan horarios. La reserva se confirma en el flujo habitual, con disponibilidad y adelantos vigentes.</p>
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
