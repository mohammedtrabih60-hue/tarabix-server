require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const path      = require('path');
const { init }  = require('./src/config/firebase');

init();

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization','Accept'] }));
app.options('*', cors());
app.use(express.json({ limit: '20mb' }));
app.use('/api/', rateLimit({ windowMs: 60_000, max: 200, message: { success: false, code: 'rate_limited' } }));

// Serve Flutter web app - NO CORS when same origin
app.use(express.static(path.join(__dirname, 'web')));

app.use('/api/auth',          require('./src/routes/auth'));
app.use('/api/schools',       require('./src/routes/schools'));
app.use('/api/students',      require('./src/routes/students'));
app.use('/api/teachers',      require('./src/routes/teachers'));
app.use('/api/classes',       require('./src/routes/classes'));
app.use('/api/grades',        require('./src/routes/grades'));
app.use('/api/attendance',    require('./src/routes/attendance'));
app.use('/api/messages',      require('./src/routes/messages'));
app.use('/api/notifications', require('./src/routes/notifications'));
app.use('/api/parents',       require('./src/routes/parents'));
app.use('/api/ai',            require('./src/routes/ai'));

app.get('/health', (_, res) => res.json({ status: 'ok', server: 'Tarabix Academy SaaS v2.0', time: new Date().toISOString() }));

// SPA fallback
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/health'))
    res.sendFile(path.join(__dirname, 'web', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('\n══════════════════════════════════════════');
  console.log('  🚀 Tarabix Academy SaaS Server');
  console.log(`  🌐 http://localhost:${PORT}  ← افتح التطبيق من هنا`);
  console.log(`  🔐 POST http://localhost:${PORT}/api/auth/login`);
  console.log('══════════════════════════════════════════\n');
});
