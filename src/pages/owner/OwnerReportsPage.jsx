import { useEffect, useMemo, useState } from 'react';
import { PremiumEmptyState, PremiumErrorState } from '../../components/PremiumUi';
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
  getBranchDetail,
  getDailySales,
  getExpenseReport,
  getPaymentSummary,
  getProfitabilityReport,
  getSalesReport,
  getTopServices,
} from '../../api/ownerReportsApi';
import { formatTenantMoney } from '../../utils/tenantMoney';

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

function expenseTypeLabel(type) {
  return { EXPENSE: "Gasto operativo", ADVANCE_BARBER: "Adelanto profesional", PAYMENT_BARBER: "Pago profesional" }[String(type || "").toUpperCase()] || "Otro movimiento";
}

function ExpenseTypePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const options = [
    { value: "", label: "Todos los gastos", helper: "Vista completa", icon: "✦", tone: "bg-amber-100 text-amber-800" },
    { value: "EXPENSE", label: "Gastos operativos", helper: "Compras y operación", icon: "▤", tone: "bg-rose-100 text-rose-700" },
    { value: "ADVANCE_BARBER", label: "Adelantos", helper: "Anticipos a profesionales", icon: "↗", tone: "bg-orange-100 text-orange-700" },
    { value: "PAYMENT_BARBER", label: "Pagos profesionales", helper: "Liquidaciones realizadas", icon: "$", tone: "bg-blue-100 text-blue-700" },
  ];
  const selected = options.find((option) => option.value === value) || options[0];

  return (
    <div className="relative z-20 w-full md:w-[270px]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white px-3 py-2.5 text-left shadow-sm transition hover:border-amber-300 hover:shadow-md"
      >
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg font-black ${selected.tone}`}>{selected.icon}</span>
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-black text-neutral-900">{selected.label}</span><span className="block truncate text-xs font-semibold text-neutral-500">{selected.helper}</span></span>
        <span className={`text-lg text-amber-800 transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white p-2 shadow-[0_20px_45px_rgba(15,23,42,0.18)]">
          {options.map((option) => {
            const active = option.value === value;
            return <button key={option.value || "all"} type="button" onClick={() => { onChange(option.value); setOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition ${active ? "bg-amber-50" : "hover:bg-neutral-50"}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl font-black ${option.tone}`}>{option.icon}</span><span className="min-w-0 flex-1"><span className="block text-sm font-black text-neutral-900">{option.label}</span><span className="block text-xs font-semibold text-neutral-500">{option.helper}</span></span>{active && <span className="grid h-6 w-6 place-items-center rounded-full bg-amber-500 text-xs font-black text-white">✓</span>}</button>;
          })}
        </div>
      )}
    </div>
  );
}
function formatMoney(value) {
  return formatTenantMoney(value);
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

function firstNumber(...values) {
  for (const value of values) {
    const number = Number(value ?? 0);
    if (!Number.isNaN(number) && number !== 0) return number;
  }

  return 0;
}

function courtesyCountOf(item = {}) {
  const source = item || {};

  return firstNumber(
    source.courtesyCutsCount,
    source.freeCutsCount,
    source.courtesyCount,
    source.freeCount,
    source.cortesiasCount,
    source.cortesGratis,
    source.freeSalesCount,
    source.courtesySalesCount,
    source.gratisCount
  );
}

function courtesyValueOf(item = {}) {
  const source = item || {};

  return firstNumber(
    source.courtesyReferenceValue,
    source.freeReferenceValue,
    source.courtesyAmount,
    source.freeAmount,
    source.cortesiasReferenceValue,
    source.cortesGratisReferenceValue,
    source.courtesyTotal,
    source.freeTotal,
    source.gratisAmount
  );
}

function buildCourtesyReportSummary({ salesReport, paymentSummary, profitability, barbers, branchReports }) {
  const barbersWithCourtesy = (Array.isArray(barbers) ? barbers : [])
    .map((barber) => ({
      barberId: barber.barberId,
      barberName: barber.barberName || 'Barbero',
      count: courtesyCountOf(barber),
      referenceValue: courtesyValueOf(barber),
    }))
    .filter((item) => item.count > 0 || item.referenceValue > 0)
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.referenceValue - a.referenceValue;
    });

  const branchTotalCount = (Array.isArray(branchReports) ? branchReports : [])
    .reduce((sum, branch) => sum + courtesyCountOf(branch), 0);
  const branchTotalValue = (Array.isArray(branchReports) ? branchReports : [])
    .reduce((sum, branch) => sum + courtesyValueOf(branch), 0);

  const barbersTotalCount = barbersWithCourtesy.reduce((sum, item) => sum + item.count, 0);
  const barbersTotalValue = barbersWithCourtesy.reduce((sum, item) => sum + item.referenceValue, 0);

  return {
    count: firstNumber(
      courtesyCountOf(salesReport),
      courtesyCountOf(paymentSummary),
      courtesyCountOf(profitability),
      branchTotalCount,
      barbersTotalCount
    ),
    referenceValue: firstNumber(
      courtesyValueOf(salesReport),
      courtesyValueOf(paymentSummary),
      courtesyValueOf(profitability),
      branchTotalValue,
      barbersTotalValue
    ),
    byBarber: barbersWithCourtesy,
  };
}

function getBranchIdentifier(branch) {
  return branch?.id ?? branch?.branchId ?? branch?.sucursalId;
}

function getBranchDisplayName(branch) {
  return branch?.name || branch?.nombre || branch?.branchName || `Sede ${getBranchIdentifier(branch) || '-'}`;
}

function ErrorBox({ message }) {
  return <PremiumErrorState message={message} />;
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
    violet: 'border-violet-200 bg-violet-50 text-violet-800',
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

function CourtesyReportSection({ summary, from, to }) {
  const hasData = summary.count > 0 || summary.referenceValue > 0 || summary.byBarber.length > 0;

  return (
    <section className="rounded-[30px] border border-amber-200 bg-amber-50 p-5 shadow-[0_14px_38px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">
            Cortes gratis
          </div>
          <h3 className="mt-2 text-xl font-black text-neutral-950">
            Cortesias por rango de fecha
          </h3>
          <p className="mt-1 text-sm font-bold leading-6 text-amber-800/75">
            Rango consultado: {shortDate(from)} - {shortDate(to)}.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
              Cantidad
            </div>
            <div className="mt-1 text-3xl font-black text-neutral-950">
              {summary.count}
            </div>
          </div>
          <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
              Valor ref.
            </div>
            <div className="mt-1 text-3xl font-black text-neutral-950">
              {formatMoney(summary.referenceValue)}
            </div>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="mt-5 rounded-[24px] border border-dashed border-amber-300 bg-white/70 p-5 text-sm font-bold text-amber-800">
          No hay cortes gratis reportados para este rango o el backend aun no envia los campos de cortesia.
        </div>
      ) : summary.byBarber.length > 0 ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {summary.byBarber.map((item) => (
            <div key={item.barberId || item.barberName} className="rounded-[24px] border border-amber-100 bg-white p-4 shadow-sm">
              <div className="text-sm font-black text-neutral-950">{item.barberName}</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-2xl bg-amber-50 px-3 py-2">
                  <div className="text-xs font-bold text-amber-700">Cantidad</div>
                  <div className="mt-1 font-black text-neutral-950">{item.count}</div>
                </div>
                <div className="rounded-2xl bg-neutral-50 px-3 py-2">
                  <div className="text-xs font-bold text-neutral-500">Ref.</div>
                  <div className="mt-1 font-black text-neutral-950">{formatMoney(item.referenceValue)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
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
          <>
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"><div className="text-[10px] font-black uppercase tracking-[.16em] text-neutral-400">Producción</div><div className="mt-2 text-xl font-black text-neutral-950">{formatMoney(items.reduce((sum, item) => sum + n(item.total), 0))}</div></div>
              <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4"><div className="text-[10px] font-black uppercase tracking-[.16em] text-violet-500">Comisión aplicada</div><div className="mt-2 text-xl font-black text-violet-800">{formatMoney(items.reduce((sum, item) => sum + n(item.commissionAmountApplied), 0))}</div></div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><div className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-600">Neto del negocio</div><div className="mt-2 text-xl font-black text-emerald-800">{formatMoney(items.reduce((sum, item) => sum + n(item.ownerNetAmount), 0))}</div></div>
            </div>
            <div className="overflow-x-auto rounded-[24px] border border-neutral-200">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="bg-neutral-50 text-xs font-black uppercase tracking-[0.14em] text-neutral-400">
                <tr>
                  <th className="px-4 py-4">Fecha</th>
                  <th className="px-4 py-4">Cliente</th>
                  <th className="px-4 py-4">Servicios</th>
                  <th className="px-4 py-4">Método</th>
                  <th className="px-4 py-4 text-right">Total</th>
                  <th className="px-4 py-4 text-right">Comisión aplicada</th>
                  <th className="px-4 py-4 text-right">Neto negocio</th>
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
                    <td className="px-4 py-4 text-right">
                      <div className="font-black text-violet-700">{formatMoney(item.commissionAmountApplied)}</div>
                      <div className="mt-1 text-[11px] font-bold text-neutral-400">{item.commissionSnapshotComplete ? `${n(item.effectiveCommissionPercentage).toFixed(2)}% efectivo` : 'Venta anterior · respaldo'}</div>
                    </td>
                    <td className="px-4 py-4 text-right font-black text-emerald-700">{formatMoney(item.ownerNetAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </div>
  );
}


function BranchComparisonSection({ branchReports, loading, onOpenDetail }) {
  const orderedReports = [...branchReports].sort((a, b) => n(b.totalSales) - n(a.totalSales));
  const totalSales = orderedReports.reduce((sum, item) => sum + n(item.totalSales), 0);
  const totalCount = orderedReports.reduce((sum, item) => sum + n(item.totalSalesCount), 0);

  return (
    <section className="rounded-[30px] border border-neutral-200 bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
            Sedes
          </div>
          <h3 className="mt-2 text-xl font-black text-neutral-950">
            Comparativo por sede
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            Compara ventas, ticket promedio, barberos activos y desempeño por sucursal.
          </p>
        </div>

        <div className="rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-black text-neutral-700">
          {orderedReports.length} sede{orderedReports.length === 1 ? '' : 's'} · {formatMoney(totalSales)} · {totalCount} venta{totalCount === 1 ? '' : 's'}
        </div>
      </div>

      {loading ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-52 animate-pulse rounded-[28px] bg-neutral-100" />
          ))}
        </div>
      ) : orderedReports.length === 0 ? (
        <div className="mt-5 rounded-[24px] border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm font-bold text-neutral-400">
          No hay información por sede para el rango seleccionado.
        </div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orderedReports.map((branch, index) => {
            const participation = totalSales > 0 ? (n(branch.totalSales) / totalSales) * 100 : 0;

            return (
              <div
                key={branch.branchId || branch.branchName || index}
                className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-5 transition hover:-translate-y-0.5 hover:border-amber-200 hover:bg-white hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-600">
                      Sede #{index + 1}
                    </div>
                    <h4 className="mt-2 text-xl font-black text-neutral-950">
                      {branch.branchName || 'Sede'}
                    </h4>
                  </div>

                  <div className="rounded-full bg-white px-3 py-1 text-xs font-black text-neutral-500 shadow-sm">
                    {formatPercent(participation)}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <div className="text-xs font-bold text-neutral-500">Ventas</div>
                    <div className="mt-1 text-lg font-black text-neutral-950">{formatMoney(branch.totalSales)}</div>
                  </div>

                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <div className="text-xs font-bold text-neutral-500">Cantidad</div>
                    <div className="mt-1 text-lg font-black text-neutral-950">{n(branch.totalSalesCount)}</div>
                  </div>

                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <div className="text-xs font-bold text-neutral-500">Ticket</div>
                    <div className="mt-1 text-lg font-black text-neutral-950">{formatMoney(branch.averageTicket)}</div>
                  </div>

                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <div className="text-xs font-bold text-neutral-500">Barberos</div>
                    <div className="mt-1 text-lg font-black text-neutral-950">{n(branch.activeBarbers)}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenDetail(branch)}
                  className="mt-5 w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white transition hover:bg-amber-500 hover:text-neutral-950"
                >
                  Ver detalle de sede
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function BranchDetailModal({ branch, onClose }) {
  const payment = branch?.paymentSummary || {};
  const paymentRows = [
    ['Efectivo', payment.cash],
    ['Yape', payment.yape],
    ['Plin', payment.plin],
    ['Tarjeta', payment.card],
    ['Transferencia', payment.transfer],
  ];

  const barbers = Array.isArray(branch?.barbers) ? branch.barbers : [];
  const services = Array.isArray(branch?.topServices) ? branch.topServices : [];
  const daily = Array.isArray(branch?.dailySales) ? branch.dailySales : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 px-4 py-8 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-auto rounded-[34px] border border-white/10 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.35)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
              Detalle por sede
            </div>
            <h2 className="mt-1 text-2xl font-black text-neutral-950">
              {branch?.branchName || 'Sede'}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Ventas, métodos de pago, barberos y servicios dentro del rango seleccionado.
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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Ventas" value={formatMoney(branch?.totalSales)} helper={`${n(branch?.totalSalesCount)} ventas`} tone="dark" />
          <StatCard title="Ticket promedio" value={formatMoney(branch?.averageTicket)} helper="Promedio por venta" />
          <StatCard title="Barberos activos" value={n(branch?.activeBarbers)} helper="Con producción" tone="gold" />
          <StatCard title="Total métodos" value={formatMoney(payment.total)} helper="Pagos registrados" tone="green" />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-5">
            <h3 className="text-lg font-black text-neutral-950">Métodos de pago</h3>
            <div className="mt-4 grid gap-3">
              {paymentRows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <span className="text-sm font-bold text-neutral-600">{label}</span>
                  <span className="font-black text-neutral-950">{formatMoney(value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-neutral-200 bg-white p-5">
            <h3 className="text-lg font-black text-neutral-950">Ventas por día</h3>
            <div className="mt-4 h-64">
              {daily.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-neutral-300 text-sm font-bold text-neutral-400">
                  Sin ventas diarias.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={daily.map((item) => ({ date: shortDate(item.date), ventas: n(item.totalSales) }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatMoney(value)} />
                    <Line type="monotone" dataKey="ventas" stroke="#111827" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white">
            <div className="border-b border-neutral-100 p-5">
              <h3 className="text-lg font-black text-neutral-950">Barberos de la sede</h3>
              <p className="mt-1 text-sm text-neutral-500">Producción por profesional.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-neutral-50 text-xs font-black uppercase tracking-[0.14em] text-neutral-400">
                  <tr>
                    <th className="px-4 py-4">Barbero</th>
                    <th className="px-4 py-4 text-right">Ventas</th>
                    <th className="px-4 py-4 text-right">Servicios</th>
                    <th className="px-4 py-4 text-right">Promedio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {barbers.length === 0 ? (
                    <tr><td colSpan="4" className="px-4 py-8 text-center font-bold text-neutral-400">Sin barberos en este rango.</td></tr>
                  ) : (
                    barbers.map((barber) => (
                      <tr key={barber.barberId || barber.barberName}>
                        <td className="px-4 py-4 font-black text-neutral-950">{barber.barberName || 'Barbero'}</td>
                        <td className="px-4 py-4 text-right font-black text-neutral-950">{formatMoney(barber.totalSales)}</td>
                        <td className="px-4 py-4 text-right font-bold text-neutral-600">{n(barber.salesCount)}</td>
                        <td className="px-4 py-4 text-right font-bold text-neutral-600">{formatMoney(barber.averageTicket)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white">
            <div className="border-b border-neutral-100 p-5">
              <h3 className="text-lg font-black text-neutral-950">Servicios top</h3>
              <p className="mt-1 text-sm text-neutral-500">Servicios o productos con mayor movimiento.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-neutral-50 text-xs font-black uppercase tracking-[0.14em] text-neutral-400">
                  <tr>
                    <th className="px-4 py-4">Servicio / producto</th>
                    <th className="px-4 py-4 text-right">Cantidad</th>
                    <th className="px-4 py-4 text-right">Ventas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {services.length === 0 ? (
                    <tr><td colSpan="3" className="px-4 py-8 text-center font-bold text-neutral-400">Sin servicios en este rango.</td></tr>
                  ) : (
                    services.map((service) => (
                      <tr key={service.serviceName}>
                        <td className="px-4 py-4 font-black text-neutral-950">{service.serviceName || 'Servicio'}</td>
                        <td className="px-4 py-4 text-right font-bold text-neutral-600">{n(service.timesSold)}</td>
                        <td className="px-4 py-4 text-right font-black text-neutral-950">{formatMoney(service.totalAmount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
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
  const [branchReports, setBranchReports] = useState([]);
  const [expenseReport, setExpenseReport] = useState(null);
  const [expenseType, setExpenseType] = useState("");

  const [loading, setLoading] = useState(true);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [selectedBarber, setSelectedBarber] = useState(null);
  const [barberDetail, setBarberDetail] = useState([]);
  const [barberDetailLoading, setBarberDetailLoading] = useState(false);
  const [barberDetailError, setBarberDetailError] = useState('');
  const [selectedBranchReport, setSelectedBranchReport] = useState(null);

  const query = useMemo(() => {
    return {
      branchId: branchId || undefined,
      from,
      to,
      type: expenseType || undefined,
    };
  }, [branchId, from, to, expenseType]);

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


  async function loadBranchReportsForRange() {
    const targetBranches = branchId
      ? branches.filter((branch) => String(getBranchIdentifier(branch)) === String(branchId))
      : branches;

    if (!targetBranches.length) return [];

    const results = await Promise.allSettled(
      targetBranches
        .filter((branch) => getBranchIdentifier(branch) != null)
        .map(async (branch) => {
          const detail = await getBranchDetail({
            branchId: getBranchIdentifier(branch),
            from,
            to,
          });

          return {
            ...detail,
            branchId: getBranchIdentifier(branch),
            branchName: getBranchDisplayName(branch),
          };
        })
    );

    return results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value);
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
        branchReportsData,
        expenseData,
      ] = await Promise.all([
        getProfitabilityReport(query),
        getSalesReport(query),
        getBarberSummary(query),
        getDailySales(query),
        getTopServices(query),
        getPaymentSummary(query),
        loadBranchReportsForRange(),
        getExpenseReport({ ...query, type: expenseType || undefined }),
      ]);

      setProfitability(profitabilityData);
      setSalesReport(salesData);
      setBarbers(Array.isArray(barberData) ? barberData : []);
      setDailySales(Array.isArray(dailyData) ? dailyData : []);
      setTopServices(Array.isArray(servicesData) ? servicesData : []);
      setPaymentSummary(paymentData);
      setBranchReports(Array.isArray(branchReportsData) ? branchReportsData : []);
      setExpenseReport(expenseData);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudieron cargar los reportes.');
      setProfitability(null);
      setSalesReport(null);
      setBarbers([]);
      setDailySales([]);
      setTopServices([]);
      setPaymentSummary(null);
      setBranchReports([]);
      setExpenseReport(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    if (!from || !to) return;
    if (branchesLoading) return;
    loadReports();
  }, [query, branchesLoading, branches]);

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

  const courtesySummary = useMemo(() => {
    return buildCourtesyReportSummary({
      salesReport,
      paymentSummary,
      profitability,
      barbers,
      branchReports,
    });
  }, [salesReport, paymentSummary, profitability, barbers, branchReports]);

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
      value: String(getBranchIdentifier(branch)),
      label: getBranchDisplayName(branch),
    })),
  ];

  const totalIncome = n(profitability?.totalSales) + n(profitability?.additionalIncome);
  const totalExpenses =
    n(profitability?.operationalExpenses) +
    n(profitability?.barberCommissionsAccrued);

  return (
    <div className="min-w-0 space-y-5 sm:space-y-7">
      <section className="relative overflow-hidden rounded-[26px] border border-amber-400/15 bg-[linear-gradient(135deg,#080808_0%,#111827_48%,#15110A_100%)] p-4 text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)] sm:rounded-[34px] sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(251,191,36,0.22),transparent_30%),radial-gradient(circle_at_100%_0%,rgba(16,185,129,0.16),transparent_34%)]" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
              Reportes premium
            </div>

            <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
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

      <section className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.045)] sm:rounded-[30px] sm:p-5">
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

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard
              title="Ventas totales"
              value={formatMoney(profitability?.totalSales)}
              helper="Ingresos por ventas"
              tone="dark"
            />

            <StatCard
              title="Ingresos adicionales"
              value={formatMoney(profitability?.additionalIncome)}
              helper="Movimientos de caja"
              tone="blue"
            />

            <StatCard
              title="Comisiones devengadas"
              value={formatMoney(profitability?.barberCommissionsAccrued)}
              helper="Costo real generado por ventas"
              tone="violet"
            />

            <StatCard
              title="Utilidad estimada"
              value={formatMoney(profitability?.netProfit)}
              helper={`Margen ${formatPercent(profitability?.profitMargin)}`}
              tone={n(profitability?.netProfit) >= 0 ? 'green' : 'red'}
            />

            <StatCard
              title="Total egresos"
              value={formatMoney(totalExpenses)}
              helper="Gastos + comisiones devengadas"
              tone="red"
            />
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Ingreso total"
              value={formatMoney(totalIncome)}
              helper="Ventas + adicionales"
              tone="gold"
            />

            <StatCard
              title="Flujo después de liquidaciones"
              value={formatMoney(profitability?.cashFlowAfterBarberSettlements)}
              helper="Vista de caja: pagos y adelantos realizados"
              tone="blue"
            />

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

          <CourtesyReportSection summary={courtesySummary} from={from} to={to} />

          <BranchComparisonSection
            branchReports={branchReports}
            loading={loading}
            onOpenDetail={setSelectedBranchReport}
          />

          <section className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_14px_38px_rgba(15,23,42,0.05)] sm:rounded-[30px] sm:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><h3 className="text-xl font-black text-neutral-950">Gastos detallados</h3><p className="mt-1 text-sm text-neutral-500">Operación, adelantos y pagos profesionales del rango.</p></div>
              <ExpenseTypePicker value={expenseType} onChange={setExpenseType} /></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-4"><StatCard label="Total" value={formatMoney(expenseReport?.total)} tone="red" /><StatCard label="Movimientos" value={n(expenseReport?.count)} /><StatCard label="Operativos" value={formatMoney(expenseReport?.totalsByType?.EXPENSE)} /><StatCard label="Pagos + adelantos" value={formatMoney(n(expenseReport?.totalsByType?.ADVANCE_BARBER) + n(expenseReport?.totalsByType?.PAYMENT_BARBER))} /></div>
            <div className="mt-5 max-h-[360px] overflow-auto rounded-2xl border border-neutral-200"><table className="w-full min-w-[760px] text-left text-sm"><thead className="sticky top-0 bg-neutral-50 text-xs font-black uppercase text-neutral-400"><tr><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Concepto</th><th className="px-4 py-3">Sede / profesional</th><th className="px-4 py-3 text-right">Monto</th></tr></thead><tbody className="divide-y divide-neutral-100">
              {(expenseReport?.items || []).map((item) => <tr key={item.id}><td className="px-4 py-3 font-bold">{String(item.date || "").slice(0, 10)}</td><td className="px-4 py-3 font-black text-amber-700">{expenseTypeLabel(item.type)}</td><td className="px-4 py-3">{item.concept}</td><td className="px-4 py-3">{item.branchName}{item.professional ? ` · ${item.professional}` : ""}</td><td className="px-4 py-3 text-right font-black">{formatMoney(item.amount)}</td></tr>)}
              {(expenseReport?.items || []).length === 0 && <tr><td colSpan="5" className="px-4 py-8 text-center font-bold text-neutral-400">Sin gastos para estos filtros.</td></tr>}
            </tbody></table></div>
          </section>
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

          <section className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_14px_38px_rgba(15,23,42,0.05)] sm:rounded-[30px] sm:p-5">
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

            <div className="mt-5 overflow-x-auto rounded-[24px] border border-neutral-200">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-neutral-50 text-xs font-black uppercase tracking-[0.14em] text-neutral-400">
                  <tr>
                    <th className="px-4 py-4">Barbero</th>
                    <th className="px-4 py-4 text-right">Ventas</th>
                    <th className="px-4 py-4 text-right">Servicios</th>
                    <th className="px-4 py-4 text-right">Promedio</th>
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

      {selectedBranchReport && (
        <BranchDetailModal
          branch={selectedBranchReport}
          onClose={() => setSelectedBranchReport(null)}
        />
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
