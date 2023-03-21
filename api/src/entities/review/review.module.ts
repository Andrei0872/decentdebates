import { Module } from '@nestjs/common';
import { CommentModule } from '../comment/comment.module';
import { ReviewGateway } from './review.gateway';
import { ReviewService } from './review.service';

@Module({
  providers: [ReviewGateway, ReviewService],
  imports: [CommentModule]
})
export class ReviewModule {}
