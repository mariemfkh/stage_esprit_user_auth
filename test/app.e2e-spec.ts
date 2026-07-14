import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('ms-auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth endpoints', () => {
    const testUser = {
      firstName: 'Test',
      lastName: 'User',
      email: `test.e2e.${Date.now()}@example.com`,
      password: 'Test@Password123',
    };

    let accessToken: string;

    it('POST /api/v1/auth/register — should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res: request.Response) => {
          const body = res.body as {
            user: { email: string };
            tokens: { accessToken: string };
          };
          expect(body.user).toBeDefined();
          expect(body.user.email).toBe(testUser.email);
          expect(body.tokens.accessToken).toBeDefined();
          accessToken = body.tokens.accessToken;
        });
    });

    it('POST /api/v1/auth/login — should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200)
        .expect((res: request.Response) => {
          const body = res.body as { tokens: { accessToken: string } };
          expect(body.tokens.accessToken).toBeDefined();
          accessToken = body.tokens.accessToken;
        });
    });

    it('POST /api/v1/auth/login — should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' })
        .expect(401);
    });

    it('GET /api/v1/auth/me — should return current user profile', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res: request.Response) => {
          const body = res.body as { email: string };
          expect(body.email).toBe(testUser.email);
        });
    });

    it('GET /api/v1/auth/me — should reject unauthenticated requests', () => {
      return request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
    });
  });
});
