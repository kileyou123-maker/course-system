import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const root = fileURLToPath(new URL('..', import.meta.url));
const password = randomBytes(18).toString('hex');
const runId = randomBytes(5).toString('hex');
let directory, child, origin, adminToken;
let counter = 0;

async function request(route, { token, method = 'GET', body } = {}) {
  const response = await fetch(`${origin}/api${route}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  return { status: response.status, data: await response.json() };
}

async function student(grade = 3) {
  const response = await request('/auth/register', {
    method: 'POST',
    body: { username: `test-${runId}-${++counter}`, password, name: '測試學生', grade }
  });
  assert.equal(response.status, 201);
  return response.data.token;
}

async function course(overrides = {}) {
  const response = await request('/courses', {
    token: adminToken, method: 'POST', body: {
      code: `test-${runId}-${++counter}`, name_zh: '測試課程', teacher_name: '測試教師',
      semester: '9991', credits: 2, weekday: 1, periods: '1', min_grade: 1,
      ...overrides
    }
  });
  assert.equal(response.status, 201, JSON.stringify(response.data));
  return response.data.item;
}

before(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'ntunhs-api-'));
  const port = await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const chosen = server.address().port;
      server.close(() => resolve(chosen));
    });
  });
  origin = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, ['server/index.js', '--host', '127.0.0.1', '--port', String(port)], {
    cwd: root,
    env: {
      ...process.env, DB_PATH: path.join(directory, 'isolated', 'courses.db'),
      NODE_ENV: 'production', CLIENT_ORIGIN: 'https://kileyou123-maker.github.io', JWT_SECRET: randomBytes(32).toString('hex'),
      DEMO_STUDENT_PASSWORD: password, DEMO_ADMIN_PASSWORD: password
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Isolated API server did not start')), 15000);
    child.once('exit', (code) => { clearTimeout(timer); reject(new Error(`API server exited before startup (${code})`)); });
    child.stdout.on('data', (data) => {
      if (data.toString().includes('server running')) { clearTimeout(timer); resolve(); }
    });
    child.stderr.on('data', () => {});
  });
  assert.equal((await request('/health')).status, 200);
  const login = await request('/auth/login', { method: 'POST', body: { username: 'admin01', password } });
  assert.equal(login.status, 200);
  adminToken = login.data.token;
});

after(async () => {
  if (child && child.exitCode === null) {
    await new Promise((resolve) => { child.once('exit', resolve); child.kill('SIGTERM'); });
  }
  if (directory) await rm(directory, { recursive: true, force: true });
});

test('CLI host/port and DB_PATH start an isolated catalog with only generic demo accounts', async () => {
  const dbFile = path.join(directory, 'isolated', 'courses.db');
  assert.ok((await stat(dbFile)).size > 0);
  const db = new DatabaseSync(dbFile, { readOnly: true });
  try {
    assert.deepEqual(db.prepare('SELECT username FROM users ORDER BY username').all().map((r) => r.username), ['admin01', 'student01']);
    assert.ok(db.prepare('SELECT COUNT(*) AS count FROM courses').get().count >= 2658);
  } finally { db.close(); }
  const seed = JSON.parse(await readFile(path.join(root, 'server/seed_history.json'), 'utf8'));
  assert.deepEqual(Object.keys(seed), ['courses']);
  const login = await request('/auth/login', { method: 'POST', body: { username: 'student01', password } });
  assert.equal(login.status, 200);
  assert.equal(login.data.user.role, 'student');
});

test('guest and student roles cannot perform administrator writes', async () => {
  assert.equal((await request('/schedule')).status, 401);
  assert.equal((await request('/schedule', { token: 'invalid-token' })).status, 401);
  assert.equal((await request('/courses', { method: 'POST', body: {} })).status, 401);
  const token = await student();
  assert.equal((await request('/courses', { token, method: 'POST', body: {} })).status, 403);
  assert.equal((await request('/courses/import', { token, method: 'POST', body: { courses: [] } })).status, 403);
});

test('same-time courses in different semesters are allowed and conflict filtering matches that rule', async () => {
  const token = await student();
  const prefix = `cross-${runId}`;
  const a = await course({ code: `${prefix}-a`, semester: '9901', weekday: 6, periods: '11,12' });
  const b = await course({ code: `${prefix}-b`, semester: '9902', weekday: 6, periods: '11,12' });
  const conflict = await course({ code: `${prefix}-conflict`, semester: '9901', weekday: 6, periods: '12,13' });
  const otherSemester = await course({ code: `${prefix}-available`, semester: '9903', weekday: 6, periods: '12,13' });
  for (const item of [a, b]) {
    assert.equal((await request('/schedule', { token, method: 'POST', body: { courseId: item.id } })).status, 201);
  }
  assert.equal((await request('/schedule', { token, method: 'POST', body: { courseId: conflict.id } })).status, 409);
  const result = await request(`/courses?semester=ALL&keyword=${prefix}&hideConflicts=true`, { token });
  const ids = result.data.items.map((item) => item.id);
  assert.ok(ids.includes(a.id));
  assert.ok(ids.includes(b.id));
  assert.ok(ids.includes(otherSemester.id));
  assert.ok(!ids.includes(conflict.id));
});

test('schedule writes enforce the prerequisite shown by course eligibility', async () => {
  const token = await student();
  const result = await request('/courses?semester=1151&keyword=22140119901333', { token });
  const advanced = result.data.items.find((item) => item.code === '22140119901333');
  assert.ok(advanced);
  assert.equal(advanced.eligibility.eligible, false);
  assert.equal((await request('/schedule', { token, method: 'POST', body: { courseId: advanced.id } })).status, 400);
  const completion = await request('/auth/completed-courses/toggle', {
    token, method: 'POST', body: { courseCode: advanced.prerequisite_code }
  });
  assert.equal(completion.status, 200);
  assert.equal((await request('/schedule', { token, method: 'POST', body: { courseId: advanced.id } })).status, 201);
  const lowYear = await student(1);
  assert.equal((await request('/schedule', { token: lowYear, method: 'POST', body: { courseId: advanced.id } })).status, 400);
});

test('25-credit cap is per semester and adding the same course is idempotent', async () => {
  const token = await student();
  const a = await course({ semester: '9911', credits: 20, periods: '1' });
  const b = await course({ semester: '9911', credits: 5, periods: '2' });
  const extra = await course({ semester: '9911', credits: 1, periods: '3' });
  const nextSemester = await course({ semester: '9912', credits: 20, periods: '1' });
  for (const item of [a, b, b, nextSemester]) {
    assert.equal((await request('/schedule', { token, method: 'POST', body: { courseId: item.id } })).status, 201);
  }
  const rejected = await request('/schedule', { token, method: 'POST', body: { courseId: extra.id } });
  assert.equal(rejected.status, 400);
  assert.match(rejected.data.error, /25/);
  const schedule = await request('/schedule', { token });
  assert.equal(schedule.data.items.filter((item) => item.semester === '9911').length, 2);
});

test('administrator create, update and JSON import preserve zero credits', async () => {
  const zero = await course({ credits: 0 });
  assert.equal(zero.credits, 0);
  const normal = await course({ credits: 3 });
  const updated = await request(`/courses/${normal.id}`, { token: adminToken, method: 'PUT', body: { credits: 0 } });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.item.credits, 0);
  const code = `import-${runId}`;
  const imported = await request('/courses/import', {
    token: adminToken, method: 'POST', body: { courses: [{ code, name_zh: '零學分測試', teacher_name: '測試教師', credits: 0 }] }
  });
  assert.equal(imported.status, 200);
  assert.equal(imported.data.inserted, 1);
  const result = await request(`/courses?keyword=${code}`);
  assert.equal(result.data.items[0].credits, 0);
});

test('schedules are account isolated and public shares contain only the selected semester', async () => {
  const first = await student();
  const second = await student();
  const a = await course({ semester: '9921', periods: '1' });
  const b = await course({ semester: '9922', periods: '1' });
  for (const item of [a, b]) await request('/schedule', { token: first, method: 'POST', body: { courseId: item.id } });
  assert.deepEqual((await request('/schedule', { token: second })).data.items, []);
  await request(`/schedule/${a.id}`, { token: second, method: 'DELETE' });
  assert.equal((await request('/schedule', { token: first })).data.items.length, 2);
  const share = await request('/schedule/share', { token: first, method: 'POST', body: { semester: '9921' } });
  assert.equal(share.status, 201);
  const shared = await request(`/schedule/shared/${share.data.token}`);
  assert.deepEqual(Object.keys(shared.data).sort(), ['items', 'semester']);
  assert.deepEqual(shared.data.items.map((item) => item.id), [a.id]);
});

 test('Pages backend CORS permits only the explicitly configured origin and required headers', async () => {
  const allowed=await fetch(`${origin}/api/health`,{headers:{Origin:'https://kileyou123-maker.github.io'}});
  assert.equal(allowed.headers.get('access-control-allow-origin'),'https://kileyou123-maker.github.io');
  const denied=await fetch(`${origin}/api/health`,{headers:{Origin:'https://untrusted.example'}});
  assert.equal(denied.headers.get('access-control-allow-origin'),null);
  const preflight=await fetch(`${origin}/api/schedule`,{method:'OPTIONS',headers:{Origin:'https://kileyou123-maker.github.io','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type'}});
  assert.equal(preflight.status,204);
  assert.match(preflight.headers.get('access-control-allow-headers'),/Authorization/);
});
