import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

async function generateWONumber(): Promise<string> {
  const year  = new Date().getFullYear();
  const count = await prisma.workOrder.count();
  return `WO-${year}-${String(count + 1).padStart(3, '0')}`;
}

router.get('/', async (_req: Request, res: Response) => {
  try {
    const workOrders = await prisma.workOrder.findMany({
      include:  { asset: true, assignedTechnician: { select: { id: true, fullName: true, email: true } } },
      orderBy:  { createdAt: 'desc' }
    });
    res.json(workOrders);
  } catch {
    res.status(500).json({ error: 'Failed to fetch work orders' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const wo = await prisma.workOrder.findUnique({
      where:   { id: req.params.id },
      include: { asset: true, assignedTechnician: true }
    });
    if (!wo) return res.status(404).json({ error: 'Work order not found' });
    res.json(wo);
  } catch {
    res.status(500).json({ error: 'Failed to fetch work order' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, priority, workType, assetId, assignedTechnicianId } = req.body;
    const woNumber = await generateWONumber();
    const wo = await prisma.workOrder.create({
      data: {
        workOrderNumber: woNumber,
        title,
        description,
        priority:    priority    || 'MEDIUM',
        workType:    workType    || 'REACTIVE',
        status:      'OPEN',
        assetId,
        assignedTechnicianId: assignedTechnicianId || null,
        organizationId: await prisma.organization.findFirst().then(o => o!.id),
        createdById: await prisma.user.findFirst().then(u => u!.id),
      },
      include: { asset: true, assignedTechnician: true }
    });
    res.status(201).json(wo);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create work order' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { title, description, status, priority, workType, assetId, assignedTechnicianId } = req.body;
    const data: any = { title, description, status, priority, workType, assetId };
    if (assignedTechnicianId !== undefined) data.assignedTechnicianId = assignedTechnicianId || null;
    if (status === 'COMPLETED')    data.assetRestoredAt = new Date();

    const wo = await prisma.workOrder.update({ where: { id: req.params.id }, data });
    res.json(wo);
  } catch {
    res.status(500).json({ error: 'Failed to update work order' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.workOrder.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete work order' });
  }
});

export default router;
