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
    cursor?: string;
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

    const posts = await this.prisma.post.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
      take: parsedLimit,
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

    return {
      data: posts,
      nextCursor: null,
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
