import { useAuth } from '../../context/AuthContext';

export default function AdminDashboardPage() {
  const { session } = useAuth();

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-neutral-200 bg-neutral-950 p-6 text-white shadow-sm">
        <div className="text-sm font-black uppercase tracking-[0.2em] text-amber-400">
          Administrador de sede
        </div>

        <h2 className="mt-3 text-3xl font-black">
          {session?.branchName || 'Sede asignada'}
        </h2>

        <p className="mt-2 max-w-2xl text-white/60">
          Este panel web permitirá al admin revisar caja, agenda y reportes según
          sus permisos dentro de la barbería.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-bold text-neutral-500">Caja</div>
          <div className="mt-3 text-2xl font-black">Próximo módulo</div>
        </div>

        <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-bold text-neutral-500">Agenda</div>
          <div className="mt-3 text-2xl font-black">Próximo módulo</div>
        </div>

        <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-bold text-neutral-500">Reportes</div>
          <div className="mt-3 text-2xl font-black">Próximo módulo</div>
        </div>
      </section>
    </div>
  );
}