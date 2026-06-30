import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import * as schema from '../../../db/schema';

export const DRIZZLE_TOKEN = 'DRIZZLE_DB';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE_TOKEN,
      useFactory: async (config: ConfigService) => {
        const url = config.get<string>('DATABASE_URL');
        if (!url) throw new Error('DATABASE_URL is required');
        const pool = mysql.createPool({ uri: url });
        return drizzle(pool, { schema, mode: 'default' });
      },
      inject: [ConfigService],
    },
  ],
  exports: [DRIZZLE_TOKEN],
})
export class DbModule {}
