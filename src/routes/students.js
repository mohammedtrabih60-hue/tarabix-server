// src/routes/students.js
const router = require('express').Router();
const auth   = require('../middleware/auth');
const role   = require('../middleware/requireRole');
const { db } = require('../config/firebase');
const { v4: uuid } = require('uuid');

// GET /api/students
router.get('/', auth, async (req, res) => {
  try {
    const snap = await db().collection('students').where('schoolId', '==', req.schoolId).get();
    res.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

// POST /api/students — add student
router.post('/', auth, role('director', 'teacher'), async (req, res) => {
  try {
    const { name, email, password, classId, className, phone, idNumber } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, code: 'missing_fields' });

    const lEmail = email.trim().toLowerCase();
    const d      = db();
    const exists = await d.collection('students').where('email', '==', lEmail).limit(1).get();
    if (!exists.empty) return res.status(400).json({ success: false, code: 'email_taken' });

    const schoolDoc  = await d.collection('schools').doc(req.schoolId).get();
    const id         = uuid();
    const student    = {
      id, name: name.trim(), email: lEmail, password: password.trim(),
      role: 'student', status: 'approved',
      schoolId: req.schoolId, schoolName: schoolDoc.data()?.name || '',
      classId: classId || '', className: className || '',
      phone: phone || '', idNumber: idNumber || '',
      joinedAt: new Date().toISOString(),
      createdBy: req.userId,
    };
    await d.collection('students').doc(id).set(student);
    res.json({ success: true, data: student });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

// PATCH /api/students/:id
router.patch('/:id', auth, async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.id; delete updates.role; delete updates.schoolId;
    await db().collection('students').doc(req.params.id).update(updates);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

// DELETE /api/students/:id
router.delete('/:id', auth, role('director', 'teacher', 'admin'), async (req, res) => {
  try {
    await db().collection('students').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

// POST /api/students/:id/approve
router.post('/:id/approve', auth, async (req, res) => {
  try { await db().collection('students').doc(req.params.id).update({ status: 'approved' }); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

// POST /api/students/:id/reject
router.post('/:id/reject', auth, async (req, res) => {
  try { await db().collection('students').doc(req.params.id).update({ status: 'rejected' }); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

// POST /api/students/:id/reset-password
router.post('/:id/reset-password', auth, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ success: false, code: 'missing_password' });
    await db().collection('students').doc(req.params.id).update({ password: password.trim() });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

module.exports = router;

// POST /api/students/update-profile — student updates own profile
router.post('/update-profile', auth, async (req, res) => {
  try {
    const { name, phone, profileImageBase64 } = req.body;
    const updates = {};
    if (name)               updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone;
    if (profileImageBase64) updates.profileImageBase64 = profileImageBase64;

    // Update based on role
    const col = req.role === 'student' ? 'students' : 'teacher_accounts';
    await db().collection(col).doc(req.userId.replace('teacher-', '')).update(updates);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});
