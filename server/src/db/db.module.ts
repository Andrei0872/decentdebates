import { ConsoleLogger, FactoryProvider, Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

const LOGGER_CONTEXT = 'DB';

export const PG_PROVIDER_TOKEN = 'PG_PROVIDER_TOKEN';

const PG_PROVIDER: FactoryProvider<Pool> = {
  provide: PG_PROVIDER_TOKEN,
  useFactory: async (cs: ConfigService) => {
    const logger = new Logger(LOGGER_CONTEXT);
    
    const pool = new Pool({
      user: cs.get('POSTGRES_USER'),
      host: cs.get('POSTGRES_HOST'),
      database: cs.get('POSTGRES_DB'),
      password: cs.get('POSTGRES_PASSWORD'),
      port: cs.get('POSTGRES_PORT'),
    });

    try {
      await new Promise((resolve, reject) => {
        pool.query('SELECT NOW()', (err, res) => {
          if (err) {
            return reject(err);
          }

          resolve(res);
        });
      })

      logger.log('Successfully connected to the database.');
    } catch (err) {
      logger.error('An error occurred while connecting to the database', err);
      pool.end();
      process.exit(1);
    }

    return pool;
  },
  inject: [ConfigService]
}

@Global()
@Module({
  providers: [PG_PROVIDER],
  exports: [
    PG_PROVIDER,
    ConfigModule,
  ],
  imports: [
    ConfigModule.forRoot({
      envFilePath: '../.env',
    }),
  ]
})
export class DbModule {}
