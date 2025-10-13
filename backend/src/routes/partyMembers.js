import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/auth.js';
import { buildOrderBy, buildWhereClause } from '../utils/query.js';
import { removeMemberFromParty, syncPartyMemberStatus } from '../utils/partyMembership.js';

const router = Router();

const baseSchema = z.object({
  party_id: z.string().uuid(),
  user_id: z.string().uuid(),
  status: z.enum(['pending', 'confirmed', 'declined']).optional(),
  location_lat: z.coerce.number().optional(),
  location_lng: z.coerce.number().optional(),
  location_name: z.string().optional(),
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
        { party: { host_id: req.user.id } },
      ];
    }

    const members = await prisma.partyMember.findMany({ where, orderBy, include: { party: true } });
    res.json(members.map(({ party, ...rest }) => rest));
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
    const party = await prisma.party.findUnique({ where: { id: data.party_id } });
    if (!party) {
      return res.status(404).json({ message: 'Party not found' });
    }

    const isSelf = data.user_id === req.user.id;
    const isHost = party.host_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isSelf && !isHost && !isAdmin) {
      return res.status(403).json({ message: 'You cannot add members to this party' });
    }

    const created = await prisma.$transaction(async (tx) => {
      const record = await tx.partyMember.create({ data });
      await syncPartyMemberStatus(tx, record.party_id, record.user_id, record.status);
      return record;
    });
    res.status(201).json(created);
  })
);

router.patch(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const existing = await prisma.partyMember.findUnique({ where: { id: req.params.id }, include: { party: true } });
    if (!existing) {
      return res.status(404).json({ message: 'Party member not found' });
    }

    const isSelf = existing.user_id === req.user.id;
    const isHost = existing.party.host_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isSelf && !isHost && !isAdmin) {
      return res.status(403).json({ message: 'You cannot modify this party member' });
    }

    const parsed = baseSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message || 'Invalid payload' });
    }

    const data = parsed.data;
    if (data.party_id && data.party_id !== existing.party_id && !isAdmin) {
      return res.status(400).json({ message: 'Cannot reassign party membership' });
    }
    if (data.user_id && data.user_id !== existing.user_id && !isAdmin) {
      return res.status(400).json({ message: 'Cannot reassign member user' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const record = await tx.partyMember.update({ where: { id: req.params.id }, data });

      const partyChanged = data.party_id && data.party_id !== existing.party_id;
      const userChanged = data.user_id && data.user_id !== existing.user_id;
      const statusChanged = data.status && data.status !== existing.status;

      if (partyChanged || userChanged || statusChanged) {
        if (existing.status !== 'declined' || partyChanged || userChanged) {
          await syncPartyMemberStatus(tx, existing.party_id, existing.user_id, 'declined');
        }
        await syncPartyMemberStatus(tx, record.party_id, record.user_id, record.status);
      }

      return record;
    });

    res.json(updated);
  })
);

router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const existing = await prisma.partyMember.findUnique({ where: { id: req.params.id }, include: { party: true } });
    if (!existing) {
      return res.status(404).json({ message: 'Party member not found' });
    }

    const isSelf = existing.user_id === req.user.id;
    const isHost = existing.party.host_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isSelf && !isHost && !isAdmin) {
      return res.status(403).json({ message: 'You cannot remove this party member' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.partyMember.delete({ where: { id: req.params.id } });
      if (existing.status !== 'declined') {
        await removeMemberFromParty(tx, existing.party_id, existing.user_id);
      }
    });
    res.status(204).send();
  })
);

export default router;
