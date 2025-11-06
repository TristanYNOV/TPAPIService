import { BadRequestException, Injectable } from '@nestjs/common';
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
}
