import { AlertTriangle, Sparkles } from 'lucide-react';

export function humanizeError(error) {
  const raw = String(error?.message || error || '').replace(/^Error:\s*/i, '').trim();
  const lower = raw.toLowerCase();
  if (/jdbc|hibernate|sql exception|stacktrace|syntax error/.test(lower)) {
    return 'No pudimos completar la operación. Intenta nuevamente; si continúa, contacta a soporte.';
  }
  if (/failed to fetch|network|timeout|connection|socket/.test(lower)) {
    return 'No pudimos conectar con el servidor. Revisa tu conexión e intenta nuevamente.';
  }
  if (!raw) return 'Ocurrió un inconveniente. Intenta nuevamente.';
  return raw.length > 240 ? `${raw.slice(0, 237)}...` : raw;
}

export function PremiumErrorState({ message, action }) {
  if (!message) return null;
  return (
    <div className="premium-enter rounded-[28px] border border-red-200 bg-[linear-gradient(135deg,#FFF7F7_0%,#FFFFFF_100%)] p-6 shadow-[0_16px_40px_rgba(127,29,29,0.08)]">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-700">
          <AlertTriangle size={23} strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-black text-neutral-950">No pudimos completar esta sección</div>
          <p className="mt-1 text-sm font-semibold leading-6 text-neutral-600">{humanizeError(message)}</p>
          {action && <div className="mt-4">{action}</div>}
        </div>
      </div>
    </div>
  );
}

export function PremiumEmptyState({ title, message, action }) {
  return (
    <div className="premium-enter rounded-[30px] border border-dashed border-amber-200 bg-[linear-gradient(135deg,#FFFCF5_0%,#FFFFFF_70%)] p-8 text-center shadow-[0_14px_38px_rgba(120,83,20,0.06)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
        <Sparkles size={25} strokeWidth={2.5} />
      </div>
      <div className="mt-4 text-xl font-black text-neutral-950">{title}</div>
      <p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-6 text-neutral-500">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export const premiumFieldClass = 'w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm font-bold text-neutral-950 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100/70';
export const premiumButtonClass = 'rounded-2xl bg-neutral-950 px-5 py-3.5 text-sm font-black text-white shadow-[0_12px_28px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50';
export function PremiumButton({ children, tone = 'dark', className = '', ...props }) {
  const tones = {
    dark: 'bg-neutral-950 text-white hover:bg-neutral-800',
    gold: 'bg-amber-400 text-neutral-950 hover:bg-amber-300',
    danger: 'bg-red-700 text-white hover:bg-red-600',
    secondary: 'border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50',
  };
  return <button className={`rounded-2xl px-5 py-3.5 text-sm font-black shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone] || tones.dark} ${className}`} {...props}>{children}</button>;
}

export function PremiumField({ className = '', ...props }) {
  return <input className={`${premiumFieldClass} ${className}`} {...props} />;
}

export function PremiumSelect({ className = '', children, ...props }) {
  return <select className={`${premiumFieldClass} appearance-none ${className}`} {...props}>{children}</select>;
}