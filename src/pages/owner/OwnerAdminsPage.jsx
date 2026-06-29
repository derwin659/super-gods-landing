import { useEffect, useMemo, useState } from 'react';
import {
  ADMIN_PERMISSION_GROUPS,
  CONFIG_CHILD_PERMISSIONS,
  changeOwnerUserPassword,
  changeOwnerUserRole,
  changeOwnerUserStatus,
  createOwnerAdmin,
  getAdminPermissions,
  getOwnerBranchesForAdmins,
  getOwnerInternalUsers,
  updateAdminPermissions,
  updateOwnerAdmin,
  updateOwnerUserBranches,
} from '../../api/ownerAdminsApi';

function initials(name) {
  return String(name || 'Admin')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((item) => item[0])
    .join('')
    .toUpperCase();
}

function ErrorBox({ message }) {
  if (!message) return null;

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
      {message}
    </div>
  );
}

function StatCard({ title, value, icon, tone = 'default' }) {
  const tones = {
    default: 'border-neutral-200 bg-white text-neutral-950',
    gold: 'border-amber-200 bg-amber-50 text-amber-800',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
  };

  return (
    <div className={`rounded-[26px] border p-5 shadow-[0_14px_35px_rgba(15,23,42,0.045)] ${tones[tone]}`}>
      <div className="text-2xl">{icon}</div>
      <div className="mt-3 text-3xl font-black">{value}</div>
      <div className="mt-1 text-sm font-bold text-neutral-500">{title}</div>
    </div>
  );
}

function ModalShell({ title, subtitle, children, onClose, maxWidth = 'max-w-3xl' }) {
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
  disabled = false,
  autoComplete,
  inputMode,
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-neutral-700">{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-bold text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-amber-400 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400"
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
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-bold text-neutral-950 outline-none transition focus:border-amber-400 disabled:cursor-not-allowed disabled:bg-neutral-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function StickyFormActions({ errorMsg, saving, editing }) {
  return (
    <div className="sticky bottom-0 -mx-2 space-y-3 border-t border-neutral-200 bg-white/95 px-2 pb-1 pt-4 backdrop-blur">
      {errorMsg && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black leading-5 text-red-700">
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-2xl bg-neutral-950 px-5 py-4 font-black text-white shadow-[0_14px_35px_rgba(15,23,42,0.18)] transition hover:scale-[1.01] disabled:opacity-60"
      >
        {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Guardar administrador'}
      </button>
    </div>
  );
}

function AdminFormModal({ admin, branches, barbers, onClose, onSaved }) {
  const editing = Boolean(admin?.id);

  const [mode, setMode] = useState('new');
  const [selectedBarberId, setSelectedBarberId] = useState('');

  const [nombre, setNombre] = useState(admin?.nombre || '');
  const [apellido, setApellido] = useState(admin?.apellido || '');
  const [email, setEmail] = useState(admin?.email || '');
  const [phone, setPhone] = useState(admin?.phone || '');
  const [password, setPassword] = useState('');
  const [branchIds, setBranchIds] = useState(() => { const initial = admin?.branchIds?.length ? admin.branchIds : admin?.branchId ? [admin.branchId] : branches[0]?.id ? [branches[0].id] : []; return initial.map(String); });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const usingBarber = !editing && mode === 'barber';

  function handleSelectBarber(nextId) {
    setSelectedBarberId(nextId);
    const barber = barbers.find((item) => String(item.id) === String(nextId));

    if (!barber) return;

    setNombre(barber.nombre || '');
    setApellido(barber.apellido || '');
    setEmail(barber.email || '');
    setPhone(barber.phone || '');
    const nextBranches = barber.branchIds?.length ? barber.branchIds : barber.branchId ? [barber.branchId] : [];
    if (nextBranches.length) setBranchIds(nextBranches.map(String));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;

    setErrorMsg('');

    const cleanNombre = String(nombre || '').trim();
    const cleanApellido = String(apellido || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPhone = String(phone || '').trim();
    const cleanPassword = String(password || '').trim();

    if (branchIds.length === 0) {
      setErrorMsg('Selecciona al menos una sede.');
      return;
    }

    if (!cleanNombre) {
      setErrorMsg('Ingresa el nombre.');
      return;
    }

    if (!editing && !usingBarber && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('Ingresa un email válido.');
      return;
    }

    if (!editing && !usingBarber && cleanPassword.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (usingBarber && !selectedBarberId) {
      setErrorMsg('Selecciona un barbero para convertirlo en administrador.');
      return;
    }

    setSaving(true);

    try {
      let saved;

      if (editing) {
        saved = await updateOwnerAdmin({
          userId: admin.id,
          nombre: cleanNombre,
          apellido: cleanApellido,
          phone: cleanPhone,
          branchId: branchIds[0],
        });
      } else if (usingBarber) {
        saved = await updateOwnerAdmin({
          userId: selectedBarberId,
          nombre: cleanNombre,
          apellido: cleanApellido,
          phone: cleanPhone,
          branchId: branchIds[0],
        });
      } else {
        saved = await createOwnerAdmin({
          nombre: cleanNombre,
          apellido: cleanApellido,
          email: cleanEmail,
          phone: cleanPhone,
          password: cleanPassword,
          branchId: branchIds[0],
        });
      }

      saved = await updateOwnerUserBranches({ userId: saved.id, branchIds });
      onSaved(saved);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo guardar el administrador.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title={editing ? 'Editar administrador' : 'Nuevo administrador'}
      subtitle="Control de accesos"
      onClose={onClose}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <ErrorBox message={errorMsg} />

        {!editing && (
          <div className="grid gap-2 rounded-[22px] bg-neutral-100 p-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode('new')}
              className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                mode === 'new'
                  ? 'bg-white text-neutral-950 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-950'
              }`}
            >
              Crear nuevo
            </button>

            <button
              type="button"
              onClick={() => setMode('barber')}
              className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                mode === 'barber'
                  ? 'bg-white text-neutral-950 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-950'
              }`}
            >
              Usar barbero existente
            </button>
          </div>
        )}

        {usingBarber && (
          <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4">
            <SelectField
              label="Barbero existente"
              value={selectedBarberId}
              onChange={handleSelectBarber}
              options={[
                { value: '', label: 'Seleccionar barbero' },
                ...barbers.map((barber) => ({
                  value: String(barber.id),
                  label: `${barber.fullName} · ${barber.email || 'sin email'}`,
                })),
              ]}
            />
            <p className="mt-3 text-xs font-bold leading-5 text-amber-800">
              Esta opción convierte el barbero en ADMIN. Luego podrás devolverlo a BARBERO desde la lista.
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField label="Nombre" value={nombre} onChange={setNombre} placeholder="Ej. Anthony" autoComplete="given-name" disabled={usingBarber} />
          <InputField label="Apellido" value={apellido} onChange={setApellido} placeholder="Opcional" autoComplete="family-name" disabled={usingBarber} />
        </div>

        <InputField label="Email" value={email} onChange={setEmail} placeholder="admin@barberia.com" type="email" autoComplete="email" inputMode="email" disabled={editing || usingBarber} />

        <InputField label="Teléfono" value={phone} onChange={setPhone} placeholder="987654321" disabled={usingBarber} />

        {!editing && !usingBarber && (
          <InputField label="Contraseña" value={password} onChange={setPassword} placeholder="Mínimo 6 caracteres" type="password" />
        )}

        <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-neutral-500">Sedes asignadas</div>
          <p className="mt-1 text-xs font-semibold text-neutral-500">El administrador solo podrá operar en las sedes seleccionadas.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {branches.map((branch) => {
              const value = String(branch.id);
              const checked = branchIds.includes(value);
              return <label key={branch.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${checked ? 'border-amber-300 bg-amber-50' : 'border-neutral-200 bg-white'}`}>
                <input type="checkbox" checked={checked} onChange={() => setBranchIds((current) => checked ? current.filter((id) => id !== value) : [...current, value])} className="h-4 w-4 accent-amber-500" />
                <span className="text-sm font-black text-neutral-800">{branch.nombre}</span>
              </label>;
            })}
          </div>
        </div>

        <StickyFormActions errorMsg={errorMsg} saving={saving} editing={editing} />
      </form>
    </ModalShell>
  );
}

function PasswordModal({ admin, onClose, onSaved }) {
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMsg('');

    if (String(newPassword).trim().length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setSaving(true);

    try {
      await changeOwnerUserPassword({ userId: admin.id, newPassword });
      onSaved();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title={`Cambiar clave de ${admin.fullName}`}
      subtitle="Seguridad"
      onClose={onClose}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorBox message={errorMsg} />

        <InputField
          label="Nueva contraseña"
          value={newPassword}
          onChange={setNewPassword}
          placeholder="Mínimo 6 caracteres"
          type="password"
        />

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-2xl bg-neutral-950 px-5 py-4 font-black text-white transition hover:scale-[1.01] disabled:opacity-60"
        >
          {saving ? 'Guardando...' : 'Actualizar contraseña'}
        </button>
      </form>
    </ModalShell>
  );
}

function PermissionSwitch({ label, permissionKey, checked, onToggle }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 transition hover:bg-white">
      <div>
        <div className="text-sm font-black text-neutral-950">{label}</div>
        <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
          {permissionKey}
        </div>
      </div>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onToggle(permissionKey, event.target.checked)}
        className="h-5 w-5 accent-neutral-950"
      />
    </label>
  );
}

function PermissionsModal({ admin, onClose, onSaved }) {
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let alive = true;

    async function loadPermissions() {
      setLoading(true);
      setErrorMsg('');

      try {
        const data = await getAdminPermissions(admin.id);
        if (!alive) return;
        setSelected(new Set(data.permissions));
      } catch (error) {
        if (!alive) return;
        setErrorMsg(error.message || 'No se pudieron cargar los permisos.');
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadPermissions();

    return () => {
      alive = false;
    };
  }, [admin.id]);

  function togglePermission(permissionKey, value) {
    const key = String(permissionKey || '').trim().toUpperCase();

    setSelected((prev) => {
      const next = new Set(prev);

      if (value) {
        next.add(key);

        if (CONFIG_CHILD_PERMISSIONS.has(key)) {
          next.add('CONFIG_ACCESS');
        }
      } else {
        next.delete(key);

        if (key === 'CONFIG_ACCESS') {
          CONFIG_CHILD_PERMISSIONS.forEach((item) => next.delete(item));
        }
      }

      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setErrorMsg('');

    try {
      await updateAdminPermissions({
        adminUserId: admin.id,
        permissions: Array.from(selected),
      });
      onSaved();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudieron guardar los permisos.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title={admin.fullName}
      subtitle="Permisos del administrador"
      onClose={onClose}
      maxWidth="max-w-5xl"
    >
      <div className="space-y-4">
        <div className="rounded-[26px] bg-[linear-gradient(135deg,#090909_0%,#111827_100%)] p-5 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-xl font-black text-amber-300">
              {initials(admin.fullName)}
            </div>
            <div>
              <div className="text-xl font-black">{admin.fullName}</div>
              <div className="mt-1 text-sm font-bold text-white/50">{admin.email}</div>
            </div>
          </div>
        </div>

        <ErrorBox message={errorMsg} />

        {loading ? (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm font-black text-neutral-500">
            Cargando permisos...
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {ADMIN_PERMISSION_GROUPS.map((group) => (
              <section key={group.title} className="rounded-[26px] border border-neutral-200 bg-white p-4">
                <div className="mb-4">
                  <h3 className="text-lg font-black text-neutral-950">{group.title}</h3>
                  <p className="mt-1 text-sm font-bold text-neutral-500">{group.subtitle}</p>
                </div>

                <div className="grid gap-2">
                  {group.permissions.map(([label, key]) => (
                    <PermissionSwitch
                      key={key}
                      label={label}
                      permissionKey={key}
                      checked={selected.has(key)}
                      onToggle={togglePermission}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <button
          type="button"
          disabled={loading || saving}
          onClick={handleSave}
          className="w-full rounded-2xl bg-neutral-950 px-5 py-4 font-black text-white transition hover:scale-[1.01] disabled:opacity-60"
        >
          {saving ? 'Guardando permisos...' : 'Guardar permisos'}
        </button>
      </div>
    </ModalShell>
  );
}

function AdminCard({ admin, branchName, onEdit, onPermissions, onPassword, onToggleStatus, onConvertToBarber }) {
  return (
    <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.045)]">
      <div className="flex items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-black ${
          admin.activo
            ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border border-neutral-200 bg-neutral-100 text-neutral-500'
        }`}>
          {initials(admin.fullName)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-xl font-black text-neutral-950">
            {admin.fullName}
          </div>
          <div className="mt-1 truncate text-sm font-bold text-neutral-500">
            {admin.email || 'Sin email'}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-600">
              {branchName || 'Sin sede'}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-black ${
              admin.activo
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-neutral-100 text-neutral-500'
            }`}>
              {admin.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={onEdit} className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-black text-neutral-700 hover:bg-neutral-100">
          Editar
        </button>
        <button type="button" onClick={onPermissions} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-800 hover:bg-amber-100">
          Permisos
        </button>
        <button type="button" onClick={onPassword} className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-black text-neutral-700 hover:bg-neutral-100">
          Clave
        </button>
        <button type="button" onClick={onConvertToBarber} className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-black text-neutral-700 hover:bg-neutral-100">
          A barbero
        </button>
      </div>

      <button
        type="button"
        onClick={onToggleStatus}
        className={`mt-3 w-full rounded-2xl px-4 py-3 text-sm font-black transition ${
          admin.activo
            ? 'bg-red-50 text-red-700 hover:bg-red-100'
            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
        }`}
      >
        {admin.activo ? 'Desactivar administrador' : 'Activar administrador'}
      </button>
    </div>
  );
}

export default function OwnerAdminsPage() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [passwordAdmin, setPasswordAdmin] = useState(null);
  const [permissionsAdmin, setPermissionsAdmin] = useState(null);

  const admins = useMemo(() => {
    return users
      .filter((item) => String(item.rol || '').toUpperCase() === 'ADMIN')
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [users]);

  const barbers = useMemo(() => {
    return users
      .filter((item) => String(item.rol || '').toUpperCase() === 'BARBER' && item.activo)
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [users]);

  const branchById = useMemo(() => {
    const map = new Map();
    branches.forEach((branch) => map.set(String(branch.id), branch.nombre));
    return map;
  }, [branches]);

  async function loadData() {
    setLoading(true);
    setErrorMsg('');

    try {
      const [usersData, branchesData] = await Promise.all([
        getOwnerInternalUsers(),
        getOwnerBranchesForAdmins(),
      ]);

      setUsers(Array.isArray(usersData) ? usersData : []);
      setBranches(Array.isArray(branchesData) ? branchesData : []);
    } catch (error) {
      setUsers([]);
      setBranches([]);
      setErrorMsg(error.message || 'No se pudieron cargar los administradores.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openCreateForm() {
    setEditingAdmin(null);
    setShowForm(true);
  }

  function openEditForm(admin) {
    setEditingAdmin(admin);
    setShowForm(true);
  }

  function handleSaved() {
    setShowForm(false);
    setEditingAdmin(null);
    setSuccessMsg('Administrador guardado correctamente.');
    loadData();
  }

  async function handleToggleStatus(admin) {
    const newStatus = !admin.activo;
    const ok = window.confirm(
      newStatus
        ? `¿Deseas activar el acceso de ${admin.fullName}?`
        : `¿Deseas desactivar el acceso de ${admin.fullName}?`
    );

    if (!ok) return;

    try {
      await changeOwnerUserStatus({ userId: admin.id, activo: newStatus });
      setSuccessMsg(newStatus ? 'Administrador activado.' : 'Administrador desactivado.');
      loadData();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo cambiar el estado.');
    }
  }

  async function handleConvertToBarber(admin) {
    const branchId = admin.branchId;

    if (!branchId) {
      setErrorMsg('Este usuario no tiene sede asignada.');
      return;
    }

    const ok = window.confirm(
      `¿Deseas quitar el acceso de administrador a ${admin.fullName} y dejarlo como barbero?`
    );

    if (!ok) return;

    try {
      await changeOwnerUserRole({
        userId: admin.id,
        targetRole: 'BARBER',
        branchId,
      });
      setSuccessMsg('Usuario convertido a barbero.');
      loadData();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo convertir a barbero.');
    }
  }

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[34px] border border-amber-400/15 bg-[linear-gradient(135deg,#080808_0%,#111827_48%,#15110A_100%)] p-6 text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(251,191,36,0.22),transparent_30%),radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.16),transparent_34%)]" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
              Seguridad y permisos
            </div>

            <h2 className="mt-5 text-4xl font-black tracking-tight">
              Administradores
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65">
              Crea administradores, asígnalos a una sede y limita lo que pueden hacer en caja, agenda, clientes, reportes y configuración.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadData}
              className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-sm font-black text-white transition hover:bg-white/15"
            >
              Actualizar
            </button>

            <button
              type="button"
              onClick={openCreateForm}
              className="rounded-2xl bg-amber-400 px-5 py-4 text-sm font-black text-neutral-950 shadow-[0_16px_35px_rgba(251,191,36,0.22)] transition hover:scale-[1.02]"
            >
              Nuevo admin
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <StatCard title="Administradores" value={admins.length} icon="👮" tone="gold" />
        <StatCard title="Barberos disponibles" value={barbers.length} icon="💈" tone="blue" />
        <StatCard title="Usuarios internos" value={users.length} icon="👥" tone="green" />
      </section>

      <ErrorBox message={errorMsg} />

      {successMsg && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
          {successMsg}
        </div>
      )}

      {loading ? (
        <div className="rounded-[28px] border border-neutral-200 bg-white p-6 font-bold text-neutral-700 shadow-sm">
          Cargando administradores...
        </div>
      ) : admins.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-neutral-300 bg-white/70 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-2xl">
            👮
          </div>
          <div className="mt-4 text-xl font-black text-neutral-950">
            Aún no tienes administradores
          </div>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-neutral-500">
            Puedes crear uno desde cero o convertir un barbero existente en administrador.
          </p>
          <button
            type="button"
            onClick={openCreateForm}
            className="mt-5 rounded-2xl bg-neutral-950 px-5 py-4 text-sm font-black text-white transition hover:scale-[1.01]"
          >
            Crear administrador
          </button>
        </div>
      ) : (
        <section className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-3">
          {admins.map((admin) => (
            <AdminCard
              key={admin.id}
              admin={admin}
              branchName={branchById.get(String(admin.branchId)) || admin.branchName}
              onEdit={() => openEditForm(admin)}
              onPermissions={() => setPermissionsAdmin(admin)}
              onPassword={() => setPasswordAdmin(admin)}
              onToggleStatus={() => handleToggleStatus(admin)}
              onConvertToBarber={() => handleConvertToBarber(admin)}
            />
          ))}
        </section>
      )}

      {showForm && (
        <AdminFormModal
          admin={editingAdmin}
          branches={branches}
          barbers={barbers}
          onClose={() => {
            setShowForm(false);
            setEditingAdmin(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {passwordAdmin && (
        <PasswordModal
          admin={passwordAdmin}
          onClose={() => setPasswordAdmin(null)}
          onSaved={() => {
            setPasswordAdmin(null);
            setSuccessMsg('Contraseña actualizada.');
          }}
        />
      )}

      {permissionsAdmin && (
        <PermissionsModal
          admin={permissionsAdmin}
          onClose={() => setPermissionsAdmin(null)}
          onSaved={() => {
            setPermissionsAdmin(null);
            setSuccessMsg('Permisos actualizados correctamente.');
          }}
        />
      )}
    </div>
  );
}
