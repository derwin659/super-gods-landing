import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/caja', label: 'Caja' },
  { to: '/admin/agenda', label: 'Agenda' },
  { to: '/admin/reportes', label: 'Reportes' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();

  function handleLogout() {
    signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#F6F7FB] text-neutral-950">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-neutral-200 bg-neutral-950 p-5 text-white lg:block">
        <div className="flex items-center gap-3">
          <img
            src="/logo-super-gods.png"
            alt="Super Gods logo"
            className="h-12 w-12 rounded-2xl object-cover"
          />
          <div>
            <div className="font-black tracking-[0.18em] text-amber-400">SUPER GODS</div>
            <div className="text-xs text-white/50">Panel Admin</div>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/45">Sede</div>
          <div className="mt-1 font-black">{session?.branchName || 'Sede asignada'}</div>
          <div className="mt-2 text-xs text-white/50">
            {session?.userName || 'Admin'} · {session?.role}
          </div>
        </div>

        <nav className="mt-8 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  isActive
                    ? 'bg-amber-400 text-neutral-950'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/70 hover:bg-white/10 hover:text-white"
        >
          Cerrar sesión
        </button>
      </aside>

      <main className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/85 px-5 py-4 backdrop-blur lg:px-8">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">
              Admin Web
            </div>
            <h1 className="text-xl font-black">Panel administrador</h1>
          </div>
        </header>

        <div className="p-5 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}