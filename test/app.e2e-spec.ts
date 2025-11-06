import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { resolve } from 'path';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${resolve(__dirname, '../prisma/dev.db')}`;
}

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication(new FastifyAdapter());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidUnknownValues: true }));

    const fastify = app.getHttpAdapter().getInstance();
    await fastify.register(helmet, { global: true });
    await fastify.register(rateLimit, { max: 100, timeWindow: '1 minute' });

    await app.init();
    await fastify.ready();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/register retourne 201 et le payload épuré', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'alice@example.com', password: 'password123' })
      .expect(201);

    expect(response.body).toEqual({
      id: expect.any(String),
      email: 'alice@example.com',
      createdAt: expect.any(String),
    });
  });
});
