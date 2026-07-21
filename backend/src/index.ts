import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import assetRoutes              from './routes/assets';
import workOrderRoutes          from './routes/workOrders';
import inventoryRoutes          from './routes/inventory';
import preventiveMaintenanceRoutes from './routes/preventiveMaintenance';
import chatRoutes               from './routes/chat';
import reportsRoutes            from './routes/reports';
import usersRoutes              from './routes/users';
import authRoutes               from './routes/auth';

const app  = express();
const PORT = process.env.PORT || 3001;

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth',                  authRoutes);
app.use('/api/assets',                assetRoutes);
app.use('/api/work-orders',           workOrderRoutes);
app.use('/api/inventory',             inventoryRoutes);
app.use('/api/preventive-maintenance', preventiveMaintenanceRoutes);
app.use('/api/chat',                  chatRoutes);
app.use('/api/reports',               reportsRoutes);
app.use('/api/users',                 usersRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
