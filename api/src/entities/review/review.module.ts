import { Module } from '@nestjs/common';
import { CommentModule } from '../comment/comment.module';
import { ReviewGateway } from './review.gateway';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';

@Module({
  providers: [ReviewGateway, ReviewService],
  imports: [CommentModule],
  controllers: [ReviewController]
})
export class ReviewModule {}
