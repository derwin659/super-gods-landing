import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getMyOwnerPermissions } from '../api/ownerPermissionsApi';
import { useAuth } from '../context/AuthContext';
import { hasAnyOwnerPermission } from '../utils/ownerPermissions';

export default function OwnerPermissionRoute({
  children,
  permissions = [],
  ownerOnly = false,
}) {
  const { session } = useAuth();

  const [loading, setLoading] = useState(true);
  const [permissionBundle, setPermissionBundle] = useState(null);

  const role = String(session?.role || '').toUpperCase();

  useEffect(() => {
    let mounted = true;

    async function loadPermissions() {
      setLoading(true);

      try {
        const data = await getMyOwnerPermissions();

        if (mounted) {
          setPermissionBundle(data);
        }
      } catch {
        if (mounted) {
          setPermissionBundle({
            owner: role === 'OWNER',
            permissions: [],
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (session?.token) {
      loadPermissions();
    } else {
      setPermissionBundle(null);
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [session?.token, role]);

  if (loading) {
    return (
      <div className="rounded-[28px] border border-neutral-200 bg-white p-6 font-black text-neutral-500 shadow-sm">
        Verificando permisos...
      </div>
    );
  }

  if (role === 'OWNER') {
    return children;
  }

  if (ownerOnly) {
    return <NoPermission />;
  }

  if (!permissions || permissions.length === 0) {
    return children;
  }

  const allowed = hasAnyOwnerPermission(permissionBundle, permissions);

  if (!allowed) {
    return <NoPermission />;
  }

  return children;
}

function NoPermission() {
  return (
    <div className="rounded-[34px] border border-red-100 bg-white p-8 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="inline-flex rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-red-700">
        Acceso restringido
      </div>

      <h2 className="mt-5 text-3xl font-black text-neutral-950">
        No tienes permiso para ver este módulo
      </h2>

      <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-neutral-500">
        Esta sección está limitada por el dueño de la barbería. Si necesitas acceso, solicita que te activen el permiso correspondiente desde Configuración → Administradores.
      </p>

      <a
        href="/owner/dashboard"
        className="mt-6 inline-flex rounded-2xl bg-neutral-950 px-5 py-4 text-sm font-black text-white transition hover:scale-[1.01]"
      >
        Volver al dashboard
      </a>
    </div>
  );
}