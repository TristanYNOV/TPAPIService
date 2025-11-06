import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RegisterDto } from './dto/register.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    const dtoInstance = dto instanceof RegisterDto ? dto : plainToInstance(RegisterDto, dto);
    const errors = await validate(dtoInstance);
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dtoInstance.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await argon2.hash(dtoInstance.password);

    const user = await this.prisma.user.create({
      data: {
        email: dtoInstance.email,
        password: passwordHash,
      },
    });

    const { password, ...safeUser } = user;
    return safeUser;
  }
}
