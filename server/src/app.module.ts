import { Inject, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule, PG_PROVIDER_TOKEN } from './db/db.module';

@Module({
  imports: [
    DbModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor (@Inject(PG_PROVIDER_TOKEN) pool: Pool) {
    pool.query('SELECT NOW()', (err, res) => {
      console.log(err, res)
      pool.end()
    })
  }
}
