# Fix Super Admin Web

Reemplaza:
- src/App.jsx
- src/components/super-admin/SuperAdminLayout.jsx
- src/pages/super-admin/index.js

Asegúrate de tener también:
- src/pages/super-admin/SuperAdminDashboard.jsx
- src/pages/super-admin/SuperAdminTenants.jsx
- src/pages/super-admin/SuperAdminPayments.jsx
- src/pages/super-admin/SuperAdminCreateBarbershop.jsx
- src/api/superAdminApi.js

Luego elimina el uso antiguo:
- src/pages/admin/SuperAdminDashboardPage.jsx ya no se usa.
