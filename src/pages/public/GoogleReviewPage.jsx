import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ExternalLink, Star } from 'lucide-react';
import { getApiBaseUrl } from '../../api/apiClient';
import { googleReviewLink } from '../../utils/googleReviewLinks';
export default function GoogleReviewPage() {
  const { branchId }=useParams();
  const [data,setData]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  useEffect(()=>{
    const controller=new AbortController();setLoading(true);setError('');setData(null);
    fetch(getApiBaseUrl()+'/api/public/google-reviews/'+encodeURIComponent(branchId),{signal:controller.signal,cache:'no-store'})
      .then(async response=>{if(!response.ok)throw new Error('Esta sede todavía no tiene una invitación disponible.');return response.json();})
      .then(value=>{if(!googleReviewLink(value.googleReviewUrl))throw new Error('El enlace no está disponible.');setData(value);})
      .catch(e=>{if(e.name!=='AbortError')setError(e.message);})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[branchId]);
  return <main className="grid min-h-screen place-items-center bg-slate-950 px-5 py-12 text-white"><section className="w-full max-w-lg rounded-[32px] border border-white/10 bg-slate-900 p-8 text-center shadow-2xl">
    <a href="/" className="font-black tracking-widest text-amber-300">SUPER GODS</a><Star className="mx-auto mt-8 text-amber-300" size={38}/><h1 className="mt-5 text-3xl font-black">Comparte tu experiencia</h1>
    {loading ? <p className="mt-5 text-slate-300">Cargando la sede…</p> : error ? <p className="mt-5 text-slate-300" role="alert">{error}</p> : <>
      <p className="mt-4 text-lg font-bold">{data?.businessName} · {data?.branchName}</p>
      <p className="mt-3 leading-7 text-slate-300">Si ya nos visitaste, puedes dejar tu opinión en Google. Es voluntaria y la publicas con tu propia cuenta.</p>
      <a href={googleReviewLink(data?.googleReviewUrl)} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-300 px-6 py-4 font-black text-slate-950">Opinar en Google<ExternalLink size={18}/></a>
      <p className="mt-4 text-sm text-slate-400">Tu reseña de Google y tu calificación en SuperGods se guardan por separado.</p>
    </>}
  </section></main>;
}
