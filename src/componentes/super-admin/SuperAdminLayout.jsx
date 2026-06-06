import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Building2,
  CreditCard,
  LogOut,
  PlusCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { to: '/super-admin', label: 'Vista ejecutiva', detail: 'Metricas y alertas', icon: BarChart3 },
  { to: '/super-admin/barberias', label: 'Cuentas', detail: 'CRUD completo', icon: Building2 },
  { to: '/super-admin/pagos', label: 'Pagos', detail: 'Aprobacion manual', icon: CreditCard },
  { to: '/super-admin/solicitudes-demo', label: 'Demos', detail: 'Leads y pruebas', icon: Sparkles },
  { to: '/super-admin/crear-barberia', label: 'Crear cuenta', detail: 'Alta guiada', icon: PlusCircle },
];

export default function SuperAdminLayout() {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem('JWT_TOKEN');
    localStorage.removeItem('TENANT_ID');
    localStorage.removeItem('TENANT_NAME');
    localStorage.removeItem('USER_ID');
    localStorage.removeItem('USER_NAME');
    localStorage.removeItem('USER_EMAIL');
    localStorage.removeItem('ROLE');
    localStorage.removeItem('BRANCH_ID');
    localStorage.removeItem('BRANCH_NAME');
    localStorage.removeItem('IS_OWNER');
    localStorage.removeItem('ADMIN_PERMISSIONS');
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('accessToken');

    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#111111]">
      <aside className="fixed inset-y-0 left-0 hidden w-80 border-r border-[#E2D5C4] bg-[#111111] p-5 text-white shadow-2xl lg:flex lg:flex-col">
        <Link
          to="/super-admin"
          className="block shrink-0 rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5"
        >
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D6A354] text-[#111111]">
              <ShieldCheck size={24} strokeWidth={2.6} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D6A354]">
                Super Gods
              </p>
              <h1 className="text-2xl font-black leading-tight">Super Admin</h1>
            </div>
          </div>
          <p className="mt-3 text-sm font-bold leading-6 text-white/62">
            Control maestro de cuentas, pagos, trials, vencimientos y altas.
          </p>
        </Link>

        <nav className="mt-5 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {navItems.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </nav>

        <div className="mt-4 shrink-0 space-y-3">
          <div className="rounded-3xl border border-[#D6A354]/25 bg-[#D6A354]/10 p-4 xl:block">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D6A354]">
              Modo operador
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-white/70">
              Cambios de cuenta quedan centralizados para auditoria y soporte.
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-black text-[#111111] hover:bg-[#F4E8D7]"
          >
            <LogOut size={18} />
            Cerrar sesion
          </button>
        </div>
      </aside>

      <div className="lg:pl-80">
        <header className="sticky top-0 z-20 border-b border-[#E2D5C4] bg-[#F4F1EA]/92 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link to="/super-admin" className="flex items-center gap-2 font-black">
              <ShieldCheck size={20} />
              Super Admin
            </Link>

            <button
              type="button"
              onClick={logout}
              className="rounded-xl bg-[#111111] px-3 py-2 text-xs font-black text-white"
            >
              Salir
            </button>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/super-admin'}
                className={({ isActive }) =>
                  [
                    'inline-flex whitespace-nowrap rounded-2xl px-3 py-2 text-xs font-black',
                    isActive ? 'bg-[#111111] text-white' : 'bg-white text-[#746A5D]',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarLink({ item }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.to === '/super-admin'}
      className={({ isActive }) =>
        [
          'group flex items-center gap-3 rounded-3xl px-4 py-3 transition',
          isActive
            ? 'bg-white text-[#111111] shadow-xl shadow-black/20'
            : 'text-white/70 hover:bg-white/[0.08] hover:text-white',
        ].join(' ')
      }
    >
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#D6A354]/18 text-[#D6A354] group-[.active]:bg-[#111111]">
        <Icon size={20} strokeWidth={2.5} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black">{item.label}</span>
        <span className="block text-xs font-bold opacity-60">{item.detail}</span>
      </span>
    </NavLink>
  );
}
