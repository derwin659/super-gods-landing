import { useNavigate } from 'react-router-dom';

function ConfigTile({
  icon,
  title,
  subtitle,
  badge,
  tone = 'default',
  onClick,
  disabled = false,
}) {
  const tones = {
    default: {
      iconBg: 'bg-neutral-100',
      iconText: 'text-neutral-800',
      badgeBg: 'bg-neutral-100',
      badgeText: 'text-neutral-600',
    },
    gold: {
      iconBg: 'bg-amber-50',
      iconText: 'text-amber-700',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-700',
    },
    green: {
      iconBg: 'bg-emerald-50',
      iconText: 'text-emerald-700',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-700',
    },
    blue: {
      iconBg: 'bg-blue-50',
      iconText: 'text-blue-700',
      badgeBg: 'bg-blue-100',
      badgeText: 'text-blue-700',
    },
    red: {
      iconBg: 'bg-red-50',
      iconText: 'text-red-700',
      badgeBg: 'bg-red-100',
      badgeText: 'text-red-700',
    },
    violet: {
      iconBg: 'bg-violet-50',
      iconText: 'text-violet-700',
      badgeBg: 'bg-violet-100',
      badgeText: 'text-violet-700',
    },
  };

  const selectedTone = tones[tone] || tones.default;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`group rounded-[28px] border border-neutral-200 bg-white p-5 text-left shadow-[0_14px_38px_rgba(15,23,42,0.045)] transition ${
        disabled
          ? 'cursor-not-allowed opacity-55'
          : 'hover:-translate-y-0.5 hover:shadow-[0_20px_55px_rgba(15,23,42,0.08)]'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${selectedTone.iconBg} ${selectedTone.iconText}`}
        >
          {icon}
        </div>

        <span
          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${selectedTone.badgeBg} ${selectedTone.badgeText}`}
        >
          {disabled ? 'Próximo' : badge}
        </span>
      </div>

      <h3 className="mt-5 text-lg font-black text-neutral-950">
        {title}
      </h3>

      <p className="mt-2 min-h-[48px] text-sm leading-6 text-neutral-500">
        {subtitle}
      </p>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-[0.16em] text-neutral-400">
          {disabled ? 'En desarrollo' : 'Abrir módulo'}
        </span>

        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-600 transition group-hover:bg-neutral-950 group-hover:text-white">
          →
        </div>
      </div>
    </button>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <section className="rounded-[34px] border border-neutral-200 bg-white/80 p-5 shadow-[0_14px_38px_rgba(15,23,42,0.045)]">
      <div className="mb-5">
        <h2 className="text-xl font-black text-neutral-950">
          {title}
        </h2>

        <p className="mt-1 text-sm leading-6 text-neutral-500">
          {subtitle}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

export default function OwnerConfigPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[34px] border border-amber-400/15 bg-[linear-gradient(135deg,#080808_0%,#111827_48%,#15110A_100%)] p-6 text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(251,191,36,0.22),transparent_30%),radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.16),transparent_34%)]" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
              Configuración premium
            </div>

            <h2 className="mt-5 text-4xl font-black tracking-tight">
              Control central de tu barbería
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65">
              Administra servicios, productos, clientes, caja, sedes, horarios,
              promociones, puntos, campañas y seguridad desde un solo panel web.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-5 py-4">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/35">
              Estado
            </div>
            <div className="mt-1 text-sm font-black text-emerald-300">
              Panel conectado
            </div>
          </div>
        </div>
      </section>

      <SectionCard
        title="Operación del negocio"
        subtitle="Configura lo que el dueño usa todos los días para vender, atender y controlar."
      >
   <ConfigTile
  icon="✂️"
  title="Servicios"
  subtitle="Crea y administra cortes, precios, duración, imágenes y estado."
  badge="Core"
  tone="blue"
  onClick={() => navigate('/owner/servicios')}
/>

        <ConfigTile
          icon="📦"
          title="Productos"
          subtitle="Controla productos, stock, imágenes y comisiones para barberos."
          badge="Ventas"
          tone="green"
          onClick={() => navigate('/owner/productos')}
        />

        <ConfigTile
          icon="💰"
          title="Caja"
          subtitle="Abre, cierra, registra gastos, ingresos, ventas y pagos a barberos."
          badge="Caja"
          tone="gold"
          onClick={() => navigate('/owner/caja')}
        />

        <ConfigTile
          icon="📅"
          title="Agenda"
          subtitle="Gestiona reservas, pagos iniciales, validaciones y atención de clientes."
          badge="Agenda"
          tone="violet"
          onClick={() => navigate('/owner/agenda')}
        />

        <ConfigTile
          icon="👥"
          title="Clientes"
          subtitle="Administra clientes, historial, teléfonos, puntos y visitas."
          badge="CRM"
          tone="blue"
          onClick={() => navigate('/owner/clientes')}
        />

        <ConfigTile
          icon="📈"
          title="Reportes"
          subtitle="Analiza rentabilidad, barberos, métodos de pago y servicios top."
          badge="Pro"
          tone="gold"
          onClick={() => navigate('/owner/reportes')}
        />
      </SectionCard>

      <SectionCard
        title="Estructura y equipo"
        subtitle="Módulos que vamos a crear para que la web reemplace tareas del celular."
      >
      <ConfigTile
  icon="🏪"
  title="Sedes"
  subtitle="Crear y editar sedes, dirección, estado, teléfono y datos de operación."
  badge="MVP"
  tone="gold"
  onClick={() => navigate('/owner/sedes')}
/>

<ConfigTile
  icon="💈"
  title="Barberos"
  subtitle="Crear barberos, asignarlos a sedes, subir foto y activar/desactivar."
  badge="MVP"
  tone="default"
  onClick={() => navigate('/owner/barberos')}
/>

<ConfigTile
  icon="🕒"
  title="Horarios de barberos"
  subtitle="Definir días de trabajo, horas disponibles y bloqueos por barbero."
  badge="Agenda"
  tone="green"
  onClick={() => navigate('/owner/horarios')}
/>

       <ConfigTile
  icon="🧾"
  title="Reservas y pagos"
  subtitle="Configurar inicial obligatoria, métodos de pago, QR e instrucciones."
  badge="VIP"
  tone="gold"
  onClick={() => navigate('/owner/reservas-pagos')}
/>

        <ConfigTile
          icon="👮"
          title="Administradores"
          subtitle="Crear usuarios admin y limitar permisos por caja, agenda, reportes o configuración."
          badge="Seguridad"
          tone="red"
          disabled
        />

        <ConfigTile
          icon="🔐"
          title="Seguridad"
          subtitle="Cambiar contraseña, revisar accesos y proteger la cuenta del negocio."
          badge="Cuenta"
          tone="red"
          disabled
        />
      </SectionCard>

      <SectionCard
        title="Fidelización y crecimiento"
        subtitle="Funciones que ayudan a que el cliente vuelva y que el dueño venda más."
      >
        <ConfigTile
          icon="🎁"
          title="Premios"
          subtitle="Configura recompensas canjeables con puntos para tus clientes."
          badge="Pro"
          tone="gold"
          disabled
        />

<ConfigTile
  icon="🏷️"
  title="Promociones"
  subtitle="Crea ofertas visibles para los clientes y aplícalas en reservas o ventas."
  badge="Pro"
  tone="gold"
  onClick={() => navigate('/owner/promociones')}
/>

        <ConfigTile
          icon="⭐"
          title="Ajustar puntos"
          subtitle="Corrige o entrega puntos manualmente a clientes especiales."
          badge="MVP"
          tone="blue"
          disabled
        />

        <ConfigTile
          icon="📣"
          title="Campañas automáticas"
          subtitle="Recupera clientes inactivos y promociona servicios por WhatsApp o notificaciones."
          badge="Pro"
          tone="violet"
          disabled
        />

        <ConfigTile
          icon="🤖"
          title="Asesor IA"
          subtitle="Activa el asesor de cortes, análisis facial y generación ilustrativa."
          badge="IA"
          tone="blue"
          disabled
        />

        <ConfigTile
          icon="💳"
          title="Plan y pagos"
          subtitle="Revisa el plan contratado, estado de suscripción y renovaciones."
          badge="Cuenta"
          tone="green"
          disabled
        />
      </SectionCard>
    </div>
  );
}