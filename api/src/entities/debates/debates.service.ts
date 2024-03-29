import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Pool } from 'pg';
import { PG_PROVIDER_TOKEN } from 'src/db/db.module';
import { DebateAsModerator } from '../review/review.model';
import { UserCookieData } from '../user/user.model';
import { ArgumentTicketCreated, DebateTicketCreated } from './debate.events';
import { CreateArgumentData, Debate, DebateArgument, GetDraftData, SubmitDraftData, UpdateArgumentData, UpdateDebateData, UpdateDraftData } from './debates.model';
import { CreateDebateDTO } from './dtos/create-debate.dto';

export enum TagsMatchingStrategy {
  ALL,
  ANY
};

export interface RawFilters {
  queryStr?: string;
  tags?: string;
  tags_match?: string;
}

export interface Filters {
  queryStr?: string;
  tags?: {
    values?: string;
    matchingStrategy?: TagsMatchingStrategy;
  };
}

// This corresponds to the DB's ENUM type.
const PENDING_BOARD_LIST = 'PENDING';

@Injectable()
export class DebatesService {
  constructor(
    @Inject(PG_PROVIDER_TOKEN) private pool: Pool,
    private eventEmitter: EventEmitter2,
  ) { }

  async getAll(filters?: Filters): Promise<Debate[]> {
    const client = await this.pool.connect();
    let sqlStr = `
      with debates_tags as (
        select
          d.id "debateId",
          string_agg(dt.name, ',') "tags",
          string_agg(dt.id::text, ',') "tagsIds"
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
        dts."tags",
        dts."tagsIds"
      from debate d
      join ticket t
        on d.ticket_id = t.id
      join "user" u
        on u.id = t.created_by
      join debates_tags dts
        on d.id = dts."debateId"
      where t.board_list = 'ACCEPTED'
    `;

    const values = [];

    if (filters) {
      const { sql, values: paramsValues } = this.applyDebateFilters(filters);
      sqlStr += ` and ${sql}`;
      values.push(...paramsValues);
    }

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
      values (default, $1, $2, default, default, $3)
      returning id;
    `;

    const assocDebateTagSql = `
      insert into assoc_debate_tag
      select * from unnest ($1::int[], $2::int[])
    `;
    const tagsIdsArr = debateData.tagsIds;

    try {
      await client.query('BEGIN');

      const hasCreatedTags = !!debateData.createdTags;
      if (hasCreatedTags) {
        /*
        Ensuring no duplicate tags are inserted.
        Some ideas were taken from here: https://github.com/brianc/node-postgres/issues/1644#issuecomment-387961410.
        */
        const insertTagsSql = `
          insert into debate_tag(name)
          select new_tags.name from unnest($1::text[]) as new_tags (name)
          left join debate_tag dt
            on lower(dt.name) = lower(trim(both new_tags.name))
          where dt.name is null
          returning id
        `;
        const values = [debateData.createdTags];

        const res = await client.query(insertTagsSql, values);
        tagsIdsArr.push(...res.rows.map(r => r.id));
      }

      const { rows: [{ id: ticketId }] } = await client.query(createTicketSqlStr, createTicketValues);

      const createDebateValues = [ticketId, debateData.title, user.id];
      const { rows: [{ id: debateId }] } = await client.query(createDebateSql, createDebateValues);

      const assocDebateTagValues = [
        tagsIdsArr.map(() => debateId),
        tagsIdsArr,
      ];
      await client.query(assocDebateTagSql, assocDebateTagValues);

      await client.query('COMMIT');

      this.eventEmitter.emitAsync(
        DebateTicketCreated.EVENT_NAME,
        new DebateTicketCreated(ticketId, debateData.title),
      );
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

      this.eventEmitter.emitAsync(
        ArgumentTicketCreated.EVENT_NAME,
        new ArgumentTicketCreated(ticketId, argumentData.argumentDetails.title),
      );
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

  async submitDraft(draftInfo: SubmitDraftData) {
    const { draftData } = draftInfo;

    const createTicketSqlStr = `
      insert into ticket
      values (default, $1, null, $2)
      returning id;
    `;
    const createTicketValues = [draftInfo.user.id, PENDING_BOARD_LIST];

    const updateArgumentSql = `
      update argument
      set
        is_draft = false,
        title = $1,
        content = $2,
        counterargument_to = $3,
        type = $4,
        ticket_id = $5
      where id = $6 and debate_id = $7 and created_by = $8
    `;

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const { rows: [{ id: ticketId }] } = await client.query(createTicketSqlStr, createTicketValues);

      const updateArgumentValues = [
        draftData.title,
        draftData.content,
        draftData.counterargumentId,
        draftData.argumentType,
        ticketId,
        draftInfo.draftId,
        draftInfo.debateId,
        draftInfo.user.id,
      ];
      client.query(updateArgumentSql, updateArgumentValues),

        await client.query('COMMIT');
    } catch (err) {
      console.log(err.message);
      await client.query('ROLLBACK');
      throw new Error('An error occurred while submitting the draft.');
    } finally {
      client.release();
    }
  }

  async getDebateByTicketId(ticketId: string): Promise<DebateAsModerator> {
    const sqlStr = `
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
        d.ticket_id "ticketId",
        d.created_at "createdAt",
        d.modified_at "modifiedAt",
        u.username,
        u.id "userId",
        dt.tags "debateTags",
        t.board_list "boardList",
        t.id "ticketId"
      from debate d
      join "user" u
        on u.id = d.created_by
      join debates_tags dt
        on dt."debateId" = d.id
      join ticket t
        on d.ticket_id = t.id
      where d.ticket_id = $1;
    `;
    const values = [ticketId];

    const client = await this.pool.connect();
    try {
      const res = await client.query(sqlStr, values);

      return res.rows[0];
    } catch (err) {
      console.log(err.message);
      throw new Error('An error occurred while fetching the debate metadata.');
    } finally {
      client.release();
    }
  }

  async updateArgument(data: UpdateArgumentData) {
    const sqlStr = `
      update argument a
      set
        title = $1,
        content = $2
      from ticket t
      where a.id = $3 and a.created_by = $4 and t.board_list != 'ACCEPTED' and a.ticket_id = t.id;
    `;
    const values = [
      data.argumentData.title,
      data.argumentData.content,
      data.argumentId,
      data.user.id
    ];

    const client = await this.pool.connect();
    try {
      const res = await client.query(sqlStr, values);
      return res;
    } catch (err) {
      console.log(err.message);
      throw new Error('An error occurred while updating the argument.');
    } finally {
      client.release();
    }
  }

  async updateDebate(data: UpdateDebateData) {
    const sqlStr = `
      update debate d
      set
        title = $1
      from ticket t
      where d.id = $2 and d.created_by = $3 and t.id = d.ticket_id and t.board_list != 'ACCEPTED';
    `;
    const values = [
      data.title,
      data.debateId,
      data.user.id
    ];

    const client = await this.pool.connect();
    try {
      const res = await client.query(sqlStr, values);
      return res;
    } catch (err) {
      console.log(err.message);
      throw new Error('An error occurred while updating the debate.');
    } finally {
      client.release();
    }
  }

  private applyDebateFilters(filters: Filters) {
    const queryStrFilter = filters.queryStr ? `%${filters.queryStr}%` : null;
    const tagsFilter = filters.tags || null;

    const hasAll = queryStrFilter && tagsFilter;
    if (hasAll) {
      return {
        sql: `d.title::text ilike $1 and ${this.getTagFiltersSql(tagsFilter, 2)}`,
        values: [queryStrFilter, filters.tags.values, ...tagsFilter.matchingStrategy === TagsMatchingStrategy.ALL ? [filters.tags.values] : []],
      }
    }

    if (queryStrFilter) {
      return {
        sql: `d.title::text ilike $1`,
        values: [queryStrFilter],
      }
    }

    return {
      sql: `${this.getTagFiltersSql(tagsFilter, 1)}`,
      values: [filters.tags.values, ...tagsFilter.matchingStrategy === TagsMatchingStrategy.ALL ? [filters.tags.values] : []],
    }
  }

  // Ideas came from here: https://www.postgresql.org/docs/current/functions-array.html.
  private getTagFiltersSql(tags: Filters['tags'], parameterizedIdx: number) {
    if (tags.matchingStrategy === TagsMatchingStrategy.ANY) {
      return `string_to_array(dts."tagsIds", ',') && string_to_array($${parameterizedIdx++}, ',')`;
    }

    // Basically checking if the 2 sets of tags are equal.
    return `
      string_to_array(dts."tagsIds", ',') @> string_to_array($${parameterizedIdx++}, ',')
        and string_to_array(dts."tagsIds", ',') <@ string_to_array($${parameterizedIdx++}, ',')
    `;
  }
}
