import { AlertTriangle, Sparkles, X } from 'lucide-react';
import { createRoot } from 'react-dom/client';
import { useState } from 'react';

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
export function PremiumModalShell({ title, subtitle, children, onClose, maxWidth = 'max-w-4xl' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 px-4 py-8 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="premium-modal-title">
      <div className={`premium-enter max-h-[92vh] w-full ${maxWidth} overflow-auto rounded-[34px] border border-white/10 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.35)]`}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {subtitle && <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">{subtitle}</div>}
            <h2 id="premium-modal-title" className="mt-1 text-2xl font-black text-neutral-950">{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-neutral-700 transition hover:bg-neutral-100"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PremiumConfirmDialog({ message, title, confirmLabel, destructive, resolve }) {
  return (
    <PremiumModalShell title={title} subtitle="Confirmación segura" onClose={() => resolve(false)} maxWidth="max-w-lg">
      <p className="text-sm font-semibold leading-7 text-neutral-600">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <PremiumButton type="button" tone="secondary" onClick={() => resolve(false)}>Cancelar</PremiumButton>
        <PremiumButton type="button" tone={destructive ? 'danger' : 'dark'} onClick={() => resolve(true)}>{confirmLabel}</PremiumButton>
      </div>
    </PremiumModalShell>
  );
}

export function premiumConfirm(message, options = {}) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  return new Promise((finish) => {
    const resolve = (value) => {
      root.unmount();
      host.remove();
      finish(value);
    };
    root.render(
      <PremiumConfirmDialog
        message={message}
        title={options.title || 'Confirmar acción'}
        confirmLabel={options.confirmLabel || 'Confirmar'}
        destructive={options.destructive !== false}
        resolve={resolve}
      />,
    );
  });
}
function PremiumPromptDialog({ message, title, confirmLabel, placeholder, resolve }) {
  const [value, setValue] = useState("");
  const cleanValue = value.trim();
  return (
    <PremiumModalShell title={title} subtitle="Registro auditado" onClose={() => resolve(null)} maxWidth="max-w-lg">
      <p className="text-sm font-semibold leading-7 text-neutral-600">{message}</p>
      <textarea autoFocus rows={4} value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} className={`${premiumFieldClass} mt-4 resize-none`} />
      <div className="mt-6 flex justify-end gap-3">
        <PremiumButton type="button" tone="secondary" onClick={() => resolve(null)}>Cancelar</PremiumButton>
        <PremiumButton type="button" tone="danger" disabled={cleanValue.length < 3} onClick={() => resolve(cleanValue)}>{confirmLabel}</PremiumButton>
      </div>
    </PremiumModalShell>
  );
}

export function premiumPrompt(message, options = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  return new Promise((finish) => {
    const resolve = (value) => {
      root.unmount();
      host.remove();
      finish(value);
    };
    root.render(
      <PremiumPromptDialog
        message={message}
        title={options.title || "Indica el motivo"}
        confirmLabel={options.confirmLabel || "Guardar motivo"}
        placeholder={options.placeholder || "Escribe un motivo claro..."}
        resolve={resolve}
      />,
    );
  });
}
