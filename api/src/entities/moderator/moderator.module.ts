import { Inject, Module } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_PROVIDER_TOKEN } from 'src/db/db.module';
import { DebatesModule } from '../debates/debates.module';
import { ModeratorController } from './moderator.controller';
import { ModeratorService } from './moderator.service';

@Module({
  controllers: [ModeratorController],
  providers: [ModeratorService],
  imports: [DebatesModule]
})
export class ModeratorModule { }
