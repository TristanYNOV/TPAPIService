import { BadRequestException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma.service';

const buildPrismaService = () => {
  return {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  } as unknown as PrismaService;
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService & { user: { findUnique: jest.Mock; create: jest.Mock } };

  beforeEach(() => {
    prisma = buildPrismaService() as PrismaService & {
      user: { findUnique: jest.Mock; create: jest.Mock };
    };
    service = new AuthService(prisma);
  });

  it('crée un utilisateur valide avec mot de passe hashé et réponse épurée', async () => {
    const dto = { email: 'alice@example.com', password: 'password123' };
    const created = {
      id: 'user-id',
      email: dto.email,
      password: 'hashed-password',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    };

    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(async ({ data }) => ({ ...created, password: data.password }));

    const result = await service.register(dto);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: dto.email } });
    expect(prisma.user.create).toHaveBeenCalledWith({ data: expect.objectContaining({ email: dto.email }) });
    const hashedPassword = prisma.user.create.mock.calls[0][0].data.password;
    expect(hashedPassword).not.toEqual(dto.password);
    expect(result).toEqual({ id: created.id, email: created.email, createdAt: created.createdAt });
  });

  it("renvoie 409 Conflict si l'email est déjà utilisé", async () => {
    const dto = { email: 'alice@example.com', password: 'password123' };
    prisma.user.findUnique.mockResolvedValue({ id: 'existing', email: dto.email, password: 'hash', createdAt: new Date() });

    await expect(service.register(dto)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('renvoie 400 Bad Request si email invalide ou mot de passe trop court', async () => {
    await expect(service.register({ email: 'invalid-email', password: 'password123' })).rejects.toBeInstanceOf(
      BadRequestException,
    );

    await expect(service.register({ email: 'alice@example.com', password: 'short' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
