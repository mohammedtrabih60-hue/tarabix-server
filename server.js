// ══════════════════════════════════════════════════════════════════════════════
//  Tarabix Academy — SaaS Backend Server
//  Multi-School Platform
//  تشغيل: node server.js
// ══════════════════════════════════════════════════════════════════════════════
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const path       = require('path');
const { init }   = require('./src/config/firebase');

// Initialize Firebase
init();

const app = express();

// ── Security ──────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization', 'Accept'] }));
app.options('*', cors());
app.use(express.json({ limit: '20mb' }));

// Rate limiting
app.use('/api/', rateLimit({ windowMs: 60_000, max: 200,
  message: { success: false, code: 'rate_limited' } }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ────────────────────────────────────────────────────────────────
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
app.use('/api/schedule',       require('./src/routes/schedule'));

// ── Health ────────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({
  status: 'ok',
  server: 'Tarabix Academy SaaS v2.0',
  time:   new Date().toISOString(),
}));

// ── 404 ───────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, code: 'not_found', path: req.path }));

// ── Start ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('\n══════════════════════════════════════════');
  console.log('  🚀 Tarabix Academy SaaS Server');
  console.log('══════════════════════════════════════════');
  console.log(`  📡 http://localhost:${PORT}/health`);
  console.log(`  🔐 POST http://localhost:${PORT}/api/auth/login`);
  console.log('══════════════════════════════════════════\n');
});
