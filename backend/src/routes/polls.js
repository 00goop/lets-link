import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/auth.js';
import { buildOrderBy, buildWhereClause } from '../utils/query.js';

const router = Router();

const baseSchema = z.object({
  party_id: z.string().uuid(),
  created_by: z.string().uuid(),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(1),
  status: z.enum(['open', 'closed']).optional(),
});

router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const where = buildWhereClause(req.query);
    const orderBy = buildOrderBy(req.query.sort) || { created_date: 'desc' };

    if (req.user.role !== 'admin') {
      where.OR = [
        { created_by: req.user.id },
        { party: { host_id: req.user.id } },
        { party: { members: { some: { user_id: req.user.id } } } },
        { party: { member_ids: { has: req.user.id } } },
      ];
    }

    const polls = await prisma.poll.findMany({
      where,
      orderBy,
      include: {
        party: { select: { host_id: true, members: { select: { user_id: true } }, member_ids: true } },
      },
    });
    res.json(polls.map(({ party, ...rest }) => rest));
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
    const party = await prisma.party.findUnique({
      where: { id: data.party_id },
      include: { members: { select: { user_id: true } }, member_ids: true },
    });
    if (!party) {
      return res.status(404).json({ message: 'Party not found' });
    }

    const isCreator = data.created_by === req.user.id;
    const isMember = party.members.some((member) => member.user_id === req.user.id);
    const hasLegacyMembership = Array.isArray(party.member_ids) && party.member_ids.includes(req.user.id);
    const isParticipant = party.host_id === req.user.id || isMember || hasLegacyMembership;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && (!isCreator || !isParticipant)) {
      return res.status(403).json({ message: 'You cannot create polls for this party' });
    }

    const created = await prisma.poll.create({ data: { ...data, status: data.status || 'open' } });
    res.status(201).json(created);
  })
);

router.patch(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const existing = await prisma.poll.findUnique({
      where: { id: req.params.id },
      include: { party: { select: { host_id: true, members: { select: { user_id: true } }, member_ids: true } } },
    });
    if (!existing) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    const isCreator = existing.created_by === req.user.id;
    const isHost = existing.party.host_id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isMember = existing.party.members.some((member) => member.user_id === req.user.id);
    const hasLegacyMembership = Array.isArray(existing.party.member_ids) &&
      existing.party.member_ids.includes(req.user.id);

    if (!isCreator && !isHost && !isAdmin && !isMember && !hasLegacyMembership) {
      return res.status(403).json({ message: 'You cannot modify this poll' });
    }

    const parsed = baseSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message || 'Invalid payload' });
    }

    const data = parsed.data;
    if (data.created_by && data.created_by !== existing.created_by && !isAdmin) {
      return res.status(400).json({ message: 'Poll creator cannot change' });
    }

    const updated = await prisma.poll.update({ where: { id: req.params.id }, data });
    res.json(updated);
  })
);

router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const existing = await prisma.poll.findUnique({
      where: { id: req.params.id },
      include: { party: { select: { host_id: true, members: { select: { user_id: true } }, member_ids: true } } },
    });
    if (!existing) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    const isCreator = existing.created_by === req.user.id;
    const isHost = existing.party.host_id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isMember = existing.party.members.some((member) => member.user_id === req.user.id);
    const hasLegacyMembership = Array.isArray(existing.party.member_ids) &&
      existing.party.member_ids.includes(req.user.id);

    if (!isCreator && !isHost && !isAdmin && !isMember && !hasLegacyMembership) {
      return res.status(403).json({ message: 'You cannot remove this poll' });
    }

    await prisma.poll.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

export default router;
