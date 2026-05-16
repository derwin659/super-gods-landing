import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import SuperAdminLayout from './components/super-admin/SuperAdminLayout';
import {
  SuperAdminDashboard,
  SuperAdminCreateBarbershop,
  SuperAdminPayments,
  SuperAdminTenants,
} from './pages/super-admin';

const WHATSAPP_NUMBER = '51958062847';

const buildWhatsAppUrl = (message) => {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

function PublicHomePage() {
  const whatsappUrl = buildWhatsAppUrl(
    'Hola, quiero una demo gratis de Super Gods App.\n\n' +
      'Mi barbería se llama: \n' +
      'Estoy en: \n' +
      'Tengo aproximadamente ___ barberos/profesionales.'
  );

  const features = [
    {
      icon: '📅',
      title: 'Reservas online',
      text: 'Tus clientes reservan desde su celular y el dueño controla horarios, sedes, servicios y barberos.',
    },
    {
      icon: '💵',
      title: 'Control de caja',
      text: 'Abre y cierra caja por sede. Registra ingresos, gastos, ventas y movimientos del día.',
    },
    {
      icon: '💳',
      title: 'Pagos por método',
      text: 'Controla efectivo, Yape, Plin, tarjeta y pagos mixtos para cuadrar mejor tu negocio.',
    },
    {
      icon: '👥',
      title: 'Clientes e historial',
      text: 'Guarda datos de clientes, historial de visitas, reservas, consumos y comportamiento.',
    },
    {
      icon: '⭐',
      title: 'Puntos de fidelidad',
      text: 'Premia automáticamente a tus clientes frecuentes con puntos por sus consumos.',
    },
    {
      icon: '🎁',
      title: 'Premios y recompensas',
      text: 'Crea premios canjeables por puntos para motivar a tus clientes a volver.',
    },
    {
      icon: '🏷️',
      title: 'Promociones',
      text: 'Crea ofertas, descuentos y promociones para atraer más reservas y aumentar ventas.',
    },
    {
      icon: '🧾',
      title: 'Reservas con inicial',
      text: 'Permite separar citas con pago inicial, número de operación y comprobante de pago.',
    },
    {
      icon: '✅',
      title: 'Validación de pagos',
      text: 'El dueño puede revisar, aprobar o rechazar comprobantes de pagos iniciales.',
    },
    {
      icon: '✂️',
      title: 'Gestión de barberos',
      text: 'Administra barberos, servicios asignados, horarios, comisiones y pagos.',
    },
    {
      icon: '🕒',
      title: 'Horarios y disponibilidad',
      text: 'Configura horarios por barbero, bloqueos, días libres y disponibilidad por sede.',
    },
    {
      icon: '📦',
      title: 'Inventario por sede',
      text: 'Controla productos, stock, imágenes, precios y disponibilidad según cada sucursal.',
    },
    {
      icon: '🛒',
      title: 'Venta de productos',
      text: 'Vende productos desde caja o desde el flujo del barbero, con control de stock.',
    },
    {
      icon: '🏪',
      title: 'Múltiples sedes',
      text: 'Gestiona varias sucursales con caja, agenda, productos y reportes separados.',
    },
    {
      icon: '📊',
      title: 'Reportes del negocio',
      text: 'Mira ventas, utilidad, gastos, clientes, barberos y rendimiento por rango de fechas.',
    },
    {
      icon: '🔐',
      title: 'Permisos para admins',
      text: 'Da acceso limitado a administradores para caja, agenda, clientes, reportes o configuración.',
    },
    {
      icon: '🔔',
      title: 'Notificaciones',
      text: 'Envía avisos de reservas, promociones, premios, pagos y movimientos importantes.',
    },
    {
      icon: '🤖',
      title: 'Gods AI',
      text: 'Módulo premium en implementación para asesoramiento de cortes con inteligencia artificial.',
    },
  ];

  const plans = [
    {
      name: 'Starter',
      price: 'S/ 39',
      badge: 'Para empezar',
      description: 'Para barberías pequeñas que quieren ordenar reservas, caja y clientes.',
      items: [
        '1 sede',
        'Hasta 5 barberos',
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
      description: 'Para barberías que quieren crecer con promociones, reportes y más control.',
      items: [
        'Hasta 3 sedes',
        'Hasta 15 barberos',
        'Promociones ilimitadas',
        'Recompensas ilimitadas',
        'Inventario por sede',
        'Reportes por sede',
        'Reportes por barbero',
        'Caja avanzada',
      ],
    },
    {
      name: 'Gods AI',
      price: 'S/ 149',
      badge: 'Premium',
      description: 'Para barberías que quieren diferenciarse con tecnología e inteligencia artificial.',
      items: [
        'Todo lo de Pro',
        'Asesor de cortes con IA',
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
      text: 'Reservas ordenadas por hora, cliente, servicio, barbero y estado.',
      image: '/landing/agenda-owner.png',
    },
    {
      title: 'Caja y pagos',
      text: 'Control de efectivo, Yape, Plin, tarjeta, ingresos, gastos y pagos a barberos.',
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
          <a href="/" className="flex items-center gap-3">
            <img src="/logo-super-gods.png" alt="Super Gods logo" className="h-11 w-11 rounded-2xl object-cover" />
            <div>
              <p className="text-lg font-black leading-none tracking-tight text-[#0F172A]">Super Gods</p>
              <p className="text-xs font-bold text-[#64748B]">App para barberías</p>
            </div>
          </a>

          <div className="hidden items-center gap-7 lg:flex">
            <a href="#funciones" className="text-sm font-black text-[#334155] transition hover:text-[#2563EB]">Características</a>
            <a href="#capturas" className="text-sm font-black text-[#334155] transition hover:text-[#2563EB]">En acción</a>
            <a href="#planes" className="text-sm font-black text-[#334155] transition hover:text-[#2563EB]">Planes</a>
            <a href="#ia" className="text-sm font-black text-[#334155] transition hover:text-[#2563EB]">Gods AI</a>
            <a href="#contacto" className="text-sm font-black text-[#334155] transition hover:text-[#2563EB]">Contacto</a>
          </div>

          <div className="flex items-center gap-2">
            <a href="/login" className="hidden rounded-2xl border border-[#CBD5E1] bg-white px-5 py-3 text-sm font-black text-[#0F172A] transition hover:border-[#2563EB] hover:text-[#2563EB] sm:inline-flex">
              Iniciar sesión
            </a>
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="rounded-2xl bg-[#0F2A5F] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5 hover:bg-[#123A84]">
              Empezar gratis
            </a>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden px-4 pb-16 pt-32 md:pb-24 md:pt-40">
          <div className="absolute inset-x-0 top-0 h-[680px] bg-[radial-gradient(circle_at_20%_10%,#DCEBFF_0,#F5F7FB_42%,transparent_70%)]" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_0.92fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Sistema completo para barberías modernas
              </div>

              <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.055em] text-slate-950 md:text-7xl">
                Ordena tu barbería y vende más desde una sola app
              </h1>

              <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-600 md:text-xl">
                Super Gods une reservas online, caja, clientes, puntos, premios, promociones, barberos, productos, inventario por sede y reportes para que el dueño tenga control real de su negocio.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex justify-center rounded-2xl bg-[#0F2A5F] px-7 py-4 text-base font-black text-white shadow-xl shadow-blue-900/20 transition hover:-translate-y-1 hover:bg-[#123A84]">
                  Empezar prueba gratis
                </a>
                <a href="#contacto" className="inline-flex justify-center rounded-2xl border border-slate-200 bg-white px-7 py-4 text-base font-black text-slate-950 transition hover:-translate-y-1 hover:border-blue-600 hover:text-blue-700">
                  Agendar demo
                </a>
                <a href="/login" className="inline-flex justify-center rounded-2xl bg-slate-950 px-7 py-4 text-base font-black text-white transition hover:-translate-y-1 sm:hidden">
                  Iniciar sesión
                </a>
              </div>

              <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
                {['Agenda', 'Caja', 'Puntos', 'Reportes'].map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-xs font-black text-slate-700 shadow-sm">{item}</div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-br from-blue-500/20 via-green-400/10 to-transparent blur-2xl" />
              <div className="relative overflow-hidden rounded-[36px] border border-white bg-white p-3 shadow-[0_40px_100px_rgba(15,23,42,0.18)]">
                <img src="/landing/dashboard-owner.png" alt="Dashboard del dueño en Super Gods" className="rounded-[28px] object-cover" />
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-8">
          <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-4">
            <MetricCard value="24/7" label="Reservas online" />
            <MetricCard value="+Caja" label="Efectivo, Yape, Plin y tarjeta" />
            <MetricCard value="+Puntos" label="Premios y fidelización" />
            <MetricCard value="+Reportes" label="Ventas, utilidad y barberos" />
          </div>
        </section>

        <section id="funciones" className="px-4 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">Características</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950 md:text-6xl">Todo lo que tu barbería necesita para operar mejor</h2>
              <p className="mt-5 text-lg font-medium leading-8 text-slate-600">Una plataforma simple para que el dueño, administradores y barberos trabajen con orden.</p>
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
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">Mira Super Gods en acción</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950 md:text-6xl">Diseñado para que el dueño entienda su negocio rápido</h2>
              <p className="mt-5 text-lg font-medium leading-8 text-slate-600">Usa estas imágenes como mockups premium hasta reemplazarlas por capturas reales de producción.</p>
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
          <div className="mx-auto max-w-7xl rounded-[42px] bg-white p-8 shadow-[0_30px_90px_rgba(15,23,42,0.10)] md:p-12">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">Control total</p>
                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950 md:text-6xl">Todo tu negocio conectado en una sola plataforma</h2>
                <p className="mt-5 text-lg font-medium leading-8 text-slate-600">Super Gods no es solo una agenda. Es un sistema completo para controlar ventas, caja, clientes, barberos, productos, promociones, puntos y reportes.</p>
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-8 inline-flex rounded-2xl bg-[#0F2A5F] px-7 py-4 text-base font-black text-white transition hover:-translate-y-1 hover:bg-[#123A84]">Quiero probar Super Gods</a>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ['Agenda', 'Reservas por sede, servicio, horario y barbero.'],
                  ['Caja', 'Ingresos, gastos, ventas y pagos por método.'],
                  ['Clientes', 'Historial, puntos, premios y promociones.'],
                  ['Barberos', 'Horarios, comisiones, pagos y rendimiento.'],
                  ['Productos', 'Inventario por sede, stock, precios e imágenes.'],
                  ['Reportes', 'Ventas, utilidad, gastos y desempeño.'],
                  ['Pagos iniciales', 'Comprobante, número de operación y validación.'],
                  ['Permisos', 'Accesos por rol para dueño y administradores.'],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
                    <p className="text-lg font-black text-slate-950">{title}</p>
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{text}</p>
                  </div>
                ))}
              </div>
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
                <PainItem text="Difícil saber qué barbero vendió más." />
              </div>
            </div>

            <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/80 md:p-10">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">Con Super Gods</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-slate-950 md:text-5xl">Control real para crecer con orden</h2>
              <div className="mt-8 grid gap-4">
                <GoodItem text="Agenda online por sede, horario, servicio y barbero." />
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
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-200">Gods AI · Próximamente</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] md:text-6xl">La próxima experiencia premium para barberías modernas</h2>
              <p className="mt-5 text-lg font-medium leading-8 text-blue-100">Estamos preparando un módulo premium para analizar el rostro del cliente, recomendar estilos y mostrar una vista ilustrativa del resultado. Ideal para barberías que quieren diferenciarse.</p>
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-8 inline-flex rounded-2xl bg-white px-7 py-4 text-base font-black text-[#0F2A5F] transition hover:-translate-y-1">Quiero estar en la lista premium</a>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <AiBox title="Análisis facial" text="Detecta forma de rostro y características clave." />
              <AiBox title="Recomendaciones" text="Sugiere cortes según rostro y estilo." />
              <AiBox title="Vista ilustrativa" text="Muestra una idea visual del resultado." />
              <AiBox title="Experiencia distinta" text="Ideal para barberías que quieren destacar." />
            </div>
          </div>
        </section>

        <section id="planes" className="px-4 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">Planes</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950 md:text-6xl">Planes simples para empezar rápido</h2>
              <p className="mt-5 text-lg font-medium leading-8 text-slate-600">Empieza con una prueba gratis y luego elige el plan ideal para tu barbería.</p>
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
                  <a href={whatsappUrl} target="_blank" rel="noreferrer" className={plan.highlighted ? 'mt-8 inline-flex w-full justify-center rounded-2xl bg-white px-6 py-4 text-sm font-black text-[#0F2A5F] transition hover:-translate-y-1' : 'mt-8 inline-flex w-full justify-center rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-[#0F2A5F]'}>Probar gratis</a>
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
            Cuéntanos cómo trabaja tu barbería y te mostramos el plan ideal
          </h2>

          <p className="mt-5 text-lg font-medium leading-8 text-blue-100">
            Completa unos datos rápidos y te llevamos a WhatsApp con un mensaje listo. Así podemos ayudarte más rápido y mostrarte exactamente lo que necesitas.
          </p>
        </div>

        <div className="mt-10 grid gap-4">
          <InfoLine text="Demo personalizada según tu tipo de negocio." />
          <InfoLine text="Prueba gratis por 7 días." />
          <InfoLine text="Soporte inicial para configurar sedes, barberos, servicios y horarios." />
          <InfoLine text="Acceso desde Android, iPhone y panel web." />
        </div>
      </div>
    </div>

    <ContactLeadBox whatsappNumber={WHATSAPP_NUMBER} />
  </div>
</section>

        <section className="px-4 pb-20">
          <div className="mx-auto max-w-7xl rounded-[40px] bg-slate-950 px-8 py-14 text-center text-white shadow-[0_35px_100px_rgba(15,23,42,0.25)]">
            <h2 className="mx-auto max-w-3xl text-4xl font-black tracking-[-0.05em] md:text-6xl">Empieza hoy a ordenar tu barbería con Super Gods</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-8 text-slate-300">Activa tu prueba gratis, recibe soporte y empieza a probar reservas, caja, clientes, puntos y reportes.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="rounded-2xl bg-white px-7 py-4 text-base font-black text-slate-950 transition hover:-translate-y-1">Empezar prueba gratis</a>
              <a href="/login" className="rounded-2xl border border-white/30 px-7 py-4 text-base font-black text-white transition hover:-translate-y-1 hover:bg-white/10">Iniciar sesión</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <img src="/logo-super-gods.png" alt="Super Gods logo" className="h-10 w-10 rounded-2xl object-cover" />
            <div>
              <p className="font-black text-slate-950">Super Gods App</p>
              <p className="text-sm font-semibold text-slate-500">Software para barberías modernas.</p>
            </div>
          </div>
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
  const [lead, setLead] = useState({
    nombre: '',
    negocio: '',
    tipoNegocio: 'Barbería',
    ciudad: '',
    whatsapp: '',
    profesionales: '',
    sedes: '',
    objetivo: '',
    mensaje: '',
  });

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
      `Tipo de negocio: ${lead.tipoNegocio || '___'}\n` +
      `Ciudad / país: ${lead.ciudad || '___'}\n` +
      `WhatsApp: ${lead.whatsapp || '___'}\n` +
      `Profesionales: ${lead.profesionales || '___'}\n` +
      `Sedes: ${lead.sedes || '___'}\n` +
      `Quiero mejorar: ${lead.objetivo || '___'}\n` +
      `Mensaje: ${lead.mensaje || '___'}`
  );

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappText}`;

  const handleSubmit = (event) => {
    event.preventDefault();
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 md:p-12">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
        Solicita información
      </p>

      <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">
        Agenda tu demo gratis
      </h2>

      <p className="mt-4 font-medium leading-7 text-slate-600">
        Responde estas preguntas y te enviaremos una atención más precisa por WhatsApp.
      </p>

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
            placeholder="Ej: Barbería Kings"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <LandingSelect
            label="Tipo de negocio"
            name="tipoNegocio"
            value={lead.tipoNegocio}
            onChange={handleChange}
            options={[
              'Barbería',
              'Salón de belleza',
              'Centro de estética',
              'Salón de uñas',
              'Spa',
              'Otro',
            ]}
          />

          <LandingInput
            label="Ciudad / país"
            name="ciudad"
            value={lead.ciudad}
            onChange={handleChange}
            placeholder="Ej: Lima, Perú"
          />
        </div>

        <LandingInput
          label="WhatsApp"
          name="whatsapp"
          value={lead.whatsapp}
          onChange={handleChange}
          placeholder="Ej: 987654321"
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
            'Controlar barberos y pagos',
            'Controlar productos e inventario',
            'Ver reportes del negocio',
            'Probar Super Gods completo',
          ]}
        />

        <label className="grid gap-2">
          <span className="text-sm font-black text-slate-900">
            Mensaje opcional
          </span>

          <textarea
            name="mensaje"
            value={lead.mensaje}
            onChange={handleChange}
            rows={4}
            placeholder="Ej: Quiero probar la app para mi barbería esta semana."
            className="resize-none rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />
        </label>
      </div>

      <button
        type="submit"
        className="mt-8 w-full rounded-2xl bg-[#0F2A5F] px-7 py-4 text-base font-black text-white shadow-xl shadow-blue-900/20 transition hover:-translate-y-1 hover:bg-[#123A84]"
      >
        Enviar solicitud por WhatsApp
      </button>

      <a
        href="/login"
        className="mt-4 flex w-full justify-center rounded-2xl border border-slate-200 bg-slate-50 px-7 py-4 text-base font-black text-slate-950 transition hover:border-blue-600 hover:text-blue-700"
      >
        Ya tengo cuenta, iniciar sesión
      </a>

      <p className="mt-4 text-center text-xs font-semibold leading-5 text-slate-500">
        No necesitas tarjeta para solicitar una demo. Primero vemos si Super Gods se adapta a tu barbería.
      </p>
    </form>
  );
}

function LandingInput({ label, name, value, onChange, placeholder }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-slate-900">{label}</span>

      <input
        name={name}
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
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function SimplePublicPage({ title }) {
  return (
    <div className="min-h-screen bg-[#F5F7FB] px-6 py-16 text-slate-950">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
        <div className="flex items-center gap-3">
          <img src="/logo-super-gods.png" alt="Super Gods logo" className="h-12 w-12 rounded-2xl object-cover" />
          <div>
            <p className="text-lg font-black text-slate-950">Super Gods App</p>
            <p className="text-sm font-semibold text-slate-500">Software para barberías modernas</p>
          </div>
        </div>
        <h1 className="mt-10 text-4xl font-black tracking-[-0.04em] text-slate-950">{title}</h1>
        <p className="mt-4 text-slate-600">Página pública de Super Gods App. Aquí agregaremos el contenido legal o de soporte correspondiente.</p>
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
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
