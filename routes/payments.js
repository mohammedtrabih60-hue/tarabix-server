const router = require('express').Router();
const auth   = require('../middleware/auth');
const { db } = require('../config/firebase');
const { v4: uuid } = require('uuid');

router.get('/', auth, async (req, res) => {
  try {
    const snap = await db().collection('payments').where('schoolId','==',req.schoolId).get();
    res.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const id = uuid();
    const p = { id, ...req.body, schoolId: req.schoolId, createdBy: req.userId, createdAt: new Date().toISOString(), isPaid: false };
    await db().collection('payments').doc(id).set(p);
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

router.patch('/:id/pay', auth, async (req, res) => {
  try { await db().collection('payments').doc(req.params.id).update({ isPaid: true, paidAt: new Date().toISOString() }); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

router.delete('/:id', auth, async (req, res) => {
  try { await db().collection('payments').doc(req.params.id).delete(); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

module.exports = router;
