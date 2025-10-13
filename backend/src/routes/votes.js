import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/auth.js';
import { buildOrderBy, buildWhereClause } from '../utils/query.js';

const router = Router();

const baseSchema = z.object({
  poll_id: z.string().uuid(),
  user_id: z.string().uuid(),
  selected_option: z.string().min(1),
});

router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const where = buildWhereClause(req.query);
    const orderBy = buildOrderBy(req.query.sort) || { created_date: 'desc' };

    if (req.user.role !== 'admin') {
      where.OR = [
        { user_id: req.user.id },
        { poll: { created_by: req.user.id } },
        { poll: { party: { host_id: req.user.id } } },
        { poll: { party: { members: { some: { user_id: req.user.id } } } } },
        { poll: { party: { member_ids: { has: req.user.id } } } },
      ];
    }

    const votes = await prisma.vote.findMany({
      where,
      orderBy,
      include: {
        poll: {
          include: {
            party: { select: { host_id: true, members: { select: { user_id: true } }, member_ids: true } },
          },
        },
      },
    });
    res.json(votes.map(({ poll, ...rest }) => rest));
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
    const poll = await prisma.poll.findUnique({
      where: { id: data.poll_id },
      include: { party: { select: { host_id: true, members: { select: { user_id: true } }, member_ids: true } } },
    });
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    const isSelf = data.user_id === req.user.id;
    const isMember = poll.party.members.some((member) => member.user_id === req.user.id);
    const hasLegacyMembership = Array.isArray(poll.party.member_ids) && poll.party.member_ids.includes(req.user.id);
    const isAdmin = req.user.role === 'admin';
    const isParticipant = poll.party.host_id === req.user.id || isMember || hasLegacyMembership;

    if (!isAdmin && (!isSelf || !isParticipant)) {
      return res.status(403).json({ message: 'You cannot vote in this poll' });
    }

    if (!poll.options.includes(data.selected_option)) {
      return res.status(400).json({ message: 'Selected option is not part of this poll' });
    }

    try {
      const created = await prisma.vote.create({ data });
      res.status(201).json(created);
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ message: 'Vote already exists for this poll' });
      }
      throw error;
    }
  })
);

router.patch(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const existing = await prisma.vote.findUnique({
      where: { id: req.params.id },
      include: {
        poll: {
          include: {
            party: { select: { host_id: true, members: { select: { user_id: true } }, member_ids: true } },
          },
        },
      },
    });
    if (!existing) {
      return res.status(404).json({ message: 'Vote not found' });
    }

    const isOwner = existing.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isMember = existing.poll.party.members.some((member) => member.user_id === req.user.id);
    const hasLegacyMembership = Array.isArray(existing.poll.party.member_ids) &&
      existing.poll.party.member_ids.includes(req.user.id);

    if (!isOwner && !isAdmin && !isMember && !hasLegacyMembership) {
      return res.status(403).json({ message: 'You cannot modify this vote' });
    }

    const parsed = baseSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message || 'Invalid payload' });
    }

    const data = parsed.data;
    if (data.user_id && data.user_id !== existing.user_id && !isAdmin) {
      return res.status(400).json({ message: 'Vote owner cannot change' });
    }

    if (data.selected_option && !(existing.poll.options.includes(data.selected_option))) {
      return res.status(400).json({ message: 'Selected option is not part of this poll' });
    }

    const updated = await prisma.vote.update({ where: { id: req.params.id }, data });
    res.json(updated);
  })
);

router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const existing = await prisma.vote.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ message: 'Vote not found' });
    }

    const isOwner = existing.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You cannot remove this vote' });
    }

    await prisma.vote.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

export default router;
