const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.qobo.dev";
const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) {
  console.warn(
    "Warning: VITE_API_KEY is not set. API requests may fail with 401 Unauthorized.",
  );
}

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const isFormData = options.body instanceof FormData;
  const headers = {
    "X-API-Key": API_KEY,
    ...options.headers,
  };

  if (!isFormData && !options.headers?.["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    const errorMessage =
      errorData.error?.message || errorData.message || response.statusText;
    const error = new Error(errorMessage);
    error.response = { data: errorData, status: response.status };
    throw error;
  }

  return response.json();
}

export const api = {
  users: {
    getAll: async (params) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : "";
      return await apiRequest(`/api/v1/users${query}`);
    },
    getById: async (id) => await apiRequest(`/api/v1/users/${id}`),
    create: async (data) =>
      await apiRequest("/api/v1/users", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: async (id, data) =>
      await apiRequest(`/api/v1/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: async (id) =>
      await apiRequest(`/api/v1/users/${id}`, { method: "DELETE" }),
  },

  schools: {
    getAll: async (params) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : "";
      return await apiRequest(`/api/v1/schools${query}`);
    },
    getById: async (id) => await apiRequest(`/api/v1/schools/${id}`),
    create: async (data) =>
      await apiRequest("/api/v1/schools", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: async (id, data) =>
      await apiRequest(`/api/v1/schools/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: async (id) =>
      await apiRequest(`/api/v1/schools/${id}`, { method: "DELETE" }),
  },

  batches: {
    getAll: async (params) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : "";
      return await apiRequest(`/api/v1/batches${query}`);
    },
    getById: async (id) => await apiRequest(`/api/v1/batches/${id}`),
    create: async (data) =>
      await apiRequest("/api/v1/batches", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: async (id, data) =>
      await apiRequest(`/api/v1/batches/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: async (id) =>
      await apiRequest(`/api/v1/batches/${id}`, { method: "DELETE" }),
  },

  students: {
    getAll: async (params) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : "";
      return await apiRequest(`/api/v1/students${query}`);
    },
    getById: async (id) => await apiRequest(`/api/v1/students/${id}`),
    create: async (data) =>
      await apiRequest("/api/v1/students", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: async (id, data) =>
      await apiRequest(`/api/v1/students/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: async (id) =>
      await apiRequest(`/api/v1/students/${id}`, { method: "DELETE" }),
  },

  student_fields: {
    getAll: async (params) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : "";
      return await apiRequest(`/api/v1/student_fields${query}`);
    },
    getById: async (id) => await apiRequest(`/api/v1/student_fields/${id}`),
    create: async (data) =>
      await apiRequest("/api/v1/student_fields", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: async (id, data) =>
      await apiRequest(`/api/v1/student_fields/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: async (id) =>
      await apiRequest(`/api/v1/student_fields/${id}`, { method: "DELETE" }),
  },

  student_field_values: {
    getAll: async (params) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : "";
      return await apiRequest(`/api/v1/student_field_values${query}`);
    },
    getById: async (id) =>
      await apiRequest(`/api/v1/student_field_values/${id}`),
    create: async (data) =>
      await apiRequest("/api/v1/student_field_values", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: async (id, data) =>
      await apiRequest(`/api/v1/student_field_values/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: async (id) =>
      await apiRequest(`/api/v1/student_field_values/${id}`, {
        method: "DELETE",
      }),
  },

  settings: {
    get: async () => {
      const result = await apiRequest("/api/v1/settings");
      return result.data?.[0] || {};
    },
    update: async (id, data) =>
      await apiRequest(`/api/v1/settings/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },

  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return await apiRequest("/api/v1/upload", {
      method: "POST",
      body: formData,
    });
  },

  getStorageInfo: async () => await apiRequest("/api/v1/storage"),
  listFiles: async () => await apiRequest("/files"),
  deleteFile: async (fileId) =>
    await apiRequest(`/files/${fileId}`, { method: "DELETE" }),
};
