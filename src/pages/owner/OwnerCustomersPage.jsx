import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  buildCustomerWhatsappUrl,
  createOwnerCustomer,
  downloadOwnerCustomersExcel,
  getInactiveOwnerCustomers,
  getOwnerCustomerCutHistory,
  getOwnerCustomerDetail,
  getOwnerCustomerHistory,
  getOwnerCustomerLoyalty,
  getOwnerCustomers,
  getOwnerCustomersReport,
  getOwnerCustomersTotal,
  updateOwnerCustomer,
  updateOwnerCustomerWhatsappConsent,
} from '../../api/ownerCustomersApi';
import { getOwnerBranches } from '../../api/ownerBranchesApi';
import { formatTenantMoney } from '../../utils/tenantMoney';

function formatMoney(value) {
  return formatTenantMoney(value);
}

function prettyDate(value) {
  if (!value) return '-';

  const raw = String(value);
  const normalized = raw.includes('T') ? raw : `${raw}T00:00:00`;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return raw;

  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function initials(name) {
  return String(name || 'Cliente')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((item) => item[0])
    .join('')
    .toUpperCase();
}

function CustomerAvatar({ customer, size = 'h-14 w-14' }) {
  if (customer?.imageUrl) {
    return (
      <img
        src={customer.imageUrl}
        alt={customer.nombreCompleto}
        className={`${size} rounded-2xl border border-neutral-200 object-cover`}
      />
    );
  }

  return (
    <div className={`${size} flex items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-lg font-black text-amber-700`}>
      {initials(customer?.nombreCompleto)}
    </div>
  );
}

function BarberHistoryAvatar({ photoUrl, name }) {
  const cleanUrl = String(photoUrl || '').trim();

  if (cleanUrl) {
    return (
      <img
        src={cleanUrl}
        alt={name || 'Barbero'}
        className="h-14 w-14 rounded-2xl border border-amber-100 object-cover shadow-sm"
        onError={(event) => {
          event.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-lg font-black text-amber-700">
      {initials(name || 'Barbero')}
    </div>
  );
}

function ErrorBox({ message }) {
  if (!message) return null;

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
      {message}
    </div>
  );
}

function StatCard({ label, value, tone = 'default' }) {
  const toneClasses = {
    default: 'border-neutral-200 bg-white text-neutral-950',
    gold: 'border-amber-200 bg-amber-50 text-amber-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
  };

  return (
    <div className={`rounded-[24px] border p-4 shadow-[0_14px_35px_rgba(15,23,42,0.04)] ${toneClasses[tone]}`}>
      <div className="text-sm font-bold text-neutral-500">{label}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
    </div>
  );
}

function ModalShell({ title, subtitle, children, onClose, maxWidth = 'max-w-4xl' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 px-4 py-8 backdrop-blur-sm">
      <div className={`max-h-[92vh] w-full ${maxWidth} overflow-auto rounded-[34px] border border-white/10 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.35)]`}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
              {subtitle}
            </div>
            <h2 className="mt-1 text-2xl font-black text-neutral-950">
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-black text-neutral-700 hover:bg-neutral-100"
          >
            Cerrar
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-neutral-700">{label}</span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-bold text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-amber-400"
      />
    </label>
  );
}

function CustomerFormModal({ customer, onClose, onSaved }) {
  const isEdit = Boolean(customer?.id);

  const [nombres, setNombres] = useState(customer?.nombres || customer?.nombreCompleto || '');
  const [apellidos, setApellidos] = useState(customer?.apellidos || '');
  const [telefono, setTelefono] = useState(customer?.telefono || '');
  const [email, setEmail] = useState(customer?.email || '');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMsg('');

    if (!String(nombres).trim()) {
      setErrorMsg('Ingresa el nombre del cliente.');
      return;
    }

    const cleanPhone = String(telefono || '').replace(/[^0-9]/g, '');

    if (cleanPhone.length < 6) {
      setErrorMsg('Ingresa un teléfono válido.');
      return;
    }

    setSaving(true);

    try {
      const saved = isEdit
        ? await updateOwnerCustomer({
            customerId: customer.id,
            nombres,
            apellidos,
            telefono: cleanPhone,
            email,
          })
        : await createOwnerCustomer({
            nombres,
            apellidos,
            telefono: cleanPhone,
            email,
          });

      onSaved(saved);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo guardar el cliente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title={isEdit ? 'Editar cliente' : 'Nuevo cliente'}
      subtitle="Clientes"
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorBox message={errorMsg} />

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Nombre"
            value={nombres}
            onChange={setNombres}
            placeholder="Ej. Carlos"
          />

          <InputField
            label="Apellido"
            value={apellidos}
            onChange={setApellidos}
            placeholder="Opcional"
          />
        </div>

        <InputField
          label="Teléfono"
          value={telefono}
          onChange={setTelefono}
          placeholder="Ej. 987654321"
        />

        <InputField
          label="Correo"
          value={email}
          onChange={setEmail}
          placeholder="Opcional"
          type="email"
        />

        <button
          disabled={saving}
          className="w-full rounded-2xl bg-neutral-950 px-5 py-4 font-black text-white transition hover:scale-[1.01] disabled:opacity-60"
        >
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear cliente'}
        </button>
      </form>
    </ModalShell>
  );
}

function HistorySummaryCard({ label, value, icon }) {
  return (
    <div className="rounded-[22px] border border-neutral-200 bg-neutral-50 p-4">
      <div className="text-xl">{icon}</div>
      <div className="mt-2 text-2xl font-black text-neutral-950">{value}</div>
      <div className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-neutral-400">
        {label}
      </div>
    </div>
  );
}

function HistoryItemRow({ item }) {
  const isProduct = String(item.tipo || '').toUpperCase().includes('PRODUCT');

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
        isProduct
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-amber-50 text-amber-700'
      }`}>
        {isProduct ? '📦' : '✂️'}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-black text-neutral-950">
          {item.nombre || 'Item'}
        </div>
        <div className="mt-1 text-xs font-bold text-neutral-500">
          Cant. {item.cantidad || 1} · {formatMoney(item.precioUnitario || 0)}
        </div>
      </div>

      <div className="shrink-0 text-right text-sm font-black text-neutral-950">
        {formatMoney(item.subtotal || 0)}
      </div>
    </div>
  );
}

function HistoryVisitCard({ item }) {
  const [expanded, setExpanded] = useState(false);
  const hasItems = Array.isArray(item.items) && item.items.length > 0;

  return (
    <div className="overflow-hidden rounded-[26px] border border-amber-100 bg-white shadow-[0_14px_35px_rgba(15,23,42,0.04)]">
      <button
        type="button"
        onClick={() => hasItems && setExpanded((value) => !value)}
        className={`w-full p-4 text-left ${hasItems ? 'cursor-pointer hover:bg-amber-50/30' : ''}`}
      >
        <div className="flex items-start gap-4">
          <BarberHistoryAvatar
            photoUrl={item.barberPhotoUrl}
            name={item.barbero}
          />

          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-black text-neutral-950">
              {item.servicio}
            </div>

            <div className="mt-2 flex items-center gap-2 text-sm font-bold text-neutral-500">
              <span>👤</span>
              <span className="truncate">{item.barbero}</span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-bold text-neutral-400">
              <span>📅</span>
              <span>{prettyDate(item.fecha)}</span>

              {hasItems && (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700">
                  {item.items.length} items
                </span>
              )}
            </div>

            {item.observacion && (
              <div className="mt-2 rounded-2xl bg-neutral-50 px-3 py-2 text-sm font-bold text-neutral-600">
                {item.observacion}
              </div>
            )}
          </div>

          <div className="shrink-0 text-right">
            <div className="rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-black text-neutral-950">
              {item.monto > 0 ? formatMoney(item.monto) : '-'}
            </div>

            {hasItems && (
              <div className="mt-2 text-xl font-black text-neutral-400">
                {expanded ? '⌃' : '⌄'}
              </div>
            )}

            {item.puntos > 0 && (
              <div className="mt-2 text-xs font-black text-emerald-600">
                +{item.puntos} pts
              </div>
            )}
          </div>
        </div>
      </button>

      {expanded && hasItems && (
        <div className="border-t border-neutral-100 bg-white px-4 pb-4">
          <div className="pt-4">
            <div className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-neutral-400">
              Servicios y productos de esta visita
            </div>

            <div className="space-y-2">
              {item.items.map((detailItem, index) => (
                <HistoryItemRow
                  key={`${detailItem.id || index}-${detailItem.nombre}`}
                  item={detailItem}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CutHistoryCard({ item }) {
  const subtitle = [item.descripcion, item.barbero, item.sede]
    .filter(Boolean)
    .join(' - ');

  return (
    <div className="rounded-[22px] border border-amber-100 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-lg font-black text-amber-700">
          C
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-black text-neutral-950">
            {item.nombre}
          </div>

          {subtitle && (
            <div className="mt-1 line-clamp-2 text-sm font-bold text-neutral-500">
              {subtitle}
            </div>
          )}

          <div className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-neutral-400">
            {prettyDate(item.fecha)}
          </div>

          {item.observacion && (
            <div className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-bold text-neutral-600">
              Obs: {item.observacion}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function customerStatusMeta(status) {
  const code = String(status || "NEW").toUpperCase();
  const values = {
    VIP: { label: "VIP", className: "border-amber-300 bg-amber-100 text-amber-800" },
    FREQUENT: { label: "Frecuente", className: "border-emerald-300 bg-emerald-100 text-emerald-800" },
    INACTIVE: { label: "Inactivo", className: "border-red-300 bg-red-100 text-red-800" },
    NEW: { label: "Nuevo", className: "border-blue-300 bg-blue-100 text-blue-800" },
  };
  return values[code] || values.NEW;
}

function CustomerDetailModal({
  customer,
  detail,
  history,
  cutHistory,
  loyalty,
  loading,
  onClose,
  onEdit,
  onWhatsapp,
  onCreateAppointment,
}) {
  const pointsAvailable =
    loyalty?.puntosDisponibles ?? detail?.puntosDisponibles ?? customer?.puntosDisponibles ?? 0;

  const pointsAccumulated =
    loyalty?.puntosAcumulados ?? detail?.puntosAcumulados ?? customer?.puntosAcumulados ?? 0;
  const statusMeta = customerStatusMeta(loyalty?.customerStatus);

  const totalSpent = history.reduce(
    (acc, item) => acc + Number(item.monto || 0),
    0
  );

  const totalItems = history.reduce((acc, item) => {
    const count = Array.isArray(item.items) && item.items.length > 0 ? item.items.length : 1;
    return acc + count;
  }, 0);

  const visibleCutHistory = cutHistory.length > 0
    ? cutHistory
    : history
        .filter((item) => String(item.servicio || '').trim())
        .map((item) => ({
          id: item.id,
          fecha: item.fecha,
          nombre: item.servicio,
          descripcion: '',
          observacion: item.observacion,
          barbero: item.barbero,
          sede: '',
        }));

  return (
    <ModalShell
      title={customer?.nombreCompleto || 'Cliente'}
      subtitle="Ficha del cliente"
      onClose={onClose}
      maxWidth="max-w-6xl"
    >
      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 font-black text-neutral-500">
          Cargando ficha del cliente...
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-5">
            <div className="overflow-hidden rounded-[30px] border border-neutral-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <div className="relative bg-[linear-gradient(135deg,#090909_0%,#111827_54%,#2A2414_100%)] p-5 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(251,191,36,0.22),transparent_32%)]" />

                <div className="relative flex items-start gap-4">
                  <CustomerAvatar customer={customer} size="h-20 w-20" />

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">
                      Ficha del cliente
                    </div>

                    <h3 className="mt-2 truncate text-2xl font-black">
                      {customer?.nombreCompleto}
                    </h3>

                    <span className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusMeta.className}`}>
                      {statusMeta.label}
                    </span>

                    <div className="mt-2 text-sm font-bold text-white/65">
                      {customer?.telefono || 'Sin teléfono'}
                    </div>

                    {customer?.email && (
                      <div className="mt-1 truncate text-sm font-bold text-white/50">
                        {customer.email}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <StatCard label="Puntos disponibles" value={pointsAvailable} tone="gold" />
                  <StatCard label="Puntos acumulados" value={pointsAccumulated} tone="green" />
                  <StatCard label="Visitas completadas" value={loyalty?.completedVisits || 0} tone="default" />
                  <StatCard label="No-show" value={loyalty?.noShows || 0} tone="default" />
                </div>

                <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                  <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-black text-neutral-950">Preferencias WhatsApp</p><p className="mt-1 text-xs font-semibold text-neutral-500">Controla mensajes operativos y promociones.</p></div>{(detail?.whatsappOptedOutAt || customer?.whatsappOptedOutAt) && <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">Baja total</span>}</div>
                  <div className="mt-3 space-y-2">{[["Mensajes operativos","Recibos, citas y recordatorios","transactional",detail?.whatsappTransactionalEnabled ?? customer?.whatsappTransactionalEnabled],["Promociones","Campañas y ofertas comerciales","marketing",detail?.whatsappMarketingEnabled ?? customer?.whatsappMarketingEnabled]].map(([title,helper,key,enabled]) => <button key={key} type="button" disabled={consentSaving} onClick={() => onWhatsappConsent(key, !enabled)} className="flex w-full items-center gap-3 rounded-xl border border-white bg-white p-3 text-left disabled:opacity-60"><span className={`h-6 w-11 rounded-full p-1 transition ${enabled ? "bg-emerald-500" : "bg-neutral-300"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${enabled ? "translate-x-5" : ""}`} /></span><span className="flex-1"><span className="block text-sm font-black text-neutral-900">{title}</span><span className="block text-xs font-semibold text-neutral-500">{helper}</span></span></button>)}</div>
                  <button type="button" disabled={consentSaving} onClick={() => onWhatsappConsent("optout", !(detail?.whatsappOptedOutAt || customer?.whatsappOptedOutAt))} className="mt-3 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 disabled:opacity-60">{(detail?.whatsappOptedOutAt || customer?.whatsappOptedOutAt) ? "Reactivar WhatsApp" : "Dar de baja todo WhatsApp"}</button>
                </div>
                <div className="mt-5 grid gap-3">
                  <button
                    type="button"
                    onClick={() => onWhatsapp(customer)}
                    className="rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-black text-white shadow-[0_16px_35px_rgba(16,185,129,0.18)] transition hover:scale-[1.01] hover:bg-emerald-600"
                  >
                    Enviar WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={() => onCreateAppointment(customer)}
                    className="rounded-2xl bg-amber-400 px-5 py-4 text-sm font-black text-neutral-950 shadow-[0_16px_35px_rgba(251,191,36,0.18)] transition hover:scale-[1.01]"
                  >
                    Crear cita para este cliente
                  </button>

                  <button
                    type="button"
                    onClick={() => onEdit(customer)}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-4 text-sm font-black text-neutral-700 hover:bg-neutral-100"
                  >
                    Editar datos del cliente
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-neutral-200 bg-white p-5">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
                Resumen
              </div>

              <div className="mt-4 grid gap-4">
                <div>
                  <div className="text-sm font-black text-neutral-500">Última visita</div>
                  <div className="mt-1 text-lg font-black text-neutral-950">
                    {prettyDate(detail?.ultimaVisita || customer?.ultimaVisita)}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-black text-neutral-500">Último servicio</div>
                  <div className="mt-1 text-lg font-black text-neutral-950">
                    {detail?.ultimoServicio || customer?.ultimoServicio || history?.[0]?.servicio || '-'}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-black text-neutral-500">Último barbero</div>
                  <div className="mt-1 text-lg font-black text-neutral-950">
                    {detail?.ultimoBarbero || customer?.ultimoBarbero || history?.[0]?.barbero || '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[28px] border border-amber-100 bg-amber-50/45 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                    Historial tecnico
                  </div>
                  <h3 className="mt-1 text-2xl font-black text-neutral-950">
                    Cortes del cliente
                  </h3>
                </div>

                <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-amber-700">
                  {visibleCutHistory.length} cortes
                </span>
              </div>

              {visibleCutHistory.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-amber-200 bg-white/80 p-6 text-center">
                  <div className="text-base font-black text-neutral-950">
                    Sin cortes tecnicos guardados
                  </div>
                  <p className="mt-2 text-sm font-bold text-neutral-500">
                    Cuando se registre el corte realizado, aparecera aqui.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {visibleCutHistory.map((item) => (
                    <CutHistoryCard
                      key={`${item.id}-${item.fecha}-${item.nombre}`}
                      item={item}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
                  Historial
                </div>
                <h3 className="mt-1 text-2xl font-black text-neutral-950">
                  Visitas, cortes y productos
                </h3>
              </div>

              <span className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-black text-neutral-700">
                {history.length} registros
              </span>
            </div>

            {history.length > 0 && (
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <HistorySummaryCard label="Visitas" value={history.length} icon="📅" />
                <HistorySummaryCard label="Items" value={totalItems} icon="✂️" />
                <HistorySummaryCard label="Total" value={formatMoney(totalSpent)} icon="💰" />
              </div>
            )}

            {history.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
                <div className="text-lg font-black text-neutral-950">
                  Sin historial todavía
                </div>
                <p className="mt-2 text-sm font-bold text-neutral-500">
                  Cuando se registren ventas, cortes o atenciones, aparecerán aquí.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {history.map((item) => (
                  <HistoryVisitCard
                    key={`${item.tipo}-${item.id}-${item.fecha}`}
                    item={item}
                  />
                ))}
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

function CustomerCard({ customer, onOpen, onWhatsapp }) {
  return (
    <article
      onClick={() => onOpen(customer)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onOpen(customer);
      }}
      className="group cursor-pointer rounded-[28px] border border-neutral-200 bg-white p-5 text-left shadow-[0_14px_35px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-[0_20px_55px_rgba(15,23,42,0.08)]"
    >
      <div className="flex items-start gap-4">
        <CustomerAvatar customer={customer} />

        <div className="min-w-0 flex-1">
          <div className="truncate text-xl font-black text-neutral-950">
            {customer.nombreCompleto}
          </div>

          <div className="mt-1 text-sm font-bold text-neutral-500">
            {customer.telefono || 'Sin teléfono'}
          </div>
        </div>

        <div className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-500 group-hover:bg-amber-50 group-hover:text-amber-700">
          Ver
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <div className="text-xs font-black text-amber-700">Puntos</div>
          <div className="mt-1 text-2xl font-black text-neutral-950">
            {customer.puntosDisponibles}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
          <div className="text-xs font-black text-neutral-500">Visitas</div>
          <div className="mt-1 text-2xl font-black text-neutral-950">
            {customer.visitas || '-'}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-neutral-50 px-4 py-3">
        <div className="text-xs font-black uppercase tracking-[0.12em] text-neutral-400">
          Última atención
        </div>
        <div className="mt-1 text-sm font-black text-neutral-950">
          {customer.ultimoServicio || 'Sin datos'}
        </div>
        <div className="text-sm font-bold text-neutral-500">
          {customer.ultimoBarbero || 'Sin barbero'} · {prettyDate(customer.ultimaVisita)}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onWhatsapp(customer);
          }}
          className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-600"
        >
          WhatsApp
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpen(customer);
          }}
          className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-black text-neutral-700 transition hover:bg-neutral-50"
        >
          Ver historial
        </button>
      </div>
    </article>
  );
}

function CustomerSearchResult({ customer, onOpen, onWhatsapp }) {
  return (
    <article
      onClick={() => onOpen(customer)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onOpen(customer);
      }}
      className="flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-left transition hover:border-amber-300 hover:bg-white hover:shadow-[0_12px_28px_rgba(15,23,42,0.06)]"
    >
      <CustomerAvatar customer={customer} size="h-12 w-12" />

      <div className="min-w-0 flex-1">
        <div className="truncate text-lg font-black text-neutral-950">
          {customer.nombreCompleto}
        </div>
        <div className="mt-1 text-sm font-bold text-neutral-500">
          {customer.telefono || 'Sin telefono'}
        </div>
      </div>

      <div className="hidden rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-black text-amber-700 sm:block">
        {customer.puntosDisponibles || 0} pts
      </div>

      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onWhatsapp(customer);
          }}
          className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-600"
        >
          WhatsApp
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpen(customer);
          }}
          className="rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white"
        >
          Ver ficha
        </button>
      </div>
    </article>
  );
}

function InactiveCustomersPanel({
  days,
  onDaysChange,
  customers,
  loading,
  errorMsg,
  onRefresh,
}) {
  const dayOptions = [15, 30, 60, 90];

  return (
    <section className="overflow-hidden rounded-[30px] border border-amber-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="relative bg-[linear-gradient(135deg,#090909_0%,#111827_52%,#2A2414_100%)] p-5 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(251,191,36,0.22),transparent_36%),radial-gradient(circle_at_100%_0%,rgba(16,185,129,0.14),transparent_34%)]" />

        <div className="relative flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.20em] text-amber-300">
              Fidelización
            </div>

            <h3 className="mt-4 text-2xl font-black tracking-tight">
              Clientes inactivos
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/65">
              Detecta clientes que no regresan hace varios días y envíales un mensaje rápido por WhatsApp.
            </p>
          </div>

          
          <div className="flex flex-wrap gap-2">
            {dayOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onDaysChange(option)}
                className={
                  days === option
                    ? 'rounded-2xl bg-amber-400 px-4 py-3 text-xs font-black text-neutral-950 shadow-[0_14px_28px_rgba(251,191,36,0.18)]'
                    : 'rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-black text-white/75 transition hover:bg-white/15 hover:text-white'
                }
              >
                {option} días
              </button>
            ))}

            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-black text-white/75 transition hover:bg-white/15 hover:text-white disabled:opacity-60"
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-5">
        {errorMsg && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm font-black text-neutral-500">
            Buscando clientes inactivos...
          </div>
        ) : customers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-7 text-center">
            <div className="text-2xl">🎉</div>
            <div className="mt-2 text-lg font-black text-neutral-950">
              No hay clientes inactivos en este rango
            </div>
            <p className="mx-auto mt-2 max-w-xl text-sm font-bold leading-6 text-neutral-500">
              Prueba con 15, 30, 60 o 90 días para encontrar clientes que necesitan seguimiento.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {customers.map((customer) => {
              const whatsappUrl = buildCustomerWhatsappUrl({
                telefono: customer.telefono,
                nombre: customer.nombre,
              });

              return (
                <div
                  key={customer.customerId || customer.id}
                  className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-sm font-black text-amber-700">
                        {initials(customer.nombre)}
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-lg font-black text-neutral-950">
                          {customer.nombre || 'Cliente'}
                        </div>
                        <div className="mt-1 text-sm font-bold text-neutral-500">
                          {customer.telefono || 'Sin teléfono'}
                        </div>
                        <div className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-neutral-400">
                          Última visita: {prettyDate(customer.ultimaVisita)}
                        </div>
                      </div>
                    </div>

                    {whatsappUrl ? (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 rounded-2xl bg-emerald-500 px-5 py-3 text-center text-sm font-black text-white shadow-[0_14px_28px_rgba(16,185,129,0.18)] transition hover:scale-[1.01] hover:bg-emerald-600"
                      >
                        WhatsApp
                      </a>
                    ) : (
                      <span className="shrink-0 rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-center text-sm font-black text-neutral-400">
                        Sin teléfono
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function CustomerReportPanel({ report, loading, error, status, onStatusChange, from, to, onFromChange, onToChange, branchId, onBranchChange, branches, lastVisitFrom, lastVisitTo, onLastVisitFromChange, onLastVisitToChange }) {
  const summary = report?.summary;
  const items = Array.isArray(report?.items) ? report.items : [];
  const statuses = [
    ['ALL', 'Todos', 'Base completa con los filtros activos', summary?.totalFiltered],
    ['NEW', 'Nuevos', 'Clientes recientes o con pocas visitas', summary?.newCustomers],
    ['FREQUENT', 'Frecuentes', '3+ visitas y buen retorno', summary?.frequentCustomers],
    ['VIP', 'VIP', '10+ visitas o 500+ puntos', summary?.vipCustomers],
    ['INACTIVE', 'Inactivos +60d', 'Ultima visita hace mas de 60 dias', summary?.inactiveCustomers],
  ];
  const variation = Number(summary?.registeredVariationPercent || 0);
  const variationLabel = `${variation > 0 ? '+' : ''}${variation.toFixed(1)}%`;
  const fieldClass = 'mt-1 h-12 w-full min-w-0 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-[13px] font-black text-neutral-950 outline-none transition [color-scheme:light] placeholder:text-neutral-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100';

  return (
    <section className="overflow-hidden rounded-[34px] border border-amber-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <div className="grid gap-5 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_48%,#ecfeff_100%)] p-5 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr]">
        <div className="rounded-[28px] bg-neutral-950 p-5 text-white shadow-[0_18px_44px_rgba(15,23,42,0.22)]">
          <div className="inline-flex rounded-full bg-amber-300 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-950">
            Segmentacion
          </div>
          <h3 className="mt-4 text-3xl font-black leading-tight">
            Reporte inteligente de clientes
          </h3>
          <p className="mt-3 text-sm font-semibold leading-6 text-white/65">
            Filtra por registro, sede, ultima visita y segmento. Los resultados muestran clientes reales para campañas o seguimiento.
          </p>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/45">Regla de segmentos</p>
            <p className="mt-2 text-xs font-bold leading-5 text-white/70">VIP: 10+ visitas o 500+ puntos. Frecuente: 3+ visitas. Inactivo: ultima visita mayor a 60 dias.</p>
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            <label className="min-w-0 text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
              Reg. desde
              <input type="date" value={from} onChange={(event) => onFromChange(event.target.value)} className={fieldClass} />
            </label>
            <label className="min-w-0 text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
              Reg. hasta
              <input type="date" value={to} onChange={(event) => onToChange(event.target.value)} className={fieldClass} />
            </label>
            <label className="min-w-0 text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
              Sede
              <select value={branchId} onChange={(event) => onBranchChange(event.target.value)} className={fieldClass}>
                <option value="">Todas</option>
                {branches.map((branch) => (
                  <option key={branch.id ?? branch.branchId} value={branch.id ?? branch.branchId}>
                    {branch.nombre ?? branch.name ?? branch.label ?? 'Sede'}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-0 text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
              Visita desde
              <input type="date" value={lastVisitFrom} onChange={(event) => onLastVisitFromChange(event.target.value)} className={fieldClass} />
            </label>
            <label className="min-w-0 text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
              Visita hasta
              <input type="date" value={lastVisitTo} onChange={(event) => onLastVisitToChange(event.target.value)} className={fieldClass} />
            </label>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            {statuses.map(([value, label, description, count]) => (
              <button
                key={value}
                type="button"
                onClick={() => onStatusChange(value)}
                className={`min-w-0 rounded-2xl border px-3 py-3 text-left transition ${
                  status === value
                    ? 'border-neutral-950 bg-neutral-950 text-white shadow-[0_14px_28px_rgba(15,23,42,0.22)]'
                    : 'border-neutral-200 bg-white text-neutral-800 hover:border-amber-300 hover:bg-amber-50'
                }`}
              >
                <span className="block text-sm font-black leading-5">{label}</span>
                <span className={`mt-1 block text-[10.5px] font-bold leading-4 ${status === value ? 'text-white/65' : 'text-neutral-500'}`}>{description}</span>
                {summary ? <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-black ${status === value ? 'bg-white/15 text-white' : 'bg-neutral-100 text-neutral-700'}`}>{Number(count || 0)}</span> : null}
              </button>
            ))}
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-700">{error}</div>
          ) : loading && !summary ? (
            <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-5 text-sm font-black text-neutral-500">Cargando reporte de clientes...</div>
          ) : summary ? (
            <>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <ReportMetric label="Nuevos" value={summary.totalRegistered} helper={`Anterior ${summary.previousRegistered}`} tone="blue" />
                <ReportMetric label="Variacion" value={variationLabel} helper={`${report.from} - ${report.to}`} tone={variation >= 0 ? 'green' : 'red'} />
                <ReportMetric label="Valor total" value={formatMoney(summary.totalSpent)} helper={`Ticket ${formatMoney(summary.averageSpent)}`} tone="amber" />
                <ReportMetric label="WhatsApp MKT" value={summary.withMarketingWhatsapp} helper={`Bajas ${summary.optedOutWhatsapp}`} tone="teal" />
              </div>

              <div className="flex flex-wrap gap-2">
                <SegmentPill label="VIP" value={summary.vipCustomers} />
                <SegmentPill label="Frecuentes" value={summary.frequentCustomers} />
                <SegmentPill label="Nuevos" value={summary.newCustomers} />
                <SegmentPill label="Inactivos" value={summary.inactiveCustomers} />
                <SegmentPill label="Filtrados" value={summary.totalFiltered} />
              </div>

              <CustomerReportResults items={items} activeStatus={status} loading={loading} />
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function CustomerReportResults({ items, activeStatus, loading }) {
  const visible = items.slice(0, 8);
  const activeLabel = customerStatusMeta(activeStatus).label;

  return (
    <div className="rounded-[26px] border border-neutral-200 bg-white/85 p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-neutral-400">Clientes encontrados</p>
          <h4 className="text-lg font-black text-neutral-950">{activeStatus === 'ALL' ? 'Resultado del filtro' : `Segmento ${activeLabel}`}</h4>
        </div>
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-700">{items.length} visibles</span>
      </div>

      {loading ? (
        <div className="mt-4 rounded-2xl bg-neutral-50 px-4 py-4 text-sm font-black text-neutral-500">Actualizando clientes...</div>
      ) : visible.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-neutral-50 px-4 py-4 text-sm font-black text-neutral-500">No hay clientes para estos filtros.</div>
      ) : (
        <div className="mt-4 grid gap-2">
          {visible.map((item) => {
            const meta = customerStatusMeta(item.status);
            return (
              <div key={`${item.customerId}-${item.status}`} className="grid gap-3 rounded-2xl border border-neutral-100 bg-white p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-black text-neutral-950">{item.fullName}</p>
                    <span className={`rounded-full border px-2 py-1 text-[10px] font-black ${meta.className}`}>{meta.label}</span>
                  </div>
                  <p className="mt-1 truncate text-xs font-bold text-neutral-500">
                    {item.branchName || 'Sin sede'} · {item.visits} visitas · Ult. visita {item.lastVisit ? item.lastVisit.slice(0, 10) : 'sin venta'}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-black text-neutral-950">{formatMoney(item.totalSpent)}</p>
                  <p className="text-xs font-bold text-neutral-500">{item.points} puntos</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
function ReportMetric({ label, value, helper, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    amber: 'bg-amber-50 text-amber-800 border-amber-100',
    teal: 'bg-teal-50 text-teal-700 border-teal-100',
  };

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone] || tones.blue}`}>
      <div className="text-[11px] font-black uppercase tracking-[0.14em] opacity-80">{label}</div>
      <div className="mt-2 text-2xl font-black text-neutral-950">{value}</div>
      <div className="mt-1 truncate text-xs font-bold opacity-75">{helper}</div>
    </div>
  );
}

function SegmentPill({ label, value }) {
  return (
    <span className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-black text-neutral-700 shadow-sm">
      {label}: {value}
    </span>
  );
}
export default function OwnerCustomersPage() {
  const navigate = useNavigate();
  const customersRequestId = useRef(0);
  const customerResultsRef = useRef(null);

  const [customers, setCustomers] = useState([]);
  const [totalCustomers, setTotalCustomers] = useState(null);
  const [query, setQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [exporting, setExporting] = useState(false);
  const [customerReport, setCustomerReport] = useState(null);
  const [customerReportLoading, setCustomerReportLoading] = useState(true);
  const [customerReportError, setCustomerReportError] = useState('');
  const [customerReportStatus, setCustomerReportStatus] = useState('ALL');
  const [customerReportFrom, setCustomerReportFrom] = useState('');
  const [customerReportTo, setCustomerReportTo] = useState('');
  const [customerReportBranchId, setCustomerReportBranchId] = useState('');
  const [customerReportLastVisitFrom, setCustomerReportLastVisitFrom] = useState('');
  const [customerReportLastVisitTo, setCustomerReportLastVisitTo] = useState('');
  const [branches, setBranches] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [customerHistory, setCustomerHistory] = useState([]);
  const [customerCutHistory, setCustomerCutHistory] = useState([]);
  const [customerLoyalty, setCustomerLoyalty] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [consentSaving, setConsentSaving] = useState(false);

  const [inactiveDays, setInactiveDays] = useState(30);
  const [inactiveCustomers, setInactiveCustomers] = useState([]);
  const [inactiveLoading, setInactiveLoading] = useState(false);
  const [inactiveErrorMsg, setInactiveErrorMsg] = useState('');

  const totalPoints = useMemo(() => {
    return customers.reduce(
      (acc, item) => acc + Number(item.puntosDisponibles || 0),
      0
    );
  }, [customers]);

  const withPhone = useMemo(() => {
    return customers.filter((item) => String(item.telefono || '').trim()).length;
  }, [customers]);

  const cleanQuery = query.trim();
  const isSearching = cleanQuery.length > 0;

  async function loadCustomers(nextQuery = query) {
    const requestId = customersRequestId.current + 1;
    customersRequestId.current = requestId;

    setLoading(true);
    setErrorMsg('');

    try {
      const [data, total] = await Promise.all([
        getOwnerCustomers({ query: nextQuery, limit: 80 }),
        getOwnerCustomersTotal(),
      ]);
      setTotalCustomers(total);

      if (requestId !== customersRequestId.current) return;

      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      if (requestId !== customersRequestId.current) return;

      setCustomers([]);
      setErrorMsg(error.message || 'No se pudieron cargar los clientes.');
    } finally {
      if (requestId === customersRequestId.current) {
        setLoading(false);
      }
    }
  }



  async function loadCustomerReport({ nextQuery = query, status = customerReportStatus, from = customerReportFrom, to = customerReportTo, branchId = customerReportBranchId, lastVisitFrom = customerReportLastVisitFrom, lastVisitTo = customerReportLastVisitTo } = {}) {
    setCustomerReportLoading(true);
    setCustomerReportError('');

    try {
      const data = await getOwnerCustomersReport({
        query: nextQuery,
        from,
        to,
        branchId,
        status,
        lastVisitFrom,
        lastVisitTo,
        limit: 250,
      });
      setCustomerReport(data);
    } catch (error) {
      setCustomerReport(null);
      setCustomerReportError(error.message || 'No se pudo cargar el reporte de clientes.');
    } finally {
      setCustomerReportLoading(false);
    }
  }
  async function loadInactiveCustomers(days = inactiveDays) {
    setInactiveLoading(true);
    setInactiveErrorMsg('');

    try {
      const data = await getInactiveOwnerCustomers(days);
      setInactiveCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      setInactiveCustomers([]);
      setInactiveErrorMsg(error.message || 'No se pudieron cargar los clientes inactivos.');
    } finally {
      setInactiveLoading(false);
    }
  }

  async function openCustomerDetail(customer) {
    setSelectedCustomer(customer);
    setCustomerDetail(null);
    setCustomerHistory([]);
    setCustomerCutHistory([]);
    setCustomerLoyalty(null);
    setLoadingDetail(true);

    try {
      const [detail, history, cutHistory, loyalty] = await Promise.all([
        getOwnerCustomerDetail(customer.id),
        getOwnerCustomerHistory(customer.id),
        getOwnerCustomerCutHistory(customer.id),
        getOwnerCustomerLoyalty(customer.id),
      ]);

      setCustomerDetail(detail);
      setCustomerHistory(history);
      setCustomerCutHistory(cutHistory);
      setCustomerLoyalty(loyalty);
    } catch {
      setCustomerDetail(null);
      setCustomerHistory([]);
      setCustomerCutHistory([]);
      setCustomerLoyalty(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function updateWhatsappConsent(kind, enabled) {
    if (!selectedCustomer) return;
    const current = customerDetail || selectedCustomer;
    setConsentSaving(true);
    try {
      const saved = await updateOwnerCustomerWhatsappConsent({
        customerId: selectedCustomer.id,
        transactionalEnabled: kind === "transactional" ? enabled : current.whatsappTransactionalEnabled,
        marketingEnabled: kind === "marketing" ? enabled : current.whatsappMarketingEnabled,
        optedOut: kind === "optout" ? enabled : false,
      });
      setSelectedCustomer((previous) => ({ ...previous, ...saved }));
      setCustomerDetail((previous) => ({ ...previous, ...saved }));
      setCustomers((items) => items.map((item) => item.id === saved.id ? { ...item, ...saved } : item));
    } catch (error) { setErrorMsg(error.message || "No se pudo actualizar WhatsApp."); }
    finally { setConsentSaving(false); }
  }
  async function exportCustomers() {
    setExporting(true);
    setErrorMsg('');
    try {
      const { blob, filename } = await downloadOwnerCustomersExcel();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
      URL.revokeObjectURL(url);
    } catch (error) { setErrorMsg(error.message || 'No se pudo descargar el Excel.'); }
    finally { setExporting(false); }
  }

  function openCreateForm() {
    setEditingCustomer(null);
    setShowForm(true);
  }

  function handleSavedCustomer(saved) {
    setShowForm(false);
    setEditingCustomer(null);

    setCustomers((prev) => {
      const exists = prev.some((item) => item.id === saved.id);

      if (exists) {
        return prev.map((item) => (item.id === saved.id ? { ...item, ...saved } : item));
      }

      return [saved, ...prev];
    });

    if (selectedCustomer?.id === saved.id) {
      setSelectedCustomer((prev) => ({ ...prev, ...saved }));
    }
  }

  function createAppointmentForCustomer(customer) {
    const payload = {
      customerId: customer.id,
      customerName: customer.nombreCompleto,
      customerPhone: customer.telefono,
    };

    window.sessionStorage.setItem(
      'ownerWebPreselectedCustomer',
      JSON.stringify(payload)
    );

    navigate('/owner/agenda');
  }

  function openCustomerWhatsapp(customer) {
    const whatsappUrl = buildCustomerWhatsappUrl({
      telefono: customer?.telefono,
      nombre: customer?.nombreCompleto || customer?.nombre || 'cliente',
    });

    if (!whatsappUrl) {
      window.alert('Este cliente no tiene telefono para WhatsApp.');
      return;
    }

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }

  useEffect(() => {
    loadCustomers('');
  }, []);

  useEffect(() => {
    loadInactiveCustomers(inactiveDays);
  }, [inactiveDays]);

  useEffect(() => {
    getOwnerBranches({ onlyActive: true })
      .then((data) => setBranches(Array.isArray(data) ? data : []))
      .catch(() => setBranches([]));
  }, []);

  useEffect(() => {
    loadCustomerReport({ status: customerReportStatus, from: customerReportFrom, to: customerReportTo, branchId: customerReportBranchId, lastVisitFrom: customerReportLastVisitFrom, lastVisitTo: customerReportLastVisitTo });
  }, [customerReportStatus, customerReportFrom, customerReportTo, customerReportBranchId, customerReportLastVisitFrom, customerReportLastVisitTo]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadCustomers(query);
      loadCustomerReport({ nextQuery: query });
    }, 450);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!isSearching || loading) return;

    const frameId = window.requestAnimationFrame(() => {
      customerResultsRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isSearching, loading, cleanQuery]);

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[34px] border border-amber-400/15 bg-[linear-gradient(135deg,#090909_0%,#15110A_42%,#101827_100%)] p-6 text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(251,191,36,0.20),transparent_30%),radial-gradient(circle_at_100%_0%,rgba(16,185,129,0.14),transparent_32%)]" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
              Clientes Web
            </div>

            <h2 className="mt-5 text-4xl font-black tracking-tight">
              Base de clientes
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">
              Consulta clientes, puntos, teléfonos, historial de cortes y crea citas desde su ficha.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportCustomers}
              disabled={exporting}
              className="rounded-2xl border border-emerald-300/40 bg-emerald-400/20 px-6 py-4 text-sm font-black text-emerald-100 transition hover:bg-emerald-400/30 disabled:opacity-60"
            >
              {exporting ? 'Generando Excel...' : 'Descargar Excel'}
            </button>

            <button
              type="button"
              onClick={() => loadCustomers(query)}
              className="rounded-2xl border border-white/10 bg-white/10 px-6 py-4 text-sm font-black text-white transition hover:bg-white/15"
            >
              Actualizar
            </button>

            <button
              type="button"
              onClick={openCreateForm}
              className="rounded-2xl bg-amber-400 px-6 py-4 text-sm font-black text-neutral-950 shadow-[0_16px_35px_rgba(251,191,36,0.22)] transition hover:scale-[1.02]"
            >
              Nuevo cliente
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <StatCard label="Clientes totales" value={totalCustomers ?? customers.length} />
        <StatCard label="Con teléfono" value={withPhone} tone="blue" />
        <StatCard label="Puntos visibles" value={totalPoints} tone="gold" />
      </section>


      <CustomerReportPanel
        report={customerReport}
        loading={customerReportLoading}
        error={customerReportError}
        status={customerReportStatus}
        onStatusChange={setCustomerReportStatus}
        from={customerReportFrom}
        to={customerReportTo}
        onFromChange={setCustomerReportFrom}
        onToChange={setCustomerReportTo}
        branchId={customerReportBranchId}
        onBranchChange={setCustomerReportBranchId}
        branches={branches}
        lastVisitFrom={customerReportLastVisitFrom}
        lastVisitTo={customerReportLastVisitTo}
        onLastVisitFromChange={setCustomerReportLastVisitFrom}
        onLastVisitToChange={setCustomerReportLastVisitTo}
      />
      <section className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
              Buscar
            </div>
            <h3 className="mt-1 text-2xl font-black text-neutral-950">
              Encuentra un cliente
            </h3>
            <p className="mt-1 text-sm font-bold text-neutral-500">
              Escribe nombre o telefono y los resultados apareceran aqui mismo.
            </p>
          </div>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre o teléfono"
            className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-bold text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-amber-400 xl:max-w-md"
          />
        </div>

        {isSearching && (
          <div ref={customerResultsRef} className="mt-5 scroll-mt-28 rounded-[24px] border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex flex-col gap-2 text-sm font-black text-neutral-700 sm:flex-row sm:items-center sm:justify-between">
              <span>
                {loading
                  ? `Buscando "${cleanQuery}"...`
                  : `${customers.length} resultado${customers.length === 1 ? '' : 's'} para "${cleanQuery}"`}
              </span>

              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-left text-sm font-black text-amber-700 hover:text-amber-800"
              >
                Limpiar busqueda
              </button>
            </div>

            {!loading && customers.length > 0 && (
              <div className="mt-4 grid gap-3">
                {customers.slice(0, 6).map((customer) => (
                  <CustomerSearchResult
                    key={customer.id}
                    customer={customer}
                    onOpen={openCustomerDetail}
                    onWhatsapp={openCustomerWhatsapp}
                  />
                ))}
              </div>
            )}

            {!loading && customers.length === 0 && (
              <div className="mt-4 rounded-2xl border border-dashed border-neutral-300 bg-white p-5">
                <div className="text-lg font-black text-neutral-950">
                  No encontramos ese cliente
                </div>
                <p className="mt-1 text-sm font-bold text-neutral-500">
                  Revisa el telefono o crea el cliente manualmente.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-black text-neutral-700 transition hover:bg-neutral-50"
                  >
                    Ver todos
                  </button>
                  <button
                    type="button"
                    onClick={openCreateForm}
                    className="rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-black text-white transition hover:scale-[1.01]"
                  >
                    Crear cliente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {!isSearching && (
      <section className="rounded-[24px] border border-neutral-200 bg-white px-5 py-4 shadow-[0_10px_25px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-2 text-sm font-black text-neutral-700 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {loading
              ? isSearching
                ? `Buscando "${cleanQuery}"...`
                : 'Cargando clientes...'
              : isSearching
                ? `${customers.length} resultado${customers.length === 1 ? '' : 's'} para "${cleanQuery}"`
                : totalCustomers != null && totalCustomers > customers.length
                  ? `Mostrando ${customers.length} de ${totalCustomers} clientes`
                  : `${customers.length} clientes registrados`}
          </span>

          {isSearching ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-left text-sm font-black text-amber-700 hover:text-amber-800"
            >
              Limpiar busqueda
            </button>
          ) : (
            <span className="text-neutral-500">Toca un cliente para ver su ficha.</span>
          )}
        </div>
      </section>
      )}

      <ErrorBox message={errorMsg} />

      {!isSearching && (
      <div className="scroll-mt-28">
      {loading ? (
        <div className="rounded-[28px] border border-neutral-200 bg-white p-6 font-bold text-neutral-700 shadow-sm">
          Cargando clientes...
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-neutral-300 bg-white/70 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-2xl">
            👤
          </div>
          <div className="mt-4 text-xl font-black text-neutral-950">
            {isSearching ? 'No encontramos ese cliente' : 'No hay clientes para mostrar'}
          </div>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-neutral-500">
            {isSearching
              ? 'Revisa si el nombre o telefono esta escrito correctamente, o crea el cliente manualmente.'
              : 'Puedes crear uno manualmente o esperar a que se registre desde una venta, reserva o caja.'}
          </p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            {isSearching && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm font-black text-neutral-700 transition hover:bg-neutral-50"
              >
                Ver todos
              </button>
            )}

            <button
              type="button"
              onClick={openCreateForm}
              className="rounded-2xl bg-neutral-950 px-5 py-4 text-sm font-black text-white transition hover:scale-[1.01]"
            >
              Crear cliente
            </button>
          </div>
        </div>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
                {isSearching ? 'Resultados' : 'Directorio'}
              </div>
              <h3 className="mt-1 text-2xl font-black text-neutral-950">
                {isSearching ? `Busqueda: ${cleanQuery}` : 'Clientes registrados'}
              </h3>
            </div>

            {isSearching && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-black text-neutral-700 transition hover:bg-neutral-50"
              >
                Volver al listado completo
              </button>
            )}
          </div>

          <div className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-3">
            {customers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onOpen={openCustomerDetail}
                onWhatsapp={openCustomerWhatsapp}
              />
            ))}
          </div>
        </section>
      )}
      </div>
      )}

      {!isSearching && (
        <InactiveCustomersPanel
          days={inactiveDays}
          onDaysChange={setInactiveDays}
          customers={inactiveCustomers}
          loading={inactiveLoading}
          errorMsg={inactiveErrorMsg}
          onRefresh={() => loadInactiveCustomers(inactiveDays)}
        />
      )}

      {showForm && (
        <CustomerFormModal
          customer={editingCustomer}
          onClose={() => {
            setShowForm(false);
            setEditingCustomer(null);
          }}
          onSaved={handleSavedCustomer}
        />
      )}

      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          detail={customerDetail}
          history={customerHistory}
          cutHistory={customerCutHistory}
          loyalty={customerLoyalty}
          loading={loadingDetail}
          onClose={() => {
            setSelectedCustomer(null);
            setCustomerDetail(null);
            setCustomerHistory([]);
            setCustomerLoyalty(null);
          }}
          onEdit={(customer) => {
            setEditingCustomer(customer);
            setShowForm(true);
          }}
          onWhatsapp={openCustomerWhatsapp}
          onCreateAppointment={createAppointmentForCustomer}
          onWhatsappConsent={updateWhatsappConsent}
          consentSaving={consentSaving}
        />
      )}
    </div>
  );
}
