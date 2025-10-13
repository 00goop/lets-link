import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/auth.js';
import { buildOrderBy, buildWhereClause } from '../utils/query.js';

const router = Router();

const baseSchema = z.object({
  user_id: z.string().uuid(),
  type: z.enum(['friend_request', 'party_invite', 'party_update', 'photo_tagged']).optional(),
  title: z.string().min(1).optional(),
  message: z.string().min(1).optional(),
  read: z.boolean().optional(),
  related_id: z.string().uuid().optional(),
});

router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const where = buildWhereClause(req.query);
    const orderBy = buildOrderBy(req.query.sort) || { created_date: 'desc' };

    if (req.user.role !== 'admin') {
      where.user_id = req.user.id;
    }

    const notifications = await prisma.notification.findMany({ where, orderBy });
    res.json(notifications);
  })
);

router.post(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const parsed = baseSchema.extend({ title: z.string().min(1), message: z.string().min(1) }).safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message || 'Invalid payload' });
    }

    const data = parsed.data;
    const isSelf = data.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    let canCreate = isSelf || isAdmin;

    if (!canCreate && data.type === 'friend_request' && data.related_id === req.user.id) {
      canCreate = true;
    }

    if (!canCreate && ['party_invite', 'party_update', 'photo_tagged'].includes(data.type) && data.related_id) {
      const party = await prisma.party.findUnique({
        where: { id: data.related_id },
        include: { members: { select: { user_id: true } }, member_ids: true },
      });
      if (party) {
        const isMember = party.members.some((member) => member.user_id === req.user.id);
        const hasLegacyMembership = Array.isArray(party.member_ids) && party.member_ids.includes(req.user.id);
        if (party.host_id === req.user.id || isMember || hasLegacyMembership) {
          canCreate = true;
        }
      }
    }

    if (!canCreate) {
      return res.status(403).json({ message: 'You cannot create notifications for this user' });
    }

    const created = await prisma.notification.create({ data: { ...data, read: data.read ?? false } });
    res.status(201).json(created);
  })
);

router.patch(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const existing = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const isOwner = existing.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You cannot modify this notification' });
    }

    const parsed = baseSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message || 'Invalid payload' });
    }

    const data = parsed.data;
    if (data.user_id && data.user_id !== existing.user_id && req.user.role !== 'admin') {
      return res.status(400).json({ message: 'Notification owner cannot change' });
    }

    const updated = await prisma.notification.update({ where: { id: req.params.id }, data });
    res.json(updated);
  })
);

router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const existing = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const isOwner = existing.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You cannot remove this notification' });
    }

    await prisma.notification.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

export default router;
