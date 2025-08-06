import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
// ✅ Caminhos relativos para garantir que o Jest encontre os módulos
import { EntregadoresService } from '../entregadores/entregadores.service';
import { LojistasService } from '../lojistas/lojistas.service';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';

// Mock (simulação) dos nossos serviços para isolar o AuthService
const mockEntregadoresService = {
  findOneByPhoneWithPassword: jest.fn(),
};

const mockLojistasService = {
  // Adicione mocks para o LojistasService se for testar os métodos dele
};

const mockJwtService = {
  sign: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    // Limpa os mocks antes de cada teste
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: EntregadoresService,
          useValue: mockEntregadoresService,
        },
        {
          provide: LojistasService,
          useValue: mockLojistasService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateDriver', () => {
    it('should return a driver object if password is valid', async () => {
      const driverId = new Types.ObjectId();
      // O mock precisa ter o método .toObject() que o Mongoose usa
      const mockDriver = {
        _id: driverId,
        nome: 'João Silva',
        telefone: '123456789',
        password: 'hashedPassword',
        toObject: () => ({
          _id: driverId,
          nome: 'João Silva',
          telefone: '123456789',
        }),
      };

      mockEntregadoresService.findOneByPhoneWithPassword.mockResolvedValue(
        mockDriver,
      );
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.validateDriver('123456789', 'plainPassword');

      expect(result).toEqual({
        _id: driverId,
        nome: 'João Silva',
        telefone: '123456789',
      });
      expect(
        mockEntregadoresService.findOneByPhoneWithPassword,
      ).toHaveBeenCalledWith('123456789');
    });

    it('should return null if password is not valid', async () => {
      const mockDriver = { password: 'hashedPassword' };
      mockEntregadoresService.findOneByPhoneWithPassword.mockResolvedValue(
        mockDriver,
      );
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const result = await service.validateDriver('123456789', 'wrongPassword');
      expect(result).toBeNull();
    });

    it('should return null if driver is not found', async () => {
      mockEntregadoresService.findOneByPhoneWithPassword.mockResolvedValue(null);
      const result = await service.validateDriver(
        'nonexistent-phone',
        'any-password',
      );
      expect(result).toBeNull();
    });
  });

  describe('loginDriver', () => {
    it('should return a message and an access_token', async () => {
      const mockUser = { _id: 'user-id', telefone: '12345' };
      const mockToken = 'mock-jwt-token';

      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.loginDriver(mockUser);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser._id,
        telefone: mockUser.telefone,
      });

      expect(result).toEqual({
        message: 'Login bem-sucedido!',
        access_token: mockToken,
      });
    });
  });
});
