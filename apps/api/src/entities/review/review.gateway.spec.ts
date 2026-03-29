import { Test, TestingModule } from '@nestjs/testing';
import { ReviewGateway } from './review.gateway';

describe('ReviewGateway', () => {
  let gateway: ReviewGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReviewGateway],
    }).compile();

    gateway = module.get<ReviewGateway>(ReviewGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
