const router = require('express').Router();
const auth   = require('../middleware/auth');
const { db } = require('../config/firebase');
const { v4: uuid } = require('uuid');

router.get('/', auth, async (req, res) => {
  try {
    const snap = await db().collection('parents').where('schoolId', '==', req.schoolId).get();
    res.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const lEmail = req.body.email.trim().toLowerCase();
    const exists = await db().collection('parents').where('email', '==', lEmail).limit(1).get();
    if (!exists.empty) return res.status(400).json({ success: false, code: 'email_taken' });
    const schoolDoc = await db().collection('schools').doc(req.schoolId).get();
    const id = uuid();
    const parent = { id, ...req.body, email: lEmail, schoolId: req.schoolId, schoolName: schoolDoc.data()?.name || '', role: 'parent', createdAt: new Date().toISOString() };
    await db().collection('parents').doc(id).set(parent);
    res.json({ success: true, data: parent });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

router.patch('/:id', auth, async (req, res) => {
  try { await db().collection('parents').doc(req.params.id).update(req.body); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

router.delete('/:id', auth, async (req, res) => {
  try { await db().collection('parents').doc(req.params.id).delete(); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

module.exports = router;