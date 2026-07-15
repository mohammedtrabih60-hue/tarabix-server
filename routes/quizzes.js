const router = require('express').Router();
const auth   = require('../middleware/auth');
const { db } = require('../config/firebase');
const { v4: uuid } = require('uuid');

// GET /api/quizzes
router.get('/', auth, async (req, res) => {
  try {
    const snap = await db().collection('quizzes').where('schoolId','==',req.schoolId).get();
    res.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

// POST /api/quizzes
router.post('/', auth, async (req, res) => {
  try {
    const id = uuid();
    const quiz = { id, ...req.body, schoolId: req.schoolId, createdBy: req.userId, createdAt: new Date().toISOString() };
    await db().collection('quizzes').doc(id).set(quiz);
    res.json({ success: true, data: quiz });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

// PATCH /api/quizzes/:id
router.patch('/:id', auth, async (req, res) => {
  try { await db().collection('quizzes').doc(req.params.id).update(req.body); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

// DELETE /api/quizzes/:id
router.delete('/:id', auth, async (req, res) => {
  try { await db().collection('quizzes').doc(req.params.id).delete(); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

// POST /api/quizzes/:id/submit — submit quiz attempt
router.post('/:id/submit', auth, async (req, res) => {
  try {
    const { answers, score, studentId, studentName } = req.body;
    const id = uuid();
    const attempt = { id, quizId: req.params.id, studentId, studentName, answers, score, schoolId: req.schoolId, submittedAt: new Date().toISOString() };
    await db().collection('quiz_attempts').doc(id).set(attempt);
    res.json({ success: true, data: attempt });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

module.exports = router;
