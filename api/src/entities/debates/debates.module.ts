import { Module } from '@nestjs/common';
import { DebatesController } from './debates.controller';
import { DebatesService } from './debates.service';

@Module({
  controllers: [DebatesController],
  providers: [DebatesService],
  exports: [DebatesService],
})
export class DebatesModule {}
