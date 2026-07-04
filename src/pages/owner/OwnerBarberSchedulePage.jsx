import { useEffect, useMemo, useState } from 'react';
import { PremiumErrorState } from '../../components/PremiumUi';

import { getOwnerBranches } from '../../api/ownerBranchesApi';
import { getOwnerBarbers } from '../../api/ownerBarbersApi';
import {
  createOwnerBarberTimeBlock,
  deleteOwnerBarberTimeBlock,
  getOwnerBarberAvailability,
  getOwnerBarberTimeBlocks,
  saveOwnerBarberAvailability,
} from '../../api/ownerBarberAvailabilityApi';

const DAYS = [
  { id: 1, name: 'Lunes' },
  { id: 2, name: 'Martes' },
  { id: 3, name: 'Miércoles' },
  { id: 4, name: 'Jueves' },
  { id: 5, name: 'Viernes' },
  { id: 6, name: 'Sábado' },
  { id: 7, name: 'Domingo' },
];

function todayInput() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function defaultDays() {
  return DAYS.map((day) => ({
    dayOfWeek: day.id,
    isWorking: day.id !== 7,
    startTime: '08:00',
    endTime: '21:00',
  }));
}

function getBarberId(barber) {
  return barber?.userId ?? barber?.id ?? barber?.barberId ?? barber?.barberUserId;
}

function barberName(barber) {
  return `${barber?.nombre || ''} ${barber?.apellido || ''}`.trim() || 'Barbero';
}

function getBranchId(branch) {
  return branch?.id ?? branch?.branchId;
}

function branchName(branch) {
  return branch?.nombre ?? branch?.name ?? branch?.branchName ?? 'Sede';
}

function prettyTime(value) {
  if (!value) return '--:--';
  const parts = String(value).split(':');
  return `${String(parts[0] || '00').padStart(2, '0')}:${String(parts[1] || '00').padStart(2, '0')}`;
}

function ErrorBox({ message }) {
  return <PremiumErrorState message={message} />;
}
function StatCard({ title, value, helper, tone = 'default' }) {
  const styles = {
    default: 'border-neutral-200 bg-white text-neutral-950',
    dark: 'border-neutral-900 bg-neutral-950 text-white',
    gold: 'border-amber-200 bg-amber-50 text-amber-800',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    red: 'border-red-200 bg-red-50 text-red-800',
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
  };

  return (
    <div className={`rounded-[28px] border p-5 shadow-[0_12px_32px_rgba(15,23,42,0.045)] ${styles[tone]}`}>
      <div className={tone === 'dark' ? 'text-sm font-bold text-white/55' : 'text-sm font-bold text-neutral-500'}>
        {title}
      </div>

      <div className={tone === 'dark' ? 'mt-2 text-2xl font-black text-white' : 'mt-2 text-2xl font-black'}>
        {value}
      </div>

      {helper && (
        <div className={tone === 'dark' ? 'mt-1 text-xs text-white/45' : 'mt-1 text-xs text-neutral-500'}>
          {helper}
        </div>
      )}
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-neutral-700">{label}</span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-bold text-neutral-950 outline-none transition focus:border-amber-400"
      >
        {options.map((option) => (
          <option key={`${option.value}-${option.label}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ScheduleDayRow({ day, onChange }) {
  const meta = DAYS.find((item) => item.id === day.dayOfWeek);

  return (
    <div className="rounded-[22px] border border-neutral-200 bg-white p-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
        <div>
          <div className="text-base font-black text-neutral-950">
            {meta?.name || 'Día'}
          </div>
          <div className="mt-1 text-xs font-bold text-neutral-500">
            {day.isWorking ? 'Día laborable' : 'Descanso'}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onChange({ ...day, isWorking: !day.isWorking })}
          className={`rounded-2xl px-4 py-3 text-sm font-black ${
            day.isWorking
              ? 'bg-emerald-500 text-white'
              : 'bg-neutral-200 text-neutral-700'
          }`}
        >
          {day.isWorking ? 'Trabaja' : 'Descanso'}
        </button>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-[0.14em] text-neutral-400">
            Desde
          </span>
          <input
            type="time"
            value={day.startTime || '08:00'}
            disabled={!day.isWorking}
            onChange={(event) => onChange({ ...day, startTime: event.target.value })}
            className="mt-1 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 font-black text-neutral-950 outline-none disabled:opacity-40"
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-[0.14em] text-neutral-400">
            Hasta
          </span>
          <input
            type="time"
            value={day.endTime || '21:00'}
            disabled={!day.isWorking}
            onChange={(event) => onChange({ ...day, endTime: event.target.value })}
            className="mt-1 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 font-black text-neutral-950 outline-none disabled:opacity-40"
          />
        </label>
      </div>
    </div>
  );
}

export default function OwnerBarberSchedulePage() {
  const [branches, setBranches] = useState([]);
  const [barbers, setBarbers] = useState([]);

  const [branchId, setBranchId] = useState('');
  const [barberId, setBarberId] = useState('');

  const [days, setDays] = useState(defaultDays());
  const [blocks, setBlocks] = useState([]);

  const [blockDate, setBlockDate] = useState(todayInput());
  const [blockStart, setBlockStart] = useState('08:00');
  const [blockEnd, setBlockEnd] = useState('09:00');
  const [allDay, setAllDay] = useState(false);
  const [reason, setReason] = useState('');

  const [loading, setLoading] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [savingBlock, setSavingBlock] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedBranch = useMemo(() => {
    return branches.find((item) => String(getBranchId(item)) === String(branchId));
  }, [branches, branchId]);

  const selectedBarber = useMemo(() => {
    return barbers.find((item) => String(getBarberId(item)) === String(barberId));
  }, [barbers, barberId]);

  const workingDaysCount = useMemo(() => {
    return days.filter((item) => item.isWorking).length;
  }, [days]);

  async function loadInitial() {
    setLoading(true);
    setErrorMsg('');

    try {
      const branchData = await getOwnerBranches({ onlyActive: true });
      const normalizedBranches = Array.isArray(branchData) ? branchData : [];

      setBranches(normalizedBranches);

      const firstBranchId = getBranchId(normalizedBranches[0]);

      if (firstBranchId) {
        setBranchId(String(firstBranchId));
      }
    } catch (error) {
      setErrorMsg(error.message || 'No se pudieron cargar las sedes.');
    } finally {
      setLoading(false);
    }
  }

  async function loadBarbersByBranch(currentBranchId) {
    if (!currentBranchId) {
      setBarbers([]);
      setBarberId('');
      return;
    }

    setErrorMsg('');

    try {
      const data = await getOwnerBarbers({ branchId: currentBranchId });
      const list = Array.isArray(data) ? data.filter((item) => item.activo !== false) : [];

      setBarbers(list);

      const firstBarberId = getBarberId(list[0]);
      setBarberId(firstBarberId ? String(firstBarberId) : '');
    } catch (error) {
      setErrorMsg(error.message || 'No se pudieron cargar los barberos.');
      setBarbers([]);
      setBarberId('');
    }
  }

  async function loadSchedule() {
    if (!branchId || !barberId) {
      setDays(defaultDays());
      setBlocks([]);
      return;
    }

    setLoadingSchedule(true);
    setErrorMsg('');

    try {
      const [availabilityData, blockData] = await Promise.all([
        getOwnerBarberAvailability({
          branchId,
          barberUserId: barberId,
        }),
        getOwnerBarberTimeBlocks({
          branchId,
          barberUserId: barberId,
        }),
      ]);

      const availabilityList = Array.isArray(availabilityData) ? availabilityData : [];

      if (availabilityList.length === 0) {
        setDays(defaultDays());
      } else {
        const map = new Map(
          availabilityList.map((item) => [
            Number(item.dayOfWeek),
            {
              dayOfWeek: Number(item.dayOfWeek),
              isWorking: item.isWorking === true,
              startTime: prettyTime(item.startTime || '08:00'),
              endTime: prettyTime(item.endTime || '21:00'),
            },
          ])
        );

        setDays(
          DAYS.map((day) => map.get(day.id) || defaultDays().find((item) => item.dayOfWeek === day.id))
        );
      }

      setBlocks(Array.isArray(blockData) ? blockData : []);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo cargar el horario del barbero.');
      setDays(defaultDays());
      setBlocks([]);
    } finally {
      setLoadingSchedule(false);
    }
  }

  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    loadBarbersByBranch(branchId);
  }, [branchId]);

  useEffect(() => {
    loadSchedule();
  }, [branchId, barberId]);

  function updateDay(updatedDay) {
    setDays((prev) =>
      prev.map((item) => (item.dayOfWeek === updatedDay.dayOfWeek ? updatedDay : item))
    );
  }

  async function handleSaveSchedule() {
    if (!branchId || !barberId) {
      setErrorMsg('Selecciona una sede y un barbero.');
      return;
    }

    for (const day of days) {
      if (day.isWorking && (!day.startTime || !day.endTime)) {
        setErrorMsg('Los días laborables deben tener hora inicio y fin.');
        return;
      }

      if (day.isWorking && day.startTime >= day.endTime) {
        setErrorMsg(`La hora inicio debe ser menor a la hora fin en ${DAYS.find((item) => item.id === day.dayOfWeek)?.name}.`);
        return;
      }
    }

    setSavingSchedule(true);
    setErrorMsg('');

    try {
      await saveOwnerBarberAvailability({
        branchId,
        barberUserId: barberId,
        days: days.map((item) => ({
          dayOfWeek: item.dayOfWeek,
          isWorking: item.isWorking,
          startTime: item.isWorking ? item.startTime : '00:00',
          endTime: item.isWorking ? item.endTime : '00:00',
        })),
      });

      await loadSchedule();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo guardar el horario.');
    } finally {
      setSavingSchedule(false);
    }
  }

  async function handleCreateBlock() {
    if (!branchId || !barberId) {
      setErrorMsg('Selecciona una sede y un barbero.');
      return;
    }

    if (!blockDate) {
      setErrorMsg('Selecciona una fecha para el bloqueo.');
      return;
    }

    if (!allDay && blockStart >= blockEnd) {
      setErrorMsg('La hora inicio del bloqueo debe ser menor a la hora fin.');
      return;
    }

    setSavingBlock(true);
    setErrorMsg('');

    try {
      await createOwnerBarberTimeBlock({
        branchId,
        barberUserId: barberId,
        blockDate,
        startTime: allDay ? null : blockStart,
        endTime: allDay ? null : blockEnd,
        allDay,
        reason: reason.trim() || null,
      });

      setReason('');
      setAllDay(false);
      setBlockDate(todayInput());
      setBlockStart('08:00');
      setBlockEnd('09:00');

      await loadSchedule();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo crear el bloqueo.');
    } finally {
      setSavingBlock(false);
    }
  }

  async function handleDeleteBlock(blockId) {
    const ok = window.confirm('¿Quieres eliminar este bloqueo?');
    if (!ok) return;

    setErrorMsg('');

    try {
      await deleteOwnerBarberTimeBlock({
        branchId,
        blockId,
      });

      await loadSchedule();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo eliminar el bloqueo.');
    }
  }

  const branchOptions = [
    { value: '', label: 'Selecciona una sede' },
    ...branches.map((branch) => ({
      value: String(getBranchId(branch)),
      label: branchName(branch),
    })),
  ];

  const barberOptions = [
    { value: '', label: 'Selecciona un barbero' },
    ...barbers.map((barber) => ({
      value: String(getBarberId(barber)),
      label: barberName(barber),
    })),
  ];

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[34px] border border-amber-400/15 bg-[linear-gradient(135deg,#080808_0%,#111827_48%,#15110A_100%)] p-6 text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(251,191,36,0.22),transparent_30%),radial-gradient(circle_at_100%_0%,rgba(16,185,129,0.16),transparent_34%)]" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
              Horarios de atención
            </div>

            <h2 className="mt-5 text-4xl font-black tracking-tight">
              Disponibilidad de barberos
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65">
              Define días de trabajo, horas disponibles y bloqueos especiales
              para controlar correctamente las reservas.
            </p>
          </div>

          <button
            type="button"
            onClick={loadSchedule}
            disabled={loadingSchedule || !barberId}
            className="rounded-2xl bg-amber-400 px-5 py-4 text-sm font-black text-neutral-950 transition hover:scale-[1.01] disabled:opacity-60"
          >
            {loadingSchedule ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Sede"
          value={selectedBranch ? branchName(selectedBranch) : '-'}
          helper="Sucursal seleccionada"
          tone="dark"
        />

        <StatCard
          title="Barbero"
          value={selectedBarber ? barberName(selectedBarber) : '-'}
          helper="Profesional seleccionado"
          tone="gold"
        />

        <StatCard
          title="Días activos"
          value={workingDaysCount}
          helper="Días laborables por semana"
          tone="green"
        />

        <StatCard
          title="Bloqueos"
          value={blocks.length}
          helper="Fechas u horas bloqueadas"
          tone={blocks.length > 0 ? 'red' : 'default'}
        />
      </section>

      <section className="rounded-[30px] border border-neutral-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.045)]">
        <div className="grid gap-4 lg:grid-cols-2">
          <SelectField
            label="Sede"
            value={branchId}
            onChange={setBranchId}
            options={branchOptions}
          />

          <SelectField
            label="Barbero"
            value={barberId}
            onChange={setBarberId}
            options={barberOptions}
          />
        </div>
      </section>

      <ErrorBox message={errorMsg} />

      {loading ? (
        <div className="rounded-[30px] border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="h-3 w-52 animate-pulse rounded-full bg-neutral-200" />
          <div className="mt-5 h-80 animate-pulse rounded-[24px] bg-neutral-100" />
        </div>
      ) : !branchId || !barberId ? (
        <div className="rounded-[30px] border border-dashed border-neutral-300 bg-white/70 p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-3xl">
            🕒
          </div>

          <h3 className="mt-4 text-xl font-black text-neutral-950">
            Selecciona una sede y un barbero
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-neutral-500">
            Necesitamos saber a qué sede pertenece el barbero para cargar y guardar su horario.
          </p>
        </div>
      ) : (
        <>
          <section className="rounded-[30px] border border-neutral-200 bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h3 className="text-xl font-black text-neutral-950">
                  Horario semanal
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Activa los días que trabaja el barbero y define su rango de atención.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveSchedule}
                disabled={savingSchedule || loadingSchedule}
                className="rounded-2xl bg-neutral-950 px-5 py-4 text-sm font-black text-white transition hover:scale-[1.01] disabled:opacity-60"
              >
                {savingSchedule ? 'Guardando...' : 'Guardar horario'}
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              {days.map((day) => (
                <ScheduleDayRow
                  key={day.dayOfWeek}
                  day={day}
                  onChange={updateDay}
                />
              ))}
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[30px] border border-neutral-200 bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,0.05)]">
              <h3 className="text-xl font-black text-neutral-950">
                Crear bloqueo
              </h3>

              <p className="mt-1 text-sm leading-6 text-neutral-500">
                Bloquea un día completo o un rango de horas específico para este barbero.
              </p>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-sm font-black text-neutral-700">Fecha</span>
                  <input
                    type="date"
                    value={blockDate}
                    onChange={(event) => setBlockDate(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-bold text-neutral-950 outline-none focus:border-amber-400"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setAllDay((prev) => !prev)}
                  className={`w-full rounded-2xl px-5 py-4 text-sm font-black ${
                    allDay
                      ? 'bg-amber-500 text-white'
                      : 'border border-neutral-200 bg-neutral-50 text-neutral-700'
                  }`}
                >
                  {allDay ? 'Bloquear todo el día' : 'Bloqueo por horas'}
                </button>

                {!allDay && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-black text-neutral-700">Hora inicio</span>
                      <input
                        type="time"
                        value={blockStart}
                        onChange={(event) => setBlockStart(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-bold text-neutral-950 outline-none focus:border-amber-400"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-black text-neutral-700">Hora fin</span>
                      <input
                        type="time"
                        value={blockEnd}
                        onChange={(event) => setBlockEnd(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-bold text-neutral-950 outline-none focus:border-amber-400"
                      />
                    </label>
                  </div>
                )}

                <label className="block">
                  <span className="text-sm font-black text-neutral-700">Motivo opcional</span>
                  <input
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Ej. Descanso, permiso, capacitación"
                    className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-bold text-neutral-950 outline-none placeholder:text-neutral-400 focus:border-amber-400"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleCreateBlock}
                  disabled={savingBlock}
                  className="w-full rounded-2xl bg-amber-500 px-5 py-4 text-sm font-black text-white transition hover:scale-[1.01] disabled:opacity-60"
                >
                  {savingBlock ? 'Creando...' : 'Crear bloqueo'}
                </button>
              </div>
            </div>

            <div className="rounded-[30px] border border-neutral-200 bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,0.05)]">
              <h3 className="text-xl font-black text-neutral-950">
                Bloqueos registrados
              </h3>

              <p className="mt-1 text-sm leading-6 text-neutral-500">
                Fechas u horarios donde este barbero no estará disponible.
              </p>

              <div className="mt-5 space-y-3">
                {blocks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm font-bold text-neutral-500">
                    No hay bloqueos registrados.
                  </div>
                ) : (
                  blocks.map((block) => (
                    <div
                      key={block.id}
                      className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-sm font-black text-neutral-950">
                            {block.blockDate}
                          </div>

                          <div className="mt-1 text-sm font-bold text-neutral-600">
                            {block.allDay
                              ? 'Todo el día'
                              : `${prettyTime(block.startTime)} - ${prettyTime(block.endTime)}`}
                          </div>

                          {block.reason && (
                            <div className="mt-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-neutral-500">
                              {block.reason}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteBlock(block.id)}
                          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-black text-red-700 hover:bg-red-100"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}