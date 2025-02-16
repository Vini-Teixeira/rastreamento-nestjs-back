import { Test, TestingModule } from '@nestjs/testing';
import { EntregadoresService } from './entregadores.service';

describe('EntregadoresService', () => {
  let service: EntregadoresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EntregadoresService],
    }).compile();

    service = module.get<EntregadoresService>(EntregadoresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
