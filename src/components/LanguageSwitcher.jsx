import { Languages } from 'lucide-react';
import { updatePreferredLocale } from '../api/regionalSettingsApi';
import { useI18n } from '../i18n/I18nProvider';

const options = [
  { value: 'es-PE', flag: '🇵🇪', label: 'Español' },
  { value: 'pt-BR', flag: '🇧🇷', label: 'Português' },
  { value: 'en-US', flag: '🇺🇸', label: 'English' },
];

export default function LanguageSwitcher({ compact = false, sync = true }) {
  const { locale, setLocale, t } = useI18n();

  async function handleChange(event) {
    const value = event.target.value;
    setLocale(value);
    if (!sync) return;
    try {
      await updatePreferredLocale(value);
    } catch {
      // El idioma local permanece activo si no hay conexión o sesión.
    }
  }

  return (
    <label
      className={`inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-white shadow-sm ${
        compact ? 'px-2 py-2' : 'px-3 py-2.5'
      }`}
      title={t('languageDescription')}
    >
      <Languages size={17} className="text-amber-600" strokeWidth={2.7} />
      {!compact && (
        <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
          {t('language')}
        </span>
      )}
      <select
        value={locale}
        onChange={handleChange}
        className="cursor-pointer bg-transparent text-sm font-black text-slate-800 outline-none"
        aria-label={t('language')}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.flag} {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
