import { useEffect, useMemo, useState } from 'react';

import { getOwnerBranches } from '../../api/ownerBranchesApi';
import {
  createOwnerPromotion,
  deleteOwnerPromotion,
  getOwnerPromotions,
  toggleOwnerPromotion,
  updateOwnerPromotion,
  uploadOwnerPromotionImage,
} from '../../api/ownerPromotionsApi';
import { formatTenantMoney, getTenantCurrencySymbol } from '../../utils/tenantMoney';

const PROMOTION_TYPES = [
  { value: 'DISCOUNT', label: 'Descuento' },
  { value: 'POINTS', label: 'Puntos' },
  { value: 'FIRST_VISIT', label: 'Primera visita' },
  { value: 'VIP', label: 'VIP' },
  { value: 'COMBO', label: 'Combo' },
  { value: 'SPECIAL_PRICE', label: 'Precio especial' },
];

const DISCOUNT_TYPES = [
  { value: 'NONE', label: 'Sin descuento real' },
  { value: 'AMOUNT', label: 'Descuento monto fijo' },
  { value: 'PERCENT', label: 'Descuento porcentaje' },
  { value: 'FIXED_PRICE', label: 'Precio final promocional' },
];

const REDIRECT_TYPES = [
  { value: 'NONE', label: 'Ninguno' },
  { value: 'BOOKING', label: 'Reserva' },
  { value: 'URL', label: 'Enlace externo' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'SERVICE', label: 'Servicio' },
  { value: 'REWARD', label: 'Premio' },
];

function getBranchId(branch) {
  return branch?.id ?? branch?.branchId;
}

function branchName(branch) {
  return branch?.nombre ?? branch?.name ?? branch?.branchName ?? 'Sede';
}

function toDateTimeInputValue(value) {
  if (!value) return '';

  const text = String(value);
  if (text.length >= 16) return text.slice(0, 16);

  return text;
}

function fromDateTimeInputValue(value) {
  if (!value) return null;
  return value.length === 16 ? `${value}:00` : value;
}

function n(value) {
  return Number(value || 0);
}

function formatDiscount(promotion) {
  const type = String(promotion?.discountType || '').toUpperCase();
  const value = n(promotion?.discountValue);

  if (!type || value <= 0) return 'Sin descuento real';

  if (type === 'AMOUNT') return `Descuento ${formatTenantMoney(value)}`;
  if (type === 'PERCENT') return `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(2)}% descuento`;
  if (type === 'FIXED_PRICE') return `Precio final ${formatTenantMoney(value)}`;

  return 'Descuento';
}

function typeLabel(value) {
  return PROMOTION_TYPES.find((item) => item.value === value)?.label || value || 'General';
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

function ModalShell({ title, subtitle, children, onClose, maxWidth = 'max-w-5xl' }) {
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

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-neutral-700">{label}</span>

      <select
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-bold text-neutral-950 outline-none transition focus:border-amber-400"
      >
        {options.map((option) => (
          <option key={`${option.value}-${option.label}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function PromotionFormModal({ promotion, branches, onClose, onSaved }) {
  const isEdit = Boolean(promotion?.id);

  const [titulo, setTitulo] = useState(promotion?.titulo || '');
  const [subtitulo, setSubtitulo] = useState(promotion?.subtitulo || '');
  const [descripcion, setDescripcion] = useState(promotion?.descripcion || '');
  const [tipo, setTipo] = useState(promotion?.tipo || 'DISCOUNT');
  const [badge, setBadge] = useState(promotion?.badge || '');
  const [priceText, setPriceText] = useState(promotion?.priceText || '');
  const [ctaLabel, setCtaLabel] = useState(promotion?.ctaLabel || '');
  const [iconName, setIconName] = useState(promotion?.iconName || '');
  const [imageUrl, setImageUrl] = useState(promotion?.imageUrl || '');

  const [branchId, setBranchId] = useState(promotion?.branchId ? String(promotion.branchId) : '');
  const [redirectType, setRedirectType] = useState(promotion?.redirectType || 'NONE');
  const [redirectValue, setRedirectValue] = useState(promotion?.redirectValue || '');

  const [discountType, setDiscountType] = useState(promotion?.discountType || 'NONE');
  const [discountValue, setDiscountValue] = useState(
    promotion?.discountValue !== null && promotion?.discountValue !== undefined
      ? String(promotion.discountValue)
      : ''
  );

  const [destacado, setDestacado] = useState(promotion?.destacado === true);
  const [soloClientesConPuntos, setSoloClientesConPuntos] = useState(promotion?.soloClientesConPuntos === true);
  const [puntosMinimos, setPuntosMinimos] = useState(
    promotion?.puntosMinimos !== null && promotion?.puntosMinimos !== undefined
      ? String(promotion.puntosMinimos)
      : ''
  );
  const [activo, setActivo] = useState(promotion?.activo !== false);

  const [fechaInicio, setFechaInicio] = useState(toDateTimeInputValue(promotion?.fechaInicio));
  const [fechaFin, setFechaFin] = useState(toDateTimeInputValue(promotion?.fechaFin));
  const [ordenVisual, setOrdenVisual] = useState(
    promotion?.ordenVisual !== null && promotion?.ordenVisual !== undefined
      ? String(promotion.ordenVisual)
      : '0'
  );

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const previewUrl = imageFile ? URL.createObjectURL(imageFile) : imageUrl;

  const branchOptions = [
    { value: '', label: 'Todas las sedes' },
    ...branches.map((branch) => ({
      value: String(getBranchId(branch)),
      label: branchName(branch),
    })),
  ];

  function validate() {
    if (!titulo.trim()) return 'Ingresa el título de la promoción.';

    if (!tipo) return 'Selecciona el tipo de promoción.';

    if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
      return 'La fecha fin no puede ser menor que la fecha inicio.';
    }

    if (soloClientesConPuntos) {
      const points = Number(puntosMinimos);
      if (!Number.isInteger(points) || points < 1) {
        return 'Ingresa puntos mínimos válidos.';
      }
    }

    if (discountType !== 'NONE') {
      const value = Number(String(discountValue).replace(',', '.'));

      if (Number.isNaN(value) || value <= 0) {
        return 'Ingresa un valor de descuento mayor a cero.';
      }

      if (discountType === 'PERCENT' && value > 100) {
        return 'El porcentaje no puede ser mayor a 100.';
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
          '¿Quieres enviar una notificación a tus clientes sobre esta nueva promoción?'
        )
      : false;

    setSaving(true);
    setErrorMsg('');

    try {
      const payload = {
        branchId: branchId ? Number(branchId) : null,
        titulo: titulo.trim(),
        subtitulo: subtitulo.trim() || null,
        descripcion: descripcion.trim() || null,
        tipo,
        badge: badge.trim() || null,
        imageUrl: imageUrl.trim() || null,
        iconName: iconName.trim() || null,
        priceText: priceText.trim() || null,
        ctaLabel: ctaLabel.trim() || null,
        sendNotification: !isEdit && sendNotification,
        redirectType,
        redirectValue: redirectValue.trim() || null,
        discountType: discountType === 'NONE' ? null : discountType,
        discountValue:
          discountType === 'NONE'
            ? null
            : Number(String(discountValue).replace(',', '.')),
        destacado,
        soloClientesConPuntos,
        puntosMinimos: soloClientesConPuntos ? Number(puntosMinimos) : null,
        activo,
        fechaInicio: fromDateTimeInputValue(fechaInicio),
        fechaFin: fromDateTimeInputValue(fechaFin),
        ordenVisual: Number(ordenVisual || 0),
      };

      let saved = isEdit
        ? await updateOwnerPromotion({
            promotionId: promotion.id,
            payload,
          })
        : await createOwnerPromotion(payload);

      if (imageFile && saved?.id) {
        saved = await uploadOwnerPromotionImage({
          promotionId: saved.id,
          file: imageFile,
        });
      }

      onSaved(saved);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo guardar la promoción.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title={isEdit ? 'Editar promoción' : 'Nueva promoción'}
      subtitle="Marketing"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <ErrorBox message={errorMsg} />

        <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-5">
          <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
            <div>
              <div className="flex h-52 w-full items-center justify-center overflow-hidden rounded-[24px] border border-neutral-200 bg-white">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Promoción"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-neutral-950 text-white">
                    <div className="text-4xl">🏷️</div>
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
                    setImageUrl('');
                  }}
                  className="mt-2 w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 hover:bg-red-100"
                >
                  Quitar imagen
                </button>
              )}

              <p className="mt-3 text-xs font-bold leading-5 text-neutral-500">
                La imagen se sube a Cloudinary después de guardar la promoción.
              </p>
            </div>

            <div className="space-y-4">
              <InputField
                label="Título"
                value={titulo}
                onChange={setTitulo}
                placeholder="Ej. Corte degradado especial"
              />

              <InputField
                label="Subtítulo"
                value={subtitulo}
                onChange={setSubtitulo}
                placeholder="Ej. Solo por esta semana"
              />

              <TextAreaField
                label="Descripción"
                value={descripcion}
                onChange={setDescripcion}
                placeholder="Describe la promoción para tus clientes."
              />

              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Tipo"
                  value={tipo}
                  onChange={setTipo}
                  options={PROMOTION_TYPES}
                />

                <SelectField
                  label="Sede"
                  value={branchId}
                  onChange={setBranchId}
                  options={branchOptions}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  label="Texto de precio"
                  value={priceText}
                  onChange={setPriceText}
                  placeholder="Ej. Desde 25"
                />

                <InputField
                  label="Texto del botón"
                  value={ctaLabel}
                  onChange={setCtaLabel}
                  placeholder="Ej. Reservar ahora"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-5">
          <h3 className="text-lg font-black text-neutral-950">
            Descuento real para reservas
          </h3>

          <p className="mt-1 text-sm leading-6 text-neutral-600">
            Este descuento se usará cuando el cliente reserve desde esta promoción.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <SelectField
              label="Tipo de descuento"
              value={discountType}
              onChange={(value) => {
                setDiscountType(value);
                if (value === 'NONE') setDiscountValue('');
              }}
              options={DISCOUNT_TYPES}
            />

            {discountType !== 'NONE' && (
              <InputField
                label={
                  discountType === 'AMOUNT'
                    ? 'Monto a descontar'
                    : discountType === 'PERCENT'
                      ? 'Porcentaje'
                      : 'Precio final'
                }
                value={discountValue}
                onChange={setDiscountValue}
                placeholder={
                  discountType === 'AMOUNT'
                    ? 'Ej. 10'
                    : discountType === 'PERCENT'
                      ? 'Ej. 20'
                      : 'Ej. 25'
                }
                type="number"
                prefix={discountType === 'PERCENT' ? null : getTenantCurrencySymbol()}
                suffix={discountType === 'PERCENT' ? '%' : null}
              />
            )}
          </div>

          {discountType !== 'NONE' && (
            <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-bold leading-6 text-amber-800">
              {discountType === 'AMOUNT' &&
                `Se descontará ${formatTenantMoney(discountValue || 0)} del precio normal.`}
              {discountType === 'PERCENT' &&
                `Se descontará ${discountValue || '0'}% del precio normal.`}
              {discountType === 'FIXED_PRICE' &&
                `El servicio quedará con precio promocional de ${formatTenantMoney(discountValue || 0)}.`}
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-neutral-200 bg-white p-5">
          <h3 className="text-lg font-black text-neutral-950">
            Estado y visibilidad
          </h3>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <button
              type="button"
              onClick={() => setActivo((prev) => !prev)}
              className={`rounded-2xl px-4 py-4 text-sm font-black ${
                activo
                  ? 'bg-emerald-500 text-white'
                  : 'bg-neutral-950 text-white'
              }`}
            >
              {activo ? 'Activa' : 'Inactiva'}
            </button>

            <button
              type="button"
              onClick={() => setDestacado((prev) => !prev)}
              className={`rounded-2xl px-4 py-4 text-sm font-black ${
                destacado
                  ? 'bg-amber-500 text-white'
                  : 'border border-neutral-200 bg-neutral-50 text-neutral-700'
              }`}
            >
              {destacado ? 'Destacada' : 'No destacada'}
            </button>

            <button
              type="button"
              onClick={() => setSoloClientesConPuntos((prev) => !prev)}
              className={`rounded-2xl px-4 py-4 text-sm font-black ${
                soloClientesConPuntos
                  ? 'bg-blue-500 text-white'
                  : 'border border-neutral-200 bg-neutral-50 text-neutral-700'
              }`}
            >
              {soloClientesConPuntos ? 'Solo con puntos' : 'Todos los clientes'}
            </button>
          </div>

          {soloClientesConPuntos && (
            <div className="mt-4">
              <InputField
                label="Puntos mínimos"
                value={puntosMinimos}
                onChange={setPuntosMinimos}
                placeholder="Ej. 50"
                type="number"
              />
            </div>
          )}

        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced((prev) => !prev)}
          className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm font-black text-neutral-700 hover:bg-neutral-50"
        >
          {showAdvanced ? 'Ocultar opciones avanzadas' : 'Mostrar opciones avanzadas'}
        </button>

        {showAdvanced && (
          <div className="rounded-[28px] border border-neutral-200 bg-white p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                label="Badge"
                value={badge}
                onChange={setBadge}
                placeholder="Ej. HOY, VIP, NUEVO"
              />

              <InputField
                label="Icon name"
                value={iconName}
                onChange={setIconName}
                placeholder="Ej. local_offer"
              />

              <InputField
                label="Image URL"
                value={imageUrl}
                onChange={setImageUrl}
                placeholder="https://..."
              />

              <InputField
                label="Orden visual"
                value={ordenVisual}
                onChange={setOrdenVisual}
                placeholder="0"
                type="number"
              />

              <SelectField
                label="Acción al tocar"
                value={redirectType}
                onChange={setRedirectType}
                options={REDIRECT_TYPES}
              />

              {redirectType !== 'NONE' && (
                <InputField
                  label="Valor de acción"
                  value={redirectValue}
                  onChange={setRedirectValue}
                  placeholder="URL, WhatsApp, ID de servicio o BOOKING"
                />
              )}

              <InputField
                label="Fecha inicio"
                value={fechaInicio}
                onChange={setFechaInicio}
                type="datetime-local"
              />

              <InputField
                label="Fecha fin"
                value={fechaFin}
                onChange={setFechaFin}
                type="datetime-local"
              />
            </div>
          </div>
        )}

        <button
          disabled={saving}
          className="w-full rounded-2xl bg-neutral-950 px-5 py-4 font-black text-white transition hover:scale-[1.01] disabled:opacity-60"
        >
          {saving
            ? 'Guardando...'
            : isEdit
              ? 'Guardar cambios'
              : 'Crear promoción'}
        </button>
      </form>
    </ModalShell>
  );
}

function PromotionCard({ promotion, branches, onEdit, onToggle, onDelete }) {
  const active = promotion.activo !== false;
  const branch = branches.find((item) => String(getBranchId(item)) === String(promotion.branchId));

  return (
    <div className={`overflow-hidden rounded-[30px] border bg-white shadow-[0_14px_38px_rgba(15,23,42,0.045)] ${
      active ? 'border-neutral-200' : 'border-red-200'
    }`}>
      {promotion.imageUrl ? (
        <div className="relative h-44">
          <img
            src={promotion.imageUrl}
            alt={promotion.titulo}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/45 via-transparent to-black/25" />
          <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-2 text-xs font-black text-neutral-950">
            {promotion.badge || typeLabel(promotion.tipo)}
          </div>
          <div className={`absolute right-4 top-4 rounded-full px-3 py-2 text-xs font-black ${
            active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}>
            {active ? 'Activa' : 'Inactiva'}
          </div>
        </div>
      ) : (
        <div className="relative flex h-36 items-center justify-center bg-[linear-gradient(135deg,#111827_0%,#374151_100%)] text-5xl text-white">
          🏷️
          <div className={`absolute right-4 top-4 rounded-full px-3 py-2 text-xs font-black ${
            active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}>
            {active ? 'Activa' : 'Inactiva'}
          </div>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-neutral-950">
              {promotion.titulo}
            </h3>

            {promotion.subtitulo && (
              <p className="mt-1 text-sm font-bold text-neutral-500">
                {promotion.subtitulo}
              </p>
            )}
          </div>

          {promotion.destacado && (
            <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">
              Destacada
            </span>
          )}
        </div>

        {promotion.descripcion && (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-neutral-600">
            {promotion.descripcion}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-neutral-100 px-3 py-2 text-xs font-black text-neutral-700">
            {typeLabel(promotion.tipo)}
          </span>

          <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">
            {formatDiscount(promotion)}
          </span>

          {promotion.priceText && (
            <span className="rounded-full bg-green-50 px-3 py-2 text-xs font-black text-green-700">
              {promotion.priceText}
            </span>
          )}

          {promotion.soloClientesConPuntos && (
            <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">
              Puntos mín: {promotion.puntosMinimos || 0}
            </span>
          )}

          <span className="rounded-full bg-neutral-100 px-3 py-2 text-xs font-black text-neutral-700">
            {branch ? branchName(branch) : 'Todas las sedes'}
          </span>
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

export default function OwnerPromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [branches, setBranches] = useState([]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [formPromotion, setFormPromotion] = useState(null);

  async function loadAll() {
    setLoading(true);
    setErrorMsg('');

    try {
      const [promotionData, branchData] = await Promise.all([
        getOwnerPromotions(),
        getOwnerBranches(),
      ]);

      setPromotions(Array.isArray(promotionData) ? promotionData : []);
      setBranches(Array.isArray(branchData) ? branchData : []);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudieron cargar las promociones.');
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const activeCount = useMemo(() => {
    return promotions.filter((item) => item.activo !== false).length;
  }, [promotions]);

  const inactiveCount = useMemo(() => {
    return promotions.filter((item) => item.activo === false).length;
  }, [promotions]);

  const highlightedCount = useMemo(() => {
    return promotions.filter((item) => item.destacado === true).length;
  }, [promotions]);

  const realDiscountCount = useMemo(() => {
    return promotions.filter((item) => item.discountType && n(item.discountValue) > 0).length;
  }, [promotions]);

  const filteredPromotions = useMemo(() => {
    const term = search.trim().toLowerCase();

    return promotions.filter((item) => {
      if (statusFilter === 'ACTIVE' && item.activo === false) return false;
      if (statusFilter === 'INACTIVE' && item.activo !== false) return false;

      if (!term) return true;

      return (
        String(item.titulo || '').toLowerCase().includes(term) ||
        String(item.subtitulo || '').toLowerCase().includes(term) ||
        String(item.descripcion || '').toLowerCase().includes(term) ||
        String(item.tipo || '').toLowerCase().includes(term)
      );
    });
  }, [promotions, search, statusFilter]);

  async function handleSaved() {
    setShowCreate(false);
    setFormPromotion(null);
    await loadAll();
  }

  async function handleToggle(promotion) {
    setErrorMsg('');

    try {
      await toggleOwnerPromotion(promotion.id);
      await loadAll();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo cambiar el estado de la promoción.');
    }
  }

  async function handleDelete(promotion) {
    const ok = window.confirm(`¿Seguro que deseas eliminar "${promotion.titulo}"?`);
    if (!ok) return;

    setErrorMsg('');

    try {
      await deleteOwnerPromotion(promotion.id);
      await loadAll();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo eliminar la promoción.');
    }
  }

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[34px] border border-amber-400/15 bg-[linear-gradient(135deg,#080808_0%,#111827_48%,#15110A_100%)] p-6 text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(251,191,36,0.22),transparent_30%),radial-gradient(circle_at_100%_0%,rgba(239,68,68,0.16),transparent_34%)]" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
              Promociones
            </div>

            <h2 className="mt-5 text-4xl font-black tracking-tight">
              Ofertas para atraer más clientes
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65">
              Crea promociones con descuento real para reservas, imagen,
              visibilidad por sede y opción de notificar a tus clientes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-2xl bg-amber-400 px-5 py-4 text-sm font-black text-neutral-950 transition hover:scale-[1.01]"
          >
            Nueva promoción
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Promociones"
          value={promotions.length}
          helper="Registradas"
          tone="dark"
        />

        <StatCard
          title="Activas"
          value={activeCount}
          helper="Visibles para clientes"
          tone="green"
        />

        <StatCard
          title="Destacadas"
          value={highlightedCount}
          helper="Prioridad visual"
          tone="gold"
        />

        <StatCard
          title="Con descuento real"
          value={realDiscountCount}
          helper="Aplican en reservas"
          tone="blue"
        />
      </section>

      <section className="rounded-[30px] border border-neutral-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.045)]">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
          <label className="block">
            <span className="text-sm font-black text-neutral-700">Buscar promoción</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por título, descripción o tipo"
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-bold text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-amber-400"
            />
          </label>

          <SelectField
            label="Estado"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'ALL', label: 'Todas' },
              { value: 'ACTIVE', label: 'Activas' },
              { value: 'INACTIVE', label: 'Inactivas' },
            ]}
          />

          <button
            type="button"
            onClick={loadAll}
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
      ) : filteredPromotions.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-neutral-300 bg-white/70 p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-3xl">
            🏷️
          </div>

          <h3 className="mt-4 text-xl font-black text-neutral-950">
            {promotions.length === 0
              ? 'Aún no tienes promociones'
              : 'No encontramos resultados'}
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-neutral-500">
            {promotions.length === 0
              ? 'Crea tu primera promoción para mostrar ofertas y beneficios a tus clientes.'
              : 'Prueba cambiando el texto de búsqueda o el filtro de estado.'}
          </p>

          {promotions.length === 0 && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="mt-5 rounded-2xl bg-neutral-950 px-5 py-4 text-sm font-black text-white"
            >
              Crear promoción
            </button>
          )}
        </div>
      ) : (
        <section className="grid gap-5 xl:grid-cols-2">
          {filteredPromotions.map((promotion) => (
            <PromotionCard
              key={promotion.id}
              promotion={promotion}
              branches={branches}
              onEdit={() => setFormPromotion(promotion)}
              onToggle={() => handleToggle(promotion)}
              onDelete={() => handleDelete(promotion)}
            />
          ))}
        </section>
      )}

      {(showCreate || formPromotion) && (
        <PromotionFormModal
          promotion={formPromotion}
          branches={branches}
          onClose={() => {
            setShowCreate(false);
            setFormPromotion(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

