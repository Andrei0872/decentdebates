import { Module } from '@nestjs/common';
import { CommentModule } from '../comment/comment.module';
import { ReviewGateway } from './review.gateway';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { DebatesModule } from '../debates/debates.module';

@Module({
  providers: [ReviewGateway, ReviewService],
  imports: [CommentModule, DebatesModule],
  controllers: [ReviewController]
})
export class ReviewModule {}
