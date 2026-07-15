
const router=require('express').Router();
const jwt=require('jsonwebtoken');
const {db}=require('../config/firebase');
const sign=(p)=>jwt.sign(p,process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||'30d'});

router.post('/login',async(req,res)=>{
  try{
    const{email,password}=req.body||{};
    if(!email||!password)return res.status(400).json({success:false,code:'missing_fields'});
    const lEmail=email.trim().toLowerCase();const pass=password.trim();const d=db();
    const cfg=await d.collection('config').doc('app').get();
    const adminEmail=(cfg.data()?.adminEmail||process.env.ADMIN_EMAIL||'superadmin@tarabix.com').toLowerCase();
    const adminPass=cfg.data()?.adminPassword||process.env.ADMIN_PASSWORD||'Admin@2024!';
    if(lEmail===adminEmail&&pass===adminPass){
      const token=sign({userId:'superadmin',role:'admin',schoolId:null});
      return res.json({success:true,token,user:{role:'admin',userId:'superadmin',name:'Super Admin'}});
    }
    const[schoolSnap,accSnap,stuSnap,parentSnap]=await Promise.all([
      d.collection('schools').where('teacherEmail','==',lEmail).limit(1).get(),
      d.collection('teacher_accounts').where('email','==',lEmail).limit(1).get(),
      d.collection('students').where('email','==',lEmail).limit(1).get(),
      d.collection('parents').where('email','==',lEmail).limit(1).get(),
    ]);
    if(!schoolSnap.empty){
      const s={id:schoolSnap.docs[0].id,...schoolSnap.docs[0].data()};
      if(!s.isActive)return res.status(403).json({success:false,code:'school_inactive'});
      if((s.teacherPassword||'').trim()!==pass)return res.status(401).json({success:false,code:'wrong_password'});
      const token=sign({userId:`director-${s.id}`,role:'director',schoolId:s.id,email:lEmail});
      return res.json({success:true,token,user:{role:'director',userId:`director-${s.id}`,name:s.teacherName||'',email:s.teacherEmail,password:s.teacherPassword,schoolId:s.id,schoolName:s.name,photoBase64:s.teacherPhotoBase64||null}});
    }
    if(!accSnap.empty){
      const a={id:accSnap.docs[0].id,...accSnap.docs[0].data()};
      if(!a.isActive)return res.status(401).json({success:false,code:'not_found'});
      if((a.password||'').trim()!==pass)return res.status(401).json({success:false,code:'wrong_password'});
      const sd=await d.collection('schools').doc(a.schoolId).get();
      if(!sd.exists||!sd.data().isActive)return res.status(403).json({success:false,code:'school_inactive'});
      const token=sign({userId:`teacher-${a.id}`,role:'teacher',schoolId:a.schoolId,email:lEmail});
      return res.json({success:true,token,user:{role:'teacher',userId:`teacher-${a.id}`,name:a.name,email:a.email,password:a.password,schoolId:a.schoolId,schoolName:sd.data().name,assignedClassIds:a.allowedClassIds||[],photoBase64:a.profileImageBase64||null}});
    }
    if(!stuSnap.empty){
      const s={id:stuSnap.docs[0].id,...stuSnap.docs[0].data()};
      if((s.password||'').trim()!==pass)return res.status(401).json({success:false,code:'wrong_password'});
      if(s.status==='pending')return res.status(403).json({success:false,code:'pending'});
      if(s.status==='rejected')return res.status(403).json({success:false,code:'rejected'});
      const token=sign({userId:s.id,role:'student',schoolId:s.schoolId,email:lEmail});
      return res.json({success:true,token,user:{role:'student',userId:s.id,name:s.name||'',email:s.email||'',password:s.password||'',schoolId:s.schoolId||'',schoolName:s.schoolName||'',classId:s.classId||'',className:s.className||'',status:s.status||'approved',joinedAt:s.joinedAt,profileImageBase64:s.profileImageBase64||null,idNumber:s.idNumber||'',phone:s.phone||''}});
    }
    if(!parentSnap.empty){
      const p={id:parentSnap.docs[0].id,...parentSnap.docs[0].data()};
      if((p.password||'').trim()!==pass)return res.status(401).json({success:false,code:'wrong_password'});
      const token=sign({userId:p.id,role:'parent',schoolId:p.schoolId,email:lEmail});
      return res.json({success:true,token,user:{role:'parent',userId:p.id,name:p.name||'',email:p.email||'',password:p.password||'',schoolId:p.schoolId||'',schoolName:p.schoolName||'',studentIds:p.studentIds||[]}});
    }
    return res.status(401).json({success:false,code:'not_found'});
  }catch(e){console.error('[login]',e.message);res.status(500).json({success:false,code:'server_error',message:e.message});}
});

router.get('/me',require('../middleware/auth'),(req,res)=>res.json({success:true,user:req.user}));
module.exports=router;