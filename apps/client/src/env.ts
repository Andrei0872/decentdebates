import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  client: {
    NEXT_PUBLIC_API_SERVER_URL: z.url(),
    NEXT_PUBLIC_WEBSOCKET_SERVER_URL: z.url(),
  },
  // Next.js inlines `NEXT_PUBLIC_*` only where each is referenced by name.
  runtimeEnv: {
    NEXT_PUBLIC_API_SERVER_URL: process.env.NEXT_PUBLIC_API_SERVER_URL,
    NEXT_PUBLIC_WEBSOCKET_SERVER_URL:
      process.env.NEXT_PUBLIC_WEBSOCKET_SERVER_URL,
  },
  emptyStringAsUndefined: true,
});
