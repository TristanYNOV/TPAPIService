import { Module } from '@nestjs/common';
import { UsersPostsController } from './users-posts.controller';
import { PostsModule } from '../posts/posts.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PostsModule, AuthModule],
  controllers: [UsersPostsController],
})
export class UsersModule {}
