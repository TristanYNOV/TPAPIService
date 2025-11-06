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

  async findMany(params: { limit: number; cursor?: string | undefined }) {
    const { limit, cursor } = params;

    const parsedLimit = Number(limit);

    if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
      throw new BadRequestException('Invalid limit');
    }

    if (cursor) {
      const exists = await this.prisma.post.findUnique({
        where: { id: cursor },
        select: { id: true },
      });

      if (!exists) {
        throw new BadRequestException('Invalid cursor');
      }
    }

    const take = parsedLimit + 1;

    const query: Prisma.PostFindManyArgs = {
      take,
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
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
    };

    if (cursor) {
      query.cursor = { id: cursor };
      query.skip = 1;
    }

    const posts = await this.prisma.post.findMany(query);

    const hasNextPage = posts.length > parsedLimit;
    const data = hasNextPage ? posts.slice(0, parsedLimit) : posts;
    const nextCursor = hasNextPage ? data[data.length - 1].id : null;

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
