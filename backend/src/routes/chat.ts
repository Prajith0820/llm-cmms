import { Router, Request, Response } from 'express';
import { handleChat } from '../ai/chat';

const router = Router();

// POST /api/chat
router.post('/', async (req: Request, res: Response) => {
  try {
    const { messages, context } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const reply = await handleChat(messages, context);
    res.json({ reply });
  } catch (error: any) {
    console.error('Chat route error:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

export default router;
