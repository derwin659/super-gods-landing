import { useEffect, useState } from 'react';
import { MessageSquareReply, MessageSquareText, Pencil, RefreshCw, Send, ShieldCheck, Star } from 'lucide-react';
import { getOwnerReviews, replyOwnerReview } from '../../api/ownerReviewsApi';

function Stars({ value }) {
  return <div className="flex gap-0.5" aria-label={`${value} de 5 estrellas`}>
    {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={17} className={star <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />)}
  </div>;
}

export default function OwnerReviewsPage() {
  const [data, setData] = useState({ average: 0, total: 0, distribution: {}, reviews: [] });
  const [rating, setRating] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [savingReviewId, setSavingReviewId] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setData(await getOwnerReviews({ rating: rating || null }));
    } catch (e) {
      setError(e.message || 'No se pudieron cargar las reseñas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [rating]);

  function startReply(review) {
    setEditingReviewId(review.reviewId);
    setReplyDraft(review.ownerReply || '');
    setError('');
  }

  function cancelReply() {
    setEditingReviewId(null);
    setReplyDraft('');
  }

  async function saveReply(reviewId) {
    const cleanReply = replyDraft.trim();
    if (!cleanReply) {
      setError('Escribe una respuesta antes de publicarla.');
      return;
    }
    setSavingReviewId(reviewId);
    setError('');
    try {
      const saved = await replyOwnerReview(reviewId, cleanReply);
      setData((current) => ({
        ...current,
        reviews: current.reviews.map((review) => review.reviewId === reviewId
          ? { ...review, ownerReply: saved.ownerReply, ownerRepliedAt: saved.ownerRepliedAt }
          : review),
      }));
      cancelReply();
    } catch (e) {
      setError(e.message || 'No se pudo publicar la respuesta.');
    } finally {
      setSavingReviewId(null);
    }
  }

  return <div className="min-h-full bg-slate-50/70 p-4 sm:p-7">
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-[30px] bg-gradient-to-br from-slate-950 to-indigo-950 p-6 text-white shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-black uppercase tracking-[.22em] text-amber-300">Reputación verificada</p><h1 className="mt-2 text-3xl font-black">Reseñas de clientes</h1><p className="mt-2 text-sm font-semibold text-slate-300">Lee experiencias reales y responde públicamente en nombre del negocio.</p></div>
          <button onClick={load} className="rounded-2xl bg-white/10 p-3 hover:bg-white/20" aria-label="Actualizar"><RefreshCw size={20} className={loading ? 'animate-spin' : ''} /></button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-white/10 p-4"><div className="text-4xl font-black text-amber-300">{Number(data.average || 0).toFixed(1)}</div><Stars value={Math.round(data.average || 0)} /><p className="mt-2 text-xs font-bold text-slate-300">Promedio general</p></div>
          <div className="rounded-2xl bg-white/10 p-4"><div className="text-4xl font-black">{data.total || 0}</div><p className="mt-2 text-xs font-bold text-slate-300">Opiniones verificadas</p></div>
        </div>
      </header>

      <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-black text-slate-900">Calificaciones</h2><select value={rating} onChange={(e) => setRating(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold"><option value="">Todas las estrellas</option>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} estrellas</option>)}</select></div>
        <div className="mt-4 grid gap-2 sm:grid-cols-5">{[5, 4, 3, 2, 1].map((value) => <button key={value} onClick={() => setRating(String(value))} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 font-black text-slate-700"><span className="flex items-center gap-1"><Star size={15} className="fill-amber-400 text-amber-400" />{value}</span><span>{data.distribution?.[value] || 0}</span></button>)}</div>
      </section>

      {error && <div className="rounded-2xl bg-red-50 p-4 font-bold text-red-700">{error}</div>}
      <section className="space-y-3">
        {!loading && !data.reviews?.length && <div className="rounded-[26px] border border-dashed border-slate-300 bg-white p-10 text-center"><MessageSquareText className="mx-auto text-slate-400" /><p className="mt-3 font-black text-slate-800">Aún no hay reseñas con este filtro</p></div>}
        {data.reviews?.map((review) => <article key={review.reviewId} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-black text-slate-900">{review.customerName || 'Cliente'}</h3><p className="text-xs font-bold text-slate-500">{review.branchName} · {new Date(review.createdAt).toLocaleDateString()}</p></div><div className="flex items-center gap-2"><Stars value={review.rating} /><span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700"><ShieldCheck size={13} />Verificada</span></div></div>
          <p className="mt-4 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">{review.comment || 'El cliente dejó su calificación sin comentario.'}</p>

          {review.ownerReply && editingReviewId !== review.reviewId && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <div className="flex items-center justify-between gap-3"><p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-amber-800"><MessageSquareReply size={16} />Respuesta del negocio</p><button type="button" onClick={() => startReply(review)} className="flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-black text-slate-600 hover:bg-white"><Pencil size={13} />Editar</button></div>
            <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">{review.ownerReply}</p>
            {review.ownerRepliedAt && <p className="mt-2 text-[11px] font-bold text-slate-500">Actualizada el {new Date(review.ownerRepliedAt).toLocaleDateString()}</p>}
          </div>}

          {!review.ownerReply && editingReviewId !== review.reviewId && <button type="button" onClick={() => startReply(review)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800"><MessageSquareReply size={17} />Responder públicamente</button>}

          {editingReviewId === review.reviewId && <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4">
            <label className="text-sm font-black text-slate-900" htmlFor={`reply-${review.reviewId}`}>Respuesta pública del negocio</label>
            <p className="mt-1 text-xs font-semibold text-slate-500">Será visible para todos los clientes. Responde con respeto y sin compartir datos personales.</p>
            <textarea id={`reply-${review.reviewId}`} value={replyDraft} onChange={(event) => setReplyDraft(event.target.value.slice(0, 500))} rows={4} autoFocus className="mt-3 w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500" placeholder="Gracias por compartir tu experiencia…" />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3"><span className="text-xs font-bold text-slate-500">{replyDraft.length}/500</span><div className="flex gap-2"><button type="button" onClick={cancelReply} disabled={savingReviewId === review.reviewId} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700">Cancelar</button><button type="button" onClick={() => saveReply(review.reviewId)} disabled={savingReviewId === review.reviewId || !replyDraft.trim()} className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-4 py-2 text-sm font-black text-white disabled:opacity-50"><Send size={16} />{savingReviewId === review.reviewId ? 'Publicando…' : 'Publicar respuesta'}</button></div></div>
          </div>}
        </article>)}
      </section>
    </div>
  </div>;
}