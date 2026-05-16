const request = require('supertest');
const app = require('../src/server');
const User = require('../src/models/User');
const Task = require('../src/models/Task');
const path = require('path');
const fs = require('fs');

const dummyPdfPath = path.join(__dirname, 'dummy.pdf');
const dummyTxtPath = path.join(__dirname, 'dummy.txt');

beforeAll(() => {
  fs.writeFileSync(dummyPdfPath, 'dummy pdf content');
  fs.writeFileSync(dummyTxtPath, 'dummy txt content');
});

afterAll(() => {
  if (fs.existsSync(dummyPdfPath)) fs.unlinkSync(dummyPdfPath);
  if (fs.existsSync(dummyTxtPath)) fs.unlinkSync(dummyTxtPath);
});

describe('Task Endpoints', () => {
  let userToken;
  let adminToken;
  let userId;
  let adminId;

  beforeEach(async () => {
    // Register normal user
    const userRes = await request(app).post('/api/auth/register').send({
      username: 'normaluser',
      password: 'password123',
      role: 'user'
    });
    userToken = userRes.body.token;
    userId = userRes.body._id;

    // Register admin user
    const adminRes = await request(app).post('/api/auth/register').send({
      username: 'adminuser',
      password: 'password123',
      role: 'admin'
    });
    adminToken = adminRes.body.token;
    adminId = adminRes.body._id;
  });

  describe('POST /api/tasks', () => {
    it('should allow user to create a task', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'New Task',
          description: 'Task description',
          priority: 'high'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('title', 'New Task');
      expect(res.body.assignedUser.toString()).toBe(userId);
    });

    it('should allow user to create a task with an attachment', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .field('title', 'Task with Attachment')
        .attach('attachments', dummyPdfPath);

      expect(res.statusCode).toBe(201);
      expect(res.body.attachments.length).toBe(1);
    });

    it('should fail if more than 3 PDFs uploaded', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .field('title', 'Too many attachments')
        .attach('attachments', dummyPdfPath)
        .attach('attachments', dummyPdfPath)
        .attach('attachments', dummyPdfPath)
        .attach('attachments', dummyPdfPath);

      expect(res.statusCode).toBe(500);
    });

    it('should reject non-PDF files', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .field('title', 'Invalid Attachment')
        .attach('attachments', dummyTxtPath);

      expect(res.statusCode).toBe(500);
      expect(res.text).toContain('PDFs Only!');
    });

    it('should fail if unauthenticated', async () => {
      const res = await request(app).post('/api/tasks').send({ title: 'Task' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      // Create one task for normal user
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'User Task' });

      // Create one task for admin
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Admin Task' });
    });

    it('should return only users tasks for normal user', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.tasks.length).toBe(1);
      expect(res.body.tasks[0].title).toBe('User Task');
    });

    it('should return all tasks for admin', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.tasks.length).toBe(2);
    });

    it('should filter tasks by status and priority', async () => {
      await request(app).post('/api/tasks').set('Authorization', `Bearer ${userToken}`).send({ title: 'F1', status: 'completed', priority: 'high' });
      await request(app).post('/api/tasks').set('Authorization', `Bearer ${userToken}`).send({ title: 'F2', status: 'pending', priority: 'low' });

      const res = await request(app).get('/api/tasks?status=completed&priority=high').set('Authorization', `Bearer ${userToken}`);
      expect(res.body.tasks.length).toBe(1);
      expect(res.body.tasks[0].title).toBe('F1');
    });

    it('should filter tasks by due date', async () => {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      await request(app).post('/api/tasks').set('Authorization', `Bearer ${userToken}`).send({ title: 'T1', dueDate: today.toISOString() });
      await request(app).post('/api/tasks').set('Authorization', `Bearer ${userToken}`).send({ title: 'T2', dueDate: futureDate.toISOString() });
      await request(app).post('/api/tasks').set('Authorization', `Bearer ${userToken}`).send({ title: 'T3', dueDate: pastDate.toISOString() });

      const resToday = await request(app).get('/api/tasks?dueDate=today').set('Authorization', `Bearer ${userToken}`);
      expect(resToday.body.tasks.some(t => t.title === 'T1')).toBeTruthy();

      const resUpcoming = await request(app).get('/api/tasks?dueDate=upcoming').set('Authorization', `Bearer ${userToken}`);
      expect(resUpcoming.body.tasks.some(t => t.title === 'T2')).toBeTruthy();

      const resOverdue = await request(app).get('/api/tasks?dueDate=overdue').set('Authorization', `Bearer ${userToken}`);
      expect(resOverdue.body.tasks.some(t => t.title === 'T3')).toBeTruthy();
    });

    it('should support pagination', async () => {
      for (let i = 0; i < 15; i++) {
        await request(app).post('/api/tasks').set('Authorization', `Bearer ${userToken}`).send({ title: `P${i}` });
      }

      const res1 = await request(app).get('/api/tasks?page=1&limit=5').set('Authorization', `Bearer ${userToken}`);
      expect(res1.body.tasks.length).toBe(5);
      expect(res1.body.total).toBeGreaterThan(15);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    let taskId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Task to update', status: 'pending' });
      taskId = res.body._id;
    });

    it('should allow user to update their own task', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'completed' });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('completed');
    });

    it('should allow admin to update any task', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Admin Edited Task', assignedUser: userId });

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe('Admin Edited Task');
    });

    it('should block user from updating others task', async () => {
      const adminTask = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Admin Only' });

      const res = await request(app)
        .put(`/api/tasks/${adminTask.body._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Hacked' });

      expect(res.statusCode).toBe(401);
    });

    it('should return 404 if task to update not found', async () => {
      const res = await request(app).put('/api/tasks/123456789012345678901234').set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let taskId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Task to delete' });
      taskId = res.body._id;
    });

    it('should allow user to delete their own task', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
    });

    it('should return 404 if task not found', async () => {
      const fakeId = '123456789012345678901234';
      const res = await request(app)
        .delete(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(404);
    });

    it('should block non-admin from deleting others task', async () => {
      // Create admin task
      const adminTask = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Admin Only' });

      const res = await request(app)
        .delete(`/api/tasks/${adminTask.body._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/tasks/:id', () => {
    let taskId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Fetch Me' });
      taskId = res.body._id;
    });

    it('should get task by id', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe('Fetch Me');
    });

    it('should fail if task does not exist', async () => {
      const res = await request(app)
        .get('/api/tasks/123456789012345678901234')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(404);
    });

    it('should block normal user from viewing others task', async () => {
      const adminTask = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Admin Only' });

      const res = await request(app)
        .get(`/api/tasks/${adminTask.body._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(401);
    });
  });
});
