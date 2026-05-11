import { useEffect, useMemo, useState } from 'react';
import {
  getOwnerReservationSettings,
  updateOwnerReservationSettings,
} from '../../api/ownerReservationSettingsApi';

const TEMPLATES = [
  {
    code: 'YAPE',
    displayName: 'Yape',
    countryCode: 'PE',
    accountLabel: 'Número Yape',
    instructions: 'Realiza el pago por Yape y escribe el número de operación.',
  },
  {
    code: 'PLIN',
    displayName: 'Plin',
    countryCode: 'PE',
    accountLabel: 'Número Plin',
    instructions: 'Realiza el pago por Plin y escribe el número de operación.',
  },
  {
    code: 'TRANSFER',
    displayName: 'Transferencia bancaria',
    countryCode: '',
    accountLabel: 'Cuenta bancaria',
    instructions: 'Realiza la transferencia y escribe el número de operación.',
  },
  {
    code: 'NEQUI',
    displayName: 'Nequi',
    countryCode: 'CO',
    accountLabel: 'Número Nequi',
    instructions: 'Realiza el pago por Nequi y escribe la referencia.',
  },
  {
    code: 'PAGO_MOVIL',
    displayName: 'Pago móvil',
    countryCode: 'VE',
    accountLabel: 'Datos de pago móvil',
    instructions: 'Realiza el pago móvil y escribe la referencia.',
  },
];

function createMethod(template, sortOrder) {
  return {
    id: null,
    branchId: null,
    code: template.code,
    displayName: template.displayName,
    countryCode: template.countryCode || '',
    instructions: template.instructions || '',
    accountLabel: template.accountLabel || '',
    accountValue: '',
    qrImageUrl: '',
    requiresOperationCode: true,
    requiresEvidence: false,
    active: true,
    sortOrder,
  };
}

function normalizeCode(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replaceAll(' ', '_')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

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

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  prefix,
  suffix,
  disabled = false,
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
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent px-4 py-4 font-bold text-neutral-950 outline-none placeholder:text-neutral-400 disabled:opacity-50"
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
        className="mt-2 min-h-[92px] w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-bold text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-amber-400"
      />
    </label>
  );
}

function MethodEditor({ method, index, onChange, onRemove }) {
  function update(field, value) {
    onChange({
      ...method,
      [field]: value,
    });
  }

  return (
    <div className={`rounded-[26px] border p-5 ${
      method.active
        ? 'border-amber-200 bg-amber-50/45'
        : 'border-neutral-200 bg-neutral-50'
    }`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-lg font-black text-neutral-950">
            {method.displayName || 'Método de pago'}
          </div>
          <div className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-neutral-400">
            {method.code || `Método ${index + 1}`}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => update('active', !method.active)}
            className={`rounded-2xl px-4 py-3 text-sm font-black ${
              method.active
                ? 'bg-emerald-500 text-white'
                : 'bg-neutral-950 text-white'
            }`}
          >
            {method.active ? 'Activo' : 'Inactivo'}
          </button>

          <button
            type="button"
            onClick={onRemove}
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 hover:bg-red-100"
          >
            Eliminar
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <InputField
          label="Nombre visible"
          value={method.displayName}
          onChange={(value) => update('displayName', value)}
          placeholder="Ej. Yape"
        />

        <InputField
          label="Código"
          value={method.code}
          onChange={(value) => update('code', normalizeCode(value))}
          placeholder="YAPE"
        />

        <InputField
          label="País"
          value={method.countryCode}
          onChange={(value) => update('countryCode', String(value).toUpperCase())}
          placeholder="PE"
        />

        <InputField
          label="Etiqueta"
          value={method.accountLabel}
          onChange={(value) => update('accountLabel', value)}
          placeholder="Número Yape"
        />

        <InputField
          label="Número / cuenta / dato de pago"
          value={method.accountValue}
          onChange={(value) => update('accountValue', value)}
          placeholder="Ej. 958062847"
        />

        <InputField
          label="URL de QR"
          value={method.qrImageUrl}
          onChange={(value) => update('qrImageUrl', value)}
          placeholder="https://..."
        />
      </div>

      <div className="mt-4">
        <TextAreaField
          label="Instrucciones"
          value={method.instructions}
          onChange={(value) => update('instructions', value)}
          placeholder="Indica al cliente cómo realizar el pago."
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => update('requiresOperationCode', !method.requiresOperationCode)}
          className={`rounded-2xl px-4 py-3 text-sm font-black ${
            method.requiresOperationCode
              ? 'bg-neutral-950 text-white'
              : 'border border-neutral-200 bg-white text-neutral-700'
          }`}
        >
          {method.requiresOperationCode ? 'Pide número de operación' : 'No pide operación'}
        </button>

        <button
          type="button"
          onClick={() => update('requiresEvidence', !method.requiresEvidence)}
          className={`rounded-2xl px-4 py-3 text-sm font-black ${
            method.requiresEvidence
              ? 'bg-neutral-950 text-white'
              : 'border border-neutral-200 bg-white text-neutral-700'
          }`}
        >
          {method.requiresEvidence ? 'Pide captura/comprobante' : 'No pide captura'}
        </button>
      </div>
    </div>
  );
}

export default function OwnerReservationSettingsPage() {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState('FIXED');
  const [fixedAmount, setFixedAmount] = useState('');
  const [percent, setPercent] = useState('');
  const [methods, setMethods] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function loadSettings() {
    setLoading(true);
    setErrorMsg('');

    try {
      const data = await getOwnerReservationSettings();

      setEnabled(data?.bookingDepositEnabled === true);
      setMode(String(data?.bookingDepositMode || 'FIXED').toUpperCase() === 'PERCENT' ? 'PERCENT' : 'FIXED');

      setFixedAmount(
        n(data?.bookingDepositDefaultAmount) > 0
          ? String(data.bookingDepositDefaultAmount)
          : ''
      );

      setPercent(
        data?.bookingDepositDefaultPercent !== null &&
        data?.bookingDepositDefaultPercent !== undefined
          ? String(data.bookingDepositDefaultPercent)
          : ''
      );

      setMethods(Array.isArray(data?.paymentMethods) ? data.paymentMethods : []);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo cargar la configuración.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  const activeMethods = useMemo(() => {
    return methods.filter((item) => item.active !== false);
  }, [methods]);

  function addTemplate(template) {
    const exists = methods.some(
      (item) => normalizeCode(item.code) === normalizeCode(template.code)
    );

    if (exists) return;

    setMethods((prev) => [
      ...prev,
      createMethod(template, prev.length + 1),
    ]);
  }

  function addCustom() {
    setMethods((prev) => [
      ...prev,
      {
        id: null,
        branchId: null,
        code: `CUSTOM_${prev.length + 1}`,
        displayName: 'Método personalizado',
        countryCode: '',
        instructions: 'Realiza el pago y escribe el número de operación.',
        accountLabel: 'Cuenta / número / QR',
        accountValue: '',
        qrImageUrl: '',
        requiresOperationCode: true,
        requiresEvidence: false,
        active: true,
        sortOrder: prev.length + 1,
      },
    ]);
  }

  function validate() {
    if (!enabled) return null;

    if (mode === 'FIXED') {
      const amount = Number(String(fixedAmount).replace(',', '.'));

      if (Number.isNaN(amount) || amount <= 0) {
        return 'Ingresa un monto fijo mayor a cero.';
      }
    }

    if (mode === 'PERCENT') {
      const value = Number(percent);

      if (!Number.isInteger(value) || value <= 0 || value > 100) {
        return 'Ingresa un porcentaje entre 1 y 100.';
      }
    }

    if (activeMethods.length === 0) {
      return 'Activa al menos un método de pago.';
    }

    for (const method of activeMethods) {
      if (!String(method.code || '').trim()) {
        return 'Hay un método activo sin código.';
      }

      if (!String(method.displayName || '').trim()) {
        return 'Hay un método activo sin nombre visible.';
      }

      if (!String(method.accountValue || '').trim()) {
        return `Completa la cuenta o número de ${method.displayName}.`;
      }
    }

    return null;
  }

  async function handleSave() {
    const validation = validate();

    if (validation) {
      setErrorMsg(validation);
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const payload = {
        bookingDepositEnabled: enabled,
        bookingDepositMode: mode,
        bookingDepositDefaultAmount:
          mode === 'FIXED'
            ? Number(String(fixedAmount || '0').replace(',', '.'))
            : 0,
        bookingDepositDefaultPercent:
          mode === 'PERCENT'
            ? Number(percent)
            : null,
        paymentMethods: methods.map((item, index) => ({
          id: item.id ?? null,
          branchId: item.branchId ?? null,
          code: normalizeCode(item.code),
          displayName: String(item.displayName || '').trim(),
          countryCode: String(item.countryCode || '').trim().toUpperCase() || null,
          instructions: String(item.instructions || '').trim() || null,
          accountLabel: String(item.accountLabel || '').trim() || null,
          accountValue: String(item.accountValue || '').trim() || null,
          qrImageUrl: String(item.qrImageUrl || '').trim() || null,
          requiresOperationCode: item.requiresOperationCode === true,
          requiresEvidence: item.requiresEvidence === true,
          active: item.active !== false,
          sortOrder: index + 1,
        })),
      };

      await updateOwnerReservationSettings(payload);
      await loadSettings();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo guardar la configuración.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[34px] border border-amber-400/15 bg-[linear-gradient(135deg,#080808_0%,#111827_48%,#15110A_100%)] p-6 text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(251,191,36,0.22),transparent_30%),radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.16),transparent_34%)]" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
              Reservas y pagos
            </div>

            <h2 className="mt-5 text-4xl font-black tracking-tight">
              Pago inicial para reservas
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65">
              Configura si el cliente debe pagar un adelanto, cuánto debe pagar
              y qué métodos verá al reservar.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="rounded-2xl bg-amber-400 px-5 py-4 text-sm font-black text-neutral-950 transition hover:scale-[1.01] disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Pago inicial"
          value={enabled ? 'Activo' : 'Inactivo'}
          helper="Control de reservas"
          tone={enabled ? 'green' : 'default'}
        />

        <StatCard
          title="Modo"
          value={mode === 'FIXED' ? 'Monto fijo' : 'Porcentaje'}
          helper="Tipo de cobro"
          tone="gold"
        />

        <StatCard
          title="Valor"
          value={mode === 'FIXED' ? `S/ ${fixedAmount || '0'}` : `${percent || '0'}%`}
          helper="Monto solicitado"
          tone="dark"
        />

        <StatCard
          title="Métodos activos"
          value={activeMethods.length}
          helper={`${methods.length} configurados`}
          tone="blue"
        />
      </section>

      <ErrorBox message={errorMsg} />

      {loading ? (
        <div className="rounded-[30px] border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="h-3 w-52 animate-pulse rounded-full bg-neutral-200" />
          <div className="mt-5 h-96 animate-pulse rounded-[24px] bg-neutral-100" />
        </div>
      ) : (
        <>
          <section className="rounded-[30px] border border-neutral-200 bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-xl font-black text-neutral-950">
                  Configuración del inicial
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Decide si el cliente debe pagar antes de confirmar su reserva.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEnabled((prev) => !prev)}
                className={`rounded-2xl px-5 py-4 text-sm font-black ${
                  enabled
                    ? 'bg-emerald-500 text-white'
                    : 'bg-neutral-950 text-white'
                }`}
              >
                {enabled ? 'Inicial activado' : 'Inicial desactivado'}
              </button>
            </div>

            <div className={`mt-5 space-y-5 ${enabled ? '' : 'opacity-45'}`}>
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  disabled={!enabled}
                  onClick={() => setMode('FIXED')}
                  className={`rounded-2xl px-5 py-4 text-sm font-black disabled:cursor-not-allowed ${
                    mode === 'FIXED'
                      ? 'bg-neutral-950 text-white'
                      : 'border border-neutral-200 bg-neutral-50 text-neutral-700'
                  }`}
                >
                  Monto fijo
                </button>

                <button
                  type="button"
                  disabled={!enabled}
                  onClick={() => setMode('PERCENT')}
                  className={`rounded-2xl px-5 py-4 text-sm font-black disabled:cursor-not-allowed ${
                    mode === 'PERCENT'
                      ? 'bg-neutral-950 text-white'
                      : 'border border-neutral-200 bg-neutral-50 text-neutral-700'
                  }`}
                >
                  Porcentaje
                </button>
              </div>

              {mode === 'FIXED' ? (
                <InputField
                  label="Monto fijo"
                  value={fixedAmount}
                  onChange={setFixedAmount}
                  placeholder="Ej. 10.00"
                  type="number"
                  prefix="S/"
                  disabled={!enabled}
                />
              ) : (
                <InputField
                  label="Porcentaje"
                  value={percent}
                  onChange={setPercent}
                  placeholder="Ej. 50"
                  type="number"
                  suffix="%"
                  disabled={!enabled}
                />
              )}
            </div>
          </section>

          <section className="rounded-[30px] border border-neutral-200 bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,0.05)]">
            <div>
              <h3 className="text-xl font-black text-neutral-950">
                Métodos rápidos
              </h3>
              <p className="mt-1 text-sm text-neutral-500">
                Agrega métodos populares por país o crea uno personalizado.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {TEMPLATES.map((template) => {
                const exists = methods.some(
                  (item) => normalizeCode(item.code) === normalizeCode(template.code)
                );

                return (
                  <button
                    key={template.code}
                    type="button"
                    disabled={exists}
                    onClick={() => addTemplate(template)}
                    className={`rounded-full px-4 py-3 text-sm font-black ${
                      exists
                        ? 'cursor-not-allowed bg-neutral-100 text-neutral-400'
                        : 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    {exists ? `✓ ${template.displayName}` : `+ ${template.displayName}`}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={addCustom}
                className="rounded-full border border-neutral-200 bg-neutral-950 px-4 py-3 text-sm font-black text-white"
              >
                + Método personalizado
              </button>
            </div>
          </section>

          <section className="rounded-[30px] border border-neutral-200 bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h3 className="text-xl font-black text-neutral-950">
                  Métodos configurados
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Estos métodos aparecerán al cliente cuando reserve con pago inicial.
                </p>
              </div>

              <div className="rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-black text-neutral-700">
                {methods.length} métodos
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {methods.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm font-bold text-neutral-500">
                  Aún no tienes métodos configurados.
                </div>
              ) : (
                methods.map((method, index) => (
                  <MethodEditor
                    key={`${method.id || method.code}-${index}`}
                    method={method}
                    index={index}
                    onChange={(updated) => {
                      setMethods((prev) =>
                        prev.map((item, i) => (i === index ? updated : item))
                      );
                    }}
                    onRemove={() => {
                      setMethods((prev) => prev.filter((_, i) => i !== index));
                    }}
                  />
                ))
              )}
            </div>
          </section>

          <section className="rounded-[26px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-bold leading-6 text-amber-800">
            Si activas “Pedir captura/comprobante”, asegúrate de que el flujo de reserva
            del cliente ya permita subir comprobante. Si no, usa solo número de operación.
          </section>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-2xl bg-neutral-950 px-5 py-4 font-black text-white transition hover:scale-[1.01] disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </>
      )}
    </div>
  );
}