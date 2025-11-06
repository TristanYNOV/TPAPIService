import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import {AuthModule} from "./auth/auth.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,          // charge .env au démarrage (globalement)
      envFilePath: '.env',     // racine du projet
    }),
    AuthModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
