import {
    Banknote,
    Bot,
    CalendarDays,
    ChartNoAxesCombined,
    Clock3,
    CreditCard,
    Gift,
    Megaphone,
    Package,
    ReceiptText,
    Scissors,
    Settings2,
    ShieldCheck,
    Sparkles,
    Star,
    Store,
    Tags,
    UserCog,
    UsersRound,
  } from 'lucide-react';
  import { useNavigate } from 'react-router-dom';
  
  function ConfigTile({
    icon: Icon,
    title,
    subtitle,
    badge,
    tone = 'default',
    onClick,
    disabled = false,
  }) {
    const tones = {
      default: {
        iconBox: 'bg-neutral-100 text-neutral-700 ring-neutral-200',
        iconActive: 'group-hover:bg-neutral-950 group-hover:text-white group-hover:ring-neutral-950',
        badge: 'bg-neutral-100 text-neutral-600 ring-neutral-200',
        glow: 'group-hover:shadow-neutral-200/60',
        line: 'from-neutral-400 to-neutral-700',
      },
      gold: {
        iconBox: 'bg-amber-50 text-amber-700 ring-amber-100',
        iconActive: 'group-hover:bg-amber-500 group-hover:text-white group-hover:ring-amber-500',
        badge: 'bg-amber-100 text-amber-700 ring-amber-200',
        glow: 'group-hover:shadow-amber-200/70',
        line: 'from-amber-400 to-orange-500',
      },
      green: {
        iconBox: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
        iconActive: 'group-hover:bg-emerald-500 group-hover:text-white group-hover:ring-emerald-500',
        badge: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
        glow: 'group-hover:shadow-emerald-200/70',
        line: 'from-emerald-400 to-green-500',
      },
      blue: {
        iconBox: 'bg-blue-50 text-blue-700 ring-blue-100',
        iconActive: 'group-hover:bg-blue-500 group-hover:text-white group-hover:ring-blue-500',
        badge: 'bg-blue-100 text-blue-700 ring-blue-200',
        glow: 'group-hover:shadow-blue-200/70',
        line: 'from-blue-400 to-sky-500',
      },
      red: {
        iconBox: 'bg-red-50 text-red-700 ring-red-100',
        iconActive: 'group-hover:bg-red-500 group-hover:text-white group-hover:ring-red-500',
        badge: 'bg-red-100 text-red-700 ring-red-200',
        glow: 'group-hover:shadow-red-200/70',
        line: 'from-red-400 to-rose-500',
      },
      violet: {
        iconBox: 'bg-violet-50 text-violet-700 ring-violet-100',
        iconActive: 'group-hover:bg-violet-500 group-hover:text-white group-hover:ring-violet-500',
        badge: 'bg-violet-100 text-violet-700 ring-violet-200',
        glow: 'group-hover:shadow-violet-200/70',
        line: 'from-violet-400 to-purple-500',
      },
    };
  
    const selectedTone = tones[tone] || tones.default;
  
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={`group relative overflow-hidden rounded-[30px] border border-neutral-200 bg-white p-5 text-left shadow-[0_14px_38px_rgba(15,23,42,0.045)] transition-all duration-200 ${
          disabled
            ? 'cursor-not-allowed opacity-55'
            : `hover:-translate-y-1 hover:border-white hover:shadow-[0_24px_60px_rgba(15,23,42,0.10)] ${selectedTone.glow}`
        }`}
      >
        <div
          className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${selectedTone.line} opacity-0 transition group-hover:opacity-100`}
        />
  
        <div className="flex items-start justify-between gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-[20px] ring-1 transition-all duration-200 ${selectedTone.iconBox} ${!disabled ? selectedTone.iconActive : ''}`}
          >
            <Icon size={24} strokeWidth={2.45} />
          </div>
  
          <span
            className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ring-1 ${selectedTone.badge}`}
          >
            {disabled ? 'Próximo' : badge}
          </span>
        </div>
  
        <h3 className="mt-5 text-lg font-black text-neutral-950">
          {title}
        </h3>
  
        <p className="mt-2 min-h-[48px] text-sm font-semibold leading-6 text-neutral-500">
          {subtitle}
        </p>
  
        <div className="mt-5 flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-[0.16em] text-neutral-400">
            {disabled ? 'En desarrollo' : 'Abrir módulo'}
          </span>
  
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500 transition group-hover:bg-neutral-950 group-hover:text-white">
            →
          </div>
        </div>
      </button>
    );
  }
  
  function SectionCard({ title, subtitle, children }) {
    return (
      <section className="rounded-[34px] border border-neutral-200 bg-white/85 p-5 shadow-[0_14px_38px_rgba(15,23,42,0.045)]">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-neutral-950">
              {title}
            </h2>
  
            <p className="mt-1 text-sm font-semibold leading-6 text-neutral-500">
              {subtitle}
            </p>
          </div>
        </div>
  
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {children}
        </div>
      </section>
    );
  }
  
  function SetupStep({ done = false, title, text }) {
    return (
      <div className="rounded-[22px] border border-white/10 bg-white/[0.07] p-4">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${
              done
                ? 'bg-emerald-400 text-neutral-950'
                : 'bg-white/10 text-white/55'
            }`}
          >
            {done ? '✓' : '•'}
          </div>
          <div>
            <div className="text-sm font-black text-white">{title}</div>
            <div className="mt-1 text-xs leading-5 text-white/55">{text}</div>
          </div>
        </div>
      </div>
    );
  }
  
  export default function OwnerConfigPage() {
    const navigate = useNavigate();
  
    return (
      <div className="space-y-7">
        <section className="relative overflow-hidden rounded-[34px] border border-amber-400/15 bg-[linear-gradient(135deg,#080808_0%,#111827_48%,#15110A_100%)] p-6 text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(251,191,36,0.22),transparent_30%),radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.16),transparent_34%)]" />
  
          <div className="relative grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
            <div>
              <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
                Configuración premium
              </div>
  
              <h2 className="mt-5 text-4xl font-black tracking-tight">
                Control central de tu barbería
              </h2>
  
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65">
                Administra operación, equipo, fidelización, pagos, seguridad y crecimiento desde un solo panel web.
              </p>
            </div>
  
            <div className="grid gap-3 sm:grid-cols-2">
              <SetupStep
                done
                title="Operación activa"
                text="Servicios, caja, agenda, clientes, sedes y barberos conectados."
              />
              <SetupStep
                done
                title="Fidelización activa"
                text="Premios, promociones y recuperación de clientes desde clientes inactivos."
              />
              <SetupStep
                done
                title="Permisos web"
                text="Administradores, permisos, menú y rutas protegidas."
              />
              <SetupStep
                done
                title="Cuenta y seguridad"
                text="Recuperación de contraseña, seguridad web y cambio de clave."
              />
            </div>
          </div>
        </section>
  
        <SectionCard
          title="Operación del negocio"
          subtitle="Configura lo que el dueño usa todos los días para vender, atender y controlar."
        >
          <ConfigTile
            icon={Scissors}
            title="Servicios"
            subtitle="Crea y administra cortes, precios, duración, imágenes y estado."
            badge="Core"
            tone="blue"
            onClick={() => navigate('/owner/servicios')}
          />
  
          <ConfigTile
            icon={Package}
            title="Productos"
            subtitle="Controla productos, stock, imágenes y comisiones para barberos."
            badge="Ventas"
            tone="green"
            onClick={() => navigate('/owner/productos')}
          />
  
          <ConfigTile
            icon={Banknote}
            title="Caja"
            subtitle="Abre, cierra, registra gastos, ingresos, ventas y pagos a barberos."
            badge="Caja"
            tone="gold"
            onClick={() => navigate('/owner/caja')}
          />
  
          <ConfigTile
            icon={CalendarDays}
            title="Agenda"
            subtitle="Gestiona reservas, pagos iniciales, validaciones y atención de clientes."
            badge="Agenda"
            tone="violet"
            onClick={() => navigate('/owner/agenda')}
          />
  
          <ConfigTile
            icon={UsersRound}
            title="Clientes"
            subtitle="Administra clientes, historial, teléfonos, puntos, visitas y campañas de regreso."
            badge="CRM"
            tone="blue"
            onClick={() => navigate('/owner/clientes')}
          />
  
          <ConfigTile
            icon={ChartNoAxesCombined}
            title="Reportes"
            subtitle="Analiza rentabilidad, barberos, métodos de pago, sedes y servicios top."
            badge="Pro"
            tone="gold"
            onClick={() => navigate('/owner/reportes')}
          />
        </SectionCard>
  
        <SectionCard
          title="Estructura y equipo"
          subtitle="Define cómo opera tu negocio: sedes, barberos, horarios, reservas y permisos."
        >
          <ConfigTile
            icon={Store}
            title="Sedes"
            subtitle="Crear y editar sedes, dirección, estado, teléfono y datos de operación."
            badge="MVP"
            tone="gold"
            onClick={() => navigate('/owner/sedes')}
          />
  
          <ConfigTile
            icon={ShieldCheck}
            title="Barberos"
            subtitle="Crear barberos, asignarlos a sedes, subir foto y activar/desactivar."
            badge="MVP"
            tone="default"
            onClick={() => navigate('/owner/barberos')}
          />
  
          <ConfigTile
            icon={Clock3}
            title="Horarios de barberos"
            subtitle="Definir días de trabajo, horas disponibles y bloqueos por barbero."
            badge="Agenda"
            tone="green"
            onClick={() => navigate('/owner/horarios')}
          />
  
          <ConfigTile
            icon={ReceiptText}
            title="Métodos de pago"
            subtitle="Configurar billeteras, transferencias, tarjetas e iniciales para reservas."
            badge="VIP"
            tone="gold"
            onClick={() => navigate('/owner/reservas-pagos')}
          />
  
          <ConfigTile
            icon={UserCog}
            title="Administradores"
            subtitle="Crear usuarios admin y limitar permisos por caja, agenda, reportes o configuración."
            badge="Seguridad"
            tone="red"
            onClick={() => navigate('/owner/administradores')}
          />
  
          <ConfigTile
            icon={ShieldCheck}
            title="Seguridad"
            subtitle="Cambiar contraseña, revisar accesos y proteger la cuenta del negocio."
            badge="Cuenta"
            tone="red"
            onClick={() => navigate('/owner/seguridad')}
          />
        </SectionCard>
  
        <SectionCard
          title="Fidelización y crecimiento"
          subtitle="Funciones que ayudan a que el cliente vuelva y que el dueño venda más."
        >
          <ConfigTile
            icon={Gift}
            title="Premios"
            subtitle="Configura recompensas canjeables con puntos para tus clientes."
            badge="Pro"
            tone="gold"
            onClick={() => navigate('/owner/premios')}
          />
  
          <ConfigTile
            icon={Tags}
            title="Promociones"
            subtitle="Crea ofertas visibles para los clientes y aplícalas en reservas o ventas."
            badge="Pro"
            tone="gold"
            onClick={() => navigate('/owner/promociones')}
          />
  
          <ConfigTile
            icon={Megaphone}
            title="Campañas de regreso"
            subtitle="Recupera clientes inactivos con plantillas rápidas de WhatsApp."
            badge="CRM"
            tone="violet"
            onClick={() => navigate('/owner/clientes')}
          />
  
          <ConfigTile
            icon={Star}
            title="Moneda y puntos"
            subtitle="Define la moneda del negocio y los puntos por cada unidad monetaria gastada."
            badge="CRM"
            tone="gold"
            onClick={() => navigate('/owner/puntos-configuracion')}
          />

          <ConfigTile
            icon={Star}
            title="Ajustar puntos"
            subtitle="Corrige o entrega puntos manualmente a clientes especiales."
            badge="CRM"
            tone="blue"
            onClick={() => navigate('/owner/ajustar-puntos')}
          />
  
          <ConfigTile
            icon={Bot}
            title="Asesor IA"
            subtitle="Activa el asesor de cortes, análisis facial y generación ilustrativa."
            badge="IA"
            tone="blue"
            disabled
          />
  
          <ConfigTile
            icon={CreditCard}
            title="Plan y pagos"
            subtitle="Revisa el plan contratado, estado de suscripción y renovaciones."
            badge="Cuenta"
            tone="green"
            onClick={() => navigate('/owner/plan-pagos')}
          />
        </SectionCard>
      </div>
    );
  }
  
