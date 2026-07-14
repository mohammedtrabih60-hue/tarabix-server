// routes/schedule.js — Daily Schedule
const router = require('express').Router();
const auth   = require('../middleware/auth');
const role   = require('../middleware/requireRole');
const { db } = require('../config/firebase');
const { v4: uuid } = require('uuid');
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// File upload setup
const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'schedule');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// GET /api/schedule?classId=xxx
router.get('/', auth, async (req, res) => {
  try {
    const { classId } = req.query;
    let q = db().collection('schedule').where('schoolId', '==', req.schoolId);
    if (classId) q = q.where('classId', '==', classId);
    const snap = await q.orderBy('createdAt', 'desc').get();
    res.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

// POST /api/schedule — add text schedule
router.post('/', auth, role('director', 'teacher'), async (req, res) => {
  try {
    const { classId, className, days } = req.body;
    if (!classId) return res.status(400).json({ success: false, code: 'missing_class' });
    const id  = uuid();
    const doc = { id, classId, className: className||'', schoolId: req.schoolId, days: days||{}, type: 'text', createdAt: new Date().toISOString(), createdBy: req.userId };
    await db().collection('schedule').doc(id).set(doc);
    res.json({ success: true, data: doc });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

// POST /api/schedule/upload — upload PDF/PNG
router.post('/upload', auth, role('director', 'teacher'), upload.single('file'), async (req, res) => {
  try {
    const { classId, className } = req.body;
    if (!req.file) return res.status(400).json({ success: false, code: 'no_file' });
    const fileUrl  = `/uploads/schedule/${req.file.filename}`;
    const mimeType = req.file.mimetype;
    const id = uuid();
    const doc = { id, classId, className: className||'', schoolId: req.schoolId, fileUrl, mimeType, type: 'file', originalName: req.file.originalname, createdAt: new Date().toISOString(), createdBy: req.userId };
    await db().collection('schedule').doc(id).set(doc);
    res.json({ success: true, data: doc });
  } catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

// DELETE /api/schedule/:id
router.delete('/:id', auth, role('director', 'teacher'), async (req, res) => {
  try { await db().collection('schedule').doc(req.params.id).delete(); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, code: 'server_error' }); }
});

module.exports = router;
