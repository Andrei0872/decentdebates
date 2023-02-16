import { Module } from '@nestjs/common';
import { DebatesController } from './debates.controller';
import { DebatesService } from './debates.service';

@Module({
  controllers: [DebatesController],
  providers: [DebatesService]
})
export class DebatesModule {}
