import fs from 'node:fs';
import path from 'node:path';
import XLSX from 'xlsx';
import { db, initDatabase, computePeriodMask } from './db.js';

const DEFAULT_DATA_DIR = path.resolve(process.cwd(), 'data');

const HEADER_ALIASES = {
  code: ['科目代碼(新碼全碼)', '課程代碼', '科目代碼', '課號', '選課代號', '課程全碼', '開課代碼', '全碼'],
  semester: ['學年期', '學期', '學年度學期', '開課學期'],
  department: ['開課系所', '系所名稱', '系所代碼', '系所', '開課單位', '科系', '系別'],
  grade: ['年級', '開課年級'],
  name_zh: ['科目中文名稱', '課程名稱', '科目名稱', '中文課名', '課名'],
  name_en: ['科目英文名稱', '英文課名', '英文名稱'],
  credits: ['學分數', '學分'],
  category: ['課別名稱', '課別', '必選修', '修別', '選別', '課程性質', '課別代碼'],
  teacher_name: ['授課教師姓名', '主開課教師姓名', '授課教師', '教師', '任課教師', '老師', '教師姓名'],
  weekday: ['上課星期', '星期', '週別'],
  periods: ['上課節次', '節次', '節'],
  time_combined: ['上課時間', '時間', '星期節次'],
  room: ['上課地點', '教室', '上課教室', '地點'],
  enrolled: ['上課人數', '選課人數', '已選人數', '修課人數'],
  capacity: ['人數上限', '限修人數', '名額', '上限人數'],
  restriction_note_zh: ['課表備註', '備註', '修課限制', '限制條件', '選課備註'],
  syllabus_summary_zh: ['課程中文摘要', '課程綱要', '教學大綱', '課程簡介', '教學計畫摘要'],
  tags: ['標籤', '屬性', '跨域', '課程屬性']
};

const DEPT_NAME_MAP = {
  '10000': '通識教育中心 (10000)',
  '11140': '護理系 (11140)',
  '13140': '高齡健康照護系 (13140)',
  '21140': '健康事業管理系 (21140)',
  '22140': '資訊管理系 (22140)',
  '23140': '休閒產業與健康促進系 (23140)',
  '25140': '語言治療與聽力學系 (25140)',
  '31140': '嬰幼兒保育系 (31140)',
  '32140': '運動保健系 (32140)',
  '33140': '生死與健康心理諮商系 (33140)',
  '41140': '跨領域學位學程 (41140)',
  '42140': '智慧健康照護跨領域學士學位學程 (42140)'
};

const WEEKDAY_MAP = {
  一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 7, 天: 7,
  '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7
};

function decodeHtmlEntities(str) {
  return String(str || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_m, dec) => String.fromCharCode(Number.parseInt(dec, 10)))
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isHtmlBuffer(buf) {
  const head = buf.subarray(0, 4096).toString('utf8').toLowerCase();
  return head.includes('<table') || head.includes('<html') || head.includes('<!doctype') || head.includes('<tr');
}

function decodeTextBuffer(buf) {
  let text = new TextDecoder('utf-8', { fatal: false }).decode(buf);
  const lower = text.slice(0, 1024).toLowerCase();
  if (lower.includes('charset=big5') || lower.includes('charset=ms950') || text.includes('\uFFFD')) {
    try {
      const big5Text = new TextDecoder('big5', { fatal: false }).decode(buf);
      const utf8Bad = (text.match(/\uFFFD/g) || []).length;
      const big5Bad = (big5Text.match(/\uFFFD/g) || []).length;
      if (big5Bad < utf8Bad || lower.includes('charset=big5') || lower.includes('charset=ms950')) {
        text = big5Text;
      }
    } catch {
      // Fallback to utf-8 if big5 decoder is unavailable
    }
  }
  return text;
}

function parseHtmlTableRows(html) {
  const rows = [];
  const trMatches = html.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) || [];
  for (const tr of trMatches) {
    const cells = [];
    const cellMatches = tr.match(/<t[dh]\b[^>]*>[\s\S]*?<\/t[dh]>/gi) || [];
    for (const cell of cellMatches) {
      cells.push(decodeHtmlEntities(cell));
    }
    if (cells.some((c) => c !== '')) {
      rows.push(cells);
    }
  }
  return rows;
}

function readSpreadsheetRows(filePath) {
  const buf = fs.readFileSync(filePath);
  if (isHtmlBuffer(buf)) {
    const html = decodeTextBuffer(buf);
    return parseHtmlTableRows(html);
  }

  const workbook = XLSX.read(buf, { type: 'buffer', codepage: 950 });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];
  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }).map((row) =>
    row.map((cell) => String(cell ?? '').trim())
  );
}

export function normalizeSemester(raw, fallback = '1151') {
  const s = String(raw || '').trim();
  if (!s) return fallback;

  // Match 114-2, 114_2, 114/2, 1142
  const compact = s.match(/(\d{3})\s*[-_/]?\s*([12])/);
  if (compact) return `${compact[1]}${compact[2]}`;

  // Match 114學年度第2學期 or 114學年第1學期
  const zh = s.match(/(\d{3})\s*學年(?:度)?\s*第?\s*([12])/);
  if (zh) return `${zh[1]}${zh[2]}`;

  return fallback;
}

function inferSemesterFromMetadata(rows, filePath) {
  for (let i = 0; i < Math.min(rows.length, 6); i++) {
    const line = rows[i].join(' ');
    const zh = line.match(/(\d{3})\s*學年(?:度)?\s*第?\s*([12])/);
    if (zh) return `${zh[1]}${zh[2]}`;
    const dash = line.match(/\b(\d{3})-([12])\b/);
    if (dash) return `${dash[1]}${dash[2]}`;
  }

  const base = path.basename(filePath, path.extname(filePath));
  const fnMatch = base.match(/(?:^|[^\d])(\d{3})[-_]?([12])(?:[^\d]|$)/);
  if (fnMatch) return `${fnMatch[1]}${fnMatch[2]}`;

  return '1151';
}

function normalizeDepartment(raw) {
  const s = String(raw || '').trim();
  if (!s) return '資訊管理系 (22140)';
  if (DEPT_NAME_MAP[s]) return DEPT_NAME_MAP[s];
  return s;
}

function normalizeCategory(raw) {
  const s = String(raw || '').trim();
  if (!s) return '專業選修(系所)';
  if (s === '1') return '通識必修(通識)';
  if (s === '3') return '專業必修(系所)';
  if (s === '5') return '通識選修(通識)';
  if (s === '7') return '專業選修(系所)';
  if (s.includes('通識') && s.includes('必')) return '通識必修(通識)';
  if (s.includes('通識')) return '通識選修(通識)';
  if (s.includes('必')) return '專業必修(系所)';
  if (s.includes('選')) return '專業選修(系所)';
  return s;
}

function parseWeekday(raw) {
  const s = String(raw || '').trim();
  for (const [key, val] of Object.entries(WEEKDAY_MAP)) {
    if (s.includes(key)) return val;
  }
  return 1;
}

function parsePeriods(raw) {
  const s = String(raw || '').trim();
  if (!s) return '1,2';

  // Handle range like 5-7 or 5~7
  const rangeMatch = s.match(/(\d{1,2})\s*[-~～]\s*(\d{1,2})/);
  if (rangeMatch) {
    const start = Number.parseInt(rangeMatch[1], 10);
    const end = Number.parseInt(rangeMatch[2], 10);
    if (start >= 1 && end >= start && end <= 14) {
      const list = [];
      for (let p = start; p <= end; p++) list.push(p);
      return list.join(',');
    }
  }

  const nums = (s.match(/\d{1,2}/g) || [])
    .map((n) => Number.parseInt(n, 10))
    .filter((n) => n >= 1 && n <= 14);

  if (nums.length > 0) {
    return [...new Set(nums)].join(',');
  }
  return '1,2';
}

function parseWeekdayAndPeriods(weekdayRaw, periodsRaw, timeCombinedRaw) {
  if (weekdayRaw || periodsRaw) {
    return {
      weekday: parseWeekday(weekdayRaw),
      periods: parsePeriods(periodsRaw)
    };
  }
  const combined = String(timeCombinedRaw || '').trim();
  const weekday = parseWeekday(combined);
  // Strip weekday indicator before parsing periods
  const cleaned = combined.replace(/星期[一二三四五六日天]|\([一二三四五六日天]\)|週[一二三四五六日天]|[一二三四五六日天]/g, ' ');
  return {
    weekday,
    periods: parsePeriods(cleaned)
  };
}

function parseGrade(raw) {
  const s = String(raw || '').trim();
  const num = s.match(/[1-7]/);
  if (num) return Number.parseInt(num[0], 10);
  if (s.includes('一')) return 1;
  if (s.includes('二')) return 2;
  if (s.includes('三')) return 3;
  if (s.includes('四')) return 4;
  return 1;
}

function findHeaderRow(rows) {
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i].map((c) => c.replace(/\s+/g, ''));
    const hasName = row.some((c) => HEADER_ALIASES.name_zh.some((a) => c.includes(a)));
    const hasCodeOrTeacher = row.some(
      (c) => HEADER_ALIASES.code.some((a) => c.includes(a)) || HEADER_ALIASES.teacher_name.some((a) => c.includes(a))
    );
    if (hasName && hasCodeOrTeacher) {
      const colIndex = {};
      for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
        let idx = -1;
        for (const alias of aliases) {
          idx = row.findIndex((c) => c === alias);
          if (idx !== -1) break;
        }
        if (idx === -1) {
          for (const alias of aliases) {
            idx = row.findIndex((c) => c.includes(alias));
            if (idx !== -1) break;
          }
        }
        if (idx !== -1) colIndex[field] = idx;
      }
      return { headerRowIdx: i, colIndex };
    }
  }
  return null;
}

export function importXlsDirectory(targetPath = DEFAULT_DATA_DIR) {
  initDatabase();

  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
    console.log(`已建立資料夾：${targetPath}`);
    console.log('請將歷年課程查詢 .xls / .xlsx / .csv 檔案放入此資料夾後再執行一次。');
    return { filesProcessed: 0, inserted: 0, skippedDuplicates: 0, skippedInvalid: 0 };
  }

  const stat = fs.statSync(targetPath);
  const files = stat.isDirectory()
    ? fs
        .readdirSync(targetPath)
        .filter((f) => /\.(xls|xlsx|csv)$/i.test(f) && !f.startsWith('~$'))
        .sort()
        .map((f) => path.join(targetPath, f))
    : [targetPath];

  if (files.length === 0) {
    console.log(`在 ${targetPath} 中找不到任何 .xls / .xlsx / .csv 檔案。`);
    return { filesProcessed: 0, inserted: 0, skippedDuplicates: 0, skippedInvalid: 0 };
  }

  const existingByCode = new Map();
  for (const row of db.prepare('SELECT code, semester FROM courses').all()) {
    existingByCode.set(row.code, row.semester);
  }

  const insertStmt = db.prepare(`
    INSERT INTO courses (
      code, semester, department, grade, name_zh, name_en, credits, category,
      teacher_name, teacher_en, weekday, periods, period_mask, room,
      enrolled, capacity, min_grade, restriction_note_zh, syllabus_summary_zh, tags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let totalInserted = 0;
  let totalDuplicates = 0;
  let totalInvalid = 0;

  db.exec('BEGIN');
  try {
    for (const filePath of files) {
      const rows = readSpreadsheetRows(filePath);
      const headerInfo = findHeaderRow(rows);
      if (!headerInfo) {
        console.warn(`[略過] ${path.basename(filePath)}：無法辨識欄位標題列`);
        continue;
      }

      const { headerRowIdx, colIndex } = headerInfo;
      const defaultSemester = inferSemesterFromMetadata(rows, filePath);
      let fileInserted = 0;
      let fileDuplicates = 0;

      for (let i = headerRowIdx + 1; i < rows.length; i++) {
        const r = rows[i];
        const get = (field) => (colIndex[field] !== undefined ? String(r[colIndex[field]] ?? '').trim() : '');

        const rawCode = get('code');
        const nameZh = get('name_zh');
        if (!rawCode || !nameZh) {
          if (r.some((c) => c !== '')) totalInvalid++;
          continue;
        }

        const semester = normalizeSemester(get('semester'), defaultSemester);
        let code = rawCode;

        // Deduplicate by course code: skip if same semester already exists, or suffix if another semester uses same code
        if (existingByCode.has(code)) {
          if (existingByCode.get(code) === semester) {
            fileDuplicates++;
            totalDuplicates++;
            continue;
          }
          code = `${rawCode}_${semester}`;
          if (existingByCode.has(code)) {
            fileDuplicates++;
            totalDuplicates++;
            continue;
          }
        }

        const { weekday, periods } = parseWeekdayAndPeriods(
          get('weekday'),
          get('periods'),
          get('time_combined')
        );
        const grade = parseGrade(get('grade'));
        const parsedCredits = Number.parseInt(get('credits'), 10);
        const credits = Number.isNaN(parsedCredits) ? 2 : parsedCredits;
        const enrolled = Number.parseInt(get('enrolled'), 10) || 0;
        const capacity = Number.parseInt(get('capacity'), 10) || 50;
        const department = normalizeDepartment(get('department'));
        const nameEn = get('name_en') || nameZh;
        const category = normalizeCategory(get('category'));
        const teacherName = get('teacher_name') || '未定';
        const room = get('room') || '未定';
        const restrictionNote = get('restriction_note_zh') || null;
        const syllabusNote = get('syllabus_summary_zh') || null;
        const tags = get('tags') || '';

        insertStmt.run(
          code,
          semester,
          department,
          grade,
          nameZh,
          nameEn,
          credits,
          category,
          teacherName,
          teacherName,
          weekday,
          periods,
          computePeriodMask(periods),
          room,
          enrolled,
          capacity,
          grade,
          restrictionNote,
          syllabusNote,
          tags
        );

        existingByCode.set(code, semester);
        fileInserted++;
        totalInserted++;
      }

      console.log(
        `[完成] ${path.basename(filePath)} (學期 ${defaultSemester})：新增 ${fileInserted} 筆，重複略過 ${fileDuplicates} 筆`
      );
    }

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  console.log(
    `匯入總結：處理 ${files.length} 個檔案，共新增 ${totalInserted} 筆課程，過濾重複課號 ${totalDuplicates} 筆，略過空白/無效列 ${totalInvalid} 筆。`
  );
  return {
    filesProcessed: files.length,
    inserted: totalInserted,
    skippedDuplicates: totalDuplicates,
    skippedInvalid: totalInvalid
  };
}

// Run directly from CLI
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.url.replace(/^file:\/\/\//, '').replace(/\//g, path.sep));
if (isMain || process.argv[1]?.endsWith('import_xls.js')) {
  const argPath = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : DEFAULT_DATA_DIR;
  importXlsDirectory(argPath);
}
