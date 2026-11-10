import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService
  implements OnModuleInit, OnModuleDestroy
{
  readonly pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString?.trim()) {
      throw new Error('Chưa cấu hình DATABASE_URL cho backend.');
    }

        const schema = process.env.DATABASE_SCHEMA;

    if (
      schema !== undefined &&
      !/^[a-z][a-z0-9_]{0,62}$/.test(schema)
    ) {
      throw new Error('DATABASE_SCHEMA không hợp lệ.');
    }

    this.pool = new Pool({
      connectionString,
      ...(schema
        ? { options: `-c search_path=${schema}` }
        : {}),
      max: 5,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
      query_timeout: 30000,
      application_name: 'interview-english-api',
    });

    this.pool.on('error', () => {
      console.error('Kết nối PostgreSQL đang rảnh gặp lỗi.');
    });
  }

  async onModuleInit(): Promise<void> {
    await this.pool.query('SELECT 1');
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}