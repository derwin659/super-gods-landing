import { academyModules, academyModuleId, academyGroups } from '../../utils/academy';
import { useEffect, useRef, useState } from 'react';
import { getAcademyAdmin, saveAcademyDraft, publishAcademyLesson, uploadAcademyVideo } from '../../api/academyApi';
import { premiumConfirm } from '../../components/PremiumUi';
const roles = { OWNER: 'Dueño', ADMIN: 'Administrador', CLIENT: 'Cliente · solo móvil', BARBER: 'Profesional · solo móvil', CASHIER: 'Trabajador de caja · solo móvil' };
const blank = { title: '', category: '', roles: ['OWNER'], permission: '', minutes: 3, summary: '', steps: '', sortOrder: 1, moduleId: 1, platform: 'both', initialRoute: false };
function formFor(row) { return row ? { ...row.draft, moduleId: academyModuleId(row.draft), platform: row.draft.platform || 'both', initialRoute: Boolean(row.draft.initialRoute), permission: row.draft.permission || '', steps: row.draft.steps.join('\n') } : { ...blank }; }
export default function SuperAdminAcademyPage() {
  const [items, setItems] = useState([]);
  const [row, setRow] = useState(null);
  const [form, setForm] = useState({ ...blank });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [retry, setRetry] = useState(0);
  const fileInput = useRef({});
  const dirty = JSON.stringify(form) !== JSON.stringify(formFor(row));
  useEffect(() => {
    let active = true;
    getAcademyAdmin().then((data) => { if (active) { setItems(data); setLoading(false); setError(''); } }).catch((failure) => { if (active) { setError(failure.message); setLoading(false); } });
    return () => { active = false; };
  }, [retry]);
  useEffect(() => {
    function warn(event) { if (dirty || busy) { event.preventDefault(); event.returnValue = ''; } }
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, busy]);
  async function choose(next) {
    if (dirty && !await premiumConfirm('Tienes cambios sin guardar. ¿Descartarlos?')) return;
    setRow(next); setForm(formFor(next)); setError(''); setNotice(''); setProgress(null);
  }
  function accept(saved) {
    setRow(saved); setForm(formFor(saved));
    setItems((previous) => [...previous.filter((item) => item.id !== saved.id), saved].sort((a, b) => a.draft.sortOrder - b.draft.sortOrder));
    return saved;
  }
  function payload() { return { title: form.title, category: form.category, roles: form.roles, permission: form.permission || null, minutes: Number(form.minutes), summary: form.summary, steps: form.steps.split('\n').map((step) => step.trim()).filter(Boolean), sortOrder: Number(form.sortOrder), moduleId: Number(form.moduleId), platform: form.platform, initialRoute: form.initialRoute, version: row?.version || 0 }; }
  async function save() { return accept(await saveAcademyDraft(row?.id, payload())); }
  async function action(kind, file, platform) {
    if (busy) return;
    if (kind === 'upload' && (!file || file.size > 35 * 1024 * 1024 || file.type !== 'video/mp4' || !/\.mp4$/i.test(file.name))) { setError('Selecciona un MP4 de hasta 35 MB.'); return; }
    if (kind === 'unpublish' && !await premiumConfirm('¿Retirar esta lección de Academy? Dejará de aparecer al actualizar el catálogo.')) return;
    setBusy(true); setError(''); setNotice('');
    try {
      if (kind === 'unpublish') { accept(await publishAcademyLesson(row.id, row.version, false)); setNotice('Lección retirada. El borrador se conserva.'); return; }
      const saved = await save();
      if (kind === 'upload') {
        setProgress(0);
        accept(await uploadAcademyVideo(saved.id, saved.version, file, setProgress, platform));
        setNotice('Video subido a Cloudinary como borrador. Revisa la vista previa y pulsa Publicar.');
      } else if (kind === 'publish') {
        accept(await publishAcademyLesson(saved.id, saved.version, true));
        setNotice('Lección publicada. Aparecerá al actualizar Academy en los dispositivos.');
      } else setNotice('Borrador guardado. La versión publicada no cambió.');
    } catch (failure) { setError(failure.message || 'No se pudo guardar.'); }
    finally { setBusy(false); setProgress(null); Object.values(fileInput.current).forEach(input => { if (input) input.value = ''; }); }
  }
  const set = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));
  return <main className="space-y-6">
    <header><p className="text-sm font-black uppercase tracking-widest text-amber-700">GODS Academy</p><h1 className="mt-2 text-3xl font-black">Administra tus tutoriales</h1><p className="mt-2 text-neutral-600">Organiza tus módulos, elige la plataforma y sube por separado los videos web y móvil. Publica cuando esté listo.</p></header>
    {error && <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error} <button disabled={busy} type="button" onClick={() => setRetry((value) => value + 1)} className="underline">Actualizar lista</button><p className="text-sm">Si otra sesión modificó la lección, vuelve a seleccionarla de la lista antes de guardar.</p></div>}
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800">{notice}</p>}
    <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
      <aside className="space-y-3"><button disabled={busy} type="button" onClick={() => choose(null)} className="w-full rounded-xl bg-neutral-950 p-3 font-bold text-white">+ Nueva lección</button>{loading ? <p>Cargando lecciones...</p> : academyGroups(items.map(item => ({ ...item.draft, id: item.id, row: item }))).map(group => <details key={group.id} open className="rounded-xl border border-neutral-200 p-2"><summary className="cursor-pointer p-2 text-sm font-black">{group.title} ({group.lessons.length})</summary>{group.lessons.map(({row: item}) => <button disabled={busy} type="button" key={item.id} onClick={() => choose(item)} className={'mt-2 w-full rounded-xl border p-3 text-left ' + (row?.id === item.id ? 'border-amber-500 bg-amber-50' : 'border-neutral-200 bg-white')}><strong className="block">{item.draft.sortOrder}. {item.draft.title}</strong><span className="block text-xs">{item.draft.platform === 'mobile' ? 'App móvil' : item.draft.platform === 'web' ? 'Web' : 'Web y móvil'}{item.draft.initialRoute ? ' · Ruta inicial' : ''}</span><span className="mt-1 block text-xs">{item.published ? item.hasChanges ? 'Publicada · cambios en borrador' : 'Publicada' : 'Borrador'}</span></button>)}</details>)}</aside>
      <form onSubmit={(event) => { event.preventDefault(); action('save'); }} className="rounded-3xl border border-neutral-200 bg-white p-5 sm:p-7">
        <fieldset disabled={busy} className="space-y-4">
          <h2 className="text-xl font-black">{row ? 'Editar lección' : 'Nueva lección'}</h2>
          <label className="block font-bold">Título<input required maxLength={160} value={form.title} onChange={(event) => set('title', event.target.value)} className="mt-2 w-full rounded-xl border p-3"/></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="block font-bold">Módulo<select value={form.moduleId} onChange={event => set('moduleId', Number(event.target.value))} className="mt-2 w-full rounded-xl border p-3">{academyModules.map(module => <option key={module.id} value={module.id}>{module.title}</option>)}</select></label><label className="block font-bold">Plataforma<select value={form.platform} onChange={event => set('platform', event.target.value)} className="mt-2 w-full rounded-xl border p-3"><option value="both">Web y app móvil</option><option value="web">Solo web</option><option value="mobile">Solo app móvil</option></select></label></div>
          <label className="flex items-center gap-3 font-bold"><input type="checkbox" checked={form.initialRoute} onChange={event => set('initialRoute', event.target.checked)}/>Parte de la ruta inicial · Empieza aquí</label>
          <label className="block font-bold">Funcionalidad<input required maxLength={80} placeholder="Caja, Agenda, Clientes..." value={form.category} onChange={(event) => set('category', event.target.value)} className="mt-2 w-full rounded-xl border p-3"/></label>
          <label className="block font-bold">Resumen<textarea required maxLength={600} value={form.summary} onChange={(event) => set('summary', event.target.value)} className="mt-2 w-full rounded-xl border p-3"/></label>
          <div><p className="font-bold">¿Quién puede verla?</p><div className="mt-2 flex flex-wrap gap-4">{Object.entries(roles).map(([role, label]) => <label key={role} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.roles.includes(role)} onChange={(event) => set('roles', event.target.checked ? [...form.roles, role] : form.roles.filter((value) => value !== role))}/>{label}</label>)}</div></div>
          <label className="block font-bold">Permiso requerido para administradores<select value={form.permission} onChange={(event) => set('permission', event.target.value)} className="mt-2 w-full rounded-xl border p-3"><option value="">Guía general</option><option value="CASH_ACCESS">Caja</option><option value="AGENDA_ACCESS">Agenda</option><option value="CUSTOMERS_ACCESS">Clientes</option><option value="REPORTS_ACCESS">Reportes</option>{form.permission && !['CASH_ACCESS','AGENDA_ACCESS','CUSTOMERS_ACCESS','REPORTS_ACCESS'].includes(form.permission) && <option value={form.permission}>{form.permission}</option>}</select></label>
          <label className="block font-bold">Pasos de la guía (uno por línea)<textarea required rows={6} value={form.steps} onChange={(event) => set('steps', event.target.value)} className="mt-2 w-full rounded-xl border p-3"/></label>
          <div className="grid grid-cols-2 gap-4"><label className="block font-bold">Minutos de lectura<input type="number" required min={1} max={120} value={form.minutes} onChange={(event) => set('minutes', event.target.value)} className="mt-2 w-full rounded-xl border p-3"/></label><label className="block font-bold">Orden de la lección<input type="number" required min={0} value={form.sortOrder} onChange={(event) => set('sortOrder', event.target.value)} className="mt-2 w-full rounded-xl border p-3"/></label></div>
          <section className="space-y-4"><h3 className="font-bold">Videos por plataforma</h3><p className="text-sm text-neutral-600">Sube aquí cada versión: MP4 hasta 35 MB, preferible H.264 con subtítulos. Cada carga guarda el borrador; después pulsa Publicar. Si falta una versión, se muestra la guía sin video.</p>{row?.draft.videoUrl && <div className="rounded-xl bg-amber-50 p-3"><p className="text-sm">Video anterior compartido. Se usa donde todavía no hayas subido una versión específica.</p><video controls preload="metadata" src={row.draft.videoUrl} className="mt-2 max-h-60 w-full"/></div>}<div className="grid gap-4 lg:grid-cols-2">{['web','mobile'].map(platform => <div key={platform} className="rounded-2xl border bg-neutral-50 p-4"><h4 className="font-bold">{platform === 'web' ? 'Video web · computadora' : 'Video app móvil · celular'}</h4><p className="mt-1 text-sm text-neutral-600">{form.platform !== 'both' && form.platform !== platform ? 'Esta lección no se muestra en esta plataforma. Puedes preparar su video como borrador.' : 'Esta versión se mostrará en esta plataforma.'}</p><input ref={input => { fileInput.current[platform] = input; }} type="file" accept="video/mp4,.mp4" aria-label={platform === 'web' ? 'Subir video web' : 'Subir video app móvil'} onChange={event => { const file = event.target.files?.[0]; if (file) action('upload', file, platform); }} className="mt-3 w-full"/>{row?.draft.videos?.[platform]?.url ? <video key={row.draft.videos[platform].url} controls playsInline preload="metadata" src={row.draft.videos[platform].url} className="mt-4 max-h-80 w-full rounded-xl bg-black"/> : <p className="mt-3 text-sm">Sin video específico cargado.</p>}</div>)}</div></section>
          <div className="flex flex-wrap gap-3"><button type="submit" className="rounded-xl border border-neutral-300 px-5 py-3 font-bold">Guardar borrador</button><button type="button" onClick={() => action('publish')} className="rounded-xl bg-amber-400 px-5 py-3 font-black">Publicar{(row?.draft.videoUrl || Object.keys(row?.draft.videos || {}).length) ? ' con video' : ' guía'}</button>{row?.published && <button type="button" onClick={() => action('unpublish')} className="rounded-xl px-4 py-3 font-bold text-red-700">Retirar publicación</button>}</div>
        </fieldset>
        {busy && <p role="status" className="mt-4 font-bold">{progress !== null ? progress < 100 ? `Subiendo: ${progress}%` : 'Procesando en Cloudinary. No cierres esta página...' : 'Guardando...'}</p>}
      </form>
    </div>
  </main>;
}