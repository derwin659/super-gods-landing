import { Routes, Route, Link } from 'react-router-dom';

function SupportPage() {
  return (
    <div className="min-h-screen bg-neutral-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl rounded-[28px] border border-white/10 bg-white/5 p-8">
        <h1 className="text-4xl font-black text-amber-400">Soporte Super Gods App</h1>
        <p className="mt-4 text-white/70">
          Si necesitas ayuda con tu cuenta, suscripción, reservas, caja o cualquier función
          de la app, contáctanos por estos medios.
        </p>

        <div className="mt-8 space-y-4 text-white/80">
          <p><strong>WhatsApp:</strong> +51 958 062 847</p>
          <p><strong>Correo:</strong> derwinnieves659@gmail.com</p>
          <p><strong>Horario:</strong> Lunes a sábado de 9:00 a. m. a 6:00 p. m.</p>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-neutral-900 p-5">
          <h2 className="text-xl font-bold">Formulario de contacto</h2>
          <p className="mt-2 text-white/65">
            Por ahora puedes contactarnos directamente por WhatsApp o correo indicando:
            nombre, barbería, teléfono y el detalle de tu solicitud.
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
        <h1 className="text-4xl font-black text-amber-400">Política de Privacidad</h1>
        <p className="mt-4 text-white/70"><strong>Última actualización:</strong> 2026</p>

        <div className="mt-8 space-y-6 text-white/75 leading-8">
          <div>
            <h2 className="text-xl font-bold text-white">1. Información que recopilamos</h2>
            <p>
              Podemos recopilar nombre, teléfono, correo electrónico, datos de barbería,
              reservas, historial de servicios, información operativa y otros datos necesarios
              para brindar el servicio.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">2. Cómo usamos la información</h2>
            <p>
              Usamos la información para operar la plataforma, gestionar reservas, caja,
              clientes, soporte técnico, mejoras del servicio y cumplimiento legal.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">3. Compartición de datos</h2>
            <p>
              No vendemos datos personales. Podemos compartir información con proveedores
              tecnológicos que nos ayudan a operar la plataforma bajo medidas razonables de seguridad.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">4. Conservación y seguridad</h2>
            <p>
              Aplicamos medidas razonables para proteger la información y conservarla durante
              el tiempo necesario para prestar el servicio y cumplir obligaciones legales.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">5. Derechos del usuario</h2>
            <p>
              Puedes solicitar acceso, corrección o eliminación de tus datos escribiéndonos a
              derwinnieves659@gmail.com.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">6. Contacto</h2>
            <p>
              Para cualquier consulta sobre privacidad, escríbenos a derwinnieves659@gmail.com.
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
          Desde esta página puedes solicitar acciones relacionadas con tus datos personales
          en Super Gods App.
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-neutral-900 p-6">
          <h2 className="text-xl font-bold">Solicitudes disponibles</h2>
          <ul className="mt-4 list-inside list-disc space-y-2 text-white/75">
            <li>Solicitar acceso a tus datos</li>
            <li>Solicitar corrección de datos</li>
            <li>Solicitar eliminación de cuenta</li>
            <li>Solicitar eliminación de datos personales</li>
          </ul>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-neutral-900 p-6">
          <h2 className="text-xl font-bold">Cómo solicitarlo</h2>
          <p className="mt-3 text-white/70">
            Escríbenos a <strong>derwinnieves659@gmail.com</strong> o por WhatsApp al +51958062847, indicando
            tu solicitud y los datos de tu cuenta. Por seguridad, podremos pedir validación
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
  const whatsappUrl =
    'https://wa.me/51958062847?text=Hola,%20quiero%20una%20demo%20de%20Super%20Gods%20App%20para%20mi%20barber%C3%ADa.%20Deseo%20conocer%20planes,%20precios%20y%20la%20prueba%20gratis.';
  const playStoreUrl =
    'https://play.google.com/store/apps/details?id=com.gods.barberia';

  const problems = [
    'Reservas desordenadas por WhatsApp',
    'Poco control de caja y pagos',
    'No sabes cuánto vende cada barbero',
  ];

  const solutions = [
    'Agenda y reservas online',
    'Caja diaria y control de ventas',
    'Reportes por barbero y sucursal',
    'Puntos, recompensas y fidelización',
    'Prueba gratis por 7 días',
    'Soporte por WhatsApp',
  ];

  const plans = [
    {
      name: 'Starter',
      price: 'S/ 39',
      detail: '1 sede · hasta 5 barberos',
    },
    {
      name: 'Pro',
      price: 'S/ 79',
      detail: 'hasta 3 sedes · hasta 15 barberos',
    },
    {
      name: 'Gods AI',
      price: 'S/ 149',
      detail: 'experiencia premium con asesor de cortes con IA',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.12),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.10),transparent_25%)]" />

        <div className="relative mx-auto max-w-6xl px-6 py-6 lg:px-8">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src="/logo-super-gods.png"
                alt="Super Gods logo"
                className="h-14 w-14 rounded-2xl object-cover ring-1 ring-amber-400/20"
              />
              <div>
                <div className="text-lg font-black tracking-[0.18em] text-amber-400">
                  SUPER GODS APP
                </div>
                <div className="text-sm text-white/60">
                  Sistema para barberías
                </div>
              </div>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl bg-amber-400 px-5 py-3 text-sm font-bold text-neutral-950 transition hover:scale-[1.02]"
            >
              WhatsApp
            </a>
          </header>

          <div className="grid gap-10 py-16 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm text-amber-300">
                Prueba gratis por 7 días
              </div>

              <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight md:text-6xl">
                Controla tu barbería desde una sola app
              </h1>

              <p className="mt-5 max-w-xl text-lg leading-8 text-white/75">
                Deja el desorden de WhatsApp, cuadernos y poco control.
                Administra reservas, caja, clientes y reportes en un solo lugar.
              </p>

              <div className="mt-6 space-y-3">
                <div className="text-white/85">✔ Reservas online</div>
                <div className="text-white/85">✔ Caja y ventas diarias</div>
                <div className="text-white/85">✔ Reportes por barbero</div>
                <div className="text-white/85">✔ Programa de puntos</div>
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-amber-400 px-6 py-4 text-center text-base font-black text-neutral-950 shadow-2xl shadow-amber-500/20 transition hover:scale-[1.02]"
                >
                  Solicitar demo por WhatsApp
                </a>

                <a
                  href="#planes"
                  className="rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-center text-base font-semibold text-white transition hover:bg-white/10"
                >
                  Ver precios
                </a>
              </div>

              <div className="mt-5 text-sm text-white/55">
                Desde <span className="font-bold text-amber-400">S/ 39 al mes</span>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-white/50">Vista rápida</div>
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
                  <div className="text-sm text-white/50">Clientes nuevos</div>
                  <div className="mt-2 text-3xl font-black">13</div>
                </div>
                <div className="rounded-2xl bg-neutral-900 p-4">
                  <div className="text-sm text-white/50">Ticket promedio</div>
                  <div className="mt-2 text-3xl font-black">S/ 31</div>
                </div>
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 block rounded-2xl bg-amber-400 px-5 py-4 text-center font-bold text-neutral-950"
              >
                Quiero ver una demo
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
        <div className="text-center">
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-amber-400">
            El problema
          </div>
          <h2 className="mt-4 text-3xl font-black md:text-4xl">
            Lo que hoy le quita orden y dinero a muchas barberías
          </h2>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {problems.map((item) => (
            <div
              key={item}
              className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-center"
            >
              <div className="text-lg font-bold">{item}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
          <div className="text-center">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-amber-400">
              La solución
            </div>
            <h2 className="mt-4 text-3xl font-black md:text-4xl">
              Super Gods te ayuda a trabajar con más orden y más control
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {solutions.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/85"
              >
                ✦ {item}
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-2xl bg-amber-400 px-6 py-4 font-black text-neutral-950"
            >
              Pedir información por WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section id="planes" className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
        <div className="text-center">
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-amber-400">
            Precios de lanzamiento
          </div>
          <h2 className="mt-4 text-3xl font-black md:text-4xl">
            Planes simples para empezar
          </h2>
          <p className="mt-4 text-white/65">
            Empieza con prueba gratis y luego elige el plan ideal para tu barbería.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`rounded-[30px] border p-8 ${
                index === 1
                  ? 'border-amber-400 bg-amber-400/10 ring-1 ring-amber-400/40'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              {index === 1 && (
                <div className="mb-4 inline-flex rounded-full bg-amber-400 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-neutral-950">
                  Más elegido
                </div>
              )}

              <div className="text-2xl font-black">{plan.name}</div>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-5xl font-black">{plan.price}</span>
                <span className="pb-1 text-white/60">/mes</span>
              </div>

              <p className="mt-4 text-white/70">{plan.detail}</p>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className={`mt-8 block rounded-2xl px-5 py-4 text-center font-bold ${
                  index === 1
                    ? 'bg-amber-400 text-neutral-950'
                    : 'border border-white/15 bg-white/5 text-white'
                }`}
              >
                Solicitar este plan
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20 lg:px-8">
        <div className="rounded-[36px] border border-amber-400/20 bg-gradient-to-r from-amber-400/15 to-white/5 p-10 text-center shadow-2xl">
          <div className="mx-auto flex w-full justify-center">
            <img
              src="/logo-super-gods.png"
              alt="Super Gods logo"
              className="h-14 w-14 rounded-2xl object-cover ring-1 ring-amber-400/20"
            />
          </div>

          <div className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-amber-300">
            Demo + prueba gratis
          </div>

          <h2 className="mt-4 text-3xl font-black md:text-4xl">
            ¿Quieres ver cómo funcionaría en tu barbería?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-white/70">
            Escríbenos por WhatsApp y te mostramos planes, precios y cómo empezar.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl bg-amber-400 px-6 py-4 font-black text-neutral-950"
            >
              Escribir por WhatsApp
            </a>

            <a
              href={playStoreUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-white/15 bg-white/5 px-6 py-4 font-semibold text-white"
            >
              Ver app en Google Play
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