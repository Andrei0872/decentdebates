import { Module } from '@nestjs/common';
import { ReviewGateway } from './review.gateway';
import { ReviewService } from './review.service';

@Module({
  providers: [ReviewGateway, ReviewService]
})
export class ReviewModule {}
