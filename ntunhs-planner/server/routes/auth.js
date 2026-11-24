import express from 'express';
import jwt from 'jsonwebtoken';
import { db, hashPassword, verifyPassword } from '../db.js';
import { getJwtSecret, requireAuth } from '../middleware/auth.js';

const router = express.Router();

function parseCompletedCourses(raw) {
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function getCompletedCourseDetails(codes) {
  if (!Array.isArray(codes) || codes.length === 0) return [];
  const stmt = db.prepare(
    'SELECT code, name_zh, name_en, credits, category, department, tags FROM courses WHERE code = ? LIMIT 1'
  );
  const details = [];
  const seen = new Set();
  for (const rawCode of codes) {
    const code = String(rawCode).trim();
    if (!code || seen.has(code)) continue;
    const row = stmt.get(code);
    if (row) {
      seen.add(code);
      details.push(row);
    }
  }
  return details;
}

function sanitizeUser(row) {
  const completedCourses = parseCompletedCourses(row.completed_courses);
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    name: row.name,
    department: row.department,
    grade: row.grade,
    completed_courses: completedCourses,
    completed_course_details: getCompletedCourseDetails(completedCourses)
  };
}

router.post('/login', (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');

  if (!username || !password) {
    return res.status(400).json({ error: '請輸入帳號與密碼' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: '帳號或密碼錯誤' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, grade: user.grade, department: user.department },
    getJwtSecret(),
    { expiresIn: '12h' }
  );

  return res.json({ token, user: sanitizeUser(user) });
});

router.post('/register', (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  const name = String(req.body?.name || '').trim();
  const department = String(req.body?.department || '資訊管理系 (22140)').trim();
  const grade = Number.parseInt(req.body?.grade, 10) || 1;

  if (username.length < 3 || password.length < 8 || !name) {
    return res.status(400).json({ error: '帳號至少 3 碼、密碼至少 8 碼且需填寫姓名' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: '此帳號已被註冊' });
  }

  const info = db
    .prepare(
      'INSERT INTO users (username, password_hash, role, name, department, grade) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(username, hashPassword(password), 'student', name, department, Math.min(Math.max(grade, 1), 7));

  const created = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  const token = jwt.sign(
    { id: created.id, username: created.username, role: created.role, grade: created.grade, department: created.department },
    getJwtSecret(),
    { expiresIn: '12h' }
  );

  return res.status(201).json({ token, user: sanitizeUser(created) });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: '找不到使用者' });
  return res.json({ user: sanitizeUser(user) });
});

router.post('/completed-courses/toggle', requireAuth, (req, res) => {
  const courseCode = String(req.body?.courseCode || '').trim();
  if (!courseCode) {
    return res.status(400).json({ error: '請提供課程代碼 (courseCode)' });
  }

  const user = db.prepare('SELECT completed_courses FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: '找不到使用者' });

  const list = parseCompletedCourses(user.completed_courses);
  const idx = list.indexOf(courseCode);
  let completed = false;
  if (idx >= 0) {
    list.splice(idx, 1);
    completed = false;
  } else {
    list.push(courseCode);
    completed = true;
  }

  db.prepare('UPDATE users SET completed_courses = ? WHERE id = ?').run(JSON.stringify(list), req.user.id);
  return res.json({
    completed,
    completed_courses: list,
    completed_course_details: getCompletedCourseDetails(list)
  });
});

export default router;
