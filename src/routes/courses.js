const router = require('express').Router();
const auth   = require('../middleware/auth');
const { db } = require('../config/firebase');
const { v4: uuid } = require('uuid');

// GET /api/courses
router.get('/', auth, async (req, res) => {
  try {
    const snap = await db().collection('courses').where('schoolId','==',req.schoolId).get();
    res.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

// POST /api/courses
router.post('/', auth, async (req, res) => {
  try {
    const id = uuid();
    const course = { id, ...req.body, schoolId: req.schoolId, createdBy: req.userId, createdAt: new Date().toISOString() };
    await db().collection('courses').doc(id).set(course);
    res.json({ success: true, data: course });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

// PATCH /api/courses/:id
router.patch('/:id', auth, async (req, res) => {
  try { await db().collection('courses').doc(req.params.id).update(req.body); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

// DELETE /api/courses/:id
router.delete('/:id', auth, async (req, res) => {
  try { await db().collection('courses').doc(req.params.id).delete(); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

// POST /api/courses/:id/lessons — add lesson
router.post('/:id/lessons', auth, async (req, res) => {
  try {
    const lessonId = uuid();
    const lesson = { id: lessonId, courseId: req.params.id, ...req.body, schoolId: req.schoolId, createdAt: new Date().toISOString() };
    await db().collection('lessons').doc(lessonId).set(lesson);
    res.json({ success: true, data: lesson });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

// DELETE /api/courses/:id/lessons/:lessonId
router.delete('/:id/lessons/:lessonId', auth, async (req, res) => {
  try { await db().collection('lessons').doc(req.params.lessonId).delete(); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

module.exports = router;
