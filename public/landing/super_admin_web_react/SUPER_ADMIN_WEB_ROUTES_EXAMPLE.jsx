// React Router v6 example
import SuperAdminLayout from "./src/components/super-admin/SuperAdminLayout";
import SuperAdminDashboard from "./src/pages/super-admin/SuperAdminDashboard";
import SuperAdminTenants from "../../../src/pages/super-admin/SuperAdminTenants";
import SuperAdminPayments from "./src/pages/super-admin/SuperAdminPayments";
import SuperAdminCreateBarbershop from "./src/pages/super-admin/SuperAdminCreateBarbershop";

<Route path="/super-admin" element={<SuperAdminLayout />}>
  <Route index element={<SuperAdminDashboard />} />
  <Route path="barberias" element={<SuperAdminTenants />} />
  <Route path="pagos" element={<SuperAdminPayments />} />
  <Route path="crear-barberia" element={<SuperAdminCreateBarbershop />} />
</Route>
