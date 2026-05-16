import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { superAdminApi } from "../../api/superAdminApi";

function StatCard({ title, value, tone = "blue" }) {
  const tones = { blue: "bg-blue-50 text-blue-700 border-blue-100", green: "bg-emerald-50 text-emerald-700 border-emerald-100", amber: "bg-amber-50 text-amber-700 border-amber-100", red: "bg-red-50 text-red-700 border-red-100", purple: "bg-purple-50 text-purple-700 border-purple-100", teal: "bg-teal-50 text-teal-700 border-teal-100" };
  return <div className="rounded-3xl border border-[#E9DED0] bg-white p-5 shadow-sm"><div className={`inline-flex rounded-2xl border px-3 py-2 text-xs font-black ${tones[tone]}`}>{title}</div><div className="mt-5 text-4xl font-black text-[#1F1A14]">{value ?? 0}</div></div>;
}

export default function SuperAdminDashboard() {
  const [data, setData] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  async function load() { try { setLoading(true); setError(""); setData(await superAdminApi.getDashboard()); } catch (e) { setError(e.message || "No se pudo cargar el panel"); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  if (loading) return <div className="rounded-3xl bg-white p-8 font-bold">Cargando panel...</div>;
  if (error) return <ErrorBox message={error} onRetry={load} />;
  const pending = Number(data?.pendingPayments || 0);
  return <div className="space-y-6">
    <section className="rounded-[2rem] border border-[#E9DED0] bg-gradient-to-br from-[#FFFCF8] to-[#F4E8D7] p-6 shadow-sm">
      <div className="inline-flex rounded-full border border-[#E9DED0] bg-white/70 px-3 py-2 text-xs font-black uppercase tracking-wider text-[#AF8750]">Vista ejecutiva</div>
      <h1 className="mt-4 max-w-2xl text-4xl font-black leading-tight">Controla crecimiento, pagos y estado de cada barbería.</h1>
      <p className="mt-3 max-w-2xl text-sm font-semibold text-[#7A6F63]">{pending > 0 ? `Tienes ${pending} pago(s) pendiente(s) por revisar y validar.` : "Todo está al día. No tienes pagos pendientes por aprobar."}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3"><Link className="rounded-2xl bg-white/80 p-4 font-black hover:bg-white" to="/super-admin/barberias">Ver barberías</Link><Link className="rounded-2xl bg-white/80 p-4 font-black hover:bg-white" to="/super-admin/pagos">Aprobar pagos</Link><Link className="rounded-2xl bg-[#AF8750] p-4 font-black text-white hover:opacity-90" to="/super-admin/crear-barberia">Crear barbería</Link></div>
    </section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><StatCard title="Total barberías" value={data?.totalTenants} /><StatCard title="Activas" value={data?.activeTenants} tone="green" /><StatCard title="En trial" value={data?.trialTenants} tone="amber" /><StatCard title="Vencidas" value={data?.expiredTenants} tone="red" /><StatCard title="Suspendidas" value={data?.suspendedTenants} tone="purple" /><StatCard title="Pagos pendientes" value={data?.pendingPayments} tone="teal" /></section>
  </div>;
}
function ErrorBox({ message, onRetry }) { return <div className="rounded-3xl border border-red-100 bg-white p-6"><p className="font-bold text-red-700">{message}</p><button onClick={onRetry} className="mt-4 rounded-2xl bg-[#AF8750] px-4 py-2 font-black text-white">Reintentar</button></div>; }
