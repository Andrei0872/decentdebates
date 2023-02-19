import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_PROVIDER_TOKEN } from 'src/db/db.module';
import { UserCookieData } from '../user/user.model';
import { Debate } from './debates.model';
import { CreateDebateDTO } from './dtos/create-debate.dto';

export interface Filters {
  queryStr: string;
  tags: string;
}

// This corresponds to the ENUM type.
const PENDING_BOARD_LIST = 'PENDING';

@Injectable()
export class DebatesService {
  constructor(@Inject(PG_PROVIDER_TOKEN) private pool: Pool) { }

  async getAll(filters?: Filters): Promise<Debate[]> {
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
      where t.board_list = 'ACCEPTED'
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
    } finally {
      client.release();
    }
  }

  async createDebate(user: UserCookieData, debateData: CreateDebateDTO) {
    const client = await this.pool.connect();

    const createTicketSqlStr = `
      insert into ticket
      values (default, $1, null, $2)
      returning id;
    `;
    const createTicketValues = [user.id, PENDING_BOARD_LIST];

    const createDebateSql = `
      insert into debate
      values (default, $1, $2, default, default)
      returning id;
    `;

    const assocDebateTagSql = `
      insert into assoc_debate_tag
      select * from unnest ($1::int[], $2::int[])
    `;
    const tagsIdsArr = debateData.tagsIds.split(',').map(tagIdStr => +tagIdStr);

    try {
      await client.query('BEGIN');

      const { rows: [{ id: ticketId }] } = await client.query(createTicketSqlStr, createTicketValues);

      const createDebateValues = [ticketId, debateData.title];
      const { rows: [{ id: debateId }] } = await client.query(createDebateSql, createDebateValues);
      
      const assocDebateTagValues = [
        tagsIdsArr.map(() => debateId),
        tagsIdsArr,
      ];
      await client.query(assocDebateTagSql, assocDebateTagValues);

      await client.query('COMMIT');
    } catch (err) {
      console.log(err.message);
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  private getFiltersAsSQLString(filters: Filters) {
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

  private getFiltersValues(filters: Filters) {
    const queryStrFilter = filters.queryStr ? `%${filters.queryStr}%` : null;
    const tagsFilter = filters.tags || null;

    const hasAll = queryStrFilter && tagsFilter;
    if (hasAll) {
      return [queryStrFilter, tagsFilter];
    }

    return [queryStrFilter || tagsFilter];
  }
}
