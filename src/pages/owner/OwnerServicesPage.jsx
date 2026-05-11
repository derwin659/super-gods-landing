import { useEffect, useMemo, useState } from 'react';
import {
  createOwnerService,
  deleteOwnerServiceImage,
  getOwnerServices,
  toggleOwnerService,
  updateOwnerService,
  uploadOwnerServiceImage,
} from '../../api/ownerServicesApi';

function formatMoney(value) {
  const number = Number(value || 0);

  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: number % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(number);
}

function initials(value) {
  return String(value || 'Servicio')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((item) => item[0])
    .join('')
    .toUpperCase();
}

function ErrorBox({ message }) {
  if (!message) return null;

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
      {message}
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

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  step,
  prefix,
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-neutral-700">{label}</span>

      <div className="mt-2 flex overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 focus-within:border-amber-400">
        {prefix && (
          <span className="flex items-center border-r border-neutral-200 px-4 text-sm font-black text-neutral-500">
            {prefix}
          </span>
        )}

        <input
          type={type}
          step={step}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent px-4 py-4 font-bold text-neutral-950 outline-none placeholder:text-neutral-400"
        />
      </div>
    </label>
  );
}

function TextAreaField({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-neutral-700">{label}</span>

      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-[110px] w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-bold text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-amber-400"
      />
    </label>
  );
}

function StatCard({ title, value, helper, tone = 'default' }) {
  const styles = {
    default: 'border-neutral-200 bg-white text-neutral-950',
    dark: 'border-neutral-900 bg-neutral-950 text-white',
    gold: 'border-amber-200 bg-amber-50 text-amber-800',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    red: 'border-red-200 bg-red-50 text-red-800',
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
  };

  return (
    <div className={`rounded-[28px] border p-5 shadow-[0_12px_32px_rgba(15,23,42,0.045)] ${styles[tone]}`}>
      <div className={tone === 'dark' ? 'text-sm font-bold text-white/55' : 'text-sm font-bold text-neutral-500'}>
        {title}
      </div>

      <div className={tone === 'dark' ? 'mt-2 text-2xl font-black text-white' : 'mt-2 text-2xl font-black'}>
        {value}
      </div>

      {helper && (
        <div className={tone === 'dark' ? 'mt-1 text-xs text-white/45' : 'mt-1 text-xs text-neutral-500'}>
          {helper}
        </div>
      )}
    </div>
  );
}

function ServiceAvatar({ service }) {
  const imageUrl = String(service?.imageUrl || '').trim();

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={service.nombre}
        className="h-16 w-16 rounded-2xl border border-neutral-200 object-cover"
      />
    );
  }

  return (
    <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border text-lg font-black ${
      service.activo === false
        ? 'border-red-100 bg-red-50 text-red-700'
        : 'border-amber-100 bg-amber-50 text-amber-700'
    }`}>
      {initials(service.nombre)}
    </div>
  );
}

function ServiceFormModal({ service, onClose, onSaved }) {
  const isEdit = Boolean(service?.serviceId);

  const [nombre, setNombre] = useState(service?.nombre || '');
  const [descripcion, setDescripcion] = useState(service?.descripcion || '');
  const [duracionMinutos, setDuracionMinutos] = useState(
    service ? String(service.duracionMinutos || '') : ''
  );
  const [precio, setPrecio] = useState(
    service ? String(service.precio || '') : ''
  );
  const [categoria, setCategoria] = useState(service?.categoria || '');
  const [activo, setActivo] = useState(service?.activo !== false);
  const [imageFile, setImageFile] = useState(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const previewUrl = imageFile
    ? URL.createObjectURL(imageFile)
    : removeCurrentImage
      ? ''
      : String(service?.imageUrl || '').trim();

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMsg('');

    if (!String(nombre).trim()) {
      setErrorMsg('Ingresa el nombre del servicio.');
      return;
    }

    const duration = Number(String(duracionMinutos).replace(',', '.'));

    if (Number.isNaN(duration) || duration <= 0) {
      setErrorMsg('Ingresa una duración válida mayor a cero.');
      return;
    }

    const price = Number(String(precio).replace(',', '.'));

    if (Number.isNaN(price) || price < 0) {
      setErrorMsg('Ingresa un precio válido.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        duracionMinutos: Math.round(duration),
        precio: price,
        categoria: categoria.trim() || null,
        activo,
      };

      let saved = isEdit
        ? await updateOwnerService({
            serviceId: service.serviceId,
            payload,
          })
        : await createOwnerService(payload);

      if (removeCurrentImage && isEdit && service?.imageUrl) {
        saved = await deleteOwnerServiceImage(service.serviceId);
      }

      if (imageFile) {
        saved = await uploadOwnerServiceImage({
          serviceId: saved.serviceId,
          file: imageFile,
        });
      }

      onSaved(saved);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo guardar el servicio.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title={isEdit ? 'Editar servicio' : 'Nuevo servicio'}
      subtitle="Catálogo"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <ErrorBox message={errorMsg} />

        <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-5">
          <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
            <div>
              <div className="flex h-44 w-full items-center justify-center overflow-hidden rounded-[24px] border border-neutral-200 bg-white">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Vista previa"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-neutral-950 text-white">
                    <div className="text-3xl">✂️</div>
                    <div className="mt-2 text-sm font-black">Sin imagen</div>
                    <div className="mt-1 text-xs text-white/50">Agrega una foto</div>
                  </div>
                )}
              </div>

              <label className="mt-3 block">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setImageFile(file);
                    setRemoveCurrentImage(false);
                  }}
                />

                <span className="block cursor-pointer rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-center text-sm font-black text-neutral-700 hover:bg-neutral-100">
                  {previewUrl ? 'Cambiar imagen' : 'Subir imagen'}
                </span>
              </label>

              {previewUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setRemoveCurrentImage(true);
                  }}
                  className="mt-2 w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 hover:bg-red-100"
                >
                  Quitar imagen
                </button>
              )}

              <p className="mt-3 text-xs font-bold leading-5 text-neutral-500">
                La imagen se sube después de guardar el servicio.
              </p>
            </div>

            <div className="space-y-4">
              <InputField
                label="Nombre"
                value={nombre}
                onChange={setNombre}
                placeholder="Ej. Corte degradado"
              />

              <TextAreaField
                label="Descripción"
                value={descripcion}
                onChange={setDescripcion}
                placeholder="Ej. Corte moderno con acabado profesional."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Duración"
                  value={duracionMinutos}
                  onChange={setDuracionMinutos}
                  placeholder="30"
                  type="number"
                  step="1"
                />

                <InputField
                  label="Precio"
                  value={precio}
                  onChange={setPrecio}
                  placeholder="25.00"
                  type="number"
                  step="0.01"
                  prefix="S/"
                />
              </div>

              <InputField
                label="Categoría"
                value={categoria}
                onChange={setCategoria}
                placeholder="Ej. Corte, barba, tratamiento"
              />

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-black text-neutral-950">
                      Estado del servicio
                    </div>
                    <div className="mt-1 text-xs font-bold text-neutral-500">
                      {activo
                        ? 'Disponible para agenda, caja y ventas.'
                        : 'Oculto para nuevas ventas.'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActivo((prev) => !prev)}
                    className={`rounded-2xl px-4 py-3 text-sm font-black ${
                      activo
                        ? 'bg-emerald-500 text-white'
                        : 'bg-neutral-950 text-white'
                    }`}
                  >
                    {activo ? 'Activo' : 'Oculto'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          disabled={saving}
          className="w-full rounded-2xl bg-neutral-950 px-5 py-4 font-black text-white transition hover:scale-[1.01] disabled:opacity-60"
        >
          {saving
            ? 'Guardando...'
            : isEdit
              ? 'Guardar cambios'
              : 'Crear servicio'}
        </button>
      </form>
    </ModalShell>
  );
}

function ToggleConfirmModal({ service, onCancel, onConfirm, saving }) {
  const active = service?.activo !== false;

  return (
    <ModalShell
      title={active ? 'Ocultar servicio' : 'Activar servicio'}
      subtitle="Confirmación"
      onClose={onCancel}
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        <div className={`rounded-[28px] border p-5 ${
          active
            ? 'border-amber-200 bg-amber-50'
            : 'border-emerald-200 bg-emerald-50'
        }`}>
          <div className="text-3xl">
            {active ? '🙈' : '✅'}
          </div>

          <h3 className="mt-3 text-xl font-black text-neutral-950">
            {active ? 'Este servicio dejará de mostrarse' : 'Este servicio volverá a estar disponible'}
          </h3>

          <p className="mt-2 text-sm leading-6 text-neutral-600">
            {active
              ? `“${service?.nombre}” no aparecerá para nuevas ventas, pero seguirá disponible en reportes e historial.`
              : `“${service?.nombre}” volverá a aparecer para nuevas ventas y reservas.`}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 font-black text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className={`rounded-2xl px-5 py-4 font-black text-white disabled:opacity-60 ${
              active ? 'bg-neutral-950' : 'bg-emerald-500'
            }`}
          >
            {saving
              ? 'Guardando...'
              : active
                ? 'Sí, ocultar'
                : 'Sí, activar'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function ServiceCard({ service, onEdit, onToggle }) {
  const active = service.activo !== false;

  return (
    <div className={`rounded-[30px] border bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,0.045)] ${
      active ? 'border-neutral-200' : 'border-red-200'
    }`}>
      {!active && (
        <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
          Servicio oculto: no aparecerá para nuevas ventas.
        </div>
      )}

      <div className="flex items-start gap-4">
        <ServiceAvatar service={service} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-neutral-950">
              {service.nombre}
            </h3>

            <span className={`rounded-full px-3 py-1 text-[11px] font-black ${
              active
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-700'
            }`}>
              {active ? 'Activo' : 'Oculto'}
            </span>
          </div>

          <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-500">
            {service.descripcion || 'Sin descripción registrada.'}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-neutral-100 px-3 py-2 text-xs font-black text-neutral-700">
              {formatMoney(service.precio)}
            </span>

            <span className="rounded-full bg-neutral-100 px-3 py-2 text-xs font-black text-neutral-700">
              {service.duracionMinutos || 0} min
            </span>

            {service.categoria && (
              <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">
                {service.categoria}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-black text-neutral-700 hover:bg-neutral-100"
        >
          Editar
        </button>

        <button
          type="button"
          onClick={onToggle}
          className={`rounded-2xl px-4 py-3 text-sm font-black text-white ${
            active ? 'bg-neutral-950' : 'bg-emerald-500'
          }`}
        >
          {active ? 'Ocultar' : 'Activar'}
        </button>
      </div>
    </div>
  );
}

export default function OwnerServicesPage() {
  const [services, setServices] = useState([]);
  const [onlyActive, setOnlyActive] = useState(false);
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [formService, setFormService] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const [toggleServiceItem, setToggleServiceItem] = useState(null);
  const [toggleSaving, setToggleSaving] = useState(false);

  async function loadServices() {
    setLoading(true);
    setErrorMsg('');

    try {
      const data = await getOwnerServices({ onlyActive });
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudieron cargar los servicios.');
      setServices([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadServices();
  }, [onlyActive]);

  const activeCount = useMemo(() => {
    return services.filter((item) => item.activo !== false).length;
  }, [services]);

  const inactiveCount = useMemo(() => {
    return services.filter((item) => item.activo === false).length;
  }, [services]);

  const averagePrice = useMemo(() => {
    if (services.length === 0) return 0;
    const total = services.reduce((sum, item) => sum + Number(item.precio || 0), 0);
    return total / services.length;
  }, [services]);

  const filteredServices = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return services;

    return services.filter((item) => {
      return (
        String(item.nombre || '').toLowerCase().includes(term) ||
        String(item.descripcion || '').toLowerCase().includes(term) ||
        String(item.categoria || '').toLowerCase().includes(term)
      );
    });
  }, [services, search]);

  async function handleSaved() {
    setFormService(null);
    setShowCreate(false);
    await loadServices();
  }

  async function handleToggleConfirm() {
    if (!toggleServiceItem) return;

    setToggleSaving(true);

    try {
      await toggleOwnerService(toggleServiceItem.serviceId);
      setToggleServiceItem(null);
      await loadServices();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo cambiar el estado del servicio.');
    } finally {
      setToggleSaving(false);
    }
  }

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[34px] border border-amber-400/15 bg-[linear-gradient(135deg,#080808_0%,#111827_48%,#15110A_100%)] p-6 text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(251,191,36,0.22),transparent_30%),radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.16),transparent_34%)]" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
              Catálogo de servicios
            </div>

            <h2 className="mt-5 text-4xl font-black tracking-tight">
              Servicios de la barbería
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65">
              Crea, edita y ordena los servicios que se usan en reservas, caja,
              atención de clientes y reportes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-2xl bg-amber-400 px-5 py-4 text-sm font-black text-neutral-950 transition hover:scale-[1.01]"
          >
            Nuevo servicio
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Servicios"
          value={services.length}
          helper="Registrados"
          tone="dark"
        />

        <StatCard
          title="Activos"
          value={activeCount}
          helper="Disponibles para ventas"
          tone="green"
        />

        <StatCard
          title="Ocultos"
          value={inactiveCount}
          helper="No aparecen en nuevas ventas"
          tone={inactiveCount > 0 ? 'red' : 'default'}
        />

        <StatCard
          title="Precio promedio"
          value={formatMoney(averagePrice)}
          helper="Según servicios listados"
          tone="gold"
        />
      </section>

      <section className="rounded-[30px] border border-neutral-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.045)]">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
          <label className="block">
            <span className="text-sm font-black text-neutral-700">Buscar servicio</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, categoría o descripción"
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-bold text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-amber-400"
            />
          </label>

          <button
            type="button"
            onClick={() => setOnlyActive((prev) => !prev)}
            className={`rounded-2xl px-5 py-4 text-sm font-black transition ${
              onlyActive
                ? 'bg-emerald-500 text-white'
                : 'border border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            {onlyActive ? 'Solo activos' : 'Todos'}
          </button>

          <button
            type="button"
            onClick={loadServices}
            disabled={loading}
            className="rounded-2xl bg-neutral-950 px-5 py-4 text-sm font-black text-white transition hover:scale-[1.01] disabled:opacity-60"
          >
            {loading ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>
      </section>

      <ErrorBox message={errorMsg} />

      {loading ? (
        <div className="rounded-[30px] border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="h-3 w-52 animate-pulse rounded-full bg-neutral-200" />
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-48 animate-pulse rounded-[24px] bg-neutral-100" />
            ))}
          </div>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-neutral-300 bg-white/70 p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-3xl">
            ✂️
          </div>

          <h3 className="mt-4 text-xl font-black text-neutral-950">
            {services.length === 0
              ? 'Aún no tienes servicios'
              : 'No encontramos resultados'}
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-neutral-500">
            {services.length === 0
              ? 'Crea tu primer servicio para que aparezca en reservas, caja y ventas.'
              : 'Prueba cambiando el texto de búsqueda o el filtro de activos.'}
          </p>

          {services.length === 0 && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="mt-5 rounded-2xl bg-neutral-950 px-5 py-4 text-sm font-black text-white"
            >
              Crear servicio
            </button>
          )}
        </div>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.serviceId}
              service={service}
              onEdit={() => setFormService(service)}
              onToggle={() => setToggleServiceItem(service)}
            />
          ))}
        </section>
      )}

      {(showCreate || formService) && (
        <ServiceFormModal
          service={formService}
          onClose={() => {
            setShowCreate(false);
            setFormService(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {toggleServiceItem && (
        <ToggleConfirmModal
          service={toggleServiceItem}
          saving={toggleSaving}
          onCancel={() => setToggleServiceItem(null)}
          onConfirm={handleToggleConfirm}
        />
      )}
    </div>
  );
}