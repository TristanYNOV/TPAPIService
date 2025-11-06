import { BadRequestException, Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
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
      filter: { authorId: params.userId },
    });
  }
}
