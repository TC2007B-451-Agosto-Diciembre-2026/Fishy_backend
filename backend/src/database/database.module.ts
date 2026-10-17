import { Module, OnModuleDestroy, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPool } from 'mysql2/promise';
import type { Pool } from 'mysql2/promise';

export const DB_POOL = 'DB_POOL';

@Module({
  providers: [
    {
      provide: DB_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('DB_HOST', 'localhost');
        const port = Number(config.get<string>('DB_PORT', '3306'));
        const database = config.getOrThrow<string>('DB_NAME');

        return createPool({
          host,
          port,
          user: config.getOrThrow<string>('DB_USER'),
          password: config.get<string>('DB_PASSWORD', ''),
          database,
        });
      },
    },
  ],
  exports: [DB_POOL],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  onModuleDestroy() {
    return this.pool.end();
  }
}