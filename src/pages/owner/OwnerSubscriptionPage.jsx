import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  Bot,
  Building2,
  CheckCircle2,
  Clock3,
  CreditCard,
  Crown,
  RefreshCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Store,
  UsersRound,
  WandSparkles,
} from 'lucide-react';
import {
  basePrice,
  billingLabel,
  discountPercent,
  finalPrice,
  createSubscriptionCheckout,
  getCurrentSubscription,
  isSubscriptionActive,
  monthlyPrice,
  planLabel,
  reportSubscriptionPayment,
  statusLabel,
} from '../../api/ownerSubscriptionApi';
import { formatTenantMoney } from '../../utils/tenantMoney';
import { openPaddleCheckout } from '../../utils/paddleCheckout';

const PLAN_OPTIONS = [
  {
    id: 'STARTER',
    name: 'Starter',
    price: 39,
    badge: 'Para empezar',
    description: 'Para barberías pequeñas que quieren ordenar reservas, caja y clientes.',
    limits: '1 sede · 5 barberos · 1 admin',
    features: ['Reservas online', 'Caja básica', 'Clientes e historial', 'Puntos y premios básicos'],
    icon: Store,
    tone: 'amber',
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 79,
    badge: 'Más recomendado',
    description: 'Para barberías que quieren crecer con promociones, reportes e inventario.',
    limits: '3 sedes · 15 barberos · 3 admins',
    features: ['Caja avanzada', 'Inventario por sede', 'Promociones', 'Reportes por sede y barbero'],
    icon: Crown,
    tone: 'neutral',
  },
  {
    id: 'GODS_AI',
    name: 'Gods AI',
    price: 149,
    badge: 'Premium',
    description: 'Para barberías que quieren diferenciarse con inteligencia artificial.',
    limits: '4 sedes · 20 barberos · IA con uso justo',
    features: ['Todo Pro', 'Asesor de cortes IA', 'Vista ilustrativa', 'Soporte prioritario'],
    icon: Bot,
    tone: 'violet',
  },
];

const BILLING_OPTIONS = [
  {
    id: 'MONTHLY',
    label: 'Mensual',
    description: 'Paga mes a mes',
    discount: '',
  },
  {
    id: 'SEMIANNUAL',
    label: 'Semestral',
    description: '6 meses',
    discount: '10% OFF',
  },
  {
    id: 'ANNUAL',
    label: 'Anual',
    description: '12 meses',
    discount: '20% OFF',
  },
];

function currency(value, currencyCode = '') {
  return formatTenantMoney(value, currencyCode);
}

function formatDate(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function toneClasses(tone) {
  const map = {
    amber: {
      card: 'border-amber-200 bg-amber-50 text-amber-700',
      icon: 'bg-amber-100 text-amber-700',
      active: 'border-amber-400 bg-amber-50 shadow-[0_18px_45px_rgba(245,158,11,0.15)]',
    },
    neutral: {
      card: 'border-neutral-900 bg-neutral-950 text-white',
      icon: 'bg-white/10 text-white',
      active: 'border-neutral-950 bg-neutral-950 text-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]',
    },
    violet: {
      card: 'border-violet-200 bg-violet-50 text-violet-700',
      icon: 'bg-violet-100 text-violet-700',
      active: 'border-violet-400 bg-violet-50 shadow-[0_18px_45px_rgba(124,58,237,0.15)]',
    },
  };

  return map[tone] || map.amber;
}

function StatCard({ icon: Icon, label, value, helper, tone = 'neutral' }) {
  const tones = {
    neutral: 'border-neutral-200 bg-white text-neutral-950',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    red: 'border-red-200 bg-red-50 text-red-800',
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
  };

  return (
    <div className={`rounded-[26px] border p-5 shadow-[0_14px_34px_rgba(15,23,42,0.045)] ${tones[tone] || tones.neutral}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.16em] opacity-70">
            {label}
          </div>
          <div className="mt-2 text-2xl font-black">{value}</div>
          {helper && <div className="mt-1 text-sm font-bold opacity-70">{helper}</div>}
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 text-current">
          <Icon size={22} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}

function PlanCard({ plan, selected, onSelect, currencyCode }) {
  const Icon = plan.icon;
  const tone = toneClasses(plan.tone);
  const priceText = currency(plan.price, currencyCode);

  return (
    <button
      type="button"
      onClick={() => onSelect(plan.id)}
      className={`group flex min-h-[520px] flex-col rounded-[30px] border p-5 text-left transition-all hover:-translate-y-1 ${
        selected
          ? tone.active
          : 'border-neutral-200 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.045)] hover:shadow-[0_22px_55px_rgba(15,23,42,0.09)]'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-14 w-14 items-center justify-center rounded-[20px] ${selected ? tone.icon : 'bg-neutral-100 text-neutral-700'}`}>
          <Icon size={24} strokeWidth={2.5} />
        </div>

        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
          selected ? 'bg-white/15 text-current ring-1 ring-current/10' : 'bg-neutral-100 text-neutral-600'
        }`}>
          {plan.badge}
        </span>
      </div>

      <h3 className="mt-5 text-xl font-black">{plan.name}</h3>
      <div className="mt-3 min-w-0">
        <div className="flex min-w-0 flex-col gap-1">
          <span
            className="max-w-full break-words font-black leading-none tracking-tight"
            style={{
              fontSize: priceText.length > 13 ? '1.85rem' : '2.25rem',
            }}
          >
            {priceText}
          </span>
          <span className="text-xs font-black opacity-60">/ mes</span>
        </div>
      </div>

      <p className="mt-3 min-h-[48px] text-sm font-semibold leading-6 opacity-70">
        {plan.description}
      </p>

      <div className="mt-4 rounded-2xl bg-white/60 px-4 py-3 text-sm font-black text-neutral-700">
        {plan.limits}
      </div>

      <div className="mt-4 grid gap-2">
        {plan.features.map((feature) => (
          <div key={feature} className="flex items-center gap-2 text-sm font-bold opacity-80">
            <CheckCircle2 size={16} strokeWidth={2.4} />
            {feature}
          </div>
        ))}
      </div>
    </button>
  );
}

function BillingButton({ option, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(option.id)}
      className={`rounded-2xl border px-5 py-4 text-left transition ${
        selected
          ? 'border-neutral-950 bg-neutral-950 text-white shadow-[0_14px_34px_rgba(15,23,42,0.18)]'
          : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-950'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-black">{option.label}</div>
          <div className={`mt-1 text-xs font-bold ${selected ? 'text-white/60' : 'text-neutral-400'}`}>
            {option.description}
          </div>
        </div>

        {option.discount && (
          <span className={`rounded-full px-3 py-1 text-[10px] font-black ${
            selected ? 'bg-amber-300 text-neutral-950' : 'bg-amber-100 text-amber-700'
          }`}>
            {option.discount}
          </span>
        )}
      </div>
    </button>
  );
}

export default function OwnerSubscriptionPage() {
  const [subscription, setSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('PRO');
  const [selectedBilling, setSelectedBilling] = useState('MONTHLY');

  const [operationNumber, setOperationNumber] = useState('');
  const [payerName, setPayerName] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [openingCheckout, setOpeningCheckout] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const planPrices = subscription?.planPrices || [];
  const activeCurrency = planPrices[0]?.currency || subscription?.currency || '';
  const regularPrice = basePrice(selectedPlan, selectedBilling, planPrices);
  const amount = finalPrice(selectedPlan, selectedBilling, planPrices);
  const discount = discountPercent(selectedBilling);
  const discountAmount = regularPrice - amount;
  const visiblePlans = useMemo(
    () => PLAN_OPTIONS.map((plan) => ({
      ...plan,
      price: monthlyPrice(plan.id, planPrices),
    })),
    [planPrices]
  );

  const currentActive = isSubscriptionActive(subscription);
  const isPeruManualPayment = String(activeCurrency || '').toUpperCase() === 'PEN';
  const availableBillingOptions = isPeruManualPayment
    ? BILLING_OPTIONS
    : BILLING_OPTIONS.filter((option) => option.id === 'MONTHLY');

  async function load() {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const data = await getCurrentSubscription();
      setSubscription(data);
      setSelectedPlan(data.plan || 'PRO');
      setSelectedBilling(data.billingCycle || 'MONTHLY');
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.message || 'No se pudo cargar la suscripción.',
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!loading && !isPeruManualPayment && selectedBilling !== 'MONTHLY') {
      setSelectedBilling('MONTHLY');
    }
  }, [isPeruManualPayment, loading, selectedBilling]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage({ type: '', text: '' });

    if (!operationNumber.trim()) {
      setMessage({
        type: 'error',
        text: 'Ingresa el número de operación del pago.',
      });
      return;
    }

    setSending(true);

    try {
      await reportSubscriptionPayment({
        plan: selectedPlan,
        billingCycle: selectedBilling,
        paymentMethod: 'YAPE',
        operationNumber,
        amount,
        payerName,
        payerPhone,
        notes,
      });

      setOperationNumber('');
      setPayerName('');
      setPayerPhone('');
      setNotes('');

      setMessage({
        type: 'success',
        text: 'Pago reportado correctamente. Queda pendiente de revisión.',
      });

      await load();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.message || 'No se pudo reportar el pago.',
      });
    } finally {
      setSending(false);
    }
  }

  async function handleInternationalCheckout() {
    setMessage({ type: '', text: '' });
    setOpeningCheckout(true);

    try {
      const checkout = await createSubscriptionCheckout({
        plan: selectedPlan,
        billingCycle: selectedBilling,
      });

      if (checkout?.priceId) {
        await openPaddleCheckout({
          priceId: checkout.priceId,
          tenantId: subscription?.tenantId,
          plan: selectedPlan,
          billingCycle: selectedBilling,
          currency: checkout.currency || activeCurrency,
          onEvent: (event) => {
            const eventName = String(event?.name || '').toLowerCase();
            if (!eventName.includes('error')) return;

            const message =
              event?.error?.detail ||
              event?.error?.message ||
              event?.data?.error?.detail ||
              event?.data?.error?.message ||
              'Paddle rechazo el checkout. Revisa que la cuenta live este verificada, el dominio aprobado y el price ID corresponda al mismo entorno.';

            setMessage({
              type: 'error',
              text: message,
            });
          },
        });
        return;
      }

      if (!checkout?.checkoutUrl) {
        throw new Error('No se pudo iniciar el checkout internacional.');
      }

      window.location.href = checkout.checkoutUrl;
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.message || 'No se pudo abrir el pago internacional.',
      });
    } finally {
      setOpeningCheckout(false);
    }
  }

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[34px] border border-amber-400/15 bg-[linear-gradient(135deg,#080808_0%,#111827_48%,#15110A_100%)] p-6 text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(251,191,36,0.22),transparent_30%),radial-gradient(circle_at_100%_0%,rgba(139,92,246,0.18),transparent_34%)]" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
              Suscripción y pagos
            </div>

            <h2 className="mt-5 text-4xl font-black tracking-tight">
              Plan actual y renovación
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65">
              Revisa tu plan, límites de uso, ciclo de facturación y reporta pagos por Yape para renovar tu cuenta.
            </p>
          </div>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.08] px-5 py-4 text-sm font-black text-white/80 transition hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCcw size={17} strokeWidth={2.5} />
            Actualizar
          </button>
        </div>
      </section>

      {message.text && (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm font-black ${
            message.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="rounded-[30px] border border-neutral-200 bg-white p-6 font-black text-neutral-500 shadow-sm">
          Cargando suscripción...
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={ShieldCheck}
              label="Estado"
              value={subscription ? statusLabel(subscription.estado) : '-'}
              helper={currentActive ? 'Cuenta operativa' : 'Requiere revisión'}
              tone={currentActive ? 'green' : 'red'}
            />
            <StatCard
              icon={Crown}
              label="Plan actual"
              value={subscription ? planLabel(subscription.plan) : '-'}
              helper={subscription?.trial ? 'Periodo de prueba' : billingLabel(subscription?.billingCycle)}
              tone="amber"
            />
            <StatCard
              icon={Clock3}
              label="Renovación"
              value={formatDate(subscription?.fechaRenovacion)}
              helper={`Fin: ${formatDate(subscription?.fechaFin)}`}
              tone="blue"
            />
            <StatCard
              icon={Building2}
              label="Uso"
              value={`${subscription?.usedBranches ?? 0}/${subscription?.maxBranches ?? 0} sedes`}
              helper={`${subscription?.usedBarbers ?? 0}/${subscription?.maxBarbers ?? 0} barberos · ${subscription?.usedAdmins ?? 0}/${subscription?.maxAdmins ?? 0} admins`}
              tone="neutral"
            />
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)]">
            <div className="space-y-5">
              <section className="rounded-[34px] border border-neutral-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.055)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
                      Elegir plan
                    </div>
                    <h3 className="mt-2 text-2xl font-black text-neutral-950">
                      Selecciona el plan a renovar
                    </h3>
                  </div>

                  <Sparkles className="text-amber-500" size={28} strokeWidth={2.5} />
                </div>

                <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
                  {visiblePlans.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      selected={selectedPlan === plan.id}
                      onSelect={setSelectedPlan}
                      currencyCode={activeCurrency}
                    />
                  ))}
                </div>
              </section>

              <section className="rounded-[34px] border border-neutral-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.055)]">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
                  Ciclo de facturación
                </div>

                <h3 className="mt-2 text-2xl font-black text-neutral-950">
                  Ahorra pagando por adelantado
                </h3>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {availableBillingOptions.map((option) => (
                    <BillingButton
                      key={option.id}
                      option={option}
                      selected={selectedBilling === option.id}
                      onSelect={setSelectedBilling}
                    />
                  ))}
                </div>

                {!isPeruManualPayment && (
                  <p className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-800">
                    El cobro automatico internacional esta habilitado en ciclo mensual. Los planes semestral y anual se activaran cuando creemos esos precios recurrentes en Paddle.
                  </p>
                )}
              </section>

              {selectedPlan === 'GODS_AI' && (
                <section className="rounded-[34px] border border-amber-200 bg-amber-50 p-6 shadow-[0_18px_45px_rgba(245,158,11,0.10)]">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-amber-700">
                      <WandSparkles size={25} strokeWidth={2.5} />
                    </div>

                    <div>
                      <h3 className="text-2xl font-black text-amber-900">
                        Gods AI · uso justo
                      </h3>

                      <p className="mt-2 text-sm font-bold leading-6 text-amber-800">
                        Incluye una referencia comercial de hasta 50 generaciones por mes. Si más adelante excedes el uso, puedes ampliar con paquetes adicionales.
                      </p>
                    </div>
                  </div>
                </section>
              )}
            </div>

            <aside className="space-y-5">
              <section className="rounded-[34px] border border-neutral-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.055)]">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">
                  Resumen de pago
                </div>

                <h3 className="mt-2 text-2xl font-black text-neutral-950">
                  {planLabel(selectedPlan)} · {billingLabel(selectedBilling)}
                </h3>

                <div className="mt-5 rounded-[26px] border border-violet-100 bg-violet-50 p-5">
                  <div className="flex items-center justify-between text-sm font-black text-violet-700">
                    <span>Precio mensual</span>
                    <span>{currency(monthlyPrice(selectedPlan, planPrices), activeCurrency)}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-sm font-black text-violet-700">
                    <span>Precio regular</span>
                    <span className={discount > 0 ? 'line-through opacity-60' : ''}>
                      {currency(regularPrice, activeCurrency)}
                    </span>
                  </div>

                  {discount > 0 && (
                    <div className="mt-3 flex items-center justify-between text-sm font-black text-emerald-700">
                      <span>Descuento {(discount * 100).toFixed(0)}%</span>
                      <span>- {currency(discountAmount, activeCurrency)}</span>
                    </div>
                  )}

                  <div className="mt-5 border-t border-violet-200 pt-4">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-violet-500">
                      Monto final
                    </div>
                    <div className="mt-2 break-words text-[clamp(2rem,3vw,2.75rem)] font-black leading-none text-neutral-950">
                      {currency(amount, activeCurrency)}
                    </div>
                  </div>
                </div>

                {isPeruManualPayment ? (
                <div className="mt-5 rounded-[26px] border border-blue-100 bg-blue-50 p-5">
                  <div className="flex items-center gap-3">
                    <CreditCard size={22} strokeWidth={2.5} className="text-blue-700" />
                    <div>
                      <div className="text-sm font-black text-blue-900">
                        Pago por Yape
                      </div>
                      <div className="text-xs font-bold text-blue-600">
                        Envía el monto y reporta tu número de operación.
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-white px-4 py-3">
                    <div className="text-xs font-black uppercase tracking-[0.16em] text-neutral-400">
                      Número Yape
                    </div>
                    <div className="mt-1 text-2xl font-black text-neutral-950">
                      958062847
                    </div>
                    <div className="mt-1 text-xs font-bold text-neutral-500">
                      Aquí luego puedes colocar el QR real.
                    </div>
                  </div>
                </div>
                ) : (
                <div className="mt-5 rounded-[26px] border border-emerald-100 bg-emerald-50 p-5">
                  <div className="flex items-center gap-3">
                    <CreditCard size={22} strokeWidth={2.5} className="text-emerald-700" />
                    <div>
                      <div className="text-sm font-black text-emerald-900">
                        Pago automático internacional
                      </div>
                      <div className="text-xs font-bold text-emerald-700">
                        Registra tu tarjeta una sola vez y la renovación se cobra automáticamente.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleInternationalCheckout}
                    disabled={openingCheckout}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CreditCard size={17} strokeWidth={2.5} />
                    {openingCheckout ? 'Abriendo checkout...' : `Pagar con tarjeta · ${currency(amount, activeCurrency)}`}
                  </button>
                </div>
                )}
              </section>

              {isPeruManualPayment ? (
              <form
                onSubmit={handleSubmit}
                className="rounded-[34px] border border-neutral-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.055)]"
              >
                <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
                  Ya pagué
                </div>

                <h3 className="mt-2 text-2xl font-black text-neutral-950">
                  Reportar pago
                </h3>

                <div className="mt-5 grid gap-4">
                  <input
                    value={operationNumber}
                    onChange={(event) => setOperationNumber(event.target.value)}
                    placeholder="Número de operación"
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-bold text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />

                  <input
                    value={payerName}
                    onChange={(event) => setPayerName(event.target.value)}
                    placeholder="Nombre del pagador"
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-bold text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />

                  <input
                    value={payerPhone}
                    onChange={(event) => setPayerPhone(event.target.value)}
                    placeholder="Celular del pagador"
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-bold text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />

                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={4}
                    placeholder="Notas opcionales"
                    className="resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-bold text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-6 py-4 text-sm font-black text-white transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? (
                    'Reportando pago...'
                  ) : (
                    <>
                      <Send size={17} strokeWidth={2.5} />
                      Reportar pago · {currency(amount, activeCurrency)}
                    </>
                  )}
                </button>

                {!currentActive && (
                  <div className="mt-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                    <AlertTriangle size={20} strokeWidth={2.5} />
                    Tu cuenta puede requerir revisión para seguir operando.
                  </div>
                )}
              </form>
              ) : (
              <section className="rounded-[34px] border border-neutral-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.055)]">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
                  Renovación automática
                </div>
                <h3 className="mt-2 text-2xl font-black text-neutral-950">
                  Sin reportar pagos manuales
                </h3>
                <p className="mt-3 text-sm font-bold leading-6 text-neutral-500">
                  Para cuentas fuera de Perú, el pago se valida desde el proveedor internacional. Al aprobarse el cargo, la suscripción se renueva automáticamente.
                </p>
              </section>
              )}
            </aside>
          </section>
        </>
      )}
    </div>
  );
}
