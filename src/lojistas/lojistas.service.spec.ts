import { Test, TestingModule } from '@nestjs/testing';
import { LojistasService } from './lojistas.service';

describe('LojistasService', () => {
  let service: LojistasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LojistasService],
    }).compile();

    service = module.get<LojistasService>(LojistasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
