import axios from 'axios';

const rawBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
const backendUrl = rawBackendUrl.replace(/\/+$/, '').replace(/\/api$/, '');
const api = axios.create({
  baseURL: `${backendUrl}/api`,
  headers: { 'Content-Type': 'application/json' },
});

export default api;

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

// ─── ASSETS ───────────────────────────────────────────────────────────────────
export const getAssets = ()     => api.get('/assets');
export const getAsset  = (id: string) => api.get(`/assets/${id}`);
export const createAsset = (data: any) => {
  const mapped = {
    assetName: data.name || data.assetName,
    category: data.category,
    location: data.location,
    manufacturer: data.manufacturer,
    serialNumber: data.serialNumber,
    description: data.description,
  };
  return api.post('/assets', mapped);
};
export const updateAsset = (id: string, data: any) => api.put(`/assets/${id}`, data);
export const deleteAsset = (id: string) => api.delete(`/assets/${id}`);

// ─── WORK ORDERS ──────────────────────────────────────────────────────────────
export const getWorkOrders  = ()              => api.get('/work-orders');
export const createWorkOrder= (data: any)     => api.post('/work-orders', data);
export const updateWorkOrder= (id: string, data: any) => api.put(`/work-orders/${id}`, data);
export const deleteWorkOrder= (id: string)    => api.delete(`/work-orders/${id}`);

// ─── PREVENTIVE MAINTENANCE ───────────────────────────────────────────────────
export const getPMSchedules  = ()             => api.get('/preventive-maintenance');
export const createPMSchedule= (data: any)    => api.post('/preventive-maintenance', data);
export const updatePMSchedule= (id: string, data: any) => api.put(`/preventive-maintenance/${id}`, data);
export const deletePMSchedule= (id: string)   => api.delete(`/preventive-maintenance/${id}`);

// ─── INVENTORY ────────────────────────────────────────────────────────────────
export const getInventory   = ()              => api.get('/inventory');
export const createInventory= (data: any)     => {
  const mapped = {
    partName: data.name || data.partName,
    description: data.description,
    unit: data.unit || 'PCS',
    minimumStock: data.minQuantity ?? data.minimumStock ?? 0,
    maximumStock: data.maxQuantity ?? data.maximumStock ?? 0,
    unitCost: data.unitCost ?? 0,
    categoryId: data.categoryId || null,
    warehouseId: data.warehouseId || null,
  };
  return api.post('/inventory', mapped);
};
export const issueInventory = (data: any)     => api.post('/inventory/issue', { sparePartId: data.inventoryId, quantity: data.quantity, notes: data.notes });
export const receiveInventory=(data: any)     => api.post('/inventory/receive', { sparePartId: data.inventoryId, quantity: data.quantity, notes: data.notes });

// ─── USERS ────────────────────────────────────────────────────────────────────
export const getTechnicians = () => api.get('/users/technicians');

// ─── CHAT ─────────────────────────────────────────────────────────────────────
export const sendChat = (messages: any[], context: any) =>
  api.post('/chat', { messages, context });

// ─── REPORTS ──────────────────────────────────────────────────────────────────
export const downloadMonthlyReport   = () => api.post('/reports/monthly', {}, { responseType: 'blob' });
export const downloadWorkOrdersReport= () => api.get('/reports/work-orders', { responseType: 'blob' });
