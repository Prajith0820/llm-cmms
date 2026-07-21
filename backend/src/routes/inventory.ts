import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const items = await prisma.sparePart.findMany({
      orderBy: { partName: 'asc' },
      include: { category: true, warehouse: true }
    });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Failed to fetch spare parts' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await prisma.sparePart.findUnique({
      where:   { id: req.params.id },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 10 } }
    });
    if (!item) return res.status(404).json({ error: 'Spare part not found' });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Failed to fetch spare part' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { partName, description, unit, minimumStock, maximumStock, unitCost, categoryId, warehouseId } = req.body;
    const item = await prisma.sparePart.create({
      data: {
        partName,
        description,
        unit: unit || 'PCS',
        minimumStock: minimumStock || 0,
        maximumStock: maximumStock || 0,
        unitCost: unitCost || 0,
        currentStock: 0,
        reservedStock: 0,
        categoryId,
        warehouseId,
        partCode: `SP-${Date.now()}`,
        organizationId: await prisma.organization.findFirst().then(o => o!.id),
        createdById: await prisma.user.findFirst().then(u => u!.id),
      }
    });
    res.status(201).json(item);
  } catch {
    res.status(500).json({ error: 'Failed to create spare part' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { partName, description, unit, minimumStock, maximumStock, unitCost, categoryId, warehouseId } = req.body;
    const item = await prisma.sparePart.update({
      where: { id: req.params.id },
      data:  { partName, description, unit, minimumStock, maximumStock, unitCost, categoryId, warehouseId }
    });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Failed to update spare part' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.sparePart.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete spare part' });
  }
});

router.post('/issue', async (req: Request, res: Response) => {
  try {
    const { sparePartId, quantity, notes } = req.body;

    const item = await prisma.sparePart.findUnique({ where: { id: sparePartId } });
    if (!item)                  return res.status(404).json({ error: 'Spare part not found' });
    if (item.currentStock < quantity) return res.status(400).json({ error: `Insufficient stock. Available: ${item.currentStock} ${item.unit}` });

    const [updated, tx] = await prisma.$transaction([
      prisma.sparePart.update({ where: { id: sparePartId }, data: { currentStock: item.currentStock - quantity } }),
      prisma.stockTransaction.create({
        data: {
          sparePartId,
          quantity,
          transactionType: 'ISSUE',
          notes,
          performedById: await prisma.user.findFirst().then(u => u!.id),
          organizationId: item.organizationId,
          warehouseId: item.warehouseId || undefined,
        }
      })
    ]);

    res.json({ item: updated, transaction: tx });
  } catch {
    res.status(500).json({ error: 'Failed to issue spare part' });
  }
});

router.post('/receive', async (req: Request, res: Response) => {
  try {
    const { sparePartId, quantity, notes } = req.body;

    const item = await prisma.sparePart.findUnique({ where: { id: sparePartId } });
    if (!item) return res.status(404).json({ error: 'Spare part not found' });

    const [updated, tx] = await prisma.$transaction([
      prisma.sparePart.update({ where: { id: sparePartId }, data: { currentStock: item.currentStock + quantity } }),
      prisma.stockTransaction.create({
        data: {
          sparePartId,
          quantity,
          transactionType: 'RECEIVE',
          notes,
          performedById: await prisma.user.findFirst().then(u => u!.id),
          organizationId: item.organizationId,
          warehouseId: item.warehouseId || undefined,
        }
      })
    ]);

    res.json({ item: updated, transaction: tx });
  } catch {
    res.status(500).json({ error: 'Failed to receive spare part' });
  }
});

export default router;
