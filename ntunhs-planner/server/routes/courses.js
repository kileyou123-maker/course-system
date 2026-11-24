import express from 'express';
import { db, computePeriodMask } from '../db.js';
import { optionalAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

function parseCredits(value, fallback = 2) {
  const credits = Number.parseInt(value, 10);
  return Number.isNaN(credits) ? fallback : credits;
}

function attachCourseDetails(courses, user) {
  const progStmt = db.prepare(`
    SELECT p.code, p.name, p.name_en
    FROM programs p
    JOIN course_programs cp ON cp.program_id = p.id
    WHERE cp.course_id = ?
  `);
  const teacherStmt = db.prepare('SELECT * FROM teachers WHERE name = ?');

  let userRow = null;
  let completed = [];
  if (user?.id) {
    userRow = db.prepare('SELECT grade, completed_courses FROM users WHERE id = ?').get(user.id);
    if (userRow) {
      try {
        completed = JSON.parse(userRow.completed_courses || '[]');
      } catch {
        completed = [];
      }
    }
  }

  return courses.map((c) => {
    const programs = progStmt.all(c.id);
    const teacher = teacherStmt.get(c.teacher_name) || null;

    let eligible = true;
    let reasonZh = null;
    let reasonEn = null;

    if (userRow) {
      if (userRow.grade < c.min_grade) {
        eligible = false;
        reasonZh = c.restriction_note_zh || `不符修課資格：本課程僅限 ${c.min_grade} 年級以上學生修習`;
        reasonEn = c.restriction_note_en || `Ineligible: Restricted to Year ${c.min_grade}+ students`;
      } else if (c.prerequisite_code && !completed.includes(c.prerequisite_code)) {
        eligible = false;
        reasonZh = c.restriction_note_zh || `不符修課資格：需先修畢先修科目 (${c.prerequisite_code})`;
        reasonEn = c.restriction_note_en || `Ineligible: Prerequisite (${c.prerequisite_code}) required`;
      }
    }

    return {
      ...c,
      programs,
      teacher,
      eligibility: {
        eligible,
        reason_zh: reasonZh,
        reason_en: reasonEn
      }
    };
  });
}

router.get('/meta', (_req, res) => {
  const semesters = db.prepare('SELECT DISTINCT semester FROM courses ORDER BY semester DESC').all().map((r) => r.semester);
  const departments = db.prepare('SELECT DISTINCT department FROM courses ORDER BY department').all().map((r) => r.department);
  const categories = db.prepare('SELECT DISTINCT category FROM courses ORDER BY category').all().map((r) => r.category);
  const programs = db.prepare('SELECT id, code, name, name_en, required_credits FROM programs ORDER BY id').all();
  res.json({ semesters, departments, categories, programs });
});

router.get('/', optionalAuth, (req, res) => {
  const semester = String(req.query.semester || '').trim();
  const department = String(req.query.department || '').trim();
  const category = String(req.query.category || '').trim();
  const grade = Number.parseInt(req.query.grade, 10);
  const tag = String(req.query.tag || '').trim();
  const program = String(req.query.program || '').trim();
  const weekday = Number.parseInt(req.query.weekday, 10);
  const periods = String(req.query.periods || '').trim();
  const matchMode = req.query.matchMode === 'flexible' ? 'flexible' : 'strict';
  const keyword = String(req.query.keyword || '').trim();
  const hideConflicts = req.query.hideConflicts === 'true';
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 50);

  const where = [];
  const params = [];

  if (semester && semester !== 'ALL') {
    where.push('c.semester = ?');
    params.push(semester);
  }
  if (department && department !== 'ALL') {
    where.push('c.department = ?');
    params.push(department);
  }
  if (category && category !== 'ALL') {
    where.push('c.category = ?');
    params.push(category);
  }
  if (Number.isInteger(grade) && grade >= 1 && grade <= 7) {
    where.push('c.grade = ?');
    params.push(grade);
  }
  if (tag && tag !== 'ALL') {
    where.push('c.tags LIKE ?');
    params.push(`%${tag}%`);
  }
  if (Number.isInteger(weekday) && weekday >= 1 && weekday <= 7) {
    where.push('c.weekday = ?');
    params.push(weekday);
  }
  if (periods) {
    const queryMask = computePeriodMask(periods);
    if (queryMask > 0) {
      if (matchMode === 'strict') {
        // Every period of the course must fall inside the selected period mask
        where.push('(c.period_mask & ?) = c.period_mask AND c.period_mask > 0');
        params.push(queryMask);
      } else {
        // Overlaps with at least one selected period
        where.push('(c.period_mask & ?) > 0');
        params.push(queryMask);
      }
    }
  }
  if (keyword) {
    const like = `%${keyword}%`;
    where.push('(c.name_zh LIKE ? OR c.name_en LIKE ? OR c.code LIKE ? OR c.teacher_name LIKE ? OR c.teacher_en LIKE ?)');
    params.push(like, like, like, like, like);
  }
  if (program && program !== 'ALL') {
    where.push(`EXISTS (
      SELECT 1 FROM course_programs cp
      JOIN programs p ON p.id = cp.program_id
      WHERE cp.course_id = c.id AND p.code = ?
    )`);
    params.push(program);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const allRows = db.prepare(`SELECT c.* FROM courses c ${whereClause} ORDER BY c.id ASC`).all(...params);

  let filteredRows = allRows;
  if (hideConflicts && req.user?.id) {
    const scheduled = db
      .prepare(`
        SELECT c.id, c.semester, c.weekday, c.period_mask
        FROM user_schedules us
        JOIN courses c ON c.id = us.course_id
        WHERE us.user_id = ?
      `)
      .all(req.user.id);

    filteredRows = allRows.filter((course) => {
      return !scheduled.some(
        (s) => s.id !== course.id && s.semester === course.semester && s.weekday === course.weekday && (s.period_mask & course.period_mask) > 0
      );
    });
  }

  const total = filteredRows.length;
  const offset = (page - 1) * limit;
  const paged = filteredRows.slice(offset, offset + limit);

  res.json({
    items: attachCourseDetails(paged, req.user),
    total,
    page,
    limit,
    totalPages: Math.max(Math.ceil(total / limit), 1)
  });
});

router.post('/', requireAdmin, (req, res) => {
  const b = req.body || {};
  const code = String(b.code || '').trim();
  const semester = String(b.semester || '1151').trim();
  const department = String(b.department || '資訊管理系 (22140)').trim();
  const nameZh = String(b.name_zh || '').trim();
  const nameEn = String(b.name_en || nameZh).trim();
  const credits = parseCredits(b.credits);
  const category = String(b.category || '專業選修(系所)').trim();
  const teacherName = String(b.teacher_name || '').trim();
  const teacherEn = String(b.teacher_en || teacherName).trim();
  const weekday = Number.parseInt(b.weekday, 10) || 1;
  const periods = String(b.periods || '1,2').trim();
  const room = String(b.room || 'F601').trim();

  if (!code || !nameZh || !teacherName) {
    return res.status(400).json({ error: '課程代碼、中文課名與授課教師為必填欄位' });
  }

  const existing = db.prepare('SELECT id FROM courses WHERE code = ?').get(code);
  if (existing) {
    return res.status(409).json({ error: '課程代碼已存在' });
  }

  const info = db
    .prepare(`
      INSERT INTO courses (
        code, semester, department, grade, name_zh, name_en, credits, category,
        teacher_name, teacher_en, weekday, periods, period_mask, room,
        enrolled, capacity, min_grade, restriction_note_zh, exemption_note_zh, syllabus_summary_zh
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      code,
      semester,
      department,
      Number.parseInt(b.grade, 10) || 1,
      nameZh,
      nameEn,
      credits,
      category,
      teacherName,
      teacherEn,
      weekday,
      periods,
      computePeriodMask(periods),
      room,
      Number.parseInt(b.enrolled, 10) || 0,
      Number.parseInt(b.capacity, 10) || 50,
      Number.parseInt(b.min_grade, 10) || 1,
      b.restriction_note_zh || null,
      b.exemption_note_zh || null,
      b.syllabus_summary_zh || null
    );

  const created = db.prepare('SELECT * FROM courses WHERE id = ?').get(info.lastInsertRowid);
  return res.status(201).json({ item: created });
});

router.put('/:id', requireAdmin, (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const existing = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: '找不到課程' });

  const b = req.body || {};
  const periods = b.periods !== undefined ? String(b.periods).trim() : existing.periods;
  db.prepare(`
    UPDATE courses SET
      name_zh = ?, name_en = ?, credits = ?, category = ?,
      teacher_name = ?, weekday = ?, periods = ?, period_mask = ?, room = ?,
      min_grade = ?, restriction_note_zh = ?
    WHERE id = ?
  `).run(
    b.name_zh ?? existing.name_zh,
    b.name_en ?? existing.name_en,
    parseCredits(b.credits, existing.credits),
    b.category ?? existing.category,
    b.teacher_name ?? existing.teacher_name,
    Number.parseInt(b.weekday, 10) || existing.weekday,
    periods,
    computePeriodMask(periods),
    b.room ?? existing.room,
    Number.parseInt(b.min_grade, 10) || existing.min_grade,
    b.restriction_note_zh !== undefined ? b.restriction_note_zh : existing.restriction_note_zh,
    id
  );

  const updated = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
  return res.json({ item: updated });
});

router.delete('/:id', requireAdmin, (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const info = db.prepare('DELETE FROM courses WHERE id = ?').run(id);
  if (info.changes === 0) return res.status(404).json({ error: '找不到課程' });
  return res.json({ deleted: true });
});

router.post('/import', requireAdmin, (req, res) => {
  const items = Array.isArray(req.body?.courses) ? req.body.courses : [];
  if (items.length === 0) {
    return res.status(400).json({ error: '請提供要匯入的課程陣列 (courses)' });
  }

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO courses (
      code, semester, department, grade, name_zh, name_en, credits, category,
      teacher_name, teacher_en, weekday, periods, period_mask, room, min_grade
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let inserted = 0;
  for (const item of items) {
    if (!item.code || !item.name_zh || !item.teacher_name) continue;
    const periods = String(item.periods || '1,2');
    const info = stmt.run(
      String(item.code).trim(),
      String(item.semester || '1151').trim(),
      String(item.department || '資訊管理系 (22140)').trim(),
      Number.parseInt(item.grade, 10) || 1,
      String(item.name_zh).trim(),
      String(item.name_en || item.name_zh).trim(),
      parseCredits(item.credits),
      String(item.category || '專業選修(系所)').trim(),
      String(item.teacher_name).trim(),
      String(item.teacher_en || item.teacher_name).trim(),
      Number.parseInt(item.weekday, 10) || 1,
      periods,
      computePeriodMask(periods),
      String(item.room || 'F601').trim(),
      Number.parseInt(item.min_grade, 10) || 1
    );
    inserted += info.changes;
  }

  return res.json({ inserted, totalSubmitted: items.length });
});

export default router;
