const router = require('express').Router();
const auth   = require('../middleware/auth');
const { db } = require('../config/firebase');
const { v4: uuid } = require('uuid');

// POST /api/points/award
router.post('/award', auth, async (req, res) => {
  try {
    const { studentId, points, reason, type } = req.body;
    const id = uuid();
    const record = { id, studentId, points, reason, type: type||'other', schoolId: req.schoolId, awardedBy: req.userId, createdAt: new Date().toISOString() };
    await db().collection('points').doc(id).set(record);
    // Update student total points
    const stuRef = db().collection('students').doc(studentId);
    await stuRef.update({ totalPoints: (await stuRef.get()).data()?.totalPoints + points || points });
    res.json({ success: true, data: record });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

// POST /api/points/deduct
router.post('/deduct', auth, async (req, res) => {
  try {
    const { studentId, points, reason } = req.body;
    const stuRef = db().collection('students').doc(studentId);
    const current = (await stuRef.get()).data()?.totalPoints || 0;
    await stuRef.update({ totalPoints: Math.max(0, current - points) });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

module.exports = router;
