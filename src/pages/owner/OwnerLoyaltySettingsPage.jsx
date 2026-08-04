import { useEffect, useMemo, useState } from 'react';
import { getOwnerLoyaltySettings, updateOwnerLoyaltySettings } from '../../api/ownerLoyaltySettingsApi';
import { saveTenantMoneySettings } from '../../utils/tenantMoney';

const CURRENCIES = [
  ['PEN', 'S/', 'Sol peruano'], ['USD', '$', 'Dólar estadounidense'],
  ['COP', '$', 'Peso colombiano'], ['MXN', '$', 'Peso mexicano'],
  ['CLP', '$', 'Peso chileno'], ['ARS', '$', 'Peso argentino'],
  ['BOB', 'Bs', 'Boliviano'], ['BRL', 'R$', 'Real brasileño'],
  ['EUR', '€', 'Euro'], ['VES', 'Bs', 'Bolívar venezolano'],
];
const COLORS = ['#B7791F', '#64748B', '#D4A017', '#7C3AED', '#0F766E', '#2563EB', '#DB2777', '#DC2626'];
const DEFAULT_TIERS = [
  { id: 'bronze', name: 'Bronce', minPoints: 0, colorHex: '#B7791F', description: 'Clientes que comienzan a acumular puntos', active: true, iconName: 'star' },
  { id: 'silver', name: 'Plata', minPoints: 250, colorHex: '#64748B', description: 'Clientes recurrentes', active: true, iconName: 'star' },
  { id: 'gold', name: 'Oro', minPoints: 400, colorHex: '#D4A017', description: 'Clientes de alto valor', active: true, iconName: 'star' },
  { id: 'vip', name: 'VIP', minPoints: 500, colorHex: '#7C3AED', description: 'Máxima categoría del programa', active: true, iconName: 'star' },
];

const symbolFor = (code) => CURRENCIES.find(([value]) => value === code)?.[1] || code;
const newTier = () => ({ id: `tier-${Date.now()}`, name: '', minPoints: 0, colorHex: COLORS[0], description: '', active: true, iconName: 'star' });

function Toggle({ checked, onChange, label, help }) {
  return <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-neutral-200 p-4">
    <span><span className="block font-black text-neutral-900">{label}</span><span className="mt-1 block text-sm font-semibold text-neutral-500">{help}</span></span>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-5 w-5 accent-neutral-950" />
  </label>;
}

export default function OwnerLoyaltySettingsPage() {
  const [form, setForm] = useState({ pointsPerCurrencyUnit: 5, currency: 'PEN', welcomeBonusEnabled: true, welcomeBonusPoints: 100, activationBonusEnabled: true, activationBonusPoints: 50, tiers: DEFAULT_TIERS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let active = true;
    getOwnerLoyaltySettings().then((data) => {
      if (!active) return;
      setForm({ ...data, tiers: data.tiers?.length ? data.tiers.sort((a, b) => a.minPoints - b.minPoints) : DEFAULT_TIERS });
      saveTenantMoneySettings(data);
    }).catch((error) => active && setMessage({ error: true, text: error.message || 'No se pudo cargar la configuración.' }))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const symbol = symbolFor(form.currency);
  const preview = useMemo(() => Math.floor(Number(form.pointsPerCurrencyUnit || 0) * 10), [form.pointsPerCurrencyUnit]);
  const updateTier = (index, field, value) => setForm((current) => ({ ...current, tiers: current.tiers.map((tier, i) => i === index ? { ...tier, [field]: value } : tier) }));

  function validate() {
    const tiers = [...form.tiers].sort((a, b) => Number(a.minPoints) - Number(b.minPoints));
    if (!tiers.length) return 'Agrega al menos una categoría.';
    if (Number(tiers[0].minPoints) !== 0) return 'La primera categoría debe comenzar en 0 puntos.';
    if (tiers.some((tier) => !tier.name.trim() || Number(tier.minPoints) < 0)) return 'Completa el nombre y los puntos de cada categoría.';
    if (new Set(tiers.map((tier) => tier.name.trim().toLowerCase())).size !== tiers.length) return 'No repitas nombres de categorías.';
    if (new Set(tiers.map((tier) => Number(tier.minPoints))).size !== tiers.length) return 'Cada categoría debe comenzar en una cantidad de puntos diferente.';
    if (Number(form.pointsPerCurrencyUnit) < 0 || Number(form.welcomeBonusPoints) < 0 || Number(form.activationBonusPoints) < 0) return 'Los puntos no pueden ser negativos.';
    return null;
  }

  async function save(event) {
    event.preventDefault();
    const error = validate();
    if (error) return setMessage({ error: true, text: error });
    setSaving(true); setMessage(null);
    try {
      const payload = { ...form, pointsPerCurrencyUnit: Number(form.pointsPerCurrencyUnit), welcomeBonusPoints: Number(form.welcomeBonusPoints), activationBonusPoints: Number(form.activationBonusPoints), tiers: [...form.tiers].sort((a, b) => Number(a.minPoints) - Number(b.minPoints)).map((tier) => ({ ...tier, minPoints: Number(tier.minPoints) })) };
      const data = await updateOwnerLoyaltySettings(payload);
      setForm({ ...data, tiers: data.tiers }); saveTenantMoneySettings(data);
      setMessage({ error: false, text: 'Programa de fidelización actualizado correctamente.' });
    } catch (error) { setMessage({ error: true, text: error.message || 'No se pudo guardar la configuración.' }); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="rounded-[30px] border border-neutral-200 bg-white py-16 text-center font-black text-neutral-500">Cargando configuración...</div>;

  return <form onSubmit={save} className="space-y-6 pb-24">
    <section className="relative overflow-hidden rounded-[34px] border border-amber-400/15 bg-neutral-950 p-6 text-white shadow-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(251,191,36,0.22),transparent_30%),radial-gradient(circle_at_100%_0%,rgba(124,58,237,0.18),transparent_34%)]" />
      <div className="relative"><div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black uppercase tracking-[.22em] text-amber-300">Fidelización</div>
        <h1 className="mt-5 text-4xl font-black tracking-tight">Puntos, bonos y categorías</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65">Adapta el programa a tu negocio. Tú decides cuándo un cliente llega a Premium, VIP o cualquier categoría que crees.</p>
      </div>
    </section>

    {message && <div className={`rounded-2xl border px-4 py-3 text-sm font-black ${message.error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{message.text}</div>}

    <section className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <div className="rounded-[30px] border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-neutral-950">Acumulación por ventas</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-black text-neutral-700">Moneda<select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-base font-black">{CURRENCIES.map(([code, icon, label]) => <option key={code} value={code}>{icon} {label} ({code})</option>)}</select></label>
          <label className="text-sm font-black text-neutral-700">Puntos por 1 {symbol}<input type="number" min="0" step="0.01" value={form.pointsPerCurrencyUnit} onChange={(e) => setForm({ ...form, pointsPerCurrencyUnit: e.target.value })} className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-lg font-black" /></label>
        </div>
        <p className="mt-3 text-sm font-semibold text-neutral-500">Los puntos por venta se calculan sobre servicios.</p>
      </div>
      <aside className="rounded-[30px] border border-amber-200 bg-amber-50 p-6"><div className="text-xs font-black uppercase tracking-[.2em] text-amber-700">Ejemplo</div><p className="mt-4 text-sm font-bold text-neutral-600">Por una compra de {symbol} 10:</p><div className="mt-2 text-4xl font-black text-neutral-950">{preview} pts</div></aside>
    </section>

    <section className="rounded-[30px] border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black text-neutral-950">Bonos automáticos</h2><p className="mt-2 text-sm font-semibold text-neutral-500">Se entregan una sola vez por cliente. Los cambios no modifican bonos ya otorgados.</p>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div><Toggle checked={form.welcomeBonusEnabled} onChange={(value) => setForm({ ...form, welcomeBonusEnabled: value })} label="Bono de bienvenida" help="Al unirse por primera vez al negocio." />{form.welcomeBonusEnabled && <input type="number" min="0" value={form.welcomeBonusPoints} onChange={(e) => setForm({ ...form, welcomeBonusPoints: e.target.value })} className="mt-3 w-full rounded-2xl border border-neutral-200 px-4 py-3 font-black" />}</div>
        <div><Toggle checked={form.activationBonusEnabled} onChange={(value) => setForm({ ...form, activationBonusEnabled: value })} label="Bono por activar la app" help="Cuando el cliente activa su acceso móvil." />{form.activationBonusEnabled && <input type="number" min="0" value={form.activationBonusPoints} onChange={(e) => setForm({ ...form, activationBonusPoints: e.target.value })} className="mt-3 w-full rounded-2xl border border-neutral-200 px-4 py-3 font-black" />}</div>
      </div>
    </section>

    <section className="rounded-[30px] border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-black text-neutral-950">Categorías por puntos</h2><p className="mt-2 text-sm font-semibold text-neutral-500">Puedes usar cualquier nombre. La categoría cambia automáticamente según los puntos acumulados.</p></div><button type="button" onClick={() => setForm({ ...form, tiers: [...form.tiers, newTier()] })} disabled={form.tiers.length >= 20} className="rounded-2xl border border-neutral-300 px-4 py-3 text-sm font-black">+ Agregar categoría</button></div>
      <div className="mt-5 space-y-4">{form.tiers.map((tier, index) => <div key={tier.id} className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-4">
        <div className="grid gap-3 lg:grid-cols-[48px_1.2fr_160px_1.5fr_auto] lg:items-end">
          <label className="block"><span className="text-xs font-black text-neutral-500">Color</span><input type="color" value={tier.colorHex} onChange={(e) => updateTier(index, 'colorHex', e.target.value.toUpperCase())} className="mt-2 h-12 w-12 cursor-pointer rounded-xl border-0 bg-transparent" /></label>
          <label className="text-xs font-black text-neutral-500">Nombre<input maxLength="40" value={tier.name} onChange={(e) => updateTier(index, 'name', e.target.value)} placeholder="Ej. Premium" className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm font-black text-neutral-900" /></label>
          <label className="text-xs font-black text-neutral-500">Desde puntos<input type="number" min="0" value={tier.minPoints} onChange={(e) => updateTier(index, 'minPoints', e.target.value)} className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm font-black text-neutral-900" /></label>
          <label className="text-xs font-black text-neutral-500">Descripción<input maxLength="120" value={tier.description} onChange={(e) => updateTier(index, 'description', e.target.value)} placeholder="Beneficio o tipo de cliente" className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm font-bold text-neutral-900" /></label>
          <button type="button" onClick={() => setForm({ ...form, tiers: form.tiers.filter((_, i) => i !== index) })} disabled={form.tiers.length === 1} className="rounded-xl px-3 py-3 text-sm font-black text-red-600 disabled:opacity-30">Eliminar</button>
        </div>
      </div>)}</div>
      <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold leading-6 text-blue-900"><b>Categorías</b> (Premium, VIP, etc.) dependen de puntos. <b>Segmentos</b> (Nuevo, Frecuente, Inactivo) describen el comportamiento del cliente y se mantienen separados.</div>
    </section>

    <div className="sticky bottom-4 flex justify-end"><button disabled={saving} className="rounded-2xl bg-neutral-950 px-7 py-4 font-black text-white shadow-xl disabled:opacity-60">{saving ? 'Guardando...' : 'Guardar programa de fidelización'}</button></div>
  </form>;
}