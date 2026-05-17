import { useEffect, useMemo, useState } from 'react';
import { demoRequestApi } from '../../api/demoRequestApi';

const businessTypeLabels = {
  BARBERSHOP: 'Barbería',
  BEAUTY_SALON: 'Salón de belleza',
  SPA: 'Spa / estética',
  TATTOO_STUDIO: 'Tattoo studio',
  NAILS: 'Uñas / nails',
  BROWS_LASHES: 'Cejas y pestañas',
  HAIR_SALON: 'Peluquería',
  OTHER: 'Otro rubro',
};

const statusLabels = {
  PENDING_REVIEW: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  SUSPICIOUS: 'Sospechosa',
  CONVERTED_TO_TENANT: 'Cuenta creada',
};

const WHATSAPP_APP_LINK =
  'https://play.google.com/store/apps/details?id=com.gods.barberia';

const WEB_LOGIN_LINK =
  import.meta.env.VITE_WEB_LOGIN_URL || `${window.location.origin}/login`;

export default function SuperAdminDemoRequests() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING_REVIEW');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setError('');

      const data =
        statusFilter === 'PENDING_REVIEW'
          ? await demoRequestApi.getPending()
          : await demoRequestApi.getAll();

      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'No se pudieron cargar las solicitudes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [statusFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      if (!q) return true;

      return [
        item.businessName,
        item.businessType,
        item.ownerName,
        item.ownerEmail,
        item.ownerPhone,
        item.country,
        item.city,
        item.status,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [items, query, statusFilter]);

  async function approve(item) {
    const notes = window.prompt(
      `Notas para aprobar la solicitud de ${item.businessName || 'este negocio'}:`,
      'Solicitud aprobada. Cuenta demo creada por 7 días.'
    );

    if (notes === null) return;

    try {
      setProcessingId(item.id);
      const approved = await demoRequestApi.approve(item.id, notes);
      await load();

      setTimeout(() => {
        copyWhatsAppMessage(approved || item);
      }, 200);
    } catch (e) {
      alert(e.message || 'No se pudo aprobar la solicitud.');
    } finally {
      setProcessingId(null);
    }
  }

  async function reject(item) {
    const notes = window.prompt(
      `Motivo para rechazar la solicitud de ${item.businessName || 'este negocio'}:`,
      'No cumple con los datos mínimos para activar la demo.'
    );

    if (notes === null) return;

    try {
      setProcessingId(item.id);
      await demoRequestApi.reject(item.id, notes);
      await load();
    } catch (e) {
      alert(e.message || 'No se pudo rechazar la solicitud.');
    } finally {
      setProcessingId(null);
    }
  }

  async function suspicious(item) {
    const notes = window.prompt(
      `Motivo para marcar como sospechosa la solicitud de ${item.businessName || 'este negocio'}:`,
      'Datos incompletos o posible solicitud no válida.'
    );

    if (notes === null) return;

    try {
      setProcessingId(item.id);
      await demoRequestApi.markSuspicious(item.id, notes);
      await load();
    } catch (e) {
      alert(e.message || 'No se pudo marcar como sospechosa.');
    } finally {
      setProcessingId(null);
    }
  }

  function buildWhatsAppMessage(item) {
    return `🎉 Tu cuenta demo en Super Gods ya está lista

Hola ${item.ownerName || ''}, ya activamos tu acceso gratis por 7 días para ${
      item.businessName || 'tu negocio'
    }.

Puedes ingresar desde:

🌐 Web:
${WEB_LOGIN_LINK}

📲 App Android:
${WHATSAPP_APP_LINK}

🔐 Datos de acceso:
Usuario: ${item.ownerEmail || ''}
Contraseña temporal: 123456

Te recomendamos cambiar tu contraseña al ingresar.

Cualquier duda me escribes y te ayudo con la configuración inicial.`;
  }

  async function copyWhatsAppMessage(item) {
    const text = buildWhatsAppMessage(item);

    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      window.prompt('Copia este mensaje para WhatsApp:', text);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#E9DED0] bg-gradient-to-br from-[#FFFCF8] to-[#F4E8D7] p-6 shadow-sm">
        <div className="inline-flex rounded-full border border-[#E9DED0] bg-white/70 px-3 py-2 text-xs font-black uppercase tracking-wider text-[#AF8750]">
          Solicitudes públicas
        </div>

        <h1 className="mt-4 text-3xl font-black text-[#1F1A14]">
          Solicitudes de demo
        </h1>

        <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#7A6F63]">
          Revisa los negocios que solicitaron una demo desde la web. Puedes aprobar,
          rechazar o marcar como sospechosa cada solicitud antes de crear la cuenta.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_220px]">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por negocio, dueño, correo, WhatsApp, ciudad o rubro"
            className="w-full rounded-2xl border border-[#E9DED0] bg-white px-4 py-3 font-bold outline-none focus:border-[#AF8750]"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-2xl border border-[#E9DED0] bg-white px-4 py-3 font-bold outline-none focus:border-[#AF8750]"
          >
            <option value="PENDING_REVIEW">Pendientes</option>
            <option value="CONVERTED_TO_TENANT">Cuentas creadas</option>
            <option value="REJECTED">Rechazadas</option>
            <option value="SUSPICIOUS">Sospechosas</option>
            <option value="ALL">Todas</option>
          </select>
        </div>
      </section>

      {loading && (
        <div className="rounded-3xl bg-white p-8 font-bold">
          Cargando solicitudes...
        </div>
      )}

      {error && (
        <div className="rounded-3xl border border-red-100 bg-red-50 p-5 font-bold text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-3xl border border-[#E9DED0] bg-white p-10 text-center">
          <div className="text-5xl">📩</div>
          <h2 className="mt-4 text-xl font-black">No hay solicitudes para mostrar</h2>
          <p className="mt-2 text-sm font-semibold text-[#7A6F63]">
            Cuando alguien solicite una demo desde la web aparecerá aquí.
          </p>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {filtered.map((item) => {
          const processing = processingId === item.id;
          const converted = item.status === 'CONVERTED_TO_TENANT';

          return (
            <article
              key={item.id}
              className="rounded-3xl border border-[#E9DED0] bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-black text-[#1F1A14]">
                    {item.businessName || '-'}
                  </h2>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <Chip>{businessTypeLabels[item.businessType] || item.businessType || '-'}</Chip>
                    <Chip>{statusLabels[item.status] || item.status || '-'}</Chip>
                    {item.createdTenantId && <Chip>Tenant #{item.createdTenantId}</Chip>}
                  </div>
                </div>

                <div className="rounded-2xl bg-blue-50 px-4 py-3 text-right">
                  <div className="text-xs font-black text-blue-700">Profesionales</div>
                  <div className="text-xl font-black text-blue-900">
                    {item.professionalsCount ?? '-'}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 text-sm font-semibold text-[#51483E] md:grid-cols-2">
                <Info label="Dueño" value={item.ownerName} />
                <Info label="Correo" value={item.ownerEmail} />
                <Info label="WhatsApp" value={item.ownerPhone} />
                <Info label="Ubicación" value={[item.city, item.country].filter(Boolean).join(', ')} />
                <Info label="Sedes" value={item.branchesCount} />
                <Info label="Fecha" value={formatDate(item.createdAt)} />
              </div>

              {item.socialLink && (
                <a
                  href={item.socialLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 block rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50"
                >
                  Ver red social / web
                </a>
              )}

              {item.googleMapsLink && (
                <a
                  href={item.googleMapsLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50"
                >
                  Ver Google Maps
                </a>
              )}

              {item.message && (
                <div className="mt-4 rounded-2xl bg-[#FFFCF8] p-4 text-sm font-semibold leading-6 text-[#51483E]">
                  {item.message}
                </div>
              )}

              {item.reviewNotes && (
                <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
                  Nota: {item.reviewNotes}
                </div>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {item.status === 'PENDING_REVIEW' && (
                  <>
                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => approve(item)}
                      className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {processing ? 'Procesando...' : 'Aprobar'}
                    </button>

                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => reject(item)}
                      className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-60"
                    >
                      Rechazar
                    </button>

                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => suspicious(item)}
                      className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-white transition hover:bg-amber-600 disabled:opacity-60"
                    >
                      Sospechoso
                    </button>
                  </>
                )}

                {(converted || item.ownerEmail) && (
                  <button
                    type="button"
                    onClick={() => copyWhatsAppMessage(item)}
                    className="rounded-2xl border border-[#E9DED0] bg-white px-4 py-3 text-sm font-black text-[#1F1A14] transition hover:bg-slate-50"
                  >
                    {copiedId === item.id ? 'Copiado ✅' : 'Copiar WhatsApp'}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Chip({ children }) {
  return (
    <span className="rounded-full border border-[#E9DED0] bg-[#FFFCF8] px-3 py-1 text-xs font-black text-[#7A6F63]">
      {children}
    </span>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <div className="text-xs font-black uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="mt-1 break-words font-black text-slate-800">
        {value || '-'}
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return '-';

  try {
    return new Date(value).toLocaleString('es-PE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return value;
  }
}