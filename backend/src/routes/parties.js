import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/auth.js';
import { buildOrderBy, buildWhereClause } from '../utils/query.js';
import { serializeParty, serializeParties } from '../utils/serializers.js';

const router = Router();

const baseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['recreational', 'dining', 'family_vacation', 'entertainment', 'shopping', 'educational']),
  host_id: z.string().uuid().optional(),
  join_code: z.string().min(3).max(12).optional(),
  max_size: z.coerce.number().int().positive().optional(),
  status: z.enum(['planning', 'confirmed', 'completed', 'cancelled']).optional(),
  scheduled_date: z.string().optional(),
  location_name: z.string().optional(),
  location_address: z.string().optional(),
  member_ids: z.array(z.string().uuid()).optional(),
});

const createSchema = baseSchema.extend({
  title: z.string().min(1),
  type: z.enum(['recreational', 'dining', 'family_vacation', 'entertainment', 'shopping', 'educational']),
});

const normalizeMemberIds = (memberIds = [], hostId) => {
  const unique = new Set(memberIds);
  if (hostId) {
    unique.add(hostId);
  }
  return Array.from(unique);
};

router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const where = buildWhereClause(req.query);
    const orderBy = buildOrderBy(req.query.sort) || { created_date: 'desc' };

    if (req.user.role !== 'admin') {
      where.OR = [
        { host_id: req.user.id },
        { members: { some: { user_id: req.user.id } } },
        { member_ids: { has: req.user.id } },
        { status: 'planning' },
      ];
    }

    const parties = await prisma.party.findMany({
      where,
      orderBy,
      include: { members: { select: { user_id: true } } },
    });
    res.json(serializeParties(parties));
  })
);

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const party = await prisma.party.findUnique({
      where: { id: req.params.id },
      include: { members: { select: { user_id: true } } },
    });
    if (!party) {
      return res.status(404).json({ message: 'Party not found' });
    }

    const isMember = party.members.some((member) => member.user_id === req.user.id);
    const hasLegacyMembership = party.member_ids.includes(req.user.id);
    const canAccess =
      req.user.role === 'admin' ||
      party.host_id === req.user.id ||
      isMember ||
      hasLegacyMembership ||
      party.status === 'planning';

    if (!canAccess) {
      return res.status(403).json({ message: 'You do not have access to this party' });
    }

    res.json(serializeParty(party));
  })
);

router.post(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message || 'Invalid payload' });
    }

    const { scheduled_date, ...rest } = parsed.data;
    const joinCode = (rest.join_code || Math.random().toString(36).substring(2, 8)).toUpperCase();

    const hostId = rest.host_id || req.user.id;
    const party = await prisma.party.create({
      data: {
        ...rest,
        scheduled_date: scheduled_date ? new Date(scheduled_date) : null,
        host_id: hostId,
        member_ids: normalizeMemberIds(rest.member_ids ?? [], hostId),
        join_code: joinCode,
      },
      include: { members: { select: { user_id: true } } },
    });

    res.status(201).json(serializeParty(party));
  })
);

router.patch(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const party = await prisma.party.findUnique({ where: { id: req.params.id } });
    if (!party) {
      return res.status(404).json({ message: 'Party not found' });
    }

    const isHost = party.host_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isHost && !isAdmin) {
      return res.status(403).json({ message: 'Only the host can update this party' });
    }

    const parsed = baseSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message || 'Invalid payload' });
    }

    const { scheduled_date, member_ids, ...rest } = parsed.data;
    if (rest.join_code) {
      rest.join_code = rest.join_code.toUpperCase();
    }

    const updateData = {
      where: { id: req.params.id },
      data: {
        ...rest,
        ...(scheduled_date !== undefined
          ? { scheduled_date: scheduled_date ? new Date(scheduled_date) : null }
          : {}),
        ...(member_ids !== undefined ? { member_ids: normalizeMemberIds(member_ids, party.host_id) } : {}),
      },
      include: { members: { select: { user_id: true } } },
    };

    const updated = await prisma.party.update(updateData);

    res.json(serializeParty(updated));
  })
);

router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const party = await prisma.party.findUnique({ where: { id: req.params.id } });
    if (!party) {
      return res.status(404).json({ message: 'Party not found' });
    }

    const isHost = party.host_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isHost && !isAdmin) {
      return res.status(403).json({ message: 'Only the host can delete this party' });
    }

    await prisma.party.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

export default router;
