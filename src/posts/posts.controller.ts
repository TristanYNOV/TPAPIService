import {
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

    return this.postsService.findAll({
      limit: query.limit,
      cursor: query.cursor,
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
