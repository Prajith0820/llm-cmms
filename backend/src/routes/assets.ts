import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /api/assets
router.get('/', async (_req: Request, res: Response) => {
  try {
    const assets = await prisma.asset.findMany({ orderBy: { name: 'asc' } });
    res.json(assets);
  } catch {
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

// GET /api/assets/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const asset = await prisma.asset.findUnique({
      where:   { id: req.params.id },
      include: {
        workOrders:            { include: { assignedTo: true }, orderBy: { createdAt: 'desc' } },
        preventiveMaintenances:{ orderBy: { nextMaintenance: 'asc' } },
        maintenanceHistories:  { orderBy: { date: 'desc' } }
      }
    });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    res.json(asset);
  } catch {
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

// POST /api/assets
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, category, location, manufacturer, serialNumber, description, status } = req.body;
    const asset = await prisma.asset.create({
      data: { name, category, location, manufacturer, serialNumber, description, status: status || 'OPERATIONAL' }
    });
    res.status(201).json(asset);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

// PUT /api/assets/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, category, location, manufacturer, serialNumber, description, status } = req.body;
    const asset = await prisma.asset.update({
      where: { id: req.params.id },
      data:  { name, category, location, manufacturer, serialNumber, description, status }
    });
    res.json(asset);
  } catch {
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

// DELETE /api/assets/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.asset.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

export default router;
