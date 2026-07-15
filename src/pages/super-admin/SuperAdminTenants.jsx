import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Pencil,
  PauseCircle,
  Power,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { superAdminApi } from "../../api/superAdminApi";

const FILTERS = [
  { id: "ALL", label: "Todos" },
  { id: "ACTIVE", label: "Activos" },
  { id: "TRIAL", label: "Trial" },
  { id: "EXPIRED", label: "Vencidos" },
  { id: "SUSPENDED", label: "Suspendidos" },
  { id: "CANCELLED", label: "Eliminados" },
];

const BUSINESS_TYPE_OPTIONS = [
  ["BARBERSHOP", "Barberia"],
  ["BEAUTY_SALON", "Salon de belleza"],
  ["HAIR_SALON", "Peluqueria"],
  ["SPA", "Spa / estetica"],
  ["NAILS", "Unas"],
  ["BROWS_LASHES", "Cejas y pestanas"],
  ["TATTOO_STUDIO", "Tatuajes"],
  ["OTHER", "Otro"],
];

const COUNTRY_OPTIONS = [
  ["Peru", "Peru"],
  ["Estados Unidos", "Estados Unidos"],
  ["Colombia", "Colombia"],
  ["Mexico", "Mexico"],
  ["Chile", "Chile"],
  ["Argentina", "Argentina"],
  ["Bolivia", "Bolivia"],
  ["Brasil", "Brasil"],
  ["Union Europea", "Union Europea"],
  ["Venezuela", "Venezuela"],
  ["Uruguay", "Uruguay"],
  ["Paraguay", "Paraguay"],
  ["Costa Rica", "Costa Rica"],
  ["Republica Dominicana", "Republica Dominicana"],
  ["Guatemala", "Guatemala"],
];

const CURRENCY_OPTIONS = [
  ["PEN", "PEN - Soles"],
  ["USD", "USD - Dolares"],
  ["COP", "COP - Colombia"],
  ["MXN", "MXN - Mexico"],
  ["CLP", "CLP - Chile"],
  ["ARS", "ARS - Argentina"],
  ["BOB", "BOB - Bolivia"],
  ["BRL", "BRL - Brasil"],
  ["EUR", "EUR - Europa"],
];

function statusLabel(status) {
  switch ((status || "").toUpperCase()) {
    case "ACTIVE":
      return "Activa";
    case "TRIAL":
      return "Trial";
    case "PENDING_REVIEW":
      return "Pendiente";
    case "SUSPENDED":
      return "Suspendida";
    case "EXPIRED":
      return "Vencida";
    case "CANCELLED":
      return "Eliminada";
    case "NO_SUBSCRIPTION":
      return "Sin suscripcion";
    default:
      return status || "-";
  }
}

function planLabel(plan) {
  switch ((plan || "").toUpperCase()) {
    case "FREE":
      return "Free";
    case "BASIC":
      return "Basic";
    case "STARTER":
      return "Starter";
    case "GROWTH":
      return "Growth";
    case "PRO":
      return "Pro";
    case "ENTERPRISE":
      return "Enterprise";
    case "STARTER_LEGACY":
      return "Starter Legacy";
    case "PRO_LEGACY":
      return "Pro Legacy";
    default:
      return plan || "-";
  }
}

function normalizeStatus(item) {
  const status = (item.status || "").toUpperCase();
  if (status) return status;

  if (item.tenantActive === false) return "SUSPENDED";
  if (item.fechaFin && new Date(item.fechaFin).getTime() < Date.now()) return "EXPIRED";
  if (item.trial) return "TRIAL";
  return "ACTIVE";
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function daysText(days) {
  if (days === null || days === undefined) return "Sin fecha";
  if (days < 0) return `Vencio hace ${Math.abs(days)} d`;
  if (days === 0) return "Vence hoy";
  return `${days} d restantes`;
}

export default function SuperAdminTenants() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(() => searchParams.get("estado")?.toUpperCase() || "ALL");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      setItems(await superAdminApi.getTenants());
    } catch (e) {
      setError(e.message || "No se pudo cargar la lista.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const enrichedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        normalizedStatus: normalizeStatus(item),
      })),
    [items]
  );

  const stats = useMemo(() => {
    const base = {
      total: enrichedItems.length,
      active: 0,
      trial: 0,
      expired: 0,
      suspended: 0,
      cancelled: 0,
    };

    enrichedItems.forEach((item) => {
      const status = item.normalizedStatus.toLowerCase();
      if (status in base) base[status] += 1;
    });

    return base;
  }, [enrichedItems]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return enrichedItems.filter((item) => {
      const matchesFilter = filter === "ALL" || item.normalizedStatus === filter;
      const haystack = [
        item.businessName,
        item.ownerName,
        item.ownerEmail,
        item.plan,
        item.status,
        item.rawStatus,
        item.tenantId,
        item.code,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesFilter && (!q || haystack.includes(q));
    });
  }, [enrichedItems, filter, query]);

  async function runAction(item, action) {
    const name = item.businessName || `tenant ${item.tenantId}`;

    if (action === "delete") {
      const accepted = window.confirm(
        `Eliminar ${name}? La cuenta quedara inactiva y cancelada, pero se conservara el historial.`
      );
      if (!accepted) return;
    }

    try {
      setActionId(`${action}-${item.tenantId}`);
      setError("");

      if (action === "activate") {
        await superAdminApi.activateTenant(item.tenantId);
      }
      if (action === "suspend") {
        await superAdminApi.suspendTenant(item.tenantId);
      }
      if (action === "delete") {
        await superAdminApi.deleteTenant(item.tenantId);
      }

      await load();
    } catch (e) {
      setError(e.message || "No se pudo ejecutar la accion.");
    } finally {
      setActionId(null);
    }
  }

  function openEdit(item) {
    setError("");
    setEditError("");
    setNotice("");
    setEditingItem(item);
    setEditForm({
      businessName: item.businessName || "",
      businessType: item.businessType || "BARBERSHOP",
      country: item.country || "Peru",
      ownerName: item.ownerName || "",
      ownerEmail: item.ownerEmail || "",
      ownerPhone: item.ownerPhone || "",
      plan: item.plan || "STARTER",
      billingCycle: item.billingCycle || "MONTHLY",
      currency: item.currency || "PEN",
      price: item.price ?? "",
      status: item.normalizedStatus || "ACTIVE",
      fechaInicio: toInputDateTime(item.fechaInicio),
      fechaFin: toInputDateTime(item.fechaFin),
      observations: "",
    });
  }

  function updateEditForm(field, value) {
    setEditForm((current) => ({ ...current, [field]: value }));
  }

  async function saveEdit() {
    if (!editingItem || !editForm) return;

    try {
      setActionId(`edit-${editingItem.tenantId}`);
      setError("");
      setEditError("");
      const updated = await superAdminApi.updateTenant(editingItem.tenantId, {
        ...editForm,
        price: editForm.price === "" ? null : Number(editForm.price),
        fechaInicio: fromInputDateTime(editForm.fechaInicio),
        fechaFin: fromInputDateTime(editForm.fechaFin),
      });
      setItems((current) =>
        current.map((item) =>
          item.tenantId === editingItem.tenantId ? { ...item, ...updated } : item
        )
      );
      setEditingItem(null);
      setEditForm(null);
      setNotice(`Cuenta actualizada: ${editForm.businessName || editingItem.businessName || editingItem.tenantId}`);
      await load();
    } catch (e) {
      setEditError(e.message || "No se pudo guardar la cuenta.");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#E9DED0] bg-[#FFFCF8] p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#C06000]">
              Control total
            </p>
            <h1 className="mt-1 text-3xl font-black text-[#111111]">
              Cuentas y suscripciones
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-[#746A5D]">
              Supervisa negocios operativos, trials, vencidos y cuentas dadas de baja desde un solo lugar.
            </p>
          </div>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#E1D4C1] bg-white px-4 py-3 text-sm font-black text-[#111111] shadow-sm transition hover:border-[#AF8750] disabled:opacity-60"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="Total" value={stats.total} icon={ShieldCheck} tone="black" />
          <Metric label="Activos" value={stats.active} icon={CheckCircle2} tone="green" />
          <Metric label="Trial" value={stats.trial} icon={Clock3} tone="gold" />
          <Metric label="Vencidos" value={stats.expired} icon={AlertTriangle} tone="red" />
          <Metric label="Suspendidos" value={stats.suspended + stats.cancelled} icon={PauseCircle} tone="gray" />
        </div>
      </section>

      <section className="rounded-[2rem] border border-[#E9DED0] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8174]"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar negocio, dueno, email, plan, codigo o ID"
              className="w-full rounded-2xl border border-[#E9DED0] bg-[#FFFCF8] py-3 pl-11 pr-4 text-sm font-bold text-[#111111] outline-none focus:border-[#AF8750] focus:bg-white"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`shrink-0 rounded-2xl px-4 py-3 text-xs font-black transition ${
                  filter === item.id
                    ? "bg-[#111111] text-white"
                    : "border border-[#E9DED0] bg-white text-[#746A5D] hover:border-[#AF8750]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-3xl border border-red-100 bg-red-50 p-5 font-bold text-red-700">
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 font-bold text-emerald-800">
          {notice}
        </div>
      )}

      {loading && (
        <div className="rounded-3xl bg-white p-8 font-bold text-[#746A5D] shadow-sm">
          Cargando negocios...
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-3xl border border-[#E9DED0] bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-black">No hay negocios para mostrar</h2>
          <p className="mt-2 text-sm font-semibold text-[#746A5D]">
            Cambia el filtro o la busqueda para revisar otras cuentas.
          </p>
        </div>
      )}

      <div className="grid gap-4 2xl:grid-cols-2">
        {filtered.map((item) => (
          <TenantCard
            key={item.tenantId || item.code || JSON.stringify(item)}
            item={item}
            actionId={actionId}
            onEdit={openEdit}
            onAction={runAction}
          />
        ))}
      </div>

      {editingItem && editForm && (
        <EditTenantModal
          item={editingItem}
          form={editForm}
          saving={actionId === `edit-${editingItem.tenantId}`}
          onChange={updateEditForm}
          error={editError}
          onClose={() => {
            setEditingItem(null);
            setEditForm(null);
            setEditError("");
          }}
          onSave={saveEdit}
        />
      )}
    </div>
  );
}

function TenantCard({ item, actionId, onAction, onEdit }) {
  const status = item.normalizedStatus;
  const disabled = status === "CANCELLED";

  return (
    <article className="rounded-3xl border border-[#E9DED0] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip status={status} />
            <Chip tone={item.tenantActive === false ? "gray" : "green"}>
              {item.tenantActive === false ? "Operativo apagado" : "Operativo activo"}
            </Chip>
          </div>

          <h2 className="mt-3 text-2xl font-black leading-tight text-[#111111]">
            {item.businessName || "-"}
          </h2>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-[#8B8174]">
            ID {item.tenantId || "-"} {item.code ? `- ${item.code}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip tone="blue">{planLabel(item.plan)}</Chip>
          <Chip tone="gold">{item.billingCycle || "Sin ciclo"}</Chip>
          <Chip tone="gray">{item.currency || "-"} {item.price ?? ""}</Chip>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-2">
        <Info label="Dueno" value={item.ownerName || "-"} />
        <Info label="Email" value={item.ownerEmail || "-"} />
        <Info label="Telefono" value={item.ownerPhone || "-"} />
        <Info label="Pais" value={item.country || "-"} />
        <Info label="Vigencia" value={`${formatDate(item.fechaFin)} · ${daysText(item.daysRemaining)}`} />
      </div>

      <div className="mt-4 rounded-2xl border border-[#EFE5D8] bg-[#FFFCF8] p-4">
        <div className="grid gap-3 text-sm font-bold text-[#746A5D] sm:grid-cols-3">
          <p>
            <span className="block text-xs font-black uppercase tracking-[0.14em] text-[#A19383]">
              Estado real
            </span>
            {statusLabel(status)}
          </p>
          <p>
            <span className="block text-xs font-black uppercase tracking-[0.14em] text-[#A19383]">
              Estado guardado
            </span>
            {statusLabel(item.rawStatus)}
          </p>
          <p>
            <span className="block text-xs font-black uppercase tracking-[0.14em] text-[#A19383]">
              Inicio
            </span>
            {formatDate(item.fechaInicio)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <ActionButton
          icon={Pencil}
          label="Editar"
          loading={actionId === `edit-${item.tenantId}`}
          disabled={false}
          onClick={() => onEdit(item)}
        />
        <ActionButton
          icon={Power}
          label="Activar"
          loading={actionId === `activate-${item.tenantId}`}
          disabled={disabled || status === "ACTIVE"}
          onClick={() => onAction(item, "activate")}
        />
        <ActionButton
          icon={PauseCircle}
          label="Suspender"
          loading={actionId === `suspend-${item.tenantId}`}
          disabled={disabled || status === "SUSPENDED"}
          onClick={() => onAction(item, "suspend")}
        />
        <ActionButton
          danger
          icon={Trash2}
          label="Eliminar cuenta"
          loading={actionId === `delete-${item.tenantId}`}
          disabled={disabled}
          onClick={() => onAction(item, "delete")}
        />
      </div>
    </article>
  );
}

function EditTenantModal({ item, form, saving, error, onChange, onClose, onSave }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/45">
      <button
        type="button"
        aria-label="Cerrar editor"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
      />
      <aside className="absolute bottom-0 right-0 top-0 flex w-full max-w-3xl flex-col overflow-hidden rounded-l-[2rem] bg-white shadow-2xl">
        <div className="border-b border-[#E9DED0] bg-[#FFFCF8] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#C06000]">
                Editar cuenta
              </p>
              <h2 className="mt-1 text-2xl font-black text-[#111111]">
                {item.businessName || `Tenant ${item.tenantId}`}
              </h2>
              <p className="mt-1 text-sm font-bold text-[#746A5D]">
                ID {item.tenantId} · guarda para aplicar los cambios.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#E9DED0] bg-white text-[#111111]"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {error && (
            <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-black text-red-700">
              {error}
            </div>
          )}

          <div>
            <p className="text-sm font-black text-[#111111]">Datos comerciales</p>
            <p className="mt-1 text-xs font-bold text-[#746A5D]">
              Estos datos se veran en el control maestro y en soporte.
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Negocio" value={form.businessName} onChange={(v) => onChange("businessName", v)} />
          <SelectField
            label="Rubro"
            value={form.businessType}
            onChange={(v) => onChange("businessType", v)}
            options={BUSINESS_TYPE_OPTIONS}
          />
          <SelectField
            label="Pais"
            value={form.country}
            onChange={(v) => onChange("country", v)}
            options={COUNTRY_OPTIONS}
          />
          <Field label="Dueno" value={form.ownerName} onChange={(v) => onChange("ownerName", v)} />
          <Field label="Email dueno" value={form.ownerEmail} onChange={(v) => onChange("ownerEmail", v)} />
          <Field label="Telefono dueno" value={form.ownerPhone} onChange={(v) => onChange("ownerPhone", v)} />
          <SelectField
            label="Plan"
            value={form.plan}
            onChange={(v) => onChange("plan", v)}
            options={[
              ["FREE", "Free"],
              ["STARTER", "Starter"],
              ["GROWTH", "Growth"],
              ["PRO", "Pro"],
              ["ENTERPRISE", "Enterprise"],
              ["STARTER_LEGACY", "Starter Legacy"],
              ["PRO_LEGACY", "Pro Legacy"],
            ]}
          />
          <SelectField
            label="Ciclo"
            value={form.billingCycle}
            onChange={(v) => onChange("billingCycle", v)}
            options={[
              ["MONTHLY", "Mensual"],
              ["SEMIANNUAL", "Semestral"],
              ["YEARLY", "Anual"],
            ]}
          />
          <SelectField
            label="Moneda"
            value={form.currency}
            onChange={(v) => onChange("currency", v)}
            options={CURRENCY_OPTIONS}
          />
          <Field
            label="Precio mensual"
            type="number"
            value={form.price}
            onChange={(v) => onChange("price", v)}
            placeholder="0.00"
          />
          <SelectField
            label="Estado"
            value={form.status}
            onChange={(v) => onChange("status", v)}
            options={[
              ["ACTIVE", "Activa"],
              ["TRIAL", "Trial"],
              ["EXPIRED", "Vencida"],
              ["SUSPENDED", "Suspendida"],
              ["CANCELLED", "Eliminada"],
            ]}
          />
          <Field
            label="Inicio"
            type="datetime-local"
            value={form.fechaInicio}
            onChange={(v) => onChange("fechaInicio", v)}
          />
          <Field
            label="Fin / renovacion"
            type="datetime-local"
            value={form.fechaFin}
            onChange={(v) => onChange("fechaFin", v)}
          />
          <Field
            label="Nota interna"
            value={form.observations}
            onChange={(v) => onChange("observations", v)}
            placeholder="Motivo del cambio"
          />
          </div>
        </div>

        <div className="border-t border-[#E9DED0] bg-white p-4">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-[#E1D4C1] bg-white px-5 py-3 text-sm font-black text-[#111111]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#111111] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
          >
            {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
            Guardar cambios
          </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-[#A19383]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-[#E9DED0] bg-[#FFFCF8] px-4 py-3 text-sm font-bold text-[#111111] outline-none focus:border-[#AF8750] focus:bg-white"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-[#A19383]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-[#E9DED0] bg-[#FFFCF8] px-4 py-3 text-sm font-bold text-[#111111] outline-none focus:border-[#AF8750] focus:bg-white"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function toInputDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function fromInputDateTime(value) {
  if (!value) return null;
  return new Date(value).toISOString().slice(0, 19);
}

function Metric({ label, value, icon, tone }) {
  const IconComponent = icon;
  const tones = {
    black: "bg-[#111111] text-white",
    green: "bg-emerald-50 text-emerald-700",
    gold: "bg-[#FFF4D8] text-[#AF7200]",
    red: "bg-red-50 text-red-700",
    gray: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="rounded-3xl border border-[#E9DED0] bg-white p-4">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${tones[tone]}`}>
        <IconComponent size={20} />
      </div>
      <p className="mt-4 text-sm font-black text-[#746A5D]">{label}</p>
      <p className="text-3xl font-black text-[#111111]">{value}</p>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#EFE5D8] bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#A19383]">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black text-[#111111]">{value}</p>
    </div>
  );
}

function StatusChip({ status }) {
  const Icon = {
    ACTIVE: CheckCircle2,
    TRIAL: Clock3,
    EXPIRED: AlertTriangle,
    SUSPENDED: PauseCircle,
    CANCELLED: XCircle,
    NO_SUBSCRIPTION: AlertTriangle,
  }[status] || AlertTriangle;

  return (
    <Chip tone={statusTone(status)}>
      <Icon size={14} />
      {statusLabel(status)}
    </Chip>
  );
}

function Chip({ children, tone = "gold" }) {
  const tones = {
    gold: "bg-[#F4E8D7] text-[#AF8750]",
    blue: "bg-blue-50 text-blue-700",
    gray: "bg-gray-100 text-gray-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    black: "bg-[#111111] text-white",
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${tones[tone]}`}>
      {children}
    </span>
  );
}

function statusTone(status) {
  switch (status) {
    case "ACTIVE":
      return "green";
    case "TRIAL":
      return "gold";
    case "EXPIRED":
      return "red";
    case "SUSPENDED":
    case "CANCELLED":
      return "gray";
    default:
      return "black";
  }
}

function ActionButton({ icon, label, loading, disabled, danger = false, onClick }) {
  const IconComponent = icon;
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-45 ${
        danger
          ? "border border-red-100 bg-red-50 text-red-700 hover:bg-red-100"
          : "border border-[#E1D4C1] bg-[#FFFCF8] text-[#111111] hover:border-[#AF8750] hover:bg-white"
      }`}
    >
      {loading ? <RefreshCw size={18} className="animate-spin" /> : <IconComponent size={18} />}
      {label}
    </button>
  );
}
