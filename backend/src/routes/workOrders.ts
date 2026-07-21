import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

async function generateWONumber(): Promise<string> {
  const year  = new Date().getFullYear();
  const count = await prisma.workOrder.count();
  return `WO-${year}-${String(count + 1).padStart(3, '0')}`;
}

// GET /api/work-orders
router.get('/', async (_req: Request, res: Response) => {
  try {
    const workOrders = await prisma.workOrder.findMany({
      include:  { asset: true, assignedTo: { select: { id: true, name: true, email: true } } },
      orderBy:  { createdAt: 'desc' }
    });
    res.json(workOrders);
  } catch {
    res.status(500).json({ error: 'Failed to fetch work orders' });
  }
});

// GET /api/work-orders/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const wo = await prisma.workOrder.findUnique({
      where:   { id: req.params.id },
      include: { asset: true, assignedTo: true }
    });
    if (!wo) return res.status(404).json({ error: 'Work order not found' });
    res.json(wo);
  } catch {
    res.status(500).json({ error: 'Failed to fetch work order' });
  }
});

// POST /api/work-orders
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, priority, type, assetId, assignedToId } = req.body;
    const woNumber = await generateWONumber();
    const wo = await prisma.workOrder.create({
      data: {
        woNumber,
        title,
        description,
        priority:    priority    || 'MEDIUM',
        type:        type        || 'CORRECTIVE',
        status:      'OPEN',
        assetId,
        assignedToId: assignedToId || null
      },
      include: { asset: true, assignedTo: true }
    });
    res.status(201).json(wo);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create work order' });
  }
});

// PUT /api/work-orders/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { title, description, status, priority, type, assetId, assignedToId } = req.body;
    const data: any = { title, description, status, priority, type, assetId };
    if (assignedToId !== undefined) data.assignedToId = assignedToId || null;
    if (status === 'COMPLETED')    data.closedAt = new Date();

    const wo = await prisma.workOrder.update({ where: { id: req.params.id }, data });
    res.json(wo);
  } catch {
    res.status(500).json({ error: 'Failed to update work order' });
  }
});

// DELETE /api/work-orders/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.workOrder.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete work order' });
  }
});

export default router;
