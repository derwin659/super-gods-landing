import { useEffect, useState } from 'react';
import { CalendarDays, MapPin, Scissors, Share2, Sparkles, UserRound } from 'lucide-react';
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
        <button onClick={share} className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 font-black backdrop-blur hover:bg-white/20"><Share2 size={18}/>Compartir</button>
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
  </main>;
}