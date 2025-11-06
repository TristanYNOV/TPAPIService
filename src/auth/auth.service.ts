import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RegisterDto } from './dto/register.dto';
import { hash } from 'argon2';
import { isEmail } from 'class-validator';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    const email = dto.email?.trim().toLowerCase();
    const password = dto.password;

    if (!email || !isEmail(email)) {
      throw new BadRequestException('Email invalide');
    }

    if (!password || password.length < 8) {
      throw new BadRequestException('Mot de passe trop court');
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException("L'email est déjà utilisé");
    }

    const hashedPassword = await hash(password);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    const { password: _password, ...sanitized } = user;
    return sanitized;
  }
}
