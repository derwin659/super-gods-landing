import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

const navItems = [
  { to: '/super-admin', label: 'Dashboard' },
  { to: '/super-admin/barberias', label: 'Barberías' },
  { to: '/super-admin/pagos', label: 'Pagos pendientes' },
  { to: '/super-admin/crear-barberia', label: 'Crear barbería' },
];

export default function SuperAdminLayout() {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#F7F3EC] text-[#1F1A14]">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-[#E9DED0] bg-white/95 p-5 shadow-xl lg:block">
        <Link
          to="/super-admin"
          className="block rounded-3xl border border-[#E9DED0] bg-gradient-to-br from-[#FFF8EF] to-[#F4E8D7] p-5"
        >
          <div className="text-xs font-black uppercase tracking-[0.18em] text-[#AF8750]">
            Super Gods
          </div>
          <div className="mt-2 text-2xl font-black">Super Admin</div>
          <div className="mt-1 text-sm font-semibold text-[#7A6F63]">
            Panel web maestro
          </div>
        </Link>

        <nav className="mt-6 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/super-admin'}
              className={({ isActive }) =>
                [
                  'block rounded-2xl px-4 py-3 text-sm font-extrabold transition',
                  isActive
                    ? 'bg-[#AF8750] text-white shadow-lg'
                    : 'text-[#7A6F63] hover:bg-[#F4E8D7] hover:text-[#1F1A14]',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={logout}
          className="absolute bottom-5 left-5 right-5 rounded-2xl border border-[#E9DED0] bg-white px-4 py-3 text-sm font-black text-[#AF8750] hover:bg-[#FFF8EF]"
        >
          Cerrar sesión
        </button>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-[#E9DED0] bg-[#F7F3EC]/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link to="/super-admin" className="font-black">
              Super Admin
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded-xl bg-[#AF8750] px-3 py-2 text-xs font-black text-white"
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
                    'whitespace-nowrap rounded-full px-3 py-2 text-xs font-black',
                    isActive ? 'bg-[#AF8750] text-white' : 'bg-white text-[#7A6F63]',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
