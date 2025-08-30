import { Test, TestingModule } from '@nestjs/testing';
import { LojistasController } from './lojistas.controller';

describe('LojistasController', () => {
  let controller: LojistasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LojistasController],
    }).compile();

    controller = module.get<LojistasController>(LojistasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
