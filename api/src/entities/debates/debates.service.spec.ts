import { Test, TestingModule } from '@nestjs/testing';
import { DebatesService } from './debates.service';

describe('DebatesService', () => {
  let service: DebatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DebatesService],
    }).compile();

    service = module.get<DebatesService>(DebatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
