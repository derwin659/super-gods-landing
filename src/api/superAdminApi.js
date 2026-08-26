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


async function requestForm(path, method, form) {
  const token = getToken();
  const data = new FormData();
  Object.entries(form).forEach(([key, value]) => {
    if (value !== null && value !== undefined && key !== 'id' && key !== 'logoUrl') data.append(key, value);
  });
  if (form.logo) { data.delete('logo'); data.append('logo', form.logo); }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method, body: data, headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || body?.error || `Error HTTP ${response.status}`);
  return body;
}
export const superAdminApi = {
  getFeaturedCustomers() { return request("/api/super-admin/featured-customers"); },
  createFeaturedCustomer(form) { return requestForm("/api/super-admin/featured-customers", "POST", form); },
  updateFeaturedCustomer(id, form) { return requestForm(`/api/super-admin/featured-customers/${id}`, "PUT", form); },
  deleteFeaturedCustomer(id) { return request(`/api/super-admin/featured-customers/${id}`, { method: "DELETE" }); },
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

  updateTenant(tenantId, payload) {
    return request(`/api/super-admin/tenants/${tenantId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  activateTenant(tenantId) {
    return request(`/api/super-admin/tenants/${tenantId}/activate`, {
      method: "PUT",
    });
  },

  suspendTenant(tenantId) {
    return request(`/api/super-admin/tenants/${tenantId}/suspend`, {
      method: "PUT",
    });
  },

  deleteTenant(tenantId) {
    return request(`/api/super-admin/tenants/${tenantId}`, {
      method: "DELETE",
    });
  },
  getReviewModeration(status = '') {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/api/super-admin/reviews${query}`);
  },

  moderateReview(reviewId, status, note) {
    return request(`/api/super-admin/reviews/${reviewId}/moderate`, {
      method: "PUT",
      body: JSON.stringify({ status, note }),
    });
  },
};
