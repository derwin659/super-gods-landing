import { useEffect, useMemo, useState } from 'react';
import {
  createOwnerReward,
  deleteOwnerReward,
  getOwnerRewards,
  updateOwnerReward,
  uploadOwnerRewardImage,
} from '../../api/ownerRewardsApi';

function n(value) {
  return Number(value || 0);
}

function ErrorBox({ message }) {
  if (!message) return null;

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
      {message}
    </div>
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
  prefix,
  suffix,
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
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent px-4 py-4 font-bold text-neutral-950 outline-none placeholder:text-neutral-400"
        />

        {suffix && (
          <span className="flex items-center border-l border-neutral-200 px-4 text-sm font-black text-neutral-500">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function TextAreaField({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-neutral-700">{label}</span>

      <textarea
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-[110px] w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-bold text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-amber-400"
      />
    </label>
  );
}

function RewardFormModal({ reward, onClose, onSaved }) {
  const isEdit = Boolean(reward?.id);

  const [titulo, setTitulo] = useState(reward?.titulo || '');
  const [descripcion, setDescripcion] = useState(reward?.descripcion || '');
  const [costoPuntos, setCostoPuntos] = useState(
    reward?.costoPuntos !== null && reward?.costoPuntos !== undefined
      ? String(reward.costoPuntos)
      : ''
  );
  const [stock, setStock] = useState(
    reward?.stock !== null && reward?.stock !== undefined
      ? String(reward.stock)
      : ''
  );
  const [imagenUrl, setImagenUrl] = useState(reward?.imagenUrl || '');
  const [activo, setActivo] = useState(reward?.activo !== false);
  const [imageFile, setImageFile] = useState(null);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const previewUrl = imageFile ? URL.createObjectURL(imageFile) : imagenUrl;

  function validate() {
    if (!titulo.trim()) return 'Ingresa el nombre del premio.';

    const points = Number(costoPuntos);
    if (!Number.isInteger(points) || points <= 0) {
      return 'Ingresa un costo en puntos válido.';
    }

    if (String(stock).trim()) {
      const stockValue = Number(stock);
      if (!Number.isInteger(stockValue) || stockValue < 0) {
        return 'Ingresa un stock válido o deja el campo vacío.';
      }
    }

    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validation = validate();

    if (validation) {
      setErrorMsg(validation);
      return;
    }

    const sendNotification = !isEdit
      ? window.confirm(
          '¿Quieres enviar una notificación a tus clientes sobre este nuevo premio?'
        )
      : false;

    setSaving(true);
    setErrorMsg('');

    try {
      const payload = {
        nombre: titulo.trim(),
        descripcion: descripcion.trim() || null,
        puntosRequeridos: Number(costoPuntos),
        stock: String(stock).trim() ? Number(stock) : null,
        imagenUrl: imagenUrl.trim() || null,
        activo,
        sendNotification: !isEdit && sendNotification,
      };

      let saved = isEdit
        ? await updateOwnerReward({
            rewardId: reward.id,
            payload,
          })
        : await createOwnerReward(payload);

      if (imageFile && saved?.id) {
        saved = await uploadOwnerRewardImage({
          rewardId: saved.id,
          file: imageFile,
        });
      }

      onSaved(saved);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo guardar el premio.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title={isEdit ? 'Editar premio' : 'Nuevo premio'}
      subtitle="Fidelización"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <ErrorBox message={errorMsg} />

        <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-5">
          <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
            <div>
              <div className="flex h-48 w-full items-center justify-center overflow-hidden rounded-[24px] border border-neutral-200 bg-white">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Premio"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-neutral-950 text-white">
                    <div className="text-4xl">🎁</div>
                    <div className="mt-2 text-sm font-black">Sin imagen</div>
                    <div className="mt-1 text-xs text-white/50">Agrega una imagen</div>
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
                    setImagenUrl('');
                  }}
                  className="mt-2 w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 hover:bg-red-100"
                >
                  Quitar imagen
                </button>
              )}

              <p className="mt-3 text-xs font-bold leading-5 text-neutral-500">
                La imagen se sube a Cloudinary después de guardar el premio.
              </p>
            </div>

            <div className="space-y-4">
              <InputField
                label="Nombre del premio"
                value={titulo}
                onChange={setTitulo}
                placeholder="Ej. Corte gratis"
              />

              <TextAreaField
                label="Descripción"
                value={descripcion}
                onChange={setDescripcion}
                placeholder="Describe el beneficio que recibirá el cliente."
              />

              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  label="Costo en puntos"
                  value={costoPuntos}
                  onChange={setCostoPuntos}
                  placeholder="Ej. 100"
                  type="number"
                  suffix="pts"
                />

                <InputField
                  label="Stock opcional"
                  value={stock}
                  onChange={setStock}
                  placeholder="Vacío = ilimitado"
                  type="number"
                />
              </div>

              <InputField
                label="Imagen URL"
                value={imagenUrl}
                onChange={setImagenUrl}
                placeholder="https://..."
              />

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-black text-neutral-950">
                      Estado del premio
                    </div>
                    <div className="mt-1 text-xs font-bold text-neutral-500">
                      {activo
                        ? 'Visible para clientes.'
                        : 'Oculto para nuevos canjes.'}
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
                    {activo ? 'Activo' : 'Inactivo'}
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
              : 'Crear premio'}
        </button>
      </form>
    </ModalShell>
  );
}

function RewardCard({ reward, onEdit, onToggle, onDelete }) {
  const active = reward.activo !== false;

  return (
    <div className={`overflow-hidden rounded-[30px] border bg-white shadow-[0_14px_38px_rgba(15,23,42,0.045)] ${
      active ? 'border-neutral-200' : 'border-red-200'
    }`}>
      {reward.imagenUrl ? (
        <div className="relative h-44">
          <img
            src={reward.imagenUrl}
            alt={reward.titulo}
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-br from-black/35 via-transparent to-black/20" />

          <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-2 text-xs font-black text-neutral-950">
            Premio
          </div>

          <div className={`absolute right-4 top-4 rounded-full px-3 py-2 text-xs font-black ${
            active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}>
            {active ? 'Activo' : 'Inactivo'}
          </div>
        </div>
      ) : (
        <div className="relative flex h-36 items-center justify-center bg-[linear-gradient(135deg,#111827_0%,#374151_100%)] text-5xl text-white">
          🎁
          <div className={`absolute right-4 top-4 rounded-full px-3 py-2 text-xs font-black ${
            active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}>
            {active ? 'Activo' : 'Inactivo'}
          </div>
        </div>
      )}

      <div className="p-5">
        <h3 className="text-xl font-black text-neutral-950">
          {reward.titulo}
        </h3>

        {reward.descripcion && (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-neutral-600">
            {reward.descripcion}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">
            {n(reward.costoPuntos)} puntos
          </span>

          <span className="rounded-full bg-neutral-100 px-3 py-2 text-xs font-black text-neutral-700">
            {reward.stock === null || reward.stock === undefined
              ? 'Stock ilimitado'
              : `Stock: ${reward.stock}`}
          </span>

          {reward.destacado && (
            <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">
              Destacado
            </span>
          )}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
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
            onClick={onDelete}
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 hover:bg-red-100"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OwnerRewardsPage() {
  const [rewards, setRewards] = useState([]);
  const [onlyActive, setOnlyActive] = useState(false);
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [formReward, setFormReward] = useState(null);

  async function loadRewards() {
    setLoading(true);
    setErrorMsg('');

    try {
      const data = await getOwnerRewards({ onlyActive });
      setRewards(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudieron cargar los premios.');
      setRewards([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRewards();
  }, [onlyActive]);

  const activeCount = useMemo(() => {
    return rewards.filter((item) => item.activo !== false).length;
  }, [rewards]);

  const inactiveCount = useMemo(() => {
    return rewards.filter((item) => item.activo === false).length;
  }, [rewards]);

  const withStockCount = useMemo(() => {
    return rewards.filter((item) => item.stock !== null && item.stock !== undefined).length;
  }, [rewards]);

  const filteredRewards = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return rewards;

    return rewards.filter((item) => {
      return (
        String(item.titulo || '').toLowerCase().includes(term) ||
        String(item.descripcion || '').toLowerCase().includes(term)
      );
    });
  }, [rewards, search]);

  async function handleSaved() {
    setShowCreate(false);
    setFormReward(null);
    await loadRewards();
  }

  async function handleToggle(reward) {
    setErrorMsg('');

    try {
      await updateOwnerReward({
        rewardId: reward.id,
        payload: {
          nombre: reward.titulo,
          descripcion: reward.descripcion || null,
          puntosRequeridos: reward.costoPuntos,
          stock: reward.stock ?? null,
          imagenUrl: reward.imagenUrl || null,
          activo: reward.activo === false,
          sendNotification: false,
        },
      });

      await loadRewards();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo cambiar el estado del premio.');
    }
  }

  async function handleDelete(reward) {
    const ok = window.confirm(`¿Seguro que deseas eliminar "${reward.titulo}"?`);
    if (!ok) return;

    setErrorMsg('');

    try {
      await deleteOwnerReward(reward.id);
      await loadRewards();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo eliminar el premio.');
    }
  }

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[34px] border border-amber-400/15 bg-[linear-gradient(135deg,#080808_0%,#111827_48%,#15110A_100%)] p-6 text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(251,191,36,0.22),transparent_30%),radial-gradient(circle_at_100%_0%,rgba(16,185,129,0.16),transparent_34%)]" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
              Premios y recompensas
            </div>

            <h2 className="mt-5 text-4xl font-black tracking-tight">
              Fideliza clientes con puntos
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65">
              Crea premios que tus clientes podrán canjear con sus puntos para
              volver más seguido a tu barbería.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-2xl bg-amber-400 px-5 py-4 text-sm font-black text-neutral-950 transition hover:scale-[1.01]"
          >
            Nuevo premio
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Premios"
          value={rewards.length}
          helper="Registrados"
          tone="dark"
        />

        <StatCard
          title="Activos"
          value={activeCount}
          helper="Visibles para clientes"
          tone="green"
        />

        <StatCard
          title="Inactivos"
          value={inactiveCount}
          helper="Ocultos para canje"
          tone={inactiveCount > 0 ? 'red' : 'default'}
        />

        <StatCard
          title="Con stock"
          value={withStockCount}
          helper="Tienen límite de unidades"
          tone="gold"
        />
      </section>

      <section className="rounded-[30px] border border-neutral-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.045)]">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
          <label className="block">
            <span className="text-sm font-black text-neutral-700">Buscar premio</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre o descripción"
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
            onClick={loadRewards}
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
      ) : filteredRewards.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-neutral-300 bg-white/70 p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-3xl">
            🎁
          </div>

          <h3 className="mt-4 text-xl font-black text-neutral-950">
            {rewards.length === 0
              ? 'Aún no tienes premios'
              : 'No encontramos resultados'}
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-neutral-500">
            {rewards.length === 0
              ? 'Crea tu primer premio para que los clientes canjeen sus puntos.'
              : 'Prueba cambiando el texto de búsqueda o el filtro de activos.'}
          </p>

          {rewards.length === 0 && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="mt-5 rounded-2xl bg-neutral-950 px-5 py-4 text-sm font-black text-white"
            >
              Crear premio
            </button>
          )}
        </div>
      ) : (
        <section className="grid gap-5 xl:grid-cols-2">
          {filteredRewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              onEdit={() => setFormReward(reward)}
              onToggle={() => handleToggle(reward)}
              onDelete={() => handleDelete(reward)}
            />
          ))}
        </section>
      )}

      {(showCreate || formReward) && (
        <RewardFormModal
          reward={formReward}
          onClose={() => {
            setShowCreate(false);
            setFormReward(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
