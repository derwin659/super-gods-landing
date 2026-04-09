export default function SuperGodsLandingPage() {
  const playStoreUrl =
    'https://play.google.com/store/apps/details?id=com.gods.barberia';
  const appStoreUrl = '#';
  const whatsappUrl =
    'https://wa.me/51958062847?text=Hola,%20quiero%20informaci%C3%B3n%20sobre%20Super%20Gods%20App%20para%20mi%20barber%C3%ADa.%20Deseo%20conocer%20planes,%20beneficios%20y%20precio%20de%20lanzamiento.';
  const facebookUrl = 'https://www.facebook.com/profile.php?id=61576506010013';

  const plans = [
    {
      name: 'Starter',
      price: 'S/ 39',
      period: '/mes',
      launchNote: 'Precio de lanzamiento',
      description:
        'Ideal para barberías pequeñas que quieren ordenar su negocio, controlar su operación y crecer desde el primer día.',
      features: [
        '1 sede',
        'Hasta 5 barberos',
        'Reservas online',
        'Control de caja',
        'Historial de clientes',
        'Programa de puntos',
        'Soporte inicial',
        'Hasta 3 recompensas configurables'
      ],
      highlight: false,
      cta: 'Empezar Starter',
    },
    {
      name: 'Pro',
      price: 'S/ 79',
      period: '/mes',
      launchNote: 'Precio de lanzamiento',
      description:
        'Pensado para barberías en crecimiento que necesitan más control por sede, mejor seguimiento del equipo y una operación más profesional.',
      features: [
        'Todo lo de Starter',
        'Hasta 3 sedes',
        'Hasta 15 barberos',
        'Promociones y recompensas Ilimitadas',
        'Reportes por barbero',
        'Reportes por sucursal',
        'Mayor control del negocio',
      ],
      highlight: true,
      cta: 'Elegir Pro',
    },
    {
      name: 'Gods AI',
      price: 'S/ 149',
      period: '/mes',
      launchNote: 'Precio de lanzamiento',
      description:
        'La experiencia premium para barberías que quieren diferenciarse, elevar su imagen y ofrecer asesoría de cortes con inteligencia artificial.',
      features: [
        'Todo lo de Pro',
        'Asesor de cortes con IA',
        'Vista ilustrativa del resultado',
        'Experiencia premium en el local',
        'Diferenciación frente a la competencia',
        'Ideal para atraer clientes nuevos',
      ],
      highlight: false,
      cta: 'Quiero Gods AI',
    },
  ];

  const benefits = [
    {
      title: 'Más reservas, menos desorden',
      text: 'Tus clientes reservan más fácil y tu equipo trabaja con una agenda clara y mejor organizada.',
    },
    {
      title: 'Caja clara todos los días',
      text: 'Controla ingresos, métodos de pago y cierres sin depender de papel, cuadernos o memoria.',
    },
    {
      title: 'Fideliza y haz que regresen',
      text: 'Activa puntos, premios y promociones para aumentar la frecuencia de visita y la recompra.',
    },
    {
      title: 'Haz crecer tu marca',
      text: 'Administra una o varias sucursales con una sola plataforma y más control del negocio.',
    },
  ];

  const loyaltyFeatures = [
    'Puntos por cada visita',
    'Recompensas y canjes',
    'Promociones para clientes frecuentes',
    'Programa de referidos',
    'Historial completo del cliente',
    'Más recompra y más retorno',
  ];

  const faqs = [
    {
      q: '¿Necesito conocimientos técnicos?',
      a: 'No. Super Gods está pensado para dueños y equipos de barbería. Te ayudamos a configurarlo y empezar.',
    },
    {
      q: '¿Puedo probar antes de pagar?',
      a: 'Sí. Puedes empezar con una prueba gratis de 7 días para validar cómo funciona en tu negocio.',
    },
    {
      q: '¿Funciona para varias sucursales?',
      a: 'Sí. Puedes controlar sucursales, barberos, ventas y métricas desde un solo sistema.',
    },
    {
      q: '¿La app sirve solo para barberías grandes?',
      a: 'No. Funciona tanto para barberías pequeñas como para negocios que ya están creciendo.',
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
                  Sistema premium para barberías
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
                Prueba gratis por 7 días
              </div>

              <h1 className="max-w-2xl text-5xl font-black leading-tight md:text-6xl">
                La app que ayuda a tu barbería a vender más y verse más pro.
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
                  App Store próximamente
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
                      Hoy en tu barbería
                    </div>
                    <div className="text-xl font-bold">Panel del dueño</div>
                  </div>

                  <div className="rounded-xl bg-emerald-400/15 px-3 py-2 text-sm font-semibold text-emerald-300">
                    Negocio activo
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-neutral-900 p-4">
                    <div className="text-sm text-white/50">Ventas del día</div>
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
                  Módulo premium
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
            Por qué elegir Super Gods
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
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-amber-400">
              Planes simples
            </div>
            <h2 className="mt-4 text-4xl font-black">
              Elige el plan ideal para tu barbería
            </h2>
            <p className="mt-4 text-white/65">
              Empieza con prueba gratis y aprovecha nuestros precios de
              lanzamiento por tiempo limitado.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-[32px] border p-8 shadow-2xl ${
                  plan.highlight
                    ? 'border-amber-400 bg-amber-400/10 ring-1 ring-amber-400/40'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                {plan.highlight && (
                  <div className="mb-4 inline-flex rounded-full bg-amber-400 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-neutral-950">
                    Más elegido
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  <div className="text-2xl font-black">{plan.name}</div>
                  <div className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">
                    {plan.launchNote}
                  </div>
                </div>

                <div className="mt-4 flex items-end gap-2">
                  <span className="text-5xl font-black">{plan.price}</span>
                  <span className="pb-1 text-white/60">{plan.period}</span>
                </div>

                <div className="mt-2 text-sm text-amber-300/90">
                  Valor promocional por lanzamiento
                </div>

                <p className="mt-4 min-h-[96px] text-white/65">
                  {plan.description}
                </p>

                <div className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-start gap-3 text-white/85"
                    >
                      <span className="mt-1 text-amber-400">✦</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`mt-8 block rounded-2xl px-5 py-4 text-center font-bold transition hover:scale-[1.02] ${
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
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-amber-400">
              Fidelización real
            </div>
            <h2 className="mt-4 text-4xl font-black">
              Haz que tus clientes vuelvan más seguido.
            </h2>
            <p className="mt-5 text-lg text-white/70">
              Super Gods no solo ordena tu barbería. También te ayuda a crear
              relaciones más fuertes con tus clientes para aumentar frecuencia
              de visita, recompra y recomendación.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {loyaltyFeatures.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80"
                >
                  ✦ {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8 shadow-2xl">
            <div className="text-sm font-semibold text-white/50">
              Disponible en móvil
            </div>
            <div className="mt-3 text-4xl font-black">
              Tu barbería más profesional, también desde el celular.
            </div>
            <p className="mt-4 text-white/70">
              Tus clientes pueden reservar, acumular beneficios y vivir una
              experiencia más moderna. Tu equipo controla caja, ventas,
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
              Resolvamos lo más importante
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
            Haz que tu barbería se vea más premium y venda más.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-white/70">
            Empieza con una demo, activa tu prueba gratis y aprovecha nuestros
            precios de lanzamiento para convertir tu barbería en un negocio más
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