import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostsModule } from './posts/posts.module';

@Module({
  imports: [
    // Les variables d'environnement sont chargées via `dotenv/config` dans main.ts
    AuthModule,
    PostsModule,
  ],
  providers: [PrismaService, AppService],
  controllers: [AppController],
})
export class AppModule {}
