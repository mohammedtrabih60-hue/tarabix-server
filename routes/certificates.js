const router = require('express').Router();
const auth   = require('../middleware/auth');
const { db } = require('../config/firebase');
const { v4: uuid } = require('uuid');

router.get('/', auth, async (req, res) => {
  try {
    const snap = await db().collection('certificates').where('schoolId','==',req.schoolId).get();
    res.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const id = uuid();
    const cert = { id, ...req.body, schoolId: req.schoolId, issuedBy: req.userId, issuedAt: new Date().toISOString() };
    await db().collection('certificates').doc(id).set(cert);
    res.json({ success: true, data: cert });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

router.delete('/:id', auth, async (req, res) => {
  try { await db().collection('certificates').doc(req.params.id).delete(); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

module.exports = router;
