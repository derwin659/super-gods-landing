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
      isOwner: localStorage.getItem(SESSION_KEYS.isOwner) === 'true',
    };
  }
  
  function saveSession(finalRes) {
    const cleanRole = String(finalRes.role || '').trim().toUpperCase();
  
    localStorage.setItem(SESSION_KEYS.token, finalRes.token || '');
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
  
    return readSession();
  }
  
  function clearSessionStorage() {
    Object.values(SESSION_KEYS).forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem('ADMIN_PERMISSIONS');
  }
  
  function resolveHomeByRole(role) {
    const cleanRole = String(role || '').toUpperCase();
  
    if (cleanRole === 'OWNER') return '/owner/dashboard';
    if (cleanRole === 'ADMIN') return '/admin/dashboard';
    if (cleanRole === 'SUPER_ADMIN') return '/super-admin/dashboard';
  
    return '/login';
  }
  
  export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [checkingSession, setCheckingSession] = useState(true);
  
    useEffect(() => {
      setSession(readSession());
      setCheckingSession(false);
    }, []);
  
    const signIn = useCallback(async ({ email, password, mode = 'OWNER' }) => {
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
  
        if (tenants.length === 0) {
          throw new Error('Este usuario no tiene barberías asignadas.');
        }
  
        const selectedTenant =
          tenants.find((item) => {
            const role = String(item.role || '').toUpperCase();
  
            if (modeClean === 'OWNER') return role === 'OWNER' || role === 'ADMIN';
            if (modeClean === 'ADMIN') return role === 'OWNER' || role === 'ADMIN';
  
            return false;
          }) || tenants[0];
  
        const selectedRole = String(selectedTenant.role || '').toUpperCase();
  
        if (!['OWNER', 'ADMIN'].includes(selectedRole)) {
          throw new Error(
            `Este usuario tiene rol ${selectedTenant.role}, pero la web está habilitada para OWNER/ADMIN.`
          );
        }
  
        finalRes = await loginFinal({
          userId: basic.userId,
          tenantId: selectedTenant.tenantId,
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
        signOut,
        resolveHomeByRole,
      }),
      [session, checkingSession, signIn, signOut]
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