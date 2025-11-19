import ClovaChatbot from "../services/clovaChatbot.service.js";

const chatbot = new ClovaChatbot(
  process.env.CLOVA_CHATBOT_INVOKE_URL,
  process.env.CLOVA_CHATBOT_SECRET_KEY
);

export const sendMessage = async (req, res) => {
  const { message, userId } = req.body;
  if (!userId || !message) {
    return res.status(400).json({ error: 'userId and message are required' });
  }

  try {
    const response = await chatbot.sendText(message, userId);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const clickButton = async (req, res) => {
  const { postback, userId, postbackFull } = req.body;

  if (!userId || !postback) {
    return res.status(400).json({ error: 'userId and postback are required' });
  }

  try {
    const response = await chatbot.sendPostback(postback, userId, postbackFull);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const welcome = async (req, res) => {
  const { userId = 'guest' } = req.body;

  try {
    const response = await chatbot.sendWelcome(userId);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};