import { useEffect, useState } from 'react';
import { BookOpen, GraduationCap, CheckCircle2, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAcademyCatalog } from '../api/academyApi';
import { academyProgressKey, readAcademyProgress } from '../utils/academy';

export default function AcademyPage() {
  const { session } = useAuth();
  return <AcademyContent key={`${session?.tenantId}:${session?.userId}:${session?.role}`} session={session} />;
}

function AcademyContent({ session }) {
  const role = String(session?.role || '').toUpperCase();
  const [catalog, setCatalog] = useState({ roles: {}, lessons: [] });
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const key = academyProgressKey(session);
  const [completed, setCompleted] = useState(() => readAcademyProgress(key));
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    let active = true;
    getAcademyCatalog().then((data) => {
      if (active) { setCatalog(data); setCatalogError(false); setLoading(false); }
    }).catch(() => {
      if (active) { setCatalog({ roles: {}, lessons: [] }); setCatalogError(true); setLoading(false); }
    });
    return () => { active = false; };
  }, [role, retry]);
  function refresh() { setLoading(true); setRetry((value) => value + 1); }
  const lessons = catalog.lessons;
  const visible = lessons.filter((lesson) => `${lesson.title} ${lesson.category}`.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim()));
  const selected = lessons.find((lesson) => lesson.id === selectedId);
  const done = lessons.filter((lesson) => completed.includes(lesson.id)).length;
  function toggleComplete(id) {
    const next = completed.includes(id) ? completed.filter((value) => value !== id) : [...completed, id];
    setCompleted(next);
    try { localStorage.setItem(key, JSON.stringify(next)); setStorageError(false); }
    catch { setStorageError(true); }
  }
  return <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
    <header className="rounded-[30px] bg-gradient-to-br from-neutral-950 via-slate-900 to-amber-950 p-6 text-white sm:p-9">
      <div className="flex items-center gap-3 text-amber-300"><GraduationCap size={30}/><span className="text-sm font-black uppercase tracking-widest">GODS Academy</span></div>
      <h1 className="mt-5 text-3xl font-black sm:text-4xl">Aprende. Practica. Crece.</h1>
      <p className="mt-3 max-w-xl text-white/75">Tu ruta como {catalog.roles[role] || 'usuario'}. Guías breves para aprovechar GODS, una tarea a la vez.</p>
      <div className="mt-6 flex flex-wrap items-center gap-3"><span className="rounded-full bg-white/10 px-4 py-2 text-sm">{done} de {lessons.length} guías completadas</span><span className="text-sm text-amber-200">A tu ritmo</span></div>
      <progress aria-label="Progreso de aprendizaje" className="mt-4 h-2 w-full accent-amber-400" value={done} max={lessons.length || 1}/>
      <p className="mt-2 text-xs text-white/55">El progreso se guarda en este navegador para tu cuenta.</p>
      <button type="button" disabled={loading} onClick={refresh} className="mt-4 rounded-xl border border-white/30 px-4 py-2 text-sm font-bold disabled:opacity-50">Actualizar contenido</button>
    </header>
    {catalogError && <div role="alert" className="rounded-2xl bg-amber-50 p-4">No pudimos cargar Academy. Comprueba tu conexión y vuelve a actualizar el contenido.</div>}
    {loading && <p role="status">Cargando contenido publicado...</p>}
    {storageError && <p role="alert">El navegador no permitió guardar el progreso. Se mantendrá mientras esta página siga abierta.</p>}
    {selected ? <article className="rounded-[28px] border border-neutral-200 bg-white p-5 sm:p-8">
      <button type="button" onClick={() => setSelectedId(null)} className="mb-5 font-bold text-amber-800">← Volver a las guías</button>
      <p className="text-xs font-bold uppercase tracking-widest text-amber-700">{selected.category} · {selected.minutes} min de lectura</p>
      <h2 className="mt-2 text-2xl font-black">{selected.title}</h2>
      {selected.videoUrl ? <video key={selected.id} controls playsInline preload="metadata" className="mt-5 w-full rounded-2xl bg-black" src={selected.videoUrl}>{selected.captionUrl && <track default kind="captions" srcLang="es" label="Español" src={selected.captionUrl}/>}</video> : <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Guía disponible. El video de esta lección aún no está publicado.</p>}
      <ol className="mt-6 space-y-4">{selected.steps.map((step, index) => <li key={step} className="flex gap-4 rounded-2xl bg-neutral-50 p-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-200 font-bold">{index + 1}</span><p className="leading-7">{step}</p></li>)}</ol>
      <button type="button" aria-pressed={completed.includes(selected.id)} onClick={() => toggleComplete(selected.id)} className="mt-6 rounded-2xl bg-neutral-950 px-5 py-3 font-bold text-white">{completed.includes(selected.id) ? 'Completada · Marcar como pendiente' : 'Marcar como completada'}</button>
    </article> : <>
      <label className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3"><Search aria-hidden="true" size={20}/><input aria-label="Buscar guía" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="¿Qué quieres aprender?" className="min-w-0 flex-1 bg-transparent outline-none"/></label>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visible.map((lesson) => <button key={lesson.id} type="button" onClick={() => setSelectedId(lesson.id)} className="rounded-[24px] border border-neutral-200 bg-white p-5 text-left shadow-sm transition hover:border-amber-400 focus-visible:outline-amber-500">
        <div className="flex items-center justify-between"><BookOpen className="text-amber-700"/><span className="text-xs font-semibold text-neutral-500">{lesson.minutes} min · Guía</span></div>
        <p className="mt-5 text-xs font-bold uppercase tracking-widest text-amber-700">{lesson.category}</p><h2 className="mt-2 text-xl font-black">{lesson.title}</h2><p className="mt-3 text-sm leading-6 text-neutral-600">{lesson.summary}</p>
        <span className="mt-5 flex items-center gap-2 text-sm font-bold">{completed.includes(lesson.id) ? <><CheckCircle2 size={18} className="text-emerald-600"/>Completada</> : 'Comenzar →'}</span>
      </button>)}</div>
      {!visible.length && <p className="rounded-2xl bg-neutral-100 p-6">No encontramos guías para esta búsqueda y tu rol.</p>}
    </>}
  </main>;
}