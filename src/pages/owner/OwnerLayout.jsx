import { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Banknote,
  ChartNoAxesCombined,
  UsersRound,
  Star,
  Gift,
  Tags,
  Scissors,
  Package,
  Store,
  Clock3,
  CreditCard,
  ReceiptText,
  UserCog,
  Settings,
  ShieldCheck,
  Activity,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  Crown,
} from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getMyOwnerPermissions } from '../../api/ownerPermissionsApi';
import { getGoogleLinkStatus } from '../../api/ownerSecurityApi';
import {
  getCurrentSubscription,
  isSubscriptionActive,
  planLabel,
  statusLabel,
} from '../../api/ownerSubscriptionApi';
import { getOwnerLoyaltySettings } from '../../api/ownerLoyaltySettingsApi';
import { useAuth } from '../../context/AuthContext';
import GoogleLogo from '../../components/GoogleLogo';
import { hasAnyOwnerPermission } from '../../utils/ownerPermissions';
import { saveTenantMoneySettings } from '../../utils/tenantMoney';

const navGroups = [
  {
    title: 'Resumen',
    subtitle: 'Vista general',
    items: [
      {
        to: '/owner/dashboard',
        label: 'Dashboard',
        description: 'Panel principal',
        icon: LayoutDashboard,
        tone: {
          soft: 'bg-amber-50 text-amber-700 ring-amber-100',
          active: 'from-amber-500 to-yellow-400',
          glow: 'shadow-amber-300/60',
        },
        permissions: [],
      },
    ],
  },
  {
    title: 'Operación',
    subtitle: 'Ventas, agenda y caja',
    items: [
      {
        to: '/owner/caja',
        label: 'Caja',
        description: 'Ingresos y egresos',
        icon: Banknote,
        tone: {
          soft: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
          active: 'from-emerald-500 to-green-400',
          glow: 'shadow-emerald-300/60',
        },
        permissions: ['CASH_ACCESS'],
        feature: 'core',
      },
      {
        to: '/owner/agenda',
        label: 'Agenda',
        description: 'Reservas y atención',
        icon: CalendarDays,
        tone: {
          soft: 'bg-sky-50 text-sky-700 ring-sky-100',
          active: 'from-sky-500 to-blue-400',
          glow: 'shadow-sky-300/60',
        },
        permissions: ['AGENDA_ACCESS'],
        feature: 'core',
      },
      {
        to: '/owner/reportes',
        label: 'Reportes',
        description: 'Utilidad y rendimiento',
        icon: ChartNoAxesCombined,
        tone: {
          soft: 'bg-orange-50 text-orange-700 ring-orange-100',
          active: 'from-orange-500 to-amber-400',
          glow: 'shadow-orange-300/60',
        },
        permissions: ['REPORTS_ACCESS'],
        feature: 'reports',
      },
    ],
  },
  {
    title: 'Clientes y fidelización',
    subtitle: 'CRM, puntos y campañas',
    items: [
      {
        to: '/owner/clientes',
        label: 'Clientes',
        description: 'Historial y datos',
        icon: UsersRound,
        tone: {
          soft: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
          active: 'from-indigo-500 to-blue-400',
          glow: 'shadow-indigo-300/60',
        },
        permissions: ['CUSTOMERS_ACCESS'],
        feature: 'core',
      },
      {
        to: '/owner/ajustar-puntos',
        label: 'Ajustar puntos',
        description: 'Sumar o descontar',
        icon: Star,
        tone: {
          soft: 'bg-violet-50 text-violet-700 ring-violet-100',
          active: 'from-violet-500 to-purple-400',
          glow: 'shadow-violet-300/60',
        },
        permissions: ['CUSTOMERS_ACCESS'],
        feature: 'loyalty',
      },
      {
        to: '/owner/premios',
        label: 'Premios',
        description: 'Recompensas',
        icon: Gift,
        tone: {
          soft: 'bg-rose-50 text-rose-700 ring-rose-100',
          active: 'from-rose-500 to-pink-400',
          glow: 'shadow-rose-300/60',
        },
        permissions: ['CONFIG_REWARDS'],
        feature: 'loyalty',
      },
      {
        to: '/owner/promociones',
        label: 'Promociones',
        description: 'Ofertas y descuentos',
        icon: Tags,
        tone: {
          soft: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-100',
          active: 'from-fuchsia-500 to-purple-400',
          glow: 'shadow-fuchsia-300/60',
        },
        permissions: ['CONFIG_PROMOTIONS'],
        feature: 'promotions',
      },
    ],
  },
  {
    title: 'Catálogo y equipo',
    subtitle: 'Servicios, sedes y personal',
    items: [
      {
        to: '/owner/servicios',
        label: 'Servicios',
        description: 'Cortes y precios',
        icon: Scissors,
        tone: {
          soft: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
          active: 'from-cyan-500 to-sky-400',
          glow: 'shadow-cyan-300/60',
        },
        permissions: ['CONFIG_SERVICES'],
        feature: 'core',
      },
      {
        to: '/owner/productos',
        label: 'Productos',
        description: 'Inventario',
        icon: Package,
        tone: {
          soft: 'bg-lime-50 text-lime-700 ring-lime-100',
          active: 'from-lime-500 to-emerald-400',
          glow: 'shadow-lime-300/60',
        },
        permissions: ['CONFIG_PRODUCTS'],
        feature: 'core',
      },
      {
        to: '/owner/barberos',
        label: 'Barberos',
        description: 'Equipo de trabajo',
        icon: ShieldCheck,
        tone: {
          soft: 'bg-red-50 text-red-700 ring-red-100',
          active: 'from-red-500 to-orange-400',
          glow: 'shadow-red-300/60',
        },
        permissions: ['CONFIG_BARBERS'],
        feature: 'core',
      },
      {
        to: '/owner/horarios',
        label: 'Horarios',
        description: 'Disponibilidad',
        icon: Clock3,
        tone: {
          soft: 'bg-slate-100 text-slate-700 ring-slate-200',
          active: 'from-slate-700 to-slate-500',
          glow: 'shadow-slate-300/60',
        },
        permissions: ['CONFIG_BARBERS'],
        feature: 'core',
      },
      {
        to: '/owner/sedes',
        label: 'Sedes',
        description: 'Sucursales',
        icon: Store,
        tone: {
          soft: 'bg-amber-50 text-amber-700 ring-amber-100',
          active: 'from-amber-500 to-orange-400',
          glow: 'shadow-amber-300/60',
        },
        permissions: ['CONFIG_BRANCHES'],
        feature: 'core',
      },
      {
        to: '/owner/reservas-pagos',
        label: 'Métodos de pago',
        description: 'Caja y anticipos',
        icon: ReceiptText,
        tone: {
          soft: 'bg-teal-50 text-teal-700 ring-teal-100',
          active: 'from-teal-500 to-emerald-400',
          glow: 'shadow-teal-300/60',
        },
        permissions: ['CONFIG_PAYMENT_METHODS'],
        feature: 'core',
      },
    ],
  },
  {
    title: 'Administración',
    subtitle: 'Seguridad y ajustes',
    items: [
      {
        to: '/owner/auditoria',
        label: 'Auditoria',
        description: 'Cambios sensibles',
        icon: Activity,
        tone: {
          soft: 'bg-amber-50 text-amber-800 ring-amber-100',
          active: 'from-amber-500 to-yellow-400',
          glow: 'shadow-amber-300/60',
        },
        ownerOnly: true,
        feature: 'core',
      },
      {
        to: '/owner/administradores',
        label: 'Administradores',
        description: 'Usuarios y permisos',
        icon: UserCog,
        tone: {
          soft: 'bg-red-50 text-red-700 ring-red-100',
          active: 'from-red-500 to-rose-400',
          glow: 'shadow-red-300/60',
        },
        ownerOnly: true,
        feature: 'core',
      },
      {
        to: '/owner/plan-pagos',
        label: 'Plan y pagos',
        description: 'Suscripción',
        icon: CreditCard,
        tone: {
          soft: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
          active: 'from-emerald-500 to-green-400',
          glow: 'shadow-emerald-300/60',
        },
        ownerOnly: true,
      },
      {
        to: '/owner/configuracion',
        label: 'Configuración',
        description: 'Centro de control',
        icon: Settings,
        tone: {
          soft: 'bg-neutral-100 text-neutral-700 ring-neutral-200',
          active: 'from-neutral-900 to-neutral-600',
          glow: 'shadow-neutral-300/60',
        },
        permissions: ['CONFIG_ACCESS'],
      },
    ],
  },
];

function canSeeItem(item, session, permissions) {
  const role = String(session?.role || '').toUpperCase();

  if (role === 'OWNER') return true;
  if (item.ownerOnly) return false;
  if (!item.permissions || item.permissions.length === 0) return true;

  return hasAnyOwnerPermission(permissions, item.permissions);
}

function isPendingReview(subscription) {
  return String(subscription?.estado || '').trim().toUpperCase() === 'PENDING_REVIEW';
}

function isExpiredSubscription(subscription) {
  const estado = String(subscription?.estado || '').trim().toUpperCase();

  return (
    subscription?.expired === true ||
    estado === 'EXPIRED' ||
    estado === 'VENCIDO' ||
    estado === 'EXPIRADO' ||
    estado === 'CANCELLED' ||
    estado === 'CANCELADO' ||
    estado === 'PAST_DUE'
  );
}

function canOperateCore(subscription) {
  if (!subscription) return false;
  if (isPendingReview(subscription) && !isExpiredSubscription(subscription)) return true;
  return isSubscriptionActive(subscription);
}

function canUseFeature(item, subscription) {
  if (!item.feature) return true;
  if (item.to === '/owner/plan-pagos') return true;
  if (!subscription) return true;

  const coreEnabled = canOperateCore(subscription);

  if (item.feature === 'core') return coreEnabled;
  if (item.feature === 'reports') return coreEnabled;
  if (item.feature === 'loyalty') return coreEnabled && subscription?.loyaltyEnabled !== false;
  if (item.feature === 'promotions') return coreEnabled && subscription?.promotionsEnabled !== false;

  return true;
}

function findNavItemByPath(pathname) {
  return navGroups
    .flatMap((group) => group.items)
    .find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));
}

const starterActions = [
  {
    to: '/owner/caja',
    label: 'Cobrar venta',
    icon: Banknote,
    permissions: ['CASH_ACCESS'],
    feature: 'core',
  },
  {
    to: '/owner/agenda',
    label: 'Ver citas',
    icon: CalendarDays,
    permissions: ['AGENDA_ACCESS'],
    feature: 'core',
  },
  {
    to: '/owner/clientes',
    label: 'Buscar cliente',
    icon: UsersRound,
    permissions: ['CUSTOMERS_ACCESS'],
    feature: 'core',
  },
  {
    to: '/owner/configuracion',
    label: 'Configurar',
    icon: Settings,
    permissions: ['CONFIG_ACCESS'],
  },
];

function SubscriptionStatusBanner({ subscription, error }) {
  if (error) {
    return null;
  }

  if (!subscription) return null;

  const active = canOperateCore(subscription);
  const pending = isPendingReview(subscription);
  const expired = isExpiredSubscription(subscription);

  if (active && !pending) return null;

  return (
    <div className={`mb-5 rounded-[26px] border px-5 py-4 shadow-sm ${
      expired
        ? 'border-red-200 bg-red-50 text-red-800'
        : 'border-amber-200 bg-amber-50 text-amber-800'
    }`}>
      <div className="text-xs font-black uppercase tracking-[0.18em] opacity-70">
        Estado de suscripcion
      </div>
      <div className="mt-1 text-lg font-black">
        {statusLabel(subscription.estado)} · {planLabel(subscription.plan)}
      </div>
      <p className="mt-1 text-sm font-bold leading-6 opacity-80">
        {pending
          ? 'Tu pago esta en revision. Puedes seguir operando mientras no este vencido.'
          : 'La cuenta necesita renovacion para usar los modulos operativos.'}
      </p>
    </div>
  );
}

function SubscriptionBlockedView({ item, subscription, navigate }) {
  const featureLabel = item?.label || 'Este modulo';

  return (
    <div className="rounded-[34px] border border-red-200 bg-white p-8 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-red-50 text-red-700">
        <CreditCard size={30} strokeWidth={2.5} />
      </div>
      <h2 className="mt-5 text-2xl font-black text-neutral-950">
        {featureLabel} no disponible
      </h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm font-bold leading-6 text-neutral-500">
        El estado actual de la suscripcion no permite usar este modulo. Revisa el plan,
        reporta tu pago o espera la validacion si ya fue enviado.
      </p>
      {subscription && (
        <div className="mx-auto mt-5 max-w-md rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-black text-neutral-700">
          {statusLabel(subscription.estado)} · {planLabel(subscription.plan)}
        </div>
      )}
      <button
        type="button"
        onClick={() => navigate('/owner/plan-pagos')}
        className="mt-6 rounded-2xl bg-neutral-950 px-6 py-4 text-sm font-black text-white transition hover:scale-[1.01]"
      >
        Ir a Plan y pagos
      </button>
    </div>
  );
}

function PremiumNavItem({ item, closeMenu }) {
  return (
    <NavLink
      to={item.to}
      onClick={closeMenu}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-[24px] px-3.5 py-3 transition-all duration-200 ${
          isActive
            ? 'border border-neutral-950/5 bg-white text-neutral-950 shadow-[0_20px_42px_rgba(15,23,42,0.14)]'
            : 'border border-transparent text-slate-700 hover:border-neutral-200 hover:bg-white/85 hover:text-neutral-950 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div
            className={`absolute inset-y-2 left-0 w-[5px] rounded-r-full transition ${
              isActive
                ? 'bg-gradient-to-b from-neutral-950 via-amber-500 to-orange-400 opacity-100'
                : 'bg-slate-300 opacity-0 group-hover:opacity-100'
            }`}
          />

          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] ring-1 transition-all duration-200 ${
              isActive
                ? `bg-gradient-to-br ${item.tone.active} text-white ring-white shadow-xl ${item.tone.glow}`
                : `${item.tone.soft} group-hover:scale-[1.04] group-hover:shadow-md`
            }`}
          >
            <item.icon size={21} strokeWidth={2.6} />
          </div>

          <div className="min-w-0 flex-1">
            <div
              className={`truncate text-[14.5px] font-black leading-5 ${
                isActive ? 'text-neutral-950' : 'text-slate-800 group-hover:text-neutral-950'
              }`}
            >
              {item.label}
            </div>
            <div
              className={`truncate text-[11px] font-extrabold leading-4 ${
                isActive ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              {item.description}
            </div>
          </div>

          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
              isActive
                ? 'bg-neutral-950 text-white shadow-lg'
                : 'bg-white text-slate-400 shadow-sm ring-1 ring-slate-100 group-hover:bg-neutral-950 group-hover:text-white'
            }`}
          >
            <ChevronRight size={16} strokeWidth={3} />
          </div>
        </>
      )}
    </NavLink>
  );
}

function SidebarContent({ session, permissions, subscription, handleLogout, closeMenu }) {
  const visibleGroups = useMemo(() => {
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => (
          canSeeItem(item, session, permissions) && canUseFeature(item, subscription)
        )),
      }))
      .filter((group) => group.items.length > 0);
  }, [session, permissions, subscription]);

  const visibleStarterActions = useMemo(() => {
    return starterActions.filter((item) => (
      canSeeItem(item, session, permissions) && canUseFeature(item, subscription)
    ));
  }, [session, permissions, subscription]);

  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-amber-300/70 hover:scrollbar-thumb-amber-400">
      <div className="flex shrink-0 items-center justify-between gap-3 rounded-[28px] border border-amber-200/70 bg-white p-3 shadow-[0_18px_42px_rgba(15,23,42,0.09)]">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] border border-amber-300 bg-neutral-950 shadow-[0_16px_36px_rgba(15,23,42,0.18)]">
            <div className="absolute inset-1 rounded-[18px] bg-gradient-to-br from-neutral-900 to-neutral-950" />
            <img
              src="/logo-super-gods.png"
              alt="Super Gods logo"
              className="relative h-10 w-10 rounded-2xl object-cover"
            />
          </div>

          <div className="min-w-0">
            <div className="truncate text-[16px] font-black tracking-[0.18em] text-neutral-950">
              SUPER GODS
            </div>
            <div className="mt-0.5 text-[11px] font-black uppercase tracking-[0.12em] text-amber-600">
              Panel web premium
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={closeMenu}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 lg:hidden"
        >
          <X size={20} strokeWidth={2.5} />
        </button>
      </div>

      <div className="mt-4 shrink-0 overflow-hidden rounded-[30px] border border-amber-200/80 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.34),transparent_42%),linear-gradient(135deg,#ffffff_0%,#fff3d8_54%,#ffffff_100%)] p-4 shadow-[0_20px_48px_rgba(15,23,42,0.10)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-amber-700">
              <Crown size={14} strokeWidth={3} />
              Barbería activa
            </div>

            <div className="mt-2 truncate text-[21px] font-black tracking-tight text-neutral-950">
              {session?.tenantName || 'Mi barbería'}
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs font-black text-slate-600">
              <span className="truncate">{session?.userName || 'Usuario'}</span>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
              <span>{session?.role || 'OWNER'}</span>
            </div>
          </div>

          <div className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-2 text-[10px] font-black text-emerald-700 shadow-sm">
            ONLINE
          </div>
        </div>
      </div>

      {visibleStarterActions.length > 0 && (
        <section className="mt-4 rounded-[26px] border border-neutral-900 bg-neutral-950 p-3 text-white shadow-[0_18px_40px_rgba(15,23,42,0.16)]">
          <div className="px-1 text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
            Empieza aqui
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {visibleStarterActions.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `rounded-2xl px-3 py-3 transition ${
                    isActive
                      ? 'bg-amber-400 text-neutral-950'
                      : 'bg-white/8 text-white hover:bg-white/14'
                  }`
                }
              >
                <item.icon size={18} strokeWidth={2.7} />
                <div className="mt-2 text-xs font-black leading-4">
                  {item.label}
                </div>
              </NavLink>
            ))}
          </div>
        </section>
      )}

      <nav className="mt-5 grid shrink-0 gap-5 pb-5">
        {visibleGroups.map((group) => (
          <section key={group.title}>
            <div className="mb-2 flex items-center gap-3 px-2">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.20em] text-neutral-700">
                  {group.title}
                </div>
                <div className="mt-0.5 text-[11px] font-black text-slate-400">
                  {group.subtitle}
                </div>
              </div>

              <div className="h-px flex-1 bg-gradient-to-r from-amber-300/90 via-slate-200 to-transparent" />
            </div>

            <div className="grid gap-1.5 rounded-[28px] border border-amber-100/80 bg-white/60 p-2 shadow-[0_14px_36px_rgba(15,23,42,0.065)] backdrop-blur-sm">
              {group.items.map((item) => (
                <PremiumNavItem key={item.to} item={item} closeMenu={closeMenu} />
              ))}
            </div>
          </section>
        ))}
      </nav>

      <div className="mt-auto shrink-0 overflow-hidden rounded-[28px] border border-amber-200/70 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.075)]">
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-amber-700">
          <Sparkles size={15} strokeWidth={2.8} />
          Super Gods Web
        </div>

        <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
          Controla caja, clientes, agenda, fidelización y reportes desde una experiencia premium.
        </p>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-4 flex w-full shrink-0 items-center justify-center gap-2 rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
      >
        <LogOut size={17} strokeWidth={2.6} />
        Cerrar sesión
      </button>
    </div>
  );
}

export default function OwnerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [permissions, setPermissions] = useState(null);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState('');
  const [googleStatus, setGoogleStatus] = useState(null);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    }

    handleResize();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadPermissions() {
      setLoadingPermissions(true);

      try {
        const data = await getMyOwnerPermissions();

        if (mounted) {
          setPermissions(data);
        }
      } catch {
        if (mounted) {
          setPermissions({
            owner: String(session?.role || '').toUpperCase() === 'OWNER',
            permissions: [],
          });
        }
      } finally {
        if (mounted) {
          setLoadingPermissions(false);
        }
      }
    }

    if (session?.token) {
      loadPermissions();
    } else {
      setPermissions(null);
      setLoadingPermissions(false);
    }

    return () => {
      mounted = false;
    };
  }, [session?.token, session?.role]);

  useEffect(() => {
    let mounted = true;

    async function loadGoogleStatus() {
      try {
        const data = await getGoogleLinkStatus();
        if (mounted) setGoogleStatus(data);
      } catch {
        if (mounted) setGoogleStatus(null);
      }
    }

    if (session?.token && String(session?.role || '').toUpperCase() !== 'SUPER_ADMIN') {
      loadGoogleStatus();
    } else {
      setGoogleStatus(null);
    }

    return () => {
      mounted = false;
    };
  }, [session?.token, session?.role, location.pathname]);

  useEffect(() => {
    let mounted = true;

    async function loadMoneySettings() {
      try {
        const data = await getOwnerLoyaltySettings();
        if (mounted) {
          saveTenantMoneySettings(data);
        }
      } catch {
        // La moneda vuelve a PEN por defecto si la configuracion no carga.
      }
    }

    if (session?.token && String(session?.role || '').toUpperCase() !== 'SUPER_ADMIN') {
      loadMoneySettings();
    }

    return () => {
      mounted = false;
    };
  }, [session?.token, session?.role]);

  useEffect(() => {
    let mounted = true;

    async function loadSubscription() {
      setLoadingSubscription(true);
      setSubscriptionError('');

      try {
        const data = await getCurrentSubscription();

        if (mounted) {
          setSubscription(data);
        }
      } catch (error) {
        if (mounted) {
          setSubscription(null);
          setSubscriptionError(error?.message || 'No se pudo validar la suscripcion.');
        }
      } finally {
        if (mounted) {
          setLoadingSubscription(false);
        }
      }
    }

    if (session?.token && String(session?.role || '').toUpperCase() !== 'SUPER_ADMIN') {
      loadSubscription();
    } else {
      setSubscription(null);
      setLoadingSubscription(false);
      setSubscriptionError('');
    }

    return () => {
      mounted = false;
    };
  }, [session?.token, session?.role]);

  useEffect(() => {
    if (
      !loadingSubscription &&
      subscription &&
      isExpiredSubscription(subscription) &&
      location.pathname !== '/owner/plan-pagos'
    ) {
      navigate('/owner/plan-pagos', { replace: true });
    }
  }, [loadingSubscription, subscription, location.pathname, navigate]);

  function handleLogout() {
    signOut();
    navigate('/login', { replace: true });
  }

  function closeMenu() {
    setMobileMenuOpen(false);
  }

  const currentItem = findNavItemByPath(location.pathname);
  const subscriptionBlocksCurrent =
    currentItem &&
    currentItem.to !== '/owner/plan-pagos' &&
    !loadingSubscription &&
    subscription &&
    !canUseFeature(currentItem, subscription);

  const loadingShell = loadingPermissions || loadingSubscription;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_42%,#EEF2F7_100%)] text-neutral-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[360px] flex-col border-r border-amber-200/80 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.26),transparent_26%),linear-gradient(180deg,#FFFFFF_0%,#FFF4D8_34%,#F8FAFC_100%)] text-neutral-950 shadow-[22px_0_64px_rgba(15,23,42,0.11)] lg:flex">
        <SidebarContent
          session={session}
          permissions={permissions}
          subscription={subscription}
          handleLogout={handleLogout}
          closeMenu={closeMenu}
        />
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 block lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={closeMenu}
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm"
          />

          <aside className="absolute inset-y-0 left-0 flex w-[92vw] max-w-[370px] flex-col border-r border-amber-200 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.26),transparent_26%),linear-gradient(180deg,#FFFFFF_0%,#FFF4D8_34%,#F8FAFC_100%)] text-neutral-950 shadow-[22px_0_64px_rgba(0,0,0,0.22)]">
            <SidebarContent
              session={session}
              permissions={permissions}
              subscription={subscription}
              handleLogout={handleLogout}
              closeMenu={closeMenu}
            />
          </aside>
        </div>
      )}

      <main className="min-h-screen lg:pl-[360px]">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur-xl lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-950 text-white shadow-lg lg:hidden"
              >
                <Menu size={20} strokeWidth={2.7} />
              </button>

              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-600 sm:text-xs">
                  Owner Web
                </div>
                <h1 className="text-lg font-black text-neutral-950 sm:text-xl">
                  Panel de control
                </h1>
              </div>
            </div>

            <div className="hidden items-center gap-3 lg:flex">
              <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
                Sistema conectado
              </div>

              <div className="rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-black text-neutral-600">
                {session?.role || 'OWNER'}
              </div>

              <button
                type="button"
                onClick={() => navigate('/owner/seguridad')}
                className="group flex items-center gap-3 rounded-full border border-neutral-200 bg-white py-1.5 pl-2 pr-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
                title={
                  googleStatus?.linked
                    ? `Gmail conectado: ${googleStatus.email || ''}`
                    : 'Vincular Gmail'
                }
              >
                {googleStatus?.linked && googleStatus?.pictureUrl ? (
                  <img
                    src={googleStatus.pictureUrl}
                    alt={googleStatus.name || googleStatus.email || 'Cuenta Google'}
                    className="h-9 w-9 rounded-full object-cover ring-2 ring-emerald-100"
                  />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-950 text-sm font-black text-white">
                    {googleStatus?.linked ? (
                      <GoogleLogo className="h-5 w-5" />
                    ) : (
                      (session?.userName || 'G').trim().slice(0, 1).toUpperCase()
                    )}
                  </span>
                )}

                <span className="hidden max-w-[170px] xl:block">
                  <span className="block truncate text-xs font-black text-neutral-950">
                    {googleStatus?.linked
                      ? googleStatus.name || session?.userName || 'Cuenta Google'
                      : session?.userName || 'Cuenta'}
                  </span>
                  <span className="block truncate text-[11px] font-bold text-neutral-400">
                    {googleStatus?.linked
                      ? googleStatus.email || 'Gmail conectado'
                      : 'Vincular Gmail'}
                  </span>
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-bold text-white lg:hidden"
            >
              Salir
            </button>
          </div>
        </header>

        {loadingShell ? (
          <div className="p-4 sm:p-5 lg:p-8">
            <div className="rounded-[28px] border border-neutral-200 bg-white p-6 font-black text-neutral-500 shadow-sm">
              Validando permisos y suscripcion...
            </div>
          </div>
        ) : (
          <div className="max-w-full overflow-x-hidden p-4 sm:p-5 lg:p-8">
            <SubscriptionStatusBanner subscription={subscription} error={subscriptionError} />
            {subscriptionBlocksCurrent ? (
              <SubscriptionBlockedView
                item={currentItem}
                subscription={subscription}
                navigate={navigate}
              />
            ) : (
              <Outlet />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
