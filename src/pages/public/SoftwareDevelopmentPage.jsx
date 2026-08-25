import { createElement, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Blocks,
  Bot,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Cloud,
  Code2,
  Database,
  FileCheck2,
  LayoutDashboard,
  MessageCircle,
  Package,
  Rocket,
  ShieldCheck,
  Smartphone,
  Store,
  UsersRound,
  Workflow,
} from 'lucide-react';

const WHATSAPP_NUMBER = '51958062847';

const services = [
  { icon: Smartphone, title: 'Aplicaciones móviles', text: 'Apps Android y iOS para clientes, equipos de trabajo y operaciones en campo.' },
  { icon: LayoutDashboard, title: 'Sistemas web', text: 'Paneles administrativos, portales, intranets y plataformas accesibles desde cualquier dispositivo.' },
  { icon: Store, title: 'Ventas e inventario', text: 'Caja, productos, stock por sede, movimientos, compras, ventas y reportes operativos.' },
  { icon: CalendarDays, title: 'Reservas y atención', text: 'Agendas, disponibilidad, anticipos, recordatorios y seguimiento de clientes.' },
  { icon: FileCheck2, title: 'Facturación electrónica', text: 'Integraciones con SUNAT, Mifact y flujos de emisión de boletas y facturas.' },
  { icon: Workflow, title: 'Automatización e integraciones', text: 'WhatsApp, notificaciones, pagos, APIs externas y procesos repetitivos automatizados.' },
  { icon: Bot, title: 'Inteligencia artificial', text: 'Asistentes, clasificación, análisis y experiencias con IA aplicadas al negocio.' },
  { icon: Cloud, title: 'SaaS y nube', text: 'Productos multiempresa, multisede, escalables, auditables y preparados para crecer.' },
];

const portfolioSignals = [
  'Aplicación móvil y panel web',
  'Arquitectura multiempresa y multisede',
  'Agenda y reservas en línea',
  'Caja, ventas e inventario por sede',
  'Clientes, puntos, premios y campañas',
  'Comisiones y pagos al personal',
  'Reportes, permisos y auditoría',
  'Notificaciones y facturación electrónica',
];

const process = [
  { number: '01', title: 'Descubrimiento', text: 'Entendemos el problema, usuarios, procesos y resultado que necesita tu empresa.' },
  { number: '02', title: 'Propuesta', text: 'Definimos alcance, etapas, entregables, plazo y presupuesto antes de desarrollar.' },
  { number: '03', title: 'Construcción', text: 'Diseñamos y desarrollamos por avances verificables, con demostraciones periódicas.' },
  { number: '04', title: 'Lanzamiento', text: 'Probamos, desplegamos, capacitamos a tu equipo y acordamos soporte y evolución.' },
];

const projectTypes = [
  'Aplicación móvil',
  'Sistema web',
  'Caja e inventario',
  'Reservas y clientes',
  'Facturación electrónica',
  'Automatización',
  'MVP para emprendimiento',
  'Mejora de sistema existente',
];

export default function SoftwareDevelopmentPage() {
  const [form, setForm] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    projectType: projectTypes[0],
    description: '',
    budget: '',
    deadline: '',
  });

  const whatsappUrl = useMemo(() => {
    const message = [
      'Hola, quiero cotizar un proyecto de software con GODS TECHNOLOGIES S.A.C.',
      '',
      `Nombre: ${form.name || '-'}`,
      `Empresa: ${form.company || '-'}`,
      `WhatsApp: ${form.phone || '-'}`,
      `Correo: ${form.email || '-'}`,
      `Tipo de proyecto: ${form.projectType || '-'}`,
      `Presupuesto estimado: ${form.budget || 'Por definir'}`,
      `Fecha deseada: ${form.deadline || 'Por definir'}`,
      `Necesidad: ${form.description || '-'}`,
    ].join('\n');

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }, [form]);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo-super-gods.png" alt="GODS TECHNOLOGIES S.A.C." className="h-11 w-11 rounded-2xl object-cover" />
            <div>
              <p className="font-black leading-tight">GODS TECHNOLOGIES S.A.C.</p>
              <p className="text-xs font-bold text-slate-500">Software que impulsa negocios</p>
            </div>
          </Link>
          <div className="ml-auto hidden items-center gap-6 lg:flex">
            <a href="#servicios" className="text-sm font-black text-slate-600 hover:text-blue-700">Servicios</a>
            <a href="#portafolio" className="text-sm font-black text-slate-600 hover:text-blue-700">Portafolio</a>
            <a href="#proceso" className="text-sm font-black text-slate-600 hover:text-blue-700">Cómo trabajamos</a>
            <a href="#cotizar" className="text-sm font-black text-slate-600 hover:text-blue-700">Cotizar</a>
          </div>
          <a href="#cotizar" className="ml-auto inline-flex items-center gap-2 rounded-2xl bg-[#0F2A5F] px-5 py-3 text-sm font-black text-white lg:ml-4">
            Cuéntanos tu proyecto <ArrowRight size={17} />
          </a>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden px-5 py-20 md:py-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(59,130,246,.18),transparent_32%),radial-gradient(circle_at_90%_70%,rgba(16,185,129,.15),transparent_30%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm">
                <Code2 size={17} /> Desarrollo de software a medida en Perú
              </div>
              <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[.98] tracking-[-.055em] md:text-7xl">
                Convertimos procesos e ideas en software que produce resultados
              </h1>
              <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-600 md:text-xl">
                Creamos aplicaciones móviles, sistemas web, plataformas SaaS, automatizaciones e integraciones para empresas y emprendimientos que necesitan vender, operar y crecer mejor.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#cotizar" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0F2A5F] px-7 py-4 font-black text-white shadow-xl shadow-blue-950/20">
                  Solicitar una cotización <ArrowRight size={18} />
                </a>
                <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola, quiero conversar sobre un proyecto de software.')}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-7 py-4 font-black text-emerald-700">
                  <MessageCircle size={18} /> Hablar por WhatsApp
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                {['Diagnóstico inicial', 'Propuesta por etapas', 'Web + móvil', 'Soporte posterior'].map((item) => (
                  <span key={item} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 shadow-sm">{item}</span>
                ))}
              </div>
            </div>

            <div className="rounded-[38px] bg-slate-950 p-7 text-white shadow-[0_40px_100px_rgba(15,23,42,.28)] md:p-9">
              <p className="text-sm font-black uppercase tracking-[.18em] text-blue-300">Capacidad comprobada</p>
              <h2 className="mt-4 text-3xl font-black tracking-[-.04em]">Construimos sistemas completos, no solo páginas web</h2>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  [Database, 'Datos y seguridad'],
                  [Smartphone, 'Aplicaciones móviles'],
                  [LayoutDashboard, 'Paneles web'],
                  [Cloud, 'Servicios en la nube'],
                  [ShieldCheck, 'Roles y auditoría'],
                  [Workflow, 'Integraciones'],
                ].map(([icon, label]) => (
                  <div key={label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                    {createElement(icon, { size: 20, className: 'text-blue-300' })}
                    <span className="text-sm font-black">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="servicios" className="px-5 py-20">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-black uppercase tracking-[.18em] text-blue-700">Servicios</p>
            <div className="mt-3 grid gap-6 lg:grid-cols-[.9fr_1.1fr] lg:items-end">
              <h2 className="text-4xl font-black tracking-[-.05em] md:text-6xl">Tecnología adaptada a la operación de tu empresa</h2>
              <p className="text-lg font-medium leading-8 text-slate-600">Analizamos cómo trabajas y construimos una solución enfocada en el problema real, con una ruta clara para lanzar y seguir mejorando.</p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {services.map((service) => (
                <article key={service.title} className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,.07)]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><service.icon size={25} /></div>
                  <h3 className="mt-5 text-xl font-black">{service.title}</h3>
                  <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{service.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="portafolio" className="bg-slate-950 px-5 py-20 text-white">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[.18em] text-amber-300">Caso de éxito</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-.05em] md:text-6xl">Agenda+ / Super Gods App</h2>
              <p className="mt-5 text-lg font-medium leading-8 text-slate-300">Producto SaaS desarrollado por GODS TECHNOLOGIES S.A.C. para digitalizar salones, barberías, spas y centros de estética.</p>
              <Link to="/" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-6 py-4 font-black text-slate-950">
                Conocer el producto <ArrowRight size={18} />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {portfolioSignals.map((signal) => (
                <div key={signal} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={19} />
                  <span className="text-sm font-bold text-slate-200">{signal}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="proceso" className="px-5 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-black uppercase tracking-[.18em] text-blue-700">Cómo trabajamos</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-.05em] md:text-6xl">Un proceso claro desde la idea hasta producción</h2>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {process.map((step) => (
                <article key={step.number} className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                  <span className="text-4xl font-black text-blue-100">{step.number}</span>
                  <h3 className="mt-4 text-xl font-black">{step.title}</h3>
                  <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="cotizar" className="px-5 pb-24 pt-10">
          <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[40px] border border-slate-200 bg-white shadow-[0_35px_100px_rgba(15,23,42,.13)] lg:grid-cols-[.78fr_1.22fr]">
            <div className="bg-[#0F2A5F] p-8 text-white md:p-10">
              <ClipboardList size={34} className="text-blue-200" />
              <p className="mt-7 text-sm font-black uppercase tracking-[.18em] text-blue-200">Hablemos de tu proyecto</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-.05em]">Recibe una evaluación inicial</h2>
              <p className="mt-5 font-medium leading-7 text-blue-100">Completa la información básica. Se abrirá WhatsApp con el resumen listo para enviarnos y coordinar una reunión por Google Meet.</p>
              <div className="mt-8 space-y-3 text-sm font-bold text-blue-50">
                <p>GODS TECHNOLOGIES S.A.C.</p>
                <p>RUC 20616348656</p>
                <p>WhatsApp +51 958 062 847</p>
                <p>ss308373@gmail.com</p>
              </div>
            </div>

            <form className="grid gap-4 p-8 md:grid-cols-2 md:p-10" onSubmit={(event) => event.preventDefault()}>
              <ProjectField label="Nombre completo" value={form.name} onChange={update('name')} placeholder="Tu nombre" />
              <ProjectField label="Empresa o negocio" value={form.company} onChange={update('company')} placeholder="Nombre de la empresa" />
              <ProjectField label="WhatsApp" value={form.phone} onChange={update('phone')} placeholder="+51..." />
              <ProjectField label="Correo" value={form.email} onChange={update('email')} placeholder="correo@empresa.com" type="email" />
              <label className="grid gap-2">
                <span className="text-sm font-black text-slate-700">Tipo de proyecto</span>
                <select value={form.projectType} onChange={update('projectType')} className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 font-bold outline-none focus:border-blue-600">
                  {projectTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>
              <ProjectField label="Presupuesto estimado" value={form.budget} onChange={update('budget')} placeholder="Ej. S/ 8,000 o por definir" />
              <ProjectField label="Fecha deseada" value={form.deadline} onChange={update('deadline')} placeholder="Ej. noviembre de 2026" />
              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm font-black text-slate-700">¿Qué problema necesitas resolver?</span>
                <textarea value={form.description} onChange={update('description')} rows={5} placeholder="Describe el proceso, usuarios y resultado esperado..." className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-medium outline-none focus:border-blue-600" />
              </label>
              <div className="md:col-span-2">
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 font-black text-white transition hover:bg-emerald-700">
                  <MessageCircle size={19} /> Enviar solicitud por WhatsApp
                </a>
                <p className="mt-3 text-center text-xs font-semibold text-slate-500">No compartas contraseñas, claves bancarias ni información confidencial.</p>
              </div>
            </form>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-5 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm font-bold text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© 2026 GODS TECHNOLOGIES S.A.C. · RUC 20616348656</p>
          <div className="flex flex-wrap gap-5">
            <Link to="/">Agenda+ / Super Gods App</Link>
            <Link to="/privacy">Privacidad</Link>
            <Link to="/terms">Términos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProjectField({ label, type = 'text', ...props }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-slate-700">{label}</span>
      <input type={type} {...props} className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 font-medium outline-none focus:border-blue-600" />
    </label>
  );
}
