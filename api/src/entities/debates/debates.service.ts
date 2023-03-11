import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_PROVIDER_TOKEN } from 'src/db/db.module';
import { UserCookieData } from '../user/user.model';
import { CreateArgumentData, Debate, DebateArgument, GetDraftData, UpdateDraftData } from './debates.model';
import { CreateArgumentDTO } from './dtos/create-argument.dto';
import { CreateDebateDTO } from './dtos/create-debate.dto';

export interface Filters {
  queryStr: string;
  tags: string;
}

// This corresponds to the DB's ENUM type.
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

  async getDebateArguments(debateId: string): Promise<DebateArgument[]> {
    const sqlStr = `
      select
        a.debate_id "debateId",
        a.id "argumentId",
        d.title "debateTitle",
        a.ticket_id "ticketId",
        a.title,
        a.created_by "createdById",
        a.type "argumentType",
        a.created_at "createdAt",
        u.username,
        a.counterargument_to "counterargumentTo"
      from argument a
      join ticket t
        on a.ticket_id = t.id
      join debate d
        on a.debate_id = d.id
      join "user" u
        on a.created_by = u.id
      where debate_id = $1 and t.board_list = 'ACCEPTED'
      union all
      select
        $2 "debateId",
        null "argumentId",
        (select title from debate where id = $3) "debateTitle",
        null "ticketId",
        null "title",
        null "createdById",
        null "argumentType",
        null "createdAt",
        null "username",
        null "counterargumentTo"
    `;
    const values = [debateId, debateId, debateId];

    const client = await this.pool.connect();

    try {
      const res = await client.query(sqlStr, values);
      return res.rows;
    } catch (err) {
      console.error(err.message);
      throw new Error('An error occurred while fetching the debate\'s information.');
    } finally {
      client.release();
    }
  }

  async createArgument(argumentData: CreateArgumentData) {
    const client = await this.pool.connect();

    const createTicketSqlStr = `
      insert into ticket
      values (default, $1, null, $2)
      returning id;
    `;
    const createTicketValues = [argumentData.user.id, PENDING_BOARD_LIST];

    const createArgumentSql = `
      insert into argument
      values (default, $1, $2, $3, $4, $5, $6, default, $7)
      returning id;
    `;

    try {
      await client.query('BEGIN');

      const { rows: [{ id: ticketId }] } = await client.query(createTicketSqlStr, createTicketValues);

      const createArgumentValues = [
        argumentData.debateId,
        ticketId,
        argumentData.argumentDetails.title,
        argumentData.argumentDetails.content,
        argumentData.argumentDetails.counterargumentId,
        argumentData.user.id,
        argumentData.argumentDetails.argumentType
      ];
      const { rows: [{ id: argumentId }] } = await client.query(createArgumentSql, createArgumentValues);

      await client.query('COMMIT');
    } catch (err) {
      console.log(err.message);
      await client.query('ROLLBACK');
      throw new Error('An error occurred while adding the argument to the debate.');
    } finally {
      client.release();
    }
  }


  async getDebateArgument(debateId: string, argumentId: string): Promise<DebateArgument[]> {
    const sqlStr = `
      select
        a.debate_id "debateId",
        a.id "argumentId",
        d.title "debateTitle",
        a.ticket_id "ticketId",
        a.title,
        a.content,
        a.created_by "createdById",
        a.type "argumentType",
        a.created_at "createdAt",
        u.username,
        a.counterargument_to "counterargumentTo"
      from argument a
      join ticket t
        on a.ticket_id = t.id
      join debate d
        on a.debate_id = d.id
      join "user" u
        on a.created_by = u.id
      where debate_id = $1 and t.board_list = 'ACCEPTED' and a.id = $2
    `;
    const values = [debateId, argumentId];

    const client = await this.pool.connect();

    try {
      const res = await client.query(sqlStr, values);
      return res.rows;
    } catch (err) {
      console.error(err.message);
      throw new Error('An error occurred while fetching the debate\'s information.');
    } finally {
      client.release();
    }
  }

  async getDebateArgumentAsModerator(debateId: string, argumentId: string): Promise<DebateArgument[]> {
    const sqlStr = `
      select
        a.debate_id "debateId",
        a.id "argumentId",
        d.title "debateTitle",
        a.ticket_id "ticketId",
        a.title "ticketTitle",
        a.content,
        a.created_by "createdById",
        a.type "argumentType",
        a.created_at "createdAt",
        u.username,
        a.counterargument_to "counterargumentTo"
      from argument a
      join ticket t
        on a.ticket_id = t.id
      join debate d
        on a.debate_id = d.id
      join "user" u
        on a.created_by = u.id
      where debate_id = $1 and a.id = $2
    `;
    const values = [debateId, argumentId];

    const client = await this.pool.connect();

    try {
      const res = await client.query(sqlStr, values);
      return res.rows;
    } catch (err) {
      console.error(err.message);
      throw new Error('An error occurred while fetching the debate\'s information.');
    } finally {
      client.release();
    }
  }

  async saveArgumentAsDraft(argumentData: CreateArgumentData) {
    const sqlStr = `
      insert into argument
      values (default, $1, $2, $3, $4, $5, $6, default, $7, $8)
      returning id;
    `;

    const values = [
      argumentData.debateId,
      null, /* ticketId */
      argumentData.argumentDetails.title,
      argumentData.argumentDetails.content,
      argumentData.argumentDetails.counterargumentId,
      argumentData.user.id,
      argumentData.argumentDetails.argumentType,
      true, /* is_draft */
    ];

    const client = await this.pool.connect();

    try {
      await client.query(sqlStr, values);
    } catch (err) {
      console.error(err.message);
      throw new Error('An error occurred while saving the argument as draft.');
    } finally {
      client.release();
    }
  }

  async getDraft(draftData: GetDraftData): Promise<DebateArgument> {
    const sqlStr = `
      select
        a.debate_id "debateId",
        a.id "argumentId",
        d.title "debateTitle",
        a.ticket_id "ticketId",
        a.title,
        a.content,
        a.created_by "createdById",
        a.type "argumentType",
        a.created_at "createdAt",
        u.username,
        a.counterargument_to "counterargumentTo"
      from argument a
      join debate d
        on a.debate_id = d.id
      join "user" u
        on a.created_by = u.id
      where debate_id = $1 and a.id = $2 and a.created_by = $3
    `;
    const values = [
      draftData.debateId,
      draftData.argumentId,
      draftData.user.id,
    ];

    const client = await this.pool.connect();

    try {
      const res = await client.query(sqlStr, values);

      return res.rows[0];
    } catch (err) {
      console.error(err.message);
      throw new Error('An error occurred while saving the argument as draft.');
    } finally {
      client.release();
    }
  }

  async updateDraft(draftInfo: UpdateDraftData) {
    const { draftData } = draftInfo;
    const sqlStr = `
      update argument
      set
        title = $1,
        content = $2,
        counterargument_to = $3,
        type = $4
      where debate_id = $5 and created_by = $6 and id = $7 and is_draft = true
    `;
    const values = [
      draftData.title,
      draftData.content,
      draftData.counterargumentId,
      draftData.argumentType,
      draftInfo.debateId,
      draftInfo.user.id,
      draftInfo.draftId,
    ];

    const client = await this.pool.connect();

    try {
      const res = await client.query(sqlStr, values);
      if (!res.rowCount) {
        throw new Error('An error occurred while updating the draft.');
      }

    } catch (err) {
      console.error(err.message);
      throw new Error('An error occurred while updating the draft.');
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
