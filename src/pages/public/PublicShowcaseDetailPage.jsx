import { useEffect, useState } from 'react';
import { CalendarDays, Flag, MapPin, Scissors, Share2, Sparkles, UserRound } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { getApiBaseUrl } from '../../api/apiClient';

function viewerKey() {
  const storageKey = 'SHOWCASE_PUBLIC_VIEWER';
  let value = localStorage.getItem(storageKey);
  if (!value) {
    value = 'web_' + Date.now() + '_' + Math.random().toString(36).slice(2, 14);
    localStorage.setItem(storageKey, value);
  }
  return value;
}

export default function PublicShowcaseDetailPage() {
  const { id } = useParams();
  const [work, setWork] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reporting, setReporting] = useState(false);

  async function record(eventType) {
    try {
      await fetch(getApiBaseUrl() + '/api/public/showcase/' + id + '/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, viewerKey: viewerKey() }),
      });
    } catch {
      // Analytics never blocks the public experience.
    }
  }

  useEffect(() => {
    let active = true;
    fetch(getApiBaseUrl() + '/api/public/showcase/' + id)
      .then(async (response) => {
        if (!response.ok) throw new Error('Esta inspiración ya no está disponible.');
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        setWork(data);
        record('VIEW');
      })
      .catch((reason) => active && setError(reason.message || 'No pudimos abrir esta inspiración.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  async function share() {
    const url = window.location.href;
    const data = {
      title: work?.title || 'Inspiración en Super Gods',
      text: 'Mira esta inspiración: ' + (work?.title || 'Super Gods'),
      url,
    };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(url);
        window.alert('Enlace copiado.');
      }
      record('SHARE');
    } catch (reason) {
      if (reason?.name !== 'AbortError') window.alert('No se pudo compartir el enlace.');
    }
  }

  async function submitReport(event) {
    event.preventDefault();
    if (!reportReason || reporting) return;
    setReporting(true);
    try {
      const response = await fetch(getApiBaseUrl() + '/api/public/showcase/' + id + '/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reportReason,
          details: reportDetails.trim(),
          reporterKey: viewerKey(),
        }),
      });
      if (!response.ok) throw new Error();
      setReportOpen(false);
      setReportReason('');
      setReportDetails('');
      window.alert('Gracias. Revisaremos este contenido.');
    } catch {
      window.alert('No se pudo enviar el reporte.');
    } finally {
      setReporting(false);
    }
  }
  if (loading) return <main className="grid min-h-screen place-items-center bg-slate-950 text-white"><div className="text-center"><Sparkles className="mx-auto animate-pulse text-amber-300" size={42}/><p className="mt-4 font-black">Abriendo inspiración…</p></div></main>;
  if (error || !work) return <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-white"><section className="max-w-lg rounded-[30px] bg-white/10 p-8 text-center"><h1 className="text-2xl font-black">Contenido no disponible</h1><p className="mt-3 text-white/70">{error}</p><a href="/app" className="mt-6 inline-flex rounded-2xl bg-amber-300 px-5 py-3 font-black text-slate-950">Conocer Super Gods</a></section></main>;

  const isVideo = work.mediaType === 'VIDEO';
  const subtitle = [work.collectionName, work.category].filter(Boolean).join(' · ');
  const bookingParams = new URLSearchParams();
  if (work.branchId) bookingParams.set('branchId', work.branchId);
  if (work.professionalUserId) bookingParams.set('barberId', work.professionalUserId);
  const bookingUrl = work.tenantCode ? '/reservar/' + encodeURIComponent(work.tenantCode) + (bookingParams.toString() ? '?' + bookingParams.toString() : '') : '/app';

  return <main className="min-h-screen bg-[radial-gradient(circle_at_top,#312e81,#090e1a_52%)] px-4 py-7 text-white sm:px-7">
    <div className="mx-auto max-w-5xl">
      <header className="mb-5 flex items-center justify-between gap-4">
        <a href="/" className="flex items-center gap-3 font-black"><img src="/gods-technologies-logo-horizontal.png" alt="Super Gods" className="h-10 rounded-lg bg-white object-contain px-2"/><span className="hidden sm:inline">Super Gods App</span></a>
        <div className="flex gap-2"><button onClick={()=>setReportOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 font-black backdrop-blur hover:bg-white/20"><Flag size={18}/><span className="hidden sm:inline">Reportar</span></button><button onClick={share} className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 font-black backdrop-blur hover:bg-white/20"><Share2 size={18}/>Compartir</button></div>
      </header>
      <article className="overflow-hidden rounded-[34px] border border-white/10 bg-slate-900 shadow-2xl lg:grid lg:grid-cols-[1.25fr_.75fr]">
        <div className="grid min-h-[380px] place-items-center bg-black">
          {isVideo
            ? <video src={work.imageUrl} poster={work.thumbnailUrl} controls playsInline className="max-h-[76vh] w-full object-contain"/>
            : <img src={work.imageUrl} alt={work.title} className="max-h-[76vh] w-full object-contain"/>}
        </div>
        <div className="flex flex-col justify-center p-7 sm:p-9">
          <div className="text-xs font-black uppercase tracking-[.2em] text-amber-300">{isVideo?'Video':'Foto'} · Inspiración</div>
          <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">{work.title}</h1>
          {subtitle&&<p className="mt-3 font-black text-amber-200">{subtitle}</p>}
          {work.description&&<p className="mt-5 leading-7 text-slate-300">{work.description}</p>}
          <div className="mt-7 space-y-3 text-sm font-bold text-slate-200">
            {work.professionalName&&<div className="flex items-center gap-3"><UserRound className="text-amber-300" size={19}/>{work.professionalName}</div>}
            {work.branchName&&<div className="flex items-center gap-3"><MapPin className="text-amber-300" size={19}/>{work.branchName}</div>}
            {work.serviceName&&<div className="flex items-center gap-3"><Scissors className="text-amber-300" size={19}/>{work.serviceName}</div>}
          </div>
          <a href={bookingUrl} className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-300 px-5 py-4 font-black text-slate-950 shadow-lg shadow-amber-500/20"><CalendarDays size={20}/>Reservar este estilo</a>
          <p className="mt-3 text-center text-xs font-semibold text-slate-500">Disponible para iPhone y Android.</p>
        </div>
      </article>
    </div>
  {reportOpen&&<div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm" onMouseDown={(event)=>event.target===event.currentTarget&&setReportOpen(false)}><form onSubmit={submitReport} className="w-full max-w-lg rounded-[28px] bg-white p-6 text-slate-950 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><div className="text-xs font-black uppercase tracking-[.18em] text-rose-600">Moderación</div><h2 className="mt-2 text-2xl font-black">Reportar contenido</h2><p className="mt-2 text-sm font-semibold text-slate-500">Será revisado antes de tomar una decisión.</p></div><button type="button" onClick={()=>setReportOpen(false)} className="rounded-full bg-slate-100 px-3 py-2 font-black">×</button></div><label className="mt-6 block text-sm font-black">Motivo<select required value={reportReason} onChange={(e)=>setReportReason(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 p-4"><option value="">Selecciona un motivo</option><option value="INAPPROPRIATE">Contenido inapropiado</option><option value="PERSONAL_DATA">Datos personales</option><option value="NO_CONSENT">Falta autorización</option><option value="MISLEADING">Contenido engañoso</option><option value="SPAM">Spam</option><option value="OTHER">Otro</option></select></label><label className="mt-4 block text-sm font-black">Detalle adicional<textarea maxLength={300} rows={4} value={reportDetails} onChange={(e)=>setReportDetails(e.target.value)} className="mt-2 w-full resize-none rounded-2xl border border-slate-200 p-4" placeholder="Opcional"/></label><button disabled={reporting||!reportReason} className="mt-5 w-full rounded-2xl bg-rose-600 px-5 py-4 font-black text-white disabled:opacity-40">{reporting?'Enviando…':'Enviar reporte'}</button></form></div>}
  </main>;
}