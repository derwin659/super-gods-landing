import { useEffect, useMemo, useState } from 'react';
import {
  BellRing,
  CalendarCheck,
  MessageCircle,
  RotateCcw,
  Save,
  Send,
  Smartphone,
  UserRoundSearch,
} from 'lucide-react';
import {
  getOwnerWhatsappSettings,
  updateOwnerWhatsappSettings,
} from '../../api/ownerWhatsappSettingsApi';

function ToggleRow({ icon: Icon, title, text, checked, onChange, badge }) {
  return (
    <label className="group flex cursor-pointer items-start gap-4 rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(15,23,42,0.08)]">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
        <Icon size={22} strokeWidth={2.4} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-black text-neutral-950">{title}</h3>
          {badge && (
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm font-semibold leading-6 text-neutral-500">{text}</p>
      </div>

      <span
        className={`relative mt-1 h-8 w-14 shrink-0 rounded-full p-1 transition ${
          checked ? 'bg-emerald-500' : 'bg-neutral-200'
        }`}
      >
        <span
          className={`block h-6 w-6 rounded-full bg-white shadow transition ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </span>

      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.08] px-4 py-3">
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
        {label}
      </div>
      <div className="mt-1 text-sm font-black text-white">{value}</div>
    </div>
  );
}

function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
      {message}
    </div>
  );
}

function providerLabel(value) {
  switch (String(value || '').toUpperCase()) {
    case 'META_CLOUD':
      return 'Meta Cloud API';
    case 'TWILIO':
      return 'Twilio WhatsApp';
    case 'BAILEYS':
      return 'QR / sesion del negocio';
    case 'MOCK':
      return 'Simulador interno';
    default:
      return 'Manual con WhatsApp del equipo';
  }
}

function statusLabel(value) {
  switch (String(value || '').toUpperCase()) {
    case 'CONNECTED':
      return 'Conectado';
    case 'PENDING':
      return 'Pendiente';
    case 'PAUSED':
      return 'Pausado';
    case 'ERROR':
      return 'Con error';
    default:
      return 'No conectado';
  }
}

export default function OwnerWhatsappSettingsPage() {
  const [settings, setSettings] = useState(null);
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
        const data = await getOwnerWhatsappSettings();
        if (active) setSettings(data);
      } catch (error) {
        if (active) setErrorMsg(error.message || 'No se pudo cargar la configuracion de WhatsApp.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  function updateField(field, value) {
    setSettings((current) => ({
      ...(current || {}),
      [field]: value,
    }));
    setSuccessMsg('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!settings) return;

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const data = await updateOwnerWhatsappSettings(settings);
      setSettings(data);
      setSuccessMsg('Configuracion de WhatsApp actualizada.');
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo guardar la configuracion.');
    } finally {
      setSaving(false);
    }
  }

  const previewMessage = useMemo(() => {
    if (!settings) return '';

    const lines = [
      'Hola Nicolas, gracias por tu visita a Barberia Paradise.',
      '',
      'Ganaste +150 puntos por tu compra.',
      'Ahora tienes 420 puntos disponibles.',
    ];

    if (settings.includeAppDownloadLink) {
      lines.push(
        '',
        'Descarga la app movil de Super Gods para ver tus puntos, premios y reservas:',
        settings.appDownloadUrl,
        '',
        'Para ver tus puntos en la app:',
        '1. Ingresa como cliente.',
        '2. Coloca el codigo del negocio: PARADISE.',
        '3. Revisa tus puntos, premios y proximas reservas.'
      );
    }

    if (settings.includeBookingLink) {
      lines.push(
        '',
        'Tambien puedes reservar tu proxima cita desde la app o por este link y seguir ganando puntos:',
        'https://www.supergodsapp.com/reservar/PARADISE'
      );
    }

    lines.push('', 'Te esperamos pronto.');
    return lines.join('\n');
  }, [settings]);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[34px] border border-emerald-400/15 bg-[linear-gradient(135deg,#07110E_0%,#101827_58%,#07110E_100%)] p-6 text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(16,185,129,0.24),transparent_30%),radial-gradient(circle_at_100%_0%,rgba(251,191,36,0.15),transparent_34%)]" />
        <div className="relative grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
          <div>
            <div className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
              WhatsApp CRM
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight">
              Mensajes que hacen volver al cliente
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65">
              Controla el mensaje post-venta, el link de descarga de la app, reservas y recordatorios para cada negocio.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatPill label="Post-venta" value={settings?.postSaleMessageEnabled ? 'Activo' : 'Pausado'} />
            <StatPill label="App" value={settings?.includeAppDownloadLink ? 'Incluida' : 'Oculta'} />
            <StatPill label="Reservas" value={settings?.includeBookingLink ? 'Incluidas' : 'Ocultas'} />
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-5">
        <ErrorBox message={errorMsg} />

        {successMsg && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
            {successMsg}
          </div>
        )}

        {loading ? (
          <div className="rounded-[30px] border border-neutral-200 bg-white p-10 text-center font-black text-neutral-500">
            Cargando configuracion...
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
            <div className="space-y-4">
              <div className="rounded-[26px] border border-neutral-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
                      Conexion WhatsApp
                    </div>
                    <h2 className="mt-1 text-2xl font-black text-neutral-950">
                      {providerLabel(settings?.provider)}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-neutral-500">
                      {settings?.connected
                        ? 'Los envios automaticos pueden usar el proveedor conectado.'
                        : 'Por ahora el equipo envia manualmente desde el enlace de WhatsApp.'}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] ${
                      settings?.connected
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                        : 'bg-amber-50 text-amber-700 ring-1 ring-amber-100'
                    }`}
                  >
                    {statusLabel(settings?.connectionStatus)}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-black text-neutral-700">Proveedor</span>
                    <select
                      value={settings?.provider || 'MANUAL'}
                      onChange={(event) => updateField('provider', event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-bold text-neutral-950 outline-none focus:border-neutral-950"
                    >
                      <option value="MANUAL">Manual</option>
                      <option value="MOCK">Simulador interno</option>
                      <option value="META_CLOUD">Meta Cloud API</option>
                      <option value="TWILIO">Twilio</option>
                      <option value="BAILEYS">QR / sesion</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-black text-neutral-700">Estado</span>
                    <select
                      value={settings?.connectionStatus || 'NOT_CONNECTED'}
                      onChange={(event) => updateField('connectionStatus', event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-bold text-neutral-950 outline-none focus:border-neutral-950"
                    >
                      <option value="NOT_CONNECTED">No conectado</option>
                      <option value="PENDING">Pendiente</option>
                      <option value="CONNECTED">Conectado</option>
                      <option value="PAUSED">Pausado</option>
                      <option value="ERROR">Con error</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-black text-neutral-700">Numero remitente</span>
                    <input
                      value={settings?.senderPhone || ''}
                      onChange={(event) => updateField('senderPhone', event.target.value)}
                      placeholder="+51958062847"
                      className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-bold text-neutral-950 outline-none focus:border-neutral-950"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-black text-neutral-700">Nombre visible</span>
                    <input
                      value={settings?.senderLabel || ''}
                      onChange={(event) => updateField('senderLabel', event.target.value)}
                      placeholder="Barberia Paradise"
                      className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-bold text-neutral-950 outline-none focus:border-neutral-950"
                    />
                  </label>
                </div>
              </div>

              <ToggleRow
                icon={MessageCircle}
                title="Mensaje al finalizar una venta"
                text="Cuando el dueno aprueba una venta, se muestra el mensaje listo para enviar por WhatsApp al cliente."
                checked={!!settings?.postSaleMessageEnabled}
                onChange={(value) => updateField('postSaleMessageEnabled', value)}
                badge="Recomendado"
              />

              <ToggleRow
                icon={Smartphone}
                title="Incluir link de descarga de la app"
                text="Invita al cliente a entrar como cliente, usar el codigo del negocio y ver sus puntos y premios."
                checked={!!settings?.includeAppDownloadLink}
                onChange={(value) => updateField('includeAppDownloadLink', value)}
              />

              <ToggleRow
                icon={CalendarCheck}
                title="Incluir link de reserva"
                text="Agrega el link publico del negocio para que el cliente reserve otra cita y siga acumulando puntos."
                checked={!!settings?.includeBookingLink}
                onChange={(value) => updateField('includeBookingLink', value)}
              />

              <ToggleRow
                icon={BellRing}
                title="Recordatorio 60 minutos antes"
                text="Preparado para recordatorios automaticos antes de la cita cuando activemos el envio conectado."
                checked={!!settings?.appointmentReminder60Enabled}
                onChange={(value) => updateField('appointmentReminder60Enabled', value)}
                badge="Siguiente"
              />

              <ToggleRow
                icon={BellRing}
                title="Recordatorio 24 horas antes"
                text="Ideal para negocios con reservas anticipadas y servicios largos."
                checked={!!settings?.appointmentReminder24hEnabled}
                onChange={(value) => updateField('appointmentReminder24hEnabled', value)}
              />

              <ToggleRow
                icon={UserRoundSearch}
                title="Clientes inactivos"
                text="Deja listo el switch para futuras campanas automaticas de recuperacion."
                checked={!!settings?.inactiveCustomerFollowUpEnabled}
                onChange={(value) => updateField('inactiveCustomerFollowUpEnabled', value)}
                badge="CRM"
              />

              <div className="rounded-[26px] border border-neutral-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
                <label className="block">
                  <span className="text-sm font-black text-neutral-700">
                    Link de descarga de la app movil
                  </span>
                  <input
                    value={settings?.appDownloadUrl || ''}
                    onChange={(event) => updateField('appDownloadUrl', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-bold text-neutral-950 outline-none focus:border-neutral-950"
                  />
                </label>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-[30px] border border-neutral-200 bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,0.05)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-neutral-950 text-white">
                    <Send size={21} />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-neutral-400">
                      Vista previa
                    </div>
                    <h3 className="text-lg font-black text-neutral-950">Mensaje post-venta</h3>
                  </div>
                </div>

                <pre className="mt-4 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-[22px] border border-neutral-200 bg-neutral-50 p-4 text-sm font-semibold leading-6 text-neutral-700">
                  {settings?.postSaleMessageEnabled ? previewMessage : 'El mensaje post-venta esta pausado.'}
                </pre>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-sm font-black text-neutral-700 transition hover:bg-neutral-50"
                >
                  <RotateCcw size={18} />
                  Recargar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex flex-[1.4] items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 py-4 text-sm font-black text-white transition hover:scale-[1.01] disabled:opacity-60"
                >
                  <Save size={18} />
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </aside>
          </div>
        )}
      </form>
    </div>
  );
}
