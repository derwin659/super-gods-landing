import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Globe2, LoaderCircle, Save, WalletCards } from 'lucide-react';
import { getRegionalSettings, updateRegionalSettings } from '../api/regionalSettingsApi';
import { useI18n } from '../i18n/I18nProvider';

const timezones = [
  ['America/Lima', 'Lima / Perú'],
  ['America/Sao_Paulo', 'São Paulo / Brasil'],
  ['America/Manaus', 'Manaus / Brasil'],
  ['America/Bogota', 'Bogotá / Colombia'],
  ['America/Caracas', 'Caracas / Venezuela'],
  ['America/Argentina/Buenos_Aires', 'Buenos Aires / Argentina'],
  ['America/Santiago', 'Santiago / Chile'],
  ['America/Mexico_City', 'Ciudad de México'],
  ['America/New_York', 'New York / Eastern'],
  ['America/Chicago', 'Chicago / Central'],
  ['America/Denver', 'Denver / Mountain'],
  ['America/Los_Angeles', 'Los Angeles / Pacific'],
  ['Europe/Madrid', 'Madrid / España'],
  ['Europe/Lisbon', 'Lisboa / Portugal'],
  ['Europe/London', 'London / United Kingdom'],
  ['Europe/Paris', 'Paris / France'],
];

const copy = {
  'es-PE': {
    eyebrow: 'Configuración internacional',
    title: 'Idioma, moneda y hora del negocio',
    subtitle: 'Esta configuración se aplica a clientes, reservas, reportes y notificaciones.',
    language: 'Idioma predeterminado',
    timezone: 'Zona horaria',
    currency: 'Moneda',
    save: 'Guardar configuración',
    saved: 'Configuración regional actualizada.',
    error: 'No se pudo guardar la configuración regional.',
  },
  'pt-BR': {
    eyebrow: 'Configuração internacional',
    title: 'Idioma, moeda e horário do negócio',
    subtitle: 'Esta configuração é aplicada a clientes, agendamentos, relatórios e notificações.',
    language: 'Idioma padrão',
    timezone: 'Fuso horário',
    currency: 'Moeda',
    save: 'Salvar configuração',
    saved: 'Configuração regional atualizada.',
    error: 'Não foi possível salvar a configuração regional.',
  },
  'en-US': {
    eyebrow: 'International settings',
    title: 'Business language, currency and time',
    subtitle: 'This setting applies to customers, bookings, reports and notifications.',
    language: 'Default language',
    timezone: 'Time zone',
    currency: 'Currency',
    save: 'Save settings',
    saved: 'Regional settings updated.',
    error: 'Regional settings could not be saved.',
  },
};

export default function RegionalSettingsPanel() {
  const { locale } = useI18n();
  const text = copy[locale] || copy['es-PE'];
  const [form, setForm] = useState({
    language: 'es-PE',
    timezone: 'America/Lima',
    currency: 'PEN',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getRegionalSettings()
      .then((data) => {
        if (!active) return;
        setForm({
          language: data?.language || 'es-PE',
          timezone: data?.timezone || 'America/Lima',
          currency: data?.currency || 'PEN',
        });
      })
      .catch(() => active && setError(text.error))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [text.error]);

  const currencies = useMemo(
    () => ['PEN', 'BRL', 'USD', 'EUR', 'COP', 'ARS', 'CLP', 'MXN', 'VES', 'UYU'],
    []
  );

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const data = await updateRegionalSettings(form);
      setForm({
        language: data?.language || form.language,
        timezone: data?.timezone || form.timezone,
        currency: data?.currency || form.currency,
      });
      setMessage(text.saved);
    } catch {
      setError(text.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-[34px] border border-sky-100 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.07)]">
      <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
        <div className="bg-[linear-gradient(145deg,#07152F,#0F2A5F)] p-6 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-sky-100">
            <Globe2 size={16} /> {text.eyebrow}
          </div>
          <h2 className="mt-5 text-3xl font-black tracking-tight">{text.title}</h2>
          <p className="mt-3 max-w-lg text-sm font-semibold leading-7 text-white/65">
            {text.subtitle}
          </p>
        </div>

        <form onSubmit={save} className="grid gap-4 p-6 md:grid-cols-3">
          <Field label={text.language}>
            <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
              <option value="es-PE">🇵🇪 Español</option>
              <option value="pt-BR">🇧🇷 Português</option>
              <option value="en-US">🇺🇸 English</option>
            </select>
          </Field>
          <Field label={text.timezone}>
            <select value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}>
              {timezones.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          <Field label={text.currency}>
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              {currencies.map((value) => <option key={value}>{value}</option>)}
            </select>
          </Field>

          <div className="md:col-span-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-bold">
              {message && <span className="inline-flex items-center gap-2 text-emerald-700"><CheckCircle2 size={17} />{message}</span>}
              {error && <span className="text-red-600">{error}</span>}
            </div>
            <button disabled={loading || saving} className="inline-flex items-center gap-2 rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-black text-white disabled:opacity-50">
              {loading || saving ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}
              {text.save}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
      <span className="mb-2 flex items-center gap-2"><WalletCards size={15} />{label}</span>
      <div className="[&_select]:w-full [&_select]:rounded-2xl [&_select]:border [&_select]:border-slate-200 [&_select]:bg-slate-50 [&_select]:px-4 [&_select]:py-3.5 [&_select]:text-sm [&_select]:font-black [&_select]:text-slate-900 [&_select]:outline-none">
        {children}
      </div>
    </label>
  );
}
