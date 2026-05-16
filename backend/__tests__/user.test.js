const request = require('supertest');
const app = require('../src/server');
const User = require('../src/models/User');

describe('User Endpoints', () => {
  let adminToken;
  let normalToken;

  beforeEach(async () => {
    const adminRes = await request(app).post('/api/auth/register').send({
      username: 'admin',
      password: 'password',
      role: 'admin'
    });
    adminToken = adminRes.body.token;

    const normalRes = await request(app).post('/api/auth/register').send({
      username: 'normal',
      password: 'password',
      role: 'user'
    });
    normalToken = normalRes.body.token;
  });

  describe('GET /api/users', () => {
    it('should allow admin to get users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(2);
    });

    it('should block normal users from getting users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${normalToken}`);
      
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/users', () => {
    it('should allow admin to create a user', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: 'newuser', password: 'password', role: 'user' });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.username).toBe('newuser');
    });

    it('should return 400 if user exists', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: 'normal', password: 'pwd', role: 'user' });
      
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by id', async () => {
      const usersRes = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`);
      const userId = usersRes.body[0]._id;

      const res = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
    });

    it('should return 404 if user not found', async () => {
      const res = await request(app)
        .get('/api/users/123456789012345678901234')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user', async () => {
      const usersRes = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`);
      const userId = usersRes.body.find(u => u.username === 'normal')._id;

      const res = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin', password: 'newpassword' });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.role).toBe('admin');
    });

    it('should return 404 if user to update not found', async () => {
      const res = await request(app).put('/api/users/123456789012345678901234').set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user', async () => {
      const usersRes = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`);
      const userId = usersRes.body.find(u => u.username === 'normal')._id;

      const res = await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('User and their tasks removed');
    });

    it('should return 404 if user to delete not found', async () => {
      const res = await request(app).delete('/api/users/123456789012345678901234').set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(404);
    });
  });
});
