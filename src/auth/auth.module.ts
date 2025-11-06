import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (): JwtModuleOptions => {
        const secret = process.env.JWT_SECRET;
        const raw = process.env.JWT_EXPIRES_IN; // ex: "1d" ou "3600"

        if (!secret || !raw) {
          throw new Error('JWT_SECRET and JWT_EXPIRES_IN must be defined');
        }

        // Si c'est un nombre (ex: "3600"), on convertit en number sinon on garde la string (ex: "1d")
        const expiresIn: JwtSignOptions['expiresIn'] =
            /^\d+$/.test(raw) ? Number(raw) : (raw as JwtSignOptions['expiresIn']);

        return {
          secret,
          signOptions: { expiresIn },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtAuthGuard],
  exports: [JwtModule, JwtAuthGuard],
})
export class AuthModule {}
