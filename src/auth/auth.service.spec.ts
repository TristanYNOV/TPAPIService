import { ConflictException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma.service';
import { plainToInstance } from 'class-transformer';
import { RegisterDto } from './dto/register.dto';

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

const { hash } = jest.requireMock('argon2');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock } };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    service = new AuthService(prisma as unknown as PrismaService);
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
});
