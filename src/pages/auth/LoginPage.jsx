import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [mode, setMode] = useState('OWNER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const modeInfo = useMemo(() => {
    if (mode === 'SUPER_ADMIN') {
      return {
        title: 'Modo Super Admin',
        subtitle: 'Administra barberías, planes, suscripciones, pagos y operación general del SaaS.',
        badge: 'Control SaaS',
      };
    }

    return {
      title: 'Modo Dueño / Admin',
      subtitle: 'Gestiona caja, ventas, agenda, clientes, barberos, productos, puntos y reportes.',
      badge: 'Panel de barbería',
    };
  }, [mode]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Ingresa correo y contraseña.');
      return;
    }

    setLoading(true);

    try {
      const result = await signIn({
        email,
        password,
        mode,
      });

      navigate(result.redirectTo, { replace: true });
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#0F172A]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,#DCEBFF_0,transparent_34%),radial-gradient(circle_at_90%_0%,rgba(34,197,94,0.13),transparent_28%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-5 py-10 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1fr_470px] lg:items-center">
          <section>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:border-blue-600 hover:text-blue-700"
            >
              ← Volver a la landing
            </Link>

            <div className="mt-10 flex items-center gap-4">
              <img
                src="/logo-super-gods.png"
                alt="Super Gods logo"
                className="h-16 w-16 rounded-2xl object-cover shadow-xl shadow-blue-900/10 ring-1 ring-slate-200"
              />

              <div>
                <div className="text-2xl font-black tracking-tight text-slate-950">
                  Super Gods
                </div>
                <div className="text-sm font-bold text-slate-500">
                  Panel web para barberías modernas
                </div>
              </div>
            </div>

            <div className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Acceso seguro para dueños, admins y Super Admin
            </div>

            <h1 className="mt-6 max-w-2xl text-5xl font-black leading-[1] tracking-[-0.055em] text-slate-950 md:text-6xl">
              Controla tu barbería desde una pantalla más grande
            </h1>

            <p className="mt-6 max-w-xl text-lg font-medium leading-8 text-slate-600">
              Ingresa con tu cuenta de Super Gods para revisar caja, ventas,
              agenda, clientes, productos, barberos, puntos, promociones y reportes.
            </p>

            <div className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-3">
              <InfoCard title="Caja" text="Ingresos, gastos y métodos de pago." />
              <InfoCard title="Agenda" text="Reservas, horarios y operación diaria." />
              <InfoCard title="Reportes" text="Ventas, utilidad y rendimiento." />
            </div>

            <div className="mt-6 grid max-w-2xl gap-4 sm:grid-cols-3">
              <InfoCard title="Clientes" text="Historial, puntos y recompensas." />
              <InfoCard title="Productos" text="Inventario y stock por sede." />
              <InfoCard title="Barberos" text="Horarios, pagos y comisiones." />
            </div>
          </section>

          <section className="rounded-[36px] border border-white bg-white p-5 shadow-[0_35px_100px_rgba(15,23,42,0.16)]">
            <div className="rounded-[30px] bg-gradient-to-br from-[#0F2A5F] to-[#07152F] p-6 text-white">
              <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-blue-100">
                {modeInfo.badge}
              </div>

              <h2 className="mt-5 text-3xl font-black tracking-[-0.04em]">
                Iniciar sesión
              </h2>

              <p className="mt-3 text-sm font-medium leading-6 text-blue-100">
                {modeInfo.subtitle}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('OWNER')}
                className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                  mode === 'OWNER'
                    ? 'bg-[#0F2A5F] text-white shadow-lg shadow-blue-900/20'
                    : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-600 hover:text-blue-700'
                }`}
              >
                Dueño / Admin
              </button>

              <button
                type="button"
                onClick={() => setMode('SUPER_ADMIN')}
                className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                  mode === 'SUPER_ADMIN'
                    ? 'bg-[#0F2A5F] text-white shadow-lg shadow-blue-900/20'
                    : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-600 hover:text-blue-700'
                }`}
              >
                Super Admin
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-black text-slate-800">
                  Correo electrónico
                </label>

                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="correo@barberia.com"
                  autoComplete="email"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="text-sm font-black text-slate-800">
                  Contraseña
                </label>

                <div className="mt-2 flex rounded-2xl border border-slate-200 bg-white transition focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Tu contraseña"
                    autoComplete="current-password"
                    className="w-full rounded-2xl bg-transparent px-4 py-4 text-slate-950 outline-none placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="px-4 text-sm font-black text-slate-500 transition hover:text-blue-700"
                  >
                    {showPassword ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[#0F2A5F] px-5 py-4 font-black text-white shadow-xl shadow-blue-900/20 transition hover:-translate-y-0.5 hover:bg-[#123A84] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Ingresando...' : 'Ingresar al panel'}
              </button>
            </form>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-center">
              <p className="text-xs font-semibold leading-5 text-slate-500">
                Usa el mismo acceso que tienes en la app móvil de Super Gods.
                El sistema te enviará automáticamente al panel según tu rol.
              </p>
            </div>

            <div className="mt-4 flex justify-center">
              <Link
                to="/"
                className="text-sm font-black text-blue-700 transition hover:text-[#0F2A5F]"
              >
                ¿Aún no tienes cuenta? Solicita una demo gratis
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, text }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70">
      <div className="text-2xl font-black text-[#0F2A5F]">{title}</div>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
        {text}
      </p>
    </div>
  );
}