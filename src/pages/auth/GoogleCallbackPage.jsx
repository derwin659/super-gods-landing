import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function decodeSessionParam(value) {
  if (!value) return null;

  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(window.atob(normalized)));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function sessionFromParams(params) {
  const encodedSession = decodeSessionParam(params.get('session'));
  if (encodedSession?.token) return encodedSession;

  const token = params.get('token') || params.get('jwt') || params.get('accessToken');
  const role = params.get('role');

  if (!token || !role) return null;

  return {
    token,
    role,
    userId: params.get('userId'),
    nombre: params.get('nombre') || params.get('userName'),
    email: params.get('email'),
    tenantId: params.get('tenantId'),
    tenantName: params.get('tenantName'),
    branchId: params.get('branchId'),
    branchName: params.get('branchName'),
    businessType: params.get('businessType'),
  };
}

export default function GoogleCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { completeExternalSession } = useAuth();
  const [error, setError] = useState('');

  const providerError = useMemo(() => {
    return params.get('error') || params.get('message') || '';
  }, [params]);

  useEffect(() => {
    if (providerError) {
      setError(providerError);
      return;
    }

    const finalSession = sessionFromParams(params);

    if (!finalSession) {
      setError('No recibimos una sesion valida desde Google. Intenta ingresar nuevamente.');
      return;
    }

    const result = completeExternalSession(finalSession);
    navigate(result.redirectTo, { replace: true });
  }, [completeExternalSession, navigate, params, providerError]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F7FB] px-5 text-[#0F172A]">
      <div className="w-full max-w-md rounded-[34px] border border-white bg-white p-7 text-center shadow-[0_35px_100px_rgba(15,23,42,0.16)]">
        {error ? (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertCircle size={26} strokeWidth={2.8} />
            </div>
            <h1 className="mt-5 text-2xl font-black">No se pudo iniciar con Google</h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">{error}</p>
            <Link
              to="/login"
              className="mt-6 inline-flex w-full justify-center rounded-2xl bg-[#0F2A5F] px-5 py-4 text-sm font-black text-white transition hover:bg-[#123A84]"
            >
              Volver al login
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={26} strokeWidth={2.8} />
            </div>
            <h1 className="mt-5 text-2xl font-black">Conectando tu cuenta</h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
              Estamos validando tu acceso de Google y preparando tu panel.
            </p>
            <Loader2 className="mx-auto mt-6 animate-spin text-[#0F2A5F]" size={28} />
          </>
        )}
      </div>
    </div>
  );
}
