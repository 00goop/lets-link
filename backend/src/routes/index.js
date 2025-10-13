import { Router } from 'express';
import authRouter from './auth.js';
import usersRouter from './users.js';
import partiesRouter from './parties.js';
import partyMembersRouter from './partyMembers.js';
import friendsRouter from './friends.js';
import notificationsRouter from './notifications.js';
import photosRouter from './photos.js';
import pollsRouter from './polls.js';
import votesRouter from './votes.js';
import { optionalAuthenticate } from '../middleware/auth.js';

const router = Router();

router.use('/auth', authRouter);
router.use(optionalAuthenticate);
router.use('/users', usersRouter);
router.use('/parties', partiesRouter);
router.use('/party-members', partyMembersRouter);
router.use('/friends', friendsRouter);
router.use('/notifications', notificationsRouter);
router.use('/photos', photosRouter);
router.use('/polls', pollsRouter);
router.use('/votes', votesRouter);

export default router;
