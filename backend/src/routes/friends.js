import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/auth.js';
import { buildOrderBy, buildWhereClause } from '../utils/query.js';

const router = Router();

const baseSchema = z.object({
  requester_id: z.string().uuid(),
  recipient_id: z.string().uuid(),
  status: z.enum(['pending', 'accepted', 'declined', 'blocked']).optional(),
});

router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const where = buildWhereClause(req.query);
    const orderBy = buildOrderBy(req.query.sort) || { created_date: 'desc' };

    if (req.user.role !== 'admin') {
      where.OR = [
        { requester_id: req.user.id },
        { recipient_id: req.user.id },
      ];
    }

    const friendships = await prisma.friend.findMany({ where, orderBy });
    res.json(friendships);
  })
);

router.post(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const parsed = baseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message || 'Invalid payload' });
    }

    const data = parsed.data;
    const isRequester = data.requester_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isRequester && !isAdmin) {
      return res.status(403).json({ message: 'You can only send friend requests on your behalf' });
    }

    if (data.requester_id === data.recipient_id) {
      return res.status(400).json({ message: 'Cannot send a friend request to yourself' });
    }

    const existing = await prisma.friend.findFirst({
      where: {
        OR: [
          { requester_id: data.requester_id, recipient_id: data.recipient_id },
          { requester_id: data.recipient_id, recipient_id: data.requester_id },
        ],
      },
    });

    if (existing) {
      return res.status(409).json({ message: 'Friendship already exists' });
    }

    const created = await prisma.friend.create({ data: { ...data, status: data.status || 'pending' } });
    res.status(201).json(created);
  })
);

router.patch(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const existing = await prisma.friend.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ message: 'Friendship not found' });
    }

    const isParticipant = existing.requester_id === req.user.id || existing.recipient_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isParticipant && !isAdmin) {
      return res.status(403).json({ message: 'You cannot modify this friendship' });
    }

    const parsed = baseSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message || 'Invalid payload' });
    }

    const data = parsed.data;
    if (data.requester_id || data.recipient_id) {
      return res.status(400).json({ message: 'Friend participants cannot be reassigned' });
    }

    const updated = await prisma.friend.update({ where: { id: req.params.id }, data });
    res.json(updated);
  })
);

router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const existing = await prisma.friend.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ message: 'Friendship not found' });
    }

    const isParticipant = existing.requester_id === req.user.id || existing.recipient_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isParticipant && !isAdmin) {
      return res.status(403).json({ message: 'You cannot remove this friendship' });
    }

    await prisma.friend.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

export default router;
