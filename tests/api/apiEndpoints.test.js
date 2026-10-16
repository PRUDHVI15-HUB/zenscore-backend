const request = require('supertest')

// Ensure test environment
process.env.NODE_ENV = 'test'
const app = require('../../server')

describe('ZenScore REST API Tests (via Supertest)', () => {
  describe('GET /api/health', () => {
    test('returns 200 OK and health status payload', async () => {
      const res = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200)

      expect(res.body).toHaveProperty('status')
      expect(res.body.status).toContain('ZenScore API is running')
      expect(res.body).toHaveProperty('timestamp')
    })
  })

  describe('Authentication Middleware Enforcement', () => {
    test('GET /api/academics/dashboard returns 401 when no token is supplied', async () => {
      const res = await request(app)
        .get('/api/academics/dashboard')
        .expect('Content-Type', /json/)
        .expect(401)

      expect(res.body).toHaveProperty('success', false)
      expect(res.body).toHaveProperty('message')
    })

    test('POST /api/ocr/upload returns 401 without authorization header', async () => {
      const res = await request(app)
        .post('/api/ocr/upload')
        .expect('Content-Type', /json/)
        .expect(401)

      expect(res.body).toHaveProperty('success', false)
    })

    test('GET /api/careers/profile returns 401 without authorization header', async () => {
      const res = await request(app)
        .get('/api/careers/profile')
        .expect('Content-Type', /json/)
        .expect(401)

      expect(res.body).toHaveProperty('success', false)
    })
  })

  describe('Route Handling & 404 Fallback', () => {
    test('returns 404 for unknown endpoints', async () => {
      const res = await request(app)
        .get('/api/unknown-service-endpoint')
        .expect('Content-Type', /json/)
        .expect(404)

      expect(res.body).toHaveProperty('success', false)
      expect(res.body.message).toBe('Route not found')
    })
  })
})
