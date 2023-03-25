import { Inject, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { parse } from 'cookie'
import * as cookieSignature from 'cookie-signature'
import { ConfigService } from '@nestjs/config';
import { redisStore } from 'src/middlewares/session.middleware';
import { UserCookieData } from '../user/user.model';
import { Pool } from 'pg';
import { PG_PROVIDER_TOKEN } from 'src/db/db.module';
import { ArgumentAsModerator, DebateAsModerator } from './review.model';

const UNAUTHENTICATED_ERR = new WsException('Unauthenticated');

@Injectable()
export class ReviewService {
  constructor(
    private configService: ConfigService,
    @Inject(PG_PROVIDER_TOKEN) private pool: Pool
  ) { }

  getUserFromSocket(socket: Socket): Promise<UserCookieData> {
    const { cookie: cookieHeaderValue, connection } = socket.handshake.headers;
    if (connection === 'close') {
      socket.disconnect(true);
      return;
    }
    if (!cookieHeaderValue) {
      throw UNAUTHENTICATED_ERR;
    }

    const cookieValues = parse(cookieHeaderValue);
    const { sessionId: signedSessionId } = cookieValues;
    if (!signedSessionId) {
      throw UNAUTHENTICATED_ERR;
    }

    const cookieSecret = this.configService.get('COOKIE_SECRET');
    const sessionId = cookieSignature.unsign(signedSessionId.slice(2), cookieSecret);
    if (!sessionId) {
      throw UNAUTHENTICATED_ERR;
    }

    return new Promise((res, rej) => {
      redisStore.get(sessionId, (err, sess) => {
        if (err || !sess.user) {
          rej(UNAUTHENTICATED_ERR);
          return;
        }
        res(sess.user);
      })
    });
  }

  async getArgumentAsModerator(user: UserCookieData, ticketId: string): Promise<ArgumentAsModerator> {
    const sqlStr = `
      select
        t.id "ticketId",
        t.created_by "userId",
        a.debate_id "debateId",
        a.title "argumentTitle",
        a.content "argumentContent",
        a.counterargument_to "counterargumentToId",
        a.type "argumentType",
        d.title "debateTitle",
        t.board_list "boardList",
        aCounterarg.title "counterargumentToTitle"
      from ticket t
      join argument a
        on a.ticket_id = t.id
      join debate d
        on d.id = a.debate_id
      left join argument aCounterarg
        on aCounterarg.id = a.counterargument_to
      where t.id = $1 and a.is_draft = false and t.assigned_to = $2
    `;
    const values = [ticketId, user.id];

    const client = await this.pool.connect();
    try {
      const res = await client.query(sqlStr, values);
      return res.rows[0];
    } catch (err) {
      console.error(err.message);
      throw err;
    } finally {
      client.release();
    }
  }

  async getDebateAsModerator(user: UserCookieData, ticketId: string): Promise<DebateAsModerator> {
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
      where d.ticket_id = $1 and t.assigned_to = $2;
    `;
    const values = [ticketId, user.id];

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
}
