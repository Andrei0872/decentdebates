import { Test, TestingModule } from '@nestjs/testing';
import { ModeratorService } from './moderator.service';

describe('ModeratorService', () => {
  let service: ModeratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ModeratorService],
    }).compile();

    service = module.get<ModeratorService>(ModeratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
