import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
}
