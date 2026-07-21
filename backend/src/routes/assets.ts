import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const assets = await prisma.asset.findMany({ orderBy: { assetName: 'asc' } });
    res.json(assets);
  } catch {
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const asset = await prisma.asset.findUnique({
      where:   { id: req.params.id },
      include: {
        workOrders:            { include: { assignedTechnician: true }, orderBy: { createdAt: 'desc' } },
        preventiveMaintenances:{ orderBy: { nextDueDate: 'asc' } }
      }
    });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    res.json(asset);
  } catch {
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { assetName, category, location, manufacturer, serialNumber, description, status } = req.body;
    const asset = await prisma.asset.create({
      data: {
        assetName,
        category,
        location,
        manufacturer,
        serialNumber,
        description,
        status: status || 'ACTIVE',
        organizationId: await prisma.organization.findFirst().then(o => o!.id),
        createdById: await prisma.user.findFirst().then(u => u!.id),
        assetCode: `AST-${Date.now()}`
      }
    });
    res.status(201).json(asset);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { assetName, category, location, manufacturer, serialNumber, description, status } = req.body;
    const asset = await prisma.asset.update({
      where: { id: req.params.id },
      data:  { assetName, category, location, manufacturer, serialNumber, description, status }
    });
    res.json(asset);
  } catch {
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.asset.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

export default router;
