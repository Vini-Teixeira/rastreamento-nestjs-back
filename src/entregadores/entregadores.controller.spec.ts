import { Test, TestingModule } from '@nestjs/testing';
import { EntregadoresController } from './entregadores.controller';

describe('EntregadoresController', () => {
  let controller: EntregadoresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntregadoresController],
    }).compile();

    controller = module.get<EntregadoresController>(EntregadoresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
