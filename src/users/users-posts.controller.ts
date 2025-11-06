import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PostsService } from '../posts/posts.service';
import { ListPostsQueryDto } from '../posts/dto/list-posts.query';
import { UserIdParamDto } from './dto/user-id.param';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersPostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get(':userId/posts')
  findUserPosts(@Param() params: UserIdParamDto, @Query() query: ListPostsQueryDto) {
    return this.postsService.findAll({
      limit: query.limit,
      cursor: query.cursor,
      filter: { authorId: params.userId },
    });
  }
}
