import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/auth.js';
import { buildOrderBy, buildWhereClause } from '../utils/query.js';

const router = Router();

const baseSchema = z.object({
  party_id: z.string().uuid(),
  uploader_id: z.string().uuid(),
  file_url: z.string().url(),
  caption: z.string().optional(),
  likes: z.array(z.string()).optional(),
});

router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const where = buildWhereClause(req.query);
    const orderBy = buildOrderBy(req.query.sort) || { created_date: 'desc' };

    if (req.user.role !== 'admin') {
      where.OR = [
        { uploader_id: req.user.id },
        { party: { host_id: req.user.id } },
        { party: { members: { some: { user_id: req.user.id } } } },
        { party: { member_ids: { has: req.user.id } } },
      ];
    }

    const photos = await prisma.photo.findMany({
      where,
      orderBy,
      include: { party: { select: { host_id: true, members: { select: { user_id: true } }, member_ids: true } } },
    });
    res.json(
      photos.map(({ party, ...rest }) => ({
        ...rest,
        party_id: rest.party_id,
      }))
    );
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

    const isUploader = data.uploader_id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isMember = party.members.some((member) => member.user_id === req.user.id);
    const hasLegacyMembership = Array.isArray(party.member_ids) && party.member_ids.includes(req.user.id);
    const canUploadToParty = party.host_id === req.user.id || isMember || hasLegacyMembership;

    if (!isAdmin && (!isUploader || !canUploadToParty)) {
      return res.status(403).json({ message: 'You cannot upload photos for this party' });
    }

    const created = await prisma.photo.create({ data: { ...data, likes: data.likes ?? [] } });
    res.status(201).json(created);
  })
);

router.patch(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const existing = await prisma.photo.findUnique({
      where: { id: req.params.id },
      include: {
        party: { select: { host_id: true, members: { select: { user_id: true } }, member_ids: true } },
      },
    });
    if (!existing) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    const isUploader = existing.uploader_id === req.user.id;
    const isHost = existing.party.host_id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isMember = existing.party.members.some((member) => member.user_id === req.user.id);
    const hasLegacyMembership = Array.isArray(existing.party.member_ids) &&
      existing.party.member_ids.includes(req.user.id);

    if (!isUploader && !isHost && !isAdmin && !isMember && !hasLegacyMembership) {
      return res.status(403).json({ message: 'You cannot modify this photo' });
    }

    const parsed = baseSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message || 'Invalid payload' });
    }

    const data = parsed.data;
    if (data.uploader_id && data.uploader_id !== existing.uploader_id && !isAdmin) {
      return res.status(400).json({ message: 'Uploader cannot change' });
    }
    if (data.party_id && data.party_id !== existing.party_id && !isAdmin) {
      return res.status(400).json({ message: 'Party cannot change for an existing photo' });
    }

    const updated = await prisma.photo.update({ where: { id: req.params.id }, data });
    res.json(updated);
  })
);

router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const existing = await prisma.photo.findUnique({
      where: { id: req.params.id },
      include: {
        party: { select: { host_id: true, members: { select: { user_id: true } }, member_ids: true } },
      },
    });
    if (!existing) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    const isUploader = existing.uploader_id === req.user.id;
    const isHost = existing.party.host_id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isMember = existing.party.members.some((member) => member.user_id === req.user.id);
    const hasLegacyMembership = Array.isArray(existing.party.member_ids) &&
      existing.party.member_ids.includes(req.user.id);

    if (!isUploader && !isHost && !isAdmin && !isMember && !hasLegacyMembership) {
      return res.status(403).json({ message: 'You cannot remove this photo' });
    }

    await prisma.photo.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

export default router;
