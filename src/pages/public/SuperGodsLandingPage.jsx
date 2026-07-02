import { useEffect, useMemo, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { getPublicSubscriptionPrices } from '../../api/publicSubscriptionPricingApi';
import {
  buildPriceMap,
  COUNTRY_PRICE_OPTIONS,
  formatSubscriptionPrice,
  getInitialPricingCountry,
  getPlanPriceFromMap,
} from '../../utils/subscriptionPricing';

function SupportPage() {
  return (
    <div className="min-h-screen bg-neutral-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl rounded-[28px] border border-white/10 bg-white/5 p-8">
        <h1 className="text-4xl font-black text-amber-400">Soporte Super Gods App</h1>
        <p className="mt-4 text-white/70">
          Si necesitas ayuda con tu cuenta, suscripciÃ³n, reservas, caja o cualquier funciÃ³n
          de la app, contÃ¡ctanos por estos medios.
        </p>

        <div className="mt-8 space-y-4 text-white/80">
          <p><strong>WhatsApp:</strong> +51 958 062 847</p>
          <p><strong>Correo:</strong> derwinnieves659@gmail.com</p>
          <p><strong>Horario:</strong> Lunes a sÃ¡bado de 9:00 a. m. a 6:00 p. m.</p>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-neutral-900 p-5">
          <h2 className="text-xl font-bold">Formulario de contacto</h2>
          <p className="mt-2 text-white/65">
            Por ahora puedes contactarnos directamente por WhatsApp o correo indicando:
            nombre, barberÃ­a, telÃ©fono y el detalle de tu solicitud.
          </p>
        </div>

        <Link
          to="/"
          className="mt-8 inline-block rounded-2xl bg-amber-400 px-5 py-3 font-bold text-neutral-950"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-neutral-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl rounded-[28px] border border-white/10 bg-white/5 p-8">
        <h1 className="text-4xl font-black text-amber-400">PolÃ­tica de Privacidad</h1>
        <p className="mt-4 text-white/70"><strong>Ãšltima actualizaciÃ³n:</strong> 2026</p>

        <div className="mt-8 space-y-6 text-white/75 leading-8">
          <div>
            <h2 className="text-xl font-bold text-white">1. InformaciÃ³n que recopilamos</h2>
            <p>
              Podemos recopilar nombre, telÃ©fono, correo electrÃ³nico, datos de barberÃ­a,
              reservas, historial de servicios, informaciÃ³n operativa y otros datos necesarios
              para brindar el servicio.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">2. CÃ³mo usamos la informaciÃ³n</h2>
            <p>
              Usamos la informaciÃ³n para operar la plataforma, gestionar reservas, caja,
              clientes, soporte tÃ©cnico, mejoras del servicio y cumplimiento legal.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">3. ComparticiÃ³n de datos</h2>
            <p>
              No vendemos datos personales. Podemos compartir informaciÃ³n con proveedores
              tecnolÃ³gicos que nos ayudan a operar la plataforma bajo medidas razonables de seguridad.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">4. ConservaciÃ³n y seguridad</h2>
            <p>
              Aplicamos medidas razonables para proteger la informaciÃ³n y conservarla durante
              el tiempo necesario para prestar el servicio y cumplir obligaciones legales.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">5. Derechos del usuario</h2>
            <p>
              Puedes solicitar acceso, correcciÃ³n o eliminaciÃ³n de tus datos escribiÃ©ndonos a
              derwinnieves659@gmail.com.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">6. Contacto</h2>
            <p>
              Para cualquier consulta sobre privacidad, escrÃ­benos a derwinnieves659@gmail.com.
            </p>
          </div>
        </div>

        <Link
          to="/"
          className="mt-8 inline-block rounded-2xl bg-amber-400 px-5 py-3 font-bold text-neutral-950"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

function DataChoicesPage() {
  return (
    <div className="min-h-screen bg-neutral-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl rounded-[28px] border border-white/10 bg-white/5 p-8">
        <h1 className="text-4xl font-black text-amber-400">Opciones de Privacidad y Datos</h1>
        <p className="mt-4 text-white/70">
          Desde esta pÃ¡gina puedes solicitar acciones relacionadas con tus datos personales
          en Super Gods App.
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-neutral-900 p-6">
          <h2 className="text-xl font-bold">Solicitudes disponibles</h2>
          <ul className="mt-4 list-inside list-disc space-y-2 text-white/75">
            <li>Solicitar acceso a tus datos</li>
            <li>Solicitar correcciÃ³n de datos</li>
            <li>Solicitar eliminaciÃ³n de cuenta</li>
            <li>Solicitar eliminaciÃ³n de datos personales</li>
          </ul>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-neutral-900 p-6">
          <h2 className="text-xl font-bold">CÃ³mo solicitarlo</h2>
          <p className="mt-3 text-white/70">
            EscrÃ­benos a <strong>derwinnieves659@gmail.com</strong> o por WhatsApp al +51958062847, indicando
            tu solicitud y los datos de tu cuenta. Por seguridad, podremos pedir validaciÃ³n
            de identidad antes de procesarla.
          </p>
        </div>

        <Link
          to="/"
          className="mt-8 inline-block rounded-2xl bg-amber-400 px-5 py-3 font-bold text-neutral-950"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

function SuperGodsLandingPage() {
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
  const playStoreUrl =
    'https://play.google.com/store/apps/details?id=com.gods.barberia';
  const appStoreUrl = '#';
  const whatsappUrl =
    'https://wa.me/51958062847?text=Hola,%20quiero%20informaci%C3%B3n%20sobre%20Super%20Gods%20App%20para%20mi%20barber%C3%ADa.%20Deseo%20conocer%20planes,%20beneficios%20y%20precio%20de%20lanzamiento.';
  const facebookUrl = 'https://www.facebook.com/profile.php?id=61576506010013';

  const plans = [
    {
      name: 'Basic',
      price: formatSubscriptionPrice(getPlanPriceFromMap('BASIC', pricingCountry, publicPriceMap)),
      period: '/mes',
      launchNote: 'Starter compacto',
      description: 'La operación Starter para equipos pequeños.',
      features: ['1 sede', '2 profesionales', '1 admin', 'Caja y puntos'],
      highlight: false,
      cta: 'Empezar Basic',
    },
    {
      name: 'Starter',
      price: formatSubscriptionPrice(getPlanPriceFromMap('STARTER', pricingCountry, publicPriceMap)),
      period: '/mes',
      launchNote: '1 sede',
      description: 'Para una sede que necesita agenda, caja y fidelizacion.',
      features: ['1 sede', '5 profesionales', '1 admin', 'Caja y puntos'],
      highlight: false,
      cta: 'Elegir Starter',
    },
    {
      name: 'Growth',
      price: formatSubscriptionPrice(getPlanPriceFromMap('GROWTH', pricingCountry, publicPriceMap)),
      period: '/mes',
      launchNote: 'Recomendado',
      description: 'Para crecer con 2 sedes, reportes, promociones e IA.',
      features: ['2 sedes', '10 profesionales', '3 admins', 'IA Pro incluida'],
      highlight: true,
      cta: 'Elegir Growth',
    },
    {
      name: 'Pro',
      price: formatSubscriptionPrice(getPlanPriceFromMap('PRO', pricingCountry, publicPriceMap)),
      period: '/mes',
      launchNote: 'Multi sede',
      description: 'Para marcas con mas control operativo y equipo grande.',
      features: ['3 sedes', '18 profesionales', '6 admins', 'Reportes avanzados'],
      highlight: false,
      cta: 'Elegir Pro',
    },
    {
      name: 'Enterprise',
      price: formatSubscriptionPrice(getPlanPriceFromMap('ENTERPRISE', pricingCountry, publicPriceMap)),
      period: '/mes',
      launchNote: 'Desde',
      description: 'Para cadenas, expansion y acuerdos comerciales a medida.',
      features: ['Sedes ilimitadas', 'Equipo ilimitado', 'Onboarding', 'Soporte prioritario'],
      highlight: false,
      cta: 'Hablar con ventas',
    },
  ];
  const benefits = [
    {
      title: 'MÃ¡s reservas, menos desorden',
      text: 'Tus clientes reservan mÃ¡s fÃ¡cil y tu equipo trabaja con una agenda clara y mejor organizada.',
    },
    {
      title: 'Caja clara todos los dÃ­as',
      text: 'Controla ingresos, mÃ©todos de pago y cierres sin depender de papel, cuadernos o memoria.',
    },
    {
      title: 'Fideliza y haz que regresen',
      text: 'Activa puntos, premios y promociones para aumentar la frecuencia de visita y la recompra.',
    },
    {
      title: 'Haz crecer tu marca',
      text: 'Administra una o varias sucursales con una sola plataforma y mÃ¡s control del negocio.',
    },
  ];

  const loyaltyFeatures = [
    'Puntos por cada visita',
    'Recompensas y canjes',
    'Promociones para clientes frecuentes',
    'Programa de referidos',
    'Historial completo del cliente',
    'MÃ¡s recompra y mÃ¡s retorno',
  ];

  const faqs = [
    {
      q: 'Â¿Necesito conocimientos tÃ©cnicos?',
      a: 'No. Super Gods estÃ¡ pensado para dueÃ±os y equipos de barberÃ­a. Te ayudamos a configurarlo y empezar.',
    },
    {
      q: 'Â¿Puedo probar antes de pagar?',
      a: 'SÃ­. Puedes empezar con una prueba gratis de 7 dÃ­as para validar cÃ³mo funciona en tu negocio.',
    },
    {
      q: 'Â¿Funciona para varias sucursales?',
      a: 'SÃ­. Puedes controlar sucursales, barberos, ventas y mÃ©tricas desde un solo sistema.',
    },
    {
      q: 'Â¿La app sirve solo para barberÃ­as grandes?',
      a: 'No. Funciona tanto para barberÃ­as pequeÃ±as como para negocios que ya estÃ¡n creciendo.',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.12),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.15),transparent_25%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-6 lg:px-8">
          <header className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img
                src="/logo-super-gods.png"
                alt="Super Gods logo"
                className="h-14 w-14 rounded-2xl object-cover ring-1 ring-amber-400/20"
              />
              <div>
                <div className="text-xl font-black tracking-[0.2em] text-amber-400">
                  SUPER GODS APP
                </div>
                <div className="text-sm text-white/60">
                  Sistema premium para barberÃ­as
                </div>
              </div>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-amber-400/50 bg-amber-400 px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:scale-[1.02]"
            >
              Hablar por WhatsApp
            </a>
          </header>

          <div className="grid gap-12 py-20 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm text-amber-300">
                Prueba gratis por 7 dÃ­as
              </div>

              <h1 className="max-w-2xl text-5xl font-black leading-tight md:text-6xl">
                La app que ayuda a tu barberÃ­a a vender mÃ¡s y verse mÃ¡s pro.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-white/70">
                Reserva citas, controla caja, fideliza clientes, mide resultados
                por barbero y ofrece una experiencia premium con IA.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-amber-400 px-6 py-4 text-center text-base font-bold text-neutral-950 shadow-2xl shadow-amber-500/20 transition hover:scale-[1.02]"
                >
                  Solicitar demo
                </a>

                <a
                  href="#planes"
                  className="rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-center text-base font-semibold text-white transition hover:bg-white/10"
                >
                  Ver planes
                </a>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={playStoreUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Disponible en Google Play
                </a>

                <a
                  href={appStoreUrl}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
                >
                  App Store prÃ³ximamente
                </a>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-black text-amber-400">
                    +Orden
                  </div>
                  <div className="mt-1 text-sm text-white/60">
                    Agenda, caja y control diario
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-black text-amber-400">
                    +Clientes
                  </div>
                  <div className="mt-1 text-sm text-white/60">
                    Puntos, premios y recompra
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-black text-amber-400">
                    +Ingreso
                  </div>
                  <div className="mt-1 text-sm text-white/60">
                    Experiencia premium con IA
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white/50">
                      Hoy en tu barberÃ­a
                    </div>
                    <div className="text-xl font-bold">Panel del dueÃ±o</div>
                  </div>

                  <div className="rounded-xl bg-emerald-400/15 px-3 py-2 text-sm font-semibold text-emerald-300">
                    Negocio activo
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-neutral-900 p-4">
                    <div className="text-sm text-white/50">Ventas del dÃ­a</div>
                    <div className="mt-2 text-3xl font-black">S/ 1,840</div>
                  </div>

                  <div className="rounded-2xl bg-neutral-900 p-4">
                    <div className="text-sm text-white/50">Citas</div>
                    <div className="mt-2 text-3xl font-black">42</div>
                  </div>

                  <div className="rounded-2xl bg-neutral-900 p-4">
                    <div className="text-sm text-white/50">
                      Clientes nuevos
                    </div>
                    <div className="mt-2 text-3xl font-black">13</div>
                  </div>

                  <div className="rounded-2xl bg-neutral-900 p-4">
                    <div className="text-sm text-white/50">
                      Ticket promedio
                    </div>
                    <div className="mt-2 text-3xl font-black">S/ 31</div>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-amber-400/20 bg-gradient-to-br from-amber-400/10 to-white/5 p-6">
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
                  MÃ³dulo premium
                </div>
                <div className="mt-2 text-2xl font-black">
                  Asesor de cortes con IA
                </div>
                <p className="mt-3 max-w-lg text-white/70">
                  Muestra al cliente una experiencia distinta con
                  recomendaciones y vista ilustrativa del corte para impulsar
                  servicios premium.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="max-w-2xl">
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-amber-400">
            Por quÃ© elegir Super Gods
          </div>
          <h2 className="mt-4 text-4xl font-black">
            No es solo una app. Es una herramienta para crecer.
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {benefits.map((item) => (
            <div
              key={item.title}
              className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-xl"
            >
              <div className="text-xl font-bold">{item.title}</div>
              <p className="mt-3 text-white/65">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="planes" className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-amber-400">
              Planes simples
            </div>
            <h2 className="mt-4 text-4xl font-black">
              Elige el plan ideal para tu barberÃ­a
            </h2>
            <p className="mt-4 text-white/65">
              Empieza con prueba gratis y aprovecha nuestros precios de
              lanzamiento por tiempo limitado.
            </p>
          </div>

          <div className="mx-auto mt-8 flex max-w-md items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-3">
            <span className="pl-3 text-xs font-black uppercase tracking-[0.16em] text-white/50">Pais</span>
            <select
              value={pricingCountry}
              onChange={(event) => setPricingCountry(event.target.value)}
              className="h-12 flex-1 rounded-2xl border border-white/10 bg-neutral-900 px-4 text-sm font-black text-white outline-none focus:border-amber-400"
            >
              {COUNTRY_PRICE_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label} ({option.currency})
                </option>
              ))}
            </select>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`flex min-h-[405px] flex-col rounded-[26px] border p-5 shadow-2xl ${
                  plan.highlight
                    ? 'border-amber-400 bg-amber-400/10 ring-1 ring-amber-400/40'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                {plan.highlight && (
                  <div className="mb-4 inline-flex rounded-full bg-amber-400 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-neutral-950">
                    MÃ¡s elegido
                  </div>
                )}

                <div className="grid gap-3">
                  <div className="text-2xl font-black">{plan.name}</div>
                  <div className="w-fit rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-amber-300">
                    {plan.launchNote}
                  </div>
                </div>

                <div className="mt-4 min-h-[50px]">
                  <span className="block break-words text-[clamp(1.8rem,2.4vw,2.6rem)] font-black leading-none">{plan.price}</span>
                  <span className="mt-1 block text-xs font-bold text-white/60">{plan.period}</span>
                </div>

                <div className="mt-2 text-sm text-amber-300/90">
                  Valor promocional por lanzamiento
                </div>

                <p className="mt-4 min-h-[72px] text-sm leading-6 text-white/65">
                  {plan.description}
                </p>

                <div className="mt-5 space-y-2.5">
                  {plan.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-start gap-2.5 text-white/85"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
                      <span className="text-sm font-bold leading-5">{feature}</span>
                    </div>
                  ))}
                </div>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`mt-auto block rounded-2xl px-4 py-3 text-center text-sm font-bold transition hover:scale-[1.02] ${
                    plan.highlight
                      ? 'bg-amber-400 text-neutral-950'
                      : 'border border-white/15 bg-white/5 text-white'
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-6 max-w-3xl text-center text-xs font-semibold leading-6 text-white/45">
            En Peru el pago se gestiona de forma local. Para otros paises, el cobro internacional se procesa con Paddle y el monto final puede variar levemente por conversion de moneda, impuestos o comisiones del medio de pago.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-amber-400">
              FidelizaciÃ³n real
            </div>
            <h2 className="mt-4 text-4xl font-black">
              Haz que tus clientes vuelvan mÃ¡s seguido.
            </h2>
            <p className="mt-5 text-lg text-white/70">
              Super Gods no solo ordena tu barberÃ­a. TambiÃ©n te ayuda a crear
              relaciones mÃ¡s fuertes con tus clientes para aumentar frecuencia
              de visita, recompra y recomendaciÃ³n.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {loyaltyFeatures.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80"
                >
                  âœ¦ {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8 shadow-2xl">
            <div className="text-sm font-semibold text-white/50">
              Disponible en mÃ³vil
            </div>
            <div className="mt-3 text-4xl font-black">
              Tu barberÃ­a mÃ¡s profesional, tambiÃ©n desde el celular.
            </div>
            <p className="mt-4 text-white/70">
              Tus clientes pueden reservar, acumular beneficios y vivir una
              experiencia mÃ¡s moderna. Tu equipo controla caja, ventas,
              clientes e indicadores desde una sola plataforma.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={playStoreUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block rounded-2xl bg-amber-400 px-6 py-4 font-bold text-neutral-950"
              >
                Ver en Google Play
              </a>

              <a
                href={facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block rounded-2xl border border-white/15 bg-white/5 px-6 py-4 font-semibold text-white"
              >
                Ver Facebook
              </a>
            </div>

            <div className="mt-4 text-sm text-white/50">
              App Store en proceso
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto max-w-5xl px-6 py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-amber-400">
              Preguntas frecuentes
            </div>
            <h2 className="mt-4 text-4xl font-black">
              Resolvamos lo mÃ¡s importante
            </h2>
          </div>

          <div className="mt-12 grid gap-5">
            {faqs.map((item) => (
              <div
                key={item.q}
                className="rounded-[24px] border border-white/10 bg-white/5 p-6"
              >
                <div className="text-lg font-bold">{item.q}</div>
                <p className="mt-2 text-white/65">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="rounded-[36px] border border-amber-400/20 bg-gradient-to-r from-amber-400/15 to-white/5 p-10 text-center shadow-2xl">
          <div className="mx-auto flex w-full justify-center">
            <img
              src="/logo-super-gods.png"
              alt="Super Gods logo"
              className="h-14 w-14 rounded-2xl object-cover ring-1 ring-amber-400/20"
            />
          </div>

          <div className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-amber-300">
            Super Gods App
          </div>

          <h2 className="mt-4 text-4xl font-black">
            Haz que tu barberÃ­a se vea mÃ¡s premium y venda mÃ¡s.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-white/70">
            Empieza con una demo, activa tu prueba gratis y aprovecha nuestros
            precios de lanzamiento para convertir tu barberÃ­a en un negocio mÃ¡s
            ordenado, moderno y rentable.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl bg-amber-400 px-6 py-4 font-bold text-neutral-950"
            >
              Agendar demo
            </a>

            <a
              href={playStoreUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-white/15 bg-white/5 px-6 py-4 font-semibold text-white"
            >
              Descargar en Google Play
            </a>

            <a
              href={facebookUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-white/15 bg-white/5 px-6 py-4 font-semibold text-white"
            >
              Ir a Facebook
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SuperGodsLandingPage />} />
      <Route path="/soporte" element={<SupportPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/datos" element={<DataChoicesPage />} />
    </Routes>
  );
}
