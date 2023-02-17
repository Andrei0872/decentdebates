import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_PROVIDER_TOKEN } from 'src/db/db.module';
import { Debate } from './debates.model';

interface Filters {
  queryStr: string;
  tags: string;
}

@Injectable()
export class DebatesService {
  constructor (@Inject(PG_PROVIDER_TOKEN) private pool: Pool) { }
  
  async getAll (filters?: Filters): Promise<Debate[]> {
    const client = await this.pool.connect();
    let sqlStr = `
      with debates_tags as (
        select
          d.id "debateId",
          string_agg(dt.name, ',') "tags"
        from debate d
        join assoc_debate_tag adt
          on adt.debate_id = d.id
        join debate_tag dt
          on dt.id = adt.tag_id
        group by d.id
      )
      select
        d.id,
        d.title,
        d.created_at "createdAt",
        d.modified_at "modifiedAt",
        u.username,
        u.id "userId",
        dts."tags"
      from debate d
      join ticket t
        on d.ticket_id = t.id
      join "user" u
        on u.id = t.created_by
      join debates_tags dts
        on d.id = dts."debateId"
    `;

    if (filters) {
      sqlStr += '\n' + 'where ' + this.getFiltersAsSQLString(filters);
    }

    const values = filters ? this.getFiltersValues(filters) : [];

    try {
      const res = await client.query(sqlStr, values);
      return res.rows;
    } catch (err) {
      console.error(err.message);
      throw new Error('An error occurred while fetching the debates.');
    }
  }

  private getFiltersAsSQLString (filters: Filters) {
    const queryStrFilter = filters.queryStr || null;
    const tagsFilter = filters.tags || null;

    const hasAll = queryStrFilter && tagsFilter;
    if (hasAll) {
      return `d.title = $1 and dt.id in ($2)`;
    }

    if (queryStrFilter) {
      return 'd.title::text ilike $1';
    }

    return 'dt.id in ($2)';
  }

  private getFiltersValues (filters: Filters) {
    const queryStrFilter = filters.queryStr ? `%${filters.queryStr}%` : null;
    const tagsFilter = filters.tags || null;

    const hasAll = queryStrFilter && tagsFilter;
    if (hasAll) {
      return [queryStrFilter, tagsFilter];
    }

    return [queryStrFilter || tagsFilter];
  }
}
