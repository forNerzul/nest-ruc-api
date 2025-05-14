import { Test, TestingModule } from '@nestjs/testing';
import { ContribuyentesController } from './contribuyentes.controller';

describe('ContribuyentesController', () => {
  let controller: ContribuyentesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContribuyentesController],
    }).compile();

    controller = module.get<ContribuyentesController>(ContribuyentesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
