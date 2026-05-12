import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/owner/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/owner/caja', label: 'Caja', icon: '💰' },
  { to: '/owner/agenda', label: 'Agenda', icon: '📅' },
  { to: '/owner/clientes', label: 'Clientes', icon: '👥' },
  { to: '/owner/servicios', label: 'Servicios', icon: '✂️' },
  { to: '/owner/barberos', label: 'Barberos', icon: '💈' },
  { to: '/owner/horarios', label: 'Horarios', icon: '🕒' },
  { to: '/owner/sedes', label: 'Sedes', icon: '🏪' },
  { to: '/owner/productos', label: 'Productos', icon: '📦' },
  { to: '/owner/premios', label: 'Premios', icon: '🎁' },
  { to: '/owner/promociones', label: 'Promociones', icon: '🏷️' },
  { to: '/owner/reservas-pagos', label: 'Reservas y pagos', icon: '🧾' },
  { to: '/owner/reportes', label: 'Reportes', icon: '📈' },
  { to: '/owner/configuracion', label: 'Configuración', icon: '⚙️' },
];

export default function OwnerLayout() {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();

  function handleLogout() {
    signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_42%,#EEF2F7_100%)] text-neutral-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-80 flex-col border-r border-white/10 bg-[linear-gradient(180deg,#050505_0%,#090909_50%,#111827_100%)] text-white shadow-[18px_0_60px_rgba(15,23,42,0.16)] lg:flex">
        <div className="flex h-full flex-col overflow-y-auto px-5 py-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 hover:scrollbar-thumb-white/35">
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10">
              <img
                src="/logo-super-gods.png"
                alt="Super Gods logo"
                className="h-9 w-9 rounded-xl object-cover"
              />
            </div>

            <div>
              <div className="font-black tracking-[0.2em] text-amber-400">
                SUPER GODS
              </div>
              <div className="text-xs font-medium text-white/45">
                Panel Dueño
              </div>
            </div>
          </div>

          <div className="mt-8 shrink-0 rounded-[28px] border border-white/10 bg-white/[0.06] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/35">
              Barbería
            </div>

            <div className="mt-2 truncate text-lg font-black">
              {session?.tenantName || 'Mi barbería'}
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs text-white/50">
              <span className="truncate">{session?.userName || 'Dueño'}</span>
              <span className="h-1 w-1 shrink-0 rounded-full bg-white/30" />
              <span>{session?.role || 'OWNER'}</span>
            </div>
          </div>

          <div className="mt-8 h-px shrink-0 bg-white/10" />

          <nav className="mt-6 grid shrink-0 gap-2 pb-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${
                    isActive
                      ? 'bg-amber-400 text-neutral-950 shadow-[0_14px_32px_rgba(251,191,36,0.22)]'
                      : 'text-white/68 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <span className="w-6 text-center text-base">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto shrink-0 rounded-[24px] border border-amber-400/15 bg-amber-400/10 p-4">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-300">
              Super Gods Web
            </div>

            <p className="mt-2 text-xs leading-5 text-white/50">
              Panel premium para controlar tu barbería desde computadora.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-5 w-full shrink-0 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="min-h-screen lg:pl-80">
        <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 px-5 py-4 shadow-sm backdrop-blur-xl lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
                Owner Web
              </div>
              <h1 className="text-xl font-black text-neutral-950">
                Panel de control
              </h1>
            </div>

            <div className="hidden items-center gap-3 lg:flex">
              <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
                Sistema conectado
              </div>

              <div className="rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-black text-neutral-600">
                {session?.role || 'OWNER'}
              </div>
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

        <div className="max-w-full overflow-x-hidden p-5 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}