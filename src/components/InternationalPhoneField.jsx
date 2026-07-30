import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, Search, X } from 'lucide-react';
import {
  PHONE_COUNTRIES,
  buildE164,
  digitsOnly,
  parsePhoneValue,
  phoneCountryByIso,
} from '../utils/internationalPhone';

function normalizeSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export default function InternationalPhoneField({
  label = 'WhatsApp del cliente',
  value = '',
  onChange,
  defaultCountry = 'PE',
  disabled = false,
  helperText = '',
  className = '',
  compact = false,
}) {
  const [countryIso, setCountryIso] = useState(
    () => parsePhoneValue(value, defaultCountry).country.iso2,
  );
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const parsedValue = parsePhoneValue(value, countryIso || defaultCountry);
  const country = value
    ? parsedValue.country
    : phoneCountryByIso(countryIso || defaultCountry);
  const national = parsedValue.national;
  const valid = national.length >= country.min && national.length <= country.max;

  useEffect(() => {
    function closeOnOutside(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const filteredCountries = useMemo(() => {
    const term = normalizeSearch(query);
    if (!term) return PHONE_COUNTRIES;
    return PHONE_COUNTRIES.filter((item) => (
      normalizeSearch(item.name).includes(term)
      || item.iso2.toLowerCase().includes(term)
      || item.dial.includes(term.replace(/\D/g, ''))
    ));
  }, [query]);

  function emit(nextCountry, nextNational) {
    const e164 = buildE164(nextCountry, nextNational);
    const isValid = nextNational.length >= nextCountry.min
      && nextNational.length <= nextCountry.max;
    onChange?.(e164, {
      country: nextCountry,
      national: nextNational,
      isValid,
    });
  }

  function handleNumberChange(event) {
    const nextNational = digitsOnly(event.target.value).slice(0, country.max);
    emit(country, nextNational);
  }

  function selectCountry(nextCountry) {
    const nextNational = national.slice(0, nextCountry.max);
    setCountryIso(nextCountry.iso2);
    setOpen(false);
    setQuery('');
    emit(nextCountry, nextNational);
  }

  const automaticHelper = country.hint
    || (national
      ? `Se guardará como +${country.dial}${national}`
      : 'Se guardará en formato internacional para llamadas y WhatsApp.');

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {label && (
        <span className="mb-2 block text-sm font-black text-neutral-700">
          {label}
        </span>
      )}

      <div className={`flex items-stretch overflow-visible rounded-2xl border bg-white transition ${
        national && !valid
          ? 'border-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.10)]'
          : 'border-neutral-200 focus-within:border-amber-400 focus-within:shadow-[0_0_0_3px_rgba(251,191,36,0.10)]'
      } ${disabled ? 'opacity-60' : ''}`}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          className={`flex shrink-0 items-center gap-2 border-r border-neutral-200 bg-amber-50/70 font-black text-neutral-900 transition hover:bg-amber-100 ${
            compact ? 'px-3 py-3' : 'px-4 py-4'
          }`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`País seleccionado: ${country.name}`}
        >
          <span className="text-xl">{country.flag}</span>
          <span className="text-xs text-neutral-500">{country.iso2}</span>
          <span className="text-sm">+{country.dial}</span>
          <ChevronDown size={15} className={`transition ${open ? 'rotate-180' : ''}`} />
        </button>

        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          disabled={disabled}
          value={national}
          onChange={handleNumberChange}
          placeholder={country.iso2 === 'AR' ? '9 11 2345 6789' : 'Número nacional'}
          className={`min-w-0 flex-1 bg-transparent px-4 font-black text-neutral-950 outline-none placeholder:text-neutral-400 ${
            compact ? 'py-3 text-sm' : 'py-4'
          }`}
        />

        {valid && (
          <div className="flex items-center pr-3 text-emerald-600" title="Número válido">
            <CheckCircle2 size={19} />
          </div>
        )}
      </div>

      <p className={`mt-2 text-xs font-bold ${national && !valid ? 'text-amber-700' : 'text-neutral-500'}`}>
        {helperText || automaticHelper}
      </p>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[90] w-full min-w-[320px] overflow-hidden rounded-[22px] border border-neutral-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
          <div className="border-b border-neutral-100 p-3">
            <div className="flex items-center gap-2 rounded-xl bg-neutral-100 px-3">
              <Search size={17} className="text-neutral-500" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar país o prefijo"
                className="min-w-0 flex-1 bg-transparent py-3 text-sm font-bold text-neutral-950 outline-none"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="text-neutral-500">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div role="listbox" className="max-h-72 overflow-y-auto p-2">
            {filteredCountries.map((item) => {
              const selected = item.iso2 === country.iso2;
              return (
                <button
                  key={item.iso2}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => selectCountry(item)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                    selected ? 'bg-neutral-950 text-white' : 'text-neutral-800 hover:bg-amber-50'
                  }`}
                >
                  <span className="text-xl">{item.flag}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black">{item.name}</span>
                    <span className={`block text-[11px] font-bold ${selected ? 'text-white/60' : 'text-neutral-400'}`}>
                      {item.region}
                    </span>
                  </span>
                  <span className="text-sm font-black">+{item.dial}</span>
                </button>
              );
            })}

            {filteredCountries.length === 0 && (
              <div className="px-4 py-8 text-center text-sm font-bold text-neutral-500">
                No encontramos ese país.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
