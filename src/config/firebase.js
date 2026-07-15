const admin = require('firebase-admin');
let _db, _msg;
function init() {
  if (admin.apps.length) return;
  let sa;
  try { const v = process.env.FIREBASE_SERVICE_ACCOUNT||''; if(v.length>10) sa=JSON.parse(v); else throw 1; }
  catch(e) { const path=require('path'); sa=require(path.resolve('./firebase-service-account.json')); }
  admin.initializeApp({ credential: admin.credential.cert(sa) });
  _db=admin.firestore(); _msg=admin.messaging();
  console.log(`✅ Firebase: ${sa.project_id}`);
}
const db=()=>{if(!_db)init();return _db;};
const msg=()=>{if(!_msg)init();return _msg;};
module.exports={init,db,msg};