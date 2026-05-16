# Super Admin Web - Super Gods

Módulo React para mover Super Admin a web y eliminarlo del build iOS.

## Archivos
- src/api/superAdminApi.js
- src/components/super-admin/SuperAdminLayout.jsx
- src/pages/super-admin/SuperAdminDashboard.jsx
- src/pages/super-admin/SuperAdminTenants.jsx
- src/pages/super-admin/SuperAdminPayments.jsx
- src/pages/super-admin/SuperAdminCreateBarbershop.jsx
- src/pages/super-admin/index.js
- SUPER_ADMIN_WEB_ROUTES_EXAMPLE.jsx

## Variable de entorno
VITE_API_BASE_URL=https://gods-saas-backend-production.up.railway.app

## Token
El API lee el JWT desde localStorage: token, authToken o accessToken.

## Endpoints usados
GET /api/super-admin/dashboard
GET /api/super-admin/tenants
GET /api/super-admin/payments/pending
POST /api/super-admin/payments/{paymentId}/approve
POST /api/super-admin/payments/{paymentId}/reject
POST /api/super-admin/tenants

## Después en Flutter iOS
Elimina super_admin_screens.dart, super_admin_create_barbershop.dart, super_admin_payment_screens.dart y super_admin_tenant_screens.dart. También elimina rutas/imports de SuperAdminHomeScreen y /home-super-admin.
