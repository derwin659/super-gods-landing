import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  CreditCard,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { superAdminApi } from "../../api/superAdminApi";

export default function SuperAdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      setData(await superAdminApi.getDashboard());
    } catch (e) {
      setError(e.message || "No se pudo cargar el panel");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const insights = useMemo(() => {
    const total = Number(data?.totalTenants || 0);
    const active = Number(data?.activeTenants || 0);
    const trial = Number(data?.trialTenants || 0);
    const expired = Number(data?.expiredTenants || 0);
    const pending = Number(data?.pendingPayments || 0);
    const activeRate = total > 0 ? Math.round((active / total) * 100) : 0;

    return { total, active, trial, expired, pending, activeRate };
  }, [data]);

  if (loading) {
    return <div className="rounded-3xl bg-white p-8 font-bold">Cargando panel...</div>;
  }

  if (error) {
    return <ErrorBox message={error} onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-[#E2D5C4] bg-[#111111] text-white shadow-2xl shadow-black/10">
        <div className="grid gap-5 p-5 xl:grid-cols-[1fr_360px] xl:p-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D6A354]/30 bg-[#D6A354]/12 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#F2C778]">
              <ShieldCheck size={15} />
              Centro de mando
            </div>

            <h1 className="mt-4 max-w-4xl text-3xl font-black leading-[1.04] tracking-[-0.02em] md:text-5xl xl:text-[52px]">
              Supervisa cuentas, pagos y vencimientos con control real.
            </h1>

            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/68 md:text-base">
              Mira el estado comercial de la plataforma, entra al CRUD de negocios, aprueba pagos manuales y convierte demos en cuentas activas.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <QuickAction to="/super-admin/barberias" icon={Building2} label="Gestionar cuentas" />
              <QuickAction to="/super-admin/pagos" icon={CreditCard} label="Aprobar pagos" alert={insights.pending} />
              <QuickAction to="/super-admin/solicitudes-demo" icon={Sparkles} label="Solicitudes demo" />
              <QuickAction to="/super-admin/crear-barberia" icon={PlusCircle} label="Crear negocio" primary />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#F2C778]">
              Salud comercial
            </p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-5xl font-black">{insights.activeRate}%</p>
                <p className="mt-2 text-sm font-bold text-white/62">cuentas activas sobre el total</p>
              </div>
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-400/12 text-emerald-300">
                <TrendingUp size={26} />
              </div>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-400"
                style={{ width: `${Math.min(insights.activeRate, 100)}%` }}
              />
            </div>
            <p className="mt-4 text-sm font-bold leading-6 text-white/68">
              {insights.pending > 0
                ? `Hay ${insights.pending} pago(s) pendiente(s) que pueden activar ingresos hoy.`
                : "No hay pagos pendientes. Revisa vencidos y trials para recuperar cuentas."}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Total negocios" value={data?.totalTenants} icon={Building2} tone="blue" />
        <StatCard title="Activas" value={data?.activeTenants} icon={CheckCircle2} tone="green" />
        <StatCard title="En trial" value={data?.trialTenants} icon={Clock3} tone="amber" />
        <StatCard title="Vencidas" value={data?.expiredTenants} icon={AlertTriangle} tone="red" />
        <StatCard title="Suspendidas" value={data?.suspendedTenants} icon={ShieldCheck} tone="gray" />
        <StatCard title="Pagos pendientes" value={data?.pendingPayments} icon={CreditCard} tone="teal" />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <ControlCard
          title="Recuperar vencidos"
          text={`${insights.expired} cuentas vencidas requieren accion comercial: renovar, suspender o cancelar.`}
          to="/super-admin/barberias?estado=EXPIRED"
          label="Filtrar vencidos"
        />
        <ControlCard
          title="Convertir trials"
          text={`${insights.trial} negocios aun estan probando. Revisa fechas, plan y siguiente contacto.`}
          to="/super-admin/barberias?estado=TRIAL"
          label="Ver trials"
        />
        <ControlCard
          title="Cerrar ingresos"
          text={`${insights.pending} pagos esperan validacion para activar o extender cuentas.`}
          to="/super-admin/pagos"
          label="Validar pagos"
        />
      </section>
    </div>
  );
}

function QuickAction({ to, icon, label, primary = false, alert = 0 }) {
  const IconComponent = icon;
  return (
    <Link
      to={to}
      className={`relative flex items-center justify-between gap-3 rounded-2xl p-4 text-sm font-black transition hover:-translate-y-0.5 ${
        primary ? "bg-[#D6A354] text-[#111111]" : "bg-white/[0.08] text-white hover:bg-white/[0.12]"
      }`}
    >
      <span className="inline-flex items-center gap-2">
        <IconComponent size={18} />
        {label}
      </span>
      <ArrowRight size={17} />
      {alert > 0 && (
        <span className="absolute -right-2 -top-2 rounded-full bg-red-500 px-2 py-1 text-xs text-white">
          {alert}
        </span>
      )}
    </Link>
  );
}

function StatCard({ title, value, icon, tone = "blue" }) {
  const IconComponent = icon;
  const tones = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    red: "bg-red-50 text-red-700 border-red-100",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    teal: "bg-teal-50 text-teal-700 border-teal-100",
  };

  return (
    <div className="rounded-3xl border border-[#E2D5C4] bg-white p-5 shadow-sm">
      <div className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black ${tones[tone]}`}>
        <IconComponent size={16} />
        {title}
      </div>
      <div className="mt-5 text-5xl font-black text-[#111111]">{value ?? 0}</div>
    </div>
  );
}

function ControlCard({ title, text, to, label }) {
  return (
    <Link
      to={to}
      className="rounded-3xl border border-[#E2D5C4] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#D6A354]"
    >
      <h2 className="text-xl font-black text-[#111111]">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#746A5D]">{text}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#AF7200]">
        {label}
        <ArrowRight size={16} />
      </span>
    </Link>
  );
}

function ErrorBox({ message, onRetry }) {
  return (
    <div className="rounded-3xl border border-red-100 bg-white p-6">
      <p className="font-bold text-red-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#111111] px-4 py-2 font-black text-white"
      >
        <RefreshCw size={17} />
        Reintentar
      </button>
    </div>
  );
}
