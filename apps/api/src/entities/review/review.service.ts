import { Inject, Injectable } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { parse } from "cookie";
import * as cookieSignature from "cookie-signature";
import { ConfigService } from "@nestjs/config";
import { SESSION_STORE_TOKEN } from "src/redis/redis.module";
import { getSessionCookieName } from "src/middlewares/session.middleware";
import { UserCookieData } from "../user/user.model";

const UNAUTHENTICATED_ERR = new WsException("Unauthenticated");

@Injectable()
export class ReviewService {
  constructor(
    private configService: ConfigService,
    @Inject(SESSION_STORE_TOKEN) private sessionStore: any,
  ) {}

  getUserFromSocket(socket: Socket): Promise<UserCookieData> {
    const { cookie: cookieHeaderValue, connection } = socket.handshake.headers;
    if (connection === "close") {
      socket.disconnect(true);
      return;
    }
    if (!cookieHeaderValue) {
      throw UNAUTHENTICATED_ERR;
    }

    const cookieValues = parse(cookieHeaderValue);
    const signedSessionId =
      cookieValues[getSessionCookieName(this.configService)];
    if (!signedSessionId) {
      throw UNAUTHENTICATED_ERR;
    }

    const cookieSecret = this.configService.get("COOKIE_SECRET");
    const sessionId = cookieSignature.unsign(
      signedSessionId.slice(2),
      cookieSecret,
    );
    if (!sessionId) {
      throw UNAUTHENTICATED_ERR;
    }

    return new Promise((res, rej) => {
      this.sessionStore.get(sessionId, (err, sess) => {
        if (err || !sess.user) {
          rej(UNAUTHENTICATED_ERR);
          return;
        }
        res(sess.user);
      });
    });
  }
}
