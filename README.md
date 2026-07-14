# Tarabix Academy — SaaS Server

## Architecture
```
Flutter (UI only)
      ↕ HTTP/JSON
Express Server (all logic)
      ↕
Firebase Firestore (database)
```

## APIs
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/login | تسجيل الدخول |
| GET | /api/auth/me | معلومات الجلسة |
| GET/POST | /api/schools | المدارس (admin) |
| PATCH | /api/schools/:id/subscription | الاشتراك |
| GET/POST | /api/students | الطلاب |
| GET/POST | /api/teachers | المعلمون |
| GET/POST | /api/classes | الصفوف |
| GET/POST | /api/grades | الدرجات |
| GET/POST | /api/attendance | الحضور |
| GET/POST | /api/messages | الرسائل |
| POST | /api/notifications/push | إشعار عام |
| POST | /api/notifications/note | ملاحظة للطالب |
| GET/POST | /api/parents | الأهل |
| POST | /api/ai/chat | محادثة AI |
| POST | /api/ai/solve | حل مسألة |

## تشغيل
```bash
npm install
cp .env.example .env
# عدّل .env (JWT_SECRET + FIREBASE_SERVICE_ACCOUNT)
# ضع firebase-service-account.json هنا
node server.js
```
