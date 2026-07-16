import { useEffect, useState } from 'react';
import { MessageSquareText, RefreshCw, Star, ShieldCheck } from 'lucide-react';
import { getOwnerReviews } from '../../api/ownerReviewsApi';

function Stars({ value }) {
  return <div className="flex gap-0.5" aria-label={`${value} de 5 estrellas`}>
    {[1,2,3,4,5].map((star) => <Star key={star} size={17} className={star <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />)}
  </div>;
}

export default function OwnerReviewsPage() {
  const [data, setData] = useState({ average: 0, total: 0, distribution: {}, reviews: [] });
  const [rating, setRating] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true); setError('');
    try { setData(await getOwnerReviews({ rating: rating || null })); }
    catch (e) { setError(e.message || 'No se pudieron cargar las reseñas.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [rating]);

  return <div className="min-h-full bg-slate-50/70 p-4 sm:p-7">
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-[30px] bg-gradient-to-br from-slate-950 to-indigo-950 p-6 text-white shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-black uppercase tracking-[.22em] text-amber-300">Reputación verificada</p><h1 className="mt-2 text-3xl font-black">Reseñas de clientes</h1><p className="mt-2 text-sm font-semibold text-slate-300">Opiniones vinculadas a atenciones y ventas reales.</p></div>
          <button onClick={load} className="rounded-2xl bg-white/10 p-3 hover:bg-white/20" aria-label="Actualizar"><RefreshCw size={20} className={loading ? 'animate-spin' : ''}/></button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-white/10 p-4"><div className="text-4xl font-black text-amber-300">{Number(data.average || 0).toFixed(1)}</div><Stars value={Math.round(data.average || 0)}/><p className="mt-2 text-xs font-bold text-slate-300">Promedio general</p></div>
          <div className="rounded-2xl bg-white/10 p-4"><div className="text-4xl font-black">{data.total || 0}</div><p className="mt-2 text-xs font-bold text-slate-300">Opiniones verificadas</p></div>
        </div>
      </header>

      <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-black text-slate-900">Calificaciones</h2><select value={rating} onChange={(e)=>setRating(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold"><option value="">Todas las estrellas</option>{[5,4,3,2,1].map(v=><option key={v} value={v}>{v} estrellas</option>)}</select></div>
        <div className="mt-4 grid gap-2 sm:grid-cols-5">{[5,4,3,2,1].map(v=><button key={v} onClick={()=>setRating(String(v))} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 font-black text-slate-700"><span className="flex items-center gap-1"><Star size={15} className="fill-amber-400 text-amber-400"/>{v}</span><span>{data.distribution?.[v] || 0}</span></button>)}</div>
      </section>

      {error && <div className="rounded-2xl bg-red-50 p-4 font-bold text-red-700">{error}</div>}
      <section className="space-y-3">
        {!loading && !data.reviews?.length && <div className="rounded-[26px] border border-dashed border-slate-300 bg-white p-10 text-center"><MessageSquareText className="mx-auto text-slate-400"/><p className="mt-3 font-black text-slate-800">Aún no hay reseñas con este filtro</p></div>}
        {data.reviews?.map((review)=><article key={review.reviewId} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-black text-slate-900">{review.customerName || 'Cliente'}</h3><p className="text-xs font-bold text-slate-500">{review.branchName} · {new Date(review.createdAt).toLocaleDateString()}</p></div><div className="flex items-center gap-2"><Stars value={review.rating}/><span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700"><ShieldCheck size={13}/>Verificada</span></div></div>
          <p className="mt-4 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">{review.comment || 'El cliente dejó su calificación sin comentario.'}</p>
        </article>)}
      </section>
    </div>
  </div>;
}