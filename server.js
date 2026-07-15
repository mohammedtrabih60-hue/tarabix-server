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
app.use('/api/', rateLimit({ windowMs: 60_000, max: 300, message: { success: false, code: 'rate_limited' } }));

// Serve Flutter web
app.use(express.static(path.join(__dirname, 'web')));

// ── Auth ──────────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./src/routes/auth'));

// ── School Management ─────────────────────────────────────────────────────────
app.use('/api/schools',       require('./src/routes/schools'));
app.use('/api/classes',       require('./src/routes/classes'));

// ── Users ─────────────────────────────────────────────────────────────────────
app.use('/api/students',      require('./src/routes/students'));
app.use('/api/teachers',      require('./src/routes/teachers'));
app.use('/api/parents',       require('./src/routes/parents'));

// ── Academic ──────────────────────────────────────────────────────────────────
app.use('/api/grades',        require('./src/routes/grades'));
app.use('/api/attendance',    require('./src/routes/attendance'));
app.use('/api/assignments',   require('./src/routes/assignments'));
app.use('/api/quizzes',       require('./src/routes/quizzes'));
app.use('/api/courses',       require('./src/routes/courses'));
app.use('/api/certificates',  require('./src/routes/certificates'));
app.use('/api/schedule',      require('./src/routes/schedule'));

// ── Communication ─────────────────────────────────────────────────────────────
app.use('/api/messages',      require('./src/routes/messages'));
app.use('/api/notifications', require('./src/routes/notifications'));
app.use('/api/faniyot',       require('./src/routes/faniyot'));

// ── Finance ───────────────────────────────────────────────────────────────────
app.use('/api/payments',      require('./src/routes/payments'));
app.use('/api/points',        require('./src/routes/points'));

// ── AI ────────────────────────────────────────────────────────────────────────
app.use('/api/ai',            require('./src/routes/ai'));

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', server: 'Tarabix Academy SaaS v2.0', time: new Date().toISOString() }));

// Flutter SPA fallback
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/health'))
    res.sendFile(path.join(__dirname, 'web', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Tarabix Academy Server — Port ${PORT}`);
  console.log(`📡 http://localhost:${PORT}/health\n`);
});
