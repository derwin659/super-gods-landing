import { useEffect, useMemo, useState } from 'react';
import { premiumConfirm } from '../../components/PremiumUi';
import {
  createOwnerBranch,
  deleteOwnerBranchImage,
  getOwnerBranches,
  getPublicAffiliatedBranchDetail,
  updateOwnerBranch,
  updateOwnerBranchStatus,
  uploadOwnerBranchImage,
} from '../../api/ownerBranchesApi';

function getBranchId(branch) {
  return branch?.id ?? branch?.branchId;
}

function branchName(branch) {
  return branch?.nombre ?? branch?.name ?? branch?.branchName ?? 'Sede';
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

function BranchImage({ branch }) {
  const imageUrl = String(branch?.imageUrl || '').trim();

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={branchName(branch)}
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#111827_0%,#374151_100%)] text-5xl text-white">
      🏪
    </div>
  );
}

function BranchFormModal({ branch, onClose, onSaved }) {
  const isEdit = Boolean(getBranchId(branch));

  const [nombre, setNombre] = useState(branchName(branch) === 'Sede' ? '' : branchName(branch));
  const [direccion, setDireccion] = useState(branch?.direccion || branch?.address || '');
  const [telefono, setTelefono] = useState(branch?.telefono || branch?.phone || '');
  const [ciudad, setCiudad] = useState(branch?.ciudad || branch?.city || '');
  const [latitude, setLatitude] = useState(branch?.latitude ?? '');
  const [longitude, setLongitude] = useState(branch?.longitude ?? '');
  const [publicDescription, setPublicDescription] = useState(branch?.publicDescription || '');
  const [publicVisible, setPublicVisible] = useState(branch?.publicVisible === true);
  const [directoryEnabled, setDirectoryEnabled] = useState(branch?.directoryEnabled === true);
  const [activo, setActivo] = useState(branch?.activo !== false);

  const [imageFile, setImageFile] = useState(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);

  const [saving, setSaving] = useState(false);
  const [locatingBranch, setLocatingBranch] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const previewUrl = imageFile
    ? URL.createObjectURL(imageFile)
    : removeCurrentImage
      ? ''
      : String(branch?.imageUrl || '').trim();

  async function handleUseCurrentLocation() {
    setErrorMsg('');

    if (!('geolocation' in navigator)) {
      setErrorMsg('Este navegador no permite detectar ubicacion.');
      return;
    }

    setLocatingBranch(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setLocatingBranch(false);
      },
      (error) => {
        const denied = error?.code === error?.PERMISSION_DENIED;
        setErrorMsg(denied ? 'Permite el acceso a ubicacion para completar latitud y longitud.' : 'No se pudo detectar la ubicacion actual.');
        setLocatingBranch(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  }
  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMsg('');

    if (!String(nombre).trim()) {
      setErrorMsg('Ingresa el nombre de la sede.');
      return;
    }

    if (publicVisible && directoryEnabled && (latitude === '' || longitude === '')) {
      setErrorMsg('Completa latitud y longitud antes de publicar la sede.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        nombre: nombre.trim(),
        direccion: direccion.trim() || null,
        telefono: telefono.trim() || null,
        activo,
        ciudad: ciudad.trim() || null,
        latitude: latitude === '' ? null : Number(latitude),
        longitude: longitude === '' ? null : Number(longitude),
        publicVisible,
        directoryEnabled,
        publicDescription: publicDescription.trim() || null,
      };

      let saved = isEdit
        ? await updateOwnerBranch({
            branchId: getBranchId(branch),
            payload,
          })
        : await createOwnerBranch(payload);

      if (removeCurrentImage && isEdit && branch?.imageUrl) {
        saved = await deleteOwnerBranchImage(getBranchId(branch));
      }

      if (imageFile) {
        saved = await uploadOwnerBranchImage({
          branchId: getBranchId(saved),
          file: imageFile,
        });
      }

      onSaved(saved);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo guardar la sede.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title={isEdit ? 'Editar sede' : 'Nueva sede'}
      subtitle="Estructura del negocio"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <ErrorBox message={errorMsg} />

        <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-5">
          <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
            <div>
              <div className="h-48 overflow-hidden rounded-[24px] border border-neutral-200 bg-white">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Vista previa"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-neutral-950 text-white">
                    <div className="text-4xl">🏪</div>
                    <div className="mt-2 text-sm font-black">Sin imagen</div>
                    <div className="mt-1 text-xs text-white/50">Agrega una foto del local</div>
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
                La imagen ayuda al cliente a reconocer la sede al reservar.
              </p>
            </div>

            <div className="space-y-4">
              <InputField
                label="Nombre de sede"
                value={nombre}
                onChange={setNombre}
                placeholder="Ej. Gods Central"
              />

              <InputField
                label="Dirección"
                value={direccion}
                onChange={setDireccion}
                placeholder="Ej. Av. Los Inkas 805A"
              />

              <InputField
                label="Teléfono"
                value={telefono}
                onChange={setTelefono}
                placeholder="Ej. 987654321"
              />

              <div data-build-marker="p13-affiliated-directory" className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4">
                <div className="mb-4">
                  <div className="text-sm font-black text-neutral-950">Directorio afiliado</div>
                  <div className="mt-1 text-xs font-bold leading-5 text-neutral-500">Activa esto solo si el dueño acepta que esta sede aparezca en Cerca de ti.</div>
                </div>
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={locatingBranch || saving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {locatingBranch ? 'Detectando ubicacion...' : 'Usar ubicacion actual'}
                  </button>
                  <p className="mt-2 text-xs font-bold leading-5 text-blue-700">
                    Abre esta pantalla desde el celular estando en la sede para completar latitud y longitud con GPS.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InputField label="Ciudad" value={ciudad} onChange={setCiudad} placeholder="Ej. Lima" />
                  <InputField label="Latitud" value={latitude} onChange={setLatitude} placeholder="Ej. -12.0464" type="number" />
                  <InputField label="Longitud" value={longitude} onChange={setLongitude} placeholder="Ej. -77.0428" type="number" />
                  <InputField label="Descripcion publica" value={publicDescription} onChange={setPublicDescription} placeholder="Ej. Barberia premium cerca al parque" />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => setPublicVisible((prev) => !prev)} className={`rounded-2xl px-4 py-3 text-sm font-black ${publicVisible ? 'bg-emerald-500 text-white' : 'bg-white text-neutral-700 border border-neutral-200'}`}>
                    {publicVisible ? 'Visible al publico' : 'Oculto al publico'}
                  </button>
                  <button type="button" onClick={() => setDirectoryEnabled((prev) => !prev)} className={`rounded-2xl px-4 py-3 text-sm font-black ${directoryEnabled ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-700 border border-neutral-200'}`}>
                    {directoryEnabled ? 'Aparece en directorio' : 'No publicar en directorio'}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-black text-neutral-950">
                      Estado de la sede
                    </div>
                    <div className="mt-1 text-xs font-bold text-neutral-500">
                      {activo
                        ? 'Disponible para operar en agenda, caja y reservas.'
                        : 'Oculta para nuevas operaciones.'}
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
                    {activo ? 'Activa' : 'Inactiva'}
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
              : 'Crear sede'}
        </button>
      </form>
    </ModalShell>
  );
}

function ToggleConfirmModal({ branch, onCancel, onConfirm, saving }) {
  const active = branch?.activo !== false;

  return (
    <ModalShell
      title={active ? 'Desactivar sede' : 'Activar sede'}
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
            {active ? 'Esta sede dejará de operar' : 'Esta sede volverá a operar'}
          </h3>

          <p className="mt-2 text-sm leading-6 text-neutral-600">
            {active
              ? `“${branchName(branch)}” no debería aparecer para nuevas operaciones, pero seguirá en reportes e historial.`
              : `“${branchName(branch)}” volverá a estar disponible para operar.`}
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
                ? 'Sí, desactivar'
                : 'Sí, activar'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function BranchCard({ branch, onEdit, onToggle, onDeleteImage, onPreview }) {
  const active = branch.activo !== false;

  return (
    <div className={`overflow-hidden rounded-[30px] border bg-white shadow-[0_14px_38px_rgba(15,23,42,0.045)] ${
      active ? 'border-neutral-200' : 'border-red-200'
    }`}>
      <div className="relative h-44">
        <BranchImage branch={branch} />

        <div className="absolute inset-0 bg-gradient-to-br from-black/35 via-transparent to-black/20" />

        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-2 text-xs font-black text-neutral-950">
          Sede
        </div>

        <div className={`absolute right-4 top-4 rounded-full px-3 py-2 text-xs font-black ${
          active
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-red-50 text-red-700'
        }`}>
          {active ? 'Activa' : 'Inactiva'}
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-xl font-black text-neutral-950">
          {branchName(branch)}
        </h3>

        <div className="mt-4 grid gap-3">
          <div className="rounded-2xl bg-blue-50 px-4 py-3">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-blue-500">Directorio</div>
            <div className="mt-1 text-sm font-black text-blue-900">
              {branch.publicVisible && branch.directoryEnabled ? 'Publicado' : 'No publicado'}
            </div>
            <div className="mt-1 text-xs font-bold text-blue-700">
              {branch.ciudad || branch.city || 'Sin ciudad'}
              {branch.latitude && branch.longitude ? ' · Ubicación lista para rutas' : ' · Falta ubicación para Cómo llegar'}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-amber-50 px-3 py-3 text-center">
              <div className="text-xl font-black text-neutral-950">{Number(branch.directoryViews || 0)}</div>
              <div className="mt-1 text-[10px] font-black uppercase tracking-wide text-amber-700">Vistas</div>
            </div>
            <div className="rounded-2xl bg-blue-50 px-3 py-3 text-center">
              <div className="text-xl font-black text-neutral-950">{Number(branch.routeOpens || 0)}</div>
              <div className="mt-1 text-[10px] font-black uppercase tracking-wide text-blue-700">Rutas abiertas</div>
            </div>
            <div className="rounded-2xl bg-violet-50 px-3 py-3 text-center">
              <div className="text-xl font-black text-neutral-950">{Number(branch.bookingIntents || 0)}</div>
              <div className="mt-1 text-[10px] font-black uppercase tracking-wide text-violet-700">Interés de reserva</div>
            </div>
          </div>

          <div className="rounded-2xl bg-neutral-50 px-4 py-3">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-neutral-400">
              Dirección
            </div>
            <div className="mt-1 text-sm font-black text-neutral-800">
              {branch.direccion || branch.address || '-'}
            </div>
          </div>

          <div className="rounded-2xl bg-neutral-50 px-4 py-3">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-neutral-400">
              Teléfono
            </div>
            <div className="mt-1 text-sm font-black text-neutral-800">
              {branch.telefono || branch.phone || '-'}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
            {active ? 'Desactivar' : 'Activar'}
          </button>

          <button
            type="button"
            onClick={onDeleteImage}
            disabled={!branch.imageUrl}
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Quitar imagen
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OwnerBranchesPage() {
  const [branches, setBranches] = useState([]);
  const [showInactive, setShowInactive] = useState(true);
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [formBranch, setFormBranch] = useState(null);
  const [publicPreview, setPublicPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const [toggleBranch, setToggleBranch] = useState(null);
  const [toggleSaving, setToggleSaving] = useState(false);

  async function loadBranches() {
    setLoading(true);
    setErrorMsg('');

    try {
      const data = await getOwnerBranches();
      setBranches(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudieron cargar las sedes.');
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBranches();
  }, []);

  const activeCount = useMemo(() => {
    return branches.filter((item) => item.activo !== false).length;
  }, [branches]);

  const inactiveCount = useMemo(() => {
    return branches.filter((item) => item.activo === false).length;
  }, [branches]);

  const filteredBranches = useMemo(() => {
    const term = search.trim().toLowerCase();

    return branches.filter((item) => {
      if (!showInactive && item.activo === false) return false;

      if (!term) return true;

      return (
        branchName(item).toLowerCase().includes(term) ||
        String(item.direccion || '').toLowerCase().includes(term) ||
        String(item.telefono || '').toLowerCase().includes(term)
      );
    });
  }, [branches, search, showInactive]);

  async function handleSaved() {
    setFormBranch(null);
    setShowCreate(false);
    await loadBranches();
  }

  async function handleToggleConfirm() {
    if (!toggleBranch) return;

    setToggleSaving(true);

    try {
      await updateOwnerBranchStatus({
        branchId: getBranchId(toggleBranch),
        activo: toggleBranch.activo === false,
      });

      setToggleBranch(null);
      await loadBranches();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo cambiar el estado de la sede.');
    } finally {
      setToggleSaving(false);
    }
  }

  async function handlePublicPreview(branch) {
    setPreviewLoading(true);
    setErrorMsg('');
    try {
      const detail = await getPublicAffiliatedBranchDetail(getBranchId(branch));
      setPublicPreview(detail);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo cargar la vista pública.');
    } finally {
      setPreviewLoading(false);
    }
  }
  async function handleDeleteImage(branch) {
    if (!branch?.imageUrl) return;

    const ok = await premiumConfirm(`¿Quieres quitar la imagen de ${branchName(branch)}?`);
    if (!ok) return;

    setErrorMsg('');

    try {
      await deleteOwnerBranchImage(getBranchId(branch));
      await loadBranches();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo eliminar la imagen.');
    }
  }

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[34px] border border-amber-400/15 bg-[linear-gradient(135deg,#080808_0%,#111827_48%,#15110A_100%)] p-6 text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(251,191,36,0.22),transparent_30%),radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.16),transparent_34%)]" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
              Sedes del negocio
            </div>

            <h2 className="mt-5 text-4xl font-black tracking-tight">
              Locales y puntos de atención
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65">
              Crea, edita y controla las sedes de la barbería. Cada sede puede
              tener caja, agenda, barberos, productos y reportes propios.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-2xl bg-amber-400 px-5 py-4 text-sm font-black text-neutral-950 transition hover:scale-[1.01]"
          >
            Nueva sede
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Sedes"
          value={branches.length}
          helper="Registradas"
          tone="dark"
        />

        <StatCard
          title="Activas"
          value={activeCount}
          helper="Pueden operar"
          tone="green"
        />

        <StatCard
          title="Inactivas"
          value={inactiveCount}
          helper="Ocultas para operación"
          tone={inactiveCount > 0 ? 'red' : 'default'}
        />

        <StatCard
          title="Seguidores"
          value={branches.length > 0 ? Number(branches[0]?.followerCount || 0) : 0}
          helper="Clientes que guardaron el negocio"
          tone="gold"
        />
      </section>

      <section className="rounded-[30px] border border-neutral-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.045)]">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
          <label className="block">
            <span className="text-sm font-black text-neutral-700">Buscar sede</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, dirección o teléfono"
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-bold text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-amber-400"
            />
          </label>

          <button
            type="button"
            onClick={() => setShowInactive((prev) => !prev)}
            className={`rounded-2xl px-5 py-4 text-sm font-black transition ${
              showInactive
                ? 'bg-emerald-500 text-white'
                : 'border border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            {showInactive ? 'Ver todas' : 'Solo activas'}
          </button>

          <button
            type="button"
            onClick={loadBranches}
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
              <div key={item} className="h-72 animate-pulse rounded-[24px] bg-neutral-100" />
            ))}
          </div>
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-neutral-300 bg-white/70 p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-3xl">
            🏪
          </div>

          <h3 className="mt-4 text-xl font-black text-neutral-950">
            {branches.length === 0
              ? 'Aún no tienes sedes'
              : 'No encontramos resultados'}
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-neutral-500">
            {branches.length === 0
              ? 'Crea tu primera sede para operar caja, agenda, barberos y productos.'
              : 'Prueba cambiando el texto de búsqueda o el filtro de sedes activas.'}
          </p>

          {branches.length === 0 && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="mt-5 rounded-2xl bg-neutral-950 px-5 py-4 text-sm font-black text-white"
            >
              Crear sede
            </button>
          )}
        </div>
      ) : (
        <section className="grid gap-5 xl:grid-cols-2">
          {filteredBranches.map((branch) => (
            <BranchCard
              key={getBranchId(branch)}
              branch={branch}
              onEdit={() => setFormBranch(branch)}
              onToggle={() => setToggleBranch(branch)}
              onDeleteImage={() => handleDeleteImage(branch)}
            />
          ))}
        </section>
      )}

      {(publicPreview || previewLoading) && (
        <ModalShell
          title={publicPreview?.branch?.tenantName || 'Vista pública'}
          subtitle="Así lo verá el cliente"
          onClose={() => setPublicPreview(null)}
          maxWidth="max-w-2xl"
        >
          {previewLoading ? (
            <div className="rounded-2xl bg-neutral-50 p-6 font-black text-neutral-500">Cargando perfil...</div>
          ) : (
            <div className="space-y-5">
              <div className={`rounded-2xl border p-4 ${publicPreview?.openNow ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                <div className="font-black text-neutral-950">{publicPreview?.openStatusLabel}</div>
                <div className="mt-1 text-sm font-bold text-neutral-600">{publicPreview?.todayHours ? `Horario de hoy: ${publicPreview.todayHours}` : 'Sin horario publicado para hoy'}</div>
              </div>
              <div>
                <h3 className="font-black text-neutral-950">Servicios principales</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(publicPreview?.services || []).map((service) => (
                    <div key={service.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
                      <div className="font-black text-neutral-900">{service.name}</div>
                      <div className="mt-1 text-xs font-bold text-neutral-500">{service.durationMinutes || '-'} min · {service.variablePrice ? 'Desde ' : ''}{service.price}</div>
                    </div>
                  ))}
                </div>
              </div>
              {(publicPreview?.promotions || []).length > 0 && (
                <div>
                  <h3 className="font-black text-neutral-950">Promociones vigentes</h3>
                  <div className="mt-3 space-y-2">
                    {publicPreview.promotions.map((promotion) => (
                      <div key={promotion.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 font-black text-amber-800">{promotion.title}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ModalShell>
      )}
      {(showCreate || formBranch) && (
        <BranchFormModal
          branch={formBranch}
          onClose={() => {
            setShowCreate(false);
            setFormBranch(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {toggleBranch && (
        <ToggleConfirmModal
          branch={toggleBranch}
          saving={toggleSaving}
          onCancel={() => setToggleBranch(null)}
          onConfirm={handleToggleConfirm}
        />
      )}
    </div>
  );
}
