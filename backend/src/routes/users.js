import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { sanitizeUser, sanitizeUsers } from '../utils/serializers.js';
import { buildOrderBy, buildWhereClause } from '../utils/query.js';

const router = Router();

const updateProfileSchema = z.object({
  username: z.union([z.string().min(3).max(32), z.literal('')]).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(255).optional(),
  interests: z.string().max(255).optional(),
  phone: z.string().max(50).optional(),
  profile_picture_url: z.string().url().optional(),
});

const sanitizeProfilePayload = (payload) => {
  const result = {};
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) return;
    if (value === '') {
      result[key] = null;
    } else {
      result[key] = value;
    }
  });
  return result;
};

router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const where = buildWhereClause(req.query);
    const orderBy = buildOrderBy(req.query.sort) || { created_date: 'desc' };
    const users = await prisma.user.findMany({ where, orderBy });
    res.json(sanitizeUsers(users));
  })
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    res.json(sanitizeUser(user));
  })
);

router.patch(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message || 'Invalid payload' });
    }

    const { username, ...rest } = parsed.data;

    if (username) {
      const existing = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: req.user.id },
        },
      });
      if (existing) {
        return res.status(409).json({ message: 'Username already in use' });
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: sanitizeProfilePayload({ ...rest, username }),
    });
    res.json(sanitizeUser(user));
  })
);

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      // allow fetching other users for discovery but only limited info
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: {
          id: true,
          full_name: true,
          username: true,
          email: true,
          bio: true,
          location: true,
          interests: true,
          profile_picture_url: true,
          created_date: true,
        },
      });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json(user);
    }

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(sanitizeUser(user));
  })
);

router.patch(
  '/:id',
  authenticate,
  asyncHandler(async (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'You do not have permission to update this user' });
    }
    const parsed = updateProfileSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message || 'Invalid payload' });
    }

    const data = sanitizeProfilePayload(parsed.data);
    if (data.username) {
      const existing = await prisma.user.findFirst({
        where: {
          username: data.username,
          NOT: { id: req.params.id },
        },
      });
      if (existing) {
        return res.status(409).json({ message: 'Username already in use' });
      }
    }

    const user = await prisma.user.update({ where: { id: req.params.id }, data });
    res.json(sanitizeUser(user));
  })
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

export default router;
