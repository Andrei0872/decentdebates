import { Module } from '@nestjs/common';
import { ReviewGateway } from './review.gateway';

@Module({
  providers: [ReviewGateway]
})
export class ReviewModule {}
