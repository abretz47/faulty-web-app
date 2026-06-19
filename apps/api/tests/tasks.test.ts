import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';
import { db, initSchema } from '../src/db.js';
import { signToken } from '../src/middleware/auth.js';

beforeAll(() => {
  initSchema();
});

afterAll(() => {
  db.exec(
    'DELETE FROM audit_logs; DELETE FROM tasks; DELETE FROM users; DELETE FROM projects; DELETE FROM teams;'
  );
});

describe('POST /api/auth/login', () => {
  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'pw' });
    expect(res.status).toBe(400);
  });

  it('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'pw' });
    expect(res.status).toBe(401);
  });
});

describe('Task routes', () => {
  let token: string;
  let projectId: number;

  beforeAll(() => {
    db.exec("INSERT OR IGNORE INTO teams (id, name) VALUES (99, 'Test Team')");
    db.prepare(
      "INSERT OR IGNORE INTO users (id, name, email, password_hash, team_id, role) VALUES (99, 'Tester', 'tester@test.com', 'x', 99, 'admin')"
    ).run();
    db.prepare(
      "INSERT OR IGNORE INTO projects (id, name, team_id) VALUES (99, 'Test Project', 99)"
    ).run();
    projectId = 99;
    token = signToken({ userId: 99, email: 'tester@test.com', teamId: 99, role: 'admin' });
  });

  it('returns empty array for a project with no tasks', async () => {
    const res = await request(app)
      .get('/api/projects/99999/tasks')
      .set('Authorization', 'Bearer ' + token);
    // The endpoint returns an empty array even for projects not belonging to this team
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('creates a task successfully', async () => {
    const res = await request(app)
      .post('/api/projects/' + projectId + '/tasks')
      .set('Authorization', 'Bearer ' + token)
      .send({ title: 'Test Task', priority: 'high' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.task.title).toBe('Test Task');
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/projects/' + projectId + '/tasks')
      .set('Authorization', 'Bearer ' + token)
      .send({ priority: 'high' });

    expect(res.status).toBe(400);
  });

  it('updates a task status', async () => {
    const createRes = await request(app)
      .post('/api/projects/' + projectId + '/tasks')
      .set('Authorization', 'Bearer ' + token)
      .send({ title: 'Status Test Task' });

    const taskId = createRes.body.task.id as number;

    const updateRes = await request(app)
      .put('/api/projects/' + projectId + '/tasks/' + taskId)
      .set('Authorization', 'Bearer ' + token)
      .send({ status: 'done' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.message).toBe('Task updated');
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/projects/' + projectId + '/tasks');
    expect(res.status).toBe(401);
  });
});
