// src/services/fcm.js — Push notifications
const { db, msg } = require('../config/firebase');

async function getTokens(schoolId, { targetUserId, classId } = {}) {
  const d = db();
  if (targetUserId) {
    const doc = await d.collection('fcm_tokens').doc(targetUserId).get();
    return (doc.exists && doc.data().token) ? [doc.data().token] : [];
  }
  if (classId) {
    const snap = await d.collection('students')
      .where('schoolId', '==', schoolId).where('classId', '==', classId).get();
    const tokens = [];
    for (const s of snap.docs) {
      const t = await d.collection('fcm_tokens').doc(s.id).get();
      if (t.exists && t.data().token) tokens.push(t.data().token);
    }
    return tokens;
  }
  const snap = await d.collection('fcm_tokens').where('schoolId', '==', schoolId).get();
  return snap.docs.map(d => d.data().token).filter(Boolean);
}

async function sendPush(tokens, title, body, data = {}) {
  if (!tokens.length) return { sent: 0 };
  const m = msg();
  let sent = 0;
  for (let i = 0; i < tokens.length; i += 500) {
    try {
      const r = await m.sendEachForMulticast({
        tokens: tokens.slice(i, i + 500),
        notification: { title, body },
        data: { ...data, click_action: 'FLUTTER_NOTIFICATION_CLICK' },
        webpush: { notification: { icon: '/icons/Icon-192.png' }, fcmOptions: { link: '/' } },
      });
      sent += r.successCount;
    } catch (e) { console.error('[FCM]', e.message); }
  }
  return { sent };
}

module.exports = { getTokens, sendPush };
