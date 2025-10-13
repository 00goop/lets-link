import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateToken, hashPassword, verifyPassword } from '../middleware/auth.js';
import { sanitizeUser } from '../utils/serializers.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(1),
  username: z.string().min(3).max(32).optional(),
});

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message || 'Invalid payload' });
    }

    const { email, password, full_name, username } = parsed.data;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, username ? { username } : undefined ].filter(Boolean) },
    });

    if (existing) {
      return res.status(409).json({ message: 'Email or username already in use' });
    }

    const password_hash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
        full_name,
        username,
      },
    });

    const token = generateToken(user);
    res.status(201).json({ token, user: sanitizeUser(user) });
  })
);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message || 'Invalid payload' });
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    const token = generateToken(user);
    res.json({ token, user: sanitizeUser({ ...user, last_login: new Date() }) });
  })
);

export default router;
