import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { demoRequestApi } from './api/demoRequestApi';
import OwnerSecurityPage from './pages/owner/OwnerSecurityPage';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import OwnerPermissionRoute from './routes/OwnerPermissionRoute';
import OwnerAdjustPointsPage from './pages/owner/OwnerAdjustPointsPage';
import LoginPage from './pages/auth/LoginPage';
import OwnerAdminsPage from './pages/owner/OwnerAdminsPage';
import OwnerLayout from './pages/owner/OwnerLayout';
import OwnerDashboardPage from './pages/owner/OwnerDashboardPage';
import OwnerAgendaPage from './pages/owner/OwnerAgendaPage';
import OwnerCustomersPage from './pages/owner/OwnerCustomersPage';
import OwnerCashPage from './pages/owner/OwnerCashPage';
import OwnerProductsPage from './pages/owner/OwnerProductsPage';
import OwnerReportsPage from './pages/owner/OwnerReportsPage';
import OwnerConfigPage from './pages/owner/OwnerConfigPage';
import OwnerServicesPage from './pages/owner/OwnerServicesPage';
import OwnerBranchesPage from './pages/owner/OwnerBranchesPage';
import OwnerRewardsPage from './pages/owner/OwnerRewardsPage';
import OwnerBarbersPage from './pages/owner/OwnerBarbersPage';
import OwnerBarberSchedulePage from './pages/owner/OwnerBarberSchedulePage';
import OwnerReservationSettingsPage from './pages/owner/OwnerReservationSettingsPage';
import OwnerPromotionsPage from './pages/owner/OwnerPromotionsPage';
import OwnerSubscriptionPage from './pages/owner/OwnerSubscriptionPage';

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
    { icon: '✂️', title: 'Barberías', text: 'Reservas, caja, barberos, puntos, promociones, pagos y reportes.' },
    { icon: '💇‍♀️', title: 'Peluquerías', text: 'Agenda, servicios, profesionales, clientes frecuentes y control de ingresos.' },
    { icon: '💅', title: 'Estudios de uñas', text: 'Citas, paquetes, clientas frecuentes, historial, pagos y fidelización.' },
    { icon: '👁️', title: 'Cejas y pestañas', text: 'Reservas ordenadas, especialistas, servicios recurrentes y promociones.' },
    { icon: '🖋️', title: 'Tattoo studios', text: 'Citas, artistas, clientes, pagos, seguimiento y organización del estudio.' },
    { icon: '🌿', title: 'Spas y estética', text: 'Servicios, reservas, paquetes, clientes, sedes, caja y reportes.' },
  ];

  const companyServices = [
    {
      icon: '🧩',
      title: 'Desarrollo de software para negocios',
      text: 'Creamos plataformas digitales para ordenar operaciones, atención, ventas y administración.',
    },
    {
      icon: '📅',
      title: 'Sistema de reservas online',
      text: 'Tus clientes pueden reservar desde su celular y el negocio controla horarios, sedes, servicios y profesionales.',
    },
    {
      icon: '💵',
      title: 'Control de caja y ventas',
      text: 'Registra ingresos, gastos, efectivo, Yape, Plin, tarjeta, pagos mixtos y cierres diarios.',
    },
    {
      icon: '👥',
      title: 'Gestión de clientes',
      text: 'Guarda historial, visitas, puntos, recompensas, preferencias y datos de contacto.',
    },
    {
      icon: '🎁',
      title: 'Fidelización, puntos y promociones',
      text: 'Crea premios, campañas y beneficios para que los clientes regresen con más frecuencia.',
    },
    {
      icon: '📊',
      title: 'Reportes y métricas',
      text: 'Visualiza ventas, utilidad, gastos, rendimiento por sede, profesional y rango de fechas.',
    },
    {
      icon: '🔐',
      title: 'Roles y permisos',
      text: 'Controla el acceso de dueños, administradores, profesionales y equipo interno.',
    },
    {
      icon: '🤖',
      title: 'Inteligencia artificial aplicada',
      text: 'Soluciones con IA para mejorar la experiencia del cliente y diferenciar el negocio.',
    },
  ];

  const features = [
    {
      icon: '📅',
      title: 'Reservas online',
      text: 'Clientes reservan desde su celular y el negocio controla horarios, sedes, servicios y profesionales.',
    },
    {
      icon: '💵',
      title: 'Control de caja',
      text: 'Apertura, cierre, ingresos, gastos, ventas, métodos de pago y movimientos del día.',
    },
    {
      icon: '💳',
      title: 'Pagos por método',
      text: 'Controla efectivo, Yape, Plin, tarjeta y pagos mixtos para cuadrar mejor el negocio.',
    },
    {
      icon: '👥',
      title: 'Clientes e historial',
      text: 'Guarda datos, historial de visitas, reservas, consumos, puntos y comportamiento.',
    },
    {
      icon: '⭐',
      title: 'Puntos de fidelidad',
      text: 'Premia automáticamente a clientes frecuentes y motiva nuevas visitas.',
    },
    {
      icon: '🎁',
      title: 'Premios y recompensas',
      text: 'Crea premios canjeables por puntos para aumentar la recurrencia.',
    },
    {
      icon: '🏷️',
      title: 'Promociones',
      text: 'Crea ofertas, descuentos y campañas para atraer más reservas.',
    },
    {
      icon: '🧾',
      title: 'Reservas con inicial',
      text: 'Permite separar citas con pago inicial, número de operación y comprobante.',
    },
    {
      icon: '✅',
      title: 'Validación de pagos',
      text: 'El dueño puede revisar, aprobar o rechazar comprobantes de pagos iniciales.',
    },
    {
      icon: '🧑‍💼',
      title: 'Gestión de profesionales',
      text: 'Administra horarios, servicios asignados, comisiones, pagos y rendimiento.',
    },
    {
      icon: '📦',
      title: 'Inventario por sede',
      text: 'Controla productos, stock, imágenes, precios y disponibilidad por sucursal.',
    },
    {
      icon: '📊',
      title: 'Reportes del negocio',
      text: 'Mira ventas, utilidad, gastos, clientes, profesionales y rendimiento por fechas.',
    },
  ];

  const plans = [
    {
      name: 'Starter',
      price: 'S/ 39',
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
      price: 'S/ 79',
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
      price: 'S/ 149',
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

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#0F172A]">
      <header className="fixed left-0 right-0 top-0 z-50 px-4 py-4">
        <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-[28px] border border-white/80 bg-white/95 px-4 py-3 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl md:px-6">
  
          <a href="/" className="flex items-center">
            <BrandIdentity compact />
          </a>
     

          <div className="hidden items-center gap-7 lg:flex">
            <a href="#nosotros" className="text-sm font-black text-[#334155] transition hover:text-[#2563EB]">Nosotros</a>
            <a href="#rubros" className="text-sm font-black text-[#334155] transition hover:text-[#2563EB]">Rubros</a>
            <a href="#servicios" className="text-sm font-black text-[#334155] transition hover:text-[#2563EB]">Servicios</a>
            <a href="#producto" className="text-sm font-black text-[#334155] transition hover:text-[#2563EB]">Super Gods App</a>
            <a href="#planes" className="text-sm font-black text-[#334155] transition hover:text-[#2563EB]">Planes</a>
            <a href="#contacto" className="text-sm font-black text-[#334155] transition hover:text-[#2563EB]">Contacto</a>
          </div>

          <div className="flex items-center gap-2">
            <a href="/login" className="hidden rounded-2xl border border-[#CBD5E1] bg-white px-5 py-3 text-sm font-black text-[#0F172A] transition hover:border-[#2563EB] hover:text-[#2563EB] sm:inline-flex">
              Iniciar sesión
            </a>
            <a href="#contacto" className="rounded-2xl bg-[#0F2A5F] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5 hover:bg-[#123A84]">
              Probar 7 días gratis
            </a>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden px-4 pb-16 pt-32 md:pb-24 md:pt-40">
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
                <a href="#contacto" className="inline-flex justify-center rounded-2xl bg-[#0F2A5F] px-7 py-4 text-base font-black text-white shadow-xl shadow-blue-900/20 transition hover:-translate-y-1 hover:bg-[#123A84]">
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

        <section className="px-4 py-8">
          <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-4">
            <MetricCard value="24/7" label="Reservas online" />
            <MetricCard value="+Caja" label="Control de pagos y ventas" />
            <MetricCard value="+Puntos" label="Fidelización y premios" />
            <MetricCard value="+Reportes" label="Métricas para decidir mejor" />
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
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">{item.icon}</div>
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
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">{service.icon}</div>
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
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">{feature.icon}</div>
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
                  <a href="#contacto" className={plan.highlighted ? 'mt-8 inline-flex w-full justify-center rounded-2xl bg-white px-6 py-4 text-sm font-black text-[#0F2A5F] transition hover:-translate-y-1' : 'mt-8 inline-flex w-full justify-center rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-[#0F2A5F]'}>Solicitar demo gratis</a>
                </div>
              ))}
            </div>

            <p className="mt-6 text-center text-sm font-semibold text-slate-500">Precio de lanzamiento · 10% de descuento pagando 6 meses · 20% de descuento pagando anual.</p>
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
              <a href="#contacto" className="rounded-2xl bg-white px-7 py-4 text-base font-black text-slate-950 transition hover:-translate-y-1">Solicitar demo gratis</a>
              <a href="/login" className="rounded-2xl border border-white/30 px-7 py-4 text-base font-black text-white transition hover:-translate-y-1 hover:bg-white/10">Iniciar sesión</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 md:flex-row md:items-center">
          <BrandIdentity />
          <div className="flex flex-wrap gap-5 text-sm font-bold text-slate-500">
            <a href="/" className="hover:text-blue-700">Inicio</a>
            <a href="/soporte" className="hover:text-blue-700">Soporte</a>
            <a href="/privacy" className="hover:text-blue-700">Privacidad</a>
            <a href="/datos" className="hover:text-blue-700">Datos</a>
            <a href="/login" className="hover:text-blue-700">Login</a>
          </div>
        </div>
      </footer>
    </div>
  );
}


function BrandIdentity({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B1220] via-[#111827] to-[#020617] shadow-[0_16px_40px_rgba(15,23,42,0.22)] ring-1 ring-slate-900/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(250,204,21,0.32),transparent_35%)]" />
        <div className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-[#D4AF37]/70 bg-black/20">
          <span className="text-[13px] font-black leading-none tracking-[-0.08em] text-[#F6D365]">
            GT
          </span>
        </div>
      </div>

      <div className={compact ? 'hidden sm:block' : 'block'}>
        <div className="flex items-center gap-2">
          <p className="text-lg font-black leading-none tracking-[-0.035em] text-slate-950">
            Gods Technologies
          </p>
          <span className="hidden rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-black tracking-[0.12em] text-amber-700 md:inline-flex">
            S.A.C.
          </span>
        </div>
        <p className="mt-1 text-xs font-bold tracking-wide text-slate-500">
          Empresa creadora de Super Gods App
        </p>
      </div>
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
function ContactLeadBox({ whatsappNumber }) {
  const initialLead = {
    nombre: '',
    negocio: '',
    businessType: 'BARBERSHOP',
    email: '',
    whatsapp: '',
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
      country: lead.country.trim(),
      city: lead.city.trim(),
      branchesCount: parseCount(lead.sedes),
      professionalsCount: parseCount(lead.profesionales),
      socialLink: lead.socialLink.trim(),
      googleMapsLink: lead.googleMapsLink.trim(),
      message: buildLeadMessage(lead, businessTypeLabel),
    };

    try {
      setSaving(true);
      setError('');
      setSuccess(false);

      await demoRequestApi.createPublicRequest(payload);

      setSuccess(true);
    } catch (e) {
      setError(e.message || 'No se pudo enviar la solicitud. Inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 md:p-12">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
        Solicita tu demo
      </p>

      <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">
        Activa tu demo gratis
      </h2>

      <p className="mt-4 font-medium leading-7 text-slate-600">
        Completa los datos de tu negocio. Revisaremos tu solicitud y, si todo está correcto, activaremos tu cuenta demo por 7 días.
      </p>

      {success && (
        <div className="mt-6 rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-emerald-900">
          <h3 className="text-xl font-black">Solicitud enviada correctamente 🎉</h3>
          <p className="mt-2 text-sm font-bold leading-6">
            Revisaremos los datos de tu negocio. Si es aprobada, recibirás tus accesos por WhatsApp o correo.
          </p>
          <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-black text-slate-800">
            Tu acceso será con tu correo registrado y contraseña temporal: 123456
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
          >
            También enviar por WhatsApp
          </a>
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
        {saving ? 'Enviando solicitud...' : 'Enviar solicitud de demo'}
      </button>

      <a
        href="/login"
        className="mt-4 flex w-full justify-center rounded-2xl border border-slate-200 bg-slate-50 px-7 py-4 text-base font-black text-slate-950 transition hover:border-blue-600 hover:text-blue-700"
      >
        Ya tengo cuenta, iniciar sesión
      </a>

      <p className="mt-4 text-center text-xs font-semibold leading-5 text-slate-500">
        No necesitas tarjeta. Primero revisamos tu solicitud para activar una demo real de Super Gods App.
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

function SimplePublicPage({ title }) {
  return (
    <div className="min-h-screen bg-[#F5F7FB] px-6 py-16 text-slate-950">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
        <BrandIdentity />
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
        <Route path="/soporte" element={<SimplePublicPage title="Soporte Super Gods App" />} />
        <Route path="/privacy" element={<SimplePublicPage title="Política de Privacidad" />} />
        <Route path="/datos" element={<SimplePublicPage title="Opciones de Privacidad y Datos" />} />

        <Route path="/login" element={<LoginPage />} />

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
