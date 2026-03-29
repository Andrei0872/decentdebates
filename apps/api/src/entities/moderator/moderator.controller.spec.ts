import { Test, TestingModule } from '@nestjs/testing';
import { ModeratorController } from './moderator.controller';

describe('ModeratorController', () => {
  let controller: ModeratorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModeratorController],
    }).compile();

    controller = module.get<ModeratorController>(ModeratorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
