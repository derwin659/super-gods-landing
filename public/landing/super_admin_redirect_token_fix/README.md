# Fix Super Admin: redirect + token

Reemplaza estos archivos:
- src/context/AuthContext.jsx
- src/api/superAdminApi.js

Cambios:
1. SUPER_ADMIN ahora redirige a /super-admin, no /super-admin/dashboard.
2. Se guarda el JWT también como token/authToken/accessToken para compatibilidad.
3. superAdminApi ahora lee primero JWT_TOKEN.
4. Al cerrar sesión también se limpian token/authToken/accessToken.

Además revisa en VS Code:
Ctrl + Shift + F -> SuperAdminDashboardPage
Debe quedar 0 resultados.

Ctrl + Shift + F -> /super-admin/dashboard
Puede quedar solo como ruta redirect en App.jsx:
<Route path="dashboard" element={<Navigate to="/super-admin" replace />} />
