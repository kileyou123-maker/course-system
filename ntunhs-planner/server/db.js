import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import 'dotenv/config';
import { DatabaseSync } from 'node:sqlite';
import { seed1151Catalog } from './seed_1151.js';

const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(process.cwd(), 'server', 'data');
const dbPath = process.env.DB_PATH === ':memory:'
  ? ':memory:'
  : process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.join(dataDir, 'courses.db');
if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(dbPath), { recursive: true });
export const db = new DatabaseSync(dbPath);

/**
 * Compute a 14-bit bitmask from an array or comma-separated string of periods (1..14).
 */
export function computePeriodMask(periods) {
  const list = Array.isArray(periods)
    ? periods
    : String(periods || '')
        .split(',')
        .map((s) => Number.parseInt(s.trim(), 10))
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= 14);

  let mask = 0;
  for (const p of list) {
    mask |= 1 << (p - 1);
  }
  return mask;
}

/**
 * Hash a password using Node.js built-in scrypt with a random 16-byte salt.
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

/**
 * Verify a password against a stored scrypt hash using timing-safe comparison.
 */
export function verifyPassword(password, storedHash) {
  const parts = String(storedHash || '').split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

export function initDatabase() {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      name TEXT NOT NULL,
      department TEXT NOT NULL,
      grade INTEGER NOT NULL DEFAULT 3,
      completed_courses TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      name_en TEXT NOT NULL,
      title TEXT NOT NULL,
      department TEXT NOT NULL,
      email TEXT NOT NULL,
      ext TEXT NOT NULL,
      expertise TEXT NOT NULL,
      lab TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      name_en TEXT NOT NULL,
      required_credits INTEGER NOT NULL DEFAULT 15
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      semester TEXT NOT NULL,
      department TEXT NOT NULL,
      grade INTEGER NOT NULL DEFAULT 1,
      name_zh TEXT NOT NULL,
      name_en TEXT NOT NULL,
      credits INTEGER NOT NULL DEFAULT 2,
      category TEXT NOT NULL,
      teacher_name TEXT NOT NULL,
      teacher_en TEXT NOT NULL,
      weekday INTEGER NOT NULL,
      periods TEXT NOT NULL,
      period_mask INTEGER NOT NULL,
      room TEXT NOT NULL,
      enrolled INTEGER NOT NULL DEFAULT 0,
      capacity INTEGER NOT NULL DEFAULT 50,
      min_grade INTEGER NOT NULL DEFAULT 1,
      prerequisite_code TEXT,
      restriction_note_zh TEXT,
      restriction_note_en TEXT,
      exemption_note_zh TEXT,
      exemption_note_en TEXT,
      syllabus_summary_zh TEXT,
      syllabus_summary_en TEXT
    );

    CREATE TABLE IF NOT EXISTS course_programs (
      course_id INTEGER NOT NULL,
      program_id INTEGER NOT NULL,
      PRIMARY KEY (course_id, program_id),
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (user_id, course_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS shared_schedules (
      token TEXT PRIMARY KEY,
      semester TEXT NOT NULL,
      course_ids TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  seedInitialData();
  seed1151Catalog(db);
  seedCourseHistory();
}

function seedCourseHistory() {
  const historyPath = path.resolve(process.cwd(), 'server', 'seed_history.json');
  if (!fs.existsSync(historyPath)) return;

  try {
    const raw = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    const courseCnt = db.prepare('SELECT COUNT(*) AS cnt FROM courses').get().cnt;
    if (courseCnt < 100 && Array.isArray(raw.courses)) {
      const insertCourse = db.prepare(`
        INSERT OR IGNORE INTO courses (
          code, semester, department, grade, name_zh, name_en, credits, category,
          teacher_name, teacher_en, weekday, periods, period_mask, room,
          enrolled, capacity, min_grade, restriction_note_zh, syllabus_summary_zh, tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      db.exec('BEGIN');
      for (const c of raw.courses) {
        insertCourse.run(
          c.code, c.semester, c.department, c.grade, c.name_zh, c.name_en, c.credits, c.category,
          c.teacher_name, c.teacher_en, c.weekday, c.periods, computePeriodMask(c.periods), c.room,
          c.enrolled || 0, c.capacity || 50, c.min_grade || 1, c.restriction_note_zh || null,
          c.syllabus_summary_zh || null, c.tags || ''
        );
      }
      db.exec('COMMIT');
    }

  } catch (err) {
    console.warn('seedCourseHistory skipped:', err.message);
  }
}

function seedInitialData() {
  const userCount = db.prepare('SELECT COUNT(*) AS cnt FROM users').get().cnt;
  if (userCount === 0) {
    const studentPwd = process.env.DEMO_STUDENT_PASSWORD || 'StudentDemo@2026';
    const adminPwd = process.env.DEMO_ADMIN_PASSWORD || 'AdminDemo@2026';

    const insertUser = db.prepare(`
      INSERT INTO users (username, password_hash, role, name, department, grade, completed_courses)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertUser.run(
      'student01',
      hashPassword(studentPwd),
      'student',
      '王小明 (UC02)',
      '資訊管理系 (22140)',
      3,
      JSON.stringify(['0059', '0124', '0075'])
    );
    insertUser.run(
      'admin01',
      hashPassword(adminPwd),
      'admin',
      '教務處管理員',
      '教務處',
      1,
      JSON.stringify([])
    );
  }

  const programCount = db.prepare('SELECT COUNT(*) AS cnt FROM programs').get().cnt;
  if (programCount === 0) {
    const insertProg = db.prepare(
      'INSERT INTO programs (code, name, name_en, required_credits) VALUES (?, ?, ?, ?)'
    );
    insertProg.run('MED_INFO', '醫療資訊學程', 'Medical Informatics Program', 15);
    insertProg.run('AI_APP', '人工智慧應用學程', 'AI Application Program', 15);
    insertProg.run('HEALTH_DATA', '健康大數據學程', 'Health Big Data Program', 12);
  }

  const teacherCount = db.prepare('SELECT COUNT(*) AS cnt FROM teachers').get().cnt;
  if (teacherCount === 0) {
    const insertTeacher = db.prepare(`
      INSERT INTO teachers (name, name_en, title, department, email, ext, expertise, lab)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const teachers = [
      ['連中岳', 'CHUNG-YUEH LIEN', '副教授', '資訊管理系', 'cylien@ntunhs.edu.tw', '1234', '系統分析與設計、醫療資訊標準(HL7/FHIR)、軟體工程', '醫療資訊系統實驗室'],
      ['郭振宗', 'CHEN-TSUNG KUO', '助理教授', '資訊管理系', 'ctkuo@ntunhs.edu.tw', '1235', '健康政策與策略、健康照護管理資訊', '智慧健康管理實驗室'],
      ['蔡維河', 'WEI-HO TSAI', '教授', '資訊管理系', 'whtsai@ntunhs.edu.tw', '1236', '軟體專案管理、人工智慧與語音訊號處理', '智慧計算實驗室'],
      ['謝翠娟', 'TSUI-CHUAN HSIEH', '兼任講師', '資訊管理系', 'tchsieh@ntunhs.edu.tw', '1237', '資訊法規、個人資料保護法與醫療隱私權', '法規與倫理研究室'],
      ['蔡坤孝', 'KUN-HSIAO TSAI', '副教授', '資訊管理系', 'khtsai@ntunhs.edu.tw', '1238', '網路程式設計、資訊安全、雲端架構', '網路與資安實驗室'],
      ['徐建業', 'CHIEN-YEH HSU', '終身特聘教授', '資訊管理系', 'cyhsu@ntunhs.edu.tw', '1226', '數位信號處理、生物醫學資訊、健康管理雲端應用', '健康雲端數據模擬分析實驗室'],
      ['陳宏亮', 'HUNG-LIANG CHEN', '副教授', '資訊管理系', 'hlchen@ntunhs.edu.tw', '1240', 'SAS統計分析、健康大數據探勘、資料庫系統', '資料科學實驗室'],
      ['楊岳', 'YUEH YANG', '助理教授', '資訊管理系', 'yyang@ntunhs.edu.tw', '1241', '資訊科技創新應用、生成式AI應用開發', '創新應用實驗室'],
      ['陳巧珊', 'CHIAO-SHAN CHEN', '副教授', '資訊管理系', 'cschen@ntunhs.edu.tw', '1242', '物件導向程式設計、AI程式開發、企業管理', '智慧系統實驗室'],
      ['祝國忠', 'KUO-CHUNG CHU', '教授', '資訊管理系', 'kcchu@ntunhs.edu.tw', '1243', '資訊管理、決策支援系統', '決策支援實驗室']
    ];
    for (const t of teachers) insertTeacher.run(...t);
  }

  const courseCount = db.prepare('SELECT COUNT(*) AS cnt FROM courses').get().cnt;
  if (courseCount === 0) {
    const insertCourse = db.prepare(`
      INSERT INTO courses (
        code, semester, department, grade, name_zh, name_en, credits, category,
        teacher_name, teacher_en, weekday, periods, period_mask, room,
        enrolled, capacity, min_grade, prerequisite_code,
        restriction_note_zh, restriction_note_en,
        exemption_note_zh, exemption_note_en,
        syllabus_summary_zh, syllabus_summary_en
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const seedCourses = [
      [
        '221400132013A0', '1151', '資訊管理系 (22140)', 3,
        '系統分析與設計', 'System Analysis and Design', 3, '專業必修(系所)',
        '連中岳', 'CHUNG-YUEH LIEN', 2, '5,6,7', computePeriodMask([5, 6, 7]), 'F601',
        42, 50, 3, null,
        '限本系四技三年級以上修習', 'Restricted to 3rd-year+ IM students',
        null, null,
        '涵蓋軟體開發生命週期(SDLC)、需求訪談、UML活動圖/類別圖/物件圖實作與系統原型設計。',
        'Covers SDLC, requirement analysis, UML diagrams, and system prototyping.'
      ],
      [
        '22140007401330', '1151', '資訊管理系 (22140)', 3,
        '健康政策與策略', 'Health Policy and Strategy', 2, '專業選修(系所)',
        '郭振宗', 'CHEN-TSUNG KUO', 1, '9,10', computePeriodMask([9, 10]), 'G202',
        36, 45, 2, null,
        '大二以上可修習', 'Open to 2nd-year+ students',
        null, null,
        '探討台灣健保制度、數位健康政策與醫療機構策略規劃。',
        'Explores national health policy, digital health strategy, and hospital management.'
      ],
      [
        '22140010001331', '1151', '資訊管理系 (22140)', 3,
        '專案管理', 'Project Management', 3, '專業選修(系所)',
        '蔡維河', 'WEI-HO TSAI', 1, '2,3,4', computePeriodMask([2, 3, 4]), 'G201',
        52, 60, 2, null,
        '建議具備基礎軟體開發經驗', 'Recommended basic software development background',
        '持有 PMP 或 CAPM 國際證照者可申請學分抵免', 'Eligible for credit exemption with PMP/CAPM certification',
        '介紹專案範疇、時程、成本、風險與敏捷開發(Scrum)實務。',
        'Covers project scope, schedule, cost, risk management, and Scrum.'
      ],
      [
        '22140023601332', '1151', '資訊管理系 (22140)', 3,
        '資訊與法律', 'Information and Law', 2, '專業選修(系所)',
        '謝翠娟', 'TSUI-CHUAN HSIEH', 3, '9,10', computePeriodMask([9, 10]), 'F607',
        50, 55, 1, null,
        '無特殊修課限制，開放跨系選修', 'Open to all departments',
        null, null,
        '探討個資法、資通安全管理法、智慧財產權與醫療資料隱私規範。',
        'Covers Personal Data Protection Act, Cybersecurity Act, IP, and medical privacy.'
      ],
      [
        '22140119901333', '1151', '資訊管理系 (22140)', 3,
        '進階網路程式設計', 'Advanced Web Programming', 3, '專業選修(系所)',
        '蔡坤孝', 'KUN-HSIAO TSAI', 1, '5,6,7', computePeriodMask([5, 6, 7]), 'F601',
        21, 45, 2, '0124',
        '需先修過「程式設計」課程', 'Prerequisite: Introduction to Programming',
        null, null,
        '前後端分離架構、RESTful API 設計、安全驗證與雲端部署實務。',
        'Full-stack architecture, RESTful APIs, authentication, and cloud deployment.'
      ],
      [
        '22140126201334', '1151', '資訊管理系 (22140)', 3,
        'SAS基礎資料處理', 'SAS Base Data Processing', 3, '專業選修(系所)',
        '陳宏亮', 'HUNG-LIANG CHEN', 3, '1,2,3', computePeriodMask([1, 2, 3]), 'F601',
        59, 60, 2, null,
        '大二以上可修習', 'Open to 2nd-year+ students',
        '持有 SAS Base Programmer 證照可申請抵免', 'Exemptible with SAS Base Programmer certification',
        '使用 SAS 進行健康醫療資料庫清理、轉換與基礎統計分析。',
        'Data cleaning, transformation, and statistical analysis with SAS.'
      ],
      [
        '22140158701335', '1151', '資訊管理系 (22140)', 3,
        '資訊科技創新應用管理', 'IT Innovation and Application Management', 3, '專業選修(系所)',
        '楊岳', 'YUEH YANG', 2, '2,3,4', computePeriodMask([2, 3, 4]), 'G303',
        28, 45, 2, null,
        '無特殊限制', 'No prerequisites',
        null, null,
        '結合 AI 工具與設計思考，打造智慧健康創新應用原型。',
        'Combines AI tools and design thinking to prototype smart health applications.'
      ],
      [
        '221409999014AD', '1151', '資訊管理系 (22140)', 4,
        '畢業專題實務研討', 'Senior Capstone Project Seminar', 2, '專業必修(系所)',
        '徐建業', 'CHIEN-YEH HSU', 2, '6,7', computePeriodMask([6, 7]), 'F602',
        35, 45, 4, null,
        '不符修課資格：本課程僅限四年級學生修習', 'Ineligible: Restricted to 4th-year students only',
        null, null,
        '整合四年所學完成跨領域實務專題開發與成果發表。',
        'Capstone seminar integrating four years of coursework into a practical project.'
      ],
      [
        '221400125012B0', '1151', '資訊管理系 (22140)', 2,
        '人工智慧程式設計', 'AI & Object-Oriented Programming', 3, '專業必修(系所)',
        '陳巧珊', 'CHIAO-SHAN CHEN', 5, '8,9,10', computePeriodMask([8, 9, 10]), 'F601',
        42, 50, 2, null,
        '大二以上可修習', 'Open to 2nd-year+ students',
        null, null,
        '物件導向程式設計與機器學習基礎模型實作。',
        'Object-oriented programming and foundational machine learning implementation.'
      ],
      [
        '100000030011A0', '1151', '通識教育中心 (10000)', 1,
        '當代藝術導論', 'Introduction to Contemporary Art', 2, '通識必修(通識)',
        '祝國忠', 'KUO-CHUNG CHU', 3, '6,7', computePeriodMask([6, 7]), 'F412',
        44, 50, 1, null,
        '全校四技各年級皆可選修', 'Open to all undergraduate students',
        null, null,
        '培養藝術鑑賞能力與當代視覺文化思辨。',
        'Develops art appreciation and critical thinking in contemporary visual culture.'
      ],
      [
        '100000101011A1', '1151', '通識教育中心 (10000)', 1,
        '實用大學英文', 'Practical College English', 2, '通識必修(通識)',
        '陳巧珊', 'CHIAO-SHAN CHEN', 4, '3,4', computePeriodMask([3, 4]), 'B210',
        38, 45, 1, null,
        '依學院分班選課', 'Grouped by college',
        '多益 (TOEIC) 達 600 分以上或全民英檢中級複試通過可申請抵免', 'Exemptible with TOEIC 600+ or GEPT Intermediate',
        '強化職場英文閱讀、簡報與跨文化溝通能力。',
        'Enhances workplace English reading, presentation, and communication skills.'
      ],
      [
        '221400132013B0', '1142', '資訊管理系 (22140)', 3,
        '系統分析與設計 (114-2)', 'System Analysis and Design (114-2)', 3, '專業必修(系所)',
        '連中岳', 'CHUNG-YUEH LIEN', 2, '8,9,10', computePeriodMask([8, 9, 10]), 'F601',
        45, 50, 3, null,
        '限本系三年級以上', '3rd-year+ IM students',
        null, null,
        '114學年度第2學期開課資料範例。',
        'Sample course record from semester 114-2.'
      ]
    ];

    for (const c of seedCourses) insertCourse.run(...c);

    // Map courses to programs
    const medId = db.prepare("SELECT id FROM programs WHERE code = 'MED_INFO'").get().id;
    const aiId = db.prepare("SELECT id FROM programs WHERE code = 'AI_APP'").get().id;
    const dataId = db.prepare("SELECT id FROM programs WHERE code = 'HEALTH_DATA'").get().id;
    const getCourseId = (code) => db.prepare('SELECT id FROM courses WHERE code = ?').get(code)?.id;

    const mapProg = db.prepare('INSERT OR IGNORE INTO course_programs (course_id, program_id) VALUES (?, ?)');
    const mappings = [
      ['221400132013A0', medId],
      ['22140007401330', medId],
      ['22140010001331', aiId],
      ['22140119901333', aiId],
      ['22140126201334', medId],
      ['22140126201334', dataId],
      ['22140158701335', aiId],
      ['221409999014AD', medId],
      ['221400125012B0', aiId]
    ];
    for (const [code, pid] of mappings) {
      const cid = getCourseId(code);
      if (cid) mapProg.run(cid, pid);
    }

    // Pre-populate 2 courses in student01's schedule to match the Figma prototype (系統分析與設計 + 健康政策與策略 = 5學分)
    const student = db.prepare("SELECT id FROM users WHERE username = 'student01'").get();
    if (student) {
      const addSched = db.prepare('INSERT OR IGNORE INTO user_schedules (user_id, course_id) VALUES (?, ?)');
      const c1 = getCourseId('221400132013A0');
      const c2 = getCourseId('22140007401330');
      if (c1) addSched.run(student.id, c1);
      if (c2) addSched.run(student.id, c2);
    }
  }
}
