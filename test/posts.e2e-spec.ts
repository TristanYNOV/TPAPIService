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

  async function registerAndLogin(email: string) {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'password123' })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'password123' })
      .expect(200);

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });

    return {
      token: loginResponse.body.access_token as string,
      user,
    };
  }

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

  describe('GET /posts (feeds)', () => {
    it('should require authentication for listing posts', async () => {
      await request(app.getHttpServer())
        .get('/posts')
        .query({ scope: 'global' })
        .expect(401);
    });

    it('should list posts in the global feed', async () => {
      const [{ token: aliceToken, user: alice }, { user: bob }] = await Promise.all([
        registerAndLogin('alice@example.com'),
        registerAndLogin('bob@example.com'),
      ]);

      const charlie = await prisma.user.create({
        data: {
          email: 'charlie@example.com',
          password: 'hashed-password',
        },
      });

      const posts = await Promise.all([
        prisma.post.create({
          data: {
            authorId: alice.id,
            content: 'Alice post',
            createdAt: new Date('2024-04-01T08:00:00.000Z'),
          },
        }),
        prisma.post.create({
          data: {
            authorId: bob.id,
            content: 'Bob post',
            createdAt: new Date('2024-03-01T08:00:00.000Z'),
          },
        }),
        prisma.post.create({
          data: {
            authorId: charlie.id,
            content: 'Charlie post',
            createdAt: new Date('2024-02-01T08:00:00.000Z'),
          },
        }),
      ]);

      const response = await request(app.getHttpServer())
        .get('/posts')
        .query({ scope: 'global', limit: 10 })
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        nextCursor: null,
      });
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.map((post: any) => post.id)).toEqual(
        posts
          .slice()
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .map((post) => post.id),
      );
    });

    it('should list only the current user posts for the me scope', async () => {
      const [{ token: aliceToken, user: alice }, { user: bob }] = await Promise.all([
        registerAndLogin('alice2@example.com'),
        registerAndLogin('bob2@example.com'),
      ]);

      await Promise.all([
        prisma.post.create({
          data: {
            authorId: alice.id,
            content: 'Alice only post',
          },
        }),
        prisma.post.create({
          data: {
            authorId: bob.id,
            content: 'Bob should not appear',
          },
        }),
      ]);

      const response = await request(app.getHttpServer())
        .get('/posts')
        .query({ scope: 'me' })
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ nextCursor: null });
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        content: 'Alice only post',
        author: { id: alice.id },
      });
    });
  });

  describe('GET /users/:userId/posts', () => {
    it('should require authentication', async () => {
      const randomId = 'caaaaaaaaaaaaaaaaaaaaaaaa';

      await request(app.getHttpServer())
        .get(`/users/${randomId}/posts`)
        .expect(401);
    });

    it('should list posts for the requested user', async () => {
      const [{ token: aliceToken, user: alice }, { user: bob }] = await Promise.all([
        registerAndLogin('alice3@example.com'),
        registerAndLogin('bob3@example.com'),
      ]);

      await Promise.all([
        prisma.post.create({
          data: {
            authorId: alice.id,
            content: 'Alice feed post',
          },
        }),
        prisma.post.create({
          data: {
            authorId: bob.id,
            content: 'Bob feed post',
          },
        }),
      ]);

      const response = await request(app.getHttpServer())
        .get(`/users/${bob.id}/posts`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        data: [
          expect.objectContaining({
            author: expect.objectContaining({ id: bob.id }),
            content: 'Bob feed post',
          }),
        ],
        nextCursor: null,
      });
    });

    it('should return an empty collection when the user does not exist', async () => {
      const { token: aliceToken } = await registerAndLogin('alice4@example.com');
      const unknownUserId = 'cbbbbbbbbbbbbbbbbbbbbbbbb';

      const response = await request(app.getHttpServer())
        .get(`/users/${unknownUserId}/posts`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: [], nextCursor: null });
    });
  });

  describe('POST /posts/:postId/like', () => {
    it('should return 404 when the post does not exist', async () => {
      const { token } = await registerAndLogin('dave@example.com');

      await request(app.getHttpServer())
        .post('/posts/non-existing/like')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('should be idempotent and return the like count', async () => {
      const { token } = await registerAndLogin('eve@example.com');

      const postResponse = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'A likable post' })
        .expect(201);

      const postId = postResponse.body.id as string;

      const firstLike = await request(app.getHttpServer())
        .post(`/posts/${postId}/like`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(firstLike.body).toEqual({ likes: 1 });

      const secondLike = await request(app.getHttpServer())
        .post(`/posts/${postId}/like`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(secondLike.body).toEqual({ likes: 1 });

      const likeCount = await prisma.like.count({ where: { postId } });
      expect(likeCount).toBe(1);
    });
  });
});
