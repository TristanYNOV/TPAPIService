import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListPostsQueryDto, PostsFeedScope } from './dto/list-posts.query';

interface JwtPayload {
  sub: string;
  email: string;
}

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req: { user: JwtPayload }, @Body() body: CreatePostDto) {
    return this.postsService.create(req.user.sub, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req: { user: JwtPayload }, @Query() query: ListPostsQueryDto) {
    const scope: PostsFeedScope = query.scope ?? 'global';
    const filter = scope === 'me' ? { authorId: req.user.sub } : undefined;

    let cursor: { createdAt: string; id: string } | undefined;

    if (query.cursor) {
      try {
        const parsed = JSON.parse(query.cursor);

        if (
          !parsed ||
          typeof parsed !== 'object' ||
          typeof parsed.createdAt !== 'string' ||
          typeof parsed.id !== 'string'
        ) {
          throw new Error('Invalid cursor');
        }

        cursor = {
          createdAt: parsed.createdAt,
          id: parsed.id,
        };
      } catch (error) {
        throw new BadRequestException('Invalid cursor');
      }
    }

    return this.postsService.findAll({
      limit: query.limit,
      cursor,
      filter,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post(':postId/like')
  @HttpCode(200)
  like(
    @Param('postId') postId: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.postsService.like(postId, req.user.sub);
  }
}
