import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  cancelOwnerAppointment,
  createOwnerAppointment,
  createQuickAgendaCustomer,
  getAgendaBarbers,
  getAgendaServices,
  getAppointmentAvailability,
  getOwnerAgenda,
  getOwnerBranchesForAgenda,
  searchAgendaCustomers,
  updateOwnerAppointment,
  validateAppointmentDeposit,
} from '../../api/ownerAgendaApi';
import { formatTenantMoney } from '../../utils/tenantMoney';

function toDateInputValue(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
}

function formatMoney(value) {
  return formatTenantMoney(value);
}

function prettyDate(value) {
  if (!value) return '-';

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('es-PE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function statusCode(item) {
  const depositStatus = String(item?.depositStatus || '').trim().toUpperCase();
  const estado = String(item?.estado || '').trim().toUpperCase();

  if (
    item?.depositRequired &&
    (depositStatus === 'PENDING_VALIDATION' ||
      depositStatus === 'PENDIENTE_VALIDACION' ||
      depositStatus === 'PENDING_DEPOSIT_VALIDATION' ||
      estado === 'PENDING_DEPOSIT_VALIDATION')
  ) {
    return 'PENDING_DEPOSIT';
  }

  if (
    item?.depositRequired &&
    (depositStatus === 'PAID' ||
      depositStatus === 'VALIDADO' ||
      depositStatus === 'VALIDATED')
  ) {
    return 'DEPOSIT_OK';
  }

  if (
    item?.depositRequired &&
    (depositStatus === 'REJECTED' ||
      depositStatus === 'RECHAZADO' ||
      estado === 'DEPOSIT_REJECTED')
  ) {
    return 'DEPOSIT_REJECTED';
  }

  return estado || 'RESERVADO';
}

function statusLabel(item) {
  const code = statusCode(item);

  const labels = {
    PENDING_DEPOSIT: 'Pago inicial pendiente',
    DEPOSIT_OK: 'Inicial aprobado',
    DEPOSIT_REJECTED: 'Inicial rechazado',
    CREATED: 'Creada',
    RESERVADO: 'Reservado',
    CONFIRMED: 'Confirmado',
    'EN COLA': 'En cola',
    IN_PROGRESS: 'En atención',
    ATENDIDO: 'Atendido',
    FINALIZADO: 'Finalizado',
    COMPLETADO: 'Completado',
    CANCELADO: 'Cancelado',
  };

  return labels[code] || item?.estado || 'Reserva';
}

function statusClasses(item) {
  const code = statusCode(item);

  if (code === 'PENDING_DEPOSIT') {
    return {
      pill: 'border-amber-200 bg-amber-50 text-amber-700',
      dot: 'bg-amber-500',
      card: 'border-amber-200',
    };
  }

  if (code === 'DEPOSIT_OK' || code === 'ATENDIDO' || code === 'FINALIZADO' || code === 'COMPLETADO') {
    return {
      pill: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      dot: 'bg-emerald-500',
      card: 'border-emerald-100',
    };
  }

  if (code === 'DEPOSIT_REJECTED' || code === 'CANCELADO') {
    return {
      pill: 'border-red-200 bg-red-50 text-red-700',
      dot: 'bg-red-500',
      card: 'border-red-100',
    };
  }

  if (code === 'IN_PROGRESS') {
    return {
      pill: 'border-violet-200 bg-violet-50 text-violet-700',
      dot: 'bg-violet-500',
      card: 'border-violet-100',
    };
  }

  return {
    pill: 'border-blue-200 bg-blue-50 text-blue-700',
    dot: 'bg-blue-500',
    card: 'border-neutral-200',
  };
}

function canAttend(item) {
  const code = statusCode(item);

  if (code === 'PENDING_DEPOSIT') return false;
  if (code === 'DEPOSIT_REJECTED') return false;

  const estado = String(item?.estado || '').trim().toUpperCase();

  return (
    estado === 'CREATED' ||
    estado === 'RESERVADO' ||
    estado === 'CONFIRMED' ||
    estado === 'EN COLA' ||
    estado === 'IN_PROGRESS'
  );
}

function attendText(item) {
  const code = statusCode(item);
  const estado = String(item?.estado || '').trim().toUpperCase();

  if (code === 'PENDING_DEPOSIT') return 'Validar pago';
  if (code === 'DEPOSIT_REJECTED') return 'Rechazado';
  if (estado === 'IN_PROGRESS') return 'Continuar';
  if (estado === 'COMPLETADO' || estado === 'ATENDIDO' || estado === 'FINALIZADO') return 'Listo';

  return 'Atender';
}

function countBy(items, predicate) {
  return items.filter(predicate).length;
}

function StatBox({ label, value, tone = 'default' }) {
  const toneClass = {
    default: 'border-neutral-200 bg-white text-neutral-950',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  }[tone];

  return (
    <div className={`rounded-[24px] border p-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)] ${toneClass}`}>
      <div className="text-sm font-bold text-neutral-500">{label}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
      {message}
    </div>
  );
}

function EmptyCard({ onCreate }) {
  return (
    <div className="rounded-[30px] border border-dashed border-neutral-300 bg-white/70 p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-2xl">
        📅
      </div>
      <div className="mt-4 text-xl font-black text-neutral-950">
        No hay citas para esta fecha
      </div>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-neutral-500">
        Cuando existan reservas, clientes en cola o pagos iniciales por validar,
        aparecerán en este panel.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-5 rounded-2xl bg-neutral-950 px-5 py-4 text-sm font-black text-white transition hover:scale-[1.01]"
      >
        Crear primera cita
      </button>
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div>
      <div className="text-xs font-black uppercase tracking-[0.12em] text-neutral-400">
        {label}
      </div>
      <div className="mt-1 font-black text-neutral-950">
        {value || '-'}
      </div>
    </div>
  );
}

function DepositBox({ item, onApprove, onReject }) {
  const evidenceUrl = String(item.depositEvidenceUrl || '').trim();

  return (
    <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
            Pago inicial pendiente
          </div>

          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <InfoLine label="Método" value={item.depositMethodName || item.depositMethodCode || '-'} />
            <InfoLine label="Inicial" value={formatMoney(item.depositAmount)} />
            <InfoLine label="Saldo" value={formatMoney(item.remainingAmount)} />
            <InfoLine label="Operación" value={item.depositOperationCode || '-'} />
            {item.depositNote && <InfoLine label="Nota" value={item.depositNote} />}
          </div>

          <div className="mt-4 rounded-2xl border border-white bg-white/75 px-4 py-3 text-sm font-bold text-neutral-700">
            {evidenceUrl
              ? 'Comprobante recibido. Revísalo antes de aprobar.'
              : 'El cliente no adjuntó comprobante.'}
          </div>

          {evidenceUrl && (
            <a
              href={evidenceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-black text-amber-700 hover:bg-amber-50"
            >
              Ver comprobante adjunto
            </a>
          )}
        </div>

        <div className="flex min-w-[220px] flex-col gap-3">
          <button
            type="button"
            onClick={onApprove}
            className="rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-black text-white shadow-[0_14px_34px_rgba(16,185,129,0.18)] transition hover:scale-[1.01]"
          >
            Aprobar inicial
          </button>

          <button
            type="button"
            onClick={onReject}
            className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-black text-red-700 transition hover:bg-red-100"
          >
            Rechazar inicial
          </button>
        </div>
      </div>
    </div>
  );
}

function DepositApprovedBox({ item }) {
  if (!item.depositRequired || Number(item.depositAmount || 0) <= 0) return null;

  return (
    <div className="mt-5 rounded-[22px] border border-emerald-200 bg-emerald-50 p-4">
      <div className="text-sm font-black text-emerald-700">
        Pago inicial aprobado
      </div>

      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
        <InfoLine label="Inicial" value={formatMoney(item.depositAmount)} />
        <InfoLine label="Saldo" value={formatMoney(item.remainingAmount)} />
        <InfoLine label="Método" value={item.depositMethodName || item.depositMethodCode || '-'} />
      </div>
    </div>
  );
}

function DepositRejectedBox({ item }) {
  if (!item.depositRequired) return null;

  return (
    <div className="mt-5 rounded-[22px] border border-red-200 bg-red-50 p-4">
      <div className="text-sm font-black text-red-700">
        Pago inicial rechazado
      </div>

      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
        <InfoLine label="Inicial" value={formatMoney(item.depositAmount)} />
        <InfoLine label="Método" value={item.depositMethodName || item.depositMethodCode || '-'} />
        <InfoLine label="Operación" value={item.depositOperationCode || '-'} />
      </div>
    </div>
  );
}

function AppointmentCard({
  item,
  onApproveDeposit,
  onRejectDeposit,
  onEdit,
  onCancel,
  onAttend,
}) {
  const styles = statusClasses(item);
  const pendingDeposit = statusCode(item) === 'PENDING_DEPOSIT';
  const approvedDeposit = statusCode(item) === 'DEPOSIT_OK';
  const rejectedDeposit = statusCode(item) === 'DEPOSIT_REJECTED';
  const canceled = String(item?.estado || '').toUpperCase() === 'CANCELADO';

  return (
    <div
      className={`rounded-[30px] border bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.055)] ${styles.card}`}
    >
      <div className="grid gap-5 xl:grid-cols-[140px_1fr_230px]">
        <div className="rounded-[24px] bg-neutral-50 p-4 text-center">
          <div className="text-2xl font-black text-neutral-950">
            {item.hora || '--:--'}
          </div>
          {item.horaFin && (
            <div className="mt-1 text-sm font-bold text-neutral-500">
              hasta {item.horaFin}
            </div>
          )}
          <div className="mt-4 rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-black text-neutral-500">
            #{item.appointmentId}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${styles.dot}`} />
            <h3 className="text-2xl font-black text-neutral-950">
              {item.cliente}
            </h3>
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${styles.pill}`}>
              {statusLabel(item)}
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <InfoLine label="Servicio" value={item.servicio} />
            <InfoLine label="Precio" value={formatMoney(item.totalAmount || item.remainingAmount || item.depositAmount || 0)} />
            <InfoLine label="Barbero" value={item.barbero} />
            <InfoLine label="Teléfono" value={item.telefono || '-'} />
            <InfoLine label="Sede" value={item.branchId ? `ID ${item.branchId}` : '-'} />
          </div>

          {pendingDeposit && (
            <DepositBox
              item={item}
              onApprove={() => onApproveDeposit(item)}
              onReject={() => onRejectDeposit(item)}
            />
          )}

          {approvedDeposit && <DepositApprovedBox item={item} />}
          {rejectedDeposit && <DepositRejectedBox item={item} />}
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={!canAttend(item)}
            onClick={() => onAttend(item)}
            className={`rounded-2xl px-5 py-4 text-sm font-black transition ${
              canAttend(item)
                ? 'bg-neutral-950 text-white hover:scale-[1.01]'
                : 'bg-neutral-100 text-neutral-400'
            }`}
          >
            {attendText(item)}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onEdit(item)}
              disabled={canceled}
              className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-black text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => onCancel(item)}
              disabled={canceled}
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-xs font-bold text-neutral-500">
            Atender queda preparado para conectar con el flujo de venta/caja.
          </div>
        </div>
      </div>
    </div>
  );
}


function SmartAvatar({ src, label, icon = '✂️', size = 'h-14 w-14' }) {
  const initials = String(label || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={label || 'Imagen'}
        className={`${size} rounded-2xl border border-neutral-200 object-cover`}
        onError={(event) => {
          event.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  return (
    <div className={`${size} flex items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-lg font-black text-amber-700`}>
      {initials || icon}
    </div>
  );
}

function OptionCard({
  selected,
  title,
  subtitle,
  imageUrl,
  icon,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-[22px] border p-4 text-left transition ${
        selected
          ? 'border-amber-400 bg-amber-50 shadow-[0_14px_30px_rgba(251,191,36,0.10)]'
          : 'border-neutral-200 bg-white hover:border-amber-200 hover:bg-amber-50/50'
      }`}
    >
      <SmartAvatar src={imageUrl} label={title} icon={icon} />

      <div className="min-w-0 flex-1">
        <div className="truncate text-base font-black text-neutral-950">
          {title}
        </div>
        {subtitle && (
          <div className="mt-1 truncate text-sm font-bold text-neutral-500">
            {subtitle}
          </div>
        )}
      </div>

      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-black ${
          selected
            ? 'border-amber-400 bg-neutral-950 text-white'
            : 'border-neutral-200 bg-neutral-50 text-neutral-400'
        }`}
      >
        {selected ? '✓' : '+'}
      </div>
    </button>
  );
}

function ModalShell({ title, subtitle, onClose, children, maxWidth = 'max-w-5xl' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 px-4 py-8 backdrop-blur-sm">
      <div className={`max-h-[92vh] w-full ${maxWidth} overflow-auto rounded-[34px] border border-white/10 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.35)]`}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
              {subtitle}
            </div>
            <h2 className="mt-1 text-2xl font-black text-neutral-950">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-black text-neutral-700 hover:bg-neutral-100"
          >
            Cerrar
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = 'text',
  step,
  placeholder,
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-neutral-700">{label}</span>

      <input
        type={type}
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-bold text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-amber-400"
      />
    </label>
  );
}

function TextAreaField({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-neutral-700">{label}</span>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-bold text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-amber-400"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options, disabled = false }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-neutral-700">{label}</span>

      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-bold text-neutral-950 outline-none transition focus:border-amber-400 disabled:opacity-60"
      >
        {options.map((item) => (
          <option key={`${item.value}-${item.label}`} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function AppointmentFormModal({
  branch,
  selectedDate,
  appointment,
  onClose,
  onSaved,
}) {
  const isEdit = Boolean(appointment?.appointmentId);

  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [slots, setSlots] = useState([]);

  const [customerSearch, setCustomerSearch] = useState(
    appointment?.cliente || ''
  );
  const [selectedCustomer, setSelectedCustomer] = useState(
    appointment?.customerId
      ? {
          id: appointment.customerId,
          name: appointment.cliente,
          phone: appointment.telefono,
        }
      : null
  );

  const [quickName, setQuickName] = useState('');
  const [quickLastName, setQuickLastName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');

  const [serviceId, setServiceId] = useState(
    appointment?.serviceId ? String(appointment.serviceId) : ''
  );
  const [barberUserId, setBarberUserId] = useState(
    appointment?.barberUserId ? String(appointment.barberUserId) : ''
  );
  const [fecha, setFecha] = useState(appointment?.fecha || selectedDate);
  const [selectedSlot, setSelectedSlot] = useState(
    appointment?.hora
      ? {
          hora: appointment.hora,
          horaFin: appointment.horaFin || '',
          available: true,
        }
      : null
  );

  const [depositRequired, setDepositRequired] = useState(
    Boolean(appointment?.depositRequired)
  );
  const [depositAmount, setDepositAmount] = useState(
    appointment?.depositAmount ? String(appointment.depositAmount) : '0'
  );
  const [depositMethodName, setDepositMethodName] = useState(
    appointment?.depositMethodName || 'Yape'
  );
  const [depositOperationCode, setDepositOperationCode] = useState(
    appointment?.depositOperationCode || ''
  );
  const [depositEvidenceUrl, setDepositEvidenceUrl] = useState(
    appointment?.depositEvidenceUrl || ''
  );
  const [depositNote, setDepositNote] = useState(
    appointment?.depositNote || ''
  );

  const [notas, setNotas] = useState('');

  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function loadCatalogs() {
    setLoadingCatalogs(true);
    setErrorMsg('');

    try {
      const [barberData, serviceData] = await Promise.all([
        getAgendaBarbers(branch.id),
        getAgendaServices(),
      ]);

      setBarbers(barberData);
      setServices(serviceData);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudieron cargar los catálogos.');
    } finally {
      setLoadingCatalogs(false);
    }
  }

  async function loadSlots(next = {}) {
    const nextBarberUserId = next.barberUserId ?? barberUserId;
    const nextServiceId = next.serviceId ?? serviceId;
    const nextFecha = next.fecha ?? fecha;

    if (!nextBarberUserId || !nextServiceId || !nextFecha) {
      setSlots([]);
      return;
    }

    setLoadingSlots(true);
    setErrorMsg('');

    try {
      const data = await getAppointmentAvailability({
        branchId: branch.id,
        barberUserId: Number(nextBarberUserId),
        serviceId: Number(nextServiceId),
        fecha: nextFecha,
        appointmentId: appointment?.appointmentId || null,
      });

      setSlots(data.slots || []);

      if (
        selectedSlot &&
        !(data.slots || []).some(
          (slot) => slot.hora === selectedSlot.hora && slot.available
        )
      ) {
        setSelectedSlot(null);
      }
    } catch (error) {
      setSlots([]);
      setErrorMsg(error.message || 'No se pudo cargar disponibilidad.');
    } finally {
      setLoadingSlots(false);
    }
  }

  useEffect(() => {
    loadCatalogs();
  }, []);

  useEffect(() => {
    loadSlots();
  }, [barberUserId, serviceId, fecha]);

  useEffect(() => {
    const q = customerSearch.trim();

    if (selectedCustomer && q === selectedCustomer.name) return;

    if (selectedCustomer && q !== selectedCustomer.name) {
      setSelectedCustomer(null);
    }

    if (q.length < 2) {
      setCustomers([]);
      setSearchingCustomers(false);
      return;
    }

    let alive = true;
    setSearchingCustomers(true);

    const timer = window.setTimeout(async () => {
      try {
        const data = await searchAgendaCustomers(q);
        if (!alive) return;
        setCustomers(data.slice(0, 8));
      } catch {
        if (!alive) return;
        setCustomers([]);
      } finally {
        if (alive) setSearchingCustomers(false);
      }
    }, 400);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [customerSearch]);

  async function handleCreateCustomer() {
    if (!quickName.trim()) {
      setErrorMsg('Ingresa el nombre del cliente.');
      return;
    }

    const phone = quickPhone.replace(/[^0-9]/g, '');
    if (phone.length < 6) {
      setErrorMsg('Ingresa un teléfono válido.');
      return;
    }

    setCreatingCustomer(true);
    setErrorMsg('');

    try {
      const created = await createQuickAgendaCustomer({
        nombres: quickName,
        apellidos: quickLastName || null,
        telefono: phone,
      });

      setSelectedCustomer(created);
      setCustomerSearch(created.name);
      setCustomers([]);
      setQuickName('');
      setQuickLastName('');
      setQuickPhone('');
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo crear el cliente.');
    } finally {
      setCreatingCustomer(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedCustomer?.id) {
      setErrorMsg('Selecciona o registra un cliente.');
      return;
    }

    if (!serviceId) {
      setErrorMsg('Selecciona un servicio.');
      return;
    }

    if (!barberUserId) {
      setErrorMsg('Selecciona un barbero.');
      return;
    }

    if (!selectedSlot?.hora) {
      setErrorMsg('Selecciona una hora disponible.');
      return;
    }

    const parsedDeposit = Number(String(depositAmount).replace(',', '.')) || 0;

    if (depositRequired && parsedDeposit <= 0) {
      setErrorMsg('Ingresa el monto del pago inicial.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        branchId: branch.id,
        customerId: Number(selectedCustomer.id),
        serviceId: Number(serviceId),
        barberUserId: Number(barberUserId),
        fecha,
        horaInicio: selectedSlot.hora,
        horaFin: selectedSlot.horaFin || null,
        estado: appointment?.estado || null,
        notas: notas.trim() || null,
        depositRequired,
        depositAmount: parsedDeposit,
        depositMethodCode: depositRequired
          ? depositMethodName.trim().toUpperCase()
          : null,
        depositMethodName: depositRequired ? depositMethodName.trim() : null,
        depositOperationCode: depositRequired
          ? depositOperationCode.trim()
          : null,
        depositEvidenceUrl: depositRequired ? depositEvidenceUrl.trim() : null,
        depositNote: depositRequired ? depositNote.trim() : null,
      };

      if (isEdit) {
        await updateOwnerAppointment({
          ...payload,
          appointmentId: appointment.appointmentId,
        });
      } else {
        await createOwnerAppointment(payload);
      }

      onSaved();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo guardar la cita.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title={isEdit ? 'Editar cita' : 'Nueva cita'}
      subtitle={branch?.name || 'Agenda'}
      onClose={onClose}
      maxWidth="max-w-6xl"
    >
      {loadingCatalogs ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-black text-neutral-500">
          Cargando catálogos...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <div className="rounded-[26px] border border-neutral-200 bg-white p-5">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
                Cliente
              </div>

              <div className="mt-4">
                <InputField
                  label="Buscar cliente"
                  value={customerSearch}
                  onChange={setCustomerSearch}
                  placeholder="Nombre o teléfono"
                />
              </div>

              {searchingCustomers && (
                <div className="mt-3 rounded-2xl bg-neutral-50 px-4 py-3 text-sm font-black text-neutral-500">
                  Buscando cliente...
                </div>
              )}

              {selectedCustomer && (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center gap-3">
                    <SmartAvatar
                      src={selectedCustomer.imageUrl}
                      label={selectedCustomer.name}
                      icon="👤"
                      size="h-12 w-12"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-black text-emerald-700">
                        Cliente seleccionado
                      </div>
                      <div className="mt-1 truncate text-lg font-black text-neutral-950">
                        {selectedCustomer.name}
                      </div>
                      <div className="text-sm font-bold text-neutral-500">
                        {selectedCustomer.phone || 'Sin teléfono'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setCustomerSearch('');
                    }}
                    className="mt-3 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-emerald-700"
                  >
                    Cambiar cliente
                  </button>
                </div>
              )}

              {!selectedCustomer && customers.length > 0 && (
                <div className="mt-4 space-y-2">
                  {customers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setCustomerSearch(customer.name);
                        setCustomers([]);
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-left transition hover:bg-amber-50"
                    >
                      <SmartAvatar
                        src={customer.imageUrl}
                        label={customer.name}
                        icon="👤"
                        size="h-11 w-11"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="truncate font-black text-neutral-950">
                          {customer.name}
                        </div>
                        <div className="text-sm font-bold text-neutral-500">
                          {customer.phone || 'Sin teléfono'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!selectedCustomer && (
                <div className="mt-5 rounded-[22px] border border-neutral-200 bg-neutral-50 p-4">
                  <div className="font-black text-neutral-950">
                    Crear cliente rápido
                  </div>
                  <div className="mt-1 text-xs font-bold text-neutral-500">
                    Úsalo solo si el cliente todavía no existe.
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <InputField
                      label="Nombre"
                      value={quickName}
                      onChange={setQuickName}
                      placeholder="Ej. Carlos"
                    />
                    <InputField
                      label="Apellido"
                      value={quickLastName}
                      onChange={setQuickLastName}
                      placeholder="Opcional"
                    />
                  </div>

                  <div className="mt-3">
                    <InputField
                      label="Teléfono"
                      value={quickPhone}
                      onChange={setQuickPhone}
                      placeholder="Ej. 987654321"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateCustomer}
                    disabled={creatingCustomer}
                    className="mt-4 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-black text-neutral-800 transition hover:bg-amber-50 disabled:opacity-60"
                  >
                    {creatingCustomer
                      ? 'Creando cliente...'
                      : 'Crear y seleccionar cliente'}
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-[26px] border border-neutral-200 bg-white p-5">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
                Servicio y barbero
              </div>

              <div className="mt-4 grid gap-4">
                <div>
                  <div className="mb-3 text-sm font-black text-neutral-700">
                    Servicio
                  </div>

                  {services.length === 0 ? (
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-black text-neutral-500">
                      No hay servicios disponibles.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {services.map((service) => (
                        <OptionCard
                          key={service.id}
                          selected={String(service.id) === String(serviceId)}
                          title={service.name}
                          subtitle={`${formatMoney(service.price)} · ${service.durationMinutes} min`}
                          imageUrl={service.imageUrl}
                          icon="✂️"
                          onClick={() => {
                            setServiceId(String(service.id));
                            setSelectedSlot(null);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-3 text-sm font-black text-neutral-700">
                    Barbero
                  </div>

                  {barbers.length === 0 ? (
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-black text-neutral-500">
                      No hay barberos disponibles para esta sede.
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {barbers.map((barber) => (
                        <OptionCard
                          key={barber.id}
                          selected={String(barber.id) === String(barberUserId)}
                          title={barber.name}
                          subtitle="Barbero disponible"
                          imageUrl={barber.imageUrl}
                          icon="💈"
                          onClick={() => {
                            setBarberUserId(String(barber.id));
                            setSelectedSlot(null);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[26px] border border-neutral-200 bg-white p-5">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
                Fecha y disponibilidad
              </div>

              <div className="mt-4">
                <InputField
                  label="Fecha"
                  value={fecha}
                  onChange={(value) => {
                    setFecha(value);
                    setSelectedSlot(null);
                  }}
                  type="date"
                />
              </div>

              <div className="mt-5">
                {loadingSlots ? (
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-black text-neutral-500">
                    Cargando horarios...
                  </div>
                ) : !serviceId || !barberUserId ? (
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-black text-neutral-500">
                    Selecciona servicio y barbero para ver horarios.
                  </div>
                ) : slots.length === 0 ? (
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-black text-neutral-500">
                    No hay horarios disponibles.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {slots.map((slot) => {
                      const selected = selectedSlot?.hora === slot.hora;
                      return (
                        <button
                          key={`${slot.hora}-${slot.horaFin}`}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedSlot(slot)}
                          className={`rounded-2xl border px-3 py-3 text-left transition ${
                            selected
                              ? 'border-neutral-950 bg-neutral-950 text-white'
                              : slot.available
                                ? 'border-neutral-200 bg-white text-neutral-950 hover:bg-amber-50'
                                : 'border-neutral-200 bg-neutral-100 text-neutral-400'
                          }`}
                        >
                          <div className="text-base font-black">
                            {slot.hora}
                          </div>
                          <div className="mt-1 text-xs font-bold opacity-75">
                            {slot.available
                              ? 'Disponible'
                              : slot.reason || 'Bloqueado'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[26px] border border-neutral-200 bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
                    Pago inicial
                  </div>
                  <div className="mt-1 text-sm font-bold text-neutral-500">
                    Actívalo solo si la reserva requiere adelanto.
                  </div>
                </div>

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={depositRequired}
                    onChange={(e) => setDepositRequired(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-black text-neutral-800">
                    Requiere
                  </span>
                </label>
              </div>

              {depositRequired && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <InputField
                    label="Monto inicial"
                    value={depositAmount}
                    onChange={setDepositAmount}
                    type="number"
                    step="0.01"
                  />
                  <InputField
                    label="Método"
                    value={depositMethodName}
                    onChange={setDepositMethodName}
                    placeholder="Yape"
                  />
                  <InputField
                    label="N° operación"
                    value={depositOperationCode}
                    onChange={setDepositOperationCode}
                    placeholder="Opcional"
                  />
                  <InputField
                    label="URL comprobante"
                    value={depositEvidenceUrl}
                    onChange={setDepositEvidenceUrl}
                    placeholder="Opcional"
                  />
                  <div className="sm:col-span-2">
                    <TextAreaField
                      label="Nota del pago"
                      value={depositNote}
                      onChange={setDepositNote}
                      placeholder="Opcional"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-[26px] border border-neutral-200 bg-white p-5">
              <TextAreaField
                label="Notas internas"
                value={notas}
                onChange={setNotas}
                placeholder="Ej. Cliente pidió llegar 10 minutos antes"
              />
            </div>

            {selectedSlot && (
              <div className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-black text-neutral-900">
                Horario seleccionado: {selectedSlot.hora} - {selectedSlot.horaFin}
              </div>
            )}

            {errorMsg && <ErrorBox message={errorMsg} />}

            <button
              disabled={saving}
              className="w-full rounded-2xl bg-neutral-950 px-5 py-4 font-black text-white transition hover:scale-[1.01] disabled:opacity-60"
            >
              {saving
                ? 'Guardando...'
                : isEdit
                  ? 'Guardar cambios'
                  : 'Crear cita'}
            </button>
          </div>
        </form>
      )}
    </ModalShell>
  );
}

export default function OwnerAgendaPage() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedDate, setSelectedDate] = useState(toDateInputValue(new Date()));

  const [items, setItems] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingAgenda, setLoadingAgenda] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);

  const selectedBranch = useMemo(() => {
    return (
      branches.find((item) => String(item.id) === String(selectedBranchId)) ||
      null
    );
  }, [branches, selectedBranchId]);

  const pendingCount = countBy(items, (item) => {
    const code = statusCode(item);
    const estado = String(item.estado || '').trim().toUpperCase();
    return (
      code === 'PENDING_DEPOSIT' ||
      estado === 'CREATED' ||
      estado === 'RESERVADO' ||
      estado === 'CONFIRMED' ||
      estado === 'EN COLA'
    );
  });

  const inProgressCount = countBy(
    items,
    (item) => String(item.estado || '').trim().toUpperCase() === 'IN_PROGRESS'
  );

  const doneCount = countBy(items, (item) => {
    const estado = String(item.estado || '').trim().toUpperCase();
    return (
      estado === 'ATENDIDO' ||
      estado === 'FINALIZADO' ||
      estado === 'COMPLETADO'
    );
  });

  const pendingDepositCount = countBy(
    items,
    (item) => statusCode(item) === 'PENDING_DEPOSIT'
  );

  async function loadBranches() {
    setLoadingBranches(true);
    setErrorMsg('');

    try {
      const data = await getOwnerBranchesForAgenda();
      setBranches(data);

      if (data.length > 0) {
        setSelectedBranchId((prev) => prev || String(data[0].id));
      }
    } catch (error) {
      setErrorMsg(error.message || 'No se pudieron cargar las sedes.');
    } finally {
      setLoadingBranches(false);
    }
  }

  async function loadAgenda({ silent = false } = {}) {
    if (!selectedDate || !selectedBranchId) return;

    if (silent) {
      setRefreshing(true);
    } else {
      setLoadingAgenda(true);
    }

    setErrorMsg('');

    try {
      const data = await getOwnerAgenda({
        fecha: selectedDate,
        branchId: selectedBranchId,
      });

      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setItems([]);
      setErrorMsg(error.message || 'No se pudo cargar la agenda.');
    } finally {
      setLoadingAgenda(false);
      setRefreshing(false);
    }
  }

  async function handleValidateDeposit(item, approved) {
    const ok = window.confirm(
      approved
        ? `¿Confirmas que validaste el pago inicial de ${item.cliente}?`
        : `¿Deseas rechazar el pago inicial de ${item.cliente}?`
    );

    if (!ok) return;

    setErrorMsg('');

    try {
      await validateAppointmentDeposit({
        appointmentId: item.appointmentId,
        branchId: item.branchId || selectedBranchId,
        approved,
        note: approved
          ? 'Pago validado correctamente desde agenda web'
          : 'Pago rechazado desde agenda web',
      });

      await loadAgenda({ silent: true });
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo validar el pago inicial.');
    }
  }

  function handleAttendAppointment(item) {
    const payload = {
      appointmentId: item.appointmentId,
      customerId: item.customerId,
      customerName: item.cliente,
      customerPhone: item.telefono,
      serviceId: item.serviceId,
      serviceName: item.servicio,
      barberUserId: item.barberUserId,
      barberName: item.barbero,
      branchId: item.branchId || selectedBranchId,
      fecha: item.fecha || selectedDate,
      hora: item.hora,
      horaFin: item.horaFin,
      depositRequired: item.depositRequired,
      depositAmount: item.depositAmount,
      remainingAmount: item.remainingAmount,
      depositStatus: item.depositStatus,
      promotionTitle: item.promotionTitle,
      originalAmount: item.originalAmount,
      discountAmount: item.discountAmount,
      totalAmount: item.totalAmount,
    };

    window.sessionStorage.setItem(
      'ownerWebAttendAppointment',
      JSON.stringify(payload)
    );

    const params = new URLSearchParams({
      appointmentId: String(item.appointmentId || ''),
      branchId: String(item.branchId || selectedBranchId || ''),
      customerId: String(item.customerId || ''),
      serviceId: String(item.serviceId || ''),
      barberUserId: String(item.barberUserId || ''),
    });

    navigate(`/owner/caja?${params.toString()}`);
  }

  async function handleCancelAppointment(item) {
    const ok = window.confirm(
      `¿Seguro que deseas cancelar la cita de ${item.cliente}?`
    );

    if (!ok) return;

    setErrorMsg('');

    try {
      await cancelOwnerAppointment({
        branchId: item.branchId || selectedBranchId,
        appointmentId: item.appointmentId,
      });

      await loadAgenda({ silent: true });
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo cancelar la cita.');
    }
  }

  function openCreateAppointment() {
    setEditingAppointment(null);
    setShowAppointmentModal(true);
  }

  function openEditAppointment(item) {
    setEditingAppointment(item);
    setShowAppointmentModal(true);
  }

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      loadAgenda();
    }
  }, [selectedBranchId, selectedDate]);

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[34px] border border-amber-400/15 bg-[linear-gradient(135deg,#090909_0%,#15110A_42%,#101827_100%)] p-6 text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(251,191,36,0.20),transparent_30%),radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.16),transparent_32%)]" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
              Agenda Web
            </div>

            <h2 className="mt-5 text-4xl font-black tracking-tight">
              Agenda del día
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">
              Revisa reservas por sede, crea citas, edítalas y valida pagos iniciales.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/35">
                  Sede
                </div>

                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="mt-1 bg-transparent text-sm font-black text-white outline-none"
                  disabled={loadingBranches}
                >
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id} className="text-neutral-950">
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <label className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/35">
                  Fecha
                </div>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="mt-1 bg-transparent text-sm font-black text-white outline-none [color-scheme:dark]"
                />
              </label>

              <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/35">
                  Día
                </div>
                <div className="mt-1 text-sm font-black">
                  {prettyDate(selectedDate)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => loadAgenda({ silent: true })}
              disabled={refreshing}
              className="rounded-2xl border border-white/10 bg-white/10 px-6 py-4 text-sm font-black text-white transition hover:bg-white/15 disabled:opacity-60"
            >
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>

            <button
              type="button"
              onClick={openCreateAppointment}
              disabled={!selectedBranch}
              className="rounded-2xl bg-amber-400 px-6 py-4 text-sm font-black text-neutral-950 shadow-[0_16px_35px_rgba(251,191,36,0.22)] transition hover:scale-[1.02] disabled:opacity-60"
            >
              Nueva cita
            </button>
          </div>
        </div>
      </section>

      {errorMsg && <ErrorBox message={errorMsg} />}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <StatBox label="Citas del día" value={items.length} />
        <StatBox label="Pendientes" value={pendingCount} tone="blue" />
        <StatBox label="En curso" value={inProgressCount} tone="violet" />
        <StatBox label="Finalizadas" value={doneCount} tone="green" />
        <StatBox label="Pagos por validar" value={pendingDepositCount} tone="amber" />
      </section>

      {loadingAgenda ? (
        <div className="rounded-[28px] border border-neutral-200 bg-white p-6 font-bold text-neutral-700 shadow-sm">
          Cargando agenda...
        </div>
      ) : items.length === 0 ? (
        <EmptyCard onCreate={openCreateAppointment} />
      ) : (
        <section className="space-y-4">
          {items.map((item) => (
            <AppointmentCard
              key={item.appointmentId}
              item={item}
              onEdit={openEditAppointment}
              onCancel={handleCancelAppointment}
              onAttend={handleAttendAppointment}
              onApproveDeposit={(agendaItem) =>
                handleValidateDeposit(agendaItem, true)
              }
              onRejectDeposit={(agendaItem) =>
                handleValidateDeposit(agendaItem, false)
              }
            />
          ))}
        </section>
      )}

      {showAppointmentModal && selectedBranch && (
        <AppointmentFormModal
          branch={selectedBranch}
          selectedDate={selectedDate}
          appointment={editingAppointment}
          onClose={() => {
            setShowAppointmentModal(false);
            setEditingAppointment(null);
          }}
          onSaved={() => {
            setShowAppointmentModal(false);
            setEditingAppointment(null);
            loadAgenda({ silent: true });
          }}
        />
      )}
    </div>
  );
}
