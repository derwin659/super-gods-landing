import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  Gift,
  ShieldCheck,
  Scissors,
  Store,
  UserRoundPlus,
} from 'lucide-react';
import { apiRequest } from '../../api/apiClient';
import { getGoogleLinkStatus } from '../../api/ownerSecurityApi';
import GoogleLogo from '../../components/GoogleLogo';
import { useAuth } from '../../context/AuthContext';
import { formatTenantMoney } from '../../utils/tenantMoney';

function formatMoney(value) {
  return formatTenantMoney(value);
}

function MetricCard({ title, value, helper, tone = 'default' }) {
  const styles = {
    default:
      'border-neutral-200 bg-white text-neutral-950 shadow-[0_14px_35px_rgba(15,23,42,0.05)]',
    gold:
      'border-amber-200 bg-[linear-gradient(135deg,#FFFBEB_0%,#FFFFFF_55%,#FFF7ED_100%)] text-neutral-950 shadow-[0_14px_35px_rgba(251,191,36,0.10)]',
    dark:
      'border-neutral-900 bg-[linear-gradient(135deg,#080808_0%,#111827_100%)] text-white shadow-[0_18px_45px_rgba(15,23,42,0.16)]',
  };

  return (
    <div className={`rounded-[30px] border p-6 ${styles[tone]}`}>
      <div
        className={
          tone === 'dark'
            ? 'text-sm font-bold text-white/55'
            : 'text-sm font-bold text-neutral-500'
        }
      >
        {title}
      </div>

      <div
        className={
          tone === 'dark'
            ? 'mt-3 text-3xl font-black text-white'
            : 'mt-3 text-3xl font-black text-neutral-950'
        }
      >
        {value}
      </div>

      {helper && (
        <div
          className={
            tone === 'dark'
              ? 'mt-2 text-sm text-white/45'
              : 'mt-2 text-sm text-neutral-500'
          }
        >
          {helper}
        </div>
      )}
    </div>
  );
}

function QuickAction({ title, text, label }) {
  return (
    <div className="rounded-[26px] border border-neutral-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.045)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-950 text-amber-400">
          ✦
        </div>

        <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">
          {label}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-black text-neutral-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-neutral-500">{text}</p>
    </div>
  );
}

function firstPositiveNumber(...values) {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return 0;
}

function OnboardingChecklist({
  dashboard,
  branches,
  activeBarbers,
  totalAppointments,
  totalSales,
}) {
  const servicesCount = firstPositiveNumber(
    dashboard?.servicesCount,
    dashboard?.activeServices,
    dashboard?.totalServices,
    dashboard?.serviceCount,
  );

  const rewardsCount = firstPositiveNumber(
    dashboard?.rewardsCount,
    dashboard?.activeRewards,
    dashboard?.promotionsCount,
    dashboard?.activePromotions,
  );

  const items = [
    {
      title: 'Crea tu primera sede',
      text: 'Define donde atiende tu negocio y desde donde se reporta la caja.',
      to: '/owner/sedes',
      label: 'Sedes',
      icon: Store,
      done: branches.length > 0,
    },
    {
      title: 'Agrega servicios',
      text: 'Carga cortes, estetica, spa u otros servicios con precio y duracion.',
      to: '/owner/servicios',
      label: 'Catalogo',
      icon: Scissors,
      done: servicesCount > 0 || dashboard?.hasServices === true,
    },
    {
      title: 'Invita profesionales',
      text: 'Crea barberos, estilistas o administradores para operar la agenda.',
      to: '/owner/barberos',
      label: 'Equipo',
      icon: UserRoundPlus,
      done: Number(activeBarbers || 0) > 0 || dashboard?.hasBarbers === true,
    },
    {
      title: 'Configura horarios',
      text: 'Activa disponibilidad para que las reservas entren sin friccion.',
      to: '/owner/horarios',
      label: 'Agenda',
      icon: CalendarCheck,
      done: dashboard?.scheduleConfigured === true || Number(totalAppointments || 0) > 0,
    },
    {
      title: 'Abre caja o registra venta',
      text: 'Valida efectivo, Yape, Plin, tarjeta y movimientos del dia.',
      to: '/owner/caja',
      label: 'Caja',
      icon: CreditCard,
      done: Number(totalSales || 0) > 0 || dashboard?.cashConfigured === true,
    },
    {
      title: 'Prepara fidelizacion',
      text: 'Crea premios, promociones o reglas de puntos para que vuelvan.',
      to: '/owner/premios',
      label: 'Puntos',
      icon: Gift,
      done: rewardsCount > 0 || dashboard?.loyaltyConfigured === true,
    },
  ];

  const completed = items.filter((item) => item.done).length;
  const progress = Math.round((completed / items.length) * 100);

  return (
    <section className="rounded-[32px] border border-neutral-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.055)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
            Puesta en marcha
          </div>
          <h3 className="mt-2 text-2xl font-black text-neutral-950">
            Primeros pasos para vender mejor
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
            Completa lo esencial para que tu negocio quede listo en web y app:
            servicios, equipo, agenda, caja y fidelizacion.
          </p>
        </div>

        <div className="min-w-[210px] rounded-3xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
              Avance
            </span>
            <span className="text-lg font-black text-neutral-950">
              {completed}/{items.length}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#F59E0B,#111827)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.title}
              to={item.to}
              className="group rounded-[26px] border border-neutral-200 bg-neutral-50/60 p-4 transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-white hover:shadow-[0_14px_34px_rgba(15,23,42,0.07)]"
            >
              <div className="flex items-start gap-4">
                <div
                  className={
                    item.done
                      ? 'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700'
                      : 'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-amber-400'
                  }
                >
                  {item.done ? <CheckCircle2 size={21} /> : <Icon size={21} />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={
                        item.done
                          ? 'rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700'
                          : 'rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-700'
                      }
                    >
                      {item.done ? 'Listo' : item.label}
                    </span>

                    <ArrowRight
                      size={18}
                      className="text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-neutral-950"
                    />
                  </div>

                  <h4 className="mt-3 text-base font-black text-neutral-950">
                    {item.title}
                  </h4>
                  <p className="mt-1 text-sm leading-6 text-neutral-500">
                    {item.text}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function GoogleSecurityCard({ status, loading }) {
  const linked = status?.linked === true;

  return (
    <section className="rounded-[32px] border border-neutral-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.055)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div
            className={
              linked
                ? 'flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                : 'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-amber-400'
            }
          >
            {linked && status?.pictureUrl ? (
              <img
                src={status.pictureUrl}
                alt={status.name || status.email || 'Cuenta Google'}
                className="h-full w-full object-cover"
              />
            ) : (
              linked ? <GoogleLogo className="h-7 w-7" /> : <ShieldCheck size={24} strokeWidth={2.6} />
            )}
          </div>

          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
              Acceso con Google
            </div>
            <h3 className="mt-1 text-xl font-black text-neutral-950">
              {loading
                ? 'Verificando Gmail...'
                : linked
                  ? 'Gmail conectado'
                  : 'Conecta tu Gmail'}
            </h3>
            <p className="mt-1 truncate text-sm font-semibold text-neutral-500">
              {loading
                ? 'Estamos revisando el estado de tu cuenta.'
                : linked
                  ? `${status?.name || 'Cuenta Google'} · ${status?.email || 'correo no disponible'}`
                  : 'Entra mas rapido y mantiene el mismo tenant, rol y permisos.'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <span
            className={
              linked
                ? 'rounded-full bg-emerald-100 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-700'
                : 'rounded-full bg-amber-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-amber-700'
            }
          >
            {linked ? 'Activo' : 'Pendiente'}
          </span>
          <Link
            to="/owner/seguridad"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#0F2A5F]"
          >
            {linked ? 'Ver cuenta' : 'Vincular ahora'}
            <ArrowRight size={17} strokeWidth={2.7} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function OwnerDashboardPage() {
  const { session } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [googleStatus, setGoogleStatus] = useState(null);
  const [loadingGoogleStatus, setLoadingGoogleStatus] = useState(true);

  async function loadDashboard({ silent = false } = {}) {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setErrorMsg('');

    try {
      const data = await apiRequest('/api/owner/home/dashboard');
      setDashboard(data);
      setLastUpdate(new Date());
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo cargar el dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadGoogleStatus() {
      setLoadingGoogleStatus(true);
      try {
        const status = await getGoogleLinkStatus();
        if (alive) setGoogleStatus(status);
      } catch {
        if (alive) setGoogleStatus(null);
      } finally {
        if (alive) setLoadingGoogleStatus(false);
      }
    }

    loadGoogleStatus();
    return () => {
      alive = false;
    };
  }, []);

  const branches = useMemo(() => {
    return Array.isArray(dashboard?.branches) ? dashboard.branches : [];
  }, [dashboard]);

  const totalSales =
    dashboard?.todaySales ??
    dashboard?.totalSalesToday ??
    branches.reduce((sum, item) => sum + Number(item.todaySales || 0), 0);

  const totalAppointments =
    dashboard?.todayAppointments ??
    dashboard?.appointmentsToday ??
    branches.reduce((sum, item) => sum + Number(item.todayAppointments || 0), 0);

  const activeBarbers = dashboard?.activeBarbers ?? 0;
  const averageTicket = dashboard?.averageTicket ?? 0;

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[34px] border border-amber-400/15 bg-[linear-gradient(135deg,#090909_0%,#15110A_42%,#101827_100%)] p-6 text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(251,191,36,0.20),transparent_30%),radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.16),transparent_32%)]" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
              Dashboard en vivo
            </div>

            <h2 className="mt-5 text-4xl font-black tracking-tight">
              {session?.tenantName || 'Tu barbería'}
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">
              Controla ventas, citas, sedes y rendimiento diario desde el panel
              web premium de Super Gods.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/35">
                  Usuario
                </div>
                <div className="mt-1 text-sm font-black">
                  {session?.userName || 'Dueño'} · {session?.role}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-300/70">
                  Estado
                </div>
                <div className="mt-1 text-sm font-black text-emerald-300">
                  Sistema conectado
                </div>
              </div>

              {lastUpdate && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3">
                  <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/35">
                    Última actualización
                  </div>
                  <div className="mt-1 text-sm font-black">
                    {lastUpdate.toLocaleTimeString('es-PE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => loadDashboard({ silent: true })}
            disabled={refreshing}
            className="rounded-2xl bg-amber-400 px-6 py-4 text-sm font-black text-neutral-950 shadow-[0_16px_35px_rgba(251,191,36,0.22)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? 'Actualizando...' : 'Actualizar ahora'}
          </button>
        </div>
      </section>

      {loading && (
        <div className="rounded-[28px] border border-neutral-200 bg-white p-6 font-bold text-neutral-700 shadow-sm">
          Cargando dashboard...
        </div>
      )}

      {errorMsg && (
        <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 font-bold text-red-700 shadow-sm">
          {errorMsg}
        </div>
      )}

      {!loading && !errorMsg && (
        <>
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Ventas de hoy"
              value={formatMoney(totalSales)}
              helper="Total vendido en el día"
              tone="gold"
            />

            <MetricCard
              title="Citas de hoy"
              value={totalAppointments}
              helper="Reservas registradas"
            />

            <MetricCard
              title="Barberos activos"
              value={activeBarbers}
              helper="Equipo disponible"
            />

            <MetricCard
              title="Ticket promedio"
              value={formatMoney(averageTicket)}
              helper="Promedio por venta"
              tone="dark"
            />
          </section>

          <OnboardingChecklist
            dashboard={dashboard}
            branches={branches}
            activeBarbers={activeBarbers}
            totalAppointments={totalAppointments}
            totalSales={totalSales}
          />

          <GoogleSecurityCard
            status={googleStatus}
            loading={loadingGoogleStatus}
          />

          <section className="grid gap-5 xl:grid-cols-[1.45fr_0.55fr]">
            <div className="rounded-[32px] border border-neutral-200 bg-white p-6 shadow-[0_16px_45px_rgba(15,23,42,0.05)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
                    Sucursales
                  </div>

                  <h3 className="mt-2 text-2xl font-black text-neutral-950">
                    Rendimiento por sede
                  </h3>

                  <p className="mt-1 text-sm text-neutral-500">
                    Ventas, citas y ticket promedio del día.
                  </p>
                </div>

                <div className="rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-black text-neutral-700">
                  {branches.length} sede{branches.length === 1 ? '' : 's'}
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-[26px] border border-neutral-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[linear-gradient(135deg,#090909_0%,#111827_100%)] text-white">
                    <tr>
                      <th className="px-5 py-4 font-black">Sede</th>
                      <th className="px-5 py-4 font-black">Ventas hoy</th>
                      <th className="px-5 py-4 font-black">Citas</th>
                      <th className="px-5 py-4 font-black">Ticket</th>
                    </tr>
                  </thead>

                  <tbody>
                    {branches.length === 0 ? (
                      <tr>
                        <td className="px-5 py-6 text-neutral-500" colSpan="4">
                          No hay sedes para mostrar.
                        </td>
                      </tr>
                    ) : (
                      branches.map((branch) => (
                        <tr
                          key={branch.branchId || branch.id}
                          className="border-t border-neutral-200 transition hover:bg-amber-50/50"
                        >
                          <td className="px-5 py-5">
                            <div className="font-black text-neutral-950">
                              {branch.branchName || branch.nombre || 'Sede'}
                            </div>

                            <div className="mt-1 text-xs font-medium text-neutral-400">
                              ID: {branch.branchId || branch.id || '-'}
                            </div>
                          </td>

                          <td className="px-5 py-5 font-black text-neutral-950">
                            {formatMoney(branch.todaySales)}
                          </td>

                          <td className="px-5 py-5 font-bold text-neutral-700">
                            {branch.todayAppointments ?? 0}
                          </td>

                          <td className="px-5 py-5 font-bold text-neutral-700">
                            {formatMoney(branch.averageTicket)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-[32px] border border-neutral-200 bg-white p-6 shadow-[0_16px_45px_rgba(15,23,42,0.05)]">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
                Acciones rápidas
              </div>

              <h3 className="mt-2 text-2xl font-black text-neutral-950">
                Operación
              </h3>

              <div className="mt-5 space-y-4">
                <QuickAction
                  title="Revisar caja"
                  label="Caja"
                  text="Consulta caja abierta, efectivo, Yape, tarjeta, ingresos y gastos."
                />

                <QuickAction
                  title="Ver agenda"
                  label="Agenda"
                  text="Revisa reservas del día, pagos iniciales y estados de atención."
                />

                <QuickAction
                  title="Analizar reportes"
                  label="Reportes"
                  text="Visualiza ventas por sede, barbero, método de pago y rentabilidad."
                />
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
