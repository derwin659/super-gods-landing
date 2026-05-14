import { useMemo, useState } from 'react';
import {
  createManualPointsAdjustment,
  findOwnerLoyaltyCustomerByPhone,
} from '../../api/ownerPointsApi';
import {
  getOwnerCustomerLoyalty,
  searchOwnerCustomers,
} from '../../api/ownerCustomersApi';

function StatPill({ label, value, tone = 'neutral' }) {
  const tones = {
    neutral: 'border-neutral-200 bg-neutral-50 text-neutral-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 ${tones[tone] || tones.neutral}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.16em] opacity-70">
        {label}
      </div>
      <div className="mt-1 text-lg font-black">{value}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-neutral-800">{label}</span>
      {children}
    </label>
  );
}

function normalizeSelectedCustomer(customer = {}, loyalty = null) {
  const fullName =
    customer.nombreCompleto ||
    `${customer.nombres || ''} ${customer.apellidos || ''}`.trim() ||
    'Cliente sin nombre';

  const parts = fullName.split(' ').filter(Boolean);

  return {
    customerId: Number(customer.customerId ?? customer.id),
    nombres: customer.nombres || parts.slice(0, 1).join(' ') || fullName,
    apellidos: customer.apellidos || parts.slice(1).join(' '),
    nombreCompleto: fullName,
    telefono: customer.telefono || customer.phone || '',
    email: customer.email || '',
    puntosDisponibles: Number(
      loyalty?.puntosDisponibles ??
        customer.puntosDisponibles ??
        customer.pointsAvailable ??
        customer.availablePoints ??
        0
    ),
    puntosAcumulados: Number(
      loyalty?.puntosAcumulados ??
        customer.puntosAcumulados ??
        customer.totalPoints ??
        0
    ),
    migrated: customer.migrated === true || customer.raw?.migrated === true,
    appActivated:
      customer.appActivated === true || customer.raw?.appActivated === true,
    raw: customer.raw || customer,
  };
}

function CustomerResultCard({ customer, selected, onSelect }) {
  const name =
    customer.nombreCompleto ||
    `${customer.nombres || ''} ${customer.apellidos || ''}`.trim() ||
    'Cliente sin nombre';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${
        selected
          ? 'border-violet-400 bg-violet-50 shadow-[0_12px_30px_rgba(124,58,237,0.12)]'
          : 'border-neutral-200 bg-white hover:border-violet-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-sm font-black text-white">
          {name.trim().slice(0, 1).toUpperCase() || 'C'}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-black text-neutral-950">
            {name}
          </div>
          <div className="mt-1 text-xs font-bold text-neutral-500">
            {customer.telefono || 'Sin teléfono'}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700">
              {customer.puntosDisponibles ?? 0} pts
            </span>
            {selected && (
              <span className="rounded-full bg-violet-100 px-3 py-1 text-[10px] font-black text-violet-700">
                Seleccionado
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function OwnerAdjustPointsPage() {
  const [query, setQuery] = useState('');
  const [pointsDelta, setPointsDelta] = useState('');
  const [reason, setReason] = useState('');

  const [customer, setCustomer] = useState(null);
  const [results, setResults] = useState([]);

  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingSelect, setLoadingSelect] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const currentPoints = Number(customer?.puntosDisponibles || 0);
  const delta = Number(pointsDelta || 0);

  const estimatedPoints = useMemo(() => {
    if (!customer || Number.isNaN(delta)) return currentPoints;
    return Math.max(0, currentPoints + delta);
  }, [customer, currentPoints, delta]);

  const customerName = useMemo(() => {
    if (!customer) return '';
    return (
      customer.nombreCompleto ||
      `${customer.nombres || ''} ${customer.apellidos || ''}`.trim() ||
      'Cliente sin nombre'
    );
  }, [customer]);

  function clearAll() {
    setQuery('');
    setPointsDelta('');
    setReason('');
    setCustomer(null);
    setResults([]);
    setMessage({ type: '', text: '' });
  }

  function setPositiveDefault() {
    const value = Math.abs(Number(pointsDelta || 0));
    setPointsDelta(String(value > 0 ? value : 50));
  }

  function setNegativeDefault() {
    const value = Math.abs(Number(pointsDelta || 0));
    setPointsDelta(`-${value > 0 ? value : 20}`);
  }

  async function selectCustomerFromList(item) {
    setMessage({ type: '', text: '' });
    setLoadingSelect(true);

    try {
      const loyalty = await getOwnerCustomerLoyalty(item.id);
      const selected = normalizeSelectedCustomer(item, loyalty);
      setCustomer(selected);
      setMessage({
        type: 'success',
        text: 'Cliente seleccionado. Ya puedes registrar el ajuste.',
      });
    } catch {
      const selected = normalizeSelectedCustomer(item, null);
      setCustomer(selected);
      setMessage({
        type: 'success',
        text: 'Cliente seleccionado. No se pudo refrescar loyalty, se usaron los puntos de la lista.',
      });
    } finally {
      setLoadingSelect(false);
    }
  }

  async function handleSearch(event) {
    event?.preventDefault?.();
    setMessage({ type: '', text: '' });

    const cleanQuery = query.trim();

    if (!cleanQuery || cleanQuery.length < 2) {
      setMessage({
        type: 'error',
        text: 'Ingresa al menos 2 caracteres para buscar por nombre o teléfono.',
      });
      return;
    }

    setLoadingSearch(true);
    setCustomer(null);
    setResults([]);

    try {
      const onlyDigits = cleanQuery.replace(/[^0-9]/g, '');
      const looksLikePhone = onlyDigits.length >= 8 && onlyDigits.length === cleanQuery.replace(/\s/g, '').length;

      if (looksLikePhone) {
        try {
          const direct = await findOwnerLoyaltyCustomerByPhone(onlyDigits);
          const selected = normalizeSelectedCustomer(direct, {
            puntosDisponibles: direct.puntosDisponibles,
            puntosAcumulados: direct.puntosAcumulados,
          });

          setCustomer(selected);
          setResults([selected]);
          setMessage({
            type: 'success',
            text: 'Cliente encontrado por teléfono. Ya puedes ajustar puntos.',
          });
          return;
        } catch {
          // Si no encuentra por teléfono exacto, cae a búsqueda general.
        }
      }

      const list = await searchOwnerCustomers(cleanQuery);
      setResults(list);

      if (list.length === 0) {
        setMessage({
          type: 'error',
          text: 'No se encontraron clientes con ese nombre o teléfono.',
        });
        return;
      }

      if (list.length === 1) {
        await selectCustomerFromList(list[0]);
        return;
      }

      setMessage({
        type: 'success',
        text: `Encontramos ${list.length} clientes. Selecciona uno de la lista.`,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error?.message ||
          'No se pudo buscar el cliente. Intenta nuevamente.',
      });
    } finally {
      setLoadingSearch(false);
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    setMessage({ type: '', text: '' });

    if (!customer?.customerId) {
      setMessage({ type: 'error', text: 'Primero busca y selecciona un cliente.' });
      return;
    }

    const cleanDelta = Number(pointsDelta);

    if (!Number.isFinite(cleanDelta) || cleanDelta === 0) {
      setMessage({
        type: 'error',
        text: 'Ingresa un ajuste válido. Ejemplo: 50 o -20.',
      });
      return;
    }

    if (currentPoints + cleanDelta < 0) {
      setMessage({
        type: 'error',
        text: 'No puedes descontar más puntos de los disponibles.',
      });
      return;
    }

    const cleanReason = reason.trim();

    if (!cleanReason) {
      setMessage({
        type: 'error',
        text: 'Escribe el motivo del ajuste.',
      });
      return;
    }

    setLoadingSave(true);

    try {
      const response = await createManualPointsAdjustment({
        customerId: customer.customerId,
        pointsDelta: cleanDelta,
        reason: cleanReason,
      });

      setCustomer((prev) => ({
        ...prev,
        puntosDisponibles: response.newPoints,
      }));

      setResults((prev) =>
        prev.map((item) => {
          const itemId = Number(item.id ?? item.customerId);
          if (itemId !== Number(customer.customerId)) return item;
          return {
            ...item,
            puntosDisponibles: response.newPoints,
          };
        })
      );

      setPointsDelta('');
      setReason('');
      setMessage({
        type: 'success',
        text: response.message || 'Ajuste realizado correctamente.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.message || 'No se pudo guardar el ajuste.',
      });
    } finally {
      setLoadingSave(false);
    }
  }

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[34px] border border-violet-400/15 bg-[linear-gradient(135deg,#080808_0%,#111827_48%,#170F2B_100%)] p-6 text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(139,92,246,0.24),transparent_30%),radial-gradient(circle_at_100%_0%,rgba(251,191,36,0.16),transparent_34%)]" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-violet-300/30 bg-violet-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-violet-200">
              Fidelización
            </div>

            <h2 className="mt-5 text-4xl font-black tracking-tight">
              Ajustar puntos manualmente
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65">
              Busca por nombre o teléfono, selecciona el cliente y registra un
              ajuste con motivo obligatorio.
            </p>
          </div>

          <button
            type="button"
            onClick={clearAll}
            disabled={loadingSearch || loadingSave || loadingSelect}
            className="rounded-2xl border border-white/10 bg-white/[0.08] px-5 py-4 text-sm font-black text-white/80 transition hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Limpiar formulario
          </button>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
        <form
          onSubmit={handleSearch}
          className="rounded-[34px] border border-neutral-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.055)]"
        >
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">
              Buscar cliente
            </div>

            <h3 className="mt-2 text-2xl font-black text-neutral-950">
              Busca por nombre o teléfono
            </h3>

            <p className="mt-2 text-sm font-semibold leading-6 text-neutral-500">
              Puedes escribir el nombre, apellido o teléfono del cliente.
            </p>
          </div>

          <div className="mt-5">
            <Field label="Nombre o teléfono del cliente">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ej: Derwin, Rudy o 958062847"
                className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-bold text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={loadingSearch}
            className="mt-5 w-full rounded-2xl bg-neutral-950 px-6 py-4 text-sm font-black text-white transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingSearch ? 'Buscando...' : 'Buscar cliente'}
          </button>

          {results.length > 0 && (
            <div className="mt-5 grid gap-3">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-neutral-400">
                Resultados
              </div>

              {results.map((item) => {
                const itemId = Number(item.customerId ?? item.id);
                const selected = Number(customer?.customerId) === itemId;

                return (
                  <CustomerResultCard
                    key={itemId}
                    customer={item}
                    selected={selected}
                    onSelect={() => selectCustomerFromList(item)}
                  />
                );
              })}
            </div>
          )}

          {customer && (
            <div className="mt-5 rounded-[26px] border border-neutral-200 bg-neutral-50 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-xl text-white">
                  👤
                </div>

                <div className="min-w-0">
                  <div className="text-[11px] font-black uppercase tracking-[0.16em] text-neutral-400">
                    Cliente seleccionado
                  </div>
                  <div className="mt-1 truncate text-lg font-black text-neutral-950">
                    {customerName}
                  </div>
                  <div className="mt-1 text-sm font-bold text-neutral-500">
                    {customer.telefono || 'Sin teléfono'}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <StatPill
                  label="Puntos"
                  value={customer.puntosDisponibles}
                  tone="green"
                />
                <StatPill
                  label="Acumulados"
                  value={customer.puntosAcumulados || 0}
                  tone="blue"
                />
                <StatPill
                  label="App"
                  value={customer.appActivated ? 'Activa' : 'Pendiente'}
                  tone="neutral"
                />
              </div>
            </div>
          )}
        </form>

        <form
          onSubmit={handleSave}
          className="rounded-[34px] border border-neutral-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.055)]"
        >
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
              Registrar ajuste
            </div>

            <h3 className="mt-2 text-2xl font-black text-neutral-950">
              Sumar o descontar puntos
            </h3>

            <p className="mt-2 text-sm font-semibold leading-6 text-neutral-500">
              Usa valores positivos para sumar y negativos para descontar.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <StatPill label="Actual" value={currentPoints} tone="green" />
            <StatPill
              label="Ajuste"
              value={pointsDelta || 0}
              tone={delta < 0 ? 'amber' : 'blue'}
            />
            <StatPill label="Nuevo saldo" value={estimatedPoints} tone="neutral" />
          </div>

          <div className="mt-6 grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={setPositiveDefault}
                disabled={!customer}
                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-700 transition hover:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                + Sumar puntos
              </button>

              <button
                type="button"
                onClick={setNegativeDefault}
                disabled={!customer}
                className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-black text-amber-700 transition hover:border-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                − Descontar puntos
              </button>
            </div>

            <Field label="Ajuste de puntos">
              <input
                value={pointsDelta}
                onChange={(event) => setPointsDelta(event.target.value)}
                type="number"
                placeholder="Ej: 100 o -50"
                disabled={!customer}
                className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-bold text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </Field>

            <Field label="Motivo obligatorio">
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={4}
                placeholder="Ej: Cliente frecuente, compensación, corrección de puntos..."
                disabled={!customer}
                className="resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-bold text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </Field>
          </div>

          {message.text && (
            <div
              className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-bold ${
                message.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={!customer || loadingSave}
            className="mt-6 w-full rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black text-white transition hover:scale-[1.01] hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingSave ? 'Guardando ajuste...' : 'Guardar ajuste'}
          </button>

          {loadingSelect && (
            <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
              Cargando puntos del cliente seleccionado...
            </div>
          )}
        </form>
      </section>
    </div>
  );
}
