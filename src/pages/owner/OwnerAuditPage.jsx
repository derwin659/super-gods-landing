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
  ['SALE_BARBER_ASSIGNMENT', 'Profesional en venta'],
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
  return ({ ADMIN_PERMISSION: 'Permisos', BARBER_SCHEDULE: 'Horario', BARBER_TIME_BLOCK: 'Bloqueo', BARBER_BRANCH_ASSIGNMENT: 'Sedes asignadas', SALE_BARBER_ASSIGNMENT: 'Profesional en venta' })[value] || value || 'Actividad';
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

const FIELD_LABELS = {
  branchIds: 'Sedes', barberUserId: 'Profesional', barberName: 'Profesional',
  itemId: 'Servicio de la venta', enabled: 'Activo', active: 'Activo',
  canEditSales: 'Puede editar ventas', canDeleteSales: 'Puede eliminar ventas',
  canManageCash: 'Puede administrar caja', canManageSchedule: 'Puede administrar horarios',
  dayOfWeek: 'Dia', startTime: 'Desde', endTime: 'Hasta', reason: 'Motivo',
};
const DAY_LABELS = { MONDAY: 'Lunes', TUESDAY: 'Martes', WEDNESDAY: 'Miercoles', THURSDAY: 'Jueves', FRIDAY: 'Viernes', SATURDAY: 'Sabado', SUNDAY: 'Domingo' };

function fieldLabel(key) {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  return key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
}

function HumanValue({ value, field, branchMap }) {
  if (value === null || value === undefined || value === '') return <span className="text-neutral-400">Sin dato</span>;
  if (typeof value === 'boolean') return <span className={value ? 'font-black text-emerald-700' : 'font-black text-neutral-500'}>{value ? 'Si' : 'No'}</span>;
  if (field === 'dayOfWeek') return DAY_LABELS[String(value).toUpperCase()] || String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-neutral-400">Ninguno</span>;
    return <div className="flex flex-wrap gap-2">{value.map((item, index) => {
      const branchName = typeof item === 'number' || typeof item === 'string' ? branchMap.get(String(item)) : null;
      return <span key={index} className="border border-neutral-200 bg-white px-2.5 py-1 text-xs font-black text-neutral-700">{branchName || (typeof item === 'object' ? <HumanValue value={item} branchMap={branchMap} /> : String(item))}</span>;
    })}</div>;
  }
  if (typeof value === 'object') return <div className="space-y-2">{Object.entries(value).map(([key, item]) => <div key={key} className="grid gap-1 border-b border-neutral-200 pb-2 last:border-0 sm:grid-cols-[180px_1fr]"><span className="text-xs font-black text-neutral-500">{fieldLabel(key)}</span><div className="text-sm font-bold text-neutral-800"><HumanValue value={item} field={key} branchMap={branchMap} /></div></div>)}</div>;
  return <span>{String(value)}</span>;
}

function Snapshot({ title, value, tone, entityType, branchMap }) {
  const parsed = parseSnapshot(value);
  const isBranchAssignment = entityType === 'BARBER_BRANCH_ASSIGNMENT';
  return (
    <div className={`min-w-0 border p-4 ${tone === 'before' ? 'border-neutral-200 bg-neutral-50' : 'border-emerald-200 bg-emerald-50/60'}`}>
      <div className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-neutral-500">{title}</div>
      {parsed === null ? <div className="text-sm font-bold text-neutral-400">Sin datos</div> : isBranchAssignment ? (
        <HumanValue value={Array.isArray(parsed) ? parsed : []} branchMap={branchMap} />
      ) : (
        <HumanValue value={parsed} branchMap={branchMap} />
      )}
    </div>
  );
}

function AuditRow({ item, branchName, branchMap }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="border-b border-neutral-200 bg-white last:border-b-0">
      <button type="button" onClick={() => setOpen((value) => !value)} className="grid w-full gap-4 px-5 py-5 text-left transition hover:bg-neutral-50 lg:grid-cols-[180px_1fr_210px_44px] lg:items-center">
        <div>
          <span className={`inline-flex border px-2.5 py-1 text-xs font-black ${actionClass(item.action)}`}>{labelAction(item.action)}</span>
          <div className="mt-2 text-xs font-bold text-neutral-500">{formatDate(item.createdAt)}</div>
        </div>
        <div className="min-w-0">
          <div className="font-black text-neutral-950">{labelEntity(item.entityType)}</div>
          <div className="mt-1 truncate text-sm font-semibold text-neutral-500">{item.reason || 'Cambio registrado por el sistema'}</div>
        </div>
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-neutral-800"><UserRound size={15} />{item.actorUserName || `Usuario #${item.actorUserId || '-'}`}</div>
          <div className="mt-1 text-xs font-bold text-neutral-500">{item.actorRole || 'Sin rol'} · {branchName}</div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center border border-neutral-200 bg-white text-neutral-600">{open ? <ChevronUp size={17} /> : <ChevronDown size={17} />}</div>
      </button>
      {open && <div className="grid border-t border-neutral-200 md:grid-cols-2"><Snapshot title="Antes" value={item.beforeSnapshot} tone="before" entityType={item.entityType} branchMap={branchMap} /><Snapshot title="Despues" value={item.afterSnapshot} tone="after" entityType={item.entityType} branchMap={branchMap} /></div>}
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
      const baseFilters = { branchId: branchId || null, entityType: entityType || null, action: action || null, from, to };
      const [logs, actorLogs] = await Promise.all([
        getGeneralAuditLogs({ ...baseFilters, actorUserId: nextActor || null }),
        getGeneralAuditLogs({ ...baseFilters, actorUserId: null }),
      ]);
      setItems(logs);
      const actorMap = new Map();
      actorLogs.forEach((log) => { if (log.actorUserId) actorMap.set(String(log.actorUserId), { id: log.actorUserId, name: log.actorUserName || `Usuario #${log.actorUserId}` }); });
      setActors([...actorMap.values()].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      const technicalMessage = String(err?.message || '');
      const unavailable = technicalMessage.includes('general_audit_log') || technicalMessage.includes('JDBC exception');
      setError(unavailable
        ? 'La auditoria general aun no esta disponible. Contacta al soporte para completar la actualizacion.'
        : technicalMessage || 'No se pudo cargar la auditoria.');
    }
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
          <label className="text-xs font-black text-neutral-500">Usuario con actividad<select value={actorUserId} onChange={(e) => setActorUserId(e.target.value)} className="mt-2 w-full border border-neutral-200 bg-neutral-50 px-3 py-3 text-sm font-bold"><option value="">Todos</option>{actors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
          <label className="text-xs font-black text-neutral-500">Area<select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="mt-2 w-full border border-neutral-200 bg-neutral-50 px-3 py-3 text-sm font-bold">{ENTITY_OPTIONS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <label className="text-xs font-black text-neutral-500">Accion<select value={action} onChange={(e) => setAction(e.target.value)} className="mt-2 w-full border border-neutral-200 bg-neutral-50 px-3 py-3 text-sm font-bold">{ACTION_OPTIONS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        </div>
        <button type="button" onClick={() => load()} disabled={loading} className="mt-4 inline-flex items-center gap-2 bg-amber-400 px-5 py-3 text-sm font-black text-neutral-950 disabled:opacity-60"><RefreshCw size={17} className={loading ? 'animate-spin' : ''} />Actualizar</button>
      </section>

      <section className="overflow-hidden border border-neutral-200 bg-white shadow-sm">
        {loading ? <div className="p-8 text-center font-bold text-neutral-500">Cargando actividad...</div> : error ? <div className="border border-red-200 bg-red-50 p-5 font-bold text-red-700">{error}</div> : items.length === 0 ? <div className="p-10 text-center"><CalendarRange className="mx-auto text-neutral-300" size={34} /><div className="mt-3 font-black text-neutral-800">Sin cambios en este rango</div><div className="mt-1 text-sm font-semibold text-neutral-500">Prueba ampliando las fechas o quitando filtros.</div></div> : items.map((item) => <AuditRow key={item.id} item={item} branchName={branchName(item.branchId)} branchMap={branchMap} />)}
      </section>
    </div>
  );
}
