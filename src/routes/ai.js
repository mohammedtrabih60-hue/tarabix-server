// src/routes/ai.js
const router = require('express').Router();
const auth   = require('../middleware/auth');
const { v4: uuid } = require('uuid');
const { db } = require('../config/firebase');

let openai;
function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    const OpenAI = require('openai');
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

async function callAI(systemPrompt, userMessage, history = []) {
  const ai = getOpenAI();
  if (!ai) return 'AI not configured. Please set OPENAI_API_KEY.';

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10).map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: userMessage },
  ];

  const r = await ai.chat.completions.create({ model: 'gpt-4o-mini', messages, max_tokens: 1000 });
  return r.choices[0].message.content;
}

// POST /api/ai/chat
router.post('/chat', auth, async (req, res) => {
  try {
    const { message, subject, history, sessionId } = req.body;
    if (!message) return res.status(400).json({ success: false, code: 'no_message' });

    const system = subject
      ? `You are a helpful teacher for ${subject}. Answer in the same language the student uses (Arabic or Hebrew). Be concise and educational.`
      : 'You are a helpful educational assistant. Answer in Arabic or Hebrew based on the student\'s language.';

    const reply = await callAI(system, message, history || []);

    // Save to history
    const sid = sessionId || uuid();
    const batch = db().batch();
    const ref1  = db().collection('ai_chat').doc(uuid());
    const ref2  = db().collection('ai_chat').doc(uuid());
    batch.set(ref1, { sessionId: sid, userId: req.userId, schoolId: req.schoolId, role: 'user',      content: message, subject: subject||null, createdAt: new Date().toISOString() });
    batch.set(ref2, { sessionId: sid, userId: req.userId, schoolId: req.schoolId, role: 'assistant', content: reply,   subject: subject||null, createdAt: new Date().toISOString() });
    batch.commit().catch(() => {});

    res.json({ success: true, reply, sessionId: sid });
  } catch (e) { res.status(500).json({ success: false, code: 'ai_error', message: e.message }); }
});

// POST /api/ai/solve
router.post('/solve', auth, async (req, res) => {
  try {
    const { problem } = req.body;
    const reply = await callAI('You are a math teacher. Solve step by step. Use the same language as the student.', problem);
    res.json({ success: true, reply });
  } catch (e) { res.status(500).json({ success: false, code: 'ai_error' }); }
});

// POST /api/ai/explain
router.post('/explain', auth, async (req, res) => {
  try {
    const { concept, language } = req.body;
    const lang = language === 'he' ? 'Hebrew' : 'Arabic';
    const reply = await callAI(`Explain clearly in ${lang}.`, concept);
    res.json({ success: true, reply });
  } catch (e) { res.status(500).json({ success: false, code: 'ai_error' }); }
});

module.exports = router;
