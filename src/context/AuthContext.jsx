import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
  } from 'react';
  
  import { loginBasic, loginFinal } from '../api/authApi';
  
  const AuthContext = createContext(null);
  
  const SESSION_KEYS = {
    token: 'JWT_TOKEN',
    tenantId: 'TENANT_ID',
    tenantName: 'TENANT_NAME',
    userId: 'USER_ID',
    userName: 'USER_NAME',
    userEmail: 'USER_EMAIL',
    role: 'ROLE',
    branchId: 'BRANCH_ID',
    branchName: 'BRANCH_NAME',
    businessType: 'BUSINESS_TYPE',
    isOwner: 'IS_OWNER',
  };
  
  function readSession() {
    const token = localStorage.getItem(SESSION_KEYS.token);
    const role = localStorage.getItem(SESSION_KEYS.role);
  
    if (!token || !role) return null;
  
    return {
      token,
      role,
      tenantId: localStorage.getItem(SESSION_KEYS.tenantId),
      tenantName: localStorage.getItem(SESSION_KEYS.tenantName),
      userId: localStorage.getItem(SESSION_KEYS.userId),
      userName: localStorage.getItem(SESSION_KEYS.userName),
      userEmail: localStorage.getItem(SESSION_KEYS.userEmail),
      branchId: localStorage.getItem(SESSION_KEYS.branchId),
      branchName: localStorage.getItem(SESSION_KEYS.branchName),
      businessType: localStorage.getItem(SESSION_KEYS.businessType),
      isOwner: localStorage.getItem(SESSION_KEYS.isOwner) === 'true',
    };
  }
  
  function saveSession(finalRes) {
    const cleanRole = String(finalRes.role || '').trim().toUpperCase();
  
    localStorage.setItem(SESSION_KEYS.token, finalRes.token || '');
    localStorage.setItem('token', finalRes.token || '');
    localStorage.setItem('authToken', finalRes.token || '');
    localStorage.setItem('accessToken', finalRes.token || '');
    localStorage.setItem(SESSION_KEYS.userId, String(finalRes.userId || ''));
    localStorage.setItem(SESSION_KEYS.userName, finalRes.nombre || '');
    localStorage.setItem(SESSION_KEYS.role, cleanRole);
    localStorage.setItem(SESSION_KEYS.isOwner, cleanRole === 'OWNER' ? 'true' : 'false');
  
    if (finalRes.email) {
      localStorage.setItem(SESSION_KEYS.userEmail, finalRes.email);
    } else {
      localStorage.removeItem(SESSION_KEYS.userEmail);
    }
  
    if (finalRes.tenantId !== null && finalRes.tenantId !== undefined) {
      localStorage.setItem(SESSION_KEYS.tenantId, String(finalRes.tenantId));
    } else {
      localStorage.removeItem(SESSION_KEYS.tenantId);
    }
  
    if (finalRes.tenantName) {
      localStorage.setItem(SESSION_KEYS.tenantName, finalRes.tenantName);
    } else {
      localStorage.removeItem(SESSION_KEYS.tenantName);
    }
  
    if (finalRes.branchId !== null && finalRes.branchId !== undefined) {
      localStorage.setItem(SESSION_KEYS.branchId, String(finalRes.branchId));
    } else {
      localStorage.removeItem(SESSION_KEYS.branchId);
    }
  
    if (finalRes.branchName) {
      localStorage.setItem(SESSION_KEYS.branchName, finalRes.branchName);
    } else {
      localStorage.removeItem(SESSION_KEYS.branchName);
    }

    const businessType =
      finalRes.businessType ||
      finalRes.tenantBusinessType ||
      finalRes.tipoNegocio ||
      finalRes.rubro ||
      '';

    if (businessType) {
      localStorage.setItem(SESSION_KEYS.businessType, String(businessType).trim().toUpperCase());
    } else {
      localStorage.removeItem(SESSION_KEYS.businessType);
    }
  
    return readSession();
  }
  
  function clearSessionStorage() {
    Object.values(SESSION_KEYS).forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem('ADMIN_PERMISSIONS');
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('accessToken');
  }
  
  function resolveHomeByRole(role) {
    const cleanRole = String(role || '').toUpperCase();
  
    if (cleanRole === 'OWNER') return '/owner/dashboard';
    if (cleanRole === 'ADMIN' || cleanRole === 'CASHIER') return '/owner/dashboard';
    if (cleanRole === 'SUPER_ADMIN') return '/super-admin';
  
    return '/login';
  }
  
  export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [checkingSession, setCheckingSession] = useState(true);
  
    useEffect(() => {
      setSession(readSession());
      setCheckingSession(false);
    }, []);
  
    const signIn = useCallback(async ({ email, password, mode = 'OWNER', access = null }) => {
      const basic = await loginBasic(email, password);

      const globalRole = String(basic.globalRole || '').toUpperCase();
      const modeClean = String(mode || 'OWNER').toUpperCase();

      let finalRes;

      if (globalRole === 'SUPER_ADMIN' || modeClean === 'SUPER_ADMIN') {
        finalRes = await loginFinal({
          userId: basic.userId,
          mode: 'SUPER_ADMIN',
        });
      } else {
        const tenants = Array.isArray(basic.tenants) ? basic.tenants : [];
        const allowedAccesses = tenants.filter((item) => {
          const role = String(item.role || '').toUpperCase();
          return role === 'OWNER' || role === 'ADMIN' || role === 'CASHIER';
        });

        if (allowedAccesses.length === 0) {
          throw new Error('Este usuario no tiene barberías asignadas.');
        }

        if (!access && allowedAccesses.length > 1) {
          return {
            requiresAccessSelection: true,
            accesses: allowedAccesses,
          };
        }

        const selectedTenant = access
          ? allowedAccesses.find((item) =>
              String(item.tenantId) === String(access.tenantId) &&
              String(item.branchId) === String(access.branchId)
            )
          : allowedAccesses[0];

        if (!selectedTenant) {
          throw new Error('La sede seleccionada ya no está disponible para este usuario.');
        }

        finalRes = await loginFinal({
          userId: basic.userId,
          tenantId: selectedTenant.tenantId,
          branchId: selectedTenant.branchId,
          mode: 'TENANT',
        });
      }

      const saved = saveSession(finalRes);
      setSession(saved);

      return {
        session: saved,
        redirectTo: resolveHomeByRole(saved?.role),
      };
    }, []);

    const completeExternalSession = useCallback((finalRes) => {
      const saved = saveSession(finalRes || {});
      setSession(saved);

      return {
        session: saved,
        redirectTo: resolveHomeByRole(saved?.role),
      };
    }, []);
  
    const signOut = useCallback(() => {
      clearSessionStorage();
      setSession(null);
    }, []);
  
    const value = useMemo(
      () => ({
        session,
        checkingSession,
        isAuthenticated: Boolean(session?.token),
        signIn,
        completeExternalSession,
        signOut,
        resolveHomeByRole,
      }),
      [session, checkingSession, signIn, completeExternalSession, signOut]
    );
  
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }
  
  export function useAuth() {
    const ctx = useContext(AuthContext);
  
    if (!ctx) {
      throw new Error('useAuth debe usarse dentro de AuthProvider');
    }
  
    return ctx;
  }
