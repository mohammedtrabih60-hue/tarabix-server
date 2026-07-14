const admin = require('firebase-admin');
const path  = require('path');
let _db, _msg;

function init() {
  if (admin.apps.length) return;
  const sa = require(path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT || './firebase-service-account.json'));
  admin.initializeApp({ credential: admin.credential.cert(sa) });
  _db  = admin.firestore();
  _msg = admin.messaging();
  console.log(`✅ Firebase: ${sa.project_id}`);
}

const db  = () => { if (!_db)  init(); return _db;  };
const msg = () => { if (!_msg) init(); return _msg; };

module.exports = { init, db, msg };
