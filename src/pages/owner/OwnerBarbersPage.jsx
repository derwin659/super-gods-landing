import { useEffect, useMemo, useState } from 'react';
import { PremiumErrorState, premiumConfirm } from '../../components/PremiumUi';
import {
  createOwnerBarber,
  deleteOwnerBarberPhoto,
  getOwnerBarberDeletionPreview,
  deleteOwnerBarber,
  getOwnerBarbers,
  getOwnerBranchesForBarbers,
  getOwnerBarberCompensation,
  getBarberServiceAssignment,
  updateBarberServiceAssignment,
  resetBarberServiceAssignment,
  getBarberServiceCommissions,
  updateBarberServiceCommissions,
  getOwnerProfessionalProfile,
  updateOwnerProfessionalProfile,
  disableOwnerProfessionalProfile,
  updateOwnerBarber,
  updateOwnerBarberStatus,
  updateOwnerBarberCompensation,
  uploadOwnerBarberPhoto,
} from '../../api/ownerBarbersApi';
import { getOwnerServices } from '../../api/ownerServicesApi';
import { formatTenantMoney, getTenantCurrencySymbol } from '../../utils/tenantMoney';

function formatMoney(value) {
  return formatTenantMoney(value);
}

function n(value) {
  return Number(value || 0);
}

function getBarberId(item) {
  return item?.userId ?? item?.id ?? item?.barberId ?? item?.barberUserId;
}

function fullName(item) {
  return `${item?.nombre || ''} ${item?.apellido || ''}`.trim() || 'Barbero';
}

function initials(item) {
  return fullName(item)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function getBranchId(branch) {
  return branch?.id ?? branch?.branchId;
}

function getBranchName(branch) {
  return branch?.name || branch?.nombre || branch?.branchName || 'Sede ' + getBranchId(branch);
}

function barberBranchIds(barber) {
  const raw = Array.isArray(barber?.branchIds) && barber.branchIds.length > 0
    ? barber.branchIds
    : barber?.branchId
      ? [barber.branchId]
      : [];

  return raw.map((id) => String(id));
}

function barberBranchLabel(barber) {
  const names = Array.isArray(barber?.branchNombres) && barber.branchNombres.length > 0
    ? barber.branchNombres
    : barber?.branchNombre
      ? [barber.branchNombre]
      : [];

  if (names.length > 0) return names.join(', ');
  const ids = barberBranchIds(barber);
  return ids.length > 0 ? ids.join(', ') : 'Sin sede';
}

function salaryFrequencyLabel(value) {
  const code = String(value || '').toUpperCase();

  const labels = {
    WEEKLY: 'Semanal',
    BIWEEKLY: 'Quincenal',
    MONTHLY: 'Mensual',
  };

  return labels[code] || 'Mensual';
}

function compensationLabel(item) {
  if (item?.salaryMode) {
    return `${salaryFrequencyLabel(item.salaryFrequency)} · ${formatMoney(item.fixedSalaryAmount)}`;
  }

  return `Comisión · ${n(item?.commissionPercentage).toFixed(2)}%`;
}

function ErrorBox({ message }) {
  return <PremiumErrorState message={message} />;
}
function ModalShell({ title, subtitle, children, onClose, maxWidth = 'max-w-4xl' }) {
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
            type="button"
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
  placeholder,
  type = 'text',
  step,
  prefix,
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-neutral-700">{label}</span>

      <div className="mt-2 flex overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 focus-within:border-amber-400">
        {prefix && (
          <span className="flex items-center border-r border-neutral-200 px-4 text-sm font-black text-neutral-500">
            {prefix}
          </span>
        )}

        <input
          type={type}
          step={step}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent px-4 py-4 font-bold text-neutral-950 outline-none placeholder:text-neutral-400"
        />
      </div>
    </label>
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

function BarberAvatar({ barber }) {
  const photoUrl = String(barber?.photoUrl || '').trim();

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={fullName(barber)}
        className="h-16 w-16 rounded-2xl border border-neutral-200 object-cover"
      />
    );
  }

  return (
    <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border text-lg font-black ${
      barber.activo === false
        ? 'border-red-100 bg-red-50 text-red-700'
        : 'border-amber-100 bg-amber-50 text-amber-700'
    }`}>
      {initials(barber)}
    </div>
  );
}

function BarberFormModal({ barber, branches, onClose, onSaved }) {
  const isEdit = Boolean(getBarberId(barber));

  const [nombre, setNombre] = useState(barber?.nombre || '');
  const [apellido, setApellido] = useState(barber?.apellido || '');
  const [email, setEmail] = useState(barber?.email || '');
  const [phone, setPhone] = useState(barber?.phone || '');
  const [password, setPassword] = useState('');
  const initialBranchIds = barberBranchIds(barber);
  const fallbackBranchId = branches[0] ? String(getBranchId(branches[0])) : '';
  const [selectedBranchIds, setSelectedBranchIds] = useState(
    initialBranchIds.length > 0 ? initialBranchIds : fallbackBranchId ? [fallbackBranchId] : []
  );
  const [activo, setActivo] = useState(barber?.activo !== false);
  const [canSell, setCanSell] = useState(barber?.canSell !== false);

  const defaultCompensation = {
    salaryMode: barber?.salaryMode === true,
    commissionPercentage: barber?.commissionPercentage ? String(barber.commissionPercentage) : '',
    fixedSalaryAmount: barber?.fixedSalaryAmount ? String(barber.fixedSalaryAmount) : '',
    salaryFrequency: barber?.salaryFrequency || 'WEEKLY',
    salaryStartDate: barber?.salaryStartDate || '',
  };
  const [branchCompensations, setBranchCompensations] = useState(() =>
    Object.fromEntries(selectedBranchIds.map((id) => [String(id), { ...defaultCompensation }]))
  );

  const [photoFile, setPhotoFile] = useState(null);
  const [removeCurrentPhoto, setRemoveCurrentPhoto] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const previewUrl = photoFile
    ? URL.createObjectURL(photoFile)
    : removeCurrentPhoto
      ? ''
      : String(barber?.photoUrl || '').trim();

  const allBranchesSelected = branches.length > 0 && selectedBranchIds.length === branches.length;

  useEffect(() => {
    let cancelled = false;
    const selected = selectedBranchIds.map(String);

    setBranchCompensations((current) => {
      const next = { ...current };
      selected.forEach((id) => {
        if (!next[id]) next[id] = { ...defaultCompensation };
      });
      Object.keys(next).forEach((id) => {
        if (!selected.includes(id)) delete next[id];
      });
      return next;
    });

    if (!isEdit || selected.length === 0) return () => { cancelled = true; };

    Promise.all(selected.map(async (id) => {
      const item = await getOwnerBarberCompensation({
        barberId: getBarberId(barber),
        branchId: Number(id),
      });
      return [id, {
        salaryMode: item?.salaryMode === true,
        commissionPercentage: item?.commissionPercentage != null ? String(item.commissionPercentage) : '',
        fixedSalaryAmount: item?.fixedSalaryAmount != null ? String(item.fixedSalaryAmount) : '',
        salaryFrequency: item?.salaryFrequency || 'WEEKLY',
        salaryStartDate: item?.salaryStartDate || '',
      }];
    })).then((entries) => {
      if (!cancelled) setBranchCompensations((current) => ({ ...current, ...Object.fromEntries(entries) }));
    }).catch((error) => {
      if (!cancelled) setErrorMsg(error.message || 'No se pudieron cargar las comisiones por sede.');
    });

    return () => { cancelled = true; };
  }, [isEdit, selectedBranchIds.join(','), barber]);

  function updateBranchCompensation(branchId, patch) {
    setBranchCompensations((current) => ({
      ...current,
      [String(branchId)]: {
        ...defaultCompensation,
        ...(current[String(branchId)] || {}),
        ...patch,
      },
    }));
  }

  function toggleBranch(id, checked) {
    setSelectedBranchIds((current) => {
      const next = new Set(current.map((value) => String(value)));
      if (checked) next.add(String(id));
      else next.delete(String(id));
      return [...next];
    });
  }

  function toggleAllBranches(checked) {
    setSelectedBranchIds(checked ? branches.map((branch) => String(getBranchId(branch))) : []);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMsg('');

    if (!nombre.trim()) {
      setErrorMsg('Ingresa el nombre del barbero.');
      return;
    }

    if (!apellido.trim()) {
      setErrorMsg('Ingresa el apellido del barbero.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Ingresa un correo válido.');
      return;
    }

    if (!isEdit && password.trim().length < 4) {
      setErrorMsg('Ingresa una contraseña inicial de al menos 4 caracteres.');
      return;
    }

    if (selectedBranchIds.length === 0) {
      setErrorMsg('Selecciona al menos una sede.');
      return;
    }

    for (const branchId of selectedBranchIds) {
      const compensation = branchCompensations[String(branchId)] || defaultCompensation;
      const branch = branches.find((item) => String(getBranchId(item)) === String(branchId));
      const branchName = branch ? getBranchName(branch) : 'la sede seleccionada';

      if (compensation.salaryMode) {
        const salary = Number(String(compensation.fixedSalaryAmount).replace(',', '.'));
        if (Number.isNaN(salary) || salary <= 0) {
          setErrorMsg(`Ingresa un sueldo fijo válido para ${branchName}.`);
          return;
        }
        if (!compensation.salaryFrequency) {
          setErrorMsg(`Selecciona la periodicidad del sueldo para ${branchName}.`);
          return;
        }
      } else {
        const commission = Number(String(compensation.commissionPercentage).replace(',', '.'));
        if (Number.isNaN(commission) || commission <= 0 || commission > 100) {
          setErrorMsg(`La comisión de ${branchName} debe estar entre 0 y 100.`);
          return;
        }
      }
    }

    setSaving(true);

    try {
      const primaryCompensation = branchCompensations[String(selectedBranchIds[0])] || defaultCompensation;
      const payload = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        branchId: Number(selectedBranchIds[0]),
        branchIds: selectedBranchIds.map((id) => Number(id)),
        allBranches: selectedBranchIds.length === branches.length,
        activo,
        canSell,
        salaryMode: primaryCompensation.salaryMode,
        commissionPercentage: primaryCompensation.salaryMode
          ? null
          : Number(String(primaryCompensation.commissionPercentage).replace(',', '.')),
        salaryFrequency: primaryCompensation.salaryMode ? primaryCompensation.salaryFrequency : null,
        fixedSalaryAmount: primaryCompensation.salaryMode
          ? Number(String(primaryCompensation.fixedSalaryAmount).replace(',', '.'))
          : null,
        salaryStartDate: primaryCompensation.salaryMode && primaryCompensation.salaryStartDate
          ? primaryCompensation.salaryStartDate
          : null,
      };

      if (!isEdit) {
        payload.password = password.trim();
      }

      let saved = isEdit
        ? await updateOwnerBarber({
            barberId: getBarberId(barber),
            payload,
          })
        : await createOwnerBarber(payload);

      const savedId = getBarberId(saved);

      await Promise.all(selectedBranchIds.map((branchId) => {
        const compensation = branchCompensations[String(branchId)] || defaultCompensation;
        return updateOwnerBarberCompensation({
          barberId: savedId,
          branchId: Number(branchId),
          payload: {
            salaryMode: compensation.salaryMode,
            commissionPercentage: compensation.salaryMode
              ? null
              : Number(String(compensation.commissionPercentage).replace(',', '.')),
            salaryFrequency: compensation.salaryMode ? compensation.salaryFrequency : null,
            fixedSalaryAmount: compensation.salaryMode
              ? Number(String(compensation.fixedSalaryAmount).replace(',', '.'))
              : null,
            salaryStartDate: compensation.salaryMode && compensation.salaryStartDate
              ? compensation.salaryStartDate
              : null,
          },
        });
      }));

      if (removeCurrentPhoto && isEdit && barber?.photoUrl) {
        saved = await deleteOwnerBarberPhoto(getBarberId(barber));
      }

      if (photoFile) {
        saved = await uploadOwnerBarberPhoto({
          barberId: savedId,
          file: photoFile,
        });
      }

      onSaved(saved);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo guardar el barbero.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title={isEdit ? 'Editar barbero' : 'Nuevo barbero'}
      subtitle="Equipo"
      onClose={onClose}
      maxWidth="max-w-5xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <ErrorBox message={errorMsg} />

        <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-5">
          <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
            <div>
              <div className="flex h-44 w-full items-center justify-center overflow-hidden rounded-[24px] border border-neutral-200 bg-white">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Vista previa"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-neutral-950 text-white">
                    <div className="text-3xl">💈</div>
                    <div className="mt-2 text-sm font-black">Sin foto</div>
                    <div className="mt-1 text-xs text-white/50">Agrega una imagen</div>
                  </div>
                )}
              </div>

              <label className="mt-3 block">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setPhotoFile(file);
                    setRemoveCurrentPhoto(false);
                  }}
                />

                <span className="block cursor-pointer rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-center text-sm font-black text-neutral-700 hover:bg-neutral-100">
                  {previewUrl ? 'Cambiar foto' : 'Subir foto'}
                </span>
              </label>

              {previewUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFile(null);
                    setRemoveCurrentPhoto(true);
                  }}
                  className="mt-2 w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 hover:bg-red-100"
                >
                  Quitar foto
                </button>
              )}

              <p className="mt-3 text-xs font-bold leading-5 text-neutral-500">
                La foto se usa en agenda, reservas, ventas y reportes.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-black text-neutral-950">
                  Datos personales
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <InputField
                    label="Nombre"
                    value={nombre}
                    onChange={setNombre}
                    placeholder="Ej. Carlos"
                  />

                  <InputField
                    label="Apellido"
                    value={apellido}
                    onChange={setApellido}
                    placeholder="Ej. Ramírez"
                  />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <InputField
                    label="Correo"
                    value={email}
                    onChange={setEmail}
                    placeholder="barbero@email.com"
                    type="email"
                  />

                  <InputField
                    label="Teléfono"
                    value={phone}
                    onChange={setPhone}
                    placeholder="987654321"
                  />
                </div>

                {!isEdit && (
                  <div className="mt-4">
                    <InputField
                      label="Contraseña inicial"
                      value={password}
                      onChange={setPassword}
                      placeholder="Mínimo 4 caracteres"
                      type="password"
                    />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-black text-neutral-950">
                  Asignación
                </h3>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-white p-3">
                      <input
                        type="checkbox"
                        checked={allBranchesSelected}
                        onChange={(event) => toggleAllBranches(event.target.checked)}
                        className="mt-1 h-5 w-5 accent-amber-500"
                      />
                      <span>
                        <span className="block text-sm font-black text-neutral-950">Todas las sedes</span>
                        <span className="mt-1 block text-xs font-bold text-neutral-500">
                          Puede vender y aparecer en agenda en cualquier sede.
                        </span>
                      </span>
                    </label>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {branches.map((branch) => {
                        const id = String(getBranchId(branch));
                        return (
                          <label key={id} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-sm font-black text-neutral-800">
                            <input
                              type="checkbox"
                              checked={selectedBranchIds.includes(id)}
                              onChange={(event) => toggleBranch(id, event.target.checked)}
                              className="h-5 w-5 accent-amber-500"
                            />
                            <span>{getBranchName(branch)}</span>
                          </label>
                        );
                      })}
                    </div>

                    <div className={'mt-3 text-xs font-black ' + (selectedBranchIds.length === 0 ? 'text-red-600' : 'text-neutral-500')}>
                      {selectedBranchIds.length === 0
                        ? 'Selecciona al menos una sede.'
                        : 'Sedes seleccionadas: ' + selectedBranchIds.length}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-black text-neutral-950">
                          Estado
                        </div>
                        <div className="mt-1 text-xs font-bold text-neutral-500">
                          {activo ? 'Puede operar en el sistema.' : 'No podrá operar.'}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActivo((prev) => !prev)}
                        className={`rounded-2xl px-4 py-3 text-sm font-black ${
                          activo
                            ? 'bg-emerald-500 text-white'
                            : 'bg-neutral-950 text-white'
                        }`}
                      >
                        {activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-black text-neutral-950">
                          Permiso de venta
                        </div>
                        <div className="mt-1 text-xs font-bold text-neutral-500">
                          {canSell
                            ? 'Puede registrar ventas desde su cuenta.'
                            : 'No podrá registrar ventas ni cobrar.'}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setCanSell((prev) => !prev)}
                        className={`rounded-2xl px-4 py-3 text-sm font-black ${
                          canSell
                            ? 'bg-emerald-500 text-white'
                            : 'bg-neutral-950 text-white'
                        }`}
                      >
                        {canSell ? 'Puede vender' : 'Sin venta'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black text-neutral-950">
                  Modelo de pago por sede
                </h3>
                <p className="mt-1 text-xs font-bold text-neutral-500">
                  Cada sede puede tener un porcentaje o sueldo diferente.
                </p>

                <div className="mt-4 space-y-4">
                  {selectedBranchIds.map((branchId) => {
                    const branch = branches.find((item) => String(getBranchId(item)) === String(branchId));
                    const compensation = branchCompensations[String(branchId)] || defaultCompensation;
                    return (
                      <div key={branchId} className="rounded-3xl border border-neutral-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">Sede</div>
                            <div className="mt-1 font-black text-neutral-950">{branch ? getBranchName(branch) : `Sede ${branchId}`}</div>
                          </div>
                          <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Configuración independiente</div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => updateBranchCompensation(branchId, { salaryMode: false })}
                            className={`rounded-2xl px-4 py-3 text-sm font-black ${!compensation.salaryMode ? 'bg-neutral-950 text-white' : 'border border-neutral-200 bg-neutral-50 text-neutral-700'}`}
                          >
                            Por comisión
                          </button>
                          <button
                            type="button"
                            onClick={() => updateBranchCompensation(branchId, { salaryMode: true })}
                            className={`rounded-2xl px-4 py-3 text-sm font-black ${compensation.salaryMode ? 'bg-neutral-950 text-white' : 'border border-neutral-200 bg-neutral-50 text-neutral-700'}`}
                          >
                            Sueldo fijo
                          </button>
                        </div>

                        {!compensation.salaryMode ? (
                          <div className="mt-4">
                            <InputField
                              label="Porcentaje de comisión"
                              value={compensation.commissionPercentage}
                              onChange={(value) => updateBranchCompensation(branchId, { commissionPercentage: value })}
                              placeholder="Ej. 50"
                              type="number"
                              step="0.01"
                              prefix="%"
                            />
                          </div>
                        ) : (
                          <div className="mt-4 grid gap-4 sm:grid-cols-3">
                            <InputField
                              label="Sueldo fijo"
                              value={compensation.fixedSalaryAmount}
                              onChange={(value) => updateBranchCompensation(branchId, { fixedSalaryAmount: value })}
                              placeholder="Ej. 1200"
                              type="number"
                              step="0.01"
                              prefix={getTenantCurrencySymbol()}
                            />
                            <SelectField
                              label="Frecuencia"
                              value={compensation.salaryFrequency}
                              onChange={(value) => updateBranchCompensation(branchId, { salaryFrequency: value })}
                              options={[
                                { value: 'WEEKLY', label: 'Semanal' },
                                { value: 'BIWEEKLY', label: 'Quincenal' },
                                { value: 'MONTHLY', label: 'Mensual' },
                              ]}
                            />
                            <InputField
                              label="Inicio"
                              value={compensation.salaryStartDate}
                              onChange={(value) => updateBranchCompensation(branchId, { salaryStartDate: value })}
                              type="date"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          disabled={saving}
          className="w-full rounded-2xl bg-neutral-950 px-5 py-4 font-black text-white transition hover:scale-[1.01] disabled:opacity-60"
        >
          {saving
            ? 'Guardando...'
            : isEdit
              ? 'Guardar cambios'
              : 'Crear barbero'}
        </button>
      </form>
    </ModalShell>
  );
}

function ToggleConfirmModal({ barber, onCancel, onConfirm, saving }) {
  const active = barber?.activo !== false;

  return (
    <ModalShell
      title={active ? 'Desactivar barbero' : 'Activar barbero'}
      subtitle="Confirmación"
      onClose={onCancel}
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        <div className={`rounded-[28px] border p-5 ${
          active
            ? 'border-amber-200 bg-amber-50'
            : 'border-emerald-200 bg-emerald-50'
        }`}>
          <div className="text-3xl">
            {active ? '🙈' : '✅'}
          </div>

          <h3 className="mt-3 text-xl font-black text-neutral-950">
            {active ? 'Este barbero dejará de operar' : 'Este barbero volverá a operar'}
          </h3>

          <p className="mt-2 text-sm leading-6 text-neutral-600">
            {active
              ? `“${fullName(barber)}” no podrá atender nuevas ventas o reservas, pero seguirá en reportes e historial.`
              : `“${fullName(barber)}” volverá a estar disponible para operar.`}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 font-black text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className={`rounded-2xl px-5 py-4 font-black text-white disabled:opacity-60 ${
              active ? 'bg-neutral-950' : 'bg-emerald-500'
            }`}
          >
            {saving
              ? 'Guardando...'
              : active
                ? 'Sí, desactivar'
                : 'Sí, activar'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function BarberCard({ barber, onEdit, onToggle, onDeletePhoto, onServices, onCommissions, onDelete }) {
  const active = barber.activo !== false;

  return (
    <div className={`rounded-[30px] border bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,0.045)] ${
      active ? 'border-neutral-200' : 'border-red-200'
    }`}>
      {!active && (
        <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
          Barbero inactivo: no aparecerá para nuevas operaciones.
        </div>
      )}

      <div className="flex items-start gap-4">
        <BarberAvatar barber={barber} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-neutral-950">
              {fullName(barber)}
            </h3>

            <span className={`rounded-full px-3 py-1 text-[11px] font-black ${
              active
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-700'
            }`}>
              {active ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          <p className="mt-2 text-sm font-bold text-neutral-500">
            {barber.email || 'Sin correo'} · {barber.phone || 'Sin teléfono'}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-neutral-100 px-3 py-2 text-xs font-black text-neutral-700">
              {barberBranchLabel(barber)}
            </span>

            <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">
              {compensationLabel(barber)}
            </span>

            <span className={`rounded-full px-3 py-2 text-xs font-black ${
              barber.canSell === false
                ? 'bg-red-50 text-red-700'
                : 'bg-emerald-50 text-emerald-700'
            }`}>
              {barber.canSell === false ? 'Sin permiso de venta' : 'Puede vender'}
            </span>

            <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">
              ID {getBarberId(barber)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <button
          type="button"
          onClick={onServices}
          className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-800 hover:bg-amber-100"
        >Servicios que realiza</button>

        <button
          type="button"
          onClick={onCommissions}
          className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-black text-violet-800 transition hover:-translate-y-0.5 hover:bg-violet-100"
        >Comisiones por servicio</button>

        <button
          type="button"
          onClick={onEdit}
          className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-black text-neutral-700 hover:bg-neutral-100"
        >
          Editar
        </button>

        <button
          type="button"
          onClick={onToggle}
          className={`rounded-2xl px-4 py-3 text-sm font-black text-white ${
            active ? 'bg-neutral-950' : 'bg-emerald-500'
          }`}
        >
          {active ? 'Desactivar' : 'Activar'}
        </button>

        <button
          type="button"
          onClick={onDeletePhoto}
          disabled={!barber.photoUrl}
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Quitar foto
        </button>

        <button type="button" onClick={onDelete} className="rounded-2xl border border-red-300 bg-white px-4 py-3 text-sm font-black text-red-700 transition hover:-translate-y-0.5 hover:bg-red-50">
          Retirar profesional
        </button>
      </div>
    </div>
  );
}

function BarberServicesModal({ barber, branches, services, onClose }) {
  const assignedBranches = barberBranchIds(barber).map(String);
  const availableBranches = branches.filter((branch) => assignedBranches.includes(String(branch.id ?? branch.branchId)));
  const [branchId, setBranchId] = useState(String(availableBranches[0]?.id ?? availableBranches[0]?.branchId ?? ''));
  const [selected, setSelected] = useState([]);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!branchId) return;
    setLoading(true); setError('');
    getBarberServiceAssignment({ barberId: getBarberId(barber), branchId: Number(branchId) })
      .then((data) => { setConfigured(data?.configured === true); setSelected((data?.serviceIds || []).map(String)); })
      .catch((e) => setError(e.message || 'No se pudieron cargar los servicios.'))
      .finally(() => setLoading(false));
  }, [branchId]);
  async function save() {
    if (selected.length === 0) { setError('Selecciona al menos un servicio o usa Restablecer todos.'); return; }
    setSaving(true); setError('');
    try { await updateBarberServiceAssignment({ barberId: getBarberId(barber), branchId: Number(branchId), serviceIds: selected.map(Number) }); onClose(); }
    catch (e) { setError(e.message || 'No se pudo guardar.'); } finally { setSaving(false); }
  }
  async function reset() {
    setSaving(true); setError('');
    try { await resetBarberServiceAssignment({ barberId: getBarberId(barber), branchId: Number(branchId) }); onClose(); }
    catch (e) { setError(e.message || 'No se pudo restablecer.'); } finally { setSaving(false); }
  }
  return <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-6"><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[32px] bg-white p-6 shadow-2xl sm:rounded-[32px]">
    <div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-4"><div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-amber-300 bg-neutral-100 shadow-lg">{barber.photoUrl ? <img src={barber.photoUrl} alt={fullName(barber)} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center bg-[linear-gradient(135deg,#17131E,#3B2E49)] text-lg font-black text-amber-300">{initials(barber)}</div>}</div><div className="min-w-0"><div className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">Servicios por sede</div><h3 className="mt-2 truncate text-2xl font-black">{fullName(barber)}</h3><p className="mt-1 text-sm font-semibold text-neutral-500">Define qué servicios puede realizar en cada sede.</p></div></div><button onClick={onClose} className="rounded-full bg-neutral-100 px-4 py-3 font-black">×</button></div>
    <label className="mt-6 block text-sm font-black">Sede<select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 p-4 font-bold">{availableBranches.map((branch) => <option key={branch.id ?? branch.branchId} value={branch.id ?? branch.branchId}>{branch.name || branch.nombre || branch.branchName}</option>)}</select></label>
    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">{configured ? selected.length + ' servicios configurados para esta sede.' : 'Sin configuración: puede realizar todos los servicios activos.'}</div>
    {error && <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
    {loading ? <div className="p-10 text-center font-bold">Cargando...</div> : <div className="mt-5 grid gap-3 sm:grid-cols-2">{services.map((service) => { const id=String(service.id ?? service.serviceId); const checked=selected.includes(id); return <button type="button" key={id} onClick={() => setSelected((prev) => checked ? prev.filter((x) => x!==id) : [...prev,id])} className={'group flex items-center gap-3 rounded-2xl border p-3 text-left font-black transition ' + (checked ? 'border-amber-400 bg-amber-50 text-neutral-950 shadow-sm' : 'border-neutral-200 bg-white text-neutral-600 hover:border-amber-200')}><div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-100">{service.imageUrl ? <img src={service.imageUrl} alt={service.nombre || service.name} className="h-full w-full object-cover transition group-hover:scale-105" /> : <div className="grid h-full w-full place-items-center bg-[linear-gradient(135deg,#FFF7E0,#F5E6B8)] text-xl">✂</div>}<span className={'absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full text-[11px] ' + (checked ? 'bg-amber-400 text-neutral-950' : 'bg-white/90 text-transparent')}>{checked ? '✓' : '·'}</span></div><span className="leading-tight">{service.nombre || service.name}</span></button>; })}</div>}
    <div className="mt-6 flex flex-col gap-3 sm:flex-row"><button disabled={saving} onClick={save} className="flex-1 rounded-2xl bg-neutral-950 px-5 py-4 font-black text-white disabled:opacity-50">Guardar servicios</button><button disabled={saving} onClick={reset} className="rounded-2xl border border-neutral-200 px-5 py-4 font-black text-neutral-700 disabled:opacity-50">Restablecer todos</button></div>
  </div></div>;
}


function BarberCommissionsModal({ barber, branches, onClose }) {
  const assignedBranches = barberBranchIds(barber).map(String);
  const availableBranches = branches.filter((branch) => assignedBranches.includes(String(branch.id ?? branch.branchId)));
  const [branchId, setBranchId] = useState(String(availableBranches[0]?.id ?? availableBranches[0]?.branchId ?? ''));
  const [data, setData] = useState(null);
  const [overrides, setOverrides] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const branchName = availableBranches.find((branch) => String(branch.id ?? branch.branchId) === branchId)?.name
    || availableBranches.find((branch) => String(branch.id ?? branch.branchId) === branchId)?.nombre
    || 'Sede';

  useEffect(() => {
    if (!branchId) return;
    setLoading(true); setError('');
    getBarberServiceCommissions({ barberId: getBarberId(barber), branchId: Number(branchId) })
      .then((response) => {
        setData(response);
        const next = {};
        (response?.services || []).forEach((service) => {
          if (service.custom === true) next[String(service.serviceId)] = String(service.percentage ?? '');
        });
        setOverrides(next);
      })
      .catch((e) => setError(e.message || 'No se pudieron cargar las comisiones.'))
      .finally(() => setLoading(false));
  }, [branchId]);

  const visibleServices = (data?.services || []).filter((service) =>
    String(service.serviceName || '').toLowerCase().includes(search.trim().toLowerCase())
  );

  function personalize(service) {
    const id = String(service.serviceId);
    setOverrides((current) => ({ ...current, [id]: String(service.percentage ?? data?.defaultPercentage ?? 0) }));
  }

  function useDefault(serviceId) {
    setOverrides((current) => {
      const next = { ...current };
      delete next[String(serviceId)];
      return next;
    });
  }

  async function save() {
    const payload = {};
    for (const [serviceId, raw] of Object.entries(overrides)) {
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0 || value > 100) {
        setError('Cada porcentaje personalizado debe estar entre 0 y 100.');
        return;
      }
      payload[serviceId] = value;
    }
    setSaving(true); setError('');
    try {
      await updateBarberServiceCommissions({ barberId: getBarberId(barber), branchId: Number(branchId), servicePercentages: payload });
      onClose();
    } catch (e) {
      setError(e.message || 'No se pudieron guardar las comisiones.');
    } finally { setSaving(false); }
  }

  return <div className="fixed inset-0 z-[95] flex items-end justify-center bg-slate-950/70 backdrop-blur-md sm:items-center sm:p-6">
    <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-t-[36px] border border-white/10 bg-[#F7F6FA] shadow-[0_30px_100px_rgba(0,0,0,.45)] sm:rounded-[36px]">
      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_10%_0%,rgba(250,204,21,.22),transparent_34%),linear-gradient(135deg,#0B0910,#24172F_55%,#111827)] p-6 text-white sm:p-8">
        <div className="flex items-start justify-between gap-5">
          <div className="flex min-w-0 items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-amber-300/80 bg-white/10 shadow-xl">
              {barber.photoUrl ? <img src={barber.photoUrl} alt={fullName(barber)} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-xl font-black text-amber-300">{initials(barber)}</div>}
            </div>
            <div className="min-w-0"><div className="text-[11px] font-black uppercase tracking-[.24em] text-amber-300">Esquema premium de pago</div><h3 className="mt-2 truncate text-2xl font-black sm:text-3xl">{fullName(barber)}</h3><p className="mt-1 text-sm font-semibold text-white/60">Configura excepciones sin perder la comisión general.</p></div>
          </div>
          <button type="button" onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/10 text-xl font-black hover:bg-white/20">×</button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="text-xs font-black uppercase tracking-[.16em] text-white/60">Sede
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/15 bg-white/10 p-4 text-sm font-black text-white outline-none [color-scheme:dark]">{availableBranches.map((branch) => <option key={branch.id ?? branch.branchId} value={branch.id ?? branch.branchId}>{branch.name || branch.nombre || branch.branchName}</option>)}</select>
          </label>
          <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-5 py-3"><div className="text-[10px] font-black uppercase tracking-[.18em] text-amber-200">Comisión general</div><div className="mt-1 text-2xl font-black text-amber-300">{Number(data?.defaultPercentage ?? 0).toFixed(2)}%</div></div>
        </div>
      </div>

      <div className="p-5 sm:p-7">
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm font-bold leading-6 text-violet-900"><span className="font-black">¿Cómo funciona?</span> Todos los servicios usan la comisión general. Personaliza únicamente los que pagan un porcentaje distinto.</div>
        {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">{error}</div>}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h4 className="text-lg font-black text-neutral-950">Comisiones de {branchName}</h4><p className="text-sm font-semibold text-neutral-500">{Object.keys(overrides).length} excepciones personalizadas</p></div><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar servicio" className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-violet-400" /></div>

        {loading ? <div className="py-16 text-center font-black text-neutral-500">Cargando esquema de comisiones...</div> : <div className="mt-5 grid gap-3 sm:grid-cols-2">{visibleServices.map((service) => {
          const id = String(service.serviceId); const custom = Object.prototype.hasOwnProperty.call(overrides, id); const effective = custom ? overrides[id] : String(data?.defaultPercentage ?? service.percentage ?? 0);
          return <div key={id} className={'rounded-[24px] border p-4 transition ' + (custom ? 'border-violet-300 bg-white shadow-[0_12px_30px_rgba(109,40,217,.10)]' : 'border-neutral-200 bg-white/70')}>
            <div className="flex items-center gap-3"><div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-neutral-100">{service.imageUrl ? <img src={service.imageUrl} alt={service.serviceName} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-xl">✂</div>}</div><div className="min-w-0 flex-1"><div className="truncate font-black text-neutral-950">{service.serviceName}</div><span className={'mt-1 inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ' + (custom ? 'bg-violet-100 text-violet-700' : 'bg-neutral-100 text-neutral-600')}>{custom ? 'Personalizada' : 'Usa general'}</span></div></div>
            <div className="mt-4 flex items-center gap-3">{custom ? <label className="flex flex-1 items-center rounded-2xl border-2 border-violet-200 bg-violet-50 px-4"><input type="number" min="0" max="100" step="0.01" value={effective} onChange={(e) => setOverrides((current) => ({ ...current, [id]: e.target.value }))} className="min-w-0 flex-1 bg-transparent py-3 text-xl font-black text-violet-950 outline-none" /><span className="font-black text-violet-600">%</span></label> : <div className="flex-1 rounded-2xl bg-neutral-100 px-4 py-3"><div className="text-[10px] font-black uppercase tracking-wide text-neutral-400">Por este servicio</div><div className="text-xl font-black text-neutral-800">{Number(effective).toFixed(2)}%</div></div>}
              <button type="button" onClick={() => custom ? useDefault(id) : personalize(service)} className={'rounded-2xl px-4 py-3 text-xs font-black ' + (custom ? 'border border-neutral-200 bg-white text-neutral-700' : 'bg-violet-600 text-white')}>{custom ? 'Usar general' : 'Personalizar'}</button>
            </div>
          </div>;
        })}</div>}
        {!loading && visibleServices.length === 0 && <div className="mt-5 rounded-2xl border border-dashed border-neutral-300 p-10 text-center font-bold text-neutral-500">No encontramos servicios con ese nombre.</div>}
        <div className="sticky bottom-0 mt-6 flex flex-col gap-3 border-t border-neutral-200 bg-[#F7F6FA]/95 pt-5 backdrop-blur sm:flex-row"><button type="button" onClick={onClose} className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 font-black text-neutral-700">Cancelar</button><button type="button" disabled={saving || loading} onClick={save} className="flex-1 rounded-2xl bg-[linear-gradient(135deg,#6D28D9,#4C1D95)] px-5 py-4 font-black text-white shadow-[0_12px_30px_rgba(109,40,217,.28)] disabled:opacity-50">{saving ? 'Guardando esquema...' : 'Guardar comisiones'}</button></div>
      </div>
    </div>
  </div>;
}


function DeleteBarberModal({ barber, onClose, onDeleted }) {
  const [preview, setPreview] = useState(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    getOwnerBarberDeletionPreview(getBarberId(barber)).then(setPreview).catch((e) => setError(e.message || 'No se pudo analizar al profesional.')).finally(() => setLoading(false));
  }, [barber]);
  async function confirmDelete() {
    if (reason.trim().length < 5) { setError('Escribe un motivo de al menos 5 caracteres.'); return; }
    setSaving(true); setError('');
    try { await deleteOwnerBarber({ barberId: getBarberId(barber), reason: reason.trim() }); await onDeleted(); }
    catch (e) { setError(e.message || 'No se pudo retirar al profesional.'); } finally { setSaving(false); }
  }
  const historyTotal = Number(preview?.historicalAppointments || 0) + Number(preview?.saleItems || 0) + Number(preview?.payments || 0) + Number(preview?.advances || 0);
  return <div className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/75 backdrop-blur-md sm:items-center sm:p-6"><div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-[36px] bg-[#F7F4EF] shadow-2xl sm:rounded-[36px]">
    <header className="relative overflow-hidden bg-[radial-gradient(circle_at_0%_0%,rgba(251,191,36,.24),transparent_38%),linear-gradient(135deg,#09080A,#281529)] p-6 text-white"><div className="flex items-start gap-4"><BarberAvatar barber={barber}/><div className="min-w-0 flex-1"><div className="text-[10px] font-black uppercase tracking-[.24em] text-amber-300">Retiro protegido</div><h3 className="mt-2 text-2xl font-black">{fullName(barber)}</h3><p className="mt-2 text-sm font-semibold text-white/60">Validamos agenda, ventas y pagos antes de retirar el acceso.</p></div><button onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-xl font-black">×</button></div></header>
    <div className="space-y-4 p-5 sm:p-6">{loading ? <div className="rounded-3xl bg-white p-8 text-center font-black text-neutral-500">Analizando historial...</div> : preview && <>
      <div className={`rounded-[26px] border p-5 ${preview.blocked ? 'border-red-200 bg-red-50' : preview.hasHistory ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}><div className="text-xs font-black uppercase tracking-[.18em] text-neutral-500">{preview.deletionMode === 'HARD_DELETE' ? 'Eliminación definitiva' : preview.blocked ? 'Acción pendiente' : 'Historial protegido'}</div><h4 className="mt-2 text-xl font-black text-neutral-950">{preview.blocked ? 'Primero resuelve las citas futuras' : preview.hasHistory ? 'Se retirará sin perder información' : 'Puede eliminarse por completo'}</h4><p className="mt-2 text-sm font-semibold leading-6 text-neutral-600">{preview.explanation}</p></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="Citas futuras" value={preview.futureAppointments}/><Metric label="Historial" value={historyTotal}/><Metric label="Horarios" value={preview.schedules}/><Metric label="Configuración" value={preview.configurations}/></div>
      {!preview.blocked && <label className="block"><span className="text-sm font-black text-neutral-800">Motivo del retiro</span><textarea rows="3" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ejemplo: terminó su relación laboral" className="mt-2 w-full resize-none rounded-2xl border border-neutral-200 bg-white p-4 font-semibold outline-none focus:border-amber-400"/></label>}
    </>}
    {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">{error}</div>}
    <div className="grid gap-3 sm:grid-cols-2"><button onClick={onClose} className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 font-black">Cancelar</button><button onClick={confirmDelete} disabled={loading || saving || !preview || preview.blocked} className="rounded-2xl bg-red-600 px-5 py-4 font-black text-white shadow-[0_14px_30px_rgba(220,38,38,.22)] disabled:opacity-40">{saving ? 'Procesando...' : preview?.hasHistory ? 'Retirar y proteger historial' : 'Eliminar definitivamente'}</button></div>
    </div></div></div>;
}
function Metric({ label, value }) { return <div className="rounded-2xl border border-neutral-200 bg-white p-4"><div className="text-[10px] font-black uppercase tracking-wider text-neutral-400">{label}</div><div className="mt-2 text-2xl font-black text-neutral-950">{Number(value || 0)}</div></div>; }

export default function OwnerBarbersPage() {
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [serviceBarber, setServiceBarber] = useState(null);
  const [commissionBarber, setCommissionBarber] = useState(null);
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [formBarber, setFormBarber] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const [toggleBarber, setToggleBarber] = useState(null);
  const [deleteBarberItem, setDeleteBarberItem] = useState(null);
  const [toggleSaving, setToggleSaving] = useState(false);
  const [ownerProfessional, setOwnerProfessional] = useState({ enabled: false, branches: [] });
  const [ownerProfessionalBranchIds, setOwnerProfessionalBranchIds] = useState([]);
  const [ownerProfessionalSaving, setOwnerProfessionalSaving] = useState(false);
  const isOwnerSession = String(localStorage.getItem('ROLE') || '').toUpperCase() === 'OWNER';

  async function loadAll() {
    setLoading(true);
    setErrorMsg('');

    try {
      const [barberData, branchData, ownerProfile, serviceData] = await Promise.all([
        getOwnerBarbers({ branchId: branchId || undefined }),
        getOwnerBranchesForBarbers(),
        isOwnerSession ? getOwnerProfessionalProfile() : Promise.resolve(null),
        getOwnerServices({ onlyActive: true }),
      ]);

      setBarbers(Array.isArray(barberData) ? barberData : []);
      setBranches(Array.isArray(branchData) ? branchData : []);
      setServices(Array.isArray(serviceData) ? serviceData : []);
      if (ownerProfile) {
        setOwnerProfessional(ownerProfile);
        setOwnerProfessionalBranchIds((ownerProfile.branches || []).map((item) => String(item.id)));
      }
    } catch (error) {
      setErrorMsg(error.message || 'No se pudieron cargar los barberos.');
      setBarbers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [branchId]);

  const filteredBarbers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return barbers.filter((item) => {
      if (!showInactive && item.activo === false) return false;

      if (!term) return true;

      return (
        fullName(item).toLowerCase().includes(term) ||
        String(item.email || '').toLowerCase().includes(term) ||
        String(item.phone || '').toLowerCase().includes(term) ||
        barberBranchLabel(item).toLowerCase().includes(term)
      );
    });
  }, [barbers, search, showInactive]);

  const activeCount = useMemo(() => {
    return barbers.filter((item) => item.activo !== false).length;
  }, [barbers]);

  const inactiveCount = useMemo(() => {
    return barbers.filter((item) => item.activo === false).length;
  }, [barbers]);

  const salaryCount = useMemo(() => {
    return barbers.filter((item) => item.salaryMode === true).length;
  }, [barbers]);

  const commissionCount = useMemo(() => {
    return barbers.filter((item) => item.salaryMode !== true).length;
  }, [barbers]);

  const branchOptions = [
    { value: '', label: 'Todas las sedes' },
    ...branches.map((branch) => ({
      value: String(branch.id ?? branch.branchId),
      label: branch.name || branch.nombre || branch.branchName || `Sede ${branch.id ?? branch.branchId}`,
    })),
  ];

  async function saveOwnerProfessional() {
    if (ownerProfessionalBranchIds.length === 0) {
      setErrorMsg('Selecciona al menos una sede.');
      return;
    }
    setOwnerProfessionalSaving(true);
    setErrorMsg('');
    try {
      await updateOwnerProfessionalProfile(ownerProfessionalBranchIds.map(Number));
      await loadAll();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo actualizar tu perfil profesional.');
    } finally { setOwnerProfessionalSaving(false); }
  }

  async function disableOwnerProfessional() {
    setOwnerProfessionalSaving(true);
    try { await disableOwnerProfessionalProfile(); await loadAll(); }
    catch (error) { setErrorMsg(error.message || 'No se pudo desactivar el perfil profesional.'); }
    finally { setOwnerProfessionalSaving(false); }
  }

  async function handleSaved() {
    setFormBarber(null);
    setShowCreate(false);
    await loadAll();
  }

  async function handleToggleConfirm() {
    if (!toggleBarber) return;

    setToggleSaving(true);

    try {
      await updateOwnerBarberStatus({
        barberId: getBarberId(toggleBarber),
        activo: toggleBarber.activo === false,
      });

      setToggleBarber(null);
      await loadAll();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo cambiar el estado del barbero.');
    } finally {
      setToggleSaving(false);
    }
  }

  async function handleDeletePhoto(barber) {
    if (!barber?.photoUrl) return;

    const ok = await premiumConfirm(`¿Quieres quitar la foto de ${fullName(barber)}?`);
    if (!ok) return;

    setErrorMsg('');

    try {
      await deleteOwnerBarberPhoto(getBarberId(barber));
      await loadAll();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo eliminar la foto.');
    }
  }

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[34px] border border-amber-400/15 bg-[linear-gradient(135deg,#080808_0%,#111827_48%,#15110A_100%)] p-6 text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(251,191,36,0.22),transparent_30%),radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.16),transparent_34%)]" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
              Equipo de trabajo
            </div>

            <h2 className="mt-5 text-4xl font-black tracking-tight">
              Barberos de la barbería
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65">
              Crea, edita, asigna sedes, define comisión o sueldo fijo y controla
              quién puede operar en agenda, caja y ventas.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-2xl bg-amber-400 px-5 py-4 text-sm font-black text-neutral-950 transition hover:scale-[1.01]"
          >
            Nuevo barbero
          </button>
        </div>
      </section>

      {isOwnerSession && (
        <section className="overflow-hidden rounded-[30px] border border-amber-400/40 bg-[linear-gradient(135deg,#17131E_0%,#2B2038_100%)] p-6 text-white shadow-[0_18px_45px_rgba(23,19,30,0.16)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex rounded-full bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">Perfil profesional del dueño</div>
              <h3 className="mt-4 text-2xl font-black">{ownerProfessional.enabled ? 'Ya apareces como profesional' : '¿También atiendes clientes?'}</h3>
              <p className="mt-2 text-sm font-semibold text-white/65">Selecciona las sedes donde tus clientes podrán reservar contigo.</p>
            </div>
            <div className="min-w-0 flex-1 xl:max-w-2xl">
              <div className="flex flex-wrap gap-2">
                {branches.map((branch) => {
                  const id = String(branch.id ?? branch.branchId);
                  const selected = ownerProfessionalBranchIds.includes(id);
                  return <button key={id} type="button" onClick={() => setOwnerProfessionalBranchIds((prev) => selected ? prev.filter((item) => item !== id) : [...prev, id])} className={`rounded-full border px-4 py-2 text-xs font-black transition ${selected ? 'border-amber-300 bg-amber-300 text-neutral-950' : 'border-white/20 bg-white/5 text-white'}`}>{branch.name || branch.nombre || branch.branchName}</button>;
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" disabled={ownerProfessionalSaving} onClick={saveOwnerProfessional} className="rounded-2xl bg-amber-400 px-5 py-3 text-sm font-black text-neutral-950 disabled:opacity-60">{ownerProfessionalSaving ? 'Guardando...' : 'Guardar sedes donde atiendo'}</button>
                {ownerProfessional.enabled && <button type="button" disabled={ownerProfessionalSaving} onClick={disableOwnerProfessional} className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white">Dejar de aparecer</button>}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Activos"
          value={activeCount}
          helper="Disponibles para operar"
          tone="green"
        />

        <StatCard
          title="Inactivos"
          value={inactiveCount}
          helper="No aparecen en nuevas operaciones"
          tone={inactiveCount > 0 ? 'red' : 'default'}
        />

        <StatCard
          title="Por comisión"
          value={commissionCount}
          helper="Modelo porcentual"
          tone="gold"
        />

        <StatCard
          title="Sueldo fijo"
          value={salaryCount}
          helper="Modelo salario"
          tone="blue"
        />
      </section>

      <section className="rounded-[30px] border border-neutral-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.045)]">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto_auto] lg:items-end">
          <label className="block">
            <span className="text-sm font-black text-neutral-700">Buscar barbero</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, correo, teléfono o sede"
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-bold text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-amber-400"
            />
          </label>

          <SelectField
            label="Sede"
            value={branchId}
            onChange={setBranchId}
            options={branchOptions}
          />

          <button
            type="button"
            onClick={() => setShowInactive((prev) => !prev)}
            className={`rounded-2xl px-5 py-4 text-sm font-black transition ${
              showInactive
                ? 'bg-emerald-500 text-white'
                : 'border border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            {showInactive ? 'Ver todos' : 'Solo activos'}
          </button>

          <button
            type="button"
            onClick={loadAll}
            disabled={loading}
            className="rounded-2xl bg-neutral-950 px-5 py-4 text-sm font-black text-white transition hover:scale-[1.01] disabled:opacity-60"
          >
            {loading ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>
      </section>

      <ErrorBox message={errorMsg} />

      {loading ? (
        <div className="rounded-[30px] border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="h-3 w-52 animate-pulse rounded-full bg-neutral-200" />
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-48 animate-pulse rounded-[24px] bg-neutral-100" />
            ))}
          </div>
        </div>
      ) : filteredBarbers.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-neutral-300 bg-white/70 p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-3xl">
            💈
          </div>

          <h3 className="mt-4 text-xl font-black text-neutral-950">
            {barbers.length === 0
              ? 'Aún no tienes barberos'
              : 'No encontramos resultados'}
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-neutral-500">
            {barbers.length === 0
              ? 'Crea tu primer barbero para usar agenda, caja, ventas y reportes.'
              : 'Prueba cambiando el texto de búsqueda, sede o filtro de inactivos.'}
          </p>

          {barbers.length === 0 && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="mt-5 rounded-2xl bg-neutral-950 px-5 py-4 text-sm font-black text-white"
            >
              Crear barbero
            </button>
          )}
        </div>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {filteredBarbers.map((barber) => (
            <BarberCard
              key={getBarberId(barber)}
              barber={barber}
              onEdit={() => setFormBarber(barber)}
              onServices={() => setServiceBarber(barber)}
              onCommissions={() => setCommissionBarber(barber)}
              onToggle={() => setToggleBarber(barber)}
              onDeletePhoto={() => handleDeletePhoto(barber)}
              onDelete={() => setDeleteBarberItem(barber)}
            />
          ))}
        </section>
      )}

      {serviceBarber && (
        <BarberServicesModal
          barber={serviceBarber}
          branches={branches}
          services={services}
          onClose={() => setServiceBarber(null)}
        />
      )}

      {commissionBarber && (
        <BarberCommissionsModal
          barber={commissionBarber}
          branches={branches}
          onClose={() => setCommissionBarber(null)}
        />
      )}

      {(showCreate || formBarber) && (
        <BarberFormModal
          barber={formBarber}
          branches={branches}
          onClose={() => {
            setShowCreate(false);
            setFormBarber(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {deleteBarberItem && <DeleteBarberModal barber={deleteBarberItem} onClose={() => setDeleteBarberItem(null)} onDeleted={async () => { setDeleteBarberItem(null); await loadAll(); }} />}

      {toggleBarber && (
        <ToggleConfirmModal
          barber={toggleBarber}
          saving={toggleSaving}
          onCancel={() => setToggleBarber(null)}
          onConfirm={handleToggleConfirm}
        />
      )}
    </div>
  );
}

