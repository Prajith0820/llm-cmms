import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /api/preventive-maintenance
router.get('/', async (_req: Request, res: Response) => {
  try {
    const schedules = await prisma.preventiveMaintenance.findMany({
      include:  { asset: { select: { id: true, name: true, category: true } } },
      orderBy:  { nextMaintenance: 'asc' }
    });
    res.json(schedules);
  } catch {
    res.status(500).json({ error: 'Failed to fetch PM schedules' });
  }
});

// GET /api/preventive-maintenance/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const pm = await prisma.preventiveMaintenance.findUnique({
      where:   { id: req.params.id },
      include: { asset: true }
    });
    if (!pm) return res.status(404).json({ error: 'PM schedule not found' });
    res.json(pm);
  } catch {
    res.status(500).json({ error: 'Failed to fetch PM schedule' });
  }
});

// POST /api/preventive-maintenance
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, frequencyDays, nextMaintenance, assetId } = req.body;
    const pm = await prisma.preventiveMaintenance.create({
      data: {
        title, description,
        frequencyDays: Number(frequencyDays),
        nextMaintenance: new Date(nextMaintenance),
        assetId
      },
      include: { asset: true }
    });
    res.status(201).json(pm);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create PM schedule' });
  }
});

// PUT /api/preventive-maintenance/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { title, description, frequencyDays, nextMaintenance, lastMaintenance } = req.body;
    const pm = await prisma.preventiveMaintenance.update({
      where: { id: req.params.id },
      data: {
        title, description,
        ...(frequencyDays    ? { frequencyDays: Number(frequencyDays) } : {}),
        ...(nextMaintenance  ? { nextMaintenance: new Date(nextMaintenance) } : {}),
        ...(lastMaintenance  ? { lastMaintenance: new Date(lastMaintenance) } : {})
      }
    });
    res.json(pm);
  } catch {
    res.status(500).json({ error: 'Failed to update PM schedule' });
  }
});

// DELETE /api/preventive-maintenance/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.preventiveMaintenance.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete PM schedule' });
  }
});

export default router;
