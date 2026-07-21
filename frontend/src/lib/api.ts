import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
});

export default api;

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

// ─── ASSETS ───────────────────────────────────────────────────────────────────
export const getAssets = ()     => api.get('/assets');
export const getAsset  = (id: string) => api.get(`/assets/${id}`);
export const createAsset = (data: any)         => api.post('/assets', data);
export const updateAsset = (id: string, data: any) => api.put(`/assets/${id}`, data);
export const deleteAsset = (id: string)        => api.delete(`/assets/${id}`);

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
export const createInventory= (data: any)     => api.post('/inventory', data);
export const issueInventory = (data: any)     => api.post('/inventory/issue', data);
export const receiveInventory=(data: any)     => api.post('/inventory/receive', data);

// ─── USERS ────────────────────────────────────────────────────────────────────
export const getTechnicians = () => api.get('/users/technicians');

// ─── CHAT ─────────────────────────────────────────────────────────────────────
export const sendChat = (messages: any[], context: any) =>
  api.post('/chat', { messages, context });

// ─── REPORTS ──────────────────────────────────────────────────────────────────
export const downloadMonthlyReport   = () => api.post('/reports/monthly', {}, { responseType: 'blob' });
export const downloadWorkOrdersReport= () => api.get('/reports/work-orders', { responseType: 'blob' });
