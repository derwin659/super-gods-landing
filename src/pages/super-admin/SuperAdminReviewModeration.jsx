import { useEffect, useState } from 'react';
import { CheckCircle2, EyeOff, Flag, RefreshCw, RotateCcw, ShieldAlert, Star } from 'lucide-react';
import { superAdminApi } from '../../api/superAdminApi';

const reasonLabels = { OFFENSIVE: 'Lenguaje ofensivo', PERSONAL_DATA: 'Datos personales', FALSE_CONTENT: 'Contenido presuntamente falso', SPAM: 'Spam o publicidad', OTHER: 'Otro motivo' };
const statusLabels = { PENDING_REVIEW: 'En revisión', HIDDEN: 'Oculta', PUBLISHED: 'Publicada' };

export default function SuperAdminReviewModeration() {
  const [data, setData] = useState({ total: 0, reviews: [] });
  const [status, setStatus] = useState('PENDING_REVIEW');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [decision, setDecision] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true); setError('');
    try { setData(await superAdminApi.getReviewModeration(status)); }
    catch (e) { setError(e.message || 'No se pudo cargar la cola de moderación.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [status]);

  async function confirmDecision() {
    if (!decision || !note.trim()) return;
    setSaving(true); setError('');
    try {
      await superAdminApi.moderateReview(decision.review.reviewId, decision.status, note.trim());
      setDecision(null); setNote(''); await load();
    } catch (e) { setError(e.message || 'No se pudo guardar la decisión.'); }
    finally { setSaving(false); }
  }

  return <div className="space-y-6">
    <header className="rounded-[2rem] bg-[#111111] p-6 text-white shadow-xl">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.2em] text-[#D6A354]">Confianza y seguridad</p><h1 className="mt-2 text-3xl font-black">Moderación de reseñas</h1><p className="mt-2 max-w-2xl text-sm font-bold text-white/65">Revisa reportes sin permitir que los negocios eliminen críticas por su cuenta.</p></div><button onClick={load} className="rounded-2xl bg-white/10 p-3 hover:bg-white/20"><RefreshCw className={loading ? 'animate-spin' : ''} /></button></div>
    </header>

    <div className="flex gap-2 overflow-x-auto">{['PENDING_REVIEW', 'HIDDEN', 'PUBLISHED'].map((value) => <button key={value} onClick={() => setStatus(value)} className={`whitespace-nowrap rounded-2xl px-4 py-2.5 text-sm font-black ${status === value ? 'bg-[#111111] text-white' : 'border border-[#E2D5C4] bg-white text-[#746A5D]'}`}>{statusLabels[value]}</button>)}</div>
    {error && <div className="rounded-2xl bg-red-50 p-4 font-bold text-red-700">{error}</div>}
    {!loading && !data.reviews?.length && <div className="rounded-[2rem] border border-dashed border-[#D5C7B5] bg-white p-12 text-center"><ShieldAlert className="mx-auto text-[#A4937E]" size={34} /><p className="mt-3 font-black">No hay reseñas en este estado</p></div>}

    <section className="grid gap-4 xl:grid-cols-2">{data.reviews?.map((review) => <article key={review.reviewId} className="rounded-[1.75rem] border border-[#E2D5C4] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-[#A56B18]">{review.tenantName}</p><h2 className="mt-1 text-lg font-black">{review.branchName}</h2><p className="text-xs font-bold text-[#746A5D]">{review.customerName} · {new Date(review.createdAt).toLocaleDateString()}</p></div><span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">{statusLabels[review.moderationStatus] || review.moderationStatus}</span></div>
      <div className="mt-3 flex gap-1">{[1,2,3,4,5].map((star) => <Star key={star} size={17} className={star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />)}</div>
      <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-[#F8F5EF] p-4 text-sm font-bold leading-6 text-slate-700">{review.comment || 'Sin comentario escrito.'}</p>
      {review.reportedAt && <div className="mt-3 rounded-2xl border border-red-100 bg-red-50 p-4"><p className="flex items-center gap-2 text-xs font-black uppercase text-red-700"><Flag size={14} />{reasonLabels[review.reportReason] || review.reportReason}</p><p className="mt-2 text-sm font-semibold text-red-900">{review.reportDetails || 'Sin detalle adicional.'}</p><p className="mt-2 text-[11px] font-bold text-red-500">Reportada el {new Date(review.reportedAt).toLocaleString()}</p></div>}
      {review.moderationNote && <p className="mt-3 text-xs font-bold text-slate-500">Última decisión: {review.moderationNote}</p>}
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {review.moderationStatus !== 'PUBLISHED' && <button onClick={() => { setDecision({ review, status: 'PUBLISHED', label: 'Publicar reseña' }); setNote(''); }} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white"><CheckCircle2 size={16} />Publicar</button>}
        {review.moderationStatus === 'PENDING_REVIEW' && <button onClick={() => { setDecision({ review, status: 'PUBLISHED', label: 'Mantener publicada' }); setNote(''); }} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-black text-slate-700"><RotateCcw size={16} />Mantener</button>}
        {review.moderationStatus !== 'HIDDEN' && <button onClick={() => { setDecision({ review, status: 'HIDDEN', label: 'Ocultar reseña' }); setNote(''); }} className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-sm font-black text-white"><EyeOff size={16} />Ocultar</button>}
      </div>
    </article>)}</section>

    {decision && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl"><p className="text-xs font-black uppercase tracking-[.18em] text-[#A56B18]">Decisión auditada</p><h2 className="mt-2 text-2xl font-black">{decision.label}</h2><p className="mt-2 text-sm font-semibold text-slate-600">La nota será interna y permitirá justificar futuras revisiones.</p><textarea autoFocus rows={4} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold" placeholder="Explica por qué tomas esta decisión…" /><div className="mt-4 flex justify-end gap-2"><button onClick={() => setDecision(null)} className="rounded-xl border border-slate-300 px-4 py-2 font-black">Cancelar</button><button onClick={confirmDecision} disabled={saving || !note.trim()} className="rounded-xl bg-[#111111] px-4 py-2 font-black text-white disabled:opacity-50">{saving ? 'Guardando…' : 'Confirmar decisión'}</button></div></div></div>}
  </div>;
}