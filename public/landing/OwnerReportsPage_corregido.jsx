import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { getOwnerBranches } from '../../api/ownerCashApi';
import {
  getBarberDetail,
  getBarberSummary,
  getDailySales,
  getPaymentSummary,
  getProfitabilityReport,
  getSalesReport,
  getTopServices,
} from '../../api/ownerReportsApi';

function toDateInputValue(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function defaultFromDate() {
  const date = new Date();
  date.setDate(date.getDate() - 6);
  return toDateInputValue(date);
}

function formatMoney(value) {
  const number = Number(value || 0);

  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: number % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(number);
}

function formatPercent(value) {
  const number = Number(value || 0);
  return `${number.toFixed(1)}%`;
}

function shortDate(value) {
  if (!value) return '-';

  const raw = String(value);
  const normalized = raw.includes('T') ? raw : `${raw}T00:00:00`;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return raw;

  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
  });
}

function methodLabel(value) {
  const code = String(value || '').trim().toUpperCase();

  const labels = {
    CASH: 'Efectivo',
    EFECTIVO: 'Efectivo',
    YAPE: 'Yape',
    PLIN: 'Plin',
    CARD: 'Tarjeta',
    TARJETA: 'Tarjeta',
    TRANSFER: 'Transferencia',
    TRANSFERENCIA: 'Transferencia',
    FREE: 'Gratis',
    GRATIS: 'Gratis',
  };

  return labels[code] || code || 'Otro';
}

function n(value) {
  return Number(value || 0);
}

function ErrorBox({ message }) {
  if (!message) return null;

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
      {message}
    </div>
  );
}

function LoadingBox() {
  return (
    <div className="rounded-[30px] border border-neutral-200 bg-white p-8 shadow-sm">
      <div className="h-3 w-44 animate-pulse rounded-full bg-neutral-200" />
      <div className="mt-5 grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-[24px] bg-neutral-100" />
        ))}
      </div>
    </div>
  );
}

function StatCard({ title, value, helper, tone = 'default' }) {
  const styles = {
    default: 'border-neutral-200 bg-white text-neutral-950',
    dark: 'border-neutral-900 bg-neutral-950 text-white',
    gold: 'border-amber-200 bg-amber-50 text-amber-800',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    red: 'border-red-200 bg-red-50 text-red-800',
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
  };

  return (
    <div className={`rounded-[28px] border p-5 shadow-[0_14px_35px_rgba(15,23,42,0.045)] ${styles[tone]}`}>
      <div className={tone === 'dark' ? 'text-sm font-bold text-white/55' : 'text-sm font-bold text-neutral-500'}>
        {title}
      </div>

      <div className={tone === 'dark' ? 'mt-2 text-2xl font-black text-white' : 'mt-2 text-2xl font-black'}>
        {value}
      </div>

      {helper && (
        <div className={tone === 'dark' ? 'mt-1 text-xs text-white/45' : 'mt-1 text-xs text-neutral-500'}>
          {helper}
        </div>
      )}
    </div>
  );
}


function PaymentMethodSummaryCard({ paymentSummary }) {
  const rows = [
    {
      label: 'Efectivo',
      value: n(paymentSummary?.cash),
      helper: 'Dinero físico en caja',
      icon: '💵',
    },
    {
      label: 'Yape',
      value: n(paymentSummary?.yape),
      helper: 'Pagos por billetera digital',
      icon: '🟣',
    },
    {
      label: 'Plin',
      value: n(paymentSummary?.plin),
      helper: 'Pagos por billetera digital',
      icon: '🔵',
    },
    {
      label: 'Tarjeta',
      value: n(paymentSummary?.card),
      helper: 'Pagos con POS o tarjeta',
      icon: '💳',
    },
    {
      label: 'Transferencia',
      value: n(paymentSummary?.transfer),
      helper: 'Pagos por transferencia bancaria',
      icon: '🏦',
    },
  ];

  const total = rows.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="rounded-[30px] border border-neutral-200 bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
            Métodos de pago
          </div>

          <h3 className="mt-2 text-xl font-black text-neutral-950">
            Resumen real por método
          </h3>

          <p className="mt-1 text-sm text-neutral-500">
            Incluye ventas simples y ventas con pago mixto.
          </p>
        </div>

        <div className="rounded-2xl bg-neutral-950 px-5 py-4 text-right text-white">
          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-white/45">
            Total cobrado
          </div>
          <div className="mt-1 text-xl font-black">
            {formatMoney(total)}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {rows.map((item) => (
          <div
            key={item.label}
            className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                {item.icon}
              </div>

              <div className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-neutral-500">
                Pago
              </div>
            </div>

            <div className="mt-4 text-sm font-black text-neutral-500">
              {item.label}
            </div>

            <div className="mt-1 text-2xl font-black text-neutral-950">
              {formatMoney(item.value)}
            </div>

            <p className="mt-2 text-xs font-semibold leading-5 text-neutral-500">
              {item.helper}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-neutral-700">{label}</span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-4 font-bold text-neutral-950 outline-none transition focus:border-amber-400"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DateField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-neutral-700">{label}</span>

      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-4 font-bold text-neutral-950 outline-none transition focus:border-amber-400"
      />
    </label>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-[30px] border border-neutral-200 bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,0.05)]">
      <div>
        <h3 className="text-lg font-black text-neutral-950">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
      </div>

      <div className="mt-5 h-72">
        {children}
      </div>
    </div>
  );
}

function InsightCard({ insights }) {
    return (
      <div className="rounded-[26px] border border-amber-200 bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.045)]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-[230px]">
            <div className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">
              Análisis automático
            </div>
  
            <h2 className="mt-2 text-lg font-black text-neutral-950">
              Lectura rápida
            </h2>
  
            <p className="mt-1 text-xs leading-5 text-neutral-500">
              Resumen inteligente del rango seleccionado.
            </p>
          </div>
  
          <div className="grid flex-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
            {insights.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="rounded-2xl border border-amber-100 bg-amber-50/45 px-3 py-3 text-xs font-bold leading-5 text-neutral-700"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

function BarberDetailModal({ barber, loading, errorMsg, items, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 px-4 py-8 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-auto rounded-[34px] border border-white/10 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.35)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
              Detalle de producción
            </div>
            <h2 className="mt-1 text-2xl font-black text-neutral-950">
              {barber?.barberName || 'Barbero'}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Ventas realizadas por este barbero dentro del rango seleccionado.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-black text-neutral-700 hover:bg-neutral-100"
          >
            Cerrar
          </button>
        </div>

        {loading && (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm font-black text-neutral-500">
            Cargando detalle...
          </div>
        )}

        <ErrorBox message={errorMsg} />

        {!loading && !errorMsg && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm font-bold text-neutral-500">
            No hay ventas para este barbero en el rango seleccionado.
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="overflow-hidden rounded-[24px] border border-neutral-200">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-neutral-50 text-xs font-black uppercase tracking-[0.14em] text-neutral-400">
                <tr>
                  <th className="px-4 py-4">Fecha</th>
                  <th className="px-4 py-4">Cliente</th>
                  <th className="px-4 py-4">Servicios</th>
                  <th className="px-4 py-4">Método</th>
                  <th className="px-4 py-4 text-right">Total</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-100 bg-white">
                {items.map((item) => (
                  <tr key={`${item.saleId}-${item.createdAt}`}>
                    <td className="px-4 py-4 font-bold text-neutral-600">
                      {item.createdAt || '-'}
                    </td>
                    <td className="px-4 py-4 font-black text-neutral-950">
                      {item.customerName || 'Cliente'}
                    </td>
                    <td className="px-4 py-4 font-bold text-neutral-600">
                      {item.serviceNames || '-'}
                    </td>
                    <td className="px-4 py-4 font-bold text-neutral-600">
                      {methodLabel(item.paymentMethod)}
                    </td>
                    <td className="px-4 py-4 text-right font-black text-neutral-950">
                      {formatMoney(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OwnerReportsPage() {
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [from, setFrom] = useState(defaultFromDate());
  const [to, setTo] = useState(toDateInputValue());

  const [profitability, setProfitability] = useState(null);
  const [salesReport, setSalesReport] = useState(null);
  const [barbers, setBarbers] = useState([]);
  const [dailySales, setDailySales] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [selectedBarber, setSelectedBarber] = useState(null);
  const [barberDetail, setBarberDetail] = useState([]);
  const [barberDetailLoading, setBarberDetailLoading] = useState(false);
  const [barberDetailError, setBarberDetailError] = useState('');

  const query = useMemo(() => {
    return {
      branchId: branchId || undefined,
      from,
      to,
    };
  }, [branchId, from, to]);

  async function loadBranches() {
    setBranchesLoading(true);

    try {
      const data = await getOwnerBranches();
      setBranches(Array.isArray(data) ? data : []);
    } catch {
      setBranches([]);
    } finally {
      setBranchesLoading(false);
    }
  }

  async function loadReports() {
    setLoading(true);
    setErrorMsg('');

    try {
      const [
        profitabilityData,
        salesData,
        barberData,
        dailyData,
        servicesData,
        paymentData,
      ] = await Promise.all([
        getProfitabilityReport(query),
        getSalesReport(query),
        getBarberSummary(query),
        getDailySales(query),
        getTopServices(query),
        getPaymentSummary(query),
      ]);

      setProfitability(profitabilityData);
      setSalesReport(salesData);
      setBarbers(Array.isArray(barberData) ? barberData : []);
      setDailySales(Array.isArray(dailyData) ? dailyData : []);
      setTopServices(Array.isArray(servicesData) ? servicesData : []);
      setPaymentSummary(paymentData);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudieron cargar los reportes.');
      setProfitability(null);
      setSalesReport(null);
      setBarbers([]);
      setDailySales([]);
      setTopServices([]);
      setPaymentSummary(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    if (!from || !to) return;
    loadReports();
  }, [query]);

  const totalBarberSales = useMemo(() => {
    return barbers.reduce((sum, item) => sum + n(item.totalSales), 0);
  }, [barbers]);

  const barbersWithPercent = useMemo(() => {
    return [...barbers]
      .map((item) => ({
        ...item,
        percentage:
          totalBarberSales > 0 ? (n(item.totalSales) / totalBarberSales) * 100 : 0,
      }))
      .sort((a, b) => n(b.totalSales) - n(a.totalSales));
  }, [barbers, totalBarberSales]);

  const topBarber = barbersWithPercent[0] || null;

  const dailyChartData = useMemo(() => {
    return dailySales.map((item) => ({
      date: shortDate(item.date),
      ventas: n(item.totalSales),
      cantidad: n(item.salesCount),
    }));
  }, [dailySales]);

  const barberChartData = useMemo(() => {
    return barbersWithPercent.slice(0, 8).map((item) => ({
      name: item.barberName || 'Barbero',
      ventas: n(item.totalSales),
      porcentaje: Number(item.percentage.toFixed(1)),
    }));
  }, [barbersWithPercent]);

  const paymentChartData = useMemo(() => {
    const p = paymentSummary || {};

    return [
      { name: 'Efectivo', value: n(p.cash) },
      { name: 'Yape', value: n(p.yape) },
      { name: 'Plin', value: n(p.plin) },
      { name: 'Tarjeta', value: n(p.card) },
      { name: 'Transfer.', value: n(p.transfer) },
    ].filter((item) => item.value > 0);
  }, [paymentSummary]);

  const servicesChartData = useMemo(() => {
    return topServices.slice(0, 8).map((item) => ({
      name: item.serviceName || 'Servicio',
      ventas: n(item.totalAmount),
      cantidad: n(item.timesSold),
    }));
  }, [topServices]);

  const insights = useMemo(() => {
    const items = [];

    const totalSales = n(profitability?.totalSales);
    const netProfit = n(profitability?.netProfit);
    const margin = n(profitability?.profitMargin);

    if (topBarber) {
        items.push(
            `Top barbero: ${topBarber.barberName || 'Barbero'} · ${formatMoney(topBarber.totalSales)} · ${formatPercent(topBarber.percentage)}`
          );
    } else {
      items.push('Todavía no hay producción por barbero en el rango seleccionado.');
    }

    items.push(
        `Utilidad: ${formatMoney(netProfit)} · Margen ${formatPercent(margin)}`
      );

    if (paymentChartData.length > 0) {
      const topPayment = [...paymentChartData].sort((a, b) => b.value - a.value)[0];
      items.push(
        `Pago principal: ${topPayment.name} · ${formatMoney(topPayment.value)}`
      );
    }

    if (topServices.length > 0) {
      const topService = topServices[0];
      items.push(
        `Servicio top: ${topService.serviceName || 'Servicio'} · ${n(topService.timesSold)} ventas`
      );
    }

    return items;
  }, [profitability, topBarber, paymentChartData, topServices]);

  async function openBarberDetail(barber) {
    setSelectedBarber(barber);
    setBarberDetail([]);
    setBarberDetailError('');
    setBarberDetailLoading(true);

    try {
      const data = await getBarberDetail({
        barberId: barber.barberId,
        ...query,
      });

      setBarberDetail(Array.isArray(data) ? data : []);
    } catch (error) {
      setBarberDetailError(error.message || 'No se pudo cargar el detalle del barbero.');
    } finally {
      setBarberDetailLoading(false);
    }
  }

  const branchOptions = [
    { value: '', label: branchesLoading ? 'Cargando sedes...' : 'Todas las sedes' },
    ...branches.map((branch) => ({
      value: String(branch.id),
      label: branch.name || branch.nombre || `Sede ${branch.id}`,
    })),
  ];

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[34px] border border-amber-400/15 bg-[linear-gradient(135deg,#080808_0%,#111827_48%,#15110A_100%)] p-6 text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(251,191,36,0.22),transparent_30%),radial-gradient(circle_at_100%_0%,rgba(16,185,129,0.16),transparent_34%)]" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
              Reportes premium
            </div>

            <h2 className="mt-5 text-4xl font-black tracking-tight">
              Rentabilidad, barberos y métodos de pago
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65">
              Analiza cuánto vendió la barbería, cuánto quedó como utilidad,
              qué barbero produjo más y cómo se repartieron los pagos por método.
            </p>
          </div>

          <button
            type="button"
            onClick={loadReports}
            disabled={loading}
            className="rounded-2xl bg-amber-400 px-5 py-4 text-sm font-black text-neutral-950 transition hover:scale-[1.01] disabled:opacity-60"
          >
            {loading ? 'Actualizando...' : 'Actualizar reporte'}
          </button>
        </div>
      </section>

      <section className="rounded-[30px] border border-neutral-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.045)]">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-end">
          <SelectField
            label="Sede"
            value={branchId}
            onChange={setBranchId}
            options={branchOptions}
          />

          <DateField label="Desde" value={from} onChange={setFrom} />
          <DateField label="Hasta" value={to} onChange={setTo} />

          <button
            type="button"
            onClick={loadReports}
            disabled={loading}
            className="rounded-2xl bg-neutral-950 px-5 py-4 text-sm font-black text-white transition hover:scale-[1.01] disabled:opacity-60"
          >
            Filtrar
          </button>
        </div>
      </section>

      <ErrorBox message={errorMsg} />

      {loading ? (
        <LoadingBox />
      ) : (
        <>
          <InsightCard insights={insights} />

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Ventas totales"
              value={formatMoney(profitability?.totalSales)}
              helper="Ingresos por ventas"
              tone="dark"
            />

            <StatCard
              title="Utilidad estimada"
              value={formatMoney(profitability?.netProfit)}
              helper={`Margen ${formatPercent(profitability?.profitMargin)}`}
              tone={n(profitability?.netProfit) >= 0 ? 'green' : 'red'}
            />

            <StatCard
              title="Gastos operativos"
              value={formatMoney(profitability?.operationalExpenses)}
              helper="Gastos registrados en caja"
              tone="red"
            />

            <StatCard
              title="Pagos a barberos"
              value={formatMoney(n(profitability?.barberPayments) + n(profitability?.barberAdvances))}
              helper="Pagos + adelantos"
              tone="gold"
            />
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Ticket promedio"
              value={formatMoney(salesReport?.averageTicket)}
              helper={`${n(salesReport?.totalSalesCount)} ventas`}
            />

            <StatCard
              title="Barberos activos"
              value={n(salesReport?.activeBarbers)}
              helper="Con ventas en el rango"
            />

            <StatCard
              title="Efectivo"
              value={formatMoney(paymentSummary?.cash)}
              helper="Caja física"
              tone="green"
            />

            <StatCard
              title="Digital"
              value={formatMoney(
                n(paymentSummary?.yape) +
                  n(paymentSummary?.plin) +
                  n(paymentSummary?.card) +
                  n(paymentSummary?.transfer)
              )}
              helper="Yape, Plin, tarjeta y transferencia"
              tone="blue"
            />
          </section>

          <PaymentMethodSummaryCard paymentSummary={paymentSummary} />

          <section className="grid gap-5 xl:grid-cols-2">
            <ChartCard
              title="Ventas por día"
              subtitle="Evolución de ingresos en el rango seleccionado."
            >
              {dailyChartData.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-neutral-300 text-sm font-bold text-neutral-400">
                  Sin ventas para graficar.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatMoney(value)} />
                    <Line
                      type="monotone"
                      dataKey="ventas"
                      stroke="#111827"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard
              title="Producción por barbero"
              subtitle="Ranking de barberos por ventas y porcentaje de participación."
            >
              {barberChartData.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-neutral-300 text-sm font-bold text-neutral-400">
                  Sin barberos para graficar.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barberChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) =>
                        name === 'porcentaje'
                          ? formatPercent(value)
                          : formatMoney(value)
                      }
                    />
                    <Bar dataKey="ventas" fill="#F59E0B" radius={[12, 12, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard
              title="Métodos de pago"
              subtitle="Distribución entre efectivo, billeteras y tarjeta."
            >
              {paymentChartData.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-neutral-300 text-sm font-bold text-neutral-400">
                  Sin pagos para graficar.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip formatter={(value) => formatMoney(value)} />
                    <Pie
                      data={paymentChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={96}
                      paddingAngle={4}
                    >
                      {paymentChartData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={['#111827', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'][index % 5]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard
              title="Servicios más vendidos"
              subtitle="Servicios con mayor movimiento económico."
            >
              {servicesChartData.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-neutral-300 text-sm font-bold text-neutral-400">
                  Sin servicios para graficar.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={servicesChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip formatter={(value, name) => name === 'cantidad' ? value : formatMoney(value)} />
                    <Bar dataKey="ventas" fill="#10B981" radius={[12, 12, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </section>

          <section className="rounded-[30px] border border-neutral-200 bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h3 className="text-xl font-black text-neutral-950">
                  Ranking de barberos
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Producción, ticket promedio y porcentaje del total vendido.
                </p>
              </div>

              <div className="rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-black text-neutral-700">
                Total barberos: {barbersWithPercent.length}
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-[24px] border border-neutral-200">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-neutral-50 text-xs font-black uppercase tracking-[0.14em] text-neutral-400">
                  <tr>
                    <th className="px-4 py-4">Barbero</th>
                    <th className="px-4 py-4 text-right">Ventas</th>
                    <th className="px-4 py-4 text-right">Cantidad</th>
                    <th className="px-4 py-4 text-right">Ticket promedio</th>
                    <th className="px-4 py-4 text-right">% participación</th>
                    <th className="px-4 py-4 text-right">Detalle</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-100 bg-white">
                  {barbersWithPercent.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center font-bold text-neutral-400">
                        No hay ventas por barbero en este rango.
                      </td>
                    </tr>
                  ) : (
                    barbersWithPercent.map((barber, index) => (
                      <tr key={barber.barberId || barber.barberName}>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-sm font-black text-amber-700">
                              #{index + 1}
                            </div>
                            <div>
                              <div className="font-black text-neutral-950">
                                {barber.barberName || 'Barbero'}
                              </div>
                              <div className="text-xs font-bold text-neutral-400">
                                ID {barber.barberId || '-'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-right font-black text-neutral-950">
                          {formatMoney(barber.totalSales)}
                        </td>

                        <td className="px-4 py-4 text-right font-bold text-neutral-600">
                          {n(barber.salesCount)}
                        </td>

                        <td className="px-4 py-4 text-right font-bold text-neutral-600">
                          {formatMoney(barber.averageTicket)}
                        </td>

                        <td className="px-4 py-4 text-right font-black text-amber-700">
                          {formatPercent(barber.percentage)}
                        </td>

                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => openBarberDetail(barber)}
                            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-black text-neutral-700 hover:bg-neutral-100"
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {selectedBarber && (
        <BarberDetailModal
          barber={selectedBarber}
          loading={barberDetailLoading}
          errorMsg={barberDetailError}
          items={barberDetail}
          onClose={() => {
            setSelectedBarber(null);
            setBarberDetail([]);
            setBarberDetailError('');
          }}
        />
      )}
    </div>
  );
}