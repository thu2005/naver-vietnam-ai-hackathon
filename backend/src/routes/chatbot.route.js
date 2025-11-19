import express from 'express';
import { sendMessage, welcome, clickButton } from '../controllers/chatbot.controller.js';

const router = express.Router();

router.post('/', sendMessage);
router.post('/open', welcome);
router.post('/click', clickButton);

export default router;