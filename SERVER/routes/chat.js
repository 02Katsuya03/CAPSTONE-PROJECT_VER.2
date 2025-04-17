import express from 'express';
import ChatSession from '../models/Chatsession.js';
import User from '../models/User.js';

const router = express.Router();

const randomGreetings = [
  "Hope you're having a great day!",
  "It's a pleasure to have you here!",
  "How can I assist you today?",
  "Let's make today awesome together!"
];

const generateGreeting = (fullName) => {
  const hour = new Date().getHours();
  let greeting = "Good evening";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";

  const randomGreeting = randomGreetings[Math.floor(Math.random() * randomGreetings.length)];
  return `${greeting}, ${fullName}! 👋 ${randomGreeting}`;
};

router.get('/menu', (req, res) => {
  res.json({
    choices: [
      { id: 1, label: "Help Desk" }
    ]
  });
});

router.get('/help-desk', (req, res) => {
  const questions = [
    { code: "A", question: "How to reset my password?" },
    { code: "B", question: "How do I update profile details?" },
    { code: "C", question: "How to reach technical support?" }
  ];
  res.json({ questions });
});

router.get('/question/:code', (req, res) => {
  const answers = {
    a: "You can reset your password via the Settings > Change Password page.",
    b: "To update your profile: click your profile icon then select Edit.",
    c: "Contact support at: support@educare.com or call 123-456-7890."
  };

  const answer = answers[req.params.code.toLowerCase()];
  if (answer) {
    res.json({ answer });
  } else {
    res.status(404).json({ error: "Invalid question code." });
  }
});

router.post('/session', async (req, res) => {
  const { username, sender } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const fullName = `${user.firstName} ${user.lastName}`;
    const greetingMessage = generateGreeting(fullName);

    const newSession = new ChatSession({
      username,
      fullName,
      messages: [{ message: greetingMessage, sender: 'chatbot' }],
      sender
    });

    await newSession.save();
    res.json({
      status: "saved",
      sessionId: newSession._id,
      greeting: greetingMessage
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const { message, sender } = req.body;

  try {
    const session = await ChatSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });

    session.messages.push({ message, sender });

    // Check if user input matches a help code (A, B, or C) and auto-answer
    const answers = {
      a: "You can reset your password via the Settings > Change Password page.",
      b: "To update your profile: click your profile icon then select Edit.",
      c: "Contact support at: support@educare.com or call 123-456-7890."
    };

    const lowerMessage = message.trim().toLowerCase();
    if (answers[lowerMessage]) {
      const botReply = { message: answers[lowerMessage], sender: 'chatbot' };
      session.messages.push(botReply);
    }

    await session.save();

    res.json({
      status: 'updated',
      messages: session.messages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
