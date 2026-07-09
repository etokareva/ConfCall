import { Inject, Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { Subject } from 'rxjs';
import { DRIZZLE_TOKEN } from '../db/db.module';
import * as schema from '../../../db/schema';

const INTERSECTION_CACHE_NAME = 'intersection';

@Injectable()
export class CacheInvalidationService {
  private readonly intersectionInvalidated = new Subject<void>();
  readonly intersectionInvalidated$ =
    this.intersectionInvalidated.asObservable();
  private intersectionVersionInitialized = false;

  constructor(
    @Inject(DRIZZLE_TOKEN) private readonly db: MySql2Database<typeof schema>,
  ) {}

  async getIntersectionVersion() {
    await this.ensureIntersectionVersion();

    const [record] = await this.db
      .select({ version: schema.cacheVersions.version })
      .from(schema.cacheVersions)
      .where(eq(schema.cacheVersions.name, INTERSECTION_CACHE_NAME))
      .limit(1);

    return record?.version ?? 1;
  }

  private async ensureIntersectionVersion() {
    if (this.intersectionVersionInitialized) return;

    await this.db
      .insert(schema.cacheVersions)
      .values({ name: INTERSECTION_CACHE_NAME, version: 1 })
      .onDuplicateKeyUpdate({
        set: {
          version: sql`${schema.cacheVersions.version}`,
        },
      });
    this.intersectionVersionInitialized = true;
  }

  async invalidateIntersections() {
    await this.db
      .insert(schema.cacheVersions)
      .values({ name: INTERSECTION_CACHE_NAME, version: 2 })
      .onDuplicateKeyUpdate({
        set: {
          version: sql`${schema.cacheVersions.version} + 1`,
          updatedAt: new Date(),
        },
      });
    this.intersectionInvalidated.next();
  }
}
