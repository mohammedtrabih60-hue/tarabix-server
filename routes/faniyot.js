const router = require('express').Router();
const auth   = require('../middleware/auth');
const { db } = require('../config/firebase');
const { v4: uuid } = require('uuid');

router.get('/', auth, async (req, res) => {
  try {
    const snap = await db().collection('faniyot').where('schoolId','==',req.schoolId).orderBy('createdAt','desc').get();
    res.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const id = uuid();
    const now = new Date().toISOString();
    const f = { id, ...req.body, schoolId: req.schoolId, status: 'open', messages: [], createdAt: now, updatedAt: now };
    await db().collection('faniyot').doc(id).set(f);
    res.json({ success: true, data: f });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

// POST /api/faniyot/:id/message — send message in faniya
router.post('/:id/message', auth, async (req, res) => {
  try {
    const { content, isTeacher, senderName } = req.body;
    const msg = { id: uuid(), content, isTeacher: isTeacher||false, senderName, sentAt: new Date().toISOString() };
    const ref = db().collection('faniyot').doc(req.params.id);
    const doc = await ref.get();
    const msgs = [...(doc.data()?.messages||[]), msg];
    await ref.update({ messages: msgs, updatedAt: new Date().toISOString() });
    res.json({ success: true, data: msg });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

// PATCH /api/faniyot/:id/status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    await db().collection('faniyot').doc(req.params.id).update({ status: req.body.status, updatedAt: new Date().toISOString() });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

module.exports = router;
