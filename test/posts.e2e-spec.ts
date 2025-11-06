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

  describe('GET /posts', () => {
    it('should return paginated posts ordered by createdAt desc', async () => {
      const [author, bob, charlie] = await Promise.all([
        prisma.user.create({
          data: {
            email: 'author@example.com',
            password: 'hashed-password',
          },
        }),
        prisma.user.create({
          data: {
            email: 'bob@example.com',
            password: 'hashed-password',
          },
        }),
        prisma.user.create({
          data: {
            email: 'charlie@example.com',
            password: 'hashed-password',
          },
        }),
      ]);

      const posts = await Promise.all([
        prisma.post.create({
          data: {
            authorId: author.id,
            content: 'Post 1',
            createdAt: new Date('2024-01-01T08:00:00.000Z'),
          },
        }),
        prisma.post.create({
          data: {
            authorId: author.id,
            content: 'Post 2',
            createdAt: new Date('2024-02-01T08:00:00.000Z'),
          },
        }),
        prisma.post.create({
          data: {
            authorId: author.id,
            content: 'Post 3',
            createdAt: new Date('2024-03-01T08:00:00.000Z'),
          },
        }),
        prisma.post.create({
          data: {
            authorId: author.id,
            content: 'Post 4',
            createdAt: new Date('2024-04-01T08:00:00.000Z'),
          },
        }),
      ]);

      const expectedOrder = [posts[3], posts[2], posts[1], posts[0]];

      await Promise.all([
        prisma.like.create({
          data: {
            userId: bob.id,
            postId: expectedOrder[0].id,
          },
        }),
        prisma.like.create({
          data: {
            userId: charlie.id,
            postId: expectedOrder[0].id,
          },
        }),
        prisma.like.create({
          data: {
            userId: bob.id,
            postId: expectedOrder[1].id,
          },
        }),
      ]);

      const firstPage = await request(app.getHttpServer())
        .get('/posts')
        .query({ limit: 2 })
        .expect(200);

      expect(firstPage.body.data).toHaveLength(2);
      expect(firstPage.body.data[0].id).toBe(expectedOrder[0].id);
      expect(firstPage.body.data[1].id).toBe(expectedOrder[1].id);
      expect(firstPage.body.data[0]._count.likes).toBe(2);
      expect(firstPage.body.data[1]._count.likes).toBe(1);
      expect(firstPage.body.data[0].author).toEqual({
        id: author.id,
        email: author.email,
      });
      expect(firstPage.body.data[1].author).toEqual({
        id: author.id,
        email: author.email,
      });
      expect(firstPage.body.nextCursor).toBe(expectedOrder[1].id);

      const secondPage = await request(app.getHttpServer())
        .get('/posts')
        .query({ limit: 2, cursor: firstPage.body.nextCursor })
        .expect(200);

      expect(secondPage.body.data).toHaveLength(2);
      expect(secondPage.body.data[0].id).toBe(expectedOrder[2].id);
      expect(secondPage.body.data[1].id).toBe(expectedOrder[3].id);
      expect(secondPage.body.nextCursor).toBeNull();
    });
  });
});
