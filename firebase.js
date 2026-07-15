const admin = require('firebase-admin');
let _db, _msg;

function init() {
  if (admin.apps.length) return;

  let sa;

  // On Railway: FIREBASE_SERVICE_ACCOUNT contains the JSON string
  if (process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_SERVICE_ACCOUNT.startsWith('{')) {
    sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Local: read from file
    const path = require('path');
    const filePath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT || './firebase-service-account.json');
    sa = require(filePath);
  }

  admin.initializeApp({ credential: admin.credential.cert(sa) });
  _db  = admin.firestore();
  _msg = admin.messaging();
  console.log(`✅ Firebase: ${sa.project_id}`);
}

const db  = () => { if (!_db)  init(); return _db;  };
const msg = () => { if (!_msg) init(); return _msg; };

module.exports = { init, db, msg };
