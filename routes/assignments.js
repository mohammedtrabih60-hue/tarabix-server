const router = require('express').Router();
const auth   = require('../middleware/auth');
const { db } = require('../config/firebase');
const { v4: uuid } = require('uuid');

router.get('/', auth, async (req, res) => {
  try {
    const snap = await db().collection('assignments').where('schoolId','==',req.schoolId).get();
    res.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const id = uuid();
    const a = { id, ...req.body, schoolId: req.schoolId, createdBy: req.userId, createdAt: new Date().toISOString() };
    await db().collection('assignments').doc(id).set(a);
    res.json({ success: true, data: a });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

router.patch('/:id', auth, async (req, res) => {
  try { await db().collection('assignments').doc(req.params.id).update(req.body); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

router.delete('/:id', auth, async (req, res) => {
  try { await db().collection('assignments').doc(req.params.id).delete(); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

// POST /api/assignments/:id/submit
router.post('/:id/submit', auth, async (req, res) => {
  try {
    const id = uuid();
    const sub = { id, assignmentId: req.params.id, studentId: req.userId, schoolId: req.schoolId, ...req.body, submittedAt: new Date().toISOString() };
    await db().collection('assignment_submissions').doc(id).set(sub);
    res.json({ success: true, data: sub });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

// PATCH /api/assignments/submissions/:id/grade
router.patch('/submissions/:id/grade', auth, async (req, res) => {
  try {
    await db().collection('assignment_submissions').doc(req.params.id).update({ grade: req.body.grade, teacherNote: req.body.note, gradedAt: new Date().toISOString() });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

module.exports = router;
