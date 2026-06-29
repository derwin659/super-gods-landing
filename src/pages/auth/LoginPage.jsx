import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  Package,
  Scissors,
  ShieldCheck,
  Sparkles,
  UserCog,
  UsersRound,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  forgotPassword,
  googleLoginUrl,
  isGoogleLoginConfigured,
  resetPassword,
} from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import GoogleLogo from '../../components/GoogleLogo';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [mode, setMode] = useState('OWNER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [recoverOpen, setRecoverOpen] = useState(false);
  const [pendingAccesses, setPendingAccesses] = useState([]);

  const modeInfo = useMemo(() => {
    if (mode === 'SUPER_ADMIN') {
      return {
        title: 'Modo Super Admin',
        subtitle:
          'Administra negocios, planes, suscripciones, pagos y operación general del SaaS.',
        badge: 'Control SaaS',
        icon: ShieldCheck,
      };
    }

    return {
      title: 'Modo Dueño / Admin',
      subtitle:
        'Gestiona caja, ventas, agenda, clientes, profesionales, productos, puntos y reportes.',
      badge: 'Panel del negocio',
      icon: Building2,
    };
  }, [mode]);

  const googleLoginReady = isGoogleLoginConfigured();

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Ingresa correo y contraseña.');
      return;
    }

    setLoading(true);

    try {
      const result = await signIn({
        email,
        password,
        mode,
      });

      if (result.requiresAccessSelection) {
        setPendingAccesses(result.accesses || []);
        return;
      }

      navigate(result.redirectTo, { replace: true });
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAccessSelection(access) {
    setLoading(true);
    setErrorMsg('');

    try {
      const result = await signIn({ email, password, mode, access });
      navigate(result.redirectTo, { replace: true });
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo iniciar sesión en esta sede.');
      setPendingAccesses([]);
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    setErrorMsg('');

    if (mode === 'SUPER_ADMIN') {
      setErrorMsg('El acceso con Google esta disponible para duenos y administradores del negocio.');
      return;
    }

    const url = googleLoginUrl({ mode });
    if (!url) {
      setErrorMsg('El acceso con Google se activara cuando configuremos OAuth en produccion.');
      return;
    }

    window.location.href = url;
  }

  const ModeIcon = modeInfo.icon;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F5F7FB] text-[#0F172A]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,#DCEBFF_0,transparent_34%),radial-gradient(circle_at_90%_0%,rgba(34,197,94,0.13),transparent_28%)]" />
      <div className="absolute left-[-120px] top-[22%] h-[280px] w-[280px] rounded-full bg-blue-200/30 blur-3xl" />
      <div className="absolute bottom-[-120px] right-[-120px] h-[320px] w-[320px] rounded-full bg-emerald-200/40 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-5 py-10 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1fr_480px] lg:items-center">
          <section>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-600 hover:text-blue-700"
            >
              <ArrowLeft size={17} strokeWidth={2.8} />
              Volver a la web
            </Link>

            <div className="mt-10 flex items-center gap-4">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] border border-amber-300/70 bg-neutral-950 shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
                <div className="absolute inset-1 rounded-[20px] bg-gradient-to-br from-neutral-900 to-neutral-950" />
                <img
                  src="/logo-super-gods.png"
                  alt="Gods Technologies S.A.C."
                  className="relative h-11 w-11 rounded-2xl object-cover"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-2xl font-black leading-none tracking-tight text-slate-950">
                    Gods Technologies
                  </p>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black tracking-[0.16em] text-amber-700">
                    S.A.C.
                  </span>
                </div>
                <p className="mt-1 text-sm font-bold text-slate-500">
                  Empresa creadora de Super Gods App
                </p>
              </div>
            </div>

            <div className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <ShieldCheck size={15} strokeWidth={3} />
              </span>
              Acceso seguro para dueños, admins y Super Admin
            </div>

            <h1 className="mt-6 max-w-2xl text-5xl font-black leading-[1] tracking-[-0.055em] text-slate-950 md:text-6xl">
              Controla tu negocio desde una pantalla más grande
            </h1>

            <p className="mt-6 max-w-xl text-lg font-medium leading-8 text-slate-600">
              Ingresa con tu cuenta de Super Gods App para revisar caja, ventas,
              agenda, clientes, productos, profesionales, puntos, promociones y reportes.
            </p>

            <div className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-3">
              <InfoCard icon={Banknote} title="Caja" text="Ingresos, gastos y métodos de pago." />
              <InfoCard icon={CalendarDays} title="Agenda" text="Reservas, horarios y operación diaria." />
              <InfoCard icon={BarChart3} title="Reportes" text="Ventas, utilidad y rendimiento." />
            </div>

            <div className="mt-6 grid max-w-2xl gap-4 sm:grid-cols-3">
              <InfoCard icon={UsersRound} title="Clientes" text="Historial, puntos y recompensas." />
              <InfoCard icon={Package} title="Productos" text="Inventario y stock por sede." />
              <InfoCard icon={Scissors} title="Profesionales" text="Horarios, pagos y comisiones." />
            </div>
          </section>

          <section className="rounded-[38px] border border-white bg-white/95 p-5 shadow-[0_35px_100px_rgba(15,23,42,0.16)] backdrop-blur-xl">
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0F2A5F] to-[#07152F] p-6 text-white">
              <div className="absolute right-[-50px] top-[-60px] h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute bottom-[-60px] left-[-60px] h-40 w-40 rounded-full bg-emerald-400/20 blur-2xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-blue-100">
                    <ModeIcon size={15} strokeWidth={3} />
                    {modeInfo.badge}
                  </div>

                  <h2 className="mt-5 text-3xl font-black tracking-[-0.04em]">
                    Iniciar sesión
                  </h2>

                  <p className="mt-3 text-sm font-medium leading-6 text-blue-100">
                    {modeInfo.subtitle}
                  </p>
                </div>

                <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10 sm:flex">
                  <LockKeyhole size={25} strokeWidth={2.6} />
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <ModeButton
                active={mode === 'OWNER'}
                icon={Building2}
                label="Dueño / Admin"
                onClick={() => setMode('OWNER')}
              />

              <ModeButton
                active={mode === 'SUPER_ADMIN'}
                icon={UserCog}
                label="Super Admin"
                onClick={() => setMode('SUPER_ADMIN')}
              />
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-black text-slate-800">
                  Correo electrónico
                </label>

                <div className="mt-2 flex rounded-2xl border border-slate-200 bg-white transition focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100">
                  <div className="flex w-12 shrink-0 items-center justify-center text-slate-400">
                    <Mail size={19} strokeWidth={2.6} />
                  </div>

                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="correo@negocio.com"
                    autoComplete="email"
                    className="w-full rounded-2xl bg-transparent px-1 py-4 pr-4 text-slate-950 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-black text-slate-800">
                    Contraseña
                  </label>

                  <button
                    type="button"
                    onClick={() => setRecoverOpen(true)}
                    className="text-xs font-black text-blue-700 transition hover:text-[#0F2A5F]"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <div className="mt-2 flex rounded-2xl border border-slate-200 bg-white transition focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100">
                  <div className="flex w-12 shrink-0 items-center justify-center text-slate-400">
                    <KeyRound size={19} strokeWidth={2.6} />
                  </div>

                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Tu contraseña"
                    autoComplete="current-password"
                    className="w-full rounded-2xl bg-transparent px-1 py-4 text-slate-950 outline-none placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="flex w-14 shrink-0 items-center justify-center text-slate-500 transition hover:text-blue-700"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff size={19} strokeWidth={2.6} /> : <Eye size={19} strokeWidth={2.6} />}
                  </button>
                </div>
              </div>

              {pendingAccesses.length > 0 && (
                <div className="rounded-3xl border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="mt-0.5 shrink-0 text-blue-700" size={20} />
                    <div>
                      <p className="font-black text-slate-950">¿En qué sede vas a trabajar?</p>
                      <p className="mt-1 text-xs font-semibold text-slate-600">El acceso y las operaciones quedarán vinculados a esta sede.</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2">
                    {pendingAccesses.map((access) => (
                      <button
                        key={`${access.tenantId}-${access.branchId}-${access.role}`}
                        type="button"
                        disabled={loading}
                        onClick={() => handleAccessSelection(access)}
                        className="flex items-center justify-between rounded-2xl border border-blue-100 bg-white px-4 py-3 text-left transition hover:border-blue-500 hover:shadow-md disabled:opacity-60"
                      >
                        <span>
                          <span className="block font-black text-slate-950">{access.branchName || 'Sede asignada'}</span>
                          <span className="block text-xs font-bold text-slate-500">{access.tenantName} · {String(access.role || '').toUpperCase() === 'OWNER' ? 'Dueño' : 'Administrador'}</span>
                        </span>
                        <ArrowLeft className="rotate-180 text-blue-700" size={18} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  <AlertCircle size={18} strokeWidth={2.6} className="mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || pendingAccesses.length > 0}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0F2A5F] px-5 py-4 font-black text-white shadow-xl shadow-blue-900/20 transition hover:-translate-y-0.5 hover:bg-[#123A84] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Ingresando...
                  </>
                ) : (
                  <>
                    <LockKeyhole size={18} strokeWidth={2.7} />
                    Ingresar al panel
                  </>
                )}
              </button>
            </form>

            <div className="mt-5">
              <div className="relative flex items-center justify-center">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="px-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                  o acceso rapido
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading || mode === 'SUPER_ADMIN' || !googleLoginReady}
                className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-55"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-lg shadow-sm ring-1 ring-slate-200">
                  <GoogleLogo className="h-4 w-4" />
                </span>
                {googleLoginReady ? 'Continuar con Google' : 'Google pronto'}
              </button>

              <p className="mt-3 text-center text-xs font-semibold leading-5 text-slate-500">
                Si ya tienes cuenta con correo y contrasena, podras vincular tu
                Gmail desde Seguridad cuando el backend confirme tu identidad.
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
              <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-[#0F2A5F] shadow-sm">
                <BadgeCheck size={19} strokeWidth={2.7} />
              </div>
              <p className="text-xs font-semibold leading-5 text-slate-500">
                Usa el mismo acceso que tienes en Super Gods App. El sistema te enviará automáticamente al panel según tu rol.
              </p>
            </div>

            <div className="mt-4 flex justify-center">
              <Link
                to="/"
                className="text-sm font-black text-blue-700 transition hover:text-[#0F2A5F]"
              >
                ¿Aún no tienes cuenta? Solicita una demo gratis
              </Link>
            </div>
          </section>
        </div>
      </div>

      {recoverOpen && (
        <RecoverPasswordModal
          initialEmail={email}
          onClose={() => setRecoverOpen(false)}
          onPasswordChanged={(newEmail) => {
            setEmail(newEmail);
            setPassword('');
            setRecoverOpen(false);
            setErrorMsg('Contraseña actualizada. Ingresa con tu nueva clave.');
          }}
        />
      )}
    </div>
  );
}

function RecoverPasswordModal({ initialEmail = '', onClose, onPasswordChanged }) {
  const [step, setStep] = useState('send');
  const [email, setEmail] = useState(initialEmail || '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });

  async function handleSendCode(event) {
    event.preventDefault();
    setStatus({ type: '', text: '' });

    const cleanEmail = email.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setStatus({ type: 'error', text: 'Ingresa un correo válido.' });
      return;
    }

    setLoading(true);

    try {
      await forgotPassword(cleanEmail);

      setStep('reset');
      setStatus({
        type: 'success',
        text:
          'Si el correo existe, te enviaremos un código de recuperación. Revisa tu bandeja de entrada.',
      });
    } catch (error) {
      setStatus({
        type: 'error',
        text:
          error?.message ||
          'No se pudo enviar el código. Intenta nuevamente.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    setStatus({ type: '', text: '' });

    const cleanEmail = email.trim();
    const cleanCode = code.trim();
    const cleanPassword = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setStatus({ type: 'error', text: 'Ingresa un correo válido.' });
      return;
    }

    if (!cleanCode) {
      setStatus({ type: 'error', text: 'Ingresa el código recibido.' });
      return;
    }

    if (cleanPassword.length < 6) {
      setStatus({
        type: 'error',
        text: 'La nueva contraseña debe tener al menos 6 caracteres.',
      });
      return;
    }

    if (cleanPassword !== cleanConfirm) {
      setStatus({
        type: 'error',
        text: 'La confirmación no coincide con la nueva contraseña.',
      });
      return;
    }

    setLoading(true);

    try {
      await resetPassword({
        email: cleanEmail,
        code: cleanCode,
        newPassword: cleanPassword,
      });

      onPasswordChanged(cleanEmail);
    } catch (error) {
      setStatus({
        type: 'error',
        text:
          error?.message ||
          'No se pudo actualizar la contraseña. Verifica el código.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[34px] border border-white bg-white p-5 shadow-[0_35px_100px_rgba(15,23,42,0.35)]">
        <div className="rounded-[28px] bg-gradient-to-br from-[#0F2A5F] to-[#07152F] p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-blue-100">
                <LockKeyhole size={15} strokeWidth={3} />
                Recuperar acceso
              </div>

              <h2 className="mt-4 text-2xl font-black tracking-[-0.03em]">
                {step === 'send'
                  ? '¿Olvidaste tu contraseña?'
                  : 'Crea una nueva contraseña'}
              </h2>

              <p className="mt-3 text-sm font-medium leading-6 text-blue-100">
                {step === 'send'
                  ? 'Ingresa tu correo y te enviaremos un código de recuperación.'
                  : 'Ingresa el código enviado a tu correo y define tu nueva clave.'}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Cerrar recuperación"
            >
              <X size={20} strokeWidth={3} />
            </button>
          </div>
        </div>

        {step === 'send' ? (
          <form onSubmit={handleSendCode} className="mt-5 space-y-4">
            <LoginInput
              label="Correo electrónico"
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="correo@negocio.com"
              autoComplete="email"
              icon={Mail}
            />

            {status.text && <RecoverStatus status={status} />}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0F2A5F] px-5 py-4 font-black text-white shadow-xl shadow-blue-900/20 transition hover:-translate-y-0.5 hover:bg-[#123A84] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Enviando código...
                </>
              ) : (
                <>
                  <Mail size={18} strokeWidth={2.7} />
                  Enviar código
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="mt-5 space-y-4">
            <LoginInput
              label="Correo electrónico"
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="correo@negocio.com"
              autoComplete="email"
              icon={Mail}
            />

            <LoginInput
              label="Código recibido"
              value={code}
              onChange={setCode}
              type="text"
              placeholder="Ej: 123456"
              autoComplete="one-time-code"
              icon={BadgeCheck}
            />

            <PasswordRecoveryInput
              label="Nueva contraseña"
              value={newPassword}
              onChange={setNewPassword}
              visible={showNewPassword}
              onToggle={() => setShowNewPassword((prev) => !prev)}
              placeholder="Mínimo 6 caracteres"
            />

            <PasswordRecoveryInput
              label="Confirmar nueva contraseña"
              value={confirmPassword}
              onChange={setConfirmPassword}
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((prev) => !prev)}
              placeholder="Repite tu nueva contraseña"
            />

            {status.text && <RecoverStatus status={status} />}

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setStep('send');
                  setStatus({ type: '', text: '' });
                }}
                disabled={loading}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-black text-slate-700 transition hover:border-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Enviar otro código
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#0F2A5F] px-5 py-4 font-black text-white shadow-xl shadow-blue-900/20 transition hover:-translate-y-0.5 hover:bg-[#123A84] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} strokeWidth={2.7} />
                    Actualizar contraseña
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <p className="mt-4 text-center text-xs font-semibold leading-5 text-slate-500">
          El código de recuperación vence en pocos minutos. Si no lo recibes,
          revisa spam o solicita uno nuevo.
        </p>
      </div>
    </div>
  );
}

function ModeButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
        active
          ? 'bg-[#0F2A5F] text-white shadow-lg shadow-blue-900/20'
          : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-600 hover:text-blue-700'
      }`}
    >
      <Icon size={17} strokeWidth={2.8} />
      {label}
    </button>
  );
}

function LoginInput({
  label,
  value,
  onChange,
  type,
  placeholder,
  autoComplete,
  icon: Icon,
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-slate-800">{label}</span>

      <div className="flex rounded-2xl border border-slate-200 bg-white transition focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100">
        {Icon && (
          <div className="flex w-12 shrink-0 items-center justify-center text-slate-400">
            <Icon size={19} strokeWidth={2.6} />
          </div>
        )}

        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-2xl bg-transparent px-1 py-4 pr-4 text-slate-950 outline-none placeholder:text-slate-400"
        />
      </div>
    </label>
  );
}

function PasswordRecoveryInput({
  label,
  value,
  onChange,
  visible,
  onToggle,
  placeholder,
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-slate-800">{label}</span>

      <div className="flex rounded-2xl border border-slate-200 bg-white transition focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100">
        <div className="flex w-12 shrink-0 items-center justify-center text-slate-400">
          <KeyRound size={19} strokeWidth={2.6} />
        </div>

        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          autoComplete="new-password"
          className="w-full rounded-2xl bg-transparent px-1 py-4 text-slate-950 outline-none placeholder:text-slate-400"
        />

        <button
          type="button"
          onClick={onToggle}
          className="flex w-14 shrink-0 items-center justify-center text-slate-500 transition hover:text-blue-700"
          aria-label={visible ? 'Ocultar contraseña' : 'Ver contraseña'}
        >
          {visible ? <EyeOff size={19} strokeWidth={2.6} /> : <Eye size={19} strokeWidth={2.6} />}
        </button>
      </div>
    </label>
  );
}

function RecoverStatus({ status }) {
  const isSuccess = status.type === 'success';

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-bold ${
        isSuccess
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-red-200 bg-red-50 text-red-700'
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 size={18} strokeWidth={2.6} className="mt-0.5 shrink-0" />
      ) : (
        <AlertCircle size={18} strokeWidth={2.6} className="mt-0.5 shrink-0" />
      )}
      <span>{status.text}</span>
    </div>
  );
}

function InfoCard({ icon: Icon, title, text }) {
  return (
    <div className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-100 hover:shadow-xl hover:shadow-slate-200/70">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0F2A5F] ring-1 ring-blue-100 transition group-hover:scale-105">
        <Icon size={22} strokeWidth={2.7} />
      </div>

      <div className="text-xl font-black text-slate-950">{title}</div>

      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
        {text}
      </p>
    </div>
  );
}
