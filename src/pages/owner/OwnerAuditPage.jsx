import { useEffect, useMemo, useState } from 'react';
import { Activity, CalendarRange, ChevronDown, ChevronUp, Filter, RefreshCw, ShieldCheck, UserRound } from 'lucide-react';
import { getGeneralAuditLogs } from '../../api/ownerAuditApi';
import { getOwnerBranches } from '../../api/ownerCashApi';

const ENTITY_OPTIONS = [
  ['', 'Todas las areas'],
  ['ADMIN_PERMISSION', 'Permisos'],
  ['BARBER_SCHEDULE', 'Horarios'],
  ['BARBER_TIME_BLOCK', 'Bloqueos'],
  ['BARBER_BRANCH_ASSIGNMENT', 'Sedes de profesionales'],
];
const ACTION_OPTIONS = [['', 'Todas las acciones'], ['CREATE', 'Creacion'], ['UPDATE', 'Edicion'], ['DELETE', 'Eliminacion']];

function dateInput(date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function labelEntity(value) {
  return ({ ADMIN_PERMISSION: 'Permisos', BARBER_SCHEDULE: 'Horario', BARBER_TIME_BLOCK: 'Bloqueo', BARBER_BRANCH_ASSIGNMENT: 'Sedes asignadas' })[value] || value || 'Actividad';
}

function labelAction(value) {
  return ({ CREATE: 'Creo', UPDATE: 'Edito', DELETE: 'Elimino' })[value] || value || 'Cambio';
}

function actionClass(value) {
  if (value === 'DELETE') return 'border-red-200 bg-red-50 text-red-700';
  if (value === 'CREATE') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return 'border-amber-200 bg-amber-50 text-amber-800';
}

function parseSnapshot(value) {
  if (!value) return null;
  try { return JSON.parse(value); } catch { return value; }
}

function Snapshot({ title, value, tone }) {
  const parsed = parseSnapshot(value);
  return (
    <div className={`min-w-0 border p-4 ${tone === 'before' ? 'border-neutral-200 bg-neutral-50' : 'border-emerald-200 bg-emerald-50/60'}`}>
      <div className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-neutral-500">{title}</div>
      {parsed === null ? <div className="text-sm font-bold text-neutral-400">Sin datos</div> : (
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs font-semibold leading-6 text-neutral-700">{JSON.stringify(parsed, null, 2)}</pre>
      )}
    </div>
  );
}

function AuditRow({ item, branchName }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="border-b border-neutral-200 bg-white last:border-b-0">
      <button type="button" onClick={() => setOpen((value) => !value)} className="grid w-full gap-4 px-5 py-5 text-left transition hover:bg-neutral-50 lg:grid-cols-[180px_1fr_210px_44px] lg:items-center">
        <div>
          <span className={`inline-flex border px-2.5 py-1 text-xs font-black ${actionClass(item.action)}`}>{labelAction(item.action)}</span>
          <div className="mt-2 text-xs font-bold text-neutral-500">{formatDate(item.createdAt)}</div>
        </div>
        <div className="min-w-0">
          <div className="font-black text-neutral-950">{labelEntity(item.entityType)} <span className="text-neutral-400">#{item.entityId || '-'}</span></div>
          <div className="mt-1 truncate text-sm font-semibold text-neutral-500">{item.reason || 'Cambio registrado por el sistema'}</div>
        </div>
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-neutral-800"><UserRound size={15} />{item.actorUserName || `Usuario #${item.actorUserId || '-'}`}</div>
          <div className="mt-1 text-xs font-bold text-neutral-500">{item.actorRole || 'Sin rol'} · {branchName}</div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center border border-neutral-200 bg-white text-neutral-600">{open ? <ChevronUp size={17} /> : <ChevronDown size={17} />}</div>
      </button>
      {open && <div className="grid border-t border-neutral-200 md:grid-cols-2"><Snapshot title="Antes" value={item.beforeSnapshot} tone="before" /><Snapshot title="Despues" value={item.afterSnapshot} tone="after" /></div>}
    </article>
  );
}

export default function OwnerAuditPage() {
  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - 7);
  const [from, setFrom] = useState(dateInput(weekAgo));
  const [to, setTo] = useState(dateInput(today));
  const [branchId, setBranchId] = useState('');
  const [actorUserId, setActorUserId] = useState('');
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [branches, setBranches] = useState([]);
  const [items, setItems] = useState([]);
  const [actors, setActors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(nextActor = actorUserId) {
    setLoading(true); setError('');
    try {
      const logs = await getGeneralAuditLogs({ branchId: branchId || null, actorUserId: nextActor || null, entityType: entityType || null, action: action || null, from, to });
      setItems(logs);
      setActors((current) => {
        const map = new Map(current.map((actor) => [String(actor.id), actor]));
        logs.forEach((log) => { if (log.actorUserId) map.set(String(log.actorUserId), { id: log.actorUserId, name: log.actorUserName || `Usuario #${log.actorUserId}` }); });
        return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
      });
    } catch (err) { setError(err.message || 'No se pudo cargar la auditoria.'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    getOwnerBranches().then(setBranches).catch(() => setBranches([]));
    load('');
  }, []);

  const branchMap = useMemo(() => new Map(branches.map((branch) => [String(branch.id), branch.name])), [branches]);
  const branchName = (id) => id ? branchMap.get(String(id)) || `Sede #${id}` : 'Todas las sedes';

  return (
    <div className="space-y-5">
      <section className="border border-neutral-200 bg-neutral-950 px-6 py-7 text-white shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-amber-300"><ShieldCheck size={16} />Control del owner</div><h1 className="mt-3 text-3xl font-black">Auditoria general</h1><p className="mt-2 max-w-2xl text-sm font-semibold text-neutral-300">Consulta cambios sensibles de permisos, horarios, bloqueos y sedes asignadas.</p></div>
          <div className="flex items-center gap-3 border border-white/15 bg-white/5 px-4 py-3"><Activity className="text-emerald-300" size={20} /><div><div className="text-xs font-bold text-neutral-400">Eventos encontrados</div><div className="text-xl font-black">{items.length}</div></div></div>
        </div>
      </section>

      <section className="border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-black text-neutral-900"><Filter size={17} />Filtros</div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="text-xs font-black text-neutral-500">Desde<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-2 w-full border border-neutral-200 bg-neutral-50 px-3 py-3 text-sm font-bold text-neutral-900" /></label>
          <label className="text-xs font-black text-neutral-500">Hasta<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-2 w-full border border-neutral-200 bg-neutral-50 px-3 py-3 text-sm font-bold text-neutral-900" /></label>
          <label className="text-xs font-black text-neutral-500">Sede<select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="mt-2 w-full border border-neutral-200 bg-neutral-50 px-3 py-3 text-sm font-bold"><option value="">Todas</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
          <label className="text-xs font-black text-neutral-500">Usuario<select value={actorUserId} onChange={(e) => setActorUserId(e.target.value)} className="mt-2 w-full border border-neutral-200 bg-neutral-50 px-3 py-3 text-sm font-bold"><option value="">Todos</option>{actors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
          <label className="text-xs font-black text-neutral-500">Area<select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="mt-2 w-full border border-neutral-200 bg-neutral-50 px-3 py-3 text-sm font-bold">{ENTITY_OPTIONS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <label className="text-xs font-black text-neutral-500">Accion<select value={action} onChange={(e) => setAction(e.target.value)} className="mt-2 w-full border border-neutral-200 bg-neutral-50 px-3 py-3 text-sm font-bold">{ACTION_OPTIONS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        </div>
        <button type="button" onClick={() => load()} disabled={loading} className="mt-4 inline-flex items-center gap-2 bg-amber-400 px-5 py-3 text-sm font-black text-neutral-950 disabled:opacity-60"><RefreshCw size={17} className={loading ? 'animate-spin' : ''} />Actualizar</button>
      </section>

      <section className="overflow-hidden border border-neutral-200 bg-white shadow-sm">
        {loading ? <div className="p-8 text-center font-bold text-neutral-500">Cargando actividad...</div> : error ? <div className="border border-red-200 bg-red-50 p-5 font-bold text-red-700">{error}</div> : items.length === 0 ? <div className="p-10 text-center"><CalendarRange className="mx-auto text-neutral-300" size={34} /><div className="mt-3 font-black text-neutral-800">Sin cambios en este rango</div><div className="mt-1 text-sm font-semibold text-neutral-500">Prueba ampliando las fechas o quitando filtros.</div></div> : items.map((item) => <AuditRow key={item.id} item={item} branchName={branchName(item.branchId)} />)}
      </section>
    </div>
  );
}
