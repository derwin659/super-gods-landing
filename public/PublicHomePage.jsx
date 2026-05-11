import { useMemo, useState } from 'react';

const WHATSAPP_NUMBER = '51958062847';

const features = [
  {
    icon: '📅',
    title: 'Agenda online',
    text: 'Tus clientes pueden reservar desde su celular y el dueño controla horarios, sedes y barberos.',
  },
  {
    icon: '💵',
    title: 'Caja inteligente',
    text: 'Controla ingresos, gastos, efectivo, Yape, Plin, tarjeta y cierre diario de caja.',
  },
  {
    icon: '👥',
    title: 'Clientes y puntos',
    text: 'Guarda historial, visitas, puntos acumulados y recompensas para fidelizar clientes.',
  },
  {
    icon: '🎁',
    title: 'Promociones',
    text: 'Crea promociones y premios para que tus clientes vuelvan más seguido.',
  },
  {
    icon: '✂️',
    title: 'Gestión de barberos',
    text: 'Administra horarios, servicios, comisiones, pagos y rendimiento por profesional.',
  },
  {
    icon: '📊',
    title: 'Reportes del negocio',
    text: 'Mira ventas, utilidad, gastos, clientes y rendimiento por sede o barbero.',
  },
];

const modules = [
  'Reservas online',
  'Control de caja',
  'Clientes',
  'Puntos y premios',
  'Promociones',
  'Barberos',
  'Reportes',
  'IA de cortes',
];

const plans = [
  {
    name: 'Starter',
    price: 'S/ 39',
    description: 'Para barberías pequeñas que quieren empezar a ordenar su negocio.',
    items: [
      '1 sede',
      'Hasta 5 barberos',
      'Reservas online',
      'Control de caja',
      'Clientes e historial',
      'Programa de puntos',
    ],
  },
  {
    name: 'Pro',
    price: 'S/ 79',
    description: 'Para barberías que quieren crecer con más control, promociones y reportes.',
    highlighted: true,
    items: [
      'Hasta 3 sedes',
      'Hasta 15 barberos',
      'Promociones ilimitadas',
      'Recompensas ilimitadas',
      'Reportes por sede',
      'Reportes por barbero',
    ],
  },
  {
    name: 'Gods AI',
    price: 'S/ 149',
    description: 'Para barberías que quieren diferenciarse con inteligencia artificial.',
    items: [
      'Todo lo de Pro',
      'Asesor de cortes con IA',
      'Vista ilustrativa del resultado',
      'Experiencia premium para clientes',
      'Soporte prioritario',
    ],
  },
];

export default function PublicHomePage() {
  const [form, setForm] = useState({
    nombre: '',
    barberia: '',
    ciudad: '',
    barberos: '',
  });

  const whatsappUrl = useMemo(() => {
    const text = encodeURIComponent(
      `Hola, quiero una demo gratis de Super Gods App.\n\n` +
        `Mi nombre es: ${form.nombre || '___'}\n` +
        `Mi barbería se llama: ${form.barberia || '___'}\n` +
        `Estoy en: ${form.ciudad || '___'}\n` +
        `Tengo aproximadamente: ${form.barberos || '___'} barberos/profesionales.`
    );

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
  }, [form]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#0F172A]">
      <header className="fixed left-0 right-0 top-0 z-50 px-4 py-4">
        <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-[28px] border border-white/80 bg-white/95 px-4 py-3 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl md:px-6">
          <a href="/" className="flex items-center gap-3">
            <img
              src="/logo-super-gods.png"
              alt="Super Gods logo"
              className="h-11 w-11 rounded-2xl object-cover"
            />

            <div>
              <p className="text-lg font-black leading-none tracking-tight">
                Super Gods
              </p>
              <p className="text-xs font-bold text-slate-500">
                App para barberías
              </p>
            </div>
          </a>

          <div className="hidden items-center gap-7 lg:flex">
            <a href="#funciones" className="text-sm font-black text-slate-600 hover:text-blue-700">
              Funciones
            </a>
            <a href="#planes" className="text-sm font-black text-slate-600 hover:text-blue-700">
              Planes
            </a>
            <a href="#ia" className="text-sm font-black text-slate-600 hover:text-blue-700">
              Gods AI
            </a>
            <a href="#contacto" className="text-sm font-black text-slate-600 hover:text-blue-700">
              Contacto
            </a>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/login"
              className="hidden rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-900 transition hover:border-blue-600 hover:text-blue-700 sm:inline-flex"
            >
              Iniciar sesión
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl bg-[#0F2A5F] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5 hover:bg-[#123A84]"
            >
              Probar gratis
            </a>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden px-4 pb-16 pt-32 md:pb-24 md:pt-40">
          <div className="absolute inset-x-0 top-0 h-[680px] bg-[radial-gradient(circle_at_20%_10%,#DCEBFF_0,#F5F7FB_40%,transparent_70%)]" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_0.92fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Software para barberías modernas
              </div>

              <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.055em] text-slate-950 md:text-7xl">
                Ordena tu barbería y vende más desde una sola app
              </h1>

              <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-600 md:text-xl">
                Super Gods une reservas online, caja, clientes, puntos, promociones, barberos y reportes para que el dueño tenga el control real de su negocio.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex justify-center rounded-2xl bg-[#0F2A5F] px-7 py-4 text-base font-black text-white shadow-xl shadow-blue-900/20 transition hover:-translate-y-1 hover:bg-[#123A84]"
                >
                  Empezar prueba gratis
                </a>

                <a
                  href="#contacto"
                  className="inline-flex justify-center rounded-2xl border border-slate-200 bg-white px-7 py-4 text-base font-black text-slate-950 transition hover:-translate-y-1 hover:border-blue-600 hover:text-blue-700"
                >
                  Agendar demo
                </a>

                <a
                  href="/login"
                  className="inline-flex justify-center rounded-2xl bg-slate-950 px-7 py-4 text-base font-black text-white transition hover:-translate-y-1 sm:hidden"
                >
                  Iniciar sesión
                </a>
              </div>

              <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
                {modules.slice(0, 4).map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-xs font-black text-slate-700 shadow-sm"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-br from-blue-500/20 via-green-400/10 to-transparent blur-2xl" />

              <div className="relative rounded-[36px] border border-white bg-white p-4 shadow-[0_40px_100px_rgba(15,23,42,0.18)]">
                <div className="rounded-[28px] bg-slate-950 p-5 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-white">Panel del dueño</p>
                      <p className="text-xs font-bold text-white/50">Resumen de hoy</p>
                    </div>

                    <div className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-black text-green-300">
                      En vivo
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <DashboardMiniCard label="Ventas" value="S/ 820" />
                    <DashboardMiniCard label="Reservas" value="26" />
                    <DashboardMiniCard label="Caja" value="S/ 1,240" />
                    <DashboardMiniCard label="Clientes" value="148" />
                  </div>

                  <div className="mt-4 rounded-3xl bg-white p-4 text-slate-950">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-black">Agenda de hoy</p>
                      <p className="text-xs font-black text-blue-700">Ver todo</p>
                    </div>

                    <AgendaItem hour="10:00" client="Carlos M." service="Fade clásico" />
                    <AgendaItem hour="11:30" client="Luis A." service="Corte + barba" />
                    <AgendaItem hour="12:15" client="Miguel R." service="Ondulación" />

                    <a
                      href="/login"
                      className="mt-4 flex w-full justify-center rounded-2xl bg-[#0F2A5F] px-5 py-4 text-sm font-black text-white transition hover:bg-[#123A84]"
                    >
                      Ingresar al panel
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="funciones" className="px-4 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
                Funciones
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950 md:text-6xl">
                Todo lo que tu barbería necesita para operar mejor
              </h2>
              <p className="mt-5 text-lg font-medium leading-8 text-slate-600">
                Una plataforma simple para que el dueño, los administradores y los barberos trabajen con orden.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.07)] transition hover:-translate-y-1 hover:border-blue-200"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                    {feature.icon}
                  </div>

                  <h3 className="mt-5 text-xl font-black text-slate-950">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
                    {feature.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-20">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
            <div className="rounded-[36px] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-900/20 md:p-10">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-300">
                Antes
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] md:text-5xl">
                Reservas por WhatsApp, caja manual y clientes sin seguimiento
              </h2>

              <div className="mt-8 grid gap-4">
                <PainItem text="Mensajes desordenados para reservar citas." />
                <PainItem text="No sabes exactamente cuánto quedó en caja." />
                <PainItem text="No hay control claro de puntos, premios o promociones." />
                <PainItem text="Difícil saber qué barbero vendió más." />
              </div>
            </div>

            <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/80 md:p-10">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
                Con Super Gods
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-slate-950 md:text-5xl">
                Control real para crecer con orden
              </h2>

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
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-200">
                Gods AI
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] md:text-6xl">
                Una experiencia premium para recomendar cortes con IA
              </h2>

              <p className="mt-5 text-lg font-medium leading-8 text-blue-100">
                Analiza el rostro del cliente, recomienda estilos y muestra una vista ilustrativa del resultado para diferenciar tu barbería.
              </p>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex rounded-2xl bg-white px-7 py-4 text-base font-black text-[#0F2A5F] transition hover:-translate-y-1"
              >
                Quiero conocer Gods AI
              </a>
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
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
                Planes
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950 md:text-6xl">
                Planes simples para empezar rápido
              </h2>

              <p className="mt-5 text-lg font-medium leading-8 text-slate-600">
                Empieza con una prueba gratis y luego elige el plan ideal para tu barbería.
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={
                    plan.highlighted
                      ? 'rounded-[34px] bg-[#0F2A5F] p-7 text-white shadow-[0_30px_90px_rgba(15,42,95,0.35)]'
                      : 'rounded-[34px] border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/70'
                  }
                >
                  <div
                    className={
                      plan.highlighted
                        ? 'inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-black text-blue-100'
                        : 'inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700'
                    }
                  >
                    {plan.highlighted ? 'Más recomendado' : 'Precio de lanzamiento'}
                  </div>

                  <h3 className="mt-6 text-2xl font-black">{plan.name}</h3>

                  <div className="mt-4 flex items-end gap-2">
                    <p className="text-5xl font-black tracking-tight">{plan.price}</p>
                    <p className={plan.highlighted ? 'mb-2 font-bold text-blue-100' : 'mb-2 font-bold text-slate-500'}>
                      / mes
                    </p>
                  </div>

                  <p className={plan.highlighted ? 'mt-4 font-medium leading-7 text-blue-100' : 'mt-4 font-medium leading-7 text-slate-600'}>
                    {plan.description}
                  </p>

                  <div className="mt-7 grid gap-3">
                    {plan.items.map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <span
                          className={
                            plan.highlighted
                              ? 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-[#0F2A5F]'
                              : 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-black text-green-700'
                          }
                        >
                          ✓
                        </span>
                        <span className="text-sm font-bold">{item}</span>
                      </div>
                    ))}
                  </div>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={
                      plan.highlighted
                        ? 'mt-8 inline-flex w-full justify-center rounded-2xl bg-white px-6 py-4 text-sm font-black text-[#0F2A5F] transition hover:-translate-y-1'
                        : 'mt-8 inline-flex w-full justify-center rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-[#0F2A5F]'
                    }
                  >
                    Probar gratis
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contacto" className="px-4 py-20">
          <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[42px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.12)] lg:grid-cols-[0.95fr_1.05fr]">
            <div className="relative bg-slate-950 p-8 text-white md:p-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#2563EB_0,transparent_36%)]" />

              <div className="relative">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-200">
                  Demo gratis
                </p>

                <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] md:text-6xl">
                  Mira cómo Super Gods puede funcionar en tu barbería
                </h2>

                <p className="mt-5 text-lg font-medium leading-8 text-blue-100">
                  Te ayudamos a crear tu cuenta de prueba, configurar servicios, barberos, horarios y empezar a operar.
                </p>

                <div className="mt-10 grid gap-4">
                  <InfoLine text="Demo personalizada por WhatsApp o llamada." />
                  <InfoLine text="Prueba gratis por 7 días." />
                  <InfoLine text="Soporte inicial para configurar tu barbería." />
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 md:p-12">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
                Contacto
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">
                Solicita tu demo
              </h2>

              <p className="mt-4 font-medium leading-7 text-slate-600">
                Completa estos datos y abriremos WhatsApp con el mensaje listo para enviarlo.
              </p>

              <div className="mt-8 grid gap-5">
                <LandingInput
                  label="Tu nombre"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Derwin"
                />

                <LandingInput
                  label="Nombre de la barbería"
                  name="barberia"
                  value={form.barberia}
                  onChange={handleChange}
                  placeholder="Ej: Barbería Gods"
                />

                <div className="grid gap-5 md:grid-cols-2">
                  <LandingInput
                    label="Ciudad"
                    name="ciudad"
                    value={form.ciudad}
                    onChange={handleChange}
                    placeholder="Ej: Cusco"
                  />

                  <label className="grid gap-2">
                    <span className="text-sm font-black text-slate-900">
                      Cantidad de barberos
                    </span>

                    <select
                      name="barberos"
                      value={form.barberos}
                      onChange={handleChange}
                      className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-base font-bold text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="">Seleccionar</option>
                      <option value="1">1 profesional</option>
                      <option value="2">2 profesionales</option>
                      <option value="3 a 5">3 a 5 profesionales</option>
                      <option value="Más de 5">Más de 5 profesionales</option>
                    </select>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="mt-8 w-full rounded-2xl bg-[#0F2A5F] px-7 py-4 text-base font-black text-white shadow-xl shadow-blue-900/20 transition hover:-translate-y-1 hover:bg-[#123A84]"
              >
                Enviar por WhatsApp
              </button>

              <a
                href="/login"
                className="mt-4 flex w-full justify-center rounded-2xl border border-slate-200 bg-slate-50 px-7 py-4 text-base font-black text-slate-950 transition hover:border-blue-600 hover:text-blue-700"
              >
                Ya tengo cuenta, iniciar sesión
              </a>
            </form>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <img
              src="/logo-super-gods.png"
              alt="Super Gods logo"
              className="h-10 w-10 rounded-2xl object-cover"
            />

            <div>
              <p className="font-black text-slate-950">Super Gods App</p>
              <p className="text-sm font-semibold text-slate-500">
                Software para barberías modernas.
              </p>
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

function DashboardMiniCard({ label, value }) {
  return (
    <div className="rounded-3xl bg-white/10 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-white/50">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function AgendaItem({ hour, client, service }) {
  return (
    <div className="mb-3 flex items-center justify-between rounded-2xl bg-slate-50 p-3 last:mb-0">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">
          {hour}
        </div>

        <div>
          <p className="text-sm font-black text-slate-950">{client}</p>
          <p className="text-xs font-semibold text-slate-500">{service}</p>
        </div>
      </div>

      <p className="text-xs font-black text-green-600">Confirmado</p>
    </div>
  );
}

function PainItem({ text }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-4">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500 text-sm font-black text-white">
        ×
      </span>
      <p className="font-bold leading-7 text-slate-200">{text}</p>
    </div>
  );
}

function GoodItem({ text }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-500 text-sm font-black text-white">
        ✓
      </span>
      <p className="font-bold leading-7 text-slate-700">{text}</p>
    </div>
  );
}

function AiBox({ title, text }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/10 p-6 backdrop-blur">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl">
        ⚡
      </div>

      <h3 className="text-xl font-black">{title}</h3>

      <p className="mt-3 text-sm font-medium leading-6 text-blue-100">
        {text}
      </p>
    </div>
  );
}

function InfoLine({ text }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-4">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-400 text-sm font-black text-slate-950">
        ✓
      </span>
      <p className="font-bold leading-7 text-blue-100">{text}</p>
    </div>
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