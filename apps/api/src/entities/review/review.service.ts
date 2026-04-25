import { Inject, Injectable } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { parse } from "cookie";
import * as cookieSignature from "cookie-signature";
import { ConfigService } from "@nestjs/config";
import { REDIS_STORE_TOKEN } from "src/redis/redis.module";
import { UserCookieData } from "../user/user.model";

const UNAUTHENTICATED_ERR = new WsException("Unauthenticated");

@Injectable()
export class ReviewService {
  constructor(
    private configService: ConfigService,
    @Inject(REDIS_STORE_TOKEN) private redisStore: any,
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
    const { sessionId: signedSessionId } = cookieValues;
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
      this.redisStore.get(sessionId, (err, sess) => {
        if (err || !sess.user) {
          rej(UNAUTHENTICATED_ERR);
          return;
        }
        res(sess.user);
      });
    });
  }
}
