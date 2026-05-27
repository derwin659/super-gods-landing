import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isGoogleLinkConfigured, startGoogleAccountLink } from '../../api/authApi';
import { changeMyPassword, getGoogleLinkStatus } from '../../api/ownerSecurityApi';
import { useAuth } from '../../context/AuthContext';

function AccountInfoCard({ label, value, icon }) {
  return (
    <div className="rounded-[24px] border border-neutral-200 bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,0.045)]">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-xl">
          {icon}
        </div>

        <div className="min-w-0">
          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-neutral-400">
            {label}
          </div>
          <div className="mt-1 truncate text-base font-black text-neutral-950">
            {value || 'No disponible'}
          </div>
        </div>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  visible,
  onToggle,
  autoComplete,
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-neutral-800">{label}</span>

      <div className="flex rounded-2xl border border-neutral-200 bg-white transition focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-100">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-2xl bg-transparent px-4 py-4 text-sm font-bold text-neutral-950 outline-none placeholder:text-neutral-400"
        />

        <button
          type="button"
          onClick={onToggle}
          className="px-4 text-xs font-black text-neutral-500 transition hover:text-neutral-950"
        >
          {visible ? 'Ocultar' : 'Ver'}
        </button>
      </div>
    </label>
  );
}

export default function OwnerSecurityPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, signOut } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [googleStatus, setGoogleStatus] = useState(null);
  const [loadingGoogleStatus, setLoadingGoogleStatus] = useState(true);
  const googleLinkReady = isGoogleLinkConfigured();

  const loadGoogleStatus = useCallback(async () => {
    setLoadingGoogleStatus(true);
    try {
      const status = await getGoogleLinkStatus();
      setGoogleStatus(status);
    } catch {
      setGoogleStatus(null);
    } finally {
      setLoadingGoogleStatus(false);
    }
  }, []);

  useEffect(() => {
    loadGoogleStatus();
  }, [loadGoogleStatus]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (params.get('googleLinked') === '1') {
      setMessage({
        type: 'success',
        text: 'Gmail vinculado correctamente. Desde ahora podras entrar con Google usando esta misma cuenta.',
      });
      loadGoogleStatus();
      navigate(location.pathname, { replace: true });
    }
  }, [loadGoogleStatus, location.pathname, location.search, navigate]);

  const roleLabel = useMemo(() => {
    const role = String(session?.role || '').toUpperCase();

    if (role === 'OWNER') return 'Dueño';
    if (role === 'ADMIN') return 'Administrador';
    if (role === 'SUPER_ADMIN') return 'Super Admin';

    return role || 'Usuario';
  }, [session?.role]);

  function resetForm() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage({ type: '', text: '' });

    const cleanCurrent = currentPassword.trim();
    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanCurrent) {
      setMessage({ type: 'error', text: 'Ingresa tu contraseña actual.' });
      return;
    }

    if (cleanNew.length < 6) {
      setMessage({
        type: 'error',
        text: 'La nueva contraseña debe tener al menos 6 caracteres.',
      });
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setMessage({
        type: 'error',
        text: 'La confirmación no coincide con la nueva contraseña.',
      });
      return;
    }

    setSaving(true);

    try {
      await changeMyPassword({
        currentPassword: cleanCurrent,
        newPassword: cleanNew,
        confirmPassword: cleanConfirm,
      });

      resetForm();
      setMessage({
        type: 'success',
        text: 'Contraseña actualizada correctamente.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error?.message ||
          'No se pudo actualizar la contraseña. Verifica tu contraseña actual.',
      });
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    signOut();
    navigate('/login', { replace: true });
  }

  async function handleGoogleLink() {
    try {
      const response = await startGoogleAccountLink();
      if (!response?.url) {
        throw new Error('No se recibio la URL de Google.');
      }

      window.location.href = response.url;
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error?.message ||
          'La vinculacion con Google no esta disponible en este momento.',
      });
    }
  }

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[34px] border border-amber-400/15 bg-[linear-gradient(135deg,#080808_0%,#111827_48%,#15110A_100%)] p-6 text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(251,191,36,0.22),transparent_30%),radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.16),transparent_34%)]" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
              Seguridad web
            </div>

            <h2 className="mt-5 text-4xl font-black tracking-tight">
              Protege tu cuenta de Super Gods
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65">
              Revisa los datos de tu sesión, actualiza tu contraseña y controla
              el acceso a tu panel web.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-2xl border border-white/10 bg-white/[0.08] px-5 py-4 text-sm font-black text-white/80 transition hover:bg-white/15 hover:text-white"
          >
            Cerrar sesión
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AccountInfoCard
          icon="👤"
          label="Usuario"
          value={session?.userName || 'Usuario'}
        />
        <AccountInfoCard
          icon="📧"
          label="Correo"
          value={session?.userEmail || 'No registrado'}
        />
        <AccountInfoCard icon="🛡️" label="Rol" value={roleLabel} />
        <AccountInfoCard
          icon="🏪"
          label="Barbería / Sede"
          value={`${session?.tenantName || 'Mi barbería'}${
            session?.branchName ? ` · ${session.branchName}` : ''
          }`}
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.75fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-[34px] border border-neutral-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.055)]"
        >
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
              Cambiar contraseña
            </div>

            <h3 className="mt-2 text-2xl font-black text-neutral-950">
              Actualiza tu clave de acceso
            </h3>

            <p className="mt-2 text-sm font-semibold leading-6 text-neutral-500">
              Por seguridad, ingresa tu contraseña actual antes de guardar una
              nueva.
            </p>
          </div>

          <div className="mt-6 grid gap-4">
            <PasswordField
              label="Contraseña actual"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="Ingresa tu contraseña actual"
              visible={showCurrent}
              onToggle={() => setShowCurrent((prev) => !prev)}
              autoComplete="current-password"
            />

            <PasswordField
              label="Nueva contraseña"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="Mínimo 6 caracteres"
              visible={showNew}
              onToggle={() => setShowNew((prev) => !prev)}
              autoComplete="new-password"
            />

            <PasswordField
              label="Confirmar nueva contraseña"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Repite la nueva contraseña"
              visible={showConfirm}
              onToggle={() => setShowConfirm((prev) => !prev)}
              autoComplete="new-password"
            />
          </div>

          {message.text && (
            <div
              className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-bold ${
                message.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-neutral-950 px-6 py-4 text-sm font-black text-white transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Actualizar contraseña'}
            </button>

            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-4 text-sm font-black text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Limpiar
            </button>
          </div>
        </form>

        <aside className="rounded-[34px] border border-neutral-200 bg-neutral-950 p-6 text-white shadow-[0_18px_45px_rgba(15,23,42,0.13)]">
          <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/70">
            Recomendación
          </div>

          <h3 className="mt-5 text-2xl font-black">
            Usa una contraseña segura
          </h3>

          <div className="mt-5 grid gap-3 text-sm font-semibold leading-6 text-white/65">
            <p>• Mínimo 6 caracteres.</p>
            <p>• Evita usar la misma clave de otros sistemas.</p>
            <p>• Cambia la contraseña si compartiste tu acceso.</p>
            <p>• Usa administradores con permisos limitados para tu equipo.</p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/owner/administradores')}
            className="mt-7 w-full rounded-2xl bg-amber-400 px-5 py-4 text-sm font-black text-neutral-950 transition hover:bg-amber-300"
          >
            Gestionar administradores
          </button>
        </aside>
      </section>

      <section className="rounded-[34px] border border-neutral-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.055)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
              Acceso con Google
            </div>

            <h3 className="mt-2 text-2xl font-black text-neutral-950">
              Vincula tu Gmail sin perder tu usuario actual
            </h3>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-neutral-500">
              Los duenos y administradores que ya ingresan con correo y
              contrasena podran asociar su cuenta de Google. Despues podran
              entrar con un clic, manteniendo el mismo tenant, rol y permisos.
            </p>

            <div className="mt-5 rounded-[24px] border border-neutral-200 bg-neutral-50 p-4">
              {loadingGoogleStatus ? (
                <div className="h-16 animate-pulse rounded-2xl bg-white" />
              ) : googleStatus?.linked ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    {googleStatus.pictureUrl ? (
                      <img
                        src={googleStatus.pictureUrl}
                        alt={googleStatus.name || googleStatus.email || 'Cuenta Google'}
                        className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-4 ring-white"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-xl font-black text-neutral-950 ring-1 ring-neutral-200">
                        G
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700">
                        Gmail conectado
                      </div>
                      <p className="mt-2 truncate text-base font-black text-neutral-950">
                        {googleStatus.name || 'Cuenta Google'}
                      </p>
                      <p className="truncate text-sm font-bold text-neutral-500">
                        {googleStatus.email || 'Correo no disponible'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-700">
                    Activo
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-neutral-950">
                      Aun no hay Gmail vinculado
                    </p>
                    <p className="mt-1 text-sm font-semibold text-neutral-500">
                      Vincula una cuenta para entrar mas rapido sin cambiar tu
                      usuario actual.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-neutral-500 ring-1 ring-neutral-200">
                    Pendiente
                  </div>
                </div>
              )}
            </div>

            {message.type === 'success' && message.text.includes('Gmail') && (
              <div className="mt-4 inline-flex rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
                {message.text}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleGoogleLink}
            disabled={!googleLinkReady}
            className="inline-flex items-center justify-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-950 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#0F2A5F] disabled:cursor-not-allowed disabled:opacity-55"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-base font-black text-neutral-950">
              G
            </span>
            {googleStatus?.linked ? 'Cambiar Gmail' : googleLinkReady ? 'Vincular Gmail' : 'Google pronto'}
          </button>
        </div>
      </section>
    </div>
  );
}
