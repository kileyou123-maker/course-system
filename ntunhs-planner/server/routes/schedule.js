import crypto from 'node:crypto';
import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare(`
      SELECT c.*
      FROM user_schedules us
      JOIN courses c ON c.id = us.course_id
      WHERE us.user_id = ?
      ORDER BY c.weekday, c.period_mask
    `)
    .all(req.user.id);

  res.json({ items: rows });
});

router.post('/', requireAuth, (req, res) => {
  const courseId = Number.parseInt(req.body?.courseId, 10);
  if (!Number.isInteger(courseId)) {
    return res.status(400).json({ error: '無效的課程 ID' });
  }

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
  if (!course) {
    return res.status(404).json({ error: '找不到該課程' });
  }

  const user = db.prepare('SELECT grade, completed_courses FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: '找不到使用者' });
  if (user.grade < course.min_grade) {
    return res.status(400).json({
      error: course.restriction_note_zh || `不符修課資格：本課程限 ${course.min_grade} 年級以上修習`
    });
  }

  let completed = [];
  try {
    const parsed = JSON.parse(user.completed_courses || '[]');
    if (Array.isArray(parsed)) completed = parsed.map(String);
  } catch {
    // Treat malformed legacy records as no completed courses.
  }
  if (course.prerequisite_code && !completed.includes(String(course.prerequisite_code))) {
    return res.status(400).json({
      error: course.restriction_note_zh || `不符修課資格：需先修畢先修科目 (${course.prerequisite_code})`
    });
  }

  // Check time conflict
  const current = db
    .prepare(`
      SELECT c.*
      FROM user_schedules us
      JOIN courses c ON c.id = us.course_id
      WHERE us.user_id = ? AND c.semester = ?
    `)
    .all(req.user.id, course.semester);

  const conflict = current.find(
    (c) => c.id !== course.id && c.weekday === course.weekday && (c.period_mask & course.period_mask) > 0
  );
  if (conflict) {
    return res.status(409).json({
      error: `與已預排課程「${conflict.name_zh}」衝堂（週${conflict.weekday} 第 ${conflict.periods} 節）`
    });
  }

  const alreadyScheduled = current.some((c) => c.id === course.id);
  const plannedCredits = current.reduce((total, c) => total + Number(c.credits || 0), 0);
  if (!alreadyScheduled && plannedCredits + Number(course.credits || 0) > 25) {
    return res.status(400).json({ error: '本學期預排學分不可超過 25 學分' });
  }

  db.prepare('INSERT OR IGNORE INTO user_schedules (user_id, course_id) VALUES (?, ?)').run(req.user.id, courseId);
  return res.status(201).json({ added: true, course });
});

router.delete('/:courseId', requireAuth, (req, res) => {
  const courseId = Number.parseInt(req.params.courseId, 10);
  db.prepare('DELETE FROM user_schedules WHERE user_id = ? AND course_id = ?').run(req.user.id, courseId);
  return res.json({ removed: true });
});

router.post('/share', requireAuth, (req, res) => {
  const semester = String(req.body?.semester || '1151').trim();
  const rows = db
    .prepare(`
      SELECT c.id
      FROM user_schedules us
      JOIN courses c ON c.id = us.course_id
      WHERE us.user_id = ? AND c.semester = ?
    `)
    .all(req.user.id, semester);

  const courseIds = rows.map((r) => r.id);
  const token = crypto.randomBytes(6).toString('hex');

  // Store only course IDs & semester — zero personal data (PII-free sharing)
  db.prepare('INSERT INTO shared_schedules (token, semester, course_ids) VALUES (?, ?, ?)').run(
    token,
    semester,
    JSON.stringify(courseIds)
  );

  return res.status(201).json({ token });
});

router.get('/shared/:token', (req, res) => {
  const token = String(req.params.token || '').trim();
  const record = db.prepare('SELECT * FROM shared_schedules WHERE token = ?').get(token);
  if (!record) return res.status(404).json({ error: '找不到分享的課表連結' });

  let ids = [];
  try {
    ids = JSON.parse(record.course_ids || '[]').filter((n) => Number.isInteger(n));
  } catch {
    ids = [];
  }

  if (ids.length === 0) {
    return res.json({ semester: record.semester, items: [] });
  }

  const placeholders = ids.map(() => '?').join(',');
  const items = db.prepare(`SELECT * FROM courses WHERE id IN (${placeholders})`).all(...ids);
  return res.json({ semester: record.semester, items });
});

export default router;
