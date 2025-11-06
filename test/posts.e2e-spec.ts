import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { execSync } from 'node:child_process';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';

process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'e2e-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '15m';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';

execSync('npx prisma migrate deploy', {
  stdio: 'inherit',
  env: {
    ...process.env,
  },
});

describe('PostsController (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.like.deleteMany({});
    await prisma.post.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('POST /posts should return 401 when no token is provided', async () => {
    await request(app.getHttpServer())
      .post('/posts')
      .send({ content: 'Unauthorized post' })
      .expect(401);
  });

  it('POST /posts should create a post when a valid token is provided', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'alice@example.com', password: 'password123' })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'alice@example.com', password: 'password123' })
      .expect(200);

    const token = loginResponse.body.access_token;

    const response = await request(app.getHttpServer())
      .post('/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Hello world' })
      .expect(201);

    expect(response.body).toMatchObject({
      content: 'Hello world',
      author: {
        email: 'alice@example.com',
      },
    });

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('createdAt');
    expect(response.body.author).toHaveProperty('id');
    expect(typeof response.body.id).toBe('string');
    expect(typeof response.body.createdAt).toBe('string');
    expect(typeof response.body.author.id).toBe('string');
  });
});
