import express from 'express';
import { sendMessageToChatbot } from '../controllers/chatbot.controller.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: 'Chatbot API is running',
    usage: 'POST to this endpoint with { message, userId } in the body'
  });
});

router.post('/', sendMessageToChatbot);

export default router;