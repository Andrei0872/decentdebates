import { Inject, Injectable } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { parse } from "cookie";
import * as cookieSignature from "cookie-signature";
import { SESSION_STORE_TOKEN } from "src/redis/redis.module";
import { config } from "src/config";
import { UserCookieData } from "../user/user.model";

const UNAUTHENTICATED_ERR = new WsException("Unauthenticated");

@Injectable()
export class ReviewService {
  constructor(@Inject(SESSION_STORE_TOKEN) private sessionStore: any) {}

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
    const signedSessionId = cookieValues[config.SESSION_COOKIE_NAME];
    if (!signedSessionId) {
      throw UNAUTHENTICATED_ERR;
    }

    const sessionId = cookieSignature.unsign(
      signedSessionId.slice(2),
      config.COOKIE_SECRET,
    );
    if (!sessionId) {
      throw UNAUTHENTICATED_ERR;
    }

    return new Promise((res, rej) => {
      this.sessionStore.get(sessionId, (err, sess) => {
        if (err || !sess?.user) {
          rej(UNAUTHENTICATED_ERR);
          return;
        }
        res(sess.user);
      });
    });
  }
}
