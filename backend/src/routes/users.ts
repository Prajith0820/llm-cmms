import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /api/users (all users)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, fullName: true, email: true, role: { select: { name: true } }, createdAt: true }
    });
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/technicians
router.get('/technicians', async (_req: Request, res: Response) => {
  try {
    const technicians = await prisma.user.findMany({
      where:  { role: { name: 'TECHNICIAN' } },
      select: { id: true, fullName: true, email: true, role: { select: { name: true } } }
    });
    res.json(technicians);
  } catch {
    res.status(500).json({ error: 'Failed to fetch technicians' });
  }
});

export default router;
