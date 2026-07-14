const router = require('express').Router();
const auth   = require('../middleware/auth');
const role   = require('../middleware/requireRole');
const { db } = require('../config/firebase');
const { v4: uuid } = require('uuid');

router.get('/', auth, async (req, res) => {
  try {
    const snap = await db().collection('classes').where('schoolId', '==', req.schoolId).get();
    res.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, code: 'missing_name' });
    const id  = uuid();
    const cls = { id, name: name.trim(), schoolId: req.schoolId, createdAt: new Date().toISOString() };
    await db().collection('classes').doc(id).set(cls);
    res.json({ success: true, data: cls });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

router.delete('/:id', auth, async (req, res) => {
  try { await db().collection('classes').doc(req.params.id).delete(); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

router.patch('/:id/homeroom', auth, role('director', 'admin'), async (req, res) => {
  try {
    const { teacherId, teacherName, teacherPhoto, teacherPhone } = req.body;
    await db().collection('classes').doc(req.params.id).update({
      homeroomTeacherId:    teacherId    || null,
      homeroomTeacherName:  teacherName  || '',
      homeroomTeacherPhoto: teacherPhoto || null,
      homeroomTeacherPhone: teacherPhone || null,
    });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

router.post('/improvement-request', auth, async (req, res) => {
  try {
    const { subject, currentUnits, targetUnits, studentId, studentName, classId } = req.body;
    const d = db();
    const classDoc  = await d.collection('classes').doc(classId).get();
    const homeroomId = classDoc.exists ? classDoc.data().homeroomTeacherId : null;
    const id  = uuid();
    await d.collection('faniyot').doc(id).set({
      id, studentId, studentName, schoolId: req.schoolId, classId,
      subject: `🎯 בקשת שיפור יחידות - ${subject}`,
      type: 'improvement',
      message: `הסטודנט מבקש לשפר מ-${currentUnits} ל-${targetUnits} יחידות במקצוע ${subject}`,
      currentUnits, targetUnits,
      targetTeacherId: homeroomId || null,
      status: 'open',
      createdAt: new Date().toISOString(),
    });
    if (homeroomId) {
      const { getTokens, sendPush } = require('../services/fcm');
      const tokens = await getTokens(req.schoolId, { targetUserId: `teacher-${homeroomId}` });
      if (tokens.length) await sendPush(tokens,
        `🎯 ${studentName} מבקש שיפור יחידות`,
        `${subject}: ${currentUnits} → ${targetUnits} יחידות`,
        { type: 'improvement_request' }
      );
    }
    res.json({ success: true, faniyaId: id });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

module.exports = router;
