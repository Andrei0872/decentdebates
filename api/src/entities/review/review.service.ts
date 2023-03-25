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
import { ArgumentAsModerator } from './review.model';

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
}
