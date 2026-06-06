import { useEffect, useMemo, useState } from 'react';
import {
  Scissors,
  Sparkles,
  Hand,
  Eye,
  PenTool,
  Leaf,
  Blocks,
  CalendarDays,
  Banknote,
  UsersRound,
  Gift,
  ChartNoAxesCombined,
  ShieldCheck,
  Bot,
  CreditCard,
  Star,
  Tags,
  ReceiptText,
  CheckCircle2,
  UserRoundCog,
  Package,
  ArrowRight,
  Clock3,
  MessageCircle,
  Monitor,
  QrCode,
  Smartphone,
  TrendingUp,
} from 'lucide-react';
import { Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { demoRequestApi } from './api/demoRequestApi';
import { googleSignupUrl } from './api/authApi';
import OwnerSecurityPage from './pages/owner/OwnerSecurityPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import GoogleLogo from './components/GoogleLogo';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicBookingPage from './pages/public/PublicBookingPage';
import OwnerPermissionRoute from './routes/OwnerPermissionRoute';
import OwnerAdjustPointsPage from './pages/owner/OwnerAdjustPointsPage';
import LoginPage from './pages/auth/LoginPage';
import GoogleCallbackPage from './pages/auth/GoogleCallbackPage';
import OwnerAdminsPage from './pages/owner/OwnerAdminsPage';
import OwnerLayout from './pages/owner/OwnerLayout';
import OwnerDashboardPage from './pages/owner/OwnerDashboardPage';
import OwnerAgendaPage from './pages/owner/OwnerAgendaPage';
import OwnerCustomersPage from './pages/owner/OwnerCustomersPage';
import OwnerCashPage from './pages/owner/OwnerCashPage';
import OwnerProductsPage from './pages/owner/OwnerProductsPage';
import OwnerReportsPage from './pages/owner/OwnerReportsPage';
import OwnerConfigPage from './pages/owner/OwnerConfigPage';
import OwnerBrandingPage from './pages/owner/OwnerBrandingPage';
import OwnerServicesPage from './pages/owner/OwnerServicesPage';
import OwnerBranchesPage from './pages/owner/OwnerBranchesPage';
import OwnerRewardsPage from './pages/owner/OwnerRewardsPage';
import OwnerBarbersPage from './pages/owner/OwnerBarbersPage';
import OwnerBarberSchedulePage from './pages/owner/OwnerBarberSchedulePage';
import OwnerReservationSettingsPage from './pages/owner/OwnerReservationSettingsPage';
import OwnerPromotionsPage from './pages/owner/OwnerPromotionsPage';
import OwnerSubscriptionPage from './pages/owner/OwnerSubscriptionPage';
import OwnerLoyaltySettingsPage from './pages/owner/OwnerLoyaltySettingsPage';
import OwnerWhatsappSettingsPage from './pages/owner/OwnerWhatsappSettingsPage';
import { getPublicSubscriptionPrices } from './api/publicSubscriptionPricingApi';
import {
  buildPriceMap,
  COUNTRY_PRICE_OPTIONS,
  formatSubscriptionPrice,
  getInitialPricingCountry,
  getPlanPriceFromMap,
} from './utils/subscriptionPricing';

import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import SuperAdminLayout from './componentes/super-admin/SuperAdminLayout';
import {
  SuperAdminDashboard,
  SuperAdminCreateBarbershop,
  SuperAdminPayments,
  SuperAdminTenants,
  SuperAdminDemoRequests,
} from './pages/super-admin';

const WHATSAPP_NUMBER = '51958062847';

const buildWhatsAppUrl = (message) => {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

function PublicHomePage() {
  const [pricingCountry, setPricingCountry] = useState(getInitialPricingCountry);
  const [remotePrices, setRemotePrices] = useState([]);
  const publicPriceMap = useMemo(() => buildPriceMap(remotePrices), [remotePrices]);

  useEffect(() => {
    let active = true;
    getPublicSubscriptionPrices(pricingCountry)
      .then((prices) => {
        if (active) setRemotePrices(prices);
      })
      .catch(() => {
        if (active) setRemotePrices([]);
      });
    return () => {
      active = false;
    };
  }, [pricingCountry]);

  const whatsappUrl = buildWhatsAppUrl(
    'Hola, quiero una demo gratis de Super Gods App.\n\n' +
      'Empresa: Gods Technologies S.A.C.\n' +
      'Producto: Super Gods App\n' +
      'Mi negocio se llama: \n' +
      'Rubro: \n' +
      'Estoy en: \n' +
      'Tengo aproximadamente ___ profesionales.'
  );

  const rubros = [
    { icon: Scissors, title: 'Barberías', text: 'Reservas, caja, barberos, puntos, promociones, pagos y reportes.' },
    { icon: Sparkles, title: 'Peluquerías', text: 'Agenda, servicios, profesionales, clientes frecuentes y control de ingresos.' },
    { icon: Hand, title: 'Estudios de uñas', text: 'Citas, paquetes, clientas frecuentes, historial, pagos y fidelización.' },
    { icon: Eye, title: 'Cejas y pestañas', text: 'Reservas ordenadas, especialistas, servicios recurrentes y promociones.' },
    { icon: PenTool, title: 'Tattoo studios', text: 'Citas, artistas, clientes, pagos, seguimiento y organización del estudio.' },
    { icon: Leaf, title: 'Spas y estética', text: 'Servicios, reservas, paquetes, clientes, sedes, caja y reportes.' },
  ];

  const companyServices = [
    {
      icon: Blocks,
      title: 'Desarrollo de software para negocios',
      text: 'Creamos plataformas digitales para ordenar operaciones, atención, ventas y administración.',
    },
    {
      icon: CalendarDays,
      title: 'Sistema de reservas online',
      text: 'Tus clientes pueden reservar desde su celular y el negocio controla horarios, sedes, servicios y profesionales.',
    },
    {
      icon: Banknote,
      title: 'Control de caja y ventas',
      text: 'Registra ingresos, gastos, efectivo, Yape, Plin, tarjeta, pagos mixtos y cierres diarios.',
    },
    {
      icon: UsersRound,
      title: 'Gestión de clientes',
      text: 'Guarda historial, visitas, puntos, recompensas, preferencias y datos de contacto.',
    },
    {
      icon: Gift,
      title: 'Fidelización, puntos y promociones',
      text: 'Crea premios, campañas y beneficios para que los clientes regresen con más frecuencia.',
    },
    {
      icon: ChartNoAxesCombined,
      title: 'Reportes y métricas',
      text: 'Visualiza ventas, utilidad, gastos, rendimiento por sede, profesional y rango de fechas.',
    },
    {
      icon: ShieldCheck,
      title: 'Roles y permisos',
      text: 'Controla el acceso de dueños, administradores, profesionales y equipo interno.',
    },
    {
      icon: Bot,
      title: 'Inteligencia artificial aplicada',
      text: 'Soluciones con IA para mejorar la experiencia del cliente y diferenciar el negocio.',
    },
  ];

  const features = [
    {
      icon: CalendarDays,
      title: 'Reservas online',
      text: 'Clientes reservan desde su celular y el negocio controla horarios, sedes, servicios y profesionales.',
    },
    {
      icon: Banknote,
      title: 'Control de caja',
      text: 'Apertura, cierre, ingresos, gastos, ventas, métodos de pago y movimientos del día.',
    },
    {
      icon: CreditCard,
      title: 'Pagos por método',
      text: 'Controla efectivo, Yape, Plin, tarjeta y pagos mixtos para cuadrar mejor el negocio.',
    },
    {
      icon: UsersRound,
      title: 'Clientes e historial',
      text: 'Guarda datos, historial de visitas, reservas, consumos, puntos y comportamiento.',
    },
    {
      icon: Star,
      title: 'Puntos de fidelidad',
      text: 'Premia automáticamente a clientes frecuentes y motiva nuevas visitas.',
    },
    {
      icon: Gift,
      title: 'Premios y recompensas',
      text: 'Crea premios canjeables por puntos para aumentar la recurrencia.',
    },
    {
      icon: Tags,
      title: 'Promociones',
      text: 'Crea ofertas, descuentos y campañas para atraer más reservas.',
    },
    {
      icon: ReceiptText,
      title: 'Reservas con inicial',
      text: 'Permite separar citas con pago inicial, número de operación y comprobante.',
    },
    {
      icon: CheckCircle2,
      title: 'Validación de pagos',
      text: 'El dueño puede revisar, aprobar o rechazar comprobantes de pagos iniciales.',
    },
    {
      icon: UserRoundCog,
      title: 'Gestión de profesionales',
      text: 'Administra horarios, servicios asignados, comisiones, pagos y rendimiento.',
    },
    {
      icon: Package,
      title: 'Inventario por sede',
      text: 'Controla productos, stock, imágenes, precios y disponibilidad por sucursal.',
    },
    {
      icon: ChartNoAxesCombined,
      title: 'Reportes del negocio',
      text: 'Mira ventas, utilidad, gastos, clientes, profesionales y rendimiento por fechas.',
    },
  ];

  const plans = [
    {
      name: 'Starter',
      price: formatSubscriptionPrice(getPlanPriceFromMap('STARTER', pricingCountry, publicPriceMap)),
      badge: 'Para empezar',
      description: 'Para negocios pequeños que quieren ordenar reservas, caja y clientes.',
      items: [
        '1 sede',
        'Hasta 5 profesionales',
        'Reservas online',
        'Control de caja',
        'Clientes e historial',
        'Programa de puntos',
        'Soporte inicial',
      ],
    },
    {
      name: 'Pro',
      price: formatSubscriptionPrice(getPlanPriceFromMap('PRO', pricingCountry, publicPriceMap)),
      badge: 'Más recomendado',
      highlighted: true,
      description: 'Para negocios que quieren crecer con promociones, reportes y más control.',
      items: [
        'Hasta 3 sedes',
        'Hasta 15 profesionales',
        'Promociones ilimitadas',
        'Recompensas ilimitadas',
        'Inventario por sede',
        'Reportes por sede',
        'Reportes por profesional',
        'Caja avanzada',
      ],
    },
    {
      name: 'Gods AI',
      price: formatSubscriptionPrice(getPlanPriceFromMap('GODS_AI', pricingCountry, publicPriceMap)),
      badge: 'Premium',
      description: 'Para negocios que quieren diferenciarse con tecnología e inteligencia artificial.',
      items: [
        'Todo lo de Pro',
        'Asesor con IA',
        'Vista ilustrativa del resultado',
        'Experiencia premium para clientes',
        'Soporte prioritario',
      ],
    },
  ];

  const screenshots = [
    {
      title: 'Dashboard del dueño',
      text: 'Ventas, reservas, caja, clientes y métricas clave en una sola vista.',
      image: '/landing/dashboard-owner.png',
    },
    {
      title: 'Agenda inteligente',
      text: 'Reservas ordenadas por hora, cliente, servicio, profesional y estado.',
      image: '/landing/agenda-owner.png',
    },
    {
      title: 'Caja y pagos',
      text: 'Control de efectivo, Yape, Plin, tarjeta, ingresos, gastos y pagos a profesionales.',
      image: '/landing/caja-owner.png',
    },
    {
      title: 'Clientes, puntos y premios',
      text: 'Fideliza a tus clientes con historial, puntos, recompensas y promociones.',
      image: '/landing/clientes-puntos.png',
    },
    {
      title: 'Inventario por sede',
      text: 'Productos, stock, precios e imágenes separados por sucursal.',
      image: '/landing/inventario-sedes.png',
    },
  ];

  const outcomes = [
    {
      icon: CalendarDays,
      title: 'Menos citas perdidas',
      text: 'Agenda online por sede, profesional y horario para reducir el desorden de WhatsApp.',
    },
    {
      icon: Banknote,
      title: 'Caja más clara',
      text: 'Ventas, gastos, ingresos, pagos digitales y efectivo separados para cerrar mejor el día.',
    },
    {
      icon: UsersRound,
      title: 'Clientes que regresan',
      text: 'Puntos, premios, historial y promociones para convertir una visita en recurrencia.',
    },
    {
      icon: TrendingUp,
      title: 'Decisiones con datos',
      text: 'Reportes por sede, servicio y profesional para saber qué vende más y dónde ajustar.',
    },
  ];

  const salesStats = [
    {
      value: 'S/ 1,240',
      label: 'Ventas del día',
      detail: 'Resumen por método de pago para cerrar caja con claridad.',
    },
    {
      value: '148',
      label: 'Clientes activos',
      detail: 'Historial, puntos y visitas para vender con recurrencia.',
    },
    {
      value: '32',
      label: 'Reservas semanales',
      detail: 'Agenda por profesional, sede, horario y estado.',
    },
    {
      value: '+18%',
      label: 'Oportunidad de retorno',
      detail: 'Promociones, premios y recordatorios para que vuelvan.',
    },
  ];

  const verticalMarkets = [
    {
      icon: Scissors,
      title: 'Barberías',
      text: 'Controla citas, barberos, comisiones, caja y productos sin perder el ritmo del local.',
      image: '/landing/caja-owner.png',
      stat: 'Ventas + caja',
    },
    {
      icon: Hand,
      title: 'Estudios de uñas',
      text: 'Agenda servicios recurrentes, paquetes, clientas frecuentes y promociones por temporada.',
      image: '/landing/agenda-owner.png',
      stat: 'Citas recurrentes',
    },
    {
      icon: Sparkles,
      title: 'Salones de belleza',
      text: 'Organiza profesionales, servicios, sedes, inventario y experiencia del cliente desde una sola plataforma.',
      image: '/landing/dashboard-owner.png',
      stat: 'Reportes por sede',
    },
    {
      icon: Leaf,
      title: 'Spa y estética',
      text: 'Gestiona paquetes, historial, ventas, fidelización y reservas con una imagen más profesional.',
      image: '/landing/clientes-puntos.png',
      stat: 'Clientes que vuelven',
    },
  ];

  const faqItems = [
    {
      question: '¿Super Gods App sirve solo para barberías?',
      answer: 'No. Funciona para barberías, peluquerías, salones de belleza, estudios de uñas, cejas y pestañas, spas, estética y negocios que trabajan con reservas, servicios, profesionales y clientes frecuentes.',
    },
    {
      question: '¿Puedo usarlo desde celular y computadora?',
      answer: 'Sí. El dueño puede gestionar desde el panel web y el equipo puede operar desde la app móvil según su rol y permisos.',
    },
    {
      question: '¿La prueba gratis necesita tarjeta?',
      answer: 'No. Primero revisamos tu solicitud y activamos una demo para que pruebes reservas, caja, clientes, puntos, promociones y reportes.',
    },
    {
      question: '¿Funciona con monedas de otros países?',
      answer: 'Sí. La plataforma soporta moneda por país y los pagos internacionales pueden procesarse con Paddle cuando corresponde.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#0F172A]">
      <header className="fixed left-0 right-0 top-0 z-50 px-3 py-3 sm:px-4">
        <nav className="mx-auto flex max-w-7xl items-center gap-4 rounded-[26px] border border-white/80 bg-white/95 px-4 py-3 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:px-5">
  
          <a href="/" className="flex min-w-0 shrink-0 items-center gap-3">
  <img
    src="/logo-super-gods.png"
    alt="Gods Technologies S.A.C."
    className="h-11 w-11 rounded-2xl object-cover shadow-sm"
  />

  <div className="min-w-0">
    <p className="whitespace-nowrap text-base font-black leading-[0.95] tracking-tight text-[#0F172A] xl:text-lg">
      Gods Technologies
    </p>
    <p className="whitespace-nowrap text-xs font-bold text-[#64748B]">
      Super Gods App
    </p>
  </div>
</a>
     

          <div className="hidden min-w-0 flex-1 items-center justify-center gap-4 xl:flex 2xl:gap-6">
            <a href="#nosotros" className="whitespace-nowrap text-[13px] font-black text-[#334155] transition hover:text-[#2563EB] 2xl:text-sm">Nosotros</a>
            <a href="#rubros" className="whitespace-nowrap text-[13px] font-black text-[#334155] transition hover:text-[#2563EB] 2xl:text-sm">Rubros</a>
            <a href="#servicios" className="whitespace-nowrap text-[13px] font-black text-[#334155] transition hover:text-[#2563EB] 2xl:text-sm">Servicios</a>
            <a href="#producto" className="whitespace-nowrap text-[13px] font-black text-[#334155] transition hover:text-[#2563EB] 2xl:text-sm">Producto</a>
            <a href="#app" className="whitespace-nowrap text-[13px] font-black text-[#334155] transition hover:text-[#2563EB] 2xl:text-sm">App</a>
            <a href="#planes" className="whitespace-nowrap text-[13px] font-black text-[#334155] transition hover:text-[#2563EB] 2xl:text-sm">Planes</a>
            <a href="#preguntas" className="whitespace-nowrap text-[13px] font-black text-[#334155] transition hover:text-[#2563EB] 2xl:text-sm">FAQ</a>
            <a href="#contacto" className="whitespace-nowrap text-[13px] font-black text-[#334155] transition hover:text-[#2563EB] 2xl:text-sm">Contacto</a>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <a href="/login" className="hidden h-12 items-center justify-center whitespace-nowrap rounded-2xl border border-[#CBD5E1] bg-white px-5 text-sm font-black text-[#0F172A] transition hover:border-[#2563EB] hover:text-[#2563EB] md:inline-flex">
              Iniciar sesión
            </a>
            <a href="/registro-negocio" className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-2xl bg-[#0F2A5F] px-5 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5 hover:bg-[#123A84] sm:px-6">
              Probar 7 días gratis
            </a>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden px-4 pb-16 pt-32 md:pb-24 md:pt-40">
          <div className="absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(circle_at_18%_8%,#DBEAFE_0,#F5F7FB_44%,transparent_70%),radial-gradient(circle_at_88%_16%,rgba(16,185,129,0.18),transparent_32%)]" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_0.92fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Software premium para barberías, salones y centros de belleza
              </div>

              <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.055em] text-slate-950 md:text-7xl">
                Más reservas, caja clara y clientes que vuelven
              </h1>

              <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-600 md:text-xl">
                Super Gods App une agenda online, ventas, caja, clientes, puntos, promociones, inventario, comisiones y reportes en una plataforma creada para negocios de belleza que quieren operar con nivel profesional.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="/registro-negocio" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0F2A5F] px-7 py-4 text-base font-black text-white shadow-xl shadow-blue-900/20 transition hover:-translate-y-1 hover:bg-[#123A84]">
                  Probar 7 días gratis
                  <ArrowRight size={18} strokeWidth={2.6} />
                </a>
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-7 py-4 text-base font-black text-emerald-700 shadow-sm transition hover:-translate-y-1 hover:border-emerald-500 hover:bg-emerald-50">
                  <MessageCircle size={18} strokeWidth={2.6} />
                  Ayuda por WhatsApp
                </a>
                <a href="#capturas" className="inline-flex justify-center rounded-2xl border border-slate-200 bg-white px-7 py-4 text-base font-black text-slate-950 transition hover:-translate-y-1 hover:border-blue-600 hover:text-blue-700">
                  Ver cómo funciona
                </a>
                <a href="/login" className="inline-flex justify-center rounded-2xl bg-slate-950 px-7 py-4 text-base font-black text-white transition hover:-translate-y-1 sm:hidden">
                  Iniciar sesión
                </a>
              </div>

              <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
                {['Sin tarjeta', 'Soporte inicial', 'App + web', 'Multi moneda'].map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-xs font-black text-slate-700 shadow-sm">{item}</div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-br from-blue-500/20 via-green-400/10 to-transparent blur-2xl" />
              <div className="relative overflow-hidden rounded-[36px] border border-white bg-white p-3 shadow-[0_40px_100px_rgba(15,23,42,0.18)]">
                <img src="/landing/dashboard-owner.png" alt="Dashboard de Super Gods App para barberías y salones de belleza" className="rounded-[28px] object-cover" />
                <div className="grid gap-3 p-3 sm:grid-cols-3">
                  <HeroSignal icon={Clock3} title="Agenda" text="Reservas por horario" />
                  <HeroSignal icon={Banknote} title="Caja" text="Cierre por método" />
                  <HeroSignal icon={MessageCircle} title="Clientes" text="Historial y puntos" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {Boolean(import.meta.env.VITE_SHOW_OLD_HERO) && (
        <section className="hidden">
          <div className="absolute inset-x-0 top-0 h-[720px] bg-[radial-gradient(circle_at_20%_10%,#DCEBFF_0,#F5F7FB_42%,transparent_70%),radial-gradient(circle_at_85%_22%,rgba(34,197,94,0.16),transparent_30%)]" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_0.92fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Tecnología para negocios de belleza, estética y bienestar
              </div>

              <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.055em] text-slate-950 md:text-7xl">
                Digitalizamos tu negocio para que vendas más y trabajes mejor
              </h1>

              <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-600 md:text-xl">
                En Gods Technologies S.A.C. desarrollamos soluciones digitales para barberías, peluquerías, salones de belleza, estudios de uñas, cejas y pestañas, tattoo studios, spas y centros de estética.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="/registro-negocio" className="inline-flex justify-center rounded-2xl bg-[#0F2A5F] px-7 py-4 text-base font-black text-white shadow-xl shadow-blue-900/20 transition hover:-translate-y-1 hover:bg-[#123A84]">
                  Solicitar demo gratis
                </a>
                <a href="#nosotros" className="inline-flex justify-center rounded-2xl border border-slate-200 bg-white px-7 py-4 text-base font-black text-slate-950 transition hover:-translate-y-1 hover:border-blue-600 hover:text-blue-700">
                  Conocer la empresa
                </a>
                <a href="/login" className="inline-flex justify-center rounded-2xl bg-slate-950 px-7 py-4 text-base font-black text-white transition hover:-translate-y-1 sm:hidden">
                  Iniciar sesión
                </a>
              </div>

              <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
                {['Reservas', 'Caja', 'Clientes', 'Reportes'].map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-xs font-black text-slate-700 shadow-sm">{item}</div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-br from-blue-500/20 via-green-400/10 to-transparent blur-2xl" />
              <div className="relative overflow-hidden rounded-[36px] border border-white bg-white p-3 shadow-[0_40px_100px_rgba(15,23,42,0.18)]">
                <img src="/landing/dashboard-owner.png" alt="Dashboard de Super Gods App" className="rounded-[28px] object-cover" />
              </div>
            </div>
          </div>
        </section>

        )}

        <section className="px-4 py-8">
          <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-4">
            <MetricCard value="24/7" label="Reservas online" />
            <MetricCard value="+Caja" label="Control de pagos y ventas" />
            <MetricCard value="+Puntos" label="Fidelización y premios" />
            <MetricCard value="+Reportes" label="Métricas para decidir mejor" />
          </div>
        </section>

        <section id="app" className="px-4 py-16">
          <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[42px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.10)] lg:grid-cols-[1.02fr_0.98fr]">
            <div className="p-8 md:p-12">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">Empieza como prefieras</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950 md:text-6xl">
                Usa Super Gods desde celular o computadora
              </h2>
              <p className="mt-5 text-lg font-medium leading-8 text-slate-600">
                El dueño puede revisar reservas, caja, clientes y reportes desde el panel web. El equipo puede operar desde la app móvil según sus permisos.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <a href="/login" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-1">
                  <Monitor size={18} strokeWidth={2.6} />
                  Entrar desde web
                </a>
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:border-blue-600 hover:text-blue-700">
                  <Smartphone size={18} strokeWidth={2.6} />
                  Recibir enlace de app
                </a>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <AppStep number="1" title="Regístrate" text="Crea tu cuenta o solicita tu demo." />
                <AppStep number="2" title="Configura" text="Servicios, horarios y profesionales." />
                <AppStep number="3" title="Opera" text="Agenda, caja, clientes y reportes." />
              </div>
            </div>

            <div className="relative bg-slate-950 p-8 text-white md:p-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(59,130,246,0.35),transparent_35%),radial-gradient(circle_at_82%_78%,rgba(16,185,129,0.28),transparent_36%)]" />
              <div className="relative grid gap-5">
                <div className="rounded-[30px] border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950">
                      <QrCode size={24} strokeWidth={2.6} />
                    </span>
                    <div>
                      <p className="text-lg font-black">Descarga asistida</p>
                      <p className="text-sm font-medium text-slate-300">Mientras publicamos enlaces oficiales, te enviamos el acceso correcto por WhatsApp.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[30px] bg-white p-4 text-slate-950 shadow-2xl shadow-slate-950/30">
                  <img src="/landing/dashboard-owner.png" alt="Panel web de Super Gods App para dueños" className="rounded-[22px]" />
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-blue-50 p-3">
                      <p className="text-xs font-black text-blue-700">Agenda</p>
                      <p className="mt-1 text-lg font-black">32</p>
                    </div>
                    <div className="rounded-2xl bg-green-50 p-3">
                      <p className="text-xs font-black text-green-700">Caja</p>
                      <p className="mt-1 text-lg font-black">OK</p>
                    </div>
                    <div className="rounded-2xl bg-slate-100 p-3">
                      <p className="text-xs font-black text-slate-600">Clientes</p>
                      <p className="mt-1 text-lg font-black">148</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">Resultados que se sienten</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950 md:text-6xl">
                Una operación más ordenada se convierte en más ventas
              </h2>
              <p className="mt-5 text-lg font-medium leading-8 text-slate-600">
                La plataforma está pensada para el día a día del dueño: menos improvisación, más control y una experiencia más profesional para cada cliente.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {outcomes.map((item) => (
                <div key={item.title} className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.07)]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100"><LandingIcon icon={item.icon} /></div>
                  <h3 className="mt-5 text-xl font-black text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="nosotros" className="px-4 py-20">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
            <div className="rounded-[36px] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-900/20 md:p-10 lg:col-span-1">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-300">Nosotros</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] md:text-5xl">
                Gods Technologies S.A.C.
              </h2>
              <p className="mt-5 text-lg font-medium leading-8 text-slate-300">
                Somos una empresa peruana de tecnología enfocada en crear soluciones digitales para negocios de belleza, estética y bienestar.
              </p>
            </div>

            <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/80 md:p-10">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">Misión</p>
              <h3 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950">
                Impulsar la transformación digital
              </h3>
              <p className="mt-4 font-medium leading-8 text-slate-600">
                Nuestra misión es impulsar la transformación digital de negocios de belleza, estética y bienestar mediante soluciones tecnológicas simples, modernas y accesibles, que ayuden a mejorar la gestión, aumentar las ventas, fidelizar clientes y optimizar el trabajo diario.
              </p>
            </div>

            <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/80 md:p-10">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">Visión</p>
              <h3 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950">
                Ser líderes en Latinoamérica
              </h3>
              <p className="mt-4 font-medium leading-8 text-slate-600">
                Nuestra visión es ser una empresa tecnológica líder en Latinoamérica en el desarrollo de plataformas digitales para negocios de belleza, estética y bienestar, reconocida por crear herramientas innovadoras, fáciles de usar y enfocadas en el crecimiento real de nuestros clientes.
              </p>
            </div>
          </div>
        </section>

        <section id="rubros" className="px-4 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-[42px] bg-slate-950 p-6 text-white shadow-[0_34px_90px_rgba(15,23,42,0.20)] md:p-10">
              <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-300">Ventas visibles</p>
                  <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] md:text-6xl">
                    Números que el dueño necesita ver todos los días
                  </h2>
                  <p className="mt-5 text-lg font-medium leading-8 text-slate-300">
                    Super Gods App convierte reservas, ventas, caja y clientes en indicadores fáciles de revisar para tomar mejores decisiones.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {salesStats.map((item) => (
                    <div key={item.label} className="rounded-[26px] border border-white/10 bg-white/8 p-5 backdrop-blur">
                      <p className="text-3xl font-black tracking-[-0.04em] text-white md:text-4xl">{item.value}</p>
                      <p className="mt-2 text-sm font-black text-blue-200">{item.label}</p>
                      <p className="mt-2 text-xs font-medium leading-5 text-slate-300">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-16 grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">Rubros</p>
                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950 md:text-6xl">
                  Para negocios de belleza que viven de reservas y recurrencia
                </h2>
                <p className="mt-5 text-lg font-medium leading-8 text-slate-600">
                  La app no se presenta como un portafolio antiguo: muestra el sistema trabajando para cada tipo de negocio.
                </p>
              </div>

              <div className="rounded-[34px] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
                <div className="grid grid-cols-3 gap-3">
                  <img src="/landing/agenda-owner.png" alt="Agenda online para negocio de belleza" className="h-28 w-full rounded-2xl object-cover" />
                  <img src="/landing/caja-owner.png" alt="Caja y ventas de Super Gods App" className="h-28 w-full rounded-2xl object-cover" />
                  <img src="/landing/clientes-puntos.png" alt="Clientes, puntos y premios para fidelización" className="h-28 w-full rounded-2xl object-cover" />
                </div>
              </div>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {verticalMarkets.map((item) => (
                <VerticalMarketCard key={item.title} item={item} />
              ))}
            </div>
          </div>
        </section>

        <section id="rubros-lista" className="hidden">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">Rubros</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950 md:text-6xl">
                Tecnología para distintos negocios
              </h2>
              <p className="mt-5 text-lg font-medium leading-8 text-slate-600">
                Nuestra plataforma se adapta a negocios que trabajan con agenda, servicios, profesionales, clientes frecuentes y experiencia personalizada.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {rubros.map((item) => (
                <div key={item.title} className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.07)] transition hover:-translate-y-1 hover:border-blue-200">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100"><LandingIcon icon={item.icon} /></div>
                  <h3 className="mt-5 text-xl font-black text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="servicios" className="px-4 py-20">
          <div className="mx-auto max-w-7xl rounded-[42px] bg-white p-8 shadow-[0_30px_90px_rgba(15,23,42,0.10)] md:p-12">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">Servicios</p>
                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950 md:text-6xl">
                  Soluciones digitales para crecer con orden
                </h2>
                <p className="mt-5 text-lg font-medium leading-8 text-slate-600">
                  En Gods Technologies S.A.C. no solo creamos software. Creamos herramientas para vender más, administrar mejor y ofrecer una experiencia más profesional a los clientes.
                </p>
                <a href="#contacto" className="mt-8 inline-flex rounded-2xl bg-[#0F2A5F] px-7 py-4 text-base font-black text-white transition hover:-translate-y-1 hover:bg-[#123A84]">Solicitar asesoría</a>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {companyServices.map((service) => (
                  <div key={service.title} className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm ring-1 ring-slate-100"><LandingIcon icon={service.icon} size={22} /></div>
                    <p className="text-lg font-black text-slate-950">{service.title}</p>
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{service.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="producto" className="px-4 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">Producto principal</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950 md:text-6xl">
                Super Gods App
              </h2>
              <p className="mt-5 text-lg font-medium leading-8 text-slate-600">
                Plataforma digital creada por Gods Technologies S.A.C. para gestionar reservas, caja, clientes, profesionales, productos, puntos, promociones y reportes desde una sola solución.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.07)] transition hover:-translate-y-1 hover:border-blue-200">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100"><LandingIcon icon={feature.icon} /></div>
                  <h3 className="mt-5 text-xl font-black text-slate-950">{feature.title}</h3>
                  <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="capturas" className="px-4 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">En acción</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950 md:text-6xl">Diseñado para entender tu negocio rápido</h2>
              <p className="mt-5 text-lg font-medium leading-8 text-slate-600">Pantallas pensadas para que el dueño pueda revisar operación, ventas y rendimiento de forma simple.</p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              {screenshots.map((shot, index) => (
                <div key={shot.title} className={index === 0 ? 'lg:col-span-2' : ''}>
                  <div className="overflow-hidden rounded-[34px] border border-slate-200 bg-white p-4 shadow-[0_28px_80px_rgba(15,23,42,0.10)]">
                    <img src={shot.image} alt={shot.title} className="w-full rounded-[26px] object-cover" />
                    <div className="p-4">
                      <h3 className="text-2xl font-black text-slate-950">{shot.title}</h3>
                      <p className="mt-2 font-medium leading-7 text-slate-600">{shot.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-20">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
            <div className="rounded-[36px] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-900/20 md:p-10">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-300">Antes</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] md:text-5xl">Reservas por WhatsApp, caja manual y clientes sin seguimiento</h2>
              <div className="mt-8 grid gap-4">
                <PainItem text="Mensajes desordenados para reservar citas." />
                <PainItem text="No sabes exactamente cuánto quedó en caja." />
                <PainItem text="No hay control claro de puntos, premios o promociones." />
                <PainItem text="Difícil saber qué profesional vendió más." />
              </div>
            </div>

            <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/80 md:p-10">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">Con Super Gods</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-slate-950 md:text-5xl">Control real para crecer con orden</h2>
              <div className="mt-8 grid gap-4">
                <GoodItem text="Agenda online por sede, horario, servicio y profesional." />
                <GoodItem text="Caja separada por efectivo, Yape, Plin y tarjeta." />
                <GoodItem text="Clientes con puntos, historial y recompensas." />
                <GoodItem text="Reportes para tomar mejores decisiones." />
              </div>
            </div>
          </div>
        </section>

        <section id="ia" className="px-4 py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-10 rounded-[40px] bg-gradient-to-br from-[#0F2A5F] to-[#07152F] p-8 text-white shadow-[0_40px_100px_rgba(15,42,95,0.35)] md:p-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-200">Gods AI</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] md:text-6xl">Inteligencia artificial para experiencias premium</h2>
              <p className="mt-5 text-lg font-medium leading-8 text-blue-100">Desarrollamos herramientas con IA para asesoramiento personalizado, recomendaciones visuales y experiencias innovadoras dentro del negocio.</p>
              <a href="#contacto" className="mt-8 inline-flex rounded-2xl bg-white px-7 py-4 text-base font-black text-[#0F2A5F] transition hover:-translate-y-1">Solicitar demo Gods AI</a>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <AiBox title="Análisis facial" text="Detecta forma de rostro y características clave." />
              <AiBox title="Recomendaciones" text="Sugiere estilos según rostro, servicio y preferencias." />
              <AiBox title="Vista ilustrativa" text="Muestra una idea visual del resultado." />
              <AiBox title="Diferenciación" text="Ideal para negocios que buscan una experiencia premium." />
            </div>
          </div>
        </section>

        <section id="planes" className="px-4 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">Planes</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950 md:text-6xl">Planes simples para empezar rápido</h2>
              <p className="mt-5 text-lg font-medium leading-8 text-slate-600">Empieza con una prueba gratis y luego elige el plan ideal para tu negocio.</p>
            </div>

            <div className="mx-auto mt-8 flex max-w-md items-center gap-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-200/70">
              <span className="pl-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">Pais</span>
              <select
                value={pricingCountry}
                onChange={(event) => setPricingCountry(event.target.value)}
                className="h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {COUNTRY_PRICE_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label} ({option.currency})
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {plans.map((plan) => (
                <div key={plan.name} className={plan.highlighted ? 'rounded-[34px] bg-[#0F2A5F] p-7 text-white shadow-[0_30px_90px_rgba(15,42,95,0.35)]' : 'rounded-[34px] border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/70'}>
                  <div className={plan.highlighted ? 'inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-black text-blue-100' : 'inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700'}>{plan.badge}</div>
                  <h3 className="mt-6 text-2xl font-black">{plan.name}</h3>
                  <div className="mt-4 flex items-end gap-2">
                    <p className="text-5xl font-black tracking-tight">{plan.price}</p>
                    <p className={plan.highlighted ? 'mb-2 font-bold text-blue-100' : 'mb-2 font-bold text-slate-500'}>/ mes</p>
                  </div>
                  <p className={plan.highlighted ? 'mt-4 font-medium leading-7 text-blue-100' : 'mt-4 font-medium leading-7 text-slate-600'}>{plan.description}</p>
                  <div className="mt-7 grid gap-3">
                    {plan.items.map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <span className={plan.highlighted ? 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-[#0F2A5F]' : 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-black text-green-700'}>✓</span>
                        <span className="text-sm font-bold">{item}</span>
                      </div>
                    ))}
                  </div>
                  <a href="/registro-negocio" className={plan.highlighted ? 'mt-8 inline-flex w-full justify-center rounded-2xl bg-white px-6 py-4 text-sm font-black text-[#0F2A5F] transition hover:-translate-y-1' : 'mt-8 inline-flex w-full justify-center rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-[#0F2A5F]'}>Probar gratis</a>
                </div>
              ))}
            </div>

            <p className="mt-6 text-center text-sm font-semibold text-slate-500">Precio de lanzamiento · 10% de descuento pagando 6 meses · 20% de descuento pagando anual.</p>
            <p className="mx-auto mt-3 max-w-3xl text-center text-xs font-semibold leading-6 text-slate-400">
              En Peru el pago se gestiona de forma local. Para otros paises, el cobro internacional se procesa con Paddle y el monto final puede variar levemente por conversion de moneda, impuestos o comisiones del medio de pago.
            </p>
          </div>
        </section>

        <section id="preguntas" className="px-4 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">Preguntas frecuentes</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950 md:text-6xl">
                Lo que suele preguntar un dueño antes de probar
              </h2>
              <p className="mt-5 text-lg font-medium leading-8 text-slate-600">
                Respuestas claras para decidir si Super Gods App encaja con tu operación.
              </p>
            </div>

            <div className="mt-10 grid gap-4">
              {faqItems.map((item) => (
                <details key={item.question} className="group rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-black text-slate-950">
                    {item.question}
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-slate-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="contacto" className="px-4 py-20">
          <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[42px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.12)] lg:grid-cols-[0.92fr_1.08fr]">
            <div className="relative bg-slate-950 p-8 text-white md:p-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#2563EB_0,transparent_36%),radial-gradient(circle_at_90%_20%,rgba(34,197,94,0.20),transparent_30%)]" />

              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-200">
                    Demo personalizada
                  </p>

                  <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] md:text-6xl">
                    Cuéntanos cómo trabaja tu negocio y te mostramos el plan ideal
                  </h2>

                  <p className="mt-5 text-lg font-medium leading-8 text-blue-100">
                    Completa tus datos y revisaremos tu negocio para activar una demo gratis de 7 días. Si todo está correcto, te enviaremos los accesos por WhatsApp o correo.
                  </p>
                </div>

                <div className="mt-10 grid gap-4">
                  <InfoLine text="Demo personalizada según tu rubro." />
                  <InfoLine text="Prueba gratis por 7 días." />
                  <InfoLine text="Soporte inicial para configurar sedes, profesionales, servicios y horarios." />
                  <InfoLine text="Acceso desde Android, iPhone y panel web." />
                </div>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-10 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 text-base font-black text-slate-950 transition hover:-translate-y-1 hover:bg-emerald-400"
                >
                  <MessageCircle size={19} strokeWidth={2.8} />
                  Quiero ayuda por WhatsApp
                </a>
              </div>
            </div>

            <ContactLeadBox whatsappNumber={WHATSAPP_NUMBER} />
          </div>
        </section>

        <section className="px-4 pb-20">
          <div className="mx-auto max-w-7xl rounded-[40px] bg-slate-950 px-8 py-14 text-center text-white shadow-[0_35px_100px_rgba(15,23,42,0.25)]">
            <h2 className="mx-auto max-w-3xl text-4xl font-black tracking-[-0.05em] md:text-6xl">Más orden. Más control. Más clientes.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-8 text-slate-300">Activa tu prueba gratis, recibe soporte y empieza a probar reservas, caja, clientes, puntos y reportes.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a href="/registro-negocio" className="rounded-2xl bg-white px-7 py-4 text-base font-black text-slate-950 transition hover:-translate-y-1">Crear cuenta gratis</a>
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-7 py-4 text-base font-black text-slate-950 transition hover:-translate-y-1 hover:bg-emerald-400">
                <MessageCircle size={18} strokeWidth={2.7} />
                Hablar por WhatsApp
              </a>
              <a href="/login" className="rounded-2xl border border-white/30 px-7 py-4 text-base font-black text-white transition hover:-translate-y-1 hover:bg-white/10">Iniciar sesión</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center">
            <img src="/logo-super-gods.png" alt="Gods Technologies S.A.C." className="h-12 w-auto object-contain" />
          </div>
          <div className="flex flex-wrap gap-5 text-sm font-bold text-slate-500">
            <a href="/" className="hover:text-blue-700">Inicio</a>
            <a href="/soporte" className="hover:text-blue-700">Soporte</a>
            <a href="/terms" className="hover:text-blue-700">Terminos</a>
            <a href="/privacy" className="hover:text-blue-700">Privacidad</a>
            <a href="/refund" className="hover:text-blue-700">Reembolsos</a>
            <a href="/datos" className="hover:text-blue-700">Datos</a>
            <a href="/login" className="hover:text-blue-700">Login</a>
          </div>
        </div>
      </footer>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Hablar por WhatsApp"
        className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_18px_45px_rgba(16,185,129,0.42)] ring-4 ring-white transition hover:-translate-y-1 hover:bg-emerald-600 md:bottom-7 md:right-7 md:h-16 md:w-16"
      >
        <MessageCircle size={28} strokeWidth={2.7} />
      </a>
    </div>
  );
}

function PublicBusinessSignupPage() {
  return (
    <div className="min-h-screen bg-[#F6F7FB] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3">
            <img src="/logo-super-gods.png" alt="Super Gods App" className="h-12 w-12 rounded-2xl object-contain shadow-sm" />
            <div>
              <p className="text-lg font-black leading-5 tracking-[-0.03em]">Super Gods App</p>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Registro de negocio</p>
            </div>
          </a>
          <a
            href="/login"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:border-blue-600 hover:text-blue-700"
          >
            Iniciar sesion
          </a>
        </div>
      </header>

      <main className="px-4 py-10">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[42px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.12)] lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="relative bg-slate-950 p-8 text-white md:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#2563EB_0,transparent_35%),radial-gradient(circle_at_90%_18%,rgba(34,197,94,0.22),transparent_28%)]" />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-200">
                  Prueba gratis 7 dias
                </p>
                <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] md:text-6xl">
                  Crea tu negocio y entra al panel en minutos
                </h1>
                <p className="mt-5 text-lg font-medium leading-8 text-blue-100">
                  Registra tu negocio, activa un trial Starter y configura servicios, profesionales, horarios, caja, puntos y reservas desde web o movil.
                </p>
              </div>

              <div className="mt-10 grid gap-4">
                <InfoLine text="Sin tarjeta para iniciar la prueba." />
                <InfoLine text="Tenant, sede principal, usuario owner y moneda se crean automaticamente." />
                <InfoLine text="Despues puedes vincular Gmail e iniciar sesion con un clic." />
                <InfoLine text="Pago automatico internacional disponible al renovar." />
              </div>
            </div>
          </aside>

          <ContactLeadBox whatsappNumber={WHATSAPP_NUMBER} autoActivate />
        </div>
      </main>
    </div>
  );
}

function LandingIcon({ icon, size = 24 }) {
  const IconComponent = icon;
  return <IconComponent size={size} strokeWidth={2.6} />;
}

function HeroSignal({ icon, title, text }) {
  const IconComponent = icon;
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
          <IconComponent size={17} strokeWidth={2.6} />
        </span>
        <p className="text-sm font-black text-slate-950">{title}</p>
      </div>
      <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{text}</p>
    </div>
  );
}

function VerticalMarketCard({ item }) {
  return (
    <article className="group overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:border-blue-200">
      <div className="relative h-48 overflow-hidden bg-slate-100">
        <img src={item.image} alt={`${item.title} con Super Gods App`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
        <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 text-xs font-black text-slate-950 shadow-lg">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <LandingIcon icon={item.icon} size={16} />
          </span>
          {item.stat}
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-2xl font-black tracking-[-0.03em] text-slate-950">{item.title}</h3>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{item.text}</p>
      </div>
    </article>
  );
}

function AppStep({ number, title, text }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-black text-blue-700 shadow-sm">
        {number}
      </span>
      <p className="mt-3 text-sm font-black text-slate-950">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{text}</p>
    </div>
  );
}

function MetricCard({ value, label }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <p className="text-3xl font-black tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm font-bold text-slate-500">{label}</p>
    </div>
  );
}

function PainItem({ text }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-4">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500 text-sm font-black text-white">×</span>
      <p className="font-bold leading-7 text-slate-200">{text}</p>
    </div>
  );
}

function GoodItem({ text }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-500 text-sm font-black text-white">✓</span>
      <p className="font-bold leading-7 text-slate-700">{text}</p>
    </div>
  );
}

function AiBox({ title, text }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/10 p-6 backdrop-blur">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl">⚡</div>
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-3 text-sm font-medium leading-6 text-blue-100">{text}</p>
    </div>
  );
}

function InfoLine({ text }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-4">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-400 text-sm font-black text-slate-950">✓</span>
      <p className="font-bold leading-7 text-blue-100">{text}</p>
    </div>
  );
}
function ContactLeadBox({ whatsappNumber, autoActivate = false }) {
  const initialLead = {
    nombre: '',
    negocio: '',
    businessType: 'BARBERSHOP',
    email: '',
    whatsapp: '',
    password: '',
    confirmPassword: '',
    country: 'Perú',
    city: '',
    profesionales: '',
    sedes: '',
    socialLink: '',
    googleMapsLink: '',
    objetivo: '',
    mensaje: '',
  };

  const businessTypeOptions = [
    { value: 'BARBERSHOP', label: 'Barbería' },
    { value: 'BEAUTY_SALON', label: 'Salón de belleza' },
    { value: 'SPA', label: 'Spa / estética' },
    { value: 'TATTOO_STUDIO', label: 'Tattoo studio' },
    { value: 'NAILS', label: 'Uñas / nails' },
    { value: 'BROWS_LASHES', label: 'Cejas y pestañas' },
    { value: 'HAIR_SALON', label: 'Peluquería' },
    { value: 'OTHER', label: 'Otro rubro' },
  ];

  const [lead, setLead] = useState(initialLead);

  const businessTypeLabel =
    businessTypeOptions.find((option) => option.value === lead.businessType)?.label ||
    'Barbería';
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activation, setActivation] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeExternalSession } = useAuth();
  const googleSignupToken = searchParams.get('googleSignupToken') || '';
  const googleProfile = googleSignupToken
    ? {
        token: googleSignupToken,
        email: searchParams.get('googleEmail') || '',
        name: searchParams.get('googleName') || '',
        picture: searchParams.get('googlePicture') || '',
      }
    : null;

  useEffect(() => {
    if (!autoActivate || !googleProfile) return;

    setLead((prev) => ({
      ...prev,
      nombre: prev.nombre || googleProfile.name,
      email: googleProfile.email || prev.email,
    }));
  }, [autoActivate, googleProfile?.email, googleProfile?.name, googleSignupToken]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setLead((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const whatsappText = encodeURIComponent(
    `Hola, quiero una demo gratis de Super Gods App.\n\n` +
      `Nombre: ${lead.nombre || '___'}\n` +
      `Negocio: ${lead.negocio || '___'}\n` +
      `Tipo de negocio: ${businessTypeLabel || '___'}\n` +
      `Correo: ${lead.email || '___'}\n` +
      `Ciudad / país: ${lead.city || '___'}, ${lead.country || '___'}\n` +
      `WhatsApp: ${lead.whatsapp || '___'}\n` +
      `Profesionales: ${lead.profesionales || '___'}\n` +
      `Sedes: ${lead.sedes || '___'}\n` +
      `Red social / web: ${lead.socialLink || '___'}\n` +
      `Google Maps: ${lead.googleMapsLink || '___'}\n` +
      `Quiero mejorar: ${lead.objetivo || '___'}\n` +
      `Mensaje: ${lead.mensaje || '___'}`
  );

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappText}`;

  const validate = () => {
    if (!lead.nombre.trim()) return 'Ingresa el nombre del dueño.';
    if (!lead.negocio.trim()) return 'Ingresa el nombre del negocio.';
    if (!lead.email.trim() || !lead.email.includes('@')) return 'Ingresa un correo válido.';
    if (!lead.whatsapp.trim()) return 'Ingresa el WhatsApp del dueño.';
    if (autoActivate && lead.password.trim().length < 6) return 'Crea una contrasena de al menos 6 caracteres.';
    if (autoActivate && lead.password !== lead.confirmPassword) return 'Las contrasenas no coinciden.';
    if (!lead.city.trim()) return 'Ingresa la ciudad.';
    if (!lead.country.trim()) return 'Ingresa el país.';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setSuccess(false);
      return;
    }

    const payload = {
      businessName: lead.negocio.trim(),
      businessType: lead.businessType || 'BARBERSHOP',
      ownerName: lead.nombre.trim(),
      ownerEmail: lead.email.trim().toLowerCase(),
      ownerPhone: lead.whatsapp.trim(),
      password: autoActivate ? lead.password.trim() : null,
      country: lead.country.trim(),
      city: lead.city.trim(),
      branchesCount: parseCount(lead.sedes),
      professionalsCount: parseCount(lead.profesionales),
      socialLink: lead.socialLink.trim(),
      googleMapsLink: lead.googleMapsLink.trim(),
      message: buildLeadMessage(lead, businessTypeLabel),
      googleSignupToken: googleProfile?.token || null,
    };

    try {
      setSaving(true);
      setError('');
      setSuccess(false);
      setActivation(null);

      const response = autoActivate
        ? await demoRequestApi.activatePublicTrial(payload)
        : await demoRequestApi.createPublicRequest(payload);

      setActivation(response);
      setSuccess(true);

      if (autoActivate && response?.session) {
        completeExternalSession(response.session);
        setTimeout(() => {
          navigate('/owner/dashboard', { replace: true });
        }, 800);
      }
    } catch (e) {
      setError(e.message || 'No se pudo enviar la solicitud. Inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 md:p-12">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
        {autoActivate ? 'Crea tu cuenta' : 'Solicita tu demo'}
      </p>

      <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">
        {autoActivate ? 'Activa tu prueba gratis' : 'Activa tu demo gratis'}
      </h2>

      <p className="mt-4 font-medium leading-7 text-slate-600">
        {autoActivate
          ? 'Continua con Google, completa los datos de tu negocio y crearemos una cuenta Starter de prueba por 7 dias.'
          : 'Completa los datos de tu negocio. Revisaremos tu solicitud y, si todo esta correcto, activaremos tu cuenta demo por 7 dias.'}
      </p>

      {autoActivate && (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          {googleProfile ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {googleProfile.picture ? (
                  <img
                    src={googleProfile.picture}
                    alt={googleProfile.name || googleProfile.email}
                    className="h-12 w-12 rounded-2xl object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-black text-slate-950 shadow-sm">
                    <GoogleLogo className="h-6 w-6" />
                  </span>
                )}
                <div>
                  <p className="text-sm font-black text-slate-950">
                    Gmail verificado
                  </p>
                  <p className="text-xs font-bold text-slate-500">
                    {googleProfile.email}
                  </p>
                </div>
              </div>
              <span className="rounded-2xl bg-emerald-100 px-4 py-2 text-xs font-black text-emerald-800">
                Se vinculara al crear la cuenta
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-slate-950">
                  Registro recomendado con Google
                </p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                  Usaremos tu Gmail verificado para crear el dueño y permitir ingreso con un clic.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  window.location.href = googleSignupUrl();
                }}
                className="inline-flex items-center justify-center gap-3 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#0F2A5F]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-black text-slate-950">
                  <GoogleLogo className="h-4 w-4" />
                </span>
                Registrarme con Google
              </button>
            </div>
          )}
        </div>
      )}

      {success && (
        <div className="mt-6 rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-emerald-900">
          <h3 className="text-xl font-black">
            {autoActivate ? 'Cuenta creada correctamente' : 'Solicitud enviada correctamente'}
          </h3>
          <p className="mt-2 text-sm font-bold leading-6">
            {autoActivate
              ? `Tu prueba de ${activation?.trialDays || 7} dias esta activa. Ya puedes entrar al panel web y terminar la configuracion.`
              : 'Revisaremos los datos de tu negocio. Si es aprobada, recibiras tus accesos por WhatsApp o correo.'}
          </p>
          <div className="hidden">
            Acceso: {activation?.accessEmail || lead.email.trim().toLowerCase()} · clave temporal: {activation?.temporaryPassword || '123456'}
          </div>
          {autoActivate && (
            <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-black text-slate-800">
              Acceso: {activation?.accessEmail || lead.email.trim().toLowerCase()} · entra con la contrasena que acabas de crear.
            </div>
          )}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <a
              href="/login"
              className="inline-flex justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
            >
              Entrar al panel
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex justify-center rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-800 transition hover:border-emerald-400"
            >
              Pedir ayuda por WhatsApp
            </a>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-black text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <LandingInput
            label="Nombre del dueño"
            name="nombre"
            value={lead.nombre}
            onChange={handleChange}
            placeholder="Ej: Pedro"
          />

          <LandingInput
            label="Nombre del negocio"
            name="negocio"
            value={lead.negocio}
            onChange={handleChange}
            placeholder="Ej: Studio Beauty Gods"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <LandingSelect
            label="Rubro del negocio"
            name="businessType"
            value={lead.businessType}
            onChange={handleChange}
            options={businessTypeOptions}
          />

          <LandingInput
            label="Correo"
            name="email"
            type="email"
            value={lead.email}
            onChange={handleChange}
            placeholder="Ej: dueño@negocio.com"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <LandingInput
            label="WhatsApp"
            name="whatsapp"
            value={lead.whatsapp}
            onChange={handleChange}
            placeholder="Ej: 987654321"
          />

          <LandingInput
            label="País"
            name="country"
            value={lead.country}
            onChange={handleChange}
            placeholder="Ej: Perú"
          />
        </div>

        {autoActivate && (
          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-black text-slate-950">
              Crea tu contrasena de acceso
            </p>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
              La usaras para entrar al panel web junto con tu correo. No se mostrara ni se enviara por WhatsApp.
            </p>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <LandingInput
                label="Contrasena"
                name="password"
                type="password"
                value={lead.password}
                onChange={handleChange}
                placeholder="Minimo 6 caracteres"
              />
              <LandingInput
                label="Confirmar contrasena"
                name="confirmPassword"
                type="password"
                value={lead.confirmPassword}
                onChange={handleChange}
                placeholder="Repite tu contrasena"
              />
            </div>
          </div>
        )}

        <LandingInput
          label="Ciudad"
          name="city"
          value={lead.city}
          onChange={handleChange}
          placeholder="Ej: Cusco"
        />

        <div className="grid gap-5 md:grid-cols-2">
          <LandingSelect
            label="Cantidad de profesionales"
            name="profesionales"
            value={lead.profesionales}
            onChange={handleChange}
            options={[
              '1 profesional',
              '2 profesionales',
              '3 a 5 profesionales',
              '6 a 10 profesionales',
              'Más de 10 profesionales',
            ]}
          />

          <LandingSelect
            label="Cantidad de sedes"
            name="sedes"
            value={lead.sedes}
            onChange={handleChange}
            options={[
              '1 sede',
              '2 sedes',
              '3 sedes',
              'Más de 3 sedes',
            ]}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <LandingInput
            label="Instagram / Facebook / TikTok"
            name="socialLink"
            value={lead.socialLink}
            onChange={handleChange}
            placeholder="Link de red social o web"
          />

          <LandingInput
            label="Google Maps"
            name="googleMapsLink"
            value={lead.googleMapsLink}
            onChange={handleChange}
            placeholder="Link de Google Maps, opcional"
          />
        </div>

        <LandingSelect
          label="¿Qué quieres mejorar primero?"
          name="objetivo"
          value={lead.objetivo}
          onChange={handleChange}
          options={[
            'Ordenar reservas',
            'Controlar caja',
            'Fidelizar clientes con puntos',
            'Crear promociones y premios',
            'Controlar profesionales y pagos',
            'Controlar productos e inventario',
            'Ver reportes del negocio',
            'Probar Super Gods completo',
          ]}
        />

        <label className="grid gap-2">
          <span className="text-sm font-black text-slate-900">
            ¿Qué quieres mejorar con Super Gods?
          </span>

          <textarea
            name="mensaje"
            value={lead.mensaje}
            onChange={handleChange}
            rows={4}
            placeholder="Ej: Quiero ordenar mis reservas, caja, clientes y pagos a profesionales."
            className="resize-none rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="mt-8 w-full rounded-2xl bg-[#0F2A5F] px-7 py-4 text-base font-black text-white shadow-xl shadow-blue-900/20 transition hover:-translate-y-1 hover:bg-[#123A84] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving
          ? (autoActivate ? 'Creando cuenta...' : 'Enviando solicitud...')
          : (autoActivate ? 'Crear mi cuenta gratis' : 'Enviar solicitud de demo')}
      </button>

      <a
        href="/login"
        className="mt-4 flex w-full justify-center rounded-2xl border border-slate-200 bg-slate-50 px-7 py-4 text-base font-black text-slate-950 transition hover:border-blue-600 hover:text-blue-700"
      >
        Ya tengo cuenta, iniciar sesión
      </a>

      <p className="mt-4 text-center text-xs font-semibold leading-5 text-slate-500">
        {autoActivate
          ? 'No necesitas tarjeta para iniciar. Al terminar la prueba podras renovar tu plan desde el panel.'
          : 'No necesitas tarjeta. Primero revisamos tu solicitud para activar una demo real de Super Gods App.'}
      </p>
    </form>
  );
}

function parseCount(value) {
  const text = String(value || '').toLowerCase();

  if (!text.trim()) return null;
  if (text.includes('más de 10')) return 11;
  if (text.includes('más de 3')) return 4;
  if (text.includes('6 a 10')) return 6;
  if (text.includes('3 a 5')) return 3;

  const match = text.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function buildLeadMessage(lead, businessTypeLabel) {
  const parts = [
    lead.objetivo ? `Quiere mejorar: ${lead.objetivo}` : null,
    lead.mensaje ? `Mensaje: ${lead.mensaje}` : null,
    lead.socialLink ? `Red social / web: ${lead.socialLink}` : null,
    lead.googleMapsLink ? `Google Maps: ${lead.googleMapsLink}` : null,
    businessTypeLabel ? `Rubro: ${businessTypeLabel}` : null,
  ];

  return parts.filter(Boolean).join(' | ');
}

function LandingInput({ label, name, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-slate-900">{label}</span>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-base font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function LandingSelect({ label, name, value, onChange, options }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-slate-900">{label}</span>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-base font-bold text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      >
        <option value="">Seleccionar</option>
        {options.map((option) => {
          const value = typeof option === 'string' ? option : option.value;
          const label = typeof option === 'string' ? option : option.label;

          return (
            <option key={value} value={value}>
              {label}
            </option>
          );
        })}
      </select>
    </label>
  );
}

const LEGAL_PAGES = {
  privacy: {
    title: 'Politica de Privacidad',
    updatedAt: '25 de mayo de 2026',
    intro:
      'Esta politica explica como Gods Technologies S.A.C. trata la informacion relacionada con Super Gods App, una plataforma SaaS para gestion de negocios de belleza, barberias y servicios.',
    sections: [
      {
        title: 'Informacion que recopilamos',
        body:
          'Podemos recopilar datos de cuenta, datos de negocio, datos de contacto, informacion de clientes registrada por los negocios, reservas, ventas, inventario, reportes operativos y datos tecnicos necesarios para operar la plataforma.',
      },
      {
        title: 'Uso de la informacion',
        body:
          'Usamos la informacion para prestar el servicio, gestionar suscripciones, brindar soporte, mejorar la plataforma, prevenir fraude, mantener seguridad y cumplir obligaciones legales aplicables.',
      },
      {
        title: 'Procesadores y proveedores',
        body:
          'Podemos utilizar proveedores de infraestructura, analitica, comunicaciones y pagos. Para pagos internacionales, Paddle puede procesar informacion de pago como Merchant of Record conforme a sus propias politicas.',
      },
      {
        title: 'Conservacion y seguridad',
        body:
          'Conservamos la informacion mientras sea necesaria para prestar el servicio o cumplir obligaciones legales. Aplicamos medidas razonables de seguridad para proteger la informacion contra acceso no autorizado.',
      },
      {
        title: 'Derechos y contacto',
        body:
          'Puedes solicitar acceso, correccion o eliminacion de datos escribiendo a derwinnieves659@gmail.com. Algunas solicitudes pueden estar sujetas a verificaciones o restricciones legales.',
      },
    ],
  },
  terms: {
    title: 'Terminos de Servicio',
    updatedAt: '25 de mayo de 2026',
    intro:
      'Estos terminos regulan el uso de Super Gods App, software ofrecido por Gods Technologies S.A.C. para administracion de reservas, caja, clientes, puntos, promociones, inventario, reportes y funciones relacionadas.',
    sections: [
      {
        title: 'Servicio',
        body:
          'Super Gods App es una plataforma SaaS por suscripcion. El acceso puede incluir panel web, aplicaciones moviles, soporte y modulos segun el plan contratado.',
      },
      {
        title: 'Cuenta y uso aceptable',
        body:
          'El usuario es responsable de mantener sus credenciales seguras y de usar la plataforma de forma legal. No se permite usar el servicio para actividades fraudulentas, ilegales, abusivas o que afecten la disponibilidad de la plataforma.',
      },
      {
        title: 'Suscripciones y pagos',
        body:
          'Los planes pueden cobrarse de forma mensual, semestral o anual segun disponibilidad. En Peru pueden existir pagos manuales locales; para pagos internacionales podemos usar Paddle u otros proveedores autorizados.',
      },
      {
        title: 'Disponibilidad y cambios',
        body:
          'Trabajamos para mantener el servicio disponible, pero pueden existir mantenimientos, fallas externas o interrupciones. Podemos mejorar, cambiar o retirar funciones para mantener la seguridad y evolucion del producto.',
      },
      {
        title: 'Limitacion de responsabilidad',
        body:
          'El servicio se ofrece como herramienta operativa. El negocio usuario es responsable de validar sus registros, reportes, impuestos, operaciones comerciales y decisiones tomadas con base en la plataforma.',
      },
    ],
  },
  refund: {
    title: 'Politica de Reembolsos y Cancelacion',
    updatedAt: '25 de mayo de 2026',
    intro:
      'Esta politica describe como gestionamos cancelaciones y reembolsos de suscripciones de Super Gods App.',
    sections: [
      {
        title: 'Prueba y suscripcion',
        body:
          'Cuando exista prueba gratis, el cliente puede evaluar el servicio antes del primer cobro. Al continuar con una suscripcion de pago, el acceso se mantiene durante el periodo contratado.',
      },
      {
        title: 'Cancelaciones',
        body:
          'El cliente puede solicitar la cancelacion de la renovacion futura. La cancelacion no elimina automaticamente obligaciones pendientes ni pagos ya procesados por periodos consumidos.',
      },
      {
        title: 'Reembolsos',
        body:
          'Los pagos de suscripcion generalmente no son reembolsables una vez iniciado el periodo de servicio, salvo errores de cobro, duplicidad, imposibilidad tecnica comprobada o requerimientos legales aplicables.',
      },
      {
        title: 'Pagos internacionales',
        body:
          'Los pagos internacionales procesados por Paddle pueden estar sujetos a politicas, impuestos y procedimientos de Paddle. Algunas solicitudes de reembolso podrian gestionarse mediante el proveedor de pago.',
      },
      {
        title: 'Contacto',
        body:
          'Para solicitar revision de un pago o cancelacion, escribe a derwinnieves659@gmail.com con el nombre del negocio, correo de cuenta y detalle de la solicitud.',
      },
    ],
  },
};

function LegalPage({ type }) {
  const page = LEGAL_PAGES[type] || LEGAL_PAGES.privacy;

  return (
    <div className="min-h-screen bg-[#F5F7FB] px-6 py-16 text-slate-950">
      <article className="mx-auto max-w-4xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
        <div className="flex items-center gap-3">
          <img src="/gods-technologies-logo-horizontal.png" alt="Gods Technologies S.A.C." className="h-12 w-auto object-contain" />
          <div>
            <p className="text-lg font-black text-slate-950">Gods Technologies S.A.C.</p>
            <p className="text-sm font-semibold text-slate-500">Super Gods App</p>
          </div>
        </div>

        <h1 className="mt-10 text-4xl font-black tracking-[-0.04em] text-slate-950">{page.title}</h1>
        <p className="mt-2 text-sm font-bold text-slate-400">Ultima actualizacion: {page.updatedAt}</p>
        <p className="mt-5 text-base font-semibold leading-8 text-slate-600">{page.intro}</p>

        <div className="mt-8 grid gap-6">
          {page.sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <h2 className="text-lg font-black text-slate-950">{section.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-7 text-slate-600">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm font-semibold leading-7 text-blue-900">
          Contacto legal y soporte: derwinnieves659@gmail.com
        </div>

        <a href="/" className="mt-8 inline-flex rounded-2xl bg-[#0F2A5F] px-5 py-3 font-black text-white">Volver al inicio</a>
      </article>
    </div>
  );
}

function PublicAppDownloadPage() {
  const androidUrl = import.meta.env.VITE_ANDROID_APP_URL || 'https://play.google.com/store/apps/details?id=com.gods.barberia';
  const iosUrl = import.meta.env.VITE_IOS_APP_URL || buildWhatsAppUrl(
    'Hola, quiero descargar la app movil de Super Gods para iPhone.'
  );

  return (
    <div className="min-h-screen bg-[#F5F7FB] px-6 py-12 text-slate-950">
      <main className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_0.86fr] lg:items-center">
        <section className="rounded-[34px] border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/70 md:p-10">
          <div className="flex items-center gap-3">
            <img
              src="/logo-super-gods.png"
              alt="Super Gods App"
              className="h-14 w-14 rounded-2xl object-cover shadow-sm"
            />
            <div>
              <p className="text-lg font-black leading-tight text-slate-950">Super Gods App</p>
              <p className="text-sm font-bold text-slate-500">Clientes, puntos, premios y reservas</p>
            </div>
          </div>

          <h1 className="mt-10 max-w-3xl text-4xl font-black leading-[1.02] tracking-[-0.04em] text-slate-950 md:text-6xl">
            Lleva tus puntos y reservas en el celular
          </h1>

          <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-slate-600 md:text-lg">
            Desde la app podras revisar tus puntos, ver premios disponibles, reservar tu proxima cita y recibir beneficios del negocio donde te atiendes.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <a
              href={androidUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-3 rounded-2xl bg-[#111827] px-5 py-4 text-sm font-black text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5"
            >
              <Smartphone size={19} strokeWidth={2.7} />
              Descargar para Android
            </a>
            <a
              href={iosUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:border-blue-400"
            >
              <Smartphone size={19} strokeWidth={2.7} />
              Descargar para iPhone
            </a>
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-900">
            Si el enlace de tienda aun no esta disponible, te atenderemos por WhatsApp y te enviaremos el acceso correcto para tu pais.
          </div>
        </section>

        <section className="rounded-[34px] bg-[#0F172A] p-7 text-white shadow-2xl shadow-slate-900/20 md:p-10">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <QrCode size={26} strokeWidth={2.5} />
          </div>
          <h2 className="mt-7 text-3xl font-black tracking-[-0.03em]">Que podras hacer</h2>
          <div className="mt-7 grid gap-4">
            {[
              'Ver tus puntos disponibles y movimientos.',
              'Canjear premios y beneficios del negocio.',
              'Reservar una cita sin escribir por WhatsApp.',
              'Recibir recordatorios y promociones relevantes.',
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl bg-white/8 p-4">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={20} />
                <p className="text-sm font-bold leading-6 text-white/85">{item}</p>
              </div>
            ))}
          </div>
          <a
            href="/"
            className="mt-8 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5"
          >
            Volver al inicio
          </a>
        </section>
      </main>
    </div>
  );
}

function SimplePublicPage({ title }) {
  return (
    <div className="min-h-screen bg-[#F5F7FB] px-6 py-16 text-slate-950">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
        <div className="flex items-center gap-3">
          <img src="/gods-technologies-logo-horizontal.png" alt="Gods Technologies S.A.C." className="h-12 w-auto object-contain" />
          <div>
            <p className="text-lg font-black text-slate-950">Gods Technologies S.A.C.</p>
            <p className="text-sm font-semibold text-slate-500">Empresa creadora de Super Gods App</p>
          </div>
        </div>
        <h1 className="mt-10 text-4xl font-black tracking-[-0.04em] text-slate-950">{title}</h1>
        <p className="mt-4 text-slate-600">Página pública de Gods Technologies S.A.C. y Super Gods App. Aquí agregaremos el contenido legal o de soporte correspondiente.</p>
        <a href="/" className="mt-8 inline-flex rounded-2xl bg-[#0F2A5F] px-5 py-3 font-black text-white">Volver al inicio</a>
      </div>
    </div>
  );
}

function PlaceholderPage({ title }) {
  return (
    <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-black">{title}</h2>
      <p className="mt-2 text-neutral-500">Módulo preparado. Aquí conectaremos el backend de Super Gods.</p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<PublicHomePage />} />
        <Route path="/registro-negocio" element={<PublicBusinessSignupPage />} />
        <Route path="/demo" element={<PublicBusinessSignupPage />} />
        <Route path="/soporte" element={<SimplePublicPage title="Soporte Super Gods App" />} />
        <Route path="/terms" element={<LegalPage type="terms" />} />
        <Route path="/privacy" element={<LegalPage type="privacy" />} />
        <Route path="/refund" element={<LegalPage type="refund" />} />
        <Route path="/datos" element={<SimplePublicPage title="Opciones de Privacidad y Datos" />} />
        <Route path="/app" element={<PublicAppDownloadPage />} />

        <Route path="/reservar/:codigoNegocio" element={<PublicBookingPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />

        <Route
          path="/owner"
          element={
            <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
              <OwnerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/owner/dashboard" replace />} />
          <Route path="dashboard" element={<OwnerDashboardPage />} />

          <Route
            path="caja"
            element={
              <OwnerPermissionRoute permissions={['CASH_ACCESS']}>
                <OwnerCashPage />
              </OwnerPermissionRoute>
            }
          />

          <Route
            path="agenda"
            element={
              <OwnerPermissionRoute permissions={['AGENDA_ACCESS']}>
                <OwnerAgendaPage />
              </OwnerPermissionRoute>
            }
          />

          <Route
            path="clientes"
            element={
              <OwnerPermissionRoute permissions={['CUSTOMERS_ACCESS']}>
                <OwnerCustomersPage />
              </OwnerPermissionRoute>
            }
          />



          <Route
            path="productos"
            element={
              <OwnerPermissionRoute permissions={['CONFIG_PRODUCTS']}>
                <OwnerProductsPage />
              </OwnerPermissionRoute>
            }
          />

          <Route
            path="servicios"
            element={
              <OwnerPermissionRoute permissions={['CONFIG_SERVICES']}>
                <OwnerServicesPage />
              </OwnerPermissionRoute>
            }
          />

          <Route
            path="barberos"
            element={
              <OwnerPermissionRoute permissions={['CONFIG_BARBERS']}>
                <OwnerBarbersPage />
              </OwnerPermissionRoute>
            }
          />

          <Route
            path="horarios"
            element={
              <OwnerPermissionRoute permissions={['CONFIG_BARBERS']}>
                <OwnerBarberSchedulePage />
              </OwnerPermissionRoute>
            }
          />

          <Route
            path="premios"
            element={
              <OwnerPermissionRoute permissions={['CONFIG_REWARDS']}>
                <OwnerRewardsPage />
              </OwnerPermissionRoute>
            }
          />

          <Route
            path="reservas-pagos"
            element={
              <OwnerPermissionRoute permissions={['CONFIG_PAYMENT_METHODS']}>
                <OwnerReservationSettingsPage />
              </OwnerPermissionRoute>
            }
          />

          <Route
            path="promociones"
            element={
              <OwnerPermissionRoute permissions={['CONFIG_PROMOTIONS']}>
                <OwnerPromotionsPage />
              </OwnerPermissionRoute>
            }
          />

          <Route
            path="sedes"
            element={
              <OwnerPermissionRoute permissions={['CONFIG_BRANCHES']}>
                <OwnerBranchesPage />
              </OwnerPermissionRoute>
            }
          />

          <Route
            path="reportes"
            element={
              <OwnerPermissionRoute permissions={['REPORTS_ACCESS']}>
                <OwnerReportsPage />
              </OwnerPermissionRoute>
            }
          />

          <Route
            path="administradores"
            element={
              <OwnerPermissionRoute ownerOnly>
                <OwnerAdminsPage />
              </OwnerPermissionRoute>
            }
          />

          <Route
            path="ajustar-puntos"
            element={
              <OwnerPermissionRoute permissions={['CUSTOMERS_ACCESS']}>
                <OwnerAdjustPointsPage />
              </OwnerPermissionRoute>
            }
          />

          <Route
            path="puntos-configuracion"
            element={
              <OwnerPermissionRoute permissions={['CONFIG_ACCESS']}>
                <OwnerLoyaltySettingsPage />
              </OwnerPermissionRoute>
            }
          />

          <Route
            path="whatsapp-mensajes"
            element={
              <OwnerPermissionRoute permissions={['CONFIG_ACCESS']}>
                <OwnerWhatsappSettingsPage />
              </OwnerPermissionRoute>
            }
          />

          <Route
            path="marca"
            element={
              <OwnerPermissionRoute permissions={['CONFIG_ACCESS']}>
                <OwnerBrandingPage />
              </OwnerPermissionRoute>
            }
          />

          <Route
            path="seguridad"
            element={
              <OwnerPermissionRoute permissions={['CONFIG_ACCESS']}>
                <OwnerSecurityPage />
              </OwnerPermissionRoute>
            }
          />

          <Route
            path="plan-pagos"
            element={
              <OwnerPermissionRoute ownerOnly>
                <OwnerSubscriptionPage />
              </OwnerPermissionRoute>
            }
          />

          <Route
            path="configuracion"
            element={
              <OwnerPermissionRoute permissions={['CONFIG_ACCESS']}>
                <OwnerConfigPage />
              </OwnerPermissionRoute>
            }
          />
        </Route>
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="caja" element={<PlaceholderPage title="Caja Admin" />} />
          <Route path="agenda" element={<PlaceholderPage title="Agenda Admin" />} />
          <Route path="clientes" element={<OwnerCustomersPage />} />
          <Route path="reportes" element={<PlaceholderPage title="Reportes Admin" />} />
        </Route>

        <Route
          path="/super-admin"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <SuperAdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SuperAdminDashboard />} />
          <Route path="dashboard" element={<Navigate to="/super-admin" replace />} />
          <Route path="barberias" element={<SuperAdminTenants />} />
          <Route path="pagos" element={<SuperAdminPayments />} />
          <Route path="crear-barberia" element={<SuperAdminCreateBarbershop />} />
          <Route path="solicitudes-demo" element={<SuperAdminDemoRequests />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
