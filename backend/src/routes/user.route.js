import express from 'express';
import { createUser, getUser, deleteUser } from '../controllers/user.controller.js';

const router = express.Router();

router.post('/', createUser);

router.get('/:userId', getUser);

router.delete('/:userId', deleteUser);

export default router;