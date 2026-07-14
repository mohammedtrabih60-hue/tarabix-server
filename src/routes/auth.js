// src/routes/auth.js
const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const { db } = require('../config/firebase');

const sign = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' });

// ── POST /api/auth/login ──────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ success: false, code: 'missing_fields' });

    const lEmail = email.trim().toLowerCase();
    const pass   = password.trim();
    const d      = db();

    // ── Super Admin ───────────────────────────────────────────────────────
    if (lEmail === (process.env.ADMIN_EMAIL || 'superadmin@tarabix.com').toLowerCase() &&
        pass   === (process.env.ADMIN_PASSWORD || 'Admin@2024!')) {
      const token = sign({ userId: 'superadmin', role: 'admin', schoolId: null });
      return res.json({ success: true, token, user: { role: 'admin', userId: 'superadmin', name: 'Super Admin' } });
    }

    // ── Parallel Firestore queries (fast) ─────────────────────────────────
    const [schoolSnap, teacherSnap, studentSnap, parentSnap] = await Promise.all([
      d.collection('schools').where('teacherEmail', '==', lEmail).limit(1).get(),
      d.collection('teacher_accounts').where('email', '==', lEmail).limit(1).get(),
      d.collection('students').where('email', '==', lEmail).limit(1).get(),
      d.collection('parents').where('email', '==', lEmail).limit(1).get(),
    ]);

    // ── School Director ───────────────────────────────────────────────────
    if (!schoolSnap.empty) {
      const s = { id: schoolSnap.docs[0].id, ...schoolSnap.docs[0].data() };
      if (!s.isActive)               return res.status(403).json({ success: false, code: 'school_inactive' });
      if (s.teacherPassword.trim() !== pass) return res.status(401).json({ success: false, code: 'wrong_password' });

      // Check subscription
      const sub = await d.collection('subscriptions').doc(s.id).get();
      const plan = sub.exists ? (sub.data().plan || 'free') : 'free';

      const token = sign({ userId: `director-${s.id}`, role: 'director', schoolId: s.id, email: lEmail });
      return res.json({
        success: true, token,
        user: { role: 'director', userId: `director-${s.id}`, name: s.teacherName, email: s.teacherEmail,
                password: s.teacherPassword, schoolId: s.id, schoolName: s.name,
                plan, photoBase64: s.teacherPhotoBase64 || null }
      });
    }

    // ── Teacher ───────────────────────────────────────────────────────────
    if (!teacherSnap.empty) {
      const t = { id: teacherSnap.docs[0].id, ...teacherSnap.docs[0].data() };
      if (!t.isActive) return res.status(401).json({ success: false, code: 'not_found' });
      if (t.password.trim() !== pass) return res.status(401).json({ success: false, code: 'wrong_password' });

      const schoolDoc = await d.collection('schools').doc(t.schoolId).get();
      if (!schoolDoc.exists || !schoolDoc.data().isActive)
        return res.status(403).json({ success: false, code: 'school_inactive' });

      const token = sign({ userId: `teacher-${t.id}`, role: 'teacher', schoolId: t.schoolId, email: lEmail });
      return res.json({
        success: true, token,
        user: { role: 'teacher', userId: `teacher-${t.id}`, name: t.name, email: t.email,
                password: t.password, schoolId: t.schoolId, schoolName: schoolDoc.data().name,
                assignedClassIds: t.allowedClassIds || [], photoBase64: t.profileImageBase64 || null }
      });
    }

    // ── Student ───────────────────────────────────────────────────────────
    if (!studentSnap.empty) {
      const s = { id: studentSnap.docs[0].id, ...studentSnap.docs[0].data() };
      if (s.password.trim() !== pass) return res.status(401).json({ success: false, code: 'wrong_password' });
      if (s.status === 'pending')     return res.status(403).json({ success: false, code: 'pending' });
      if (s.status === 'rejected')    return res.status(403).json({ success: false, code: 'rejected' });

      const token = sign({ userId: s.id, role: 'student', schoolId: s.schoolId, email: lEmail });
      return res.json({
        success: true, token,
        user: { role: 'student', userId: s.id, name: s.name, email: s.email, password: s.password,
                schoolId: s.schoolId, schoolName: s.schoolName, classId: s.classId || '',
                className: s.className || '', status: s.status, joinedAt: s.joinedAt,
                profileImageBase64: s.profileImageBase64 || null }
      });
    }

    // ── Parent ────────────────────────────────────────────────────────────
    if (!parentSnap.empty) {
      const p = { id: parentSnap.docs[0].id, ...parentSnap.docs[0].data() };
      if (p.password.trim() !== pass) return res.status(401).json({ success: false, code: 'wrong_password' });

      const token = sign({ userId: p.id, role: 'parent', schoolId: p.schoolId, email: lEmail });
      return res.json({
        success: true, token,
        user: { role: 'parent', userId: p.id, name: p.name, email: p.email, password: p.password,
                schoolId: p.schoolId, schoolName: p.schoolName, studentIds: p.studentIds || [] }
      });
    }

    return res.status(401).json({ success: false, code: 'not_found' });
  } catch (e) {
    console.error('[login]', e.message);
    res.status(500).json({ success: false, code: 'server_error', message: e.message });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────
router.get('/me', require('../middleware/auth'), (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
