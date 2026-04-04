import { Module } from '@nestjs/common';
import { DebatesModule } from '../debates/debates.module';
import { ModeratorController } from './moderator.controller';
import { ModeratorService } from './moderator.service';

@Module({
  controllers: [ModeratorController],
  providers: [ModeratorService],
  exports: [ModeratorService],
  imports: [DebatesModule]
})
export class ModeratorModule { }
