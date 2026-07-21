import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

async function generatePMNumber(): Promise<string> {
  const count = await prisma.preventiveMaintenance.count();
  return `PM-${String(count + 1).padStart(3, '0')}`;
}

router.get('/', async (_req: Request, res: Response) => {
  try {
    const schedules = await prisma.preventiveMaintenance.findMany({
      include:  { asset: { select: { id: true, assetName: true, category: true } } },
      orderBy:  { nextDueDate: 'asc' }
    });
    res.json(schedules);
  } catch {
    res.status(500).json({ error: 'Failed to fetch PM schedules' });
  }
});

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

router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, frequency, startDate, assetId, assignedTechnicianId } = req.body;
    const pmNumber = await generatePMNumber();
    const start = new Date(startDate);
    const pm = await prisma.preventiveMaintenance.create({
      data: {
        pmNumber,
        title,
        description,
        frequency,
        startDate: start,
        nextDueDate: start,
        assetId,
        assignedTechnicianId,
        organizationId: await prisma.organization.findFirst().then(o => o!.id),
        createdById: await prisma.user.findFirst().then(u => u!.id),
      },
      include: { asset: true }
    });
    res.status(201).json(pm);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create PM schedule' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { title, description, frequency, nextDueDate, lastMaintenance } = req.body;
    const pm = await prisma.preventiveMaintenance.update({
      where: { id: req.params.id },
      data: {
        title, description,
        ...(frequency ? { frequency } : {}),
        ...(nextDueDate ? { nextDueDate: new Date(nextDueDate) } : {}),
        ...(lastMaintenance ? { assetRestoredAt: new Date(lastMaintenance) } : {})
      }
    });
    res.json(pm);
  } catch {
    res.status(500).json({ error: 'Failed to update PM schedule' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.preventiveMaintenance.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete PM schedule' });
  }
});

export default router;
