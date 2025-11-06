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
import { ListPostsQueryDto } from './dto/list-posts.query';

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

  @Get()
  findMany(@Query() query: ListPostsQueryDto) {
    const limit = Number(query.limit ?? 10);

    return this.postsService.findMany({
      limit,
      cursor: query.cursor,
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
