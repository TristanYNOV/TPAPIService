import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(authorId: string, dto: CreatePostDto) {
    const dtoInstance = plainToInstance(CreatePostDto, dto);
    const errors = await validate(dtoInstance);

    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    return this.prisma.post.create({
      data: {
        authorId,
        content: dtoInstance.content,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(params: {
    limit?: number;
    cursor?: { createdAt: string; id: string };
    filter?: { authorId?: string };
  }) {
    const limit = params.limit ?? 10;
    const parsedLimit = Number(limit);

    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      throw new BadRequestException('Invalid limit');
    }

    const where: Prisma.PostWhereInput | undefined = params.filter?.authorId
      ? { authorId: params.filter.authorId }
      : undefined;

    let cursor: Prisma.PostWhereUniqueInput | undefined;

    if (params.cursor) {
      const { createdAt, id } = params.cursor;

      if (typeof createdAt !== 'string' || typeof id !== 'string') {
        throw new BadRequestException('Invalid cursor');
      }

      const createdAtDate = new Date(createdAt);

      if (Number.isNaN(createdAtDate.getTime())) {
        throw new BadRequestException('Invalid cursor');
      }

      cursor = {
        createdAt_id: {
          createdAt: createdAtDate,
          id,
        },
      } satisfies Prisma.PostWhereUniqueInput;
    }

    const posts = await this.prisma.post.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
      cursor,
      skip: cursor ? 1 : undefined,
      take: parsedLimit + 1,
      include: {
        author: {
          select: {
            id: true,
            email: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    const hasNextPage = posts.length > parsedLimit;
    const data = posts.slice(0, parsedLimit);

    const nextCursor = hasNextPage
      ? {
          createdAt: data[data.length - 1].createdAt.toISOString(),
          id: data[data.length - 1].id,
        }
      : null;

    return {
      data,
      nextCursor,
    };
  }

  async like(postId: string, userId: string) {
    const exists = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Post not found');
    }

    await this.prisma.like.upsert({
      where: { userId_postId: { userId, postId } },
      update: {},
      create: { userId, postId },
    });

    const likes = await this.prisma.like.count({
      where: { postId },
    });

    return { likes };
  }
}
