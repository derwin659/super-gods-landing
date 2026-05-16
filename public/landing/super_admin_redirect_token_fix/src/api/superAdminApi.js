const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "https://gods-saas-backend-production.up.railway.app";

function getToken() {
  return (
    localStorage.getItem("JWT_TOKEN") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    ""
  );
}

async function request(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    const message =
      body?.message ||
      body?.error ||
      body?.details ||
      (typeof body === "string" && body.trim()) ||
      `Error HTTP ${response.status}`;
    throw new Error(message);
  }

  return body;
}

export const superAdminApi = {
  getDashboard() {
    return request("/api/super-admin/dashboard");
  },

  getTenants() {
    return request("/api/super-admin/tenants");
  },

  getPendingPayments() {
    return request("/api/super-admin/payments/pending");
  },

  approvePayment(paymentId, notes = "Pago aprobado desde panel web super admin") {
    return request(`/api/super-admin/payments/${paymentId}/approve`, {
      method: "POST",
      body: JSON.stringify({
        approvedBy: "superadmin",
        notes,
      }),
    });
  },

  rejectPayment(paymentId, reason = "Pago rechazado desde panel web super admin") {
    return request(`/api/super-admin/payments/${paymentId}/reject`, {
      method: "POST",
      body: JSON.stringify({
        rejectedBy: "superadmin",
        reason,
      }),
    });
  },

  createTenant(payload) {
    return request("/api/super-admin/tenants", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
