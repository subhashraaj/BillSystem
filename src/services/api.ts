// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Generic API request function
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message = isJson
        ? (data.error || data.message || data.errors?.[0]?.msg)
        : data;
      throw new Error(message || `HTTP ${response.status}`);
    }

    return data as any;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// Customer API functions
export const customerAPI = {
  getAll: () => apiRequest('/customers'),
  getById: (id: number) => apiRequest(`/customers/${id}`),
  create: (data: any) => apiRequest('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => apiRequest(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => apiRequest(`/customers/${id}`, {
    method: 'DELETE',
  }),
};

// Item API functions
export const itemAPI = {
  getAll: () => apiRequest('/items'),
  getById: (id: number) => apiRequest(`/items/${id}`),
  create: (data: any) => apiRequest('/items', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => apiRequest(`/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => apiRequest(`/items/${id}`, {
    method: 'DELETE',
  }),
  updateStock: (id: number, quantity: number, operation: 'add' | 'subtract' | 'set') => 
    apiRequest(`/items/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity, operation }),
    }),
};

// Raw Materials API functions
export const rawMaterialAPI = {
  getAll: () => apiRequest('/raw-materials'),
  getById: (id: number) => apiRequest(`/raw-materials/${id}`),
  create: (data: any) => apiRequest('/raw-materials', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => apiRequest(`/raw-materials/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => apiRequest(`/raw-materials/${id}`, {
    method: 'DELETE',
  }),
  updateStock: (id: number, quantity: number, operation: 'add' | 'subtract' | 'set') => 
    apiRequest(`/raw-materials/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity, operation }),
    }),
};

// Manufacturing API functions
export const manufacturingAPI = {
  getAll: () => apiRequest('/manufacturing'),
  getById: (id: number) => apiRequest(`/manufacturing/${id}`),
  create: (data: any) => apiRequest('/manufacturing', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => apiRequest(`/manufacturing/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => apiRequest(`/manufacturing/${id}`, {
    method: 'DELETE',
  }),
};

// Invoice API functions
export const invoiceAPI = {
  getAll: () => apiRequest('/invoices'),
  getById: (id: number) => apiRequest(`/invoices/${id}`),
  create: (data: any) => apiRequest('/invoices', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => apiRequest(`/invoices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => apiRequest(`/invoices/${id}`, {
    method: 'DELETE',
  }),
};

// Payment API functions
export const paymentAPI = {
  getAll: () => apiRequest('/payments'),
  getById: (id: number) => apiRequest(`/payments/${id}`),
  create: (data: any) => apiRequest('/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => apiRequest(`/payments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => apiRequest(`/payments/${id}`, {
    method: 'DELETE',
  }),
};

// Health check
export const healthCheck = () => apiRequest('/health');
