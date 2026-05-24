import { useEffect, useState } from 'react';
import {
  getOwnerLoyaltySettings,
  updateOwnerLoyaltySettings,
} from '../../api/ownerLoyaltySettingsApi';
import { saveTenantMoneySettings } from '../../utils/tenantMoney';

const CURRENCY_OPTIONS = [
  { code: 'PEN', symbol: 'S/', label: 'Sol peruano' },
  { code: 'USD', symbol: '$', label: 'Dolar estadounidense' },
  { code: 'COP', symbol: '$', label: 'Peso colombiano' },
  { code: 'MXN', symbol: '$', label: 'Peso mexicano' },
  { code: 'CLP', symbol: '$', label: 'Peso chileno' },
  { code: 'ARS', symbol: '$', label: 'Peso argentino' },
  { code: 'BOB', symbol: 'Bs', label: 'Boliviano' },
  { code: 'BRL', symbol: 'R$', label: 'Real brasileno' },
  { code: 'EUR', symbol: 'EUR', label: 'Euro' },
  { code: 'VES', symbol: 'Bs', label: 'Bolivar venezolano' },
];

function currencySymbolFor(code) {
  return CURRENCY_OPTIONS.find((item) => item.code === code)?.symbol || code || 'S/';
}

function ErrorBox({ message }) {
  if (!message) return null;

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
      {message}
    </div>
  );
}

export default function OwnerLoyaltySettingsPage() {
  const [pointsPerCurrencyUnit, setPointsPerCurrencyUnit] = useState('5');
  const [currency, setCurrency] = useState('PEN');
  const [currencySymbol, setCurrencySymbol] = useState('S/');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      setLoading(true);
      setErrorMsg('');

      try {
        const data = await getOwnerLoyaltySettings();
        if (!active) return;
        setPointsPerCurrencyUnit(String(data.pointsPerCurrencyUnit ?? 5));
        setCurrency(data.currency || 'PEN');
        setCurrencySymbol(data.currencySymbol || currencySymbolFor(data.currency || 'PEN'));
        saveTenantMoneySettings(data);
      } catch (error) {
        if (!active) return;
        setErrorMsg(error.message || 'No se pudo cargar la configuración de puntos.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const value = Number(String(pointsPerCurrencyUnit).replace(',', '.'));

    if (Number.isNaN(value) || value < 0) {
      setErrorMsg('Ingresa un valor válido. Puede ser 0 si no quieres acumular puntos por ventas.');
      return;
    }

    setSaving(true);

    try {
      const data = await updateOwnerLoyaltySettings({
        pointsPerCurrencyUnit: value,
        currency,
      });
      setPointsPerCurrencyUnit(String(data.pointsPerCurrencyUnit ?? value));
      setCurrency(data.currency || currency);
      setCurrencySymbol(data.currencySymbol || currencySymbolFor(data.currency || currency));
      saveTenantMoneySettings(data);
      setSuccessMsg('Configuracion de puntos y moneda actualizada.');
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo guardar la configuración.');
    } finally {
      setSaving(false);
    }
  }

  const previewAmount = 10;
  const previewPoints = Math.floor(
    Number(String(pointsPerCurrencyUnit).replace(',', '.') || 0) * previewAmount
  );

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[34px] border border-amber-400/15 bg-neutral-950 p-6 text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(251,191,36,0.22),transparent_30%),radial-gradient(circle_at_100%_0%,rgba(16,185,129,0.16),transparent_34%)]" />
        <div className="relative">
          <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
            Fidelización
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-tight">
            Puntos por venta
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65">
            Define cuántos puntos recibe el cliente por cada unidad monetaria gastada en servicios.
          </p>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="rounded-[30px] border border-neutral-200 bg-white p-6 shadow-[0_14px_38px_rgba(15,23,42,0.045)]"
      >
        <ErrorBox message={errorMsg} />

        {successMsg && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
            {successMsg}
          </div>
        )}

        {loading ? (
          <div className="py-10 text-center font-black text-neutral-500">
            Cargando configuración...
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div>
              <label className="block">
                <span className="text-sm font-black text-neutral-700">
                  Moneda del negocio
                </span>
                <select
                  value={currency}
                  onChange={(event) => {
                    setCurrency(event.target.value);
                    setCurrencySymbol(currencySymbolFor(event.target.value));
                  }}
                  className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-lg font-black text-neutral-950 outline-none focus:border-neutral-950"
                >
                  {CURRENCY_OPTIONS.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.symbol} {item.label} ({item.code})
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-5 block">
                <span className="text-sm font-black text-neutral-700">
                  Puntos por 1 {currencySymbol} ({currency})
                </span>
                <input
                  value={pointsPerCurrencyUnit}
                  onChange={(event) => setPointsPerCurrencyUnit(event.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-lg font-black text-neutral-950 outline-none focus:border-neutral-950"
                />
              </label>

              <p className="mt-3 text-sm font-semibold leading-6 text-neutral-500">
                Solo se calculan puntos sobre ventas de servicios. Los productos no generan puntos.
              </p>

              <button
                disabled={saving}
                className="mt-6 rounded-2xl bg-neutral-950 px-5 py-4 font-black text-white transition hover:scale-[1.01] disabled:opacity-60"
              >
                {saving ? 'Guardando...' : 'Guardar configuración'}
              </button>
            </div>

            <div className="rounded-[26px] border border-amber-200 bg-amber-50 p-5">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">
                Ejemplo
              </div>
              <div className="mt-4 text-sm font-bold text-neutral-600">
                Si el cliente paga {currencySymbol} {previewAmount} ({currency}) en servicios:
              </div>
              <div className="mt-3 text-3xl font-black text-neutral-950">
                {previewPoints} pts
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
