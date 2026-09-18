import { useEffect, useRef, useState } from 'react';
import { getAcademyAdmin, saveAcademyDraft, publishAcademyLesson, uploadAcademyVideo } from '../../api/academyApi';
import { premiumConfirm } from '../../components/PremiumUi';
const roles = { OWNER: 'Dueño', ADMIN: 'Administrador', CLIENT: 'Cliente · solo móvil', BARBER: 'Profesional · solo móvil', CASHIER: 'Trabajador de caja · solo móvil' };
const blank = { title: '', category: '', roles: ['OWNER'], permission: '', minutes: 3, summary: '', steps: '', sortOrder: 0 };
function formFor(row) { return row ? { ...row.draft, permission: row.draft.permission || '', steps: row.draft.steps.join('\n') } : { ...blank }; }
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
  const fileInput = useRef(null);
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
  function payload() { return { title: form.title, category: form.category, roles: form.roles, permission: form.permission || null, minutes: Number(form.minutes), summary: form.summary, steps: form.steps.split('\n').map((step) => step.trim()).filter(Boolean), sortOrder: Number(form.sortOrder), version: row?.version || 0 }; }
  async function save() { return accept(await saveAcademyDraft(row?.id, payload())); }
  async function action(kind, file) {
    if (busy) return;
    if (kind === 'upload' && (!file || file.size > 35 * 1024 * 1024 || file.type !== 'video/mp4' || !/\.mp4$/i.test(file.name))) { setError('Selecciona un MP4 de hasta 35 MB.'); return; }
    if (kind === 'unpublish' && !await premiumConfirm('¿Retirar esta lección de Academy? Dejará de aparecer al actualizar el catálogo.')) return;
    setBusy(true); setError(''); setNotice('');
    try {
      if (kind === 'unpublish') { accept(await publishAcademyLesson(row.id, row.version, false)); setNotice('Lección retirada. El borrador se conserva.'); return; }
      const saved = await save();
      if (kind === 'upload') {
        setProgress(0);
        accept(await uploadAcademyVideo(saved.id, saved.version, file, setProgress));
        setNotice('Video subido a Cloudinary como borrador. Revisa la vista previa y pulsa Publicar.');
      } else if (kind === 'publish') {
        accept(await publishAcademyLesson(saved.id, saved.version, true));
        setNotice('Lección publicada. Aparecerá al actualizar Academy en los dispositivos.');
      } else setNotice('Borrador guardado. La versión publicada no cambió.');
    } catch (failure) { setError(failure.message || 'No se pudo guardar.'); }
    finally { setBusy(false); setProgress(null); if (fileInput.current) fileInput.current.value = ''; }
  }
  const set = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));
  return <main className="space-y-6">
    <header><p className="text-sm font-black uppercase tracking-widest text-amber-700">GODS Academy</p><h1 className="mt-2 text-3xl font-black">Administra tus tutoriales</h1><p className="mt-2 text-neutral-600">Guarda un borrador, sube el video a Cloudinary y publica cuando esté listo.</p></header>
    {error && <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error} <button disabled={busy} type="button" onClick={() => setRetry((value) => value + 1)} className="underline">Actualizar lista</button><p className="text-sm">Si otra sesión modificó la lección, vuelve a seleccionarla de la lista antes de guardar.</p></div>}
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800">{notice}</p>}
    <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
      <aside className="space-y-3"><button disabled={busy} type="button" onClick={() => choose(null)} className="w-full rounded-xl bg-neutral-950 p-3 font-bold text-white">+ Nueva lección</button>{loading ? <p>Cargando lecciones...</p> : items.map((item) => <button disabled={busy} type="button" key={item.id} onClick={() => choose(item)} className={`w-full rounded-2xl border p-4 text-left ${row?.id === item.id ? 'border-amber-500 bg-amber-50' : 'border-neutral-200 bg-white'}`}><strong className="block">{item.draft.title}</strong><span className="mt-1 block text-xs">{item.published ? item.hasChanges ? 'Publicada · cambios en borrador' : 'Publicada' : 'Borrador'}</span></button>)}</aside>
      <form onSubmit={(event) => { event.preventDefault(); action('save'); }} className="rounded-3xl border border-neutral-200 bg-white p-5 sm:p-7">
        <fieldset disabled={busy} className="space-y-4">
          <h2 className="text-xl font-black">{row ? 'Editar lección' : 'Nueva lección'}</h2>
          <label className="block font-bold">Título<input required maxLength={160} value={form.title} onChange={(event) => set('title', event.target.value)} className="mt-2 w-full rounded-xl border p-3"/></label>
          <label className="block font-bold">Funcionalidad<input required maxLength={80} placeholder="Caja, Agenda, Clientes..." value={form.category} onChange={(event) => set('category', event.target.value)} className="mt-2 w-full rounded-xl border p-3"/></label>
          <label className="block font-bold">Resumen<textarea required maxLength={600} value={form.summary} onChange={(event) => set('summary', event.target.value)} className="mt-2 w-full rounded-xl border p-3"/></label>
          <div><p className="font-bold">¿Quién puede verla?</p><div className="mt-2 flex flex-wrap gap-4">{Object.entries(roles).map(([role, label]) => <label key={role} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.roles.includes(role)} onChange={(event) => set('roles', event.target.checked ? [...form.roles, role] : form.roles.filter((value) => value !== role))}/>{label}</label>)}</div></div>
          <label className="block font-bold">Permiso requerido para administradores<select value={form.permission} onChange={(event) => set('permission', event.target.value)} className="mt-2 w-full rounded-xl border p-3"><option value="">Guía general</option><option value="CASH_ACCESS">Caja</option><option value="AGENDA_ACCESS">Agenda</option><option value="CUSTOMERS_ACCESS">Clientes</option><option value="REPORTS_ACCESS">Reportes</option>{form.permission && !['CASH_ACCESS','AGENDA_ACCESS','CUSTOMERS_ACCESS','REPORTS_ACCESS'].includes(form.permission) && <option value={form.permission}>{form.permission}</option>}</select></label>
          <label className="block font-bold">Pasos de la guía (uno por línea)<textarea required rows={6} value={form.steps} onChange={(event) => set('steps', event.target.value)} className="mt-2 w-full rounded-xl border p-3"/></label>
          <div className="grid grid-cols-2 gap-4"><label className="block font-bold">Minutos de lectura<input type="number" required min={1} max={120} value={form.minutes} onChange={(event) => set('minutes', event.target.value)} className="mt-2 w-full rounded-xl border p-3"/></label><label className="block font-bold">Orden<input type="number" required value={form.sortOrder} onChange={(event) => set('sortOrder', event.target.value)} className="mt-2 w-full rounded-xl border p-3"/></label></div>
          <section className="rounded-2xl bg-neutral-50 p-4"><h3 className="font-bold">Video de la lección</h3><p className="mt-1 text-sm text-neutral-600">MP4, hasta 35 MB. Preferible H.264 con subtítulos integrados. Completa la guía antes de subir.</p><input ref={fileInput} type="file" accept="video/mp4,.mp4" aria-label="Subir video MP4" onChange={(event) => { const file = event.target.files?.[0]; if (file) action('upload', file); }} className="mt-3 w-full"/>{row?.draft.videoUrl && <video key={row.draft.videoUrl} controls playsInline preload="metadata" src={row.draft.videoUrl} className="mt-4 w-full rounded-xl bg-black"/>}</section>
          <div className="flex flex-wrap gap-3"><button type="submit" className="rounded-xl border border-neutral-300 px-5 py-3 font-bold">Guardar borrador</button><button type="button" onClick={() => action('publish')} className="rounded-xl bg-amber-400 px-5 py-3 font-black">Publicar{row?.draft.videoUrl ? ' con video' : ' guía'}</button>{row?.published && <button type="button" onClick={() => action('unpublish')} className="rounded-xl px-4 py-3 font-bold text-red-700">Retirar publicación</button>}</div>
        </fieldset>
        {busy && <p role="status" className="mt-4 font-bold">{progress !== null ? progress < 100 ? `Subiendo: ${progress}%` : 'Procesando en Cloudinary. No cierres esta página...' : 'Guardando...'}</p>}
      </form>
    </div>
  </main>;
}