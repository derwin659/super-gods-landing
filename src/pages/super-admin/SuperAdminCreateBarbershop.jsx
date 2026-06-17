import { useState } from "react";
import { superAdminApi } from "../../api/superAdminApi";

const BUSINESS_TYPE_OPTIONS = [
  { value: "BARBERSHOP", label: "Barbería" },
  { value: "BEAUTY_SALON", label: "Salón de belleza" },
  { value: "HAIR_SALON", label: "Peluquería" },
  { value: "SPA", label: "Spa / Centro estético" },
  { value: "NAILS", label: "Uñas" },
  { value: "BROWS_LASHES", label: "Cejas y pestañas" },
  { value: "TATTOO_STUDIO", label: "Estudio de tatuajes" },
  { value: "OTHER", label: "Otro" },
];

const PLAN_OPTIONS = [
  { value: "FREE", label: "Free" },
  { value: "BASIC", label: "Basic" },
  { value: "STARTER", label: "Starter" },
  { value: "GROWTH", label: "Growth" },
  { value: "PRO", label: "Pro" },
  { value: "ENTERPRISE", label: "Enterprise" },
  { value: "STARTER_LEGACY", label: "Starter Legacy" },
  { value: "PRO_LEGACY", label: "Pro Legacy" },
];

const BILLING_OPTIONS = [
  { value: "MONTHLY", label: "Mensual" },
  { value: "SEMIANNUAL", label: "Semestral" },
  { value: "YEARLY", label: "Anual" },
];

const CURRENCY_OPTIONS = [
  { value: "PEN", label: "Soles (PEN)" },
  { value: "USD", label: "Dólares (USD)" },
];

const COUNTRY_OPTIONS = [
  { value: "Peru", label: "Peru", currency: "PEN" },
  { value: "Estados Unidos", label: "Estados Unidos", currency: "USD" },
  { value: "Colombia", label: "Colombia", currency: "COP" },
  { value: "Mexico", label: "Mexico", currency: "MXN" },
  { value: "Chile", label: "Chile", currency: "CLP" },
  { value: "Argentina", label: "Argentina", currency: "ARS" },
  { value: "Bolivia", label: "Bolivia", currency: "BOB" },
  { value: "Brasil", label: "Brasil", currency: "BRL" },
  { value: "Union Europea", label: "Union Europea", currency: "EUR" },
  { value: "Venezuela", label: "Venezuela", currency: "VES" },
  { value: "Uruguay", label: "Uruguay", currency: "UYU" },
  { value: "Paraguay", label: "Paraguay", currency: "PYG" },
  { value: "Costa Rica", label: "Costa Rica", currency: "CRC" },
  { value: "Republica Dominicana", label: "Republica Dominicana", currency: "DOP" },
  { value: "Guatemala", label: "Guatemala", currency: "GTQ" },
];

const COUNTRY_CURRENCY_OPTIONS = COUNTRY_OPTIONS.map((item) => ({
  value: item.currency,
  label: `${item.currency} - ${item.label}`,
}));

const initialForm = {
  businessName: "",
  businessType: "BARBERSHOP",
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",
  country: "Peru",
  branchName: "Principal",
  branchAddress: "",
  branchPhone: "",
  plan: "STARTER",
  billingCycle: "MONTHLY",
  trialDays: 7,
  currency: "PEN",
};

function businessTypeLabel(value) {
  return BUSINESS_TYPE_OPTIONS.find((item) => item.value === value)?.label || "Negocio";
}

export default function SuperAdminCreateBarbershop() {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);

  function update(name, value) {
    if (name === "country") {
      const currency = COUNTRY_OPTIONS.find((item) => item.value === value)?.currency || "PEN";
      setForm((prev) => ({ ...prev, country: value, currency }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setCreated(null);

    if (!form.businessName.trim()) return setError("Ingresa el nombre del negocio.");
    if (!form.businessType) return setError("Selecciona el rubro del negocio.");
    if (!form.ownerName.trim()) return setError("Ingresa el nombre del dueño.");
    if (!form.ownerEmail.includes("@")) return setError("Ingresa un correo válido.");
    if (!form.branchName.trim()) return setError("Ingresa la sede principal.");

    try {
      setSaving(true);

      const payload = {
        ...form,
        businessName: form.businessName.trim(),
        businessType: form.businessType,
        ownerName: form.ownerName.trim(),
        ownerEmail: form.ownerEmail.trim().toLowerCase(),
        ownerPhone: form.ownerPhone.trim(),
        country: form.country,
        branchName: form.branchName.trim(),
        branchAddress: form.branchAddress.trim(),
        branchPhone: form.branchPhone.trim(),
        trialDays: Number(form.trialDays || 0),
      };

      const response = await superAdminApi.createTenant(payload);
      setCreated(response || {});
      setForm(initialForm);
    } catch (e) {
      setError(e.message || "No se pudo crear el negocio.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-[2rem] border border-[#E9DED0] bg-gradient-to-br from-[#FFFCF8] to-[#F4E8D7] p-6">
        <div className="inline-flex rounded-full border border-[#E9DED0] bg-white/70 px-3 py-2 text-xs font-black uppercase tracking-wider text-[#AF8750]">
          Super Admin
        </div>
        <h1 className="mt-4 text-3xl font-black">Crear negocio</h1>
        <p className="mt-2 text-sm font-semibold text-[#7A6F63]">
          Registra barberías, salones, spas, estudios de uñas u otros negocios de belleza y asigna su plan inicial.
        </p>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 font-bold text-red-700">
          {error}
        </div>
      )}

      {created && (
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
          <h2 className="text-xl font-black text-emerald-800">Negocio creado con éxito</h2>
          <div className="mt-3 grid gap-2 text-sm font-bold text-emerald-900 sm:grid-cols-2">
            <p>Negocio: {created.businessName || "-"}</p>
            <p>Rubro: {businessTypeLabel(created.businessType || form.businessType)}</p>
            <p>Código: {created.code || created.codigo || "-"}</p>
            <p>Usuario: {created.ownerEmail || created.email || "-"}</p>
            <p>Contraseña temporal: 123456</p>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="space-y-5">
        <Card title="Datos del negocio">
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Nombre del negocio"
              value={form.businessName}
              onChange={(v) => update("businessName", v)}
            />
            <Select
              label="Rubro"
              value={form.businessType}
              onChange={(v) => update("businessType", v)}
              options={BUSINESS_TYPE_OPTIONS}
            />
            <Field
              label="Nombre sede principal"
              value={form.branchName}
              onChange={(v) => update("branchName", v)}
            />
            <Field
              label="Dirección sede"
              value={form.branchAddress}
              onChange={(v) => update("branchAddress", v)}
            />
            <Field
              label="Teléfono sede"
              value={form.branchPhone}
              onChange={(v) => update("branchPhone", v)}
            />
            <Select
              label="Pais del negocio"
              value={form.country}
              onChange={(v) => update("country", v)}
              options={COUNTRY_OPTIONS}
            />
          </div>
        </Card>

        <Card title="Datos del dueño">
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Nombre del dueño"
              value={form.ownerName}
              onChange={(v) => update("ownerName", v)}
            />
            <Field
              label="Correo del dueño"
              type="email"
              value={form.ownerEmail}
              onChange={(v) => update("ownerEmail", v)}
            />
            <Field
              label="Teléfono del dueño"
              value={form.ownerPhone}
              onChange={(v) => update("ownerPhone", v)}
            />
          </div>
        </Card>

        <Card title="Plan inicial">
          <div className="grid gap-4 md:grid-cols-4">
            <Select
              label="Plan"
              value={form.plan}
              onChange={(v) => update("plan", v)}
              options={PLAN_OPTIONS}
            />
            <Select
              label="Ciclo"
              value={form.billingCycle}
              onChange={(v) => update("billingCycle", v)}
              options={BILLING_OPTIONS}
            />
            <Select
              label="Moneda"
              value={form.currency}
              onChange={(v) => update("currency", v)}
              options={COUNTRY_CURRENCY_OPTIONS}
            />
            <Field
              label="Días de prueba"
              type="number"
              value={form.trialDays}
              onChange={(v) => update("trialDays", v)}
            />
          </div>
        </Card>

        <button
          disabled={saving}
          className="w-full rounded-2xl bg-[#AF8750] px-5 py-4 text-base font-black text-white shadow-lg disabled:opacity-60"
        >
          {saving ? "Creando..." : "Crear negocio"}
        </button>
      </form>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <section className="rounded-3xl border border-[#E9DED0] bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-black">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-[#7A6F63]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-[#E9DED0] bg-white px-4 py-3 font-bold outline-none focus:border-[#AF8750]"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-[#7A6F63]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-[#E9DED0] bg-white px-4 py-3 font-bold outline-none focus:border-[#AF8750]"
      >
        {options.map((option) => {
          const optionValue = typeof option === "string" ? option : option.value;
          const optionLabel = typeof option === "string" ? option : option.label;

          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </label>
  );
}
