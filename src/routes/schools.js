// src/routes/schools.js — Super Admin manages all schools + subscriptions
const router  = require('express').Router();
const auth    = require('../middleware/auth');
const role    = require('../middleware/requireRole');
const { db }  = require('../config/firebase');
const { v4: uuid } = require('uuid');

// GET /api/schools — all schools (admin only)
router.get('/', auth, role('admin'), async (req, res) => {
  try {
    const snap = await db().collection('schools').get();
    const schools = await Promise.all(snap.docs.map(async doc => {
      const sub = await db().collection('subscriptions').doc(doc.id).get();
      return { id: doc.id, ...doc.data(), plan: sub.exists ? sub.data().plan : 'free' };
    }));
    res.json({ success: true, data: schools });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

// POST /api/schools — create school
router.post('/', auth, role('admin'), async (req, res) => {
  try {
    const id     = uuid();
    const school = { id, ...req.body, isActive: true, createdAt: new Date().toISOString() };
    await db().collection('schools').doc(id).set(school);
    // Create free subscription
    await db().collection('subscriptions').doc(id).set({
      schoolId: id, plan: 'free', createdAt: new Date().toISOString()
    });
    res.json({ success: true, data: school });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

// PATCH /api/schools/:id
router.patch('/:id', auth, role('admin'), async (req, res) => {
  try {
    await db().collection('schools').doc(req.params.id).update(req.body);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

// DELETE /api/schools/:id
router.delete('/:id', auth, role('admin'), async (req, res) => {
  try {
    await db().collection('schools').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

// PATCH /api/schools/:id/subscription — upgrade/downgrade plan
router.patch('/:id/subscription', auth, role('admin'), async (req, res) => {
  try {
    const { plan, expiresAt } = req.body;
    await db().collection('subscriptions').doc(req.params.id).set({
      schoolId: req.params.id, plan, expiresAt: expiresAt || null,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    res.json({ success: true, plan });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

// POST /api/schools/:id/toggle — activate/deactivate
router.post('/:id/toggle', auth, role('admin'), async (req, res) => {
  try {
    const doc  = await db().collection('schools').doc(req.params.id).get();
    const curr = doc.data()?.isActive ?? true;
    await db().collection('schools').doc(req.params.id).update({ isActive: !curr });
    res.json({ success: true, isActive: !curr });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

module.exports = router;
