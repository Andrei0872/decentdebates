import { Test, TestingModule } from '@nestjs/testing';
import { DebatesController } from './debates.controller';

describe('DebatesController', () => {
  let controller: DebatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DebatesController],
    }).compile();

    controller = module.get<DebatesController>(DebatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
