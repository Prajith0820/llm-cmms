import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /api/inventory
router.get('/', async (_req: Request, res: Response) => {
  try {
    const items = await prisma.inventory.findMany({ orderBy: { name: 'asc' } });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// GET /api/inventory/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await prisma.inventory.findUnique({
      where:   { id: req.params.id },
      include: { transactions: { orderBy: { date: 'desc' }, take: 10 } }
    });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// POST /api/inventory
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, quantity, unit, minQuantity } = req.body;
    const item = await prisma.inventory.create({
      data: { name, description, quantity: quantity || 0, unit: unit || 'pcs', minQuantity: minQuantity || 5 }
    });
    res.status(201).json(item);
  } catch {
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// PUT /api/inventory/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, quantity, unit, minQuantity } = req.body;
    const item = await prisma.inventory.update({
      where: { id: req.params.id },
      data:  { name, description, quantity, unit, minQuantity }
    });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE /api/inventory/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.inventory.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// POST /api/inventory/issue
router.post('/issue', async (req: Request, res: Response) => {
  try {
    const { inventoryId, quantity, notes } = req.body;

    const item = await prisma.inventory.findUnique({ where: { id: inventoryId } });
    if (!item)                  return res.status(404).json({ error: 'Item not found' });
    if (item.quantity < quantity) return res.status(400).json({ error: `Insufficient stock. Available: ${item.quantity} ${item.unit}` });

    const [updated, tx] = await prisma.$transaction([
      prisma.inventory.update({ where: { id: inventoryId }, data: { quantity: item.quantity - quantity } }),
      prisma.inventoryTransaction.create({ data: { inventoryId, quantity, type: 'OUT', notes } })
    ]);

    res.json({ item: updated, transaction: tx });
  } catch {
    res.status(500).json({ error: 'Failed to issue inventory' });
  }
});

// POST /api/inventory/receive
router.post('/receive', async (req: Request, res: Response) => {
  try {
    const { inventoryId, quantity, notes } = req.body;

    const item = await prisma.inventory.findUnique({ where: { id: inventoryId } });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const [updated, tx] = await prisma.$transaction([
      prisma.inventory.update({ where: { id: inventoryId }, data: { quantity: item.quantity + quantity } }),
      prisma.inventoryTransaction.create({ data: { inventoryId, quantity, type: 'IN', notes } })
    ]);

    res.json({ item: updated, transaction: tx });
  } catch {
    res.status(500).json({ error: 'Failed to receive inventory' });
  }
});

export default router;
