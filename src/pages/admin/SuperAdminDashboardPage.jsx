import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';

export default function SuperAdminDashboardPage() {
  const { session, signOut } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    setLoading(true);
    setErrorMsg('');

    try {
      const data = await apiRequest('/api/super-admin/dashboard');
      setDashboard(data);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo cargar el dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-[#F6F7FB] p-5 text-neutral-950 lg:p-8">
      <section className="rounded-[32px] border border-neutral-200 bg-neutral-950 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm font-black uppercase tracking-[0.2em] text-amber-400">
              Super Admin
            </div>

            <h1 className="mt-3 text-3xl font-black">
              Panel SaaS Super Gods
            </h1>

            <p className="mt-2 text-white/60">
              {session?.userName || 'Super admin'} · {session?.userEmail || ''}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadDashboard}
              className="rounded-2xl bg-amber-400 px-5 py-3 font-black text-neutral-950"
            >
              Actualizar
            </button>

            <button
              onClick={signOut}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-white"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </section>

      <section className="mt-6">
        {loading && (
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 font-bold">
            Cargando dashboard...
          </div>
        )}

        {errorMsg && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 font-bold text-red-700">
            {errorMsg}
          </div>
        )}

        {!loading && !errorMsg && (
          <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black">Respuesta del backend</h2>
            <pre className="mt-4 overflow-auto rounded-2xl bg-neutral-950 p-4 text-xs text-white">
              {JSON.stringify(dashboard, null, 2)}
            </pre>
          </div>
        )}
      </section>
    </div>
  );
}