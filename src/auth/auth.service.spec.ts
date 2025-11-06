import {
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma.service';
import { plainToInstance } from 'class-transformer';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  verify: jest.fn(),
}));

const { hash, verify } = jest.requireMock('argon2');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };
  let jwtService: { signAsync: jest.Mock };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    jwtService = {
      signAsync: jest.fn(),
    };

    service = new AuthService(prisma as unknown as PrismaService, jwtService as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a user when payload is valid', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'john.doe@example.com',
      password: 'password123',
    });

    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'user-id',
      email: 'john.doe@example.com',
      password: 'hashed-password',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    });

    const result = await service.register(dto);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'john.doe@example.com' },
    });
    expect(hash).toHaveBeenCalledWith('password123');
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'john.doe@example.com',
        password: 'hashed-password',
      },
    });
    expect(result).toEqual({
      id: 'user-id',
      email: 'john.doe@example.com',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    });
  });

  it('should throw ConflictException when email already exists', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'john.doe@example.com',
      password: 'password123',
    });

    prisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

    await expect(service.register(dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('should throw BadRequestException when email is invalid', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'not-an-email',
      password: 'password123',
    });

    await expect(service.register(dto)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw BadRequestException when password is too short', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'john.doe@example.com',
      password: 'short',
    });

    await expect(service.register(dto)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should return an access token when credentials are valid', async () => {
    const dto = plainToInstance(LoginDto, {
      email: 'john.doe@example.com',
      password: 'password123',
    });

    prisma.user.findUnique.mockResolvedValue({
      id: 'user-id',
      email: 'john.doe@example.com',
      password: 'hashed-password',
    });

    verify.mockResolvedValue(true);
    jwtService.signAsync.mockResolvedValue('jwt-token');

    const result = await service.login(dto);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'john.doe@example.com' },
    });
    expect(verify).toHaveBeenCalledWith('hashed-password', 'password123');
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'user-id',
      email: 'john.doe@example.com',
    });
    expect(result).toEqual({ access_token: 'jwt-token' });
  });

  it('should throw UnauthorizedException when credentials are invalid', async () => {
    const dto = plainToInstance(LoginDto, {
      email: 'john.doe@example.com',
      password: 'password123',
    });

    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.login(dto)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should throw UnauthorizedException when password is incorrect', async () => {
    const dto = plainToInstance(LoginDto, {
      email: 'john.doe@example.com',
      password: 'password123',
    });

    prisma.user.findUnique.mockResolvedValue({
      id: 'user-id',
      email: 'john.doe@example.com',
      password: 'hashed-password',
    });

    verify.mockResolvedValue(false);

    await expect(service.login(dto)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
